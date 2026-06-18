import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { verificarYEmitir } from '@/app/api/certificados/route';

/**
 * GET /api/progreso/scorm
 * Obtener el progreso SCORM (cmiData) de un alumno para una lección específica.
 */
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
    const leccionId = searchParams.get('leccionId');

    if (!leccionId) {
      return NextResponse.json({ message: 'leccionId es obligatorio' }, { status: 400 });
    }

    const progreso = await prisma.progresoScorm.findUnique({
      where: {
        usuarioId_leccionId: {
          usuarioId: payload.id,
          leccionId,
        },
      },
    });

    if (!progreso) {
      // Devolver estructura por defecto si no hay progreso previo
      const defaultCmi = {
        'cmi.core.lesson_status': 'not attempted',
        'cmi.core.lesson_location': '',
        'cmi.core.score.raw': '0',
        'cmi.completion_status': 'not_attempted',
        'cmi.success_status': 'unknown',
        'cmi.location': '',
      };
      return NextResponse.json({ cmiData: defaultCmi }, { status: 200 });
    }

    return NextResponse.json({ cmiData: JSON.parse(progreso.cmiData) }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/progreso/scorm]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/progreso/scorm
 * Guardar/Actualizar progreso SCORM (cmiData).
 * Body: { leccionId, cmiData }
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

    const body = await request.json();
    const { leccionId, cmiData } = body;

    if (!leccionId || !cmiData) {
      return NextResponse.json(
        { message: 'leccionId y cmiData son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que la lección existe y obtener el cursoId
    const leccion = await prisma.leccion.findUnique({
      where: { id: leccionId },
      include: { modulo: { select: { cursoId: true } } },
    });

    if (!leccion) {
      return NextResponse.json({ message: 'Lección no encontrada' }, { status: 404 });
    }

    const cursoId = leccion.modulo.cursoId;

    // Verificar inscripción activa
    const inscripcion = await prisma.inscripcion.findFirst({
      where: { usuarioId: payload.id, cursoId, estado: { not: 'retirado' } },
    });

    if (!inscripcion) {
      return NextResponse.json({ message: 'No estás inscrito en este curso' }, { status: 403 });
    }

    const cmiString = typeof cmiData === 'string' ? cmiData : JSON.stringify(cmiData);
    const cmiObj = typeof cmiData === 'string' ? JSON.parse(cmiData) : cmiData;

    // Upsert en ProgresoScorm
    const progresoScorm = await prisma.progresoScorm.upsert({
      where: {
        usuarioId_leccionId: {
          usuarioId: payload.id,
          leccionId,
        },
      },
      create: {
        usuarioId: payload.id,
        leccionId,
        cmiData: cmiString,
      },
      update: {
        cmiData: cmiString,
      },
    });

    // Detectar si completó la lección según variables SCORM standard
    // SCORM 1.2: cmi.core.lesson_status es "completed" o "passed"
    // SCORM 2004: cmi.completion_status es "completed" o cmi.success_status es "passed"
    const status12 = cmiObj['cmi.core.lesson_status'];
    const completion2004 = cmiObj['cmi.completion_status'];
    const success2004 = cmiObj['cmi.success_status'];

    const estaCompletada =
      status12 === 'completed' ||
      status12 === 'passed' ||
      completion2004 === 'completed' ||
      success2004 === 'passed';

    let coreProgressResponse = null;

    if (estaCompletada) {
      // Sincronizar con el progreso estándar del LMS
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

      // Recalcular progreso total del curso
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

      const nuevoEstado = porcentaje >= 100 ? 'finalizado' : undefined;

      await prisma.inscripcion.update({
        where: { id: inscripcion.id },
        data: {
          progreso: porcentaje,
          ultimoAcceso: new Date(),
          ...(nuevoEstado ? { estado: nuevoEstado } : {}),
        },
      });

      // Intentar emitir certificado
      const certificado = await verificarYEmitir(payload.id, cursoId).catch(() => null);

      coreProgressResponse = {
        progreso: porcentaje,
        leccionesCompletadas,
        totalLecciones,
        cursoFinalizado: porcentaje >= 100,
        certificadoEmitido: !!certificado,
      };
    }

    return NextResponse.json(
      {
        message: 'Progreso SCORM guardado correctamente',
        progresoScorm,
        leccionCompletada: estaCompletada,
        coreProgress: coreProgressResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/progreso/scorm]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
