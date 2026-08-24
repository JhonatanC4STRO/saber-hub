import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '../../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export type CliArgs = {
  apply: boolean;
  help: boolean;
  values: Record<string, string>;
};

export function parseArgs(argv = process.argv.slice(2)): CliArgs {
  const values: Record<string, string> = {};
  let apply = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--apply') {
      apply = true;
      continue;
    }
    if (item === '--help' || item === '-h') {
      help = true;
      continue;
    }
    if (!item.startsWith('--')) {
      throw new Error(`Argumento inesperado: ${item}`);
    }

    const key = item.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Falta el valor de --${key}`);
    }
    values[key] = value;
    index += 1;
  }

  return { apply, help, values };
}

export function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada.');
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export function required(value: unknown, field: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`El campo "${field}" es obligatorio.`);
  return normalized;
}

export function optionalString(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

export function normalizeEmail(value: unknown): string {
  const email = required(value, 'email').toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error(`Correo inválido: ${email}`);
  return email;
}

export function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  throw new Error(`Valor booleano inválido: ${value}`);
}

export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return parseBoolean(value, false);
}

export function parseInteger(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`"${field}" debe ser un número entero.`);
  return parsed;
}

export function resolveInputPath(input: string): string {
  const resolved = path.resolve(process.cwd(), input);
  if (!fs.existsSync(resolved)) throw new Error(`No existe el archivo: ${resolved}`);
  return resolved;
}

export function validatePassword(password: string, field = 'contraseña') {
  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new Error(`${field}: usa mínimo 8 caracteres, una mayúscula, una minúscula y un número.`);
  }
}

export function printMode(apply: boolean) {
  console.log(
    apply
      ? 'MODO APLICAR: se escribirán cambios en la base de datos.'
      : 'VISTA PREVIA: no se escribirá ningún cambio.'
  );
}
