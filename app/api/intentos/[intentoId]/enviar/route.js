import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { verificarYEmitir } from '@/app/api/certificados/route';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';

/**
 * POST /api/intentos/:intentoId/enviar
 * El estudiante envía sus respuestas. Las preguntas auto-calificables se califican inmediatamente.
 * Las de tipo 'desarrollo' quedan pendienteRevision = true.
 */
export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { intentoId } = await params;
    const intento = await prisma.intentoExamen.findUnique({
      where: { id: intentoId },
      include: {
        usuario: { select: { nombre: true, email: true } },
        evaluacion: {
          include: {
            preguntas: {
              orderBy: { orden: 'asc' },
              include: { opciones: true },
            },
            modulo: true,
          },
        },
      },
    });

    if (!intento) return NextResponse.json({ message: 'Intento no encontrado' }, { status: 404 });
    if (intento.usuarioId !== payload.id)
      return NextResponse.json({ message: 'Sin permiso' }, { status: 403 });
    if (intento.estado !== 'en_curso')
      return NextResponse.json({ message: 'Este intento ya fue finalizado' }, { status: 400 });

    const body = await request.json();
    // body.respuestas = [{ preguntaId, opcionId?, textoRespuesta? }]
    const { respuestas = [] } = body;

    let puntajeTotal = 0;
    let puntajeMaximo = 0;
    let tienePendientes = false;

    const respuestasData = [];

    for (const pregunta of intento.evaluacion.preguntas) {
      puntajeMaximo += pregunta.puntos;
      const respuestaAlumno = respuestas.find((r) => r.preguntaId === pregunta.id) || {};

      let calificacion = null;
      let pendienteRevision = false;
      let opcionId = respuestaAlumno.opcionId || null;
      let textoRespuesta = respuestaAlumno.textoRespuesta || null;

      if (pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'verdadero_falso') {
        if (opcionId) {
          const opcionSeleccionada = pregunta.opciones.find((o) => o.id === opcionId);
          calificacion = opcionSeleccionada?.esCorrecta ? pregunta.puntos : 0;
          puntajeTotal += calificacion;
        } else {
          calificacion = 0;
        }
      } else if (pregunta.tipo === 'respuesta_corta') {
        if (textoRespuesta) {
          let correcto = false;
          if (pregunta.patronRegex) {
            try {
              const regex = new RegExp(pregunta.patronRegex, 'i');
              correcto = regex.test(textoRespuesta.trim());
            } catch {
              // regex inválido: fallback a coincidencia exacta
              correcto =
                textoRespuesta.trim().toLowerCase() ===
                (pregunta.respuestaCorrecta || '').trim().toLowerCase();
            }
          } else if (pregunta.respuestaCorrecta) {
            correcto =
              textoRespuesta.trim().toLowerCase() ===
              pregunta.respuestaCorrecta.trim().toLowerCase();
          }
          calificacion = correcto ? pregunta.puntos : 0;
          puntajeTotal += calificacion;
        } else {
          calificacion = 0;
        }
      } else if (pregunta.tipo === 'desarrollo') {
        pendienteRevision = true;
        tienePendientes = true;
        calificacion = null; // se calificará manualmente
      }

      respuestasData.push({
        intentoId,
        preguntaId: pregunta.id,
        opcionId,
        textoRespuesta,
        calificacion: calificacion !== null ? calificacion : undefined,
        pendienteRevision,
      });
    }

    // Calcular puntaje automático como porcentaje (ignorando pendientes)
    const puntajeMaximoAuto = intento.evaluacion.preguntas
      .filter((p) => p.tipo !== 'desarrollo')
      .reduce((acc, p) => acc + p.puntos, 0);

    const puntajeAuto = puntajeTotal;
    const porcentajeAuto =
      puntajeMaximoAuto > 0 ? Math.round((puntajeAuto / puntajeMaximoAuto) * 100) : 0;

    // Si no hay pendientes, el estado es 'finalizado'; si hay, es 'calificado' provisional + pendientes
    const estadoFinal = tienePendientes ? 'finalizado' : 'calificado';

    await prisma.$transaction(async (tx) => {
      // Guardar respuestas
      await tx.respuestaAprendiz.createMany({ data: respuestasData });

      // Actualizar intento
      await tx.intentoExamen.update({
        where: { id: intentoId },
        data: {
          estado: estadoFinal,
          puntaje: porcentajeAuto,
          fechaFin: new Date(),
        },
      });

      // Actualizar ultimoAcceso en la inscripcion del alumno
      const cursoId = intento.evaluacion.cursoId || intento.evaluacion.modulo?.cursoId;
      if (cursoId) {
        await tx.inscripcion
          .updateMany({
            where: { usuarioId: payload.id, cursoId },
            data: { ultimoAcceso: new Date() },
          })
          .catch(() => {});
      }
    });

    const cursoId = intento.evaluacion.cursoId || intento.evaluacion.modulo?.cursoId;
    if (cursoId && estadoFinal === 'calificado') {
      // Si el examen es final (moduloId es null), y aprobó, y progreso es 100%, actualizar la inscripción a finalizado
      if (!intento.evaluacion.moduloId) {
        const ev = intento.evaluacion;
        const aprobado = porcentajeAuto >= ev.puntajeMinimo;
        if (aprobado) {
          const inscripcion = await prisma.inscripcion.findFirst({
            where: { usuarioId: payload.id, cursoId, estado: { not: 'retirado' } },
          });
          if (inscripcion && Number(inscripcion.progreso) >= 100) {
            const evaluacionesFinales = await prisma.evaluacion.findMany({
              where: { cursoId, moduloId: null },
              select: { id: true, puntajeMinimo: true },
            });
            let todasAprobadas = true;
            for (const evFinal of evaluacionesFinales) {
              if (evFinal.id === ev.id) continue;
              const mejorIntento = await prisma.intentoExamen.findFirst({
                where: {
                  usuarioId: payload.id,
                  evaluacionId: evFinal.id,
                  estado: 'calificado',
                  puntaje: { gte: evFinal.puntajeMinimo },
                },
              });
              if (!mejorIntento) {
                todasAprobadas = false;
                break;
              }
            }
            if (todasAprobadas) {
              await prisma.inscripcion.update({
                where: { id: inscripcion.id },
                data: { estado: 'finalizado' },
              });
            }
          }
        }
      }

      await verificarYEmitir(payload.id, cursoId).catch(() => null);
    }

    // --- ENVIAR NOTIFICACIONES ---
    try {
      let cursoObj = null;
      if (cursoId) {
        cursoObj = await prisma.curso.findUnique({
          where: { id: cursoId },
          select: { titulo: true, instructorId: true },
        });
      }

      // 1. Notificar al Alumno
      const pendingText = tienePendientes
        ? 'Esta evaluación incluye preguntas de desarrollo que serán revisadas por tu instructor.'
        : 'Tu calificación ha sido procesada de inmediato.';

      await enviarNotificacionConfigurada({
        usuarioId: payload.id,
        tipo: 'evaluacion',
        titulo: `Evaluación entregada: ${intento.evaluacion.titulo} 📝`,
        contenido: `Has entregado correctamente tu intento de examen. Puntaje preliminar: ${porcentajeAuto}%. ${pendingText}`,
        urlDestino: `/cursos/${cursoId || ''}`,
      });

      // 2. Notificar al Instructor
      if (cursoObj && cursoObj.instructorId) {
        const instPendingText = tienePendientes
          ? 'y requiere tu calificación manual para las preguntas de desarrollo.'
          : 'y ha sido calificada automáticamente.';

        await enviarNotificacionConfigurada({
          usuarioId: cursoObj.instructorId,
          tipo: 'evaluacion',
          titulo: `Nueva evaluación entregada: ${intento.evaluacion.titulo} 🎓`,
          contenido: `El estudiante ${intento.usuario?.nombre || 'Un alumno'} ha completado la evaluación "${intento.evaluacion.titulo}" en tu curso "${cursoObj.titulo}" ${instPendingText}`,
          urlDestino: `/dashboard/cursos/gestion`,
        });
      }
    } catch (notifErr) {
      console.error('[Error al enviar notificaciones de intento de examen]', notifErr);
    }

    return NextResponse.json({
      message: 'Evaluación enviada correctamente',
      puntaje: porcentajeAuto,
      puntajeMaximo,
      puntajeObtenido: puntajeAuto,
      aprobado: porcentajeAuto >= intento.evaluacion.puntajeMinimo,
      tienePendientes,
      estado: estadoFinal,
    });
  } catch (error) {
    console.error('POST /api/intentos/[intentoId]/enviar', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
