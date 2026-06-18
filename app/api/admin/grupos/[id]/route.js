import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to verify admin or instructor access
async function authorize(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { error: 'No autorizado', status: 401 };

  try {
    const payload = await verifyToken(token);
    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return { error: 'Acceso denegado', status: 403 };
    }
    return { payload };
  } catch (err) {
    return { error: 'Token inválido', status: 401 };
  }
}

export async function GET(request, { params }) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const grupo = await prisma.grupo.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        miembros: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                email: true,
                documento: true,
                activo: true,
              },
            },
          },
        },
        cursos: {
          include: {
            curso: {
              select: {
                id: true,
                titulo: true,
                estado: true,
                instructor: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!grupo) {
      return NextResponse.json({ message: 'Grupo no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ grupo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener detalles del grupo' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, fechaInicio, fechaFin, activo, creadorId } = body;

    const grupoExistente = await prisma.grupo.findUnique({ where: { id } });
    if (!grupoExistente) {
      return NextResponse.json({ message: 'Grupo no encontrado' }, { status: 404 });
    }

    const updatedData = {};
    if (nombre !== undefined) updatedData.nombre = nombre.trim();
    if (descripcion !== undefined)
      updatedData.descripcion = descripcion ? descripcion.trim() : null;
    if (fechaInicio !== undefined) updatedData.fechaInicio = new Date(fechaInicio);
    if (fechaFin !== undefined) updatedData.fechaFin = fechaFin ? new Date(fechaFin) : null;
    if (activo !== undefined) updatedData.activo = Boolean(activo);
    if (auth.payload.rol === 'admin' && creadorId !== undefined) {
      updatedData.creadorId = creadorId;
    }

    const grupoActualizado = await prisma.grupo.update({
      where: { id },
      data: updatedData,
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: auth.payload.id,
        accion: 'ACTUALIZAR_GRUPO',
        tabla: 'grupos',
        registroId: grupoActualizado.id,
        datosAntes: JSON.stringify(grupoExistente),
        datosDespues: JSON.stringify(grupoActualizado),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({
      message: 'Grupo actualizado exitosamente',
      grupo: grupoActualizado,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar grupo' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const grupoExistente = await prisma.grupo.findUnique({ where: { id } });
    if (!grupoExistente) {
      return NextResponse.json({ message: 'Grupo no encontrado' }, { status: 404 });
    }

    await prisma.grupo.delete({
      where: { id },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: auth.payload.id,
        accion: 'ELIMINAR_GRUPO',
        tabla: 'grupos',
        registroId: id,
        datosAntes: JSON.stringify(grupoExistente),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ message: 'Grupo eliminado exitosamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar grupo' }, { status: 500 });
  }
}
