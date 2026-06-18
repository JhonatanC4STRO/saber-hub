import assert from 'assert';

console.log('==========================================');
console.log('Iniciando pruebas unitarias de videoconferencias (Meet/Zoom)...');

// Funciones puras extraídas de app/api/cursos/[id]/sesiones/route.js
function generateRandomMeetCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part1 = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  const part2 = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  const part3 = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${part1}-${part2}-${part3}`;
}

function autoGenerarLinkReunion(plataforma) {
  if (plataforma === 'zoom') {
    const meetingId = Math.floor(100000000 + Math.random() * 900000000);
    const password = Math.random().toString(36).substring(2, 10);
    return `https://zoom.us/j/${meetingId}?pwd=${password}`;
  } else {
    return `https://meet.google.com/${generateRandomMeetCode()}`;
  }
}

try {
  // Caso 1: Validar formato del código aleatorio de Google Meet (xxx-xxxx-xxx)
  const meetCode = generateRandomMeetCode();
  assert.strictEqual(
    meetCode.length,
    12,
    'El código de Meet debe tener exactamente 12 caracteres (incluyendo 2 guiones)'
  );

  const regexMeet = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
  assert.ok(
    regexMeet.test(meetCode),
    'El código de Meet debe seguir el patrón regular de 3letras-4letras-3letras'
  );

  // Caso 2: Autogenerar link de Zoom
  const zoomLink = autoGenerarLinkReunion('zoom');
  assert.ok(
    zoomLink.includes('zoom.us/j/'),
    'El link de Zoom debe contener el dominio oficial de Zoom Meetings'
  );
  assert.ok(
    zoomLink.includes('?pwd='),
    'El link de Zoom debe incorporar parámetros de contraseña segura auto-generada'
  );

  // Caso 3: Autogenerar link de Google Meet
  const meetLink = autoGenerarLinkReunion('meet');
  assert.ok(
    meetLink.includes('meet.google.com/'),
    'El link de Meet debe contener el dominio oficial de Google Meet'
  );
  const parsedCode = meetLink.split('/').pop();
  assert.ok(regexMeet.test(parsedCode), 'El código en el link de Meet debe ser un formato válido');

  console.log('✅ ¡Pruebas unitarias de videoconferencias pasaron con éxito!');
  console.log('==========================================');
} catch (error) {
  console.error('❌ Una o más pruebas de videoconferencias fallaron:');
  console.error(error.message);
  process.exit(1);
}
