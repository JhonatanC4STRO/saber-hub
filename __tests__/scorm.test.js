import assert from 'assert';

console.log('==========================================');
console.log('Iniciando pruebas unitarias de compatibilidad SCORM 1.2 & 2004...');

// Función pura de mapeo de estados SCORM extraída de app/api/progreso/scorm/route.js
function verificarSCORMCompletado(cmiObj) {
  if (!cmiObj) return false;

  const status12 = cmiObj['cmi.core.lesson_status'];
  const completion2004 = cmiObj['cmi.completion_status'];
  const success2004 = cmiObj['cmi.success_status'];

  return (
    status12 === 'completed' ||
    status12 === 'passed' ||
    completion2004 === 'completed' ||
    success2004 === 'passed'
  );
}

try {
  // --- SCORM 1.2 ---

  // Caso 1: SCORM 1.2 completado
  assert.strictEqual(
    verificarSCORMCompletado({ 'cmi.core.lesson_status': 'completed' }),
    true,
    "Debe marcar completada una lección SCORM 1.2 con estado 'completed'"
  );

  // Caso 2: SCORM 1.2 aprobado
  assert.strictEqual(
    verificarSCORMCompletado({ 'cmi.core.lesson_status': 'passed' }),
    true,
    "Debe marcar completada una lección SCORM 1.2 con estado 'passed'"
  );

  // Caso 3: SCORM 1.2 incompleto
  assert.strictEqual(
    verificarSCORMCompletado({ 'cmi.core.lesson_status': 'incomplete' }),
    false,
    "No debe marcar completada una lección SCORM 1.2 con estado 'incomplete'"
  );

  // Caso 4: SCORM 1.2 fallido
  assert.strictEqual(
    verificarSCORMCompletado({ 'cmi.core.lesson_status': 'failed' }),
    false,
    "No debe marcar completada una lección SCORM 1.2 con estado 'failed'"
  );

  // --- SCORM 2004 ---

  // Caso 5: SCORM 2004 completado
  assert.strictEqual(
    verificarSCORMCompletado({ 'cmi.completion_status': 'completed' }),
    true,
    "Debe marcar completada una lección SCORM 2004 con estado de completitud 'completed'"
  );

  // Caso 6: SCORM 2004 aprobado
  assert.strictEqual(
    verificarSCORMCompletado({ 'cmi.success_status': 'passed' }),
    true,
    "Debe marcar completada una lección SCORM 2004 con estado de éxito 'passed'"
  );

  // Caso 7: SCORM 2004 incompleto
  assert.strictEqual(
    verificarSCORMCompletado({
      'cmi.completion_status': 'incomplete',
      'cmi.success_status': 'unknown',
    }),
    false,
    'No debe marcar completada una lección SCORM 2004 con estado incompleto o éxito desconocido'
  );

  console.log('✅ ¡Pruebas unitarias de compatibilidad SCORM pasaron con éxito!');
  console.log('==========================================');
} catch (error) {
  console.error('❌ Una o más pruebas de SCORM fallaron:');
  console.error(error.message);
  process.exit(1);
}
