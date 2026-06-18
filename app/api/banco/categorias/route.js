import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function auth(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { error: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) };
  try {
    return { payload: await verifyToken(token) };
  } catch {
    return { error: NextResponse.json({ message: 'Token inválido' }, { status: 401 }) };
  }
}

/** GET /api/banco/categorias */
export async function GET(request) {
  const { error, payload } = await auth(request);
  if (error) return error;
  const categorias = await prisma.categoriaBanco.findMany({
    where: { creadorId: payload.id },
    include: { _count: { select: { preguntas: true } } },
    orderBy: { nombre: 'asc' },
  });
  return NextResponse.json(categorias);
}

/** POST /api/banco/categorias */
export async function POST(request) {
  const { error, payload } = await auth(request);
  if (error) return error;
  const { nombre } = await request.json();
  if (!nombre) return NextResponse.json({ message: 'El nombre es obligatorio' }, { status: 400 });
  const cat = await prisma.categoriaBanco.create({
    data: { nombre, creadorId: payload.id },
  });
  return NextResponse.json(cat, { status: 201 });
}

/** DELETE /api/banco/categorias */
export async function DELETE(request) {
  const { error, payload } = await auth(request);
  if (error) return error;
  const { id } = await request.json();
  const cat = await prisma.categoriaBanco.findUnique({ where: { id } });
  if (!cat || cat.creadorId !== payload.id)
    return NextResponse.json({ message: 'No encontrada o sin permiso' }, { status: 404 });
  await prisma.categoriaBanco.delete({ where: { id } });
  return NextResponse.json({ message: 'Eliminada' });
}
