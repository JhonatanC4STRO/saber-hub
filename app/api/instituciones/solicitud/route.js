import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const DOMINIOS_PERSONALES = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.es',
  'hotmail.co',
  'outlook.com',
  'outlook.es',
  'yahoo.com',
  'yahoo.es',
  'yahoo.co',
  'live.com',
  'live.es',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'msn.com',
  'protonmail.com',
  'pm.me',
  'mail.com',
  'zohomail.com',
]);

function esCorreoInstitucional(email) {
  const partes = email.toLowerCase().split('@');
  if (partes.length !== 2 || !partes[1]) return false;
  return !DOMINIOS_PERSONALES.has(partes[1]);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      nombreLegal,
      nit,
      descripcion,
      sitioWeb,
      correoInstitucional,
      nombreRepresentante,
      telefono,
      logoUrl,
      documentoUrl,
    } = body;

    const camposRequeridos = {
      nombreLegal,
      nit,
      descripcion,
      sitioWeb,
      correoInstitucional,
      nombreRepresentante,
      telefono,
    };

    for (const [campo, valor] of Object.entries(camposRequeridos)) {
      if (!valor?.toString().trim()) {
        return NextResponse.json({ error: `El campo "${campo}" es requerido.` }, { status: 400 });
      }
    }

    if (!esCorreoInstitucional(correoInstitucional)) {
      return NextResponse.json(
        {
          error:
            'El correo debe ser institucional. No se aceptan Gmail, Hotmail, Outlook ni similares.',
        },
        { status: 400 }
      );
    }

    const existente = await prisma.solicitudInstitucion.findUnique({
      where: { nit: nit.trim() },
    });
    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud registrada con este NIT.' },
        { status: 409 }
      );
    }

    const solicitud = await prisma.solicitudInstitucion.create({
      data: {
        nombreLegal: nombreLegal.trim(),
        nit: nit.trim(),
        descripcion: descripcion.trim(),
        sitioWeb: sitioWeb.trim(),
        correoInstitucional: correoInstitucional.trim().toLowerCase(),
        nombreRepresentante: nombreRepresentante.trim(),
        telefono: telefono.trim(),
        logoUrl: logoUrl || null,
        documentoUrl: documentoUrl || null,
      },
    });

    // Correo de confirmación al solicitante (no bloqueante)
    sendEmail({
      to: solicitud.correoInstitucional,
      subject: 'SABERHUB – Solicitud de registro recibida',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Solicitud recibida</h2>
          <p>Hola <strong>${solicitud.nombreRepresentante}</strong>,</p>
          <p>Hemos recibido la solicitud de registro de <strong>${solicitud.nombreLegal}</strong> en la plataforma SABERHUB.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr><td style="padding: 6px; font-weight: bold;">Estado:</td><td style="padding: 6px;">Pendiente de revisión</td></tr>
            <tr><td style="padding: 6px; font-weight: bold;">NIT:</td><td style="padding: 6px;">${solicitud.nit}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold;">Referencia:</td><td style="padding: 6px;">${solicitud.id}</td></tr>
          </table>
          <p>Nuestro equipo revisará su solicitud y le notificará por este mismo correo sobre la decisión.</p>
          <p style="color: #6b7280; font-size: 14px;">Este es un mensaje automático, por favor no responda a este correo.</p>
        </div>
      `,
    }).catch((err) => console.error('[Email confirmación solicitante]', err));

    // Notificación al administrador (no bloqueante)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `SABERHUB – Nueva solicitud de institución: ${solicitud.nombreLegal}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a56db;">Nueva solicitud de institución</h2>
            <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
              <tr><td style="padding: 6px; font-weight: bold;">Institución:</td><td style="padding: 6px;">${solicitud.nombreLegal}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">NIT:</td><td style="padding: 6px;">${solicitud.nit}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Representante:</td><td style="padding: 6px;">${solicitud.nombreRepresentante}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Correo:</td><td style="padding: 6px;">${solicitud.correoInstitucional}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Teléfono:</td><td style="padding: 6px;">${solicitud.telefono}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">Sitio web:</td><td style="padding: 6px;">${solicitud.sitioWeb}</td></tr>
              <tr><td style="padding: 6px; font-weight: bold;">ID:</td><td style="padding: 6px;">${solicitud.id}</td></tr>
            </table>
          </div>
        `,
      }).catch((err) => console.error('[Email notificación admin]', err));
    }

    return NextResponse.json(
      {
        message: 'Solicitud enviada exitosamente. Recibirá un correo de confirmación.',
        id: solicitud.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/instituciones/solicitud]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
