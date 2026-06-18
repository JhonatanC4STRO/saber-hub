import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import { slugify } from '@/lib/slugify';

async function autenticarAdmin(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (payload.rol !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    const payload = await autenticarAdmin(request);
    if (!payload) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const solicitud = await prisma.solicitudInstitucion.findUnique({ where: { id } });
    if (!solicitud)
      return NextResponse.json({ message: 'Solicitud no encontrada.' }, { status: 404 });

    return NextResponse.json({ solicitud });
  } catch (error) {
    console.error('[GET /api/admin/instituciones/solicitudes/[id]]', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const payload = await autenticarAdmin(request);
    if (!payload) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const { id } = await params;
    const solicitud = await prisma.solicitudInstitucion.findUnique({ where: { id } });
    if (!solicitud)
      return NextResponse.json({ message: 'Solicitud no encontrada.' }, { status: 404 });

    if (['aprobada', 'rechazada'].includes(solicitud.estado)) {
      return NextResponse.json(
        { message: 'La solicitud ya fue procesada y no puede modificarse.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { accion, motivo, mensaje } = body;

    if (!['en_revision', 'pendiente_informacion', 'aprobar', 'rechazar'].includes(accion)) {
      return NextResponse.json({ message: 'Acción no válida.' }, { status: 400 });
    }
    if (accion === 'rechazar' && !motivo?.trim()) {
      return NextResponse.json(
        { message: 'El motivo de rechazo es obligatorio.' },
        { status: 400 }
      );
    }
    if (accion === 'pendiente_informacion' && !mensaje?.trim()) {
      return NextResponse.json({ message: 'El mensaje es obligatorio.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;
    const now = new Date();

    // ── EN REVISIÓN ──────────────────────────────────────────
    if (accion === 'en_revision') {
      const updated = await prisma.solicitudInstitucion.update({
        where: { id },
        data: { estado: 'en_revision', revisadoPorId: payload.id, fechaRevision: now },
      });
      await prisma.logAuditoria.create({
        data: {
          usuarioId: payload.id,
          accion: 'SOLICITUD_INSTITUCION_EN_REVISION',
          tabla: 'solicitudes_institucion',
          registroId: id,
          datosDespues: JSON.stringify({ estado: 'en_revision' }),
          ip,
        },
      });
      return NextResponse.json({ solicitud: updated });
    }

    // ── PENDIENTE INFORMACIÓN ─────────────────────────────────
    if (accion === 'pendiente_informacion') {
      const updated = await prisma.solicitudInstitucion.update({
        where: { id },
        data: {
          estado: 'pendiente_informacion',
          motivoRechazo: mensaje.trim(),
          revisadoPorId: payload.id,
          fechaRevision: now,
        },
      });
      await prisma.logAuditoria.create({
        data: {
          usuarioId: payload.id,
          accion: 'SOLICITUD_INSTITUCION_PENDIENTE_INFO',
          tabla: 'solicitudes_institucion',
          registroId: id,
          datosAntes: JSON.stringify({ estado: solicitud.estado }),
          datosDespues: JSON.stringify({ estado: 'pendiente_informacion' }),
          ip,
        },
      });
      sendEmail({
        to: solicitud.correoInstitucional,
        subject: 'SABERHUB – Su solicitud requiere información adicional',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#1a56db;">Información adicional requerida</h2>
            <p>Hola <strong>${solicitud.nombreRepresentante}</strong>,</p>
            <p>El equipo de SABERHUB ha revisado la solicitud de <strong>${solicitud.nombreLegal}</strong> y necesita información adicional antes de continuar.</p>
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px;margin:16px 0;border-radius:0 4px 4px 0;">
              <p style="margin:0;color:#92400e;font-weight:bold;">Mensaje del equipo:</p>
              <p style="margin:8px 0 0;color:#78350f;">${mensaje.trim()}</p>
            </div>
            <p>Por favor responda a este correo con la información solicitada.</p>
            <p style="color:#6b7280;font-size:13px;">Referencia: ${solicitud.id}</p>
          </div>
        `,
      }).catch((err) => console.error('[Email pendiente_info]', err));
      return NextResponse.json({ solicitud: updated });
    }

    // ── RECHAZAR ──────────────────────────────────────────────
    if (accion === 'rechazar') {
      const updated = await prisma.solicitudInstitucion.update({
        where: { id },
        data: {
          estado: 'rechazada',
          motivoRechazo: motivo.trim(),
          revisadoPorId: payload.id,
          fechaRevision: now,
        },
      });
      await prisma.logAuditoria.create({
        data: {
          usuarioId: payload.id,
          accion: 'SOLICITUD_INSTITUCION_RECHAZADA',
          tabla: 'solicitudes_institucion',
          registroId: id,
          datosAntes: JSON.stringify({ estado: solicitud.estado }),
          datosDespues: JSON.stringify({ estado: 'rechazada', motivoRechazo: motivo.trim() }),
          ip,
        },
      });
      sendEmail({
        to: solicitud.correoInstitucional,
        subject: 'SABERHUB – Solicitud de registro rechazada',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#dc2626;">Solicitud rechazada</h2>
            <p>Hola <strong>${solicitud.nombreRepresentante}</strong>,</p>
            <p>Lamentamos informarle que la solicitud de registro de <strong>${solicitud.nombreLegal}</strong> en SABERHUB ha sido rechazada.</p>
            <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:16px 0;border-radius:0 4px 4px 0;">
              <p style="margin:0;color:#991b1b;font-weight:bold;">Motivo:</p>
              <p style="margin:8px 0 0;color:#7f1d1d;">${motivo.trim()}</p>
            </div>
            <p>Si tiene preguntas, puede contactarnos respondiendo a este correo.</p>
            <p style="color:#6b7280;font-size:13px;">Referencia: ${solicitud.id}</p>
          </div>
        `,
      }).catch((err) => console.error('[Email rechazo]', err));
      return NextResponse.json({ solicitud: updated });
    }

    // ── APROBAR ───────────────────────────────────────────────
    if (accion === 'aprobar') {
      const tokenInvitacion = crypto.randomBytes(32).toString('hex');
      const expiraToken = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      const linkSetup = `${baseUrl}/instituciones/configurar?token=${tokenInvitacion}`;

      const { updatedSolicitud, nuevaInstitucion } = await prisma.$transaction(async (tx) => {
        const updatedSolicitud = await tx.solicitudInstitucion.update({
          where: { id },
          data: { estado: 'aprobada', revisadoPorId: payload.id, fechaRevision: now },
        });
        const nuevaInstitucion = await tx.institucion.create({
          data: {
            nombre: solicitud.nombreLegal,
            slug: slugify(solicitud.nombreLegal),
            descripcion: solicitud.descripcion,
            url: solicitud.sitioWeb,
            logoUrl: solicitud.logoUrl,
            nit: solicitud.nit,
            correoAdmin: solicitud.correoInstitucional,
            telefono: solicitud.telefono,
            solicitudId: solicitud.id,
          },
        });
        return { updatedSolicitud, nuevaInstitucion };
      });

      await prisma.tokenInvitacionAdmin.create({
        data: {
          token: tokenInvitacion,
          institucionId: nuevaInstitucion.id,
          correo: solicitud.correoInstitucional,
          expira: expiraToken,
        },
      });

      await prisma.logAuditoria.create({
        data: {
          usuarioId: payload.id,
          accion: 'SOLICITUD_INSTITUCION_APROBADA',
          tabla: 'solicitudes_institucion',
          registroId: id,
          datosAntes: JSON.stringify({ estado: solicitud.estado }),
          datosDespues: JSON.stringify({ estado: 'aprobada', institucionId: nuevaInstitucion.id }),
          ip,
        },
      });

      sendEmail({
        to: solicitud.correoInstitucional,
        subject: '¡SABERHUB – Su institución ha sido aprobada!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#059669;">¡Solicitud aprobada!</h2>
            <p>Hola <strong>${solicitud.nombreRepresentante}</strong>,</p>
            <p>Nos complace informarle que la solicitud de registro de <strong>${solicitud.nombreLegal}</strong> en SABERHUB ha sido <strong>aprobada</strong>.</p>
            <p>Para configurar su cuenta de administrador institucional, haga clic en el siguiente enlace:</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${linkSetup}" style="background:#1a56db;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
                Crear cuenta de administrador
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;">Este enlace expira en 72 horas. Si no puede hacer clic en el botón, copie y pegue esta URL:</p>
            <p style="color:#1a56db;font-size:13px;word-break:break-all;">${linkSetup}</p>
            <p style="color:#6b7280;font-size:12px;">Si no esperaba este correo, puede ignorarlo.</p>
          </div>
        `,
      }).catch((err) => console.error('[Email aprobacion]', err));

      return NextResponse.json({ solicitud: updatedSolicitud, institucionId: nuevaInstitucion.id });
    }
  } catch (error) {
    console.error('[PATCH /api/admin/instituciones/solicitudes/[id]]', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
