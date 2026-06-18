import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'El token y la nueva contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    // Validar complejidad de la nueva contraseña
    const passwordValida =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password);

    if (!passwordValida) {
      return NextResponse.json(
        {
          error:
            'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.',
        },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'El enlace de restablecimiento es inválido o no existe.' },
        { status: 404 }
      );
    }

    if (resetToken.usado) {
      return NextResponse.json(
        { error: 'Este enlace de restablecimiento ya ha sido utilizado anteriormente.' },
        { status: 400 }
      );
    }

    if (resetToken.expira < new Date()) {
      return NextResponse.json(
        { error: 'El enlace de restablecimiento ha expirado (tiene validez de 1 hora).' },
        { status: 400 }
      );
    }

    // Encriptar la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Actualizar la contraseña del usuario y marcar el token como usado en una transacción segura
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: resetToken.usuarioId },
        data: {
          passwordHash,
          intentosFallidos: 0, // Desbloquear cuenta en caso de bloqueo
          bloqueadoHasta: null,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usado: true },
      }),
    ]);

    return NextResponse.json(
      { message: '¡Contraseña restablecida exitosamente!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Reset Password Error]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al restablecer la contraseña.' },
      { status: 500 }
    );
  }
}
