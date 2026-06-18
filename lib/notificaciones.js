import prisma from './prisma';
import { sendEmail } from './email';

/**
 * Envía una notificación configurada al usuario.
 * Evalúa las preferencias del usuario para In-App y Email de la categoría correspondiente.
 *
 * @param {Object} params
 * @param {string} params.usuarioId - ID del destinatario
 * @param {'inscripcion'|'evaluacion'|'certificado'|'foro'|'mensaje'|'sesion'|'solicitud_instructor'|'sistema'} params.tipo - Tipo de notificación
 * @param {string} params.titulo - Título / Asunto
 * @param {string} [params.contenido] - Contenido descriptivo o cuerpo del mensaje
 * @param {string} [params.urlDestino] - URL relativa o absoluta para la acción
 * @param {string} [params.plantillaHtml] - HTML personalizado para el correo. Si no se provee, se usará una plantilla premium por defecto.
 */
export async function enviarNotificacionConfigurada({
  usuarioId,
  tipo,
  titulo,
  contenido = '',
  urlDestino = null,
  plantillaHtml = null,
}) {
  try {
    // 1. Obtener usuario y sus preferencias de notificación
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        email: true,
        prefEmailInscripcion: true,
        prefInAppInscripcion: true,
        prefEmailEvaluacion: true,
        prefInAppEvaluacion: true,
        prefEmailCertificado: true,
        prefInAppCertificado: true,
        prefEmailForo: true,
        prefInAppForo: true,
        prefEmailMensaje: true,
        prefInAppMensaje: true,
        prefEmailSesion: true,
        prefInAppSesion: true,
        prefEmailSolicitud: true,
        prefInAppSolicitud: true,
      },
    });

    if (!usuario) {
      console.error(`[Notificaciones] Usuario no encontrado: ${usuarioId}`);
      return;
    }

    // Mapear el tipo de notificación al campo booleano de la tabla Usuario
    const mapTipoAPreferencia = {
      inscripcion: { email: 'prefEmailInscripcion', inApp: 'prefInAppInscripcion' },
      evaluacion: { email: 'prefEmailEvaluacion', inApp: 'prefInAppEvaluacion' },
      certificado: { email: 'prefEmailCertificado', inApp: 'prefInAppCertificado' },
      foro: { email: 'prefEmailForo', inApp: 'prefInAppForo' },
      mensaje: { email: 'prefEmailMensaje', inApp: 'prefInAppMensaje' },
      sesion: { email: 'prefEmailSesion', inApp: 'prefInAppSesion' },
      solicitud_instructor: { email: 'prefEmailSolicitud', inApp: 'prefInAppSolicitud' },
    };

    const pref = mapTipoAPreferencia[tipo];

    // Si es un tipo no mapeado (como 'sistema'), por defecto es true
    const enviarInApp = pref ? usuario[pref.inApp] : true;
    const enviarEmail = pref ? usuario[pref.email] : true;

    // 2. Creación de Notificación In-App si está habilitada
    if (enviarInApp) {
      await prisma.notificacion.create({
        data: {
          usuarioId,
          tipo: tipo === 'sesion' ? 'sistema' : tipo, // Mapear temporalmente al enum en base de datos si es necesario (ya agregamos 'sesion' al enum, por lo que es directo)
          titulo,
          contenido,
          urlDestino,
        },
      });
    }

    // 3. Envío de Correo Electrónico si está habilitado y tiene correo
    if (enviarEmail && usuario.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const actionUrl = urlDestino
        ? urlDestino.startsWith('http')
          ? urlDestino
          : `${appUrl}${urlDestino}`
        : appUrl;

      // Usar plantilla provista o una por defecto con estética premium
      const htmlBody =
        plantillaHtml ||
        `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #F9FAFB; padding: 40px 20px; color: #1F2937;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
            <div style="background: linear-gradient(135deg, #1E40AF, #3B82F6); padding: 30px; text-align: center;">
              <h1 style="color: #FFFFFF; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.025em; text-transform: uppercase;">SABERHUB</h1>
              <p style="color: #D1E2FF; font-size: 14px; margin: 6px 0 0 0; font-weight: 500; letter-spacing: 0.05em;">Plataforma de Aprendizaje</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">¡Hola, ${usuario.nombre}! 👋</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #4B5563; margin-bottom: 24px;">
                ${titulo}
              </p>
              ${
                contenido
                  ? `
              <div style="background-color: #F3F4F6; border-left: 4px solid #3B82F6; padding: 18px; border-radius: 6px; margin-bottom: 28px;">
                <p style="font-size: 15px; line-height: 1.5; color: #1F2937; margin: 0; white-space: pre-line;">
                  ${contenido}
                </p>
              </div>
              `
                  : ''
              }
              <div style="text-align: center; margin-top: 32px;">
                <a href="${actionUrl}" style="background-color: #1E40AF; color: #FFFFFF; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.2); transition: all 0.2s;">
                  Ver en la plataforma &rarr;
                </a>
              </div>
            </div>
            <div style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #F0F2F5;">
              <p style="font-size: 11px; color: #9CA3AF; margin: 0 0 6px 0;">Recibes este correo automático porque tienes activado el canal de correo para "${tipo}" en tus ajustes de notificación.</p>
              <p style="font-size: 11px; color: #9CA3AF; margin: 0;">© 2026 SABERHUB. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        to: usuario.email,
        subject: titulo,
        html: htmlBody,
      });
    }
  } catch (error) {
    console.error(`[enviarNotificacionConfigurada Error]`, error);
  }
}
