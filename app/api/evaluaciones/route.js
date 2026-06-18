import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';

/** GET /api/evaluaciones?cursoId=xxx  OR  ?moduloId=xxx */
export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursoId = searchParams.get('cursoId');
    const moduloId = searchParams.get('moduloId');
    const pendientes = searchParams.get('pendientes');

    const where = {};
    if (cursoId) where.cursoId = cursoId;
    if (moduloId) where.moduloId = moduloId;

    // Instructores solo ven las de sus cursos
    if (payload.rol === 'instructor') {
      where.creadorId = payload.id;
    }

    // Estudiantes solo ven evaluaciones de sus cursos inscritos activos
    if (payload.rol === 'estudiante') {
      const inscripcionesActivas = await prisma.inscripcion.findMany({
        where: {
          usuarioId: payload.id,
          estado: 'activo',
        },
        select: { cursoId: true },
      });
      const cursoIds = inscripcionesActivas.map((i) => i.cursoId);
      where.cursoId = { in: cursoIds };
    }

    const evaluaciones = await prisma.evaluacion.findMany({
      where,
      include: {
        creador: { select: { id: true, nombre: true } },
        curso: { select: { id: true, titulo: true } },
        modulo: { select: { id: true, titulo: true } },
        preguntas: {
          orderBy: { orden: 'asc' },
          include: { opciones: true },
        },
        _count: { select: { preguntas: true, intentos: true } },
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    let resultEvaluaciones = evaluaciones;

    // Si pide pendientes y es estudiante, remover las que ya aprobó
    if (payload.rol === 'estudiante' && pendientes === 'true') {
      const intentosEstudiante = await prisma.intentoExamen.findMany({
        where: {
          usuarioId: payload.id,
          puntaje: { not: null },
        },
        select: { evaluacionId: true, puntaje: true },
      });

      const aprobadasIds = new Set();
      for (const intento of intentosEstudiante) {
        const ev = evaluaciones.find((e) => e.id === intento.evaluacionId);
        if (ev && Number(intento.puntaje) >= ev.puntajeMinimo) {
          aprobadasIds.add(intento.evaluacionId);
        }
      }

      resultEvaluaciones = evaluaciones.filter((e) => !aprobadasIds.has(e.id));
    }

    return NextResponse.json(resultEvaluaciones);
  } catch (error) {
    console.error('GET /api/evaluaciones', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

/** POST /api/evaluaciones  – Instructor / Admin crea una evaluación con sus preguntas */
export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const {
      titulo,
      descripcion,
      cursoId,
      moduloId,
      puntajeMinimo,
      duracionMinutos,
      intentosMaximos,
      ordenAleatorio,
      mostrarRespuestas,
      preguntas,
    } = body;

    if (!titulo) return NextResponse.json({ message: 'El título es obligatorio' }, { status: 400 });
    if (!cursoId && !moduloId)
      return NextResponse.json({ message: 'Debe asociarse a un curso o módulo' }, { status: 400 });

    // Crear evaluación + preguntas en una transacción
    const evaluacion = await prisma.$transaction(async (tx) => {
      const ev = await tx.evaluacion.create({
        data: {
          titulo,
          descripcion,
          cursoId: cursoId || null,
          moduloId: moduloId || null,
          creadorId: payload.id,
          puntajeMinimo: puntajeMinimo ?? 70,
          duracionMinutos: duracionMinutos ?? null,
          intentosMaximos: intentosMaximos ?? 1,
          ordenAleatorio: ordenAleatorio ?? false,
          mostrarRespuestas: mostrarRespuestas ?? false,
        },
      });

      for (let i = 0; i < (preguntas || []).length; i++) {
        const p = preguntas[i];
        const pregunta = await tx.pregunta.create({
          data: {
            evaluacionId: ev.id,
            pregunta: p.pregunta,
            tipo: p.tipo,
            puntos: p.puntos ?? 1,
            orden: i + 1,
            respuestaCorrecta: p.respuestaCorrecta ?? null,
            patronRegex: p.patronRegex ?? null,
          },
        });

        if (p.opciones?.length) {
          await tx.opcion.createMany({
            data: p.opciones.map((o) => ({
              preguntaId: pregunta.id,
              textoOpcion: o.textoOpcion,
              esCorrecta: o.esCorrecta ?? false,
            })),
          });
        }
      }

      return ev;
    });

    // Enviar notificaciones a todos los alumnos inscritos activos del curso
    try {
      let finalCursoId = cursoId;
      if (!finalCursoId && moduloId) {
        const mod = await prisma.modulo.findUnique({
          where: { id: moduloId },
          select: { cursoId: true },
        });
        if (mod) finalCursoId = mod.cursoId;
      }

      if (finalCursoId) {
        const inscripciones = await prisma.inscripcion.findMany({
          where: { cursoId: finalCursoId, estado: 'activo' },
          select: { usuarioId: true },
        });

        const cursoObj = await prisma.curso.findUnique({
          where: { id: finalCursoId },
          select: { titulo: true },
        });

        if (cursoObj && inscripciones.length > 0) {
          // Disparar las notificaciones
          Promise.all(
            inscripciones.map(async (ins) => {
              try {
                await enviarNotificacionConfigurada({
                  usuarioId: ins.usuarioId,
                  tipo: 'evaluacion',
                  titulo: `Nueva evaluación disponible: ${titulo} 📝`,
                  contenido: `Se ha publicado una nueva evaluación "${titulo}" en el curso "${cursoObj.titulo}". ¡No olvides completarla a tiempo!`,
                  urlDestino: `/cursos/${finalCursoId}`,
                });
              } catch (e) {
                console.error('[Error al notificar evaluación individual]', e);
              }
            })
          ).catch((e) => console.error('[Error en Promise.all evaluacion]', e));
        }
      }
    } catch (notifErr) {
      console.error('[Error al procesar notificaciones de evaluación]', notifErr);
    }

    return NextResponse.json({ message: 'Evaluación creada', evaluacion }, { status: 201 });
  } catch (error) {
    console.error('POST /api/evaluaciones', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
