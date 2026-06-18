import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';

// Helper to generate a realistic random Google Meet URL
function generateRandomMeetCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part1 = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  const part2 = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  const part3 = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${part1}-${part2}-${part3}`;
}

// Helper to format Spanish dates nicely for email notifications
function formatSpanishDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * GET /api/cursos/[id]/sesiones
 *
 * Lists all synchronous sessions for a specific course.
 */
export async function GET(request, { params }) {
  try {
    const { id: cursoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    // Check if enrolled, or if they are admin or course instructor
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { instructorId: true },
    });

    if (!curso) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    const esInscrito = await prisma.inscripcion.findUnique({
      where: {
        usuarioId_cursoId: {
          usuarioId: payload.id,
          cursoId,
        },
      },
    });

    const esInstructor = payload.rol === 'instructor' && curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esInscrito && !esInstructor && !esAdmin) {
      return NextResponse.json(
        { message: 'No tienes acceso a las sesiones de este curso' },
        { status: 403 }
      );
    }

    const sesiones = await prisma.sesionVideoconferencia.findMany({
      where: { cursoId },
      orderBy: { fechaInicio: 'asc' },
    });

    return NextResponse.json(sesiones, { status: 200 });
  } catch (error) {
    console.error('[GET /api/cursos/[id]/sesiones]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/cursos/[id]/sesiones
 *
 * Schedules a new synchronous session and alerts all active students.
 */
export async function POST(request, { params }) {
  try {
    const { id: cursoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    // Must be instructor of this course or admin
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      include: {
        inscripciones: {
          where: { estado: 'activo' },
          include: { usuario: true },
        },
      },
    });

    if (!curso) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    const esInstructor = payload.rol === 'instructor' && curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esInstructor && !esAdmin) {
      return NextResponse.json(
        { message: 'No tienes permisos para programar clases en este curso' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { titulo, descripcion, fechaInicio, duracion, plataforma } = body;
    let { urlReunion } = body;

    if (!titulo || !fechaInicio) {
      return NextResponse.json(
        { message: 'Título y fecha de inicio son requeridos' },
        { status: 400 }
      );
    }

    let platformName = plataforma === 'zoom' ? 'Zoom' : 'Google Meet';

    // Auto-generate link based on chosen platform if not provided
    if (!urlReunion || urlReunion.trim() === '') {
      if (plataforma === 'zoom') {
        const meetingId = Math.floor(100000000 + Math.random() * 900000000);
        const password = Math.random().toString(36).substring(2, 10);
        urlReunion = `https://zoom.us/j/${meetingId}?pwd=${password}`;
      } else {
        urlReunion = `https://meet.jit.si/SaberHub-Clase-${cursoId}-${Math.floor(1000 + Math.random() * 9000)}`;
        platformName = 'Jitsi Meet';
      }
    }

    const fechaInicioDate = new Date(fechaInicio);

    // Calculate fechaFin: fechaInicio + duracion in minutes
    const duracionMinutos = parseInt(duracion) || 60;
    const fechaFinDate = new Date(fechaInicioDate.getTime() + duracionMinutos * 60 * 1000);

    // Create session in DB
    const nuevaSesion = await prisma.sesionVideoconferencia.create({
      data: {
        cursoId,
        creadorId: payload.id,
        titulo,
        descripcion,
        urlReunion,
        duracion: duracionMinutos,
        fechaInicio: fechaInicioDate,
        fechaFin: fechaFinDate,
        estado: 'programada',
      },
    });

    // Notify all active students
    const activeEnrollments = curso.inscripciones || [];
    for (const enrollment of activeEnrollments) {
      try {
        const student = enrollment.usuario;

        const emailHtml = `
          <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #F9FAFB; padding: 40px 20px; color: #1F2937;">
            <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="background-color: ${plataforma === 'zoom' ? '#2D8CFF' : '#065F46'}; padding: 30px; text-align: center;">
                <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">SABERHUB</h1>
                <p style="color: #FFFFFF; font-size: 14px; margin: 5px 0 0 0; font-weight: 500;">Sesión de Aprendizaje Sincrónico (${platformName})</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">¡Hola, ${student.nombre}! 👋</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 24px;">
                  Tu instructor ha programado una nueva clase en vivo sincrónica para el curso <strong>"${curso.titulo}"</strong>. ¡Te invitamos a agendar la fecha!
                </p>
                
                <div style="background-color: #ECFDF5; border-left: 4px solid ${plataforma === 'zoom' ? '#2D8CFF' : '#10B981'}; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
                  <h3 style="font-size: 15px; font-weight: 700; color: ${plataforma === 'zoom' ? '#2D8CFF' : '#065F46'}; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Detalles de la Clase</h3>
                  <table style="width: 100%; font-size: 14px; color: #374151; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600; width: 35%;">Tema/Título:</td>
                      <td style="padding: 6px 0;">${titulo}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600;">Fecha y Hora:</td>
                      <td style="padding: 6px 0; color: ${plataforma === 'zoom' ? '#2D8CFF' : '#065F46'}; font-weight: 700;">${formatSpanishDateTime(fechaInicioDate)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600;">Plataforma:</td>
                      <td style="padding: 6px 0; font-weight: 600;">${platformName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600;">Duración Estimada:</td>
                      <td style="padding: 6px 0;">${duracionMinutos} minutos</td>
                    </tr>
                    ${
                      descripcion
                        ? `
                    <tr>
                      <td style="padding: 6px 0; font-weight: 600; vertical-align: top;">Descripción:</td>
                      <td style="padding: 6px 0; line-height: 1.4;">${descripcion}</td>
                    </tr>
                    `
                        : ''
                    }
                  </table>
                </div>

                <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 32px;">
                  Podrás unirte a la videollamada de ${platformName} directamente desde la sección <strong>"Clases en vivo"</strong> dentro del aula virtual al comenzar la sesión.
                </p>
                
                <div style="text-align: center; margin-bottom: 12px;">
                  <a href="${urlReunion}" target="_blank" style="background-color: ${plataforma === 'zoom' ? '#2D8CFF' : '#059669'}; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                    Enlace de ${platformName} &rarr;
                  </a>
                </div>
              </div>
              <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="font-size: 11px; color: #9CA3AF; margin: 0 0 6px 0;">Recibes esto porque tienes activadas las notificaciones de clases sincrónicas en tus ajustes.</p>
                <p style="font-size: 11px; color: #9CA3AF; margin: 0;">© 2026 SABERHUB. Todos los derechos reservados.</p>
              </div>
            </div>
          </div>
        `;

        await enviarNotificacionConfigurada({
          usuarioId: student.id,
          tipo: 'sesion',
          titulo: `🎥 Nueva clase en vivo: "${titulo}"`,
          contenido: `Se ha programado una clase sincrónica para el curso "${curso.titulo}" el día ${formatSpanishDateTime(fechaInicioDate)}.`,
          urlDestino: `/cursos/${curso.id}`,
          plantillaHtml: emailHtml,
        });
      } catch (err) {
        console.error(
          `Error enviando notificación de programación a alumno de inscripción ${enrollment.id}:`,
          err
        );
      }
    }

    return NextResponse.json(nuevaSesion, { status: 201 });
  } catch (error) {
    console.error('[POST /api/cursos/[id]/sesiones]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
