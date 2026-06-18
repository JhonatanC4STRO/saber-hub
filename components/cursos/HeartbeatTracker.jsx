'use client';

import { useEffect } from 'react';

export default function HeartbeatTracker({ cursoId }) {
  useEffect(() => {
    if (!cursoId) return;

    const sendPing = async () => {
      try {
        await fetch('/api/progreso/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cursoId }),
        });
      } catch (error) {
        console.error('[Heartbeat Error] No se pudo enviar el pulso de conexión:', error);
      }
    };

    // Registrar inmediatamente el primer pulso al ingresar al curso/lección
    sendPing();

    // Configurar el intervalo para enviar pulsos recurrentes cada 15 segundos (0.25 minutos)
    const interval = setInterval(sendPing, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [cursoId]);

  return null; // Componente puramente lógico e invisible
}
