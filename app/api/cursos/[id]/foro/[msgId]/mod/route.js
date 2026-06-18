import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function checkModeratorAccess(usuario, cursoId) {
  if (usuario.rol === 'admin') return true;

  const curso = await prisma.curso.findFirst({
    where: { id: cursoId, instructorId: usuario.id },
  });
  if (curso) return true;

  return false;
}

export async function PUT(request, { params }) {
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

    const isMod = await checkModeratorAccess(usuario, cursoId);
    if (!isMod) {
      return NextResponse.json({ error: 'Acceso de moderador denegado' }, { status: 403 });
    }

    const { fijado, bloqueado } = await request.json();

    // Verify message exists
    const mensaje = await prisma.mensajeForo.findUnique({
      where: { id: msgId },
    });
    if (!mensaje) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Only root threads can be pinned/locked
    if (mensaje.padreId !== null) {
      return NextResponse.json(
        { error: 'Solo se pueden moderar hilos principales' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (typeof fijado === 'boolean') updateData.fijado = fijado;
    if (typeof bloqueado === 'boolean') updateData.bloqueado = bloqueado;

    const mensajeActualizado = await prisma.mensajeForo.update({
      where: { id: msgId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Hilo moderado exitosamente',
      mensaje: mensajeActualizado,
    });
  } catch (error) {
    console.error('[PUT /api/cursos/[id]/foro/[msgId]/mod]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
