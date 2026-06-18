import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de verificación no proporcionado.' },
        { status: 400 }
      );
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'El token de verificación es inválido o no existe.' },
        { status: 404 }
      );
    }

    if (verificationToken.usado) {
      return NextResponse.json(
        { message: 'Esta cuenta ya ha sido verificada anteriormente.', yaVerificado: true },
        { status: 200 }
      );
    }

    if (verificationToken.expira < new Date()) {
      return NextResponse.json(
        {
          error:
            'El enlace de verificación ha expirado. Por favor, solicita un nuevo enlace de verificación.',
        },
        { status: 400 }
      );
    }

    // Actualizar usuario a verificado y marcar token como usado en una transacción
    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: verificationToken.usuarioId },
        data: { verificado: true },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usado: true },
      }),
    ]);

    return NextResponse.json({ message: '¡Cuenta verificada exitosamente!' }, { status: 200 });
  } catch (error) {
    console.error('[Verify Email Error]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al verificar la cuenta.' },
      { status: 500 }
    );
  }
}
