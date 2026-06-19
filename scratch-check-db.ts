import 'dotenv/config';
import { PrismaClient } from './app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const activeStats = await prisma.cursoExterno.groupBy({
      by: ['estaActivo'],
      _count: { _all: true }
    });
    console.log("=== EXTERNAL COURSES BY ACTIVE STATUS ===", JSON.stringify(activeStats, null, 2));

    const institutions = await prisma.institucion.findMany({
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        logoUrl: true,
        correoAdmin: true,
        _count: {
          select: {
            cursos: true,
            cursosExternos: true
          }
        }
      }
    });
    console.log("=== INSTITUCIONES ===");
    console.log(JSON.stringify(institutions, null, 2));
  } catch (error) {
    console.error("Error connecting to DB:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
