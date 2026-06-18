import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

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

    const ruta = await prisma.rutaFormacion.findUnique({
      where: { id },
      include: {
        creador: {
          select: {
            nombre: true,
            email: true,
          },
        },
        cursos: {
          orderBy: { orden: 'asc' },
          include: {
            curso: {
              select: {
                id: true,
                titulo: true,
                descripcion: true,
                imgPortada: true,
              },
            },
          },
        },
      },
    });

    if (!ruta) {
      return NextResponse.json({ message: 'Ruta de formación no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ruta });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener detalle de la ruta' }, { status: 500 });
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
    const { nombre, descripcion, imgPortada, lineal, cursos = [] } = body;

    if (!nombre) {
      return NextResponse.json({ message: 'El nombre es obligatorio' }, { status: 400 });
    }

    const rutaExistente = await prisma.rutaFormacion.findUnique({ where: { id } });
    if (!rutaExistente) {
      return NextResponse.json({ message: 'Ruta de formación no encontrada' }, { status: 404 });
    }

    const rutaActualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.rutaFormacion.update({
        where: { id },
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion ? descripcion.trim() : null,
          imgPortada: imgPortada ? imgPortada.trim() : null,
          lineal: Boolean(lineal),
        },
      });

      // Sincronizar cursos de la ruta. Eliminar los existentes y agregar los nuevos con su orden respectivo.
      await tx.cursoRuta.deleteMany({
        where: { rutaId: id },
      });

      if (cursos && cursos.length > 0) {
        await tx.cursoRuta.createMany({
          data: cursos.map((cursoId, index) => ({
            rutaId: id,
            cursoId,
            orden: index + 1,
          })),
        });
      }

      return updated;
    });

    // Log de auditoría
    try {
      await prisma.logAuditoria.create({
        data: {
          usuarioId: auth.payload.id,
          accion: 'ACTUALIZAR_RUTA_FORMACION',
          tabla: 'rutas_formacion',
          registroId: id,
          datosAntes: JSON.stringify(rutaExistente),
          datosDespues: JSON.stringify(rutaActualizada),
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });
    } catch (err) {
      console.error('Error al guardar log de auditoría:', err);
    }

    return NextResponse.json({
      message: 'Ruta de formación actualizada con éxito',
      ruta: rutaActualizada,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar la ruta' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    const rutaExistente = await prisma.rutaFormacion.findUnique({ where: { id } });
    if (!rutaExistente) {
      return NextResponse.json({ message: 'Ruta de formación no encontrada' }, { status: 404 });
    }

    await prisma.rutaFormacion.delete({
      where: { id },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: auth.payload.id,
        accion: 'ELIMINAR_RUTA_FORMACION',
        tabla: 'rutas_formacion',
        registroId: id,
        datosAntes: JSON.stringify(rutaExistente),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ message: 'Ruta de formación eliminada con éxito' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Error al eliminar la ruta de formación' },
      { status: 500 }
    );
  }
}
