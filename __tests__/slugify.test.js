const assert = require('assert');
const { slugify } = require('../lib/slugify.js');

console.log('==========================================');
console.log('Iniciando pruebas unitarias de slugify...');

try {
  // Caso 1: Texto normal sin acentos ni espacios
  assert.strictEqual(slugify('saberhub'), 'saberhub', 'Debe mantener texto simple idéntico');

  // Caso 2: Texto con mayúsculas (debe convertir a minúsculas)
  assert.strictEqual(slugify('SaberHub'), 'saberhub', 'Debe convertir mayúsculas a minúsculas');

  // Caso 3: Texto con espacios
  assert.strictEqual(
    slugify('curso de nextjs'),
    'curso-de-nextjs',
    'Debe reemplazar espacios por guiones'
  );

  // Caso 4: Texto con acentos y diacríticos (debe normalizar y remover acentos)
  assert.strictEqual(
    slugify('Colección de Matemáticas Avanzadas y Álgebra'),
    'coleccion-de-matematicas-avanzadas-y-algebra',
    'Debe remover acentos y caracteres diacríticos'
  );

  // Caso 5: Caracteres especiales y símbolos (debe remover caracteres no permitidos)
  assert.strictEqual(
    slugify('¡Aprende React hoy! #100DaysOfCode?'),
    'aprende-react-hoy-100daysofcode',
    'Debe remover signos de exclamación, interrogación, numerales y símbolos'
  );

  // Caso 6: Múltiples guiones consecutivos (debe colapsar a un solo guion)
  assert.strictEqual(
    slugify('saber---hub---lms'),
    'saber-hub-lms',
    'Debe colapsar guiones múltiples'
  );

  // Caso 7: Guiones al inicio y al final (debe eliminarlos)
  assert.strictEqual(
    slugify('-saberhub-'),
    'saberhub',
    'Debe eliminar guiones al inicio y al final'
  );

  // Caso 8: Entrada vacía, nula o indefinida
  assert.strictEqual(slugify(''), '', 'Debe devolver string vacío para entrada vacía');
  assert.strictEqual(slugify(null), '', 'Debe devolver string vacío para null');

  console.log('✅ ¡Pruebas unitarias de slugify pasaron con éxito!');
  console.log('==========================================');
} catch (error) {
  console.error('❌ Una o más pruebas de slugify fallaron:');
  console.error(error.message);
  process.exit(1);
}
