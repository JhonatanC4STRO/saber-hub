import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request, { params }) {
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

    const { id: institucionId } = await params;
    const body = await request.json();
    const { correo } = body;

    if (!correo || !correo.trim()) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Verificar que el usuario es admin de esta institución
    const institucion = await prisma.institucion.findUnique({
      where: { id: institucionId },
      include: { admin: true },
    });

    if (!institucion) {
      return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 });
    }

    if (!institucion.admin || institucion.admin.id !== payload.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para invitar instructores' },
        { status: 403 }
      );
    }

    // Verificar que el email no esté ya registrado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: correo.toLowerCase() },
    });

    if (usuarioExistente) {
      return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 400 });
    }

    // Verificar que no exista una invitación activa
    const invitacionExistente = await prisma.tokenInvitacionInstructor.findFirst({
      where: {
        correo: correo.toLowerCase(),
        institucionId,
        usado: false,
        expira: { gt: new Date() },
      },
    });

    if (invitacionExistente) {
      return NextResponse.json(
        { error: 'Ya existe una invitación activa para este email' },
        { status: 400 }
      );
    }

    // Crear token de invitación
    const tokenInvitacion = crypto.randomBytes(32).toString('hex');
    const expiraToken = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    const invitacion = await prisma.tokenInvitacionInstructor.create({
      data: {
        token: tokenInvitacion,
        institucionId,
        adminId: payload.id,
        correo: correo.toLowerCase(),
        expira: expiraToken,
      },
    });

    // Enviar email
    const linkRegistro = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/auth/registro-instructor?token=${tokenInvitacion}`;

    await sendEmail({
      to: correo.toLowerCase(),
      subject: `SABERHUB – Invitación para ser instructor de ${institucion.nombre}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">¡Invitación a ser instructor!</h2>
          <p>Hola,</p>
          <p>Te invitamos a registrarte como instructor en <strong>${institucion.nombre}</strong> a través de SABERHUB.</p>
          <p>Como instructor podrás crear y gestionar cursos gratuitos en nuestra plataforma.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${linkRegistro}" style="background: #1a56db; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Crear cuenta como instructor
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Este enlace expira en 7 días. Si no puedes hacer clic, copia y pega esta URL:</p>
          <p style="color: #1a56db; font-size: 12px; word-break: break-all;">${linkRegistro}</p>
          <p style="color: #6b7280; font-size: 12px;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
        </div>
      `,
    }).catch((err) => console.error('[Email invitación instructor]', err));

    return NextResponse.json(
      {
        message: 'Invitación enviada exitosamente',
        invitacion: { id: invitacion.id, correo: invitacion.correo },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/instituciones/[id]/invitar-instructor]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
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

    const { id: institucionId } = await params;

    // Verificar que el usuario es admin de esta institución
    const institucion = await prisma.institucion.findUnique({
      where: { id: institucionId },
      include: { admin: true },
    });

    if (!institucion) {
      return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 });
    }

    if (!institucion.admin || institucion.admin.id !== payload.id) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    // Listar invitaciones
    const invitaciones = await prisma.tokenInvitacionInstructor.findMany({
      where: { institucionId },
      orderBy: { creado: 'desc' },
      select: {
        id: true,
        correo: true,
        usado: true,
        expira: true,
        creado: true,
      },
    });

    return NextResponse.json({ invitaciones });
  } catch (error) {
    console.error('[GET /api/instituciones/[id]/invitar-instructor]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
