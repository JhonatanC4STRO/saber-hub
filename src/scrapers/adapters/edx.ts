import { ScraperAdapter, ScrapedCourse, PartialScraperStats } from '../types';

const API_URL = 'https://discovery.edx.org/api/v1/courses/?limit=10&page_size=10';

const FALLBACK_EDX_COURSES: ScrapedCourse[] = [
  {
    titulo: 'Introducción a la programación en Java',
    descripcion: 'Aprende a programar de forma interactiva con Java, uno de los lenguajes de programación más populares y base para aplicaciones Android y servidores. Ofrecido por la Universidad Carlos III de Madrid.',
    fuenteUrl: 'https://www.edx.org/learn/java/universidad-carlos-iii-de-madrid-introduccion-a-la-programacion-en-java',
    codigoExterno: 'edx-java-programacion',
    duracionHoras: 40,
    nivel: 'Básico',
    areaConocimiento: 'Programación',
    imagenUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Liderazgo en la era digital',
    descripcion: 'Desarrolla habilidades críticas de liderazgo ágil, gestión del cambio e innovación necesarias para triunfar en entornos corporativos modernos. Ofrecido por el Banco Interamericano de Desarrollo.',
    fuenteUrl: 'https://www.edx.org/learn/leadership/banco-interamericano-de-desarrollo-liderazgo-en-la-era-digital',
    codigoExterno: 'edx-liderazgo-digital',
    duracionHoras: 24,
    nivel: 'Intermedio',
    areaConocimiento: 'Administración y Negocios',
    imagenUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Fundamentos de Ciberseguridad: Un enfoque práctico',
    descripcion: 'Aprende a proteger tus datos, identificar amenazas informáticas comunes, mitigar riesgos en redes inalámbricas y aplicar cifrados sencillos. Ofrecido por la Universidad del Rosario.',
    fuenteUrl: 'https://www.edx.org/learn/cybersecurity/universidad-del-rosario-fundamentos-de-ciberseguridad',
    codigoExterno: 'edx-fundamentos-ciberseguridad',
    duracionHoras: 30,
    nivel: 'Básico',
    areaConocimiento: 'Ciberseguridad',
    imagenUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Excel Fundamentos y Beneficios para los Negocios',
    descripcion: 'Aprende las funciones esenciales de Microsoft Excel: fórmulas matemáticas, filtros de datos, formatos condicionales y gráficos avanzados para reportes rápidos.',
    fuenteUrl: 'https://www.edx.org/learn/excel/universidad-politecnica-de-valencia-excel-negocios',
    codigoExterno: 'edx-excel-negocios',
    duracionHoras: 16,
    nivel: 'Básico',
    areaConocimiento: 'Datos y Analítica',
    imagenUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop'
  }
];

export class EdxAdapter implements ScraperAdapter {
  name = 'edX';
  sourceKey = 'edx';

  async run(
    logId: string,
    onProgress: (stats: PartialScraperStats) => Promise<void>
  ): Promise<ScrapedCourse[]> {
    console.log(`[edX Scraper] Consultando API pública de edX: ${API_URL}...`);
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
        throw new Error(`Error HTTP de edX API: ${response.status}`);
      }

      const data = await response.json();
      const results = data.results || [];

      for (const item of results) {
        if (item.name && item.key) {
          courses.push({
            titulo: item.name,
            descripcion: item.short_description || item.description || undefined,
            fuenteUrl: `https://www.edx.org/course/${item.key}`,
            codigoExterno: `edx-${item.key}`,
            duracionHoras: null,
            nivel: item.level || null,
            areaConocimiento: null,
            imagenUrl: item.image?.src || null
          });
        }
      }

      console.log(`[edX Scraper] API retornó ${courses.length} cursos.`);
    } catch (err: any) {
      console.warn(`[edX Scraper] Error consultando API: ${err.message}. Usando fallbacks.`);
      stats.errores++;
    }

    if (courses.length === 0) {
      console.log(`[edX Scraper] Cargando ${FALLBACK_EDX_COURSES.length} cursos desde fallbacks.`);
      courses.push(...FALLBACK_EDX_COURSES);
    }

    stats.encontrados = courses.length;
    await onProgress(stats);

    return courses;
  }
}
