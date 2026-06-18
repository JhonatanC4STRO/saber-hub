import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'El correo electrónico es obligatorio.' }, { status: 400 });
    }

    // Buscar al usuario por correo electrónico
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Si el usuario no existe, retornar un error explícito de no registrado
    if (!usuario) {
      return NextResponse.json(
        { error: 'El correo electrónico no está registrado en la plataforma.' },
        { status: 404 }
      );
    }

    // Generar token de recuperación seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validez

    await prisma.passwordResetToken.create({
      data: {
        token,
        usuarioId: usuario.id,
        expira,
      },
    });

    const origin = req.headers.get('origin') || req.nextUrl?.origin || 'http://localhost:3000';
    const resetUrl = `${origin}/restablecer-contrasena?token=${token}`;

    // Enviar correo electrónico de recuperación
    try {
      await sendEmail({
        to: email.toLowerCase().trim(),
        subject: 'Restablece tu contraseña en SaberHub',
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: 1px;">SABERHUB</span>
              <p style="font-size: 12px; color: #6b7280; margin-top: 4px; text-transform: uppercase;">Plataforma de Aprendizaje</p>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; text-align: center; color: #111827; margin-bottom: 12px;">Recuperación de Contraseña</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center; margin-bottom: 24px;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para configurar una nueva contraseña para tu cuenta.</p>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${resetUrl}" style="background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-size: 15px; font-weight: 600; display: inline-block; box-shadow: 0 4px 10px rgba(30,64,175,0.2);">Restablecer Contraseña</a>
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #6b7280; text-align: center; margin-bottom: 0;">Este enlace de recuperación es válido por exactamente 1 hora. Si tú no solicitaste esto, puedes ignorar este correo de forma segura.</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('[Email Error] No se pudo enviar el correo de recuperación:', mailError);
      return NextResponse.json(
        { error: 'Error al enviar el correo de recuperación. Intenta más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Se ha enviado un enlace de recuperación a tu correo electrónico.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la solicitud.' },
      { status: 500 }
    );
  }
}
