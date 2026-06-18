import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { slugify } from '../lib/slugify.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Iniciando actualización de slugs para instituciones...\n');

  const instituciones = await prisma.institucion.findMany();
  console.log(`  Encontradas ${instituciones.length} instituciones en la base de datos.`);

  let actualizados = 0;

  for (const inst of instituciones) {
    const generatedSlug = slugify(inst.nombre);
    console.log(`  🏛️  Institución: "${inst.nombre}" -> Slug sugerido: "${generatedSlug}"`);

    // Actualizar en base de datos
    await prisma.institucion.update({
      where: { id: inst.id },
      data: { slug: generatedSlug },
    });
    actualizados++;
  }

  console.log(`\n🎉 Slugs actualizados con éxito. Total actualizados: ${actualizados}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante la actualización de slugs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
