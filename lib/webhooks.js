import prisma from './prisma';
import crypto from 'crypto';

/**
 * Dispara de forma asíncrona un evento webhook a todos los endpoints suscritos.
 * No bloquea la ejecución del hilo principal.
 *
 * @param {string} event Nombre del evento (ej: 'inscripcion.creada', 'certificacion.emitida')
 * @param {object} data Datos asociados al evento
 */
export async function triggerWebhook(event, data) {
  // Ejecutar de forma no bloqueante
  (async () => {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { activo: true },
      });

      const matchingWebhooks = webhooks.filter((w) => {
        const eventsList = w.eventos.split(',').map((e) => e.trim().toLowerCase());
        return eventsList.includes(event.toLowerCase());
      });

      if (matchingWebhooks.length === 0) return;

      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      const bodyString = JSON.stringify(payload);

      const promises = matchingWebhooks.map(async (webhook) => {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'X-Saberhub-Event': event,
          };

          if (webhook.secreto) {
            const hmac = crypto.createHmac('sha256', webhook.secreto);
            hmac.update(bodyString);
            headers['X-Saberhub-Signature'] = hmac.digest('hex');
          }

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: bodyString,
          });

          if (!response.ok) {
            console.warn(`[Webhook] Falló envío a ${webhook.url}. Status: ${response.status}`);
          } else {
            console.log(`[Webhook] Envío exitoso del evento ${event} a ${webhook.url}`);
          }
        } catch (webhookErr) {
          console.error(
            `[Webhook Error] Falló comunicación con ${webhook.url}:`,
            webhookErr.message
          );
        }
      });

      await Promise.all(promises);
    } catch (err) {
      console.error('[Webhook System Error]', err);
    }
  })();
}
