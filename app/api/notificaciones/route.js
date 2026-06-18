import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const filtro = searchParams.get('filtro') || 'todas'; // todas | no-leidas | leidas
    const skip = (page - 1) * limit;

    const where = { usuarioId: payload.id };
    if (filtro === 'no-leidas') {
      where.leida = false;
    } else if (filtro === 'leidas') {
      where.leida = true;
    }

    const [notificaciones, total, unreadCount] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        orderBy: { fechaEnvio: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificacion.count({ where }),
      prisma.notificacion.count({
        where: { usuarioId: payload.id, leida: false },
      }),
    ]);

    return NextResponse.json({
      notificaciones,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[GET /api/notificaciones]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, marcarTodas } = body;

    if (marcarTodas) {
      await prisma.notificacion.updateMany({
        where: { usuarioId: payload.id, leida: false },
        data: { leida: true },
      });
      return NextResponse.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la notificación' }, { status: 400 });
    }

    // Verify ownership and update
    const notificacion = await prisma.notificacion.findUnique({ where: { id } });
    if (!notificacion || notificacion.usuarioId !== payload.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    const updated = await prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });

    return NextResponse.json({ success: true, notificacion: updated });
  } catch (error) {
    console.error('[PATCH /api/notificaciones]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, eliminarTodas } = body;

    if (eliminarTodas) {
      await prisma.notificacion.deleteMany({
        where: { usuarioId: payload.id },
      });
      return NextResponse.json({ success: true, message: 'Todas las notificaciones han sido eliminadas' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID de la notificación' }, { status: 400 });
    }

    // Verify ownership and delete
    const notificacion = await prisma.notificacion.findUnique({ where: { id } });
    if (!notificacion || notificacion.usuarioId !== payload.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await prisma.notificacion.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Notificación eliminada' });
  } catch (error) {
    console.error('[DELETE /api/notificaciones]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
