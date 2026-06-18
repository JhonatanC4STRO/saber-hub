import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function checkCourseAccess(usuario, cursoId) {
  if (usuario.rol === 'admin') return true;

  const curso = await prisma.curso.findFirst({
    where: { id: cursoId, instructorId: usuario.id },
  });
  if (curso) return true;

  const inscripcion = await prisma.inscripcion.findFirst({
    where: { usuarioId: usuario.id, cursoId, estado: 'activo' },
  });
  if (inscripcion) return true;

  return false;
}

export async function POST(request, { params }) {
  try {
    const { id: cursoId, msgId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const hasAccess = await checkCourseAccess(usuario, cursoId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verify message exists
    const mensaje = await prisma.mensajeForo.findUnique({
      where: { id: msgId },
    });
    if (!mensaje) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Toggle Reaction
    const reaccion = await prisma.reaccionForo.findUnique({
      where: {
        mensajeId_usuarioId: {
          mensajeId: msgId,
          usuarioId: usuario.id,
        },
      },
    });

    let liked = false;
    if (reaccion) {
      await prisma.reaccionForo.delete({
        where: { id: reaccion.id },
      });
    } else {
      await prisma.reaccionForo.create({
        data: {
          mensajeId: msgId,
          usuarioId: usuario.id,
        },
      });
      liked = true;
    }

    // Return current reaction count for UI
    const count = await prisma.reaccionForo.count({
      where: { mensajeId: msgId },
    });

    return NextResponse.json({ liked, count });
  } catch (error) {
    console.error('[POST /api/cursos/[id]/foro/[msgId]/like]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
