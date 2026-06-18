import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function PATCH(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id: institucionId, cursoId } = await params;
    const body = await request.json();
    const { estado } = body;

    if (!['borrador', 'publicado', 'archivado'].includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    // Verificar que el usuario es admin de esta institución
    const institucion = await prisma.institucion.findUnique({
      where: { id: institucionId },
      include: { admin: true },
    });

    if (!institucion) {
      return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 });
    }

    if (!institucion.admin || institucion.admin.id !== payload.id) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    // Obtener curso y verificar que pertenece a esta institución
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      include: {
        modulos: { include: { lecciones: true } },
      },
    });

    if (!curso) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    if (curso.institucionId !== institucionId) {
      return NextResponse.json(
        { error: 'Este curso no pertenece a tu institución' },
        { status: 403 }
      );
    }

    // Validar reglas de publicación
    if (estado === 'publicado' && curso.estado !== 'publicado') {
      const tieneLecciones = curso.modulos.some((m) => m.lecciones.length > 0);
      if (!tieneLecciones) {
        return NextResponse.json(
          { error: 'El curso debe tener al menos un módulo con una lección' },
          { status: 400 }
        );
      }
    }

    const cursoActualizado = await prisma.curso.update({
      where: { id: cursoId },
      data: { estado },
      include: {
        instructor: { select: { nombre: true, email: true } },
        categoria: { select: { nombre: true } },
      },
    });

    return NextResponse.json({
      message: `Curso ${estado === 'publicado' ? 'aprobado' : 'despublicado'} exitosamente`,
      curso: cursoActualizado,
    });
  } catch (error) {
    console.error('[PATCH /api/instituciones/[id]/cursos/[cursoId]]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
