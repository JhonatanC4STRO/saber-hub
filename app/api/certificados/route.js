import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import crypto from 'crypto';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';
import { triggerWebhook } from '@/lib/webhooks';

/** Evalúa si el alumno cumple los criterios del curso y emite certificado si aplica */
export async function verificarYEmitir(usuarioId, cursoId) {
  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    select: {
      id: true,
      titulo: true,
      otorgaCertificado: true,
      criterioLeccionesMin: true,
      criterioEvalAprobadas: true,
      criterioNotaGlobal: true,
      instructor: { select: { nombre: true } },
      inscripciones: {
        where: { usuarioId },
        select: { id: true, progreso: true, certificacion: true },
      },
    },
  });

  if (!curso || !curso.otorgaCertificado) return null;
  const inscripcion = curso.inscripciones[0];
  if (!inscripcion || inscripcion.certificacion) return null; // Ya existe o no inscrito

  // --- Criterio 1: % de lecciones (Exigir obligatoriamente el 100% de progreso) ---
  if (Number(inscripcion.progreso) < 100) return null;

  // --- Criterio 2: evaluaciones aprobadas ---
  // A. Siempre exigir la aprobación de todas las evaluaciones finales (curso-level, moduloId: null) si existen
  const evFinales = await prisma.evaluacion.findMany({
    where: { cursoId, moduloId: null },
    select: { id: true, puntajeMinimo: true },
  });
  for (const ev of evFinales) {
    const mejorIntento = await prisma.intentoExamen.findFirst({
      where: {
        usuarioId,
        evaluacionId: ev.id,
        estado: 'calificado',
        puntaje: { gte: ev.puntajeMinimo },
      },
    });
    if (!mejorIntento) return null; // No aprobó alguna evaluación final del curso
  }

  // B. Si criterioEvalAprobadas está activo, exigir la aprobación de las demás evaluaciones (módulo-level)
  if (curso.criterioEvalAprobadas) {
    const evModulos = await prisma.evaluacion.findMany({
      where: { cursoId, moduloId: { not: null } },
      select: { id: true, puntajeMinimo: true },
    });
    for (const ev of evModulos) {
      const mejorIntento = await prisma.intentoExamen.findFirst({
        where: {
          usuarioId,
          evaluacionId: ev.id,
          estado: 'calificado',
          puntaje: { gte: ev.puntajeMinimo },
        },
      });
      if (!mejorIntento) return null; // No aprobó alguna evaluación de módulo
    }
  }

  // ✅ Cumple todos los criterios → emitir certificado
  const codigoUnico = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
  const hashVerificacion = crypto
    .createHash('sha256')
    .update(`${inscripcion.id}-${codigoUnico}`)
    .digest('hex');

  const certificado = await prisma.certificacion.create({
    data: {
      inscripcionId: inscripcion.id,
      codigoUnico,
      hashVerificacion,
      urlPdf: `/api/certificados/pdf/${codigoUnico}`,
    },
    include: {
      inscripcion: {
        include: {
          usuario: { select: { nombre: true, email: true } },
          curso: { select: { titulo: true, instructor: { select: { nombre: true } } } },
        },
      },
    },
  });

  // Actualizar el estado de la inscripción a 'finalizado'
  await prisma.inscripcion.update({
    where: { id: inscripcion.id },
    data: { estado: 'finalizado' },
  }).catch((err) => {
    console.error('Error al actualizar estado inscripcion en verificarYEmitir:', err);
  });

  // Disparar Webhook
  triggerWebhook('certificacion.emitida', {
    usuarioId,
    cursoId,
    codigoUnico,
    urlPdf: certificado.urlPdf,
    fechaEmision: certificado.fechaEmision.toISOString(),
  });

  // Notificar al estudiante del certificado emitido
  try {
    await enviarNotificacionConfigurada({
      usuarioId: usuarioId,
      tipo: 'certificado',
      titulo: `¡Has completado el curso "${curso.titulo}"! 🏆`,
      contenido: `¡Felicitaciones! Has cumplido con todos los requisitos del curso y tu certificado de finalización ha sido generado con el código de verificación único: ${codigoUnico}. Ya puedes descargarlo en tu panel de certificados.`,
      urlDestino: `/dashboard/certificados`,
    });
  } catch (notifErr) {
    console.error('[Error notif certificado curso]', notifErr);
  }

  // Disparar la verificación y emisión del certificado de ruta de formación si aplica
  await verificarYEmitirCertificadoRuta(usuarioId, cursoId);

  return certificado;
}

