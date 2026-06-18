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

export async function GET(request) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const grupos = await prisma.grupo.findMany({
      include: {
        creador: {
          select: {
            nombre: true,
            email: true,
          },
        },
        _count: {
          select: {
            miembros: true,
            cursos: true,
          },
        },
      },
      orderBy: { creado: 'desc' },
    });

    return NextResponse.json({ grupos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener grupos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { nombre, descripcion, fechaInicio, fechaFin, activo = true, creadorId } = body;

    if (!nombre || !fechaInicio) {
      return NextResponse.json(
        { message: 'El nombre y la fecha de inicio son obligatorios' },
        { status: 400 }
      );
    }

    const finalCreadorId = (auth.payload.rol === 'admin' && creadorId) ? creadorId : auth.payload.id;

    const nuevoGrupo = await prisma.grupo.create({
      data: {
        nombre: nombre.trim(),
        descripcion: descripcion ? descripcion.trim() : null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        activo: Boolean(activo),
        creadorId: finalCreadorId,
      },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: auth.payload.id,
        accion: 'CREAR_GRUPO',
        tabla: 'grupos',
        registroId: nuevoGrupo.id,
        datosDespues: JSON.stringify(nuevoGrupo),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json(
      { message: 'Grupo creado exitosamente', grupo: nuevoGrupo },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear grupo' }, { status: 500 });
  }
}
