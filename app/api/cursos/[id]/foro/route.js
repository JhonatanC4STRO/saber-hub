import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';

// Helper to check user participation in a course
async function checkCourseAccess(usuario, cursoId) {
  if (usuario.rol === 'admin') return true;

  // Check if instructor of the course
  const curso = await prisma.curso.findFirst({
    where: { id: cursoId, instructorId: usuario.id },
  });
  if (curso) return true;

  // Check if student enrolled in the course
  const inscripcion = await prisma.inscripcion.findFirst({
    where: { usuarioId: usuario.id, cursoId, estado: 'activo' },
  });
  if (inscripcion) return true;

  return false;
}

export async function GET(request, { params }) {
  try {
    const { id: cursoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const hasAccess = await checkCourseAccess(usuario, cursoId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado a este curso' }, { status: 403 });
    }

    // Find or create Foro for this course
    let foro = await prisma.foro.findFirst({
      where: { cursoId },
    });
    if (!foro) {
      const curso = await prisma.curso.findUnique({ where: { id: cursoId } });
      if (!curso) {
        return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      }
      foro = await prisma.foro.create({
        data: {
          cursoId,
          titulo: `Foro de ${curso.titulo}`,
          descripcion: `Foro oficial de discusión para ${curso.titulo}`,
        },
      });
    }

    // Fetch threads (padreId is null)
    const hilosRaw = await prisma.mensajeForo.findMany({
      where: { foroId: foro.id, padreId: null },
      include: {
        usuario: {
          select: { id: true, nombre: true, imagen: true, rol: { select: { nombre: true } } },
        },
        reacciones: true,
        respuestas: {
          include: {
            usuario: {
              select: { id: true, nombre: true, imagen: true, rol: { select: { nombre: true } } },
            },
            reacciones: true,
            cita: {
              include: {
                usuario: { select: { id: true, nombre: true } },
              },
            },
            respuestas: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nombre: true,
                    imagen: true,
                    rol: { select: { nombre: true } },
                  },
                },
                reacciones: true,
                cita: {
                  include: {
                    usuario: { select: { id: true, nombre: true } },
                  },
                },
              },
              orderBy: { creado: 'asc' },
            },
          },
          orderBy: { creado: 'asc' },
        },
      },
      orderBy: [{ fijado: 'desc' }, { creado: 'desc' }],
    });

    const formatMsg = (msg) => ({
      id: msg.id,
      titulo: msg.titulo,
      contenido: msg.contenido,
      fijado: msg.fijado,
      bloqueado: msg.bloqueado,
      creado: msg.creado,
      actualizado: msg.actualizado,
      categoria: msg.categoria,
      usuario: {
        id: msg.usuario.id,
        nombre: msg.usuario.nombre,
        imagen: msg.usuario.imagen,
        rol: msg.usuario.rol.nombre,
      },
      cita: msg.cita
        ? {
            id: msg.cita.id,
            contenido: msg.cita.contenido,
            usuarioNombre: msg.cita.usuario.nombre,
          }
        : null,
      reaccionesCount: msg.reacciones.length,
      usuarioReacciono: msg.reacciones.some((r) => r.usuarioId === usuario.id),
    });

    const hilos = hilosRaw.map((hilo) => {
      const formattedReplies = hilo.respuestas.map((reply) => {
        const formattedSubreplies = reply.respuestas.map((subreply) => formatMsg(subreply));
        return {
          ...formatMsg(reply),
          respuestas: formattedSubreplies,
        };
      });
      return {
        ...formatMsg(hilo),
        respuestas: formattedReplies,
      };
    });

    return NextResponse.json({ foro, hilos });
  } catch (error) {
    console.error('[GET /api/cursos/[id]/foro]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: cursoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const hasAccess = await checkCourseAccess(usuario, cursoId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado a este curso' }, { status: 403 });
    }

    const { titulo, contenido, padreId, citaId, categoria } = await request.json();
    if (!contenido || contenido.trim() === '') {
      return NextResponse.json({ error: 'El contenido no puede estar vacío' }, { status: 400 });
    }

    // Find or create Foro for this course
    let foro = await prisma.foro.findFirst({
      where: { cursoId },
    });
    if (!foro) {
      const curso = await prisma.curso.findUnique({ where: { id: cursoId } });
      if (!curso) {
        return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      }
      foro = await prisma.foro.create({
        data: {
          cursoId,
          titulo: `Foro de ${curso.titulo}`,
          descripcion: `Foro oficial de discusión para ${curso.titulo}`,
        },
      });
    }

    let finalPadreId = padreId ? padreId : null;
    let parentMsg = null;

    if (padreId) {
      parentMsg = await prisma.mensajeForo.findUnique({
        where: { id: padreId },
      });
      if (!parentMsg) {
        return NextResponse.json({ error: 'Mensaje padre no encontrado' }, { status: 404 });
      }

      // Find root thread to verify if blocked
      let rootThread = parentMsg;
      while (rootThread.padreId !== null) {
        rootThread = await prisma.mensajeForo.findUnique({
          where: { id: rootThread.padreId },
        });
      }
      if (rootThread.bloqueado) {
        return NextResponse.json(
          { error: 'El hilo está bloqueado y no admite nuevas respuestas.' },
          { status: 400 }
        );
      }

      // Enforce 2 levels nested comment hierarchy max
      if (parentMsg.padreId !== null) {
        const grandparent = await prisma.mensajeForo.findUnique({
          where: { id: parentMsg.padreId },
        });
        if (grandparent && grandparent.padreId !== null) {
          // parentMsg is level 2 (grandparent is level 1, grandparent's parent is level 0).
          // Nest reply under Level 1 (grandparent) instead of Level 2
          finalPadreId = parentMsg.padreId;
        }
      }
    }

    // Create forum message
    const nuevoMensaje = await prisma.mensajeForo.create({
      data: {
        foroId: foro.id,
        usuarioId: usuario.id,
        padreId: finalPadreId,
        titulo: finalPadreId ? null : titulo || 'Nuevo Hilo',
        contenido,
        citaId: citaId || null,
        categoria: finalPadreId ? null : (categoria || null),
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, imagen: true, rol: { select: { nombre: true } } },
        },
      },
    });

    // Create notifications for replies using centralized dispatcher
    if (parentMsg && parentMsg.usuarioId !== usuario.id) {
      try {
        const curso = await prisma.curso.findUnique({
          where: { id: cursoId },
          select: { titulo: true },
        });
        const cursoTitulo = curso ? curso.titulo : 'Curso';

        await enviarNotificacionConfigurada({
          usuarioId: parentMsg.usuarioId,
          tipo: 'foro',
          titulo: `Nueva respuesta en el foro de ${cursoTitulo} 💬`,
          contenido: `${usuario.nombre} ha respondido a tu publicación en el foro del curso "${cursoTitulo}".`,
          urlDestino: `/cursos/${cursoId}`,
        });
      } catch (notifErr) {
        console.error('[Error al enviar notif de foro]', notifErr);
      }
    }

    return NextResponse.json(
      {
        ...nuevoMensaje,
        usuario: {
          id: nuevoMensaje.usuario.id,
          nombre: nuevoMensaje.usuario.nombre,
          imagen: nuevoMensaje.usuario.imagen,
          rol: nuevoMensaje.usuario.rol.nombre,
        },
        reaccionesCount: 0,
        usuarioReacciono: false,
        respuestas: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/cursos/[id]/foro]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
