import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { verificarYEmitir } from '@/app/api/certificados/route';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';

/**
 * GET /api/intentos/:intentoId  – Instructor/Admin ve el intento completo con respuestas
 */
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

    const { intentoId } = await params;

    const intento = await prisma.intentoExamen.findUnique({
      where: { id: intentoId },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        evaluacion: {
          include: {
            preguntas: { orderBy: { orden: 'asc' }, include: { opciones: true } },
          },
        },
        respuestasAprendiz: {
          include: {
            pregunta: true,
            opcion: true,
          },
        },
      },
    });

    if (!intento) return NextResponse.json({ message: 'Intento no encontrado' }, { status: 404 });

    // Estudiante solo puede ver el suyo
    if (payload.rol === 'estudiante' && intento.usuarioId !== payload.id) {
      return NextResponse.json({ message: 'Sin permiso' }, { status: 403 });
    }

    return NextResponse.json(intento);
  } catch (error) {
    console.error('GET /api/intentos/[intentoId]', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

/**
 * PATCH /api/intentos/:intentoId
 * Instructor/Admin califica manualmente las preguntas de tipo 'desarrollo'.
 * Body: { calificaciones: [{ respuestaId, calificacion, feedbackInstructor? }] }
 */
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

    const { intentoId } = await params;
    const body = await request.json();
    const { calificaciones = [] } = body; // [{ respuestaId, calificacion, feedbackInstructor }]

    const resultado = await prisma.$transaction(async (tx) => {
      for (const c of calificaciones) {
        await tx.respuestaAprendiz.update({
          where: { id: c.respuestaId },
          data: {
            calificacion: c.calificacion,
            pendienteRevision: false,
            feedbackInstructor: c.feedbackInstructor ?? null,
          },
        });
      }

      // Recalcular puntaje total del intento
      const respuestas = await tx.respuestaAprendiz.findMany({
        where: { intentoId },
        include: { pregunta: true },
      });

      const puntajeMaximo = respuestas.reduce((a, r) => a + r.pregunta.puntos, 0);
      const puntajeObtenido = respuestas.reduce((a, r) => a + (Number(r.calificacion) || 0), 0);
      const porcentaje =
        puntajeMaximo > 0 ? Math.round((puntajeObtenido / puntajeMaximo) * 100) : 0;
      const aunPendientes = respuestas.some((r) => r.pendienteRevision);

      const intentoActualizado = await tx.intentoExamen.update({
        where: { id: intentoId },
        data: {
          puntaje: porcentaje,
          estado: aunPendientes ? 'finalizado' : 'calificado',
        },
        include: {
          usuario: { select: { nombre: true, email: true } },
          evaluacion: { include: { modulo: true } },
        },
      });

      return intentoActualizado;
    });

    if (resultado.estado === 'calificado') {
      const cursoId = resultado.evaluacion.cursoId || resultado.evaluacion.modulo?.cursoId;
      if (cursoId) {
        // Si el examen es final (moduloId es null), y aprobó, y progreso es 100%, actualizar la inscripción a finalizado
        if (!resultado.evaluacion.moduloId) {
          const ev = resultado.evaluacion;
          const aprobado = Number(resultado.puntaje) >= ev.puntajeMinimo;
          if (aprobado) {
            const inscripcion = await prisma.inscripcion.findFirst({
              where: { usuarioId: resultado.usuarioId, cursoId, estado: { not: 'retirado' } },
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
                    usuarioId: resultado.usuarioId,
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

        await verificarYEmitir(resultado.usuarioId, cursoId).catch(() => null);
      }

      // Notificar al estudiante que su evaluación ha sido calificada
      try {
        await enviarNotificacionConfigurada({
          usuarioId: resultado.usuarioId,
          tipo: 'evaluacion',
          titulo: `Evaluación calificada: ${resultado.evaluacion.titulo} ✅`,
          contenido: `Tu instructor ha terminado de calificar tu intento en la evaluación "${resultado.evaluacion.titulo}". Tu puntaje final es de ${resultado.puntaje}%.`,
          urlDestino: `/cursos/${cursoId || ''}`,
        });
      } catch (notifErr) {
        console.error('[Error al enviar notificación de evaluación calificada]', notifErr);
      }
    }

    return NextResponse.json({ message: 'Calificación manual guardada exitosamente' });
  } catch (error) {
    console.error('PATCH /api/intentos/[intentoId]', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
