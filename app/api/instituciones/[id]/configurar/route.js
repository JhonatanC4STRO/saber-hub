import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const { token, nombre, email, documento, password, passwordConfirm } = body;

    if (!token || !nombre || !email || !documento || !password || !passwordConfirm) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    if (password !== passwordConfirm) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Validar token
    const tokenInvitacion = await prisma.tokenInvitacionAdmin.findUnique({
      where: { token },
      include: { institucion: true },
    });

    if (!tokenInvitacion) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    if (new Date() > tokenInvitacion.expira) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 });
    }

    if (tokenInvitacion.usado) {
      return NextResponse.json({ error: 'Token ya fue utilizado' }, { status: 400 });
    }

    // Validar que email no exista
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (usuarioExistente) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    // Validar que documento no exista
    const documentoExistente = await prisma.usuario.findUnique({
      where: { documento: documento.trim() },
    });

    if (documentoExistente) {
      return NextResponse.json({ error: 'El documento ya está registrado' }, { status: 400 });
    }

    // Crear usuario admin
    const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'admin_institucional' } });
    if (!rolAdmin) {
      return NextResponse.json({ error: 'Rol no disponible' }, { status: 500 });
    }

    const passwordHash = await hashPassword(password);

    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email: email.toLowerCase(),
        documento: documento.trim(),
        passwordHash,
        rolId: rolAdmin.id,
        institucionId: tokenInvitacion.institucionId,
        verificado: true,
      },
    });

    // Marcar token como usado
    await prisma.tokenInvitacionAdmin.update({
      where: { token },
      data: { usado: true },
    });

    // Email de confirmación
    sendEmail({
      to: usuario.email,
      subject: 'SABERHUB – Cuenta de administrador institucional creada',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">¡Cuenta creada exitosamente!</h2>
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
          <p>Tu cuenta como administrador de <strong>${tokenInvitacion.institucion.nombre}</strong> ha sido creada.</p>
          <p>Ahora puedes acceder a tu panel para:</p>
          <ul>
            <li>Editar el perfil de tu institución</li>
            <li>Invitar instructores</li>
            <li>Gestionar cursos publicados</li>
          </ul>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/instituciones/dashboard" style="background: #1a56db; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Ir al panel
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">Este es un mensaje automático. No responda a este correo.</p>
        </div>
      `,
    }).catch((err) => console.error('[Email confirmación admin]', err));

    return NextResponse.json(
      {
        message: 'Cuenta creada exitosamente',
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/instituciones/[id]/configurar]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
