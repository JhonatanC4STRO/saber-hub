import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
    }

    const tokenInvitacion = await prisma.tokenInvitacionInstructor.findUnique({
      where: { token },
      include: { institucion: true },
    });

    if (!tokenInvitacion) {
      return NextResponse.json({ error: 'Token de invitación inválido' }, { status: 400 });
    }

    if (new Date() > tokenInvitacion.expira) {
      return NextResponse.json({ error: 'El token de invitación ha expirado' }, { status: 400 });
    }

    if (tokenInvitacion.usado) {
      return NextResponse.json(
        { error: 'Este token de invitación ya ha sido utilizado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valido: true,
      correo: tokenInvitacion.correo,
      institucion: {
        id: tokenInvitacion.institucion.id,
        nombre: tokenInvitacion.institucion.nombre,
        logo: tokenInvitacion.institucion.logo,
      },
    });
  } catch (error) {
    console.error('[GET /api/auth/register-instructor]', error);
    return NextResponse.json({ error: 'Error interno al validar el token' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { token, nombreCompleto, documento, password } = await req.json();

    if (!token || !nombreCompleto || !documento || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // 1. Validar token
    const tokenInvitacion = await prisma.tokenInvitacionInstructor.findUnique({
      where: { token },
      include: { institucion: true },
    });

    if (!tokenInvitacion) {
      return NextResponse.json({ error: 'Token de invitación inválido' }, { status: 400 });
    }

    if (new Date() > tokenInvitacion.expira) {
      return NextResponse.json({ error: 'El token de invitación ha expirado' }, { status: 400 });
    }

    if (tokenInvitacion.usado) {
      return NextResponse.json(
        { error: 'Este token de invitación ya ha sido utilizado' },
        { status: 400 }
      );
    }

    const email = tokenInvitacion.correo.toLowerCase();

    // 2. Validar que no exista usuario con ese email o documento
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { documento: documento.trim() }],
      },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El usuario ya existe (email o documento duplicado)' },
        { status: 409 }
      );
    }

    // 3. Obtener o crear el rol de instructor
    const rolInstructor = await prisma.rol.upsert({
      where: { nombre: 'instructor' },
      update: {},
      create: {
        nombre: 'instructor',
        descripcion: 'Rol para instructores de la plataforma',
      },
    });

    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Crear el usuario (rol instructor).
    // Nota: No podemos asociar directamente con institucionId aquí en Usuario por la restricción @unique (reservada para admins).
    // La asociación se conserva en el TokenInvitacionInstructor (usado: true) y se resolverá en /api/auth/me y en la creación de cursos.
    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombreCompleto.trim(),
        documento: documento.trim(),
        email,
        passwordHash,
        rolId: rolInstructor.id,
        verificado: true,
      },
      select: { id: true, nombre: true, email: true },
    });

    // 5. Marcar token como usado
    await prisma.tokenInvitacionInstructor.update({
      where: { token },
      data: { usado: true },
    });

    return NextResponse.json(
      { message: 'Cuenta de instructor creada exitosamente', usuario },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/auth/register-instructor]', error);
    return NextResponse.json({ error: 'Error interno al crear el instructor' }, { status: 500 });
  }
}
