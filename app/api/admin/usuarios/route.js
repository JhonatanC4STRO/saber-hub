import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function GET(request) {
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

    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        documento: true,
        activo: true,
        fechaRegistro: true,
        rol: { select: { nombre: true } },
      },
      orderBy: { fechaRegistro: 'desc' },
    });

    return NextResponse.json({ usuarios });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const { nombre, email, documento, password, rolId } = body;

    if (!nombre || !email || !documento || !password || !rolId) {
      return NextResponse.json({ message: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { documento }],
      },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { message: 'El email o documento ya está registrado' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        documento,
        passwordHash,
        rolId,
      },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        accion: 'CREAR_USUARIO',
        tabla: 'usuarios',
        registroId: nuevoUsuario.id,
        datosDespues: JSON.stringify({
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          documento: nuevoUsuario.documento,
          rolId: nuevoUsuario.rolId,
        }),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        usuario: { id: nuevoUsuario.id, nombre: nuevoUsuario.nombre },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear usuario' }, { status: 500 });
  }
}
