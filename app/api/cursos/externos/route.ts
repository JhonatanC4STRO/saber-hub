import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || '';
    const area = searchParams.get('area') || '';
    const fuente = searchParams.get('fuente') || '';
    const nivel = searchParams.get('nivel') || '';
    const duracionMin = searchParams.get('duracionMin');
    const duracionMax = searchParams.get('duracionMax');
    const sort = searchParams.get('sort') || 'fecha';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      estaActivo: true,
      estado: 'aprobado',
      ...(search && {
        titulo: { contains: search, mode: 'insensitive' },
      }),
      ...(area && area !== 'Todas' && {
        areaConocimiento: { contains: area, mode: 'insensitive' },
      }),
      ...(fuente && fuente !== 'Todas' && {
        fuenteNombre: { contains: fuente, mode: 'insensitive' },
      }),
      ...(nivel && nivel !== 'Todos' && {
        nivel: { contains: nivel, mode: 'insensitive' },
      }),
    };

    // Filtro de duración
    if (duracionMin || duracionMax) {
      where.duracionHoras = {};
      if (duracionMin) where.duracionHoras.gte = parseInt(duracionMin, 10);
      if (duracionMax) where.duracionHoras.lte = parseInt(duracionMax, 10);
    }

    // Ordenamiento
    let orderBy: any = { creadoEn: 'desc' };
    if (sort === 'titulo') orderBy = { titulo: 'asc' };
    else if (sort === 'duracion') orderBy = { duracionHoras: 'asc' };

    const [cursos, total] = await Promise.all([
      prisma.cursoExterno.findMany({
        where,
        select: {
          id: true,
          titulo: true,
          fuenteUrl: true,
          fuenteNombre: true,
          codigoExterno: true,
          duracionHoras: true,
          nivel: true,
          modalidad: true,
          areaConocimiento: true,
          imagenUrl: true,
          creadoEn: true,
          institucion: {
            select: {
              id: true,
              nombre: true,
              logoUrl: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.cursoExterno.count({ where }),
    ]);

    return NextResponse.json({
      cursos,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error cursos externos:', err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
