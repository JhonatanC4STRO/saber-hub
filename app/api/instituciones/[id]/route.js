import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const institucion = await prisma.institucion.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, nombre: true, email: true } },
        cursos: {
          select: {
            id: true,
            titulo: true,
            estado: true,
            instructor: { select: { nombre: true } },
          },
        },
      },
    });

    if (!institucion) {
      return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 });
    }

    return NextResponse.json(institucion);
  } catch (error) {
    console.error('[GET /api/instituciones/[id]]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el usuario es admin de esta institución
    const institucion = await prisma.institucion.findUnique({
      where: { id },
      include: { admin: true },
    });

    if (!institucion) {
      return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 });
    }

    if (!institucion.admin || institucion.admin.id !== payload.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta institución' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nombre, descripcion, url, logoUrl, telefono } = body;

    const actualizado = await prisma.institucion.update({
      where: { id },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(descripcion && { descripcion: descripcion.trim() }),
        ...(url && { url: url.trim() }),
        ...(logoUrl && { logoUrl: logoUrl.trim() }),
        ...(telefono && { telefono: telefono.trim() }),
      },
    });

    return NextResponse.json({
      message: 'Institución actualizada',
      institucion: actualizado,
    });
  } catch (error) {
    console.error('[PATCH /api/instituciones/[id]]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
