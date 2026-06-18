import http from 'k6/http';
import { sleep, check } from 'k6';

// 1. Configuración de Umbrales y Escenarios de Carga (k6)
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Escalar a 100 usuarios en 30 segundos
    { duration: '1m', target: 500 }, // Escalar a 500 usuarios concurrentes en 1 minuto
    { duration: '1m', target: 500 }, // Mantener 500 usuarios durante 1 minuto
    { duration: '30s', target: 0 }, // Escalar a 0 usuarios (descarga de carga)
  ],
  thresholds: {
    // Criterio de aceptación 1: Respuestas del usuario en p(95) < 2 segundos (2000 ms)
    http_req_duration: ['p(95)<2000'],
    // Menos del 1% de errores en peticiones bajo carga
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// 2. Ruta y Flujo de Interacción del Estudiante
export default function () {
  // A. Acceso a la página de login (Visualización estática)
  let loginPageRes = http.get(`${BASE_URL}/login`);
  check(loginPageRes, {
    'Vista Login responde 200': (r) => r.status === 200,
  });
  sleep(1);

  // B. Simulación de autenticación mediante API POST
  const credentials = JSON.stringify({
    email: 'estudiante@saberhub.co',
    password: 'Password123!',
  });
  const headers = { 'Content-Type': 'application/json' };

  let loginApiRes = http.post(`${BASE_URL}/api/auth/login`, credentials, { headers });
  check(loginApiRes, {
    'API Login responde 200 o credenciales inválidas conocidas': (r) =>
      r.status === 200 || r.status === 401,
  });
  sleep(2);

  // C. Navegación al Dashboard principal
  let dashboardRes = http.get(`${BASE_URL}/dashboard`);
  check(dashboardRes, {
    'Dashboard responde 200 o redirecciona': (r) => r.status === 200 || r.status === 302,
  });
  sleep(2);

  // D. Simulación del pulso de conexión (Heartbeat) - Interacción significativa
  // (Actualiza el tiempo conectado del alumno de forma concurrente)
  const heartbeatPayload = JSON.stringify({
    cursoId: 'clalj84hs00003b6wexwexwex', // Curso ID de pruebas
  });

  let heartbeatRes = http.post(`${BASE_URL}/api/progreso/heartbeat`, heartbeatPayload, { headers });
  check(heartbeatRes, {
    'API Heartbeat responde correctamente (200 o no inscrito esperado)': (r) =>
      r.status === 200 || r.status === 404 || r.status === 401,
  });
  sleep(15); // Espera de ciclo típica de heartbeat
}
