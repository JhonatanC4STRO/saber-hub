import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * POST /api/cursos/[id]/mensajes-masivos
 *
 * Sends a mass message (in-app message + email notification) to all enrolled students in a course.
 * Allowed for the course instructor or an administrator.
 */
export async function POST(request, { params }) {
  try {
    const { id: cursoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Fetch course details to verify ownership
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { instructorId: true, titulo: true }
    });

    if (!curso) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    const esInstructor = payload.rol === 'instructor' && curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esInstructor && !esAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { asunto, contenido, destinatariosIds, sendEmail = true, sendChat = true, archivoUrl, archivoNombre } = body;

    if (!contenido || contenido.trim() === '') {
      return NextResponse.json({ error: 'El contenido del mensaje es requerido' }, { status: 400 });
    }

    if (!sendEmail && !sendChat) {
      return NextResponse.json({ error: 'Debes seleccionar al menos un canal de envío (Chat o Correo)' }, { status: 400 });
    }

    // Get target active student enrollments
    const queryConditions = {
      cursoId,
      estado: 'activo'
    };

    if (destinatariosIds && Array.isArray(destinatariosIds)) {
      queryConditions.usuarioId = { in: destinatariosIds };
    }

    const inscripciones = await prisma.inscripcion.findMany({
      where: queryConditions,
      include: {
        usuario: true
      }
    });

    if (inscripciones.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No se encontraron alumnos destinatarios activos.' });
    }

    const { enviarNotificacionConfigurada } = await import('@/lib/notificaciones');

    let count = 0;
    
    // Format message body for internal chat if there is an attachment
    let chatContent = contenido.trim();
    if (archivoUrl) {
      const displayFilename = archivoNombre || 'Archivo adjunto';
      chatContent += `\n\n📎 **Archivo adjunto:** [${displayFilename}](${archivoUrl})`;
    }

    for (const insc of inscripciones) {
      const student = insc.usuario;

      // 1. Create a 1-to-1 message record so it shows up in their inbox chat
      if (sendChat) {
        await prisma.mensajeInterno.create({
          data: {
            remitenteId: payload.id,
            destinatarioId: student.id,
            asunto: asunto?.trim() || `Anuncio de ${curso.titulo}`,
            contenido: chatContent,
          }
        });
      }

      // 2. Generate email HTML and send email + in-app notification
      if (sendEmail) {
        const emailHtml = `
          <div style="font-family: 'Inter', sans-serif; padding: 40px 20px; background-color: #F9FAFB;">
            <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="background-color: #1E40AF; padding: 30px; text-align: center;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">SABERHUB</h1>
                <p style="color: #E0E7FF; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Mensaje del Curso: ${curso.titulo}</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">¡Hola, ${student.nombre}! 👋</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 24px;">
                  Tu instructor <strong>${payload.nombre}</strong> ha enviado un mensaje a los estudiantes inscritos en el curso.
                </p>
                <div style="background-color: #F8FAFC; border-left: 4px solid #1E40AF; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0F172A;">${asunto?.trim() || 'Anuncio del Instructor'}</h3>
                  <p style="margin: 0; font-size: 14.5px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${contenido.trim()}</p>
                  ${archivoUrl ? `
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #E2E8F0;">
                    <span style="font-size: 13px; font-weight: bold; color: #475569;">📎 Archivo adjunto:</span>
                    <a href="${archivoUrl}" target="_blank" style="font-size: 13px; color: #1E40AF; font-weight: 600; text-decoration: underline; margin-left: 5px;">
                      ${archivoNombre || 'Descargar archivo'}
                    </a>
                  </div>
                  ` : ''}
                </div>
                <div style="text-align: center; gap: 10px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/mensajes" target="_blank" style="background-color: #1E40AF; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 5px;">
                    Ver Mensajes &rarr;
                  </a>
                  ${archivoUrl ? `
                  <a href="${archivoUrl}" target="_blank" style="background-color: #10B981; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 5px;">
                    📎 Descargar Adjunto
                  </a>
                  ` : ''}
                </div>
              </div>
              <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF;">
                Recibes esto porque estás inscrito en este curso. © 2026 SABERHUB. Todos los derechos reservados.
              </div>
            </div>
          </div>
        `;

        await enviarNotificacionConfigurada({
          usuarioId: student.id,
          tipo: 'mensaje',
          titulo: asunto?.trim() ? `Anuncio: ${asunto.trim()}` : `Mensaje de tu instructor en ${curso.titulo}`,
          contenido: contenido.trim().length > 80 ? `${contenido.trim().substring(0, 80)}...` : contenido.trim(),
          urlDestino: `/dashboard/mensajes`,
          plantillaHtml: emailHtml,
        }).catch(e => console.error(`Error al enviar notificación masiva a estudiante ${student.id}:`, e));
      }

      count++;
    }

    return NextResponse.json({ success: true, count, message: `Mensaje enviado a ${count} alumnos.` });
  } catch (error) {
    console.error('[POST /api/cursos/[id]/mensajes-masivos]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
