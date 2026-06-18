import prisma from './prisma';
import { sendEmail } from './email';

export async function ejecutarEscaneoAlertas() {
  const logs = {
    alertasInactividadEnviadas: 0,
    alertasRendimientoEnviadas: 0,
    recordatoriosEnviados: 0,
    errores: [],
  };

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // ==========================================
    // 1. ESCANEO DE ALUMNOS INACTIVOS (> 7 DÍAS)
    // ==========================================
    const inscripcionesInactivas = await prisma.inscripcion.findMany({
      where: {
        estado: 'activo',
        progreso: { lt: 100 },
        OR: [
          { ultimoAcceso: { lt: sevenDaysAgo } },
          {
            ultimoAcceso: null,
            fechaInscripcion: { lt: sevenDaysAgo },
          },
        ],
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        curso: {
          select: { id: true, titulo: true },
        },
      },
    });

    for (const ins of inscripcionesInactivas) {
      try {
        const tituloNotif = `¡Te extrañamos en el curso ${ins.curso.titulo}! 📚`;

        // Verificar si ya se envió esta alerta de inactividad en los últimos 7 días
        const notifExistente = await prisma.notificacion.findFirst({
          where: {
            usuarioId: ins.usuario.id,
            tipo: 'sistema',
            titulo: tituloNotif,
            fechaEnvio: { gte: sevenDaysAgo },
          },
        });

        if (notifExistente) continue; // Duplicado evitado

        // Crear notificación In-App
        await prisma.notificacion.create({
          data: {
            usuarioId: ins.usuario.id,
            tipo: 'sistema',
            titulo: tituloNotif,
            contenido: `Hace más de 7 días que no ingresas a ${ins.curso.titulo}. ¡Sigue avanzando hoy!`,
            urlDestino: `/cursos/${ins.curso.id}`,
          },
        });

        // Enviar Correo HTML Premium al Alumno
        const emailHtml = `
          <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #F9FAFB; padding: 40px 20px; color: #1F2937;">
            <div style="max-width: 600px; margin: 0 auto; bg-color: #FFFFFF; background: #FFFFFF; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="background-color: #1E40AF; padding: 30px; text-align: center;">
                <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">SABERHUB</h1>
                <p style="color: #93C5FD; font-size: 14px; margin: 5px 0 0 0; font-weight: 500;">Learning Platform</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">¡Hola, ${ins.usuario.nombre}! 👋</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 24px;">
                  Hemos notado que no has ingresado al curso <strong>"${ins.curso.titulo}"</strong> en los últimos 7 días.
                </p>
                <div style="background-color: #EFF6FF; border-left: 4px solid #1E40AF; padding: 16px; border-radius: 4px; margin-bottom: 28px;">
                  <p style="font-size: 14px; font-weight: 600; color: #1E40AF; margin: 0; display: flex; align-items: center;">
                    💡 Tu progreso actual: <span style="font-size: 18px; margin-left: 8px;">${Number(ins.progreso).toFixed(1)}%</span>
                  </p>
                </div>
                <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 32px;">
                  Recuerda que la constancia es la clave del éxito. Retomar tu aprendizaje te tomará solo unos minutos hoy. ¡Te estamos esperando!
                </p>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cursos/${ins.curso.id}" style="background-color: #1E40AF; color: #FFFFFF; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; transition: background-color 0.2s;">
                    Retomar mi Curso &rarr;
                  </a>
                </div>
              </div>
              <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="font-size: 12px; color: #9CA3AF; margin: 0;">© 2026 SABERHUB. Todos los derechos reservados.</p>
              </div>
            </div>
          </div>
        `;

        await sendEmail({
          to: ins.usuario.email,
          subject: `¡Te extrañamos en el curso ${ins.curso.titulo}! 📚`,
          html: emailHtml,
        });

        logs.alertasInactividadEnviadas++;
      } catch (err) {
        console.error(`Error procesando inactividad para inscripción ${ins.id}:`, err);
        logs.errores.push(`Inactividad (${ins.id}): ${err.message}`);
      }
    }

    // ============================================
    // 2. ESCANEO DE BAJO RENDIMIENTO A LA MITAD
    // ============================================
    // Mitad del curso = 15 días desde la inscripción
    const inscripcionesBajoRendimiento = await prisma.inscripcion.findMany({
      where: {
        estado: 'activo',
        progreso: { lt: 30 },
        fechaInscripcion: { lt: fifteenDaysAgo },
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        curso: {
          select: {
            id: true,
            titulo: true,
            instructor: {
              select: { id: true, nombre: true, email: true },
            },
          },
        },
      },
    });

    for (const ins of inscripcionesBajoRendimiento) {
      try {
        const inst = ins.curso.instructor;
        if (!inst) continue;

        const tituloNotif = `Alerta de bajo rendimiento: ${ins.usuario.nombre} - ${ins.curso.titulo}`;

        // Verificar si ya se envió esta alerta de bajo rendimiento en los últimos 15 días
        const notifExistente = await prisma.notificacion.findFirst({
          where: {
            usuarioId: inst.id,
            tipo: 'sistema',
            titulo: tituloNotif,
            fechaEnvio: { gte: fifteenDaysAgo },
          },
        });

        if (notifExistente) continue; // Duplicado evitado

        // Crear notificación In-App al Instructor
        await prisma.notificacion.create({
          data: {
            usuarioId: inst.id,
            tipo: 'sistema',
            titulo: tituloNotif,
            contenido: `El alumno ${ins.usuario.nombre} tiene menos del 30% de avance (actual: ${Number(ins.progreso).toFixed(1)}%) habiendo superado el punto medio estimado del curso.`,
            urlDestino: `/dashboard`,
          },
        });

        // Enviar Correo HTML Premium al Instructor
        const emailHtml = `
          <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #F9FAFB; padding: 40px 20px; color: #1F2937;">
            <div style="max-width: 600px; margin: 0 auto; bg-color: #FFFFFF; background: #FFFFFF; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="background-color: #EA580C; padding: 30px; text-align: center;">
                <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">SABERHUB ALERTA</h1>
                <p style="color: #FFEDD5; font-size: 14px; margin: 5px 0 0 0; font-weight: 500;">Monitoreo de Rendimiento Académico</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">Estimado(a) Instructor(a) ${inst.nombre},</h2>
                <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 24px;">
                  El sistema de monitoreo automático de SABERHUB ha detectado una alerta de bajo rendimiento para el estudiante <strong>${ins.usuario.nombre}</strong> en su curso <strong>"${ins.curso.titulo}"</strong>.
                </p>
                
                <div style="background-color: #FFF7ED; border-left: 4px solid #EA580C; padding: 16px; border-radius: 4px; margin-bottom: 28px;">
                  <h3 style="font-size: 14px; font-weight: 700; color: #C2410C; margin: 0 0 8px 0; text-transform: uppercase;">Estado Académico</h3>
                  <table style="width: 100%; font-size: 14px; color: #4B5563; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 4px 0; font-weight: 600;">Estudiante:</td>
                      <td style="padding: 4px 0; text-align: right;">${ins.usuario.nombre} (${ins.usuario.email})</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: 600;">Avance Registrado:</td>
                      <td style="padding: 4px 0; text-align: right; color: #EA580C; font-weight: 700;">${Number(ins.progreso).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; font-weight: 600;">Tiempo desde Inscripción:</td>
                      <td style="padding: 4px 0; text-align: right;">Más de 15 días (mitad estimada)</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 32px;">
                  Le sugerimos ponerse en contacto con el estudiante para resolver dudas o brindarle asistencia personalizada que le permita retomar el ritmo óptimo del curso.
                </p>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #EA580C; color: #FFFFFF; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; transition: background-color 0.2s;">
                    Ir a mi Panel de Instructor &rarr;
                  </a>
                </div>
              </div>
              <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="font-size: 12px; color: #9CA3AF; margin: 0;">© 2026 SABERHUB. Todos los derechos reservados.</p>
              </div>
            </div>
          </div>
        `;

        await sendEmail({
          to: inst.email,
          subject: `⚠️ Alerta de bajo rendimiento: ${ins.usuario.nombre} - ${ins.curso.titulo}`,
          html: emailHtml,
        });

        logs.alertasRendimientoEnviadas++;
      } catch (err) {
        console.error(`Error procesando bajo rendimiento para inscripción ${ins.id}:`, err);
        logs.errores.push(`Rendimiento (${ins.id}): ${err.message}`);
      }
    }

    // ========================================================
    // 3. RECORDATORIOS DE VIDEOCONFERENCIA (1 hora antes)
    // ========================================================
    const nowLocal = new Date();
    const oneHourFromNow = new Date(nowLocal.getTime() + 60 * 60 * 1000);

    const sesionesProximas = await prisma.sesionVideoconferencia.findMany({
      where: {
        estado: 'programada',
        fechaInicio: {
          gte: nowLocal,
          lte: oneHourFromNow,
        },
      },
      include: {
        curso: {
          select: {
            id: true,
            titulo: true,
            inscripciones: {
              where: { estado: 'activo' },
              include: { usuario: true },
            },
          },
        },
      },
    });

    for (const sesion of sesionesProximas) {
      const activeEnrollments = sesion.curso.inscripciones || [];
      const horaFormateada = sesion.fechaInicio.toLocaleTimeString('es-CO', {
        timeZone: 'America/Bogota',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      for (const enrollment of activeEnrollments) {
        try {
          const student = enrollment.usuario;
          const tituloNotif = `⏰ Clase en vivo pronto: "${sesion.titulo}"`;
          const contenidoNotif = `La clase en vivo de "${sesion.curso.titulo}" comenzará a las ${horaFormateada}. Únete aquí: ${sesion.urlReunion}. ID: ${sesion.id}`;

          // Evitar de-duplicación inteligente buscando el ID de sesión en el contenido de notificaciones previas
          const notifExistente = await prisma.notificacion.findFirst({
            where: {
              usuarioId: student.id,
              tipo: 'sistema',
              titulo: tituloNotif,
              contenido: {
                contains: sesion.id,
              },
            },
          });

          if (notifExistente) continue; // Ya se envió el recordatorio para esta sesión

          // Crear notificación In-App
          await prisma.notificacion.create({
            data: {
              usuarioId: student.id,
              tipo: 'sistema',
              titulo: tituloNotif,
              contenido: contenidoNotif,
              urlDestino: `/dashboard`,
            },
          });

          // Enviar correo HTML premium
          const emailHtml = `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #F9FAFB; padding: 40px 20px; color: #1F2937;">
              <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <div style="background-color: #1E40AF; padding: 30px; text-align: center;">
                  <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em;">SABERHUB</h1>
                  <p style="color: #93C5FD; font-size: 14px; margin: 5px 0 0 0; font-weight: 500;">Recordatorio de Clase en Vivo</p>
                </div>
                <div style="padding: 40px 30px;">
                  <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">¡Hola, ${student.nombre}! 👋</h2>
                  <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 24px;">
                    Te recordamos que la sesión interactiva programada para el curso <strong>"${sesion.curso.titulo}"</strong> está por comenzar en menos de una hora.
                  </p>
                  
                  <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
                    <h3 style="font-size: 15px; font-weight: 700; color: #1E40AF; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">Información de Acceso</h3>
                    <table style="width: 100%; font-size: 14px; color: #374151; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 6px 0; font-weight: 600; width: 35%;">Clase:</td>
                        <td style="padding: 6px 0;">${sesion.titulo}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-weight: 600;">Hora de Inicio:</td>
                        <td style="padding: 6px 0; color: #1E40AF; font-weight: 700;">Hoy, a las ${horaFormateada}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-weight: 600;">Duración:</td>
                        <td style="padding: 6px 0;">${sesion.duracion || 60} minutos</td>
                      </tr>
                    </table>
                  </div>

                  <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 32px;">
                    Por favor, conéctate puntualmente. Puedes unirte usando el botón directo de Google Meet a continuación:
                  </p>
                  
                  <div style="text-align: center; margin-bottom: 12px;">
                    <a href="${sesion.urlReunion}" target="_blank" style="background-color: #1E40AF; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2);">
                      Entrar a la videollamada &rarr;
                    </a>
                  </div>
                </div>
                <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
                  <p style="font-size: 12px; color: #9CA3AF; margin: 0;">© 2026 SABERHUB. Todos los derechos reservados.</p>
                </div>
              </div>
            </div>
          `;

          await sendEmail({
            to: student.email,
            subject: `⏰ Recordatorio: Clase en vivo "${sesion.titulo}" comienza pronto`,
            html: emailHtml,
          });

          logs.recordatoriosEnviados++;
        } catch (err) {
          console.error(
            `Error enviando recordatorio para la sesión ${sesion.id} al estudiante ${enrollment.usuario.id}:`,
            err
          );
          logs.errores.push(
            `Recordatorio (${sesion.id} - ${enrollment.usuario.id}): ${err.message}`
          );
        }
      }
    }
  } catch (error) {
    console.error('Error general en ejecutarEscaneoAlertas:', error);
    logs.errores.push(`General: ${error.message}`);
  }

  return logs;
}
