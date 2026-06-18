import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { verificarYEmitir } from '@/app/api/certificados/route';

/**
 * POST /api/progreso/leccion
 * Body: { leccionId, cursoId }
 *
 * Marca una lección como completada y recalcula el % de progreso
 * de la inscripción del alumno en ese curso.
 */
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

    const { leccionId, cursoId } = await request.json();

    if (!leccionId || !cursoId) {
      return NextResponse.json(
        { message: 'leccionId y cursoId son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que la lección pertenece al curso
    const leccion = await prisma.leccion.findUnique({
      where: { id: leccionId },
      include: { modulo: { select: { cursoId: true } } },
    });

    if (!leccion || leccion.modulo.cursoId !== cursoId) {
      return NextResponse.json(
        { message: 'Lección no encontrada o no pertenece al curso' },
        { status: 404 }
      );
    }

    // Verificar inscripción activa
    const inscripcion = await prisma.inscripcion.findFirst({
      where: { usuarioId: payload.id, cursoId, estado: { not: 'retirado' } },
    });

    if (!inscripcion) {
      return NextResponse.json({ message: 'No estás inscrito en este curso' }, { status: 403 });
    }

    // Crear o actualizar ProgresoLeccion
    await prisma.progresoLeccion.upsert({
      where: { usuarioId_leccionId: { usuarioId: payload.id, leccionId } },
      create: {
        usuarioId: payload.id,
        leccionId,
        completada: true,
        fechaCompletada: new Date(),
      },
      update: {
        completada: true,
        fechaCompletada: new Date(),
      },
    });

    // Recalcular progreso: lecciones completadas / total lecciones del curso
    const [totalLecciones, leccionesCompletadas] = await Promise.all([
      prisma.leccion.count({
        where: { modulo: { cursoId } },
      }),
      prisma.progresoLeccion.count({
        where: {
          usuarioId: payload.id,
          completada: true,
          leccion: { modulo: { cursoId } },
        },
      }),
    ]);

    const porcentaje =
      totalLecciones > 0 ? Math.round((leccionesCompletadas / totalLecciones) * 100) : 0;

    // Determinar si el curso se completó (100% lecciones + evaluaciones finales aprobadas)
    let nuevoEstado = undefined;
    if (porcentaje >= 100) {
      const evaluacionesFinales = await prisma.evaluacion.findMany({
        where: { cursoId, moduloId: null },
        select: { id: true, puntajeMinimo: true },
      });
      let evalsAprobadas = true;
      for (const ev of evaluacionesFinales) {
        const mejorIntento = await prisma.intentoExamen.findFirst({
          where: {
            usuarioId: payload.id,
            evaluacionId: ev.id,
            estado: 'calificado',
            puntaje: { gte: ev.puntajeMinimo },
          },
        });
        if (!mejorIntento) {
          evalsAprobadas = false;
          break;
        }
      }
      if (evalsAprobadas) {
        nuevoEstado = 'finalizado';
      }
    }

    await prisma.inscripcion.update({
      where: { id: inscripcion.id },
      data: {
        progreso: porcentaje,
        ultimoAcceso: new Date(),
        ...(nuevoEstado ? { estado: nuevoEstado } : {}),
      },
    });

    // Verificar si se genera certificado automáticamente
    const certificado = await verificarYEmitir(payload.id, cursoId).catch(() => null);

    return NextResponse.json({
      message: '¡Lección completada!',
      progreso: porcentaje,
      leccionesCompletadas,
      totalLecciones,
      cursoFinalizado: porcentaje >= 100,
      certificadoEmitido: !!certificado,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
