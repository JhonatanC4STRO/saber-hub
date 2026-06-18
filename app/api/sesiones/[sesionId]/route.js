import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * PATCH /api/sesiones/[sesionId]
 *
 * Updates a session's details, state, or recording URL.
 * Restricted to course instructor or admin.
 */
export async function PATCH(request, { params }) {
  try {
    const { sesionId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    // Find the session and its course instructor
    const sesion = await prisma.sesionVideoconferencia.findUnique({
      where: { id: sesionId },
      include: {
        curso: {
          select: { instructorId: true },
        },
      },
    });

    if (!sesion) {
      return NextResponse.json({ message: 'Sesión no encontrada' }, { status: 404 });
    }

    const esInstructor = payload.rol === 'instructor' && sesion.curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esInstructor && !esAdmin) {
      return NextResponse.json(
        { message: 'No tienes permisos para modificar esta sesión' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { titulo, descripcion, urlReunion, duracion, fechaInicio, estado, urlGrabacion } = body;

    // Build update data
    const updateData = {};
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (urlReunion !== undefined) updateData.urlReunion = urlReunion;
    if (urlGrabacion !== undefined) updateData.urlGrabacion = urlGrabacion;

    if (duracion !== undefined) {
      updateData.duracion = parseInt(duracion) || null;
    }

    if (fechaInicio !== undefined) {
      const start = new Date(fechaInicio);
      updateData.fechaInicio = start;
      const min = updateData.duracion || sesion.duracion || 60;
      updateData.fechaFin = new Date(start.getTime() + min * 60 * 1000);
    }

    if (estado !== undefined) {
      // Validate state enum
      const validStates = ['programada', 'en_curso', 'finalizada', 'cancelada'];
      if (!validStates.includes(estado)) {
        return NextResponse.json({ message: 'Estado de sesión inválido' }, { status: 400 });
      }
      updateData.estado = estado;

      // Automatically set actual fechaFin if it is finished
      if (estado === 'finalizada') {
        updateData.fechaFin = new Date();
      }
    }

    const sesionActualizada = await prisma.sesionVideoconferencia.update({
      where: { id: sesionId },
      data: updateData,
    });

    return NextResponse.json(sesionActualizada, { status: 200 });
  } catch (error) {
    console.error('[PATCH /api/sesiones/[sesionId]]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/sesiones/[sesionId]
 *
 * Deletes a session completely.
 * Restricted to course instructor or admin.
 */
export async function DELETE(request, { params }) {
  try {
    const { sesionId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const sesion = await prisma.sesionVideoconferencia.findUnique({
      where: { id: sesionId },
      include: {
        curso: {
          select: { instructorId: true },
        },
      },
    });

    if (!sesion) {
      return NextResponse.json({ message: 'Sesión no encontrada' }, { status: 404 });
    }

    const esInstructor = payload.rol === 'instructor' && sesion.curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esInstructor && !esAdmin) {
      return NextResponse.json(
        { message: 'No tienes permisos para eliminar esta sesión' },
        { status: 403 }
      );
    }

    await prisma.sesionVideoconferencia.delete({
      where: { id: sesionId },
    });

    return NextResponse.json({ message: 'Sesión eliminada con éxito' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/sesiones/[sesionId]]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
