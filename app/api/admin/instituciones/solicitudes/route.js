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
    const estado = searchParams.get('estado');
    const busqueda = searchParams.get('busqueda')?.trim();
    const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1'));
    const limite = 25;

    const where = {};
    if (estado && estado !== 'todas') where.estado = estado;
    if (busqueda) {
      where.OR = [
        { nombreLegal: { contains: busqueda, mode: 'insensitive' } },
        { nit: { contains: busqueda, mode: 'insensitive' } },
        { nombreRepresentante: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    const [solicitudes, total, conteos] = await Promise.all([
      prisma.solicitudInstitucion.findMany({
        where,
        orderBy: { fechaSolicitud: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
        select: {
          id: true,
          nombreLegal: true,
          nit: true,
          nombreRepresentante: true,
          correoInstitucional: true,
          estado: true,
          fechaSolicitud: true,
          fechaRevision: true,
        },
      }),
      prisma.solicitudInstitucion.count({ where }),
      prisma.solicitudInstitucion.groupBy({
        by: ['estado'],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      solicitudes,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      conteos: Object.fromEntries(conteos.map((c) => [c.estado, c._count.id])),
    });
  } catch (error) {
    console.error('[GET /api/admin/instituciones/solicitudes]', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
