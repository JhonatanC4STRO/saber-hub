import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import {
  createPrisma,
  normalizeEmail,
  optionalString,
  parseArgs,
  parseOptionalBoolean,
  printMode,
  required,
  resolveInputPath,
  validatePassword,
} from './lib/importacion';

type RawUser = Record<string, unknown>;
type RoleName = 'admin' | 'instructor' | 'estudiante';
type PreparedUser = {
  nombre: string;
  email: string;
  documento: string;
  rol: RoleName;
  password?: string;
  telefono?: string;
  activo?: boolean;
  verificado?: boolean;
};

const VALID_ROLES = new Set<RoleName>(['admin', 'instructor', 'estudiante']);
const HELP = `
Importar usuarios desde CSV, XLSX o JSON

Uso:
  npm run users:import -- --file scripts/data/usuarios.ejemplo.csv [--apply]

Columnas: nombre,email,documento,rol,password,telefono,activo,verificado
Para cuentas nuevas, usa la columna password o SABERHUB_DEFAULT_PASSWORD.
La vista previa es el modo predeterminado.
`;

function loadRows(file: string): RawUser[] {
  if (path.extname(file).toLowerCase() === '.json') {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('El JSON de usuarios debe contener un arreglo.');
    return parsed;
  }

  const workbook = XLSX.readFile(file, { raw: false });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error('El archivo no contiene hojas.');
  return XLSX.utils.sheet_to_json<RawUser>(workbook.Sheets[firstSheet], { defval: '' });
}

function prepareRow(row: RawUser, index: number, defaultPassword?: string): PreparedUser {
  try {
    const role = required(row.rol, 'rol').toLowerCase() as RoleName;
    if (!VALID_ROLES.has(role)) throw new Error(`rol inválido: ${role}`);
    const password = optionalString(row.password) || defaultPassword;
    if (password) validatePassword(password, 'password');
    return {
      nombre: required(row.nombre, 'nombre'),
      email: normalizeEmail(row.email),
      documento: required(row.documento, 'documento'),
      rol: role,
      password,
      telefono: optionalString(row.telefono),
      activo: parseOptionalBoolean(row.activo),
      verificado: parseOptionalBoolean(row.verificado),
    };
  } catch (error) {
    throw new Error(`Fila ${index + 2}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log(HELP.trim());
    return;
  }

  const input = resolveInputPath(required(args.values.file, 'file'));
  const defaultPassword = optionalString(process.env.SABERHUB_DEFAULT_PASSWORD);
  if (defaultPassword) validatePassword(defaultPassword, 'SABERHUB_DEFAULT_PASSWORD');

  const rows = loadRows(input);
  if (rows.length === 0) throw new Error('El archivo no contiene usuarios.');
  const users = rows.map((row, index) => prepareRow(row, index, defaultPassword));
  const emails = new Set<string>();
  const documents = new Set<string>();
  const phones = new Set<string>();
  for (const user of users) {
    if (emails.has(user.email)) throw new Error(`Correo repetido en el archivo: ${user.email}`);
    if (documents.has(user.documento))
      throw new Error(`Documento repetido en el archivo: ${user.documento}`);
    emails.add(user.email);
    documents.add(user.documento);
    if (user.telefono) {
      if (phones.has(user.telefono))
        throw new Error(`Teléfono repetido en el archivo: ${user.telefono}`);
      phones.add(user.telefono);
    }
  }

  const prisma = createPrisma();
  try {
    const existing = await prisma.usuario.findMany({
      where: {
        OR: [
          { email: { in: [...emails] } },
          { documento: { in: [...documents] } },
          ...(phones.size > 0 ? [{ telefono: { in: [...phones] } }] : []),
        ],
      },
      select: { id: true, email: true, documento: true, telefono: true },
    });
    const byEmail = new Map(existing.map((user) => [user.email, user]));
    for (const user of users) {
      const documentOwner = existing.find((item) => item.documento === user.documento);
      if (documentOwner && documentOwner.email !== user.email) {
        throw new Error(`El documento ${user.documento} ya pertenece a ${documentOwner.email}.`);
      }
      const phoneOwner = user.telefono
        ? existing.find((item) => item.telefono === user.telefono)
        : undefined;
      if (phoneOwner && phoneOwner.email !== user.email) {
        throw new Error(`El teléfono ${user.telefono} ya pertenece a ${phoneOwner.email}.`);
      }
      if (!byEmail.has(user.email) && !user.password) {
        throw new Error(
          `${user.email}: falta password o SABERHUB_DEFAULT_PASSWORD para crear la cuenta.`
        );
      }
    }

    const creates = users.filter((user) => !byEmail.has(user.email)).length;
    const updates = users.length - creates;
    printMode(args.apply);
    console.log(`Archivo: ${input}`);
    console.log(`Usuarios: ${users.length} (${creates} nuevos, ${updates} actualizaciones).`);
    if (!args.apply) {
      console.log('Repite el comando con --apply para confirmar.');
      return;
    }

    const prepared = await Promise.all(
      users.map(async (user) => ({
        ...user,
        passwordHash: user.password ? await bcrypt.hash(user.password, 10) : undefined,
      }))
    );

    await prisma.$transaction(async (tx) => {
      const roles = new Map<string, string>();
      for (const name of VALID_ROLES) {
        const role = await tx.rol.upsert({
          where: { nombre: name },
          update: {},
          create: { nombre: name, descripcion: `Rol de ${name}` },
        });
        roles.set(name, role.id);
      }

      for (const user of prepared) {
        const data = {
          nombre: user.nombre,
          documento: user.documento,
          rolId: required(roles.get(user.rol), `rol ${user.rol}`),
          ...(user.activo !== undefined ? { activo: user.activo } : {}),
          ...(user.verificado !== undefined ? { verificado: user.verificado } : {}),
          ...(user.telefono !== undefined ? { telefono: user.telefono } : {}),
          ...(user.passwordHash ? { passwordHash: user.passwordHash } : {}),
        };
        const current = byEmail.get(user.email);
        if (current) {
          await tx.usuario.update({ where: { id: current.id }, data });
        } else {
          await tx.usuario.create({
            data: {
              ...data,
              email: user.email,
              activo: user.activo ?? true,
              verificado: user.verificado ?? false,
              passwordHash: required(user.passwordHash, 'passwordHash'),
            },
          });
        }
      }
    });

    console.log(`Importación completada: ${creates} creados y ${updates} actualizados.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
