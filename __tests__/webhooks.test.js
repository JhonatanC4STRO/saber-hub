import assert from 'assert';
import crypto from 'crypto';

console.log('==========================================');
console.log('Iniciando pruebas unitarias de firma de Webhooks...');

// Función pura que emula la generación de firma criptográfica HMAC-SHA256
function generarFirmaWebhook(payload, secreto) {
  const bodyString = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secreto);
  hmac.update(bodyString);
  return hmac.digest('hex');
}

try {
  const secretoPrueba = 'secreto_super_seguro_de_saberhub_2026';
  const payloadPrueba = {
    event: 'inscripcion.creada',
    data: {
      usuarioId: 'usr_999',
      cursoId: 'cur_python',
      email: 'alumno@saberhub.co',
    },
    timestamp: '2026-05-23T21:00:00.000Z',
  };

  // Caso 1: Firma determinista (el mismo input produce la misma firma)
  const firma1 = generarFirmaWebhook(payloadPrueba, secretoPrueba);
  const firma2 = generarFirmaWebhook(payloadPrueba, secretoPrueba);

  assert.ok(firma1, 'La firma no debe ser nula o vacía');
  assert.strictEqual(
    firma1,
    firma2,
    'La misma firma debe ser determinista ante idénticos parámetros'
  );
  assert.strictEqual(
    firma1.length,
    64,
    'La firma en formato hexadecimal de SHA256 debe tener exactamente 64 caracteres'
  );

  // Caso 2: Firma diferente ante un secreto diferente
  const firmaSecretoDiferente = generarFirmaWebhook(payloadPrueba, 'secreto_incorrecto');
  assert.notStrictEqual(
    firma1,
    firmaSecretoDiferente,
    'La firma debe cambiar si el secreto es diferente'
  );

  // Caso 3: Firma diferente ante cambio en el payload (prevención de manipulación de datos)
  const payloadAlterado = {
    ...payloadPrueba,
    data: {
      ...payloadPrueba.data,
      usuarioId: 'usr_666', // Alterado
    },
  };
  const firmaPayloadAlterado = generarFirmaWebhook(payloadAlterado, secretoPrueba);
  assert.notStrictEqual(
    firma1,
    firmaPayloadAlterado,
    'La firma debe alterarse si el payload es modificado'
  );

  // Caso 4: Verificación manual de autenticidad en cliente
  const hmacVerificacion = crypto.createHmac('sha256', secretoPrueba);
  hmacVerificacion.update(JSON.stringify(payloadPrueba));
  const firmaEsperada = hmacVerificacion.digest('hex');

  assert.strictEqual(
    firma1,
    firmaEsperada,
    'La firma generada debe coincidir exactamente con el cálculo nativo hex'
  );

  console.log('✅ ¡Pruebas unitarias de firma de Webhooks pasaron con éxito!');
  console.log('==========================================');
} catch (error) {
  console.error('❌ Una o más pruebas de Webhooks fallaron:');
  console.error(error.message);
  process.exit(1);
}
