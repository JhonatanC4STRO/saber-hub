import nodemailer from 'nodemailer';

function createTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html }) {
  // --- CONTROL DE PRUEBAS / CORREOS FALSOS ---
  if (process.env.SMTP_BLOCK_DEMO_EMAILS === 'true') {
    const redirectTarget = process.env.SMTP_REDIRECT_TARGET;
    if (redirectTarget) {
      console.log(`[Email-Redirect] Redirigiendo correo destinado a <${to}> hacia <${redirectTarget}> para evitar rebotes (bounce-backs).`);
      to = redirectTarget;
    } else {
      console.log(`[Email-Simulado] Simulación activa. Envío cancelado a <${to}> para evitar rebotes. Asunto: ${subject}`);
      return;
    }
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[Email] SMTP no configurado. Destinatario: ${to} | Asunto: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}
