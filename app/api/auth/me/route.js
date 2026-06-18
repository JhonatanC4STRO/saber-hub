import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function GET(request) {
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

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      include: {
        rol: { select: { nombre: true } },
        institucion: { select: { id: true, nombre: true } },
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    let finalInstitucionId = usuario.institucionId;
    let finalInstitucion = usuario.institucion;

    if (usuario.rol.nombre === 'instructor') {
      const inv = await prisma.tokenInvitacionInstructor.findFirst({
        where: {
          correo: usuario.email.toLowerCase(),
          usado: true,
        },
        include: {
          institucion: { select: { id: true, nombre: true } },
        },
      });
      if (inv) {
        finalInstitucionId = inv.institucionId;
        finalInstitucion = inv.institucion;
      }
    }

    return NextResponse.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rolId: usuario.rolId,
      rol: usuario.rol.nombre,
      imagen: usuario.imagen,
      telefono: usuario.telefono,
      institucionId: finalInstitucionId,
      institucion: finalInstitucion,
    });
  } catch (error) {
    console.error('[GET /api/auth/me]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request) {
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

    const body = await request.json();
    const { nombre, email, documento, telefono, imagen, password } = body;

    const dataToUpdate = {};
    if (nombre) dataToUpdate.nombre = nombre;
    if (email) dataToUpdate.email = email;
    if (documento) dataToUpdate.documento = documento;
    if (telefono !== undefined) dataToUpdate.telefono = telefono;
    if (imagen !== undefined) dataToUpdate.imagen = imagen;

    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: payload.id },
    });

    if (!usuarioActual) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: payload.id },
      data: dataToUpdate,
    });

    // Registrar en auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        accion: 'ACTUALIZAR_PERFIL',
        tabla: 'usuarios',
        registroId: payload.id,
        datosAntes: JSON.stringify({
          nombre: usuarioActual.nombre,
          email: usuarioActual.email,
          documento: usuarioActual.documento,
          telefono: usuarioActual.telefono,
          imagen: usuarioActual.imagen,
        }),
        datosDespues: JSON.stringify({
          nombre: usuarioActualizado.nombre,
          email: usuarioActualizado.email,
          documento: usuarioActualizado.documento,
          telefono: usuarioActualizado.telefono,
          imagen: usuarioActualizado.imagen,
        }),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    }).catch((e) => console.error('Error al registrar auditoría en me PUT:', e));

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      usuario: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre,
        email: usuarioActualizado.email,
        rol: payload.rol,
        imagen: usuarioActualizado.imagen,
        telefono: usuarioActualizado.telefono,
      },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El email o documento ya está en uso por otro usuario' },
        { status: 409 }
      );
    }
    console.error('[PUT /api/auth/me]', error);
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}
