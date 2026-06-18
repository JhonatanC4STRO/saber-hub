import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const usuario = await verifyToken(token);

    if (usuario.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
    }

    const solicitud = await prisma.solicitudInstructor.findUnique({
      where: { id: params.id },
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true, documento: true, fechaRegistro: true },
        },
        revisor: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (!solicitud) {
      return new Response(JSON.stringify({ error: 'No encontrada' }), { status: 404 });
    }

    return new Response(JSON.stringify({ solicitud }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const usuario = await verifyToken(token);

    if (usuario.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
    }

    const body = await request.json();
    const { estado, motivo } = body;

    const solicitud = await prisma.solicitudInstructor.update({
      where: { id: params.id },
      data: {
        estado,
        fechaRevision: new Date(),
        revisorId: usuario.id,
        motivoRechazo: motivo || null,
      },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
      },
    });

    // Si se aprueba, hacer usuario instructor
    if (estado === 'aprobada') {
      const rolInstructor = await prisma.rol.findUnique({ where: { nombre: 'instructor' } });
      if (rolInstructor) {
        await prisma.usuario.update({
          where: { id: solicitud.usuarioId },
          data: { rolId: rolInstructor.id },
        });
      }

      // La notificación y el correo se enviarán de forma unificada abajo usando el despachador configurado.

      // 2. Enviar correo HTML de bienvenida premium
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const welcomeHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f3f4f6;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.05em;
      margin: 0;
      text-transform: uppercase;
    }
    .logo span {
      color: #10b981;
    }
    .badge {
      display: inline-block;
      background-color: #10b981;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      margin-top: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 40px 32px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    p {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .steps-container {
      background-color: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .step-number {
      width: 28px;
      height: 28px;
      background-color: #dbeafe;
      color: #1e40af;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      margin-right: 16px;
      flex-shrink: 0;
    }
    .step-text {
      flex: 1;
    }
    .step-title {
      font-size: 14px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .step-desc {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      background-color: #1e40af;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(30, 64, 175, 0.2);
    }
    .footer {
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h2 class="logo">SABER<span>HUB</span></h2>
        <div class="badge">Instructor Aprobado</div>
      </div>
      <div class="content">
        <h1>¡Felicidades, ${solicitud.usuario.nombre}! 🎉</h1>
        <p>Nos complace enormemente informarte que tu solicitud para convertirte en instructor ha sido aprobada. A partir de este momento, tu cuenta cuenta con privilegios completos para crear y publicar cursos gratuitos en SABERHUB.</p>
        
        <div class="steps-container">
          <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; color: #4b5563;">Pasos para crear tu primer curso:</h3>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="padding-bottom: 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td valign="top" width="44">
                      <div class="step-number">1</div>
                    </td>
                    <td valign="top" class="step-text">
                      <div class="step-title">Inicia Sesión en SABERHUB</div>
                      <div class="step-desc">Accede a tu cuenta habitual utilizando tus credenciales de acceso.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td valign="top" style="padding-bottom: 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td valign="top" width="44">
                      <div class="step-number">2</div>
                    </td>
                    <td valign="top" class="step-text">
                      <div class="step-title">Ve a la Sección "Crear Cursos"</div>
                      <div class="step-desc">En tu panel lateral o barra de navegación, verás la nueva y potente opción exclusiva para instructores.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td valign="top" style="padding-bottom: 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td valign="top" width="44">
                      <div class="step-number">3</div>
                    </td>
                    <td valign="top" class="step-text">
                      <div class="step-title">Configura la Información Básica</div>
                      <div class="step-desc">Establece el título, descripción general, categoría y carga una imagen de portada premium que atraiga a tus estudiantes.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td valign="top">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td valign="top" width="44">
                      <div class="step-number">4</div>
                    </td>
                    <td valign="top" class="step-text">
                      <div class="step-title">Añade Módulos y Lecciones</div>
                      <div class="step-desc">Diseña tu plan de estudios agregando lecciones de video, textos informativos, archivos adjuntos y cuestionarios de evaluación. ¡Una vez listo, publícalo!</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        
        <div class="cta-container">
          <a href="${appUrl}/dashboard" class="btn">Comenzar ahora en SABERHUB</a>
        </div>
        
        <p style="margin-bottom: 0; font-size: 14px; text-align: center;">¡Gracias por compartir tu valioso conocimiento con nuestra comunidad!</p>
      </div>
      <div class="footer">
        <p style="margin: 0; font-size: 11px;">Este es un correo automático. Por favor no respondas a este mensaje.</p>
        <p style="margin: 6px 0 0 0; font-size: 11px;">&copy; 2026 SABERHUB. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      try {
        await enviarNotificacionConfigurada({
          usuarioId: solicitud.usuarioId,
          tipo: 'solicitud_instructor',
          titulo: '¡Tu solicitud de Instructor ha sido aprobada! 🎉',
          contenido:
            'Felicitaciones, ahora eres oficialmente un Instructor en SABERHUB. Ya puedes acceder al panel de instructor y comenzar a crear tus propios cursos.',
          urlDestino: '/dashboard',
          plantillaHtml: welcomeHtml,
        });
      } catch (err) {
        console.error('[Error al notificar aprobacion de instructor]', err);
      }
    }

    // Si se rechaza, notificar y enviar email
    if (estado === 'rechazada') {
      const motivoStr =
        motivo || 'Tu postulación no cumple con los criterios mínimos de experiencia.';

      // 2. Enviar correo HTML de rechazo y notificar In-App
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const rejectionHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f3f4f6;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
    }
    .header {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      padding: 40px 32px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.05em;
      margin: 0;
      text-transform: uppercase;
    }
    .logo span {
      color: #ef4444;
    }
    .badge {
      display: inline-block;
      background-color: #f59e0b;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      margin-top: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 40px 32px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    p {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .reason-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      padding: 20px;
      margin-bottom: 32px;
    }
    .reason-title {
      font-size: 14px;
      font-weight: 700;
      color: #b45309;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .reason-text {
      font-size: 14px;
      color: #78350f;
      line-height: 1.5;
      font-style: italic;
    }
    .cooldown-info {
      font-size: 13px;
      color: #ef4444;
      font-weight: 700;
      background-color: #fef2f2;
      padding: 12px 16px;
      border-radius: 6px;
      border: 1px solid #fee2e2;
      margin-bottom: 32px;
      text-align: center;
    }
    .cta-container {
      text-align: center;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      background-color: #4b5563;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(75, 85, 99, 0.2);
    }
    .footer {
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h2 class="logo">SABER<span>HUB</span></h2>
        <div class="badge">Estatus de Solicitud</div>
      </div>
      <div class="content">
        <h1>Hola, ${solicitud.usuario.nombre}</h1>
        <p>Queremos agradecer sinceramente tu interés en convertirte en instructor de SABERHUB y por el tiempo dedicado al completar tu postulación y adjuntar tus credenciales.</p>
        <p>Nuestro equipo de administración ha revisado detenidamente tu solicitud, incluyendo tu experiencia descrita y documentos de soporte adjuntos. Lamentablemente, en esta ocasión hemos decidido no aprobar tu postulación debido al siguiente motivo:</p>
        
        <div class="reason-box">
          <div class="reason-title">Motivo de la Decisión</div>
          <div class="reason-text">"${motivoStr}"</div>
        </div>
        
        <div class="cooldown-info">
          ⏳ Periodo de Cooldown Activo: Podrás realizar una nueva postulación en un plazo de 30 días a partir de hoy.
        </div>
        
        <p>Te animamos a seguir enriqueciendo tu portafolio, pulir tus certificaciones o profundizar en tu especialidad para que puedas presentarte con una propuesta más robusta en el futuro.</p>
        
        <div class="cta-container">
          <a href="${appUrl}/dashboard/solicitud-instructor" class="btn">Consultar Estatus en SABERHUB</a>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0; font-size: 11px;">Este es un correo automático. Por favor no respondas a este mensaje.</p>
        <p style="margin: 6px 0 0 0; font-size: 11px;">&copy; 2026 SABERHUB. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      try {
        await enviarNotificacionConfigurada({
          usuarioId: solicitud.usuarioId,
          tipo: 'solicitud_instructor',
          titulo: 'Actualización sobre tu solicitud de Instructor ⏳',
          contenido: `Tu solicitud no pudo ser aprobada. Motivo: ${motivoStr}`,
          urlDestino: '/dashboard/solicitud-instructor',
          plantillaHtml: rejectionHtml,
        });
      } catch (err) {
        console.error('[Rejection Notification Error]', err);
      }
    }

    return new Response(JSON.stringify({ solicitud, success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
