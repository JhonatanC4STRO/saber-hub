import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/progreso/grupo/[cursoId]
 *
 * Devuelve métricas grupales del curso:
 * - Progreso promedio
 * - Distribución por estado
 * - Ranking de alumnos por % de avance
 *
 * Roles: admin, instructor
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

    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { cursoId } = await params;

    // Verificar que el instructor sea dueño del curso
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, titulo: true, instructorId: true },
    });

    if (!curso) return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });

    if (payload.rol === 'instructor' && curso.instructorId !== payload.id) {
      return NextResponse.json({ message: 'Acceso denegado a este curso' }, { status: 403 });
    }

    // Total de lecciones del curso
    const totalLecciones = await prisma.leccion.count({
      where: { modulo: { cursoId } },
    });

    // Todas las inscripciones con datos del alumno
    const inscripciones = await prisma.inscripcion.findMany({
      where: { cursoId },
      include: {
        usuario: { select: { id: true, nombre: true, email: true, documento: true } },
      },
      orderBy: { progreso: 'desc' },
    });

    if (inscripciones.length === 0) {
      return NextResponse.json({
        curso: { id: curso.id, titulo: curso.titulo },
        totalLecciones,
        totalInscritos: 0,
        promedioProgreso: 0,
        distribucion: { activos: 0, retirados: 0, finalizados: 0, inactivos: 0 },
        ranking: [],
      });
    }

    // Lecciones completadas por alumno
    const progresos = await prisma.progresoLeccion.groupBy({
      by: ['usuarioId'],
      where: {
        usuarioId: { in: inscripciones.map((i) => i.usuarioId) },
        completada: true,
        leccion: { modulo: { cursoId } },
      },
      _count: { leccionId: true },
    });

    const progresoMap = Object.fromEntries(progresos.map((p) => [p.usuarioId, p._count.leccionId]));

    // Construir ranking
    const ranking = inscripciones
      .map((ins, idx) => {
        const completadas = progresoMap[ins.usuarioId] || 0;
        return {
          posicion: idx + 1,
          usuarioId: ins.usuarioId,
          nombre: ins.usuario.nombre,
          email: ins.usuario.email,
          documento: ins.usuario.documento,
          progreso: Number(ins.progreso),
          leccionesCompletadas: completadas,
          totalLecciones,
          estado: ins.estado,
          fechaInscripcion: ins.fechaInscripcion,
          ultimoAcceso: ins.ultimoAcceso,
        };
      })
      .sort((a, b) => b.progreso - a.progreso);

    // Re-asignar posición después de ordenar
    ranking.forEach((r, i) => {
      r.posicion = i + 1;
    });

    const promedioProgreso =
      ranking.length > 0
        ? Math.round(ranking.reduce((acc, r) => acc + r.progreso, 0) / ranking.length)
        : 0;

    const distribucion = {
      activos: inscripciones.filter((i) => i.estado === 'activo').length,
      retirados: inscripciones.filter((i) => i.estado === 'retirado').length,
      finalizados: inscripciones.filter((i) => i.estado === 'finalizado').length,
      inactivos: inscripciones.filter((i) => i.estado === 'inactivo').length,
    };

    return NextResponse.json({
      curso: { id: curso.id, titulo: curso.titulo },
      totalLecciones,
      totalInscritos: inscripciones.length,
      promedioProgreso,
      distribucion,
      ranking,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
