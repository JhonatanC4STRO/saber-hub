import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { PartialScraperStats } from './types';

const ERROR_ALERT_THRESHOLD = 10;

/**
 * Creates an initial LogScraping record
 */
export async function createScraperLog(fuenteNombre: string): Promise<string> {
  const log = await prisma.logScraping.create({
    data: {
      fuente: fuenteNombre,
      fechaEjecucion: new Date(),
      cursosEncontrados: 0,
      cursosNuevos: 0,
      cursosActualizados: 0,
      errores: 0,
      exitoso: false
    }
  });
  return log.id;
}

/**
 * Updates an existing LogScraping record with intermediate progress
 */
export async function updateScraperLogProgress(
  logId: string,
  stats: PartialScraperStats
): Promise<void> {
  await prisma.logScraping.update({
    where: { id: logId },
    data: {
      cursosEncontrados: stats.encontrados,
      cursosNuevos: stats.nuevos,
      cursosActualizados: stats.actualizados,
      errores: stats.errores,
      detalleErrores: stats.detalleErrores && stats.detalleErrores.length > 0
        ? stats.detalleErrores.slice(0, 50).join('\n')
        : null
    }
  });
}

/**
 * Finalizes the LogScraping record and checks if email alert is required
 */
export async function finalizeScraperLog(
  logId: string,
  stats: PartialScraperStats,
  exitoso: boolean,
  duracionMs: number
): Promise<void> {
  await prisma.logScraping.update({
    where: { id: logId },
    data: {
      cursosEncontrados: stats.encontrados,
      cursosNuevos: stats.nuevos,
      cursosActualizados: stats.actualizados,
      errores: stats.errores,
      detalleErrores: stats.detalleErrores && stats.detalleErrores.length > 0
        ? stats.detalleErrores.slice(0, 50).join('\n')
        : null,
      exitoso,
      duracionMs
    }
  });

  // Check error alert threshold
  if (stats.errores >= ERROR_ALERT_THRESHOLD) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const fuente = await prisma.logScraping.findUnique({
        where: { id: logId },
        select: { fuente: true }
      });
      const sourceName = fuente?.fuente || 'Scraper';

      sendEmail({
        to: adminEmail,
        subject: `⚠ SABERHUB — Scraper ${sourceName}: ${stats.errores} errores`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;padding:20px;border:1px solid #E5E7EB;border-radius:8px">
            <h2 style="color:#DC2626;margin-top:0">Alerta de errores en Scraper</h2>
            <p>Se detectaron <strong>${stats.errores}</strong> errores durante la ejecución de <strong>${sourceName}</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:15px 0">
              <tr style="background:#F9FAFB">
                <th style="border:1px solid #E5E7EB;padding:8px;text-align:left">Encontrados</th>
                <th style="border:1px solid #E5E7EB;padding:8px;text-align:left">Nuevos</th>
                <th style="border:1px solid #E5E7EB;padding:8px;text-align:left">Actualizados</th>
                <th style="border:1px solid #E5E7EB;padding:8px;text-align:left">Errores</th>
              </tr>
              <tr>
                <td style="border:1px solid #E5E7EB;padding:8px">${stats.encontrados}</td>
                <td style="border:1px solid #E5E7EB;padding:8px">${stats.nuevos}</td>
                <td style="border:1px solid #E5E7EB;padding:8px">${stats.actualizados}</td>
                <td style="border:1px solid #E5E7EB;padding:8px;color:#DC2626;font-weight:bold">${stats.errores}</td>
              </tr>
            </table>
            <p><strong>Últimos errores registrados (primeros 20):</strong></p>
            <pre style="background:#F3F4F6;padding:12px;font-size:12px;border-radius:4px;overflow-x:auto;max-height:200px">${
              stats.detalleErrores ? stats.detalleErrores.slice(0, 20).join('\n') : 'Ninguno'
            }</pre>
          </div>
        `
      }).catch(err => console.error('[email-alert] Error sending warning email:', err));
    }
  }
}
