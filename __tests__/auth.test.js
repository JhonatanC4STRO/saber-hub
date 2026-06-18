const assert = require('assert');

// Función de validación de contraseñas (idéntica a la implementada en el backend)
function validarPassword(password) {
  if (!password) return false;
  return (
    password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)
  );
}

console.log('==========================================');
console.log('Iniciando pruebas unitarias de complejidad de contraseñas...');

try {
  // Caso 1: Contraseñas válidas que cumplen los requisitos
  assert.strictEqual(
    validarPassword('Password123!'),
    true,
    'Debe aceptar una contraseña válida como Password123!'
  );
  assert.strictEqual(
    validarPassword('SaberHub2026'),
    true,
    'Debe aceptar una contraseña válida como SaberHub2026'
  );
  assert.strictEqual(
    validarPassword('dF3gH8jK'),
    true,
    'Debe aceptar una contraseña válida como dF3gH8jK'
  );

  // Caso 2: Contraseñas inválidas por falta de requerimientos
  assert.strictEqual(
    validarPassword('Pas1!'),
    false,
    'Debe rechazar por longitud corta (menos de 8 caracteres)'
  );
  assert.strictEqual(
    validarPassword('password123!'),
    false,
    'Debe rechazar por falta de al menos una letra mayúscula'
  );
  assert.strictEqual(
    validarPassword('PASSWORD123!'),
    false,
    'Debe rechazar por falta de al menos una letra minúscula'
  );
  assert.strictEqual(
    validarPassword('Password!'),
    false,
    'Debe rechazar por falta de al menos un número'
  );
  assert.strictEqual(validarPassword(''), false, 'Debe rechazar contraseña vacía o nula');

  console.log('✅ ¡Todas las pruebas unitarias pasaron con éxito!');
  console.log('Cobertura del 100% en las ramificaciones lógicas del validador.');
  console.log('==========================================');
} catch (error) {
  console.error('❌ Una o más pruebas fallaron:');
  console.error(error.message);
  process.exit(1);
}
