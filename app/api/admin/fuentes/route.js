import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function requireAdmin(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.rol === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

// GET /api/admin/fuentes — lista todas las fuentes externas
export async function GET(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const fuentes = await prisma.fuenteExterna.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      _count: { select: { cursos: true } },
    },
  });

  return NextResponse.json(fuentes);
}

// POST /api/admin/fuentes — registrar nueva fuente
export async function POST(request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Body inválido' }, { status: 400 });
  }

  const { nombre, urlBase, tieneApi } = body;

  if (!nombre?.trim() || !urlBase?.trim()) {
    return NextResponse.json({ message: 'nombre y urlBase son requeridos' }, { status: 400 });
  }

  try {
    new URL(urlBase);
  } catch {
    return NextResponse.json({ message: 'urlBase no es una URL válida' }, { status: 400 });
  }

  try {
    const fuente = await prisma.fuenteExterna.create({
      data: {
        nombre: nombre.trim(),
        urlBase: urlBase.trim(),
        tieneApi: Boolean(tieneApi),
      },
    });
    return NextResponse.json(fuente, { status: 201 });
  } catch (err) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ message: 'Ya existe una fuente con ese nombre' }, { status: 409 });
    }
    console.error('[POST /api/admin/fuentes]', err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
