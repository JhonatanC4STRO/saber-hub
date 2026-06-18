import { ScraperAdapter, ScrapedCourse, PartialScraperStats } from '../types';

const API_URL = 'https://es.khanacademy.org/api/v1/topic/computer-programming';

const FALLBACK_KHAN_COURSES: ScrapedCourse[] = [
  {
    titulo: 'Fundamentos de Programación y Computación',
    descripcion: 'Aprende los conceptos clave de la informática y el desarrollo de software: variables, bucles, condicionales, funciones y algoritmos interactivos utilizando JavaScript básico y ProcessingJS.',
    fuenteUrl: 'https://es.khanacademy.org/computing/computer-programming',
    codigoExterno: 'khan-computer-programming',
    duracionHoras: 36,
    nivel: 'Básico',
    areaConocimiento: 'Programación',
    imagenUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Matemáticas Financieras e Interés Compuesto',
    descripcion: 'Entiende cómo funciona el dinero a lo largo del tiempo: tasas de interés simple y compuesto, préstamos, hipotecas, inflación y decisiones financieras cotidianas inteligentes.',
    fuenteUrl: 'https://es.khanacademy.org/college-careers-more/personal-finance/pf-interest-and-debt',
    codigoExterno: 'khan-personal-finance',
    duracionHoras: 12,
    nivel: 'Básico',
    areaConocimiento: 'Administración y Negocios',
    imagenUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Introducción a la Biología Celular y Molecular',
    descripcion: 'Un recorrido detallado por la estructura de las células, el ADN, los organelos, la división celular, la respiración aeróbica y la fotosíntesis. Apto para estudiantes escolares y universitarios.',
    fuenteUrl: 'https://es.khanacademy.org/science/biology',
    codigoExterno: 'khan-biology',
    duracionHoras: 24,
    nivel: 'Básico',
    areaConocimiento: 'Salud y Bienestar',
    imagenUrl: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Historia del Arte en América Latina',
    descripcion: 'Explora las manifestaciones artísticas prehispánicas, coloniales, republicanas y contemporáneas en los países de América Latina. Conoce su relevancia política y cultural.',
    fuenteUrl: 'https://es.khanacademy.org/humanities/ap-art-history',
    codigoExterno: 'khan-art-history',
    duracionHoras: 18,
    nivel: 'Intermedio',
    areaConocimiento: 'Diseño',
    imagenUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop'
  }
];

export class KhanAcademyAdapter implements ScraperAdapter {
  name = 'Khan Academy';
  sourceKey = 'khanacademy';

  async run(
    logId: string,
    onProgress: (stats: PartialScraperStats) => Promise<void>
  ): Promise<ScrapedCourse[]> {
    console.log(`[Khan Academy Scraper] Consultando API pública: ${API_URL}...`);
    const stats: PartialScraperStats = { encontrados: 0, nuevos: 0, actualizados: 0, errores: 0 };
    const courses: ScrapedCourse[] = [];

    try {
      const response = await fetch(API_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SaberHubBot/1.0 (+https://saberhub.co)'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP de Khan Academy API: ${response.status}`);
      }

      const data = await response.json();
      const children = data.children || [];

      for (const item of children) {
        if (item.title && item.slug) {
          courses.push({
            titulo: item.title,
            descripcion: item.description || undefined,
            fuenteUrl: `https://es.khanacademy.org/${item.slug}`,
            codigoExterno: `khan-${item.slug}`,
            duracionHoras: null,
            nivel: 'Básico',
            areaConocimiento: null,
            imagenUrl: item.icon_src || null
          });
        }
      }

      console.log(`[Khan Academy Scraper] API retornó ${courses.length} cursos.`);
    } catch (err: any) {
      console.warn(`[Khan Academy Scraper] Error consultando API: ${err.message}. Usando fallbacks.`);
      stats.errores++;
    }

    if (courses.length === 0) {
      console.log(`[Khan Academy Scraper] Cargando ${FALLBACK_KHAN_COURSES.length} cursos desde fallbacks.`);
      courses.push(...FALLBACK_KHAN_COURSES);
    }

    stats.encontrados = courses.length;
    await onProgress(stats);

    return courses;
  }
}
