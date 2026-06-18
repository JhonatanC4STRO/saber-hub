import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/progreso/curso/[cursoId]
 *
 * Devuelve el árbol completo del curso (módulos → lecciones)
 * con el estado de completado de cada lección para el usuario actual.
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

    const { cursoId } = await params;

    // Verificar inscripción
    let inscripcion = await prisma.inscripcion.findFirst({
      where: { usuarioId: payload.id, cursoId },
      include: {
        certificacion: {
          select: { id: true, codigoUnico: true, urlPdf: true },
        },
      },
    });

    if (!inscripcion) {
      if (payload.rol === 'admin' || payload.rol === 'instructor') {
        // Registrar automáticamente al instructor o administrador en el curso
        const nuevaInscripcion = await prisma.inscripcion.create({
          data: {
            usuarioId: payload.id,
            cursoId,
            estado: 'activo',
            progreso: 0,
          },
        });
        inscripcion = {
          ...nuevaInscripcion,
          progreso: Number(nuevaInscripcion.progreso),
          certificacion: null,
        };
      } else {
        return NextResponse.json({ message: 'No estás inscrito en este curso' }, { status: 403 });
      }
    } else {
      // Intentar emitir certificado on-the-fly si cumple criterios pero no tiene registro
      if (!inscripcion.certificacion) {
        try {
          const { verificarYEmitir } = await import('@/app/api/certificados/route');
          const cert = await verificarYEmitir(payload.id, cursoId);
          if (cert) {
            inscripcion.certificacion = {
              id: cert.id,
              codigoUnico: cert.codigoUnico,
              urlPdf: cert.urlPdf,
            };
          }
        } catch (e) {
          console.error('Error al emitir certificado on-the-fly:', e);
        }
      }
    }

    // Árbol del curso
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        imgPortada: true,
        instructor: { select: { nombre: true } },
        evaluaciones: {
          select: { id: true, titulo: true, puntajeMinimo: true, duracionMinutos: true },
        },
        modulos: {
          orderBy: { orden: 'asc' },
          include: {
            evaluaciones: {
              select: { id: true, titulo: true, puntajeMinimo: true, duracionMinutos: true },
            },
            lecciones: {
              orderBy: { orden: 'asc' },
              include: { recursos: true },
            },
          },
        },
      },
    });

    if (!curso) return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });

    // Lecciones completadas por el alumno
    const leccionesCompletadas = await prisma.progresoLeccion.findMany({
      where: {
        usuarioId: payload.id,
        completada: true,
        leccion: { modulo: { cursoId } },
      },
      select: { leccionId: true, fechaCompletada: true },
    });

    const completadasMap = Object.fromEntries(
      leccionesCompletadas.map((l) => [l.leccionId, l.fechaCompletada])
    );

    // Enriquecer árbol con estado de completado
    const modulosEnriquecidos = curso.modulos.map((modulo) => {
      const leccionesEnriquecidas = modulo.lecciones.map((l) => ({
        ...l,
        completada: !!completadasMap[l.id],
        fechaCompletada: completadasMap[l.id] || null,
      }));
      const completadasModulo = leccionesEnriquecidas.filter((l) => l.completada).length;
      return {
        ...modulo,
        lecciones: leccionesEnriquecidas,
        completadas: completadasModulo,
        total: modulo.lecciones.length,
        progresoModulo:
          modulo.lecciones.length > 0
            ? Math.round((completadasModulo / modulo.lecciones.length) * 100)
            : 0,
      };
    });

    return NextResponse.json({
      curso: {
        ...curso,
        modulos: modulosEnriquecidos,
      },
      inscripcion: {
        id: inscripcion.id,
        estado: inscripcion.estado,
        progreso: Number(inscripcion.progreso),
        ultimoAcceso: inscripcion.ultimoAcceso,
        fechaInscripcion: inscripcion.fechaInscripcion,
        certificacion: inscripcion.certificacion || null,
      },
      usuarioRole: payload.rol,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