export async function verificarYEmitirCertificadoRuta(usuarioId, cursoId) {
  try {
    // 1. Obtener todas las rutas de formación que contienen este curso
    const cursoRutas = await prisma.cursoRuta.findMany({
      where: { cursoId },
      include: {
        ruta: {
          include: {
            cursos: true,
          },
        },
      },
    });

    for (const cr of cursoRutas) {
      const ruta = cr.ruta;

      // Verificar si el usuario ya tiene un certificado para esta ruta
      const certificadoExistente = await prisma.certificadoRuta.findUnique({
        where: {
          usuarioId_rutaId: {
            usuarioId,
            rutaId: ruta.id,
          },
        },
      });

      if (certificadoExistente) continue; // Ya emitido

      // Obtener todos los cursos de esta ruta
      const cursoIdsRuta = ruta.cursos.map((c) => c.cursoId);

      // Obtener certificaciones de curso individual del usuario para los cursos de esta ruta
      const certificacionesUsuario = await prisma.certificacion.findMany({
        where: {
          inscripcion: {
            usuarioId,
            cursoId: { in: cursoIdsRuta },
          },
        },
        include: {
          inscripcion: {
            select: { cursoId: true },
          },
        },
      });

      const cursosCompletadosIds = certificacionesUsuario.map((c) => c.inscripcion.cursoId);

      // Si ha completado todos los cursos de la ruta
      const completadoTodo = cursoIdsRuta.every((id) => cursosCompletadosIds.includes(id));

      if (completadoTodo && cursoIdsRuta.length > 0) {
        // Emitir certificado de ruta
        const codigoUnico = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
        const hashVerificacion = crypto
          .createHash('sha256')
          .update(`${usuarioId}-${ruta.id}-${codigoUnico}`)
          .digest('hex');

        await prisma.certificadoRuta.create({
          data: {
            usuarioId,
            rutaId: ruta.id,
            codigoUnico,
            hashVerificacion,
            urlPdf: `/api/certificados/ruta-pdf/${codigoUnico}`,
          },
        });

        // Notificar al estudiante del certificado de ruta emitido
        try {
          await enviarNotificacionConfigurada({
            usuarioId: usuarioId,
            tipo: 'certificado',
            titulo: `¡Has completado la ruta de aprendizaje "${ruta.nombre}"! 🏅`,
            contenido: `¡Felicitaciones! Has completado exitosamente todos los cursos de la ruta de formación "${ruta.nombre}". Tu certificado especial de ruta ha sido emitido con el código único: ${codigoUnico}.`,
            urlDestino: `/dashboard/certificados`,
          });
        } catch (notifErr) {
          console.error('[Error notif certificado ruta]', notifErr);
        }
      }
    }
  } catch (error) {
    console.error('Error al emitir certificado de ruta:', error);
  }
}

/** GET /api/certificados – mis certificados (estudiante) */
export async function GET(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
  }

  // Admin ve todos; otros ven solo los suyos
  const where = payload.rol === 'admin' ? {} : { inscripcion: { usuarioId: payload.id } };

  const certs = await prisma.certificacion.findMany({
    where,
    include: {
      inscripcion: {
        include: {
          usuario: { select: { nombre: true, email: true } },
          curso: { select: { titulo: true, instructor: { select: { nombre: true } } } },
        },
      },
    },
    orderBy: { fechaEmision: 'desc' },
  });
  return NextResponse.json(certs);
}
