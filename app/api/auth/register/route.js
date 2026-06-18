import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const { nombreCompleto, documento, email, password } = await req.json();

    if (!nombreCompleto || !documento || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    // Validar complejidad de la contraseña
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

    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { documento }],
      },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El usuario ya existe (email o documento duplicado)' },
        { status: 409 }
      );
    }

    const rol = await prisma.rol.upsert({
      where: { nombre: 'estudiante' },
      update: {},
      create: {
        nombre: 'estudiante',
        descripcion: 'Rol por defecto para nuevos usuarios registrados',
      },
    });

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombreCompleto,
        documento,
        email,
        passwordHash,
        rolId: rol.id,
        verificado: false, // Comienza como no verificado
      },
      select: { id: true, nombre: true, email: true },
    });

    // Generar token de verificación de correo
    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.verificationToken.create({
      data: {
        token,
        usuarioId: usuario.id,
        expira,
      },
    });

    // Enlace de verificación
    const origin = req.headers.get('origin') || req.nextUrl?.origin || 'http://localhost:3000';
    const verificationUrl = `${origin}/verificar-cuenta?token=${token}`;

    // Enviar correo electrónico
    try {
      await sendEmail({
        to: email,
        subject: 'Verifica tu cuenta en SaberHub',
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: 1px;">SABERHUB</span>
              <p style="font-size: 12px; color: #6b7280; margin-top: 4px; text-transform: uppercase;">Plataforma de Aprendizaje</p>
            </div>
            <h2 style="font-size: 22px; font-weight: 700; text-align: center; color: #111827; margin-bottom: 12px;">¡Bienvenido a SaberHub, ${nombreCompleto}!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center; margin-bottom: 24px;">Gracias por registrarte. Para activar tu cuenta y comenzar a aprender con nosotros, por favor verifica tu dirección de correo electrónico.</p>
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${verificationUrl}" style="background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-size: 15px; font-weight: 600; display: inline-block; box-shadow: 0 4px 10px rgba(30,64,175,0.2);">Activar y Verificar Cuenta</a>
            </div>
            <p style="font-size: 13px; line-height: 1.5; color: #6b7280; text-align: center; margin-bottom: 0;">Este enlace es válido por 24 horas. Si no creaste una cuenta en SaberHub, por favor ignora este correo.</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('[Email Error] No se pudo enviar el correo de verificación:', mailError);
    }

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente. Por favor verifica tu correo electrónico.',
        usuario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 });
  }
}
