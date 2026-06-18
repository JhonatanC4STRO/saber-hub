import assert from 'assert';
import { signToken, verifyToken } from '../lib/jwt';

console.log('==========================================');
console.log('Iniciando pruebas unitarias de firma y verificación de JWT...');

// Asignamos una clave JWT_SECRET para el entorno de pruebas en caso de que no esté definida
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'secreto-de-pruebas-largo-y-seguro-de-mas-de-32-caracteres';

async function run() {
  try {
    const payloadOriginal = {
      id: 'usr_12345',
      nombre: 'Juan Pérez',
      email: 'juan@saberhub.co',
      rol: 'estudiante',
    };

    // Caso 1: Generar token
    const token = await signToken(payloadOriginal);
    assert.ok(token, 'El token generado no debe estar vacío');
    assert.strictEqual(typeof token, 'string', 'El token debe ser un string');

    // Caso 2: Verificar token y validar payload
    const payloadVerificado = await verifyToken(token);
    assert.strictEqual(
      payloadVerificado.id,
      payloadOriginal.id,
      'El ID del payload verificado debe coincidir con el original'
    );
    assert.strictEqual(
      payloadVerificado.nombre,
      payloadOriginal.nombre,
      'El Nombre debe coincidir'
    );
    assert.strictEqual(payloadVerificado.email, payloadOriginal.email, 'El Email debe coincidir');
    assert.strictEqual(payloadVerificado.rol, payloadOriginal.rol, 'El Rol debe coincidir');

    // Caso 3: Verificar que un token alterado o inválido lance un error
    let errorLanzado = false;
    try {
      await verifyToken(token + 'alterado');
    } catch {
      errorLanzado = true;
    }
    assert.strictEqual(errorLanzado, true, 'Un token alterado debe fallar al ser verificado');

    console.log('✅ ¡Pruebas unitarias de JWT pasaron con éxito!');
    console.log('==========================================');
  } catch (error) {
    console.error('❌ Una o más pruebas de JWT fallaron:');
    console.error(error.message);
    process.exit(1);
  }
}

run();
