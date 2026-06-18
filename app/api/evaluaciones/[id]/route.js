import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/** GET /api/evaluaciones/:id  – devuelve evaluación con preguntas (sin respuestas correctas para alumnos) */
export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;

    const evaluacion = await prisma.evaluacion.findUnique({
      where: { id },
      include: {
        creador: { select: { id: true, nombre: true } },
        curso: { select: { id: true, titulo: true } },
        modulo: { select: { id: true, titulo: true } },
        preguntas: {
          orderBy: { orden: 'asc' },
          include: {
            opciones: {
              select: {
                id: true,
                textoOpcion: true,
                // solo instructores/admin ven esCorrecta
                esCorrecta: payload.rol !== 'estudiante',
              },
            },
          },
        },
      },
    });

    if (!evaluacion)
      return NextResponse.json({ message: 'Evaluación no encontrada' }, { status: 404 });

    // Ocultar respuestas correctas a los estudiantes
    if (payload.rol === 'estudiante') {
      evaluacion.preguntas = evaluacion.preguntas.map((p) => ({
        ...p,
        respuestaCorrecta: undefined,
        patronRegex: undefined,
        opciones: p.opciones.map((o) => ({ id: o.id, textoOpcion: o.textoOpcion })),
      }));
    }

    return NextResponse.json(evaluacion);
  } catch (error) {
    console.error('GET /api/evaluaciones/[id]', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

/** DELETE /api/evaluaciones/:id */
export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    const ev = await prisma.evaluacion.findUnique({ where: { id } });
    if (!ev) return NextResponse.json({ message: 'No encontrada' }, { status: 404 });

    if (payload.rol !== 'admin' && ev.creadorId !== payload.id) {
      return NextResponse.json({ message: 'Sin permiso' }, { status: 403 });
    }

    await prisma.evaluacion.delete({ where: { id } });
    return NextResponse.json({ message: 'Eliminada' });
  } catch (error) {
    console.error('DELETE /api/evaluaciones/[id]', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
/** PATCH /api/evaluaciones/:id – Actualiza datos generales y preguntas */
export async function PATCH(request, { params }) {
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

    const { id } = await params;
    const ev = await prisma.evaluacion.findUnique({ where: { id } });
    if (!ev) return NextResponse.json({ message: 'No encontrada' }, { status: 404 });

    if (payload.rol !== 'admin' && ev.creadorId !== payload.id) {
      return NextResponse.json({ message: 'Sin permiso' }, { status: 403 });
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

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos generales
      await tx.evaluacion.update({
        where: { id },
        data: {
          titulo,
          descripcion: descripcion ?? null,
          cursoId: cursoId ?? null,
          moduloId: moduloId ?? null,
          puntajeMinimo: puntajeMinimo != null ? Number(puntajeMinimo) : 70,
          duracionMinutos: duracionMinutos != null ? Number(duracionMinutos) : null,
          intentosMaximos: intentosMaximos != null ? Number(intentosMaximos) : 1,
          ordenAleatorio: ordenAleatorio ?? false,
          mostrarRespuestas: mostrarRespuestas ?? false,
        },
      });

      // 2. Borrar preguntas + opciones anteriores (CASCADE borra las opciones)
      await tx.pregunta.deleteMany({ where: { evaluacionId: id } });

      // 3. Recrear preguntas con sus opciones (si las hay)
      for (let i = 0; i < (preguntas || []).length; i++) {
        const p = preguntas[i];
        const pregunta = await tx.pregunta.create({
          data: {
            evaluacionId: id,
            pregunta: p.pregunta,
            tipo: p.tipo,
            puntos: Number(p.puntos) || 1,
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
    });

    return NextResponse.json({ message: 'Evaluación actualizada exitosamente' });
  } catch (error) {
    console.error('PATCH /api/evaluaciones/[id]', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

/** PUT /api/evaluaciones/:id – alias de PATCH para compatibilidad */
export async function PUT(request, context) {
  return PATCH(request, context);
}
