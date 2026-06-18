import 'dotenv/config';
import { PrismaClient } from './app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Seeding institution logos...");
    // 1. Update logos and descriptions of institutions
    await prisma.institucion.update({
      where: { slug: 'coursera' },
      data: {
        logoUrl: 'https://images.credly.com/images/154fa915-0373-4552-b883-9eb167cfa202/coursera-logo-square-logo.png',
        descripcion: 'Plataforma líder en educación virtual global con universidades y empresas aliadas de clase mundial.'
      }
    });

    await prisma.institucion.update({
      where: { slug: 'sena' },
      data: {
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/SENA_Colombia_logo.svg/1024px-SENA_Colombia_logo.svg.png',
        descripcion: 'Servicio Nacional de Aprendizaje — Colombia. Institución pública que ofrece formación técnica y tecnológica gratuita.'
      }
    });

    await prisma.institucion.update({
      where: { slug: 'avanzatec' },
      data: {
        logoUrl: 'https://www.mintic.gov.co/portal/715/articles-335345_foto_portada.jpg',
        descripcion: 'Portal del Ministerio de Tecnologías de la Información y las Comunicaciones para el desarrollo de talento digital en Colombia.'
      }
    });

    await prisma.institucion.update({
      where: { slug: 'talentotech' },
      data: {
        logoUrl: 'https://talentotech.gov.co/749/channels-754_logo_talentotech.png',
        descripcion: 'Programa intensivo de bootcamps tecnológicos del Gobierno de Colombia para impulsar la empleabilidad digital.'
      }
    });

    await prisma.institucion.update({
      where: { slug: 'carlosslim' },
      data: {
        logoUrl: 'https://fundacioncarlosslim.org/wp-content/uploads/2017/04/FCS_logo-header.png',
        descripcion: 'Fundación que provee educación, capacitación y herramientas de autoempleo 100% gratuitas a nivel de América Latina.'
      }
    });

    console.log("Institution logos seeded successfully!");

    // 2. Assign high-quality illustrative images to CursoExterno based on their category
    const imagesByCategory: Record<string, string> = {
      ciberseguridad: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
      programacion: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=60',
      'inteligencia artificial': 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
      redes: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=60',
      'datos y analitica': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
      marketing: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
      diseño: 'https://images.unsplash.com/photo-1561070791-26c113006238?w=800&auto=format&fit=crop&q=60',
      habilidades: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60',
      default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'
    };

    const cursosExternos = await prisma.cursoExterno.findMany({});
    console.log(`Found ${cursosExternos.length} external courses. Seeding high-quality cover images...`);

    let updatedCount = 0;
    for (const curso of cursosExternos) {
      let cover = imagesByCategory.default;
      const area = (curso.areaConocimiento || '').toLowerCase();
      if (area.includes('ciber') || area.includes('seguridad')) cover = imagesByCategory.ciberseguridad;
      else if (area.includes('program') || area.includes('desarrollo') || area.includes('software') || area.includes('web') || area.includes('python')) cover = imagesByCategory.programacion;
      else if (area.includes('intel') || area.includes('artificial') || area.includes('ia') || area.includes('ai') || area.includes('aprendizaje automatico') || area.includes('machine')) cover = imagesByCategory['inteligencia artificial'];
      else if (area.includes('redes') || area.includes('telecom') || area.includes('cisco')) cover = imagesByCategory.redes;
      else if (area.includes('dat') || area.includes('analit') || area.includes('cienc') || area.includes('excel') || area.includes('sql')) cover = imagesByCategory['datos y analitica'];
      else if (area.includes('market') || area.includes('ventas') || area.includes('comerc')) cover = imagesByCategory.marketing;
      else if (area.includes('dise') || area.includes('ux') || area.includes('ui') || area.includes('grafic') || area.includes('figma')) cover = imagesByCategory.diseño;
      else if (area.includes('habil') || area.includes('profes') || area.includes('lider') || area.includes('comunic') || area.includes('trabajo') || area.includes('personal')) cover = imagesByCategory.habilidades;

      await prisma.cursoExterno.update({
        where: { id: curso.id },
        data: { imagenUrl: cover }
      });
      updatedCount++;
    }

    console.log(`Successfully updated ${updatedCount} courses with beautiful cover images!`);
  } catch (error) {
    console.error("Error seeding images:", error);
  } finally {
    await prisma.$disconnect();
     pool.end();
  }
}

main();
