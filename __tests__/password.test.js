import assert from 'assert';
import { hashPassword, verifyPassword } from '../lib/password.js';

console.log('==========================================');
console.log('Iniciando pruebas unitarias de hashing de contraseñas...');

async function run() {
  try {
    const password = 'SaberHub2026!Password';

    // Caso 1: Generar hash
    const hash = await hashPassword(password);
    assert.ok(hash, 'El hash generado no debe ser vacío');
    assert.strictEqual(
      hash.startsWith('$2a$') || hash.startsWith('$2b$'),
      true,
      'El hash debe ser un formato válido de bcrypt'
    );

    // Caso 2: Verificar contraseña correcta
    const coincide = await verifyPassword(password, hash);
    assert.strictEqual(coincide, true, 'La contraseña correcta debe coincidir con el hash');

    // Caso 3: Verificar contraseña incorrecta
    const noCoincide = await verifyPassword('ContrasenaIncorrecta', hash);
    assert.strictEqual(
      noCoincide,
      false,
      'Una contraseña incorrecta no debe coincidir con el hash'
    );

    console.log('✅ ¡Pruebas unitarias de hashing pasaron con éxito!');
    console.log('==========================================');
  } catch (error) {
    console.error('❌ Una o más pruebas de hashing fallaron:');
    console.error(error.message);
    process.exit(1);
  }
}

run();
