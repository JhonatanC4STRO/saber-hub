import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';

async function checkMessagingAccess(remitenteId, destinatarioId, grupoId) {
  if (grupoId) {
    // Check if sender is member or creator of group
    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    });
    if (!grupo) return false;
    if (grupo.creadorId === remitenteId) return true;
    if (grupo.miembros.some((m) => m.usuarioId === remitenteId)) return true;
    return false;
  }

  if (destinatarioId) {
    // Check if they share a course or if one is admin
    const [u1, u2] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: remitenteId }, include: { rol: true } }),
      prisma.usuario.findUnique({ where: { id: destinatarioId }, include: { rol: true } }),
    ]);

    if (!u1 || !u2) return false;
    if (u1.rol.nombre === 'admin' || u2.rol.nombre === 'admin') return true;

    // Enrolled courses check
    const ins1 = await prisma.inscripcion.findMany({
      where: { usuarioId: remitenteId, estado: 'activo' },
      select: { cursoId: true },
    });
    const ins2 = await prisma.inscripcion.findMany({
      where: { usuarioId: destinatarioId, estado: 'activo' },
      select: { cursoId: true },
    });

    const c1 = ins1.map((i) => i.cursoId);
    const c2 = ins2.map((i) => i.cursoId);

    // Shared enrolled courses
    const shared = c1.filter((c) => c2.includes(c));
    if (shared.length > 0) return true;

    // Is one the instructor of the other
    const instructor1 = await prisma.curso.findFirst({
      where: { instructorId: remitenteId, id: { in: c2 } },
    });
    if (instructor1) return true;

    const instructor2 = await prisma.curso.findFirst({
      where: { instructorId: destinatarioId, id: { in: c1 } },
    });
    if (instructor2) return true;

    return false;
  }

  return false;
}

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Get all groups the user belongs to or created
    let grupoIds = [];
    if (usuario.rol === 'admin') {
      const allG = await prisma.grupo.findMany({ select: { id: true } });
      grupoIds = allG.map((g) => g.id);
    } else {
      const createdG = await prisma.grupo.findMany({
        where: { creadorId: usuario.id },
        select: { id: true },
      });
      const memberG = await prisma.miembroGrupo.findMany({
        where: { usuarioId: usuario.id },
        select: { grupoId: true },
      });
      grupoIds = [...createdG.map((g) => g.id), ...memberG.map((g) => g.grupoId)];
    }

    // Fetch messages involving user or user's groups
    const mensajes = await prisma.mensajeInterno.findMany({
      where: {
        OR: [
          { remitenteId: usuario.id },
          { destinatarioId: usuario.id },
          { grupoId: { in: grupoIds } },
        ],
      },
      include: {
        remitente: { select: { id: true, nombre: true, imagen: true } },
        destinatario: { select: { id: true, nombre: true, imagen: true } },
        grupo: { select: { id: true, nombre: true } },
        lecturas: { where: { usuarioId: usuario.id } },
      },
      orderBy: { fechaEnvio: 'desc' },
    });

    // Group messages into conversations
    const chatsMap = new Map();

    for (const msg of mensajes) {
      const isGroup = !!msg.grupoId;
      const key = isGroup
        ? `group_${msg.grupoId}`
        : `user_${msg.remitenteId === usuario.id ? msg.destinatarioId : msg.remitenteId}`;

      if (!chatsMap.has(key)) {
        let contact = null;
        let group = null;

        if (isGroup) {
          group = { id: msg.grupo.id, nombre: msg.grupo.nombre };
        } else {
          const rawContact = msg.remitenteId === usuario.id ? msg.destinatario : msg.remitente;
          if (rawContact) {
            contact = { id: rawContact.id, nombre: rawContact.nombre, imagen: rawContact.imagen };
          }
        }

        // Calculate unread count
        let unread = false;
        if (isGroup) {
          // Unread if sender is not me and I haven't read it
          unread = msg.remitenteId !== usuario.id && msg.lecturas.length === 0;
        } else {
          unread = msg.destinatarioId === usuario.id && !msg.leido;
        }

        chatsMap.set(key, {
          key,
          isGroup,
          contact,
          group,
          lastMessage: {
            id: msg.id,
            asunto: msg.asunto,
            contenido: msg.contenido,
            fechaEnvio: msg.fechaEnvio,
            remitenteNombre: msg.remitente.nombre,
            remitenteId: msg.remitenteId,
          },
          unreadCount: unread ? 1 : 0,
        });
      } else {
        // Conversation already exists, just add to unread count if applicable
        const chat = chatsMap.get(key);
        let unread = false;
        if (isGroup) {
          unread = msg.remitenteId !== usuario.id && msg.lecturas.length === 0;
        } else {
          unread = msg.destinatarioId === usuario.id && !msg.leido;
        }
        if (unread) {
          chat.unreadCount += 1;
        }
      }
    }

    const conversaciones = Array.from(chatsMap.values());
    return NextResponse.json({ conversaciones });
  } catch (error) {
    console.error('[GET /api/mensajes]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { destinatarioId, grupoId, asunto, contenido } = await request.json();

    if (!contenido || contenido.trim() === '') {
      return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 });
    }

    if (!destinatarioId && !grupoId) {
      return NextResponse.json(
        { error: 'Debe especificar un destinatario o un grupo' },
        { status: 400 }
      );
    }

    // Security check
    const hasAccess = await checkMessagingAccess(usuario.id, destinatarioId, grupoId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permiso para comunicarte con este destinatario o grupo' },
        { status: 403 }
      );
    }

    // Create Message
    const mensaje = await prisma.mensajeInterno.create({
      data: {
        remitenteId: usuario.id,
        destinatarioId: destinatarioId || null,
        grupoId: grupoId || null,
        asunto: asunto || null,
        contenido,
      },
      include: {
        remitente: { select: { id: true, nombre: true, imagen: true } },
      },
    });

    // Create In-App and Email Notifications via centralized dispatcher
    if (destinatarioId) {
      // 1-to-1 Notification
      try {
        await enviarNotificacionConfigurada({
          usuarioId: destinatarioId,
          tipo: 'mensaje',
          titulo: `Mensaje de ${usuario.nombre} ✉️`,
          contenido: asunto ? `Asunto: ${asunto}\n\n${contenido}` : contenido,
          urlDestino: `/dashboard/mensajes`,
        });
      } catch (notifErr) {
        console.error('[Error al notificar mensaje directo]', notifErr);
      }
    } else if (grupoId) {
      // Group Notification: Notify all group members (except sender) & the group owner (if not sender)
      try {
        const grupo = await prisma.grupo.findUnique({
          where: { id: grupoId },
          include: { miembros: { select: { usuarioId: true } } },
        });

        if (grupo) {
          const notifyIds = new Set();
          grupo.miembros.forEach((m) => {
            if (m.usuarioId !== usuario.id) notifyIds.add(m.usuarioId);
          });
          if (grupo.creadorId !== usuario.id) {
            notifyIds.add(grupo.creadorId);
          }

          await Promise.all(
            Array.from(notifyIds).map((uId) =>
              enviarNotificacionConfigurada({
                usuarioId: uId,
                tipo: 'mensaje',
                titulo: `Mensaje grupal en ${grupo.nombre} 👥`,
                contenido: `${usuario.nombre}: ${contenido}`,
                urlDestino: `/dashboard/mensajes`,
              }).catch((e) => console.error('[Error notif individual grupo]', e))
            )
          );
        }
      } catch (notifErr) {
        console.error('[Error al notificar mensaje grupal]', notifErr);
      }
    }

    return NextResponse.json(mensaje, { status: 201 });
  } catch (error) {
    console.error('[POST /api/mensajes]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
