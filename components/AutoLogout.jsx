'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoLogout() {
  const router = useRouter();
  const timeoutRef = useRef(null);

  // Tiempo de inactividad permitido (30 minutos)
  const TIMEOUT_MS = 30 * 60 * 1000;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Error al cerrar sesión por inactividad', e);
    }
    // Redirigir al usuario al login con un mensaje si es posible,
    // pero como mínimo lo enviamos a /login.
    router.push('/login');
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, TIMEOUT_MS);
  };

  useEffect(() => {
    // Iniciar el temporizador
    resetTimer();

    // Eventos que reinician el temporizador
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  return null; // Este componente no renderiza nada en pantalla
}
