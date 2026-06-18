import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

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

    if (payload.rol !== 'admin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const usuario = searchParams.get('usuario')?.trim();
    const accion = searchParams.get('accion')?.trim();
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1'));
    const limite = 50;

    const where = {};

    if (accion) {
      where.accion = accion;
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha.lte = hasta;
      }
    }

    if (usuario) {
      where.usuario = {
        OR: [
          { nombre: { contains: usuario, mode: 'insensitive' } },
          { email: { contains: usuario, mode: 'insensitive' } },
        ],
      };
    }

    const [logs, total] = await Promise.all([
      prisma.logAuditoria.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, email: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.logAuditoria.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener auditoría' }, { status: 500 });
  }
}
