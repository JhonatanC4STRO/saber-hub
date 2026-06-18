import assert from 'assert';

console.log('==========================================');
console.log('Iniciando pruebas unitarias de lógica de bloqueo temporal...');

// Función pura de simulación de intentos fallidos e inicio de sesión
function calcularSiguienteEstadoLogin({
  passwordValida,
  intentosFallidosActules,
  bloqueadoHastaActual,
}) {
  const ahora = new Date();

  // 1. Verificar si está bloqueado actualmente
  if (bloqueadoHastaActual && bloqueadoHastaActual > ahora) {
    return {
      permitirAcceso: false,
      motivo: 'bloqueado',
      intentosFallidos: intentosFallidosActules,
      bloqueadoHasta: bloqueadoHastaActual,
    };
  }

  // 2. Si las credenciales son válidas
  if (passwordValida) {
    return {
      permitirAcceso: true,
      motivo: 'exito',
      intentosFallidos: 0,
      bloqueadoHasta: null,
    };
  }

  // 3. Credenciales inválidas
  const nuevosIntentos = intentosFallidosActules + 1;
  if (nuevosIntentos >= 5) {
    return {
      permitirAcceso: false,
      motivo: 'bloqueado_nuevo',
      intentosFallidos: 0, // Reiniciado
      bloqueadoHasta: new Date(ahora.getTime() + 15 * 60 * 1000), // Bloqueo de 15 minutos
    };
  }

  return {
    permitirAcceso: false,
    motivo: 'incorrecta',
    intentosFallidos: nuevosIntentos,
    bloqueadoHasta: bloqueadoHastaActual,
  };
}

try {
  const ahora = new Date();

  // Caso 1: Usuario con cuenta limpia inicia sesión con credenciales correctas
  const estado1 = calcularSiguienteEstadoLogin({
    passwordValida: true,
    intentosFallidosActules: 0,
    bloqueadoHastaActual: null,
  });
  assert.strictEqual(estado1.permitirAcceso, true);
  assert.strictEqual(estado1.intentosFallidos, 0);
  assert.strictEqual(estado1.bloqueadoHasta, null);

  // Caso 2: Intento fallido #1
  const estado2 = calcularSiguienteEstadoLogin({
    passwordValida: false,
    intentosFallidosActules: 0,
    bloqueadoHastaActual: null,
  });
  assert.strictEqual(estado2.permitirAcceso, false);
  assert.strictEqual(estado2.intentosFallidos, 1);
  assert.strictEqual(estado2.motivo, 'incorrecta');

  // Caso 3: Intento fallido #4 (ya tiene 3)
  const estado3 = calcularSiguienteEstadoLogin({
    passwordValida: false,
    intentosFallidosActules: 3,
    bloqueadoHastaActual: null,
  });
  assert.strictEqual(estado3.permitirAcceso, false);
  assert.strictEqual(estado3.intentosFallidos, 4);

  // Caso 4: Intento fallido #5 (se activa el bloqueo)
  const estado4 = calcularSiguienteEstadoLogin({
    passwordValida: false,
    intentosFallidosActules: 4,
    bloqueadoHastaActual: null,
  });
  assert.strictEqual(estado4.permitirAcceso, false);
  assert.strictEqual(estado4.intentosFallidos, 0); // se resetea al bloquear
  assert.ok(estado4.bloqueadoHasta instanceof Date);
  assert.strictEqual(estado4.motivo, 'bloqueado_nuevo');

  const diferenciaMinutos = (estado4.bloqueadoHasta.getTime() - ahora.getTime()) / (1000 * 60);
  assert.ok(
    diferenciaMinutos >= 14.9 && diferenciaMinutos <= 15.1,
    'El bloqueo debe ser de aproximadamente 15 minutos'
  );

  // Caso 5: Intentar loguearse estando bloqueado activamente
  const bloqueadoActivo = new Date(ahora.getTime() + 10 * 60 * 1000); // bloqueado hace 5 min, faltan 10
  const estado5 = calcularSiguienteEstadoLogin({
    passwordValida: true, // credenciales correctas pero sigue bloqueado
    intentosFallidosActules: 0,
    bloqueadoHastaActual: bloqueadoActivo,
  });
  assert.strictEqual(
    estado5.permitirAcceso,
    false,
    'No debe permitir el acceso si sigue bloqueado'
  );
  assert.strictEqual(estado5.motivo, 'bloqueado');
  assert.strictEqual(estado5.bloqueadoHasta, bloqueadoActivo);

  // Caso 6: Intentar loguearse después de expirar el bloqueo
  const bloqueoExpirado = new Date(ahora.getTime() - 1 * 60 * 1000); // expirado hace 1 minuto
  const estado6 = calcularSiguienteEstadoLogin({
    passwordValida: true,
    intentosFallidosActules: 0,
    bloqueadoHastaActual: bloqueoExpirado,
  });
  assert.strictEqual(
    estado6.permitirAcceso,
    true,
    'Debe permitir el acceso si el bloqueo ya expiró'
  );
  assert.strictEqual(estado6.intentosFallidos, 0);
  assert.strictEqual(estado6.bloqueadoHasta, null);

  console.log('✅ ¡Pruebas de lógica de bloqueo temporal pasaron con éxito!');
  console.log('==========================================');
} catch (error) {
  console.error('❌ Una o más pruebas de bloqueo fallaron:');
  console.error(error.message);
  process.exit(1);
}
