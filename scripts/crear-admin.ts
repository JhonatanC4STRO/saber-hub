import bcrypt from 'bcryptjs';
import {
  createPrisma,
  normalizeEmail,
  optionalString,
  parseArgs,
  printMode,
  required,
  validatePassword,
} from './lib/importacion';

const HELP = `
Crear o promover un administrador

Uso:
  npm run admin:create -- --email admin@dominio.com [--nombre "Nombre"] [--documento 123] [--apply]

La vista previa es el modo predeterminado. Para crear una cuenta nueva define
SABERHUB_ADMIN_PASSWORD y añade --apply. Si la cuenta ya existe, la contraseña
solo cambia cuando SABERHUB_ADMIN_PASSWORD está definida.
`;

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log(HELP.trim());
    return;
  }

  const email = normalizeEmail(args.values.email);
  const nombre = optionalString(args.values.nombre);
  const documento = optionalString(args.values.documento);
  const password = optionalString(process.env.SABERHUB_ADMIN_PASSWORD);
  if (password) validatePassword(password, 'SABERHUB_ADMIN_PASSWORD');

  const prisma = createPrisma();
  try {
    const existing = await prisma.usuario.findUnique({ where: { email }, include: { rol: true } });
    if (!existing && (!nombre || !documento)) {
      throw new Error('Para crear una cuenta nueva se requieren --nombre y --documento.');
    }
    if (!existing && !password) {
      throw new Error('Para crear una cuenta nueva define SABERHUB_ADMIN_PASSWORD.');
    }

    if (documento) {
      const owner = await prisma.usuario.findUnique({ where: { documento } });
      if (owner && owner.email !== email)
        throw new Error(`El documento ${documento} pertenece a otro usuario.`);
    }

    printMode(args.apply);
    console.log(
      existing
        ? `Se promoverá ${email} de "${existing.rol.nombre}" a "admin"${password ? ' y se cambiará su contraseña' : ''}.`
        : `Se creará el administrador ${email}.`
    );

    if (!args.apply) {
      console.log('Repite el comando con --apply para confirmar.');
      return;
    }

    await prisma.$transaction(async (tx) => {
      const role = await tx.rol.upsert({
        where: { nombre: 'admin' },
        update: {},
        create: { nombre: 'admin', descripcion: 'Administrador global de SABERHUB' },
      });

      if (existing) {
        await tx.usuario.update({
          where: { id: existing.id },
          data: {
            rolId: role.id,
            activo: true,
            verificado: true,
            ...(nombre ? { nombre } : {}),
            ...(documento ? { documento } : {}),
            ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
          },
        });
      } else {
        await tx.usuario.create({
          data: {
            nombre: required(nombre, 'nombre'),
            documento: required(documento, 'documento'),
            email,
            passwordHash: await bcrypt.hash(required(password, 'SABERHUB_ADMIN_PASSWORD'), 10),
            rolId: role.id,
            activo: true,
            verificado: true,
          },
        });
      }
    });

    console.log(
      `Administrador listo: ${email}. Cierra las sesiones anteriores e inicia sesión nuevamente.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
