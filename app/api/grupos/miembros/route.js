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

    let whereClause = {};
    if (payload.rol !== 'admin') {
      whereClause = {
        OR: [{ creadorId: payload.id }, { miembros: { some: { usuarioId: payload.id } } }],
      };
    }

    const grupos = await prisma.grupo.findMany({
      where: whereClause,
      include: {
        creador: { select: { id: true, nombre: true, imagen: true } },
        _count: { select: { miembros: true, archivos: true, avisos: true } },
      },
      orderBy: { creado: 'desc' },
    });

    return NextResponse.json(grupos);
  } catch (error) {
    console.error('[GET /api/grupos/miembros]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
