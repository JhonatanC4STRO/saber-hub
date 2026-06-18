import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401 });
    }

    // Obtener solicitud activa
    const activeRequest = await prisma.solicitudInstructor.findFirst({
      where: {
        usuarioId: usuario.id,
        estado: { in: ['pendiente', 'en_revision'] },
      },
    });

    // Obtener última solicitud rechazada
    const lastRejected = await prisma.solicitudInstructor.findFirst({
      where: {
        usuarioId: usuario.id,
        estado: 'rechazada',
      },
      orderBy: {
        fechaRevision: 'desc',
      },
    });

    return new Response(
      JSON.stringify({
        role: usuario.rol,
        activeRequest,
        lastRejected,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/solicitudes-instructor:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401 });
    }

    // 1. Validar que tenga rol de estudiante/alumno
    // Nota: en la DB el rol se llama 'estudiante'
    if (usuario.rol !== 'estudiante') {
      return new Response(
        JSON.stringify({ error: 'Solo los usuarios con rol alumno pueden enviar esta solicitud.' }),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { areasExperiencia, aniosExperiencia, motivacion, enlacePortafolio, documentos } = body;

    // 2. Validar campos requeridos
    if (!areasExperiencia || aniosExperiencia === undefined || !motivacion) {
      return new Response(
        JSON.stringify({
          error:
            'Las áreas de experiencia, años de experiencia y motivación son campos obligatorios.',
        }),
        { status: 400 }
      );
    }

    if (documentos && Array.isArray(documentos) && documentos.length > 5) {
      return new Response(
        JSON.stringify({
          error: 'Solo se permite adjuntar hasta 5 documentos de respaldo por solicitud.',
        }),
        { status: 400 }
      );
    }

    // 3. Validar solicitud activa
    const activeRequest = await prisma.solicitudInstructor.findFirst({
      where: {
        usuarioId: usuario.id,
        estado: { in: ['pendiente', 'en_revision'] },
      },
    });

    if (activeRequest) {
      return new Response(
        JSON.stringify({
          error: 'Ya tienes una solicitud activa en proceso (pendiente o en revisión).',
        }),
        { status: 400 }
      );
    }

    // 4. Validar cooldown de 30 días si fue rechazada
    const lastRejected = await prisma.solicitudInstructor.findFirst({
      where: {
        usuarioId: usuario.id,
        estado: 'rechazada',
      },
      orderBy: {
        fechaRevision: 'desc',
      },
    });

    if (lastRejected && lastRejected.fechaRevision) {
      const fechaLimite = new Date(lastRejected.fechaRevision);
      fechaLimite.setDate(fechaLimite.getDate() + 30);
      const ahora = new Date();

      if (ahora < fechaLimite) {
        const diferenciaMs = fechaLimite.getTime() - ahora.getTime();
        const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
        return new Response(
          JSON.stringify({
            error: `Tu solicitud anterior fue rechazada. Debes esperar ${diasRestantes} días para poder enviar una nueva solicitud.`,
          }),
          { status: 400 }
        );
      }
    }

    // 5. Crear la solicitud
    const nuevaSolicitud = await prisma.solicitudInstructor.create({
      data: {
        usuarioId: usuario.id,
        estado: 'pendiente',
        areasExperiencia,
        aniosExperiencia: parseInt(aniosExperiencia, 10),
        motivacion,
        enlacePortafolio: enlacePortafolio || null,
        documentos: documentos ? JSON.stringify(documentos) : null,
        experiencia: `Áreas: ${areasExperiencia}. Años: ${aniosExperiencia}. Motivación: ${motivacion}`, // Backwards compatibility
      },
    });

    // 6. Notificar a los administradores
    const admins = await prisma.usuario.findMany({
      where: {
        rol: {
          nombre: 'admin',
        },
      },
    });

    if (admins.length > 0) {
      for (const admin of admins) {
        await enviarNotificacionConfigurada({
          usuarioId: admin.id,
          tipo: 'solicitud_instructor',
          titulo: 'Nueva solicitud de instructor 🎓',
          contenido: `El alumno ${usuario.nombre} ha enviado una solicitud para ser instructor.`,
          urlDestino: '/dashboard/solicitudes-instructor',
        }).catch((err) => {
          console.error('[Error notif admin solicitud]', err);
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        solicitud: nuevaSolicitud,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/solicitudes-instructor:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
