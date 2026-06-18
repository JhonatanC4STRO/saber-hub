import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    if (payload?.rol !== 'admin') throw new Error();
  } catch {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const fuente = searchParams.get('fuente') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (fuente) where.fuente = { contains: fuente, mode: 'insensitive' };

  const [logs, total] = await Promise.all([
    prisma.logScraping.findMany({
      where,
      orderBy: { fechaEjecucion: 'desc' },
      skip,
      take: limit,
    }),
    prisma.logScraping.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}
