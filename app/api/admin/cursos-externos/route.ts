import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (payload?.rol !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const estado = searchParams.get('estado') || '';
  const fuente = searchParams.get('fuente') || '';
  const search = searchParams.get('search') || '';
  const institucionId = searchParams.get('institucionId') || '';
  const categoria = searchParams.get('categoria') || '';
  const ordenFecha = searchParams.get('ordenFecha') || 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (estado && estado !== 'todos') where.estado = estado;
  if (fuente && fuente !== 'todas') where.fuenteNombre = { contains: fuente, mode: 'insensitive' };
  if (search) where.titulo = { contains: search, mode: 'insensitive' };
  if (institucionId && institucionId !== 'todas') where.institucionId = institucionId;
  if (categoria && categoria !== 'todas') where.areaConocimiento = { contains: categoria, mode: 'insensitive' };

  const orderByList: any[] = [{ estado: 'asc' }];
  if (ordenFecha === 'asc') {
    orderByList.push({ creadoEn: 'asc' });
  } else {
    orderByList.push({ creadoEn: 'desc' });
  }

  const [cursos, total] = await Promise.all([
    prisma.cursoExterno.findMany({
      where,
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        fuenteUrl: true,
        fuenteNombre: true,
        codigoExterno: true,
        duracionHoras: true,
        nivel: true,
        modalidad: true,
        areaConocimiento: true,
        imagenUrl: true,
        estado: true,
        motivoRechazo: true,
        revisadoEn: true,
        creadoEn: true,
        institucion: { select: { nombre: true, logoUrl: true } },
        curso: { select: { id: true, titulo: true } },
      },
      orderBy: orderByList,
      skip,
      take: limit,
    }),
    prisma.cursoExterno.count({ where }),
  ]);

  // Stats - respect filters other than 'estado'
  const baseWhere = { ...where };
  delete baseWhere.estado;

  const [pendientes, aprobados, rechazados] = await Promise.all([
    prisma.cursoExterno.count({ where: { ...baseWhere, estado: 'pendiente' } }),
    prisma.cursoExterno.count({ where: { ...baseWhere, estado: 'aprobado' } }),
    prisma.cursoExterno.count({ where: { ...baseWhere, estado: 'rechazado' } }),
  ]);

  return NextResponse.json({
    cursos,
    total,
    page,
    pages: Math.ceil(total / limit),
    stats: { pendientes, aprobados, rechazados },
  });
}
