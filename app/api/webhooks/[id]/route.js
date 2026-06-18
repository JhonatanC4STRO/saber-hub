import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * DELETE /api/webhooks/[id]
 * Eliminar una configuración de webhook.
 * Restringido a Administradores.
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin') {
      return NextResponse.json(
        { message: 'No tienes permisos para configurar webhooks' },
        { status: 403 }
      );
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      return NextResponse.json({ message: 'Webhook no encontrado' }, { status: 404 });
    }

    await prisma.webhook.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Webhook eliminado exitosamente' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/webhooks/[id]]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
