import prisma from '@/lib/prisma';
import { ScrapedCourse, PartialScraperStats } from './types';
import { normalizeCourse } from './normalizer';

// Configuration mapping scraper source keys to institutional data
const INSTITUCIONES_CONFIG: Record<string, { nombre: string; nit: string; descripcion: string; url: string }> = {
  sena: {
    nombre: 'SENA',
    nit: '899999034',
    descripcion: 'Servicio Nacional de Aprendizaje — Colombia. Institución pública de educación técnica.',
    url: 'https://www.sena.edu.co'
  },
  coursera: {
    nombre: 'Coursera',
    nit: 'COURSERA-999',
    descripcion: 'Plataforma líder en educación virtual global con universidades aliadas.',
    url: 'https://www.coursera.org'
  },
  unal: {
    nombre: 'Universidad Nacional de Colombia',
    nit: 'UNAL-860013824',
    descripcion: 'Universidad Nacional de Colombia — Institución pública de educación superior.',
    url: 'https://unal.edu.co'
  },
  udea: {
    nombre: 'Universidad de Antioquia',
    nit: 'UDEA-890980040',
    descripcion: 'Universidad de Antioquia — Institución pública de educación superior en Medellín.',
    url: 'https://www.udea.edu.co'
  },
  edx: {
    nombre: 'edX',
    nit: 'EDX-999',
    descripcion: 'Plataforma global de cursos masivos abiertos en línea (MOOC).',
    url: 'https://www.edx.org'
  },
  khanacademy: {
    nombre: 'Khan Academy',
    nit: 'KHAN-999',
    descripcion: 'Organización de educación gratuita sin fines de lucro.',
    url: 'https://es.khanacademy.org'
  }
};

/**
 * Gets or creates the institution in the database based on sourceKey
 */
export async function getOrCreateInstitucion(sourceKey: string): Promise<string> {
  const config = INSTITUCIONES_CONFIG[sourceKey.toLowerCase()];
  if (!config) {
    throw new Error(`Configuración de institución no encontrada para: ${sourceKey}`);
  }

  const inst = await prisma.institucion.upsert({
    where: { slug: sourceKey.toLowerCase() },
    update: {
      nombre: config.nombre,
      nit: config.nit,
      descripcion: config.descripcion,
      url: config.url
    },
    create: {
      slug: sourceKey.toLowerCase(),
      nombre: config.nombre,
      nit: config.nit,
      descripcion: config.descripcion,
      url: config.url
    }
  });

  return inst.id;
}

/**
 * Normalizes, checks duplicates, and saves list of courses into the DB
 */
export async function saveScrapedCourses(
  courses: ScrapedCourse[],
  sourceKey: string,
  fuenteNombre: string,
  stats: PartialScraperStats
): Promise<void> {
  const institucionId = await getOrCreateInstitucion(sourceKey);

  for (const raw of courses) {
    try {
      const normalized = normalizeCourse(raw);

      const payload = {
        titulo: normalized.titulo,
        descripcion: normalized.descripcion,
        fuenteUrl: normalized.fuenteUrl,
        fuenteNombre: fuenteNombre,
        nivel: normalized.nivel,
        modalidad: normalized.modalidad,
        duracionHoras: normalized.duracionHoras,
        areaConocimiento: normalized.areaConocimiento,
        imagenUrl: normalized.imagenUrl || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop`,
        fechaInicio: normalized.fechaInicio ? new Date(normalized.fechaInicio) : null,
        fechaCierre: normalized.fechaCierre ? new Date(normalized.fechaCierre) : null,
        estaActivo: true,
        idioma: 'es',
        institucionId
      };

      if (normalized.codigoExterno) {
        const existente = await prisma.cursoExterno.findUnique({
          where: { codigoExterno: normalized.codigoExterno }
        });

        if (existente) {
          // Update details, keep status if already reviewed
          await prisma.cursoExterno.update({
            where: { codigoExterno: normalized.codigoExterno },
            data: {
              titulo: payload.titulo,
              descripcion: payload.descripcion,
              fuenteUrl: payload.fuenteUrl,
              estaActivo: true,
              duracionHoras: payload.duracionHoras,
              nivel: payload.nivel,
              areaConocimiento: payload.areaConocimiento
            }
          });
          stats.actualizados++;
        } else {
          // Create new draft
          await prisma.cursoExterno.create({
            data: {
              ...payload,
              codigoExterno: normalized.codigoExterno,
              estado: 'pendiente' // BORRADOR in UI
            }
          });
          stats.nuevos++;
        }
      } else {
        // Fallback search by title + source
        const existente = await prisma.cursoExterno.findFirst({
          where: { titulo: payload.titulo, fuenteNombre }
        });

        if (existente) {
          await prisma.cursoExterno.update({
            where: { id: existente.id },
            data: {
              estaActivo: true,
              fuenteUrl: payload.fuenteUrl
            }
          });
          stats.actualizados++;
        } else {
          await prisma.cursoExterno.create({
            data: {
              ...payload,
              estado: 'pendiente'
            }
          });
          stats.nuevos++;
        }
      }

    } catch (err: any) {
      stats.errores++;
      if (!stats.detalleErrores) stats.detalleErrores = [];
      stats.detalleErrores.push(
        `[${raw.codigoExterno ?? raw.titulo.slice(0, 30)}] ${err.message}`
      );
    }
  }
}
