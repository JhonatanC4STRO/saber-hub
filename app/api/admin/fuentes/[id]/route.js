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

// PATCH /api/admin/fuentes/[id] — bloquear, desbloquear o actualizar fuente
// Body: { bloqueado?: boolean, motivoBloqueo?: string, nombre?: string, urlBase?: string, tieneApi?: boolean }
export async function PATCH(request, { params }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Body inválido' }, { status: 400 });
  }

  const data = {};

  if (typeof body.bloqueado === 'boolean') {
    data.bloqueado = body.bloqueado;
    // RL-05: registrar fecha y motivo cuando se bloquea
    if (body.bloqueado) {
      data.fechaBloqueo = new Date();
      data.motivoBloqueo = body.motivoBloqueo?.trim() || 'Solicitud de remoción por la institución';
    } else {
      data.fechaBloqueo = null;
      data.motivoBloqueo = null;
    }
  }

  if (body.nombre?.trim()) data.nombre = body.nombre.trim();
  if (body.urlBase?.trim()) {
    try {
      new URL(body.urlBase);
      data.urlBase = body.urlBase.trim();
    } catch {
      return NextResponse.json({ message: 'urlBase no es una URL válida' }, { status: 400 });
    }
  }
  if (typeof body.tieneApi === 'boolean') data.tieneApi = body.tieneApi;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: 'No se recibieron campos para actualizar' }, { status: 400 });
  }

  try {
    const fuente = await prisma.fuenteExterna.update({
      where: { id },
      data,
    });
    return NextResponse.json(fuente);
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Fuente no encontrada' }, { status: 404 });
    }
    console.error('[PATCH /api/admin/fuentes/:id]', err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// DELETE /api/admin/fuentes/[id] — eliminar fuente y todos sus cursos (cascade)
export async function DELETE(request, { params }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.fuenteExterna.delete({ where: { id } });
    return NextResponse.json({ message: 'Fuente eliminada' });
  } catch (err) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ message: 'Fuente no encontrada' }, { status: 404 });
    }
    console.error('[DELETE /api/admin/fuentes/:id]', err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
