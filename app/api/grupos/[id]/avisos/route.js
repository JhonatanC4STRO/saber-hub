import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function checkGroupAccess(usuarioId, rol, grupoId) {
  if (rol === 'admin') return true;
  const grupo = await prisma.grupo.findUnique({
    where: { id: grupoId },
    include: { miembros: true },
  });
  if (!grupo) return false;
  if (grupo.creadorId === usuarioId) return true;
  if (grupo.miembros.some((m) => m.usuarioId === usuarioId)) return true;
  return false;
}

export async function GET(request, { params }) {
  try {
    const { id: grupoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const hasAccess = await checkGroupAccess(payload.id, payload.rol, grupoId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado a este grupo' }, { status: 403 });
    }

    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      select: { creadorId: true }
    });

    const esCreador = grupo && grupo.creadorId === payload.id;
    const esInstructorOAdmin = payload.rol === 'admin' || esCreador;

    const whereClause = { grupoId };
    if (!esInstructorOAdmin) {
      // Students only see published ones or those whose scheduled time has passed
      whereClause.OR = [
        { publicado: true },
        { fechaProgramada: { lte: new Date() } }
      ];
    }

    const avisos = await prisma.avisoGrupo.findMany({
      where: whereClause,
      include: {
        autor: {
          select: { id: true, nombre: true, imagen: true },
        },
      },
      orderBy: { creado: 'desc' },
    });

    return NextResponse.json(avisos);
  } catch (error) {
    console.error('[GET /api/grupos/[id]/avisos]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: grupoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const hasAccess = await checkGroupAccess(payload.id, payload.rol, grupoId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permiso para publicar en este grupo' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { titulo, contenido, fechaProgramada } = body;

    if (!titulo || !contenido || titulo.trim() === '' || contenido.trim() === '') {
      return NextResponse.json({ error: 'Título y contenido son obligatorios' }, { status: 400 });
    }

    let publicado = true;
    let targetFecha = null;
    if (fechaProgramada) {
      const parseFecha = new Date(fechaProgramada);
      if (parseFecha.getTime() > Date.now()) {
        publicado = false;
        targetFecha = parseFecha;
      }
    }

    const nuevoAviso = await prisma.avisoGrupo.create({
      data: {
        grupoId,
        autorId: payload.id,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        fechaProgramada: targetFecha,
        publicado,
      },
      include: {
        autor: {
          select: { id: true, nombre: true, imagen: true },
        },
      },
    });

    // Notify immediately if published
    if (publicado) {
      notificarMiembrosAviso(grupoId, nuevoAviso.id, nuevoAviso.titulo, nuevoAviso.contenido, payload.nombre);
    }

    return NextResponse.json(nuevoAviso, { status: 201 });
  } catch (error) {
    console.error('[POST /api/grupos/[id]/avisos]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Background Helper to send notification
async function notificarMiembrosAviso(grupoId, avisoId, tituloAviso, contenidoAviso, creadorNombre) {
  try {
    const { enviarNotificacionConfigurada } = await import('@/lib/notificaciones');
    
    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      include: { miembros: { include: { usuario: true } } }
    });

    if (!grupo) return;

    for (const miembro of grupo.miembros) {
      const emailHtml = `
        <div style="font-family: 'Inter', sans-serif; padding: 40px 20px; background-color: #F9FAFB;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #1E40AF; padding: 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">SABERHUB</h1>
              <p style="color: #E0E7FF; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Anuncio de la Cohorte</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">¡Hola, ${miembro.usuario.nombre}! 👋</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 24px;">
                Tu instructor <strong>${creadorNombre}</strong> ha publicado un anuncio oficial en la cohorte <strong>"${grupo.nombre}"</strong>.
              </p>
              <div style="background-color: #F8FAFC; border-left: 4px solid #1E40AF; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0F172A;">${tituloAviso}</h3>
                <p style="margin: 0; font-size: 14.5px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${contenidoAviso}</p>
              </div>
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/grupos/workspace/${grupoId}" target="_blank" style="background-color: #1E40AF; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block;">
                  Acceder a la Cohorte &rarr;
                </a>
              </div>
            </div>
            <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF;">
              Recibes esto porque eres miembro de esta cohorte. © 2026 SABERHUB. Todos los derechos reservados.
            </div>
          </div>
        </div>
      `;

      await enviarNotificacionConfigurada({
        usuarioId: miembro.usuario.id,
        tipo: 'sistema',
        titulo: `📢 Anuncio en cohorte: "${tituloAviso}"`,
        contenido: `Se publicó un nuevo anuncio en la cohorte "${grupo.nombre}".`,
        urlDestino: `/dashboard/grupos/workspace/${grupoId}`,
        plantillaHtml: emailHtml
      });
    }
  } catch (e) {
    console.error('Error al enviar notificaciones de aviso:', e);
  }
}
