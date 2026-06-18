import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * DELETE /api/comentarios/[id]
 *
 * Deletes a lesson comment. Allowed for:
 * 1. The author of the comment.
 * 2. The course instructor.
 * 3. An administrator.
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const comentario = await prisma.comentarioLeccion.findUnique({
      where: { id },
      include: {
        leccion: {
          include: {
            modulo: {
              select: { cursoId: true }
            }
          }
        }
      }
    });

    if (!comentario) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    const cursoId = comentario.leccion.modulo.cursoId;
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { instructorId: true }
    });

    const esAutor = comentario.usuarioId === payload.id;
    const esInstructor = payload.rol === 'instructor' && curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esAutor && !esInstructor && !esAdmin) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este comentario' }, { status: 403 });
    }

    await prisma.comentarioLeccion.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Comentario eliminado con éxito' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/comentarios/[id]]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
