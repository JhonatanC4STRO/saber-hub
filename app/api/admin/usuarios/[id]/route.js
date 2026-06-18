import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;

    if (payload.id === id) {
      return NextResponse.json({ message: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    if (hard) {
      await prisma.usuario.delete({
        where: { id },
      });

      await prisma.logAuditoria.create({
        data: {
          usuarioId: payload.id,
          accion: 'ELIMINAR_USUARIO',
          tabla: 'usuarios',
          registroId: id,
          datosAntes: JSON.stringify(usuario),
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });

      return NextResponse.json({ message: 'Usuario eliminado permanentemente' });
    } else {
      await prisma.usuario.update({
        where: { id },
        data: { activo: false },
      });

      await prisma.logAuditoria.create({
        data: {
          usuarioId: payload.id,
          accion: 'DESACTIVAR_USUARIO',
          tabla: 'usuarios',
          registroId: id,
          datosAntes: JSON.stringify({ activo: usuario.activo }),
          datosDespues: JSON.stringify({ activo: false }),
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });

      return NextResponse.json({ message: 'Usuario desactivado exitosamente' });
    }
  } catch (error) {
    if (error.code === 'P2003' || error.code === 'P2014') {
      return NextResponse.json(
        {
          message:
            'No se puede eliminar permanentemente: el usuario tiene registros asociados (cursos, evaluaciones, auditorías, etc.). Se recomienda solo desactivarlo.',
        },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar el usuario' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nombre, email, documento, password, role, activo } = body;

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id },
      include: { rol: true },
    });
    if (!usuarioActual) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const dataToUpdate = {};
    if (nombre) dataToUpdate.nombre = nombre;
    if (email) dataToUpdate.email = email;
    if (documento) dataToUpdate.documento = documento;
    if (activo !== undefined) dataToUpdate.activo = activo;

    if (role) {
      const rolDb = await prisma.rol.upsert({
        where: { nombre: role },
        update: {},
        create: { nombre: role, descripcion: `Rol de ${role}` },
      });
      dataToUpdate.rolId = rolDb.id;
    }

    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        accion: 'EDITAR_USUARIO',
        tabla: 'usuarios',
        registroId: id,
        datosAntes: JSON.stringify({
          nombre: usuarioActual.nombre,
          email: usuarioActual.email,
          documento: usuarioActual.documento,
          rolId: usuarioActual.rolId,
          rol: usuarioActual.rol?.nombre,
          activo: usuarioActual.activo,
        }),
        datosDespues: JSON.stringify({
          nombre: usuarioActualizado.nombre,
          email: usuarioActualizado.email,
          documento: usuarioActualizado.documento,
          rolId: usuarioActualizado.rolId,
          rol: role || usuarioActual.rol?.nombre,
          activo: usuarioActualizado.activo,
        }),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      usuario: { id: usuarioActualizado.id, nombre: usuarioActualizado.nombre },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'El email o documento ya está en uso por otro usuario' },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar el usuario' }, { status: 500 });
  }
}
