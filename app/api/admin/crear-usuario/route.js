import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { nombre, documento, email, password, role } = await request.json();

    if (!nombre || !documento || !email || !password || !role) {
      return NextResponse.json({ message: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const rolesValidos = ['admin', 'instructor', 'estudiante'];
    if (!rolesValidos.includes(role)) {
      return NextResponse.json({ message: 'Rol inválido' }, { status: 400 });
    }

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { documento }],
      },
    });
    if (usuarioExistente) {
      return NextResponse.json(
        { message: 'El usuario ya existe (email o documento duplicado)' },
        { status: 400 }
      );
    }

    const rol = await prisma.rol.upsert({
      where: { nombre: role },
      update: {},
      create: { nombre: role, descripcion: `Rol de ${role}` },
    });

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        documento,
        email,
        passwordHash,
        rolId: rol.id,
      },
      select: { id: true, nombre: true, email: true },
    });

    return NextResponse.json({ message: 'Usuario creado exitosamente', usuario }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear el usuario' }, { status: 500 });
  }
}
