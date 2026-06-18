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
  const triggeredAt = searchParams.get('triggeredAt');

  const where: any = {};
  if (fuente) {
    where.fuente = { contains: fuente.replace(' Betowa', '').trim(), mode: 'insensitive' };
  }

  const ultimoLog = await prisma.logScraping.findFirst({
    where,
    orderBy: { fechaEjecucion: 'desc' },
  });

  let status: 'idle' | 'running' | 'completed' = 'idle';

  if (ultimoLog) {
    if (ultimoLog.duracionMs === null) {
      status = 'running';
    } else {
      if (triggeredAt && new Date(ultimoLog.fechaEjecucion) < new Date(triggeredAt)) {
        status = 'running';
      } else {
        status = 'completed';
      }
    }
  } else if (triggeredAt) {
    status = 'running';
  }

  return NextResponse.json({ status, ultimoLog });
}
