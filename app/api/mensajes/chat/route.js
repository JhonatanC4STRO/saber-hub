import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function checkChatAccess(remitenteId, destinatarioId, grupoId) {
  if (grupoId) {
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
    const [u1, u2] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: remitenteId }, include: { rol: true } }),
      prisma.usuario.findUnique({ where: { id: destinatarioId }, include: { rol: true } }),
    ]);

    if (!u1 || !u2) return false;
    if (u1.rol.nombre === 'admin' || u2.rol.nombre === 'admin') return true;

    // Shared enrolled courses
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

    const shared = c1.filter((c) => c2.includes(c));
    if (shared.length > 0) return true;

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

    const url = new URL(request.url);
    const contactId = url.searchParams.get('usuarioId');
    const grupoId = url.searchParams.get('grupoId');

    if (!contactId && !grupoId) {
      return NextResponse.json({ error: 'Falta usuarioId o grupoId' }, { status: 400 });
    }

    const hasAccess = await checkChatAccess(usuario.id, contactId, grupoId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado a esta conversación' }, { status: 403 });
    }

    let chatMessages = [];

    if (contactId) {
      // 1-to-1 Messages
      chatMessages = await prisma.mensajeInterno.findMany({
        where: {
          OR: [
            { remitenteId: usuario.id, destinatarioId: contactId },
            { remitenteId: contactId, destinatarioId: usuario.id },
          ],
        },
        include: {
          remitente: { select: { id: true, nombre: true, imagen: true } },
          destinatario: { select: { id: true, nombre: true, imagen: true } },
        },
        orderBy: { fechaEnvio: 'asc' },
      });
    } else if (grupoId) {
      // Group Messages
      chatMessages = await prisma.mensajeInterno.findMany({
        where: { grupoId },
        include: {
          remitente: { select: { id: true, nombre: true, imagen: true } },
          grupo: { select: { id: true, nombre: true } },
        },
        orderBy: { fechaEnvio: 'asc' },
      });
    }

    return NextResponse.json({ mensajes: chatMessages });
  } catch (error) {
    console.error('[GET /api/mensajes/chat]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { contactId, grupoId } = await request.json();

    if (!contactId && !grupoId) {
      return NextResponse.json({ error: 'Falta contactId o grupoId' }, { status: 400 });
    }

    if (contactId) {
      // Mark 1-to-1 incoming messages as read
      await prisma.mensajeInterno.updateMany({
        where: {
          remitenteId: contactId,
          destinatarioId: usuario.id,
          leido: false,
        },
        data: {
          leido: true,
          fechaLectura: new Date(),
        },
      });
    } else if (grupoId) {
      // Mark group messages as read by adding to MensajeInternoLectura
      const unreadGroupMessages = await prisma.mensajeInterno.findMany({
        where: {
          grupoId,
          NOT: { remitenteId: usuario.id },
          lecturas: {
            none: { usuarioId: usuario.id },
          },
        },
        select: { id: true },
      });

      if (unreadGroupMessages.length > 0) {
        await prisma.mensajeInternoLectura.createMany({
          data: unreadGroupMessages.map((m) => ({
            mensajeId: m.id,
            usuarioId: usuario.id,
            fechaLectura: new Date(),
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/mensajes/chat]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
