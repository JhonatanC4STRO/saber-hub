import { ScraperAdapter, ScrapedCourse, PartialScraperStats } from '../types';

const API_URL = 'https://api.coursera.org/api/courses.v1?q=search&query=espa%C3%B1ol&limit=15&fields=description,photoUrl,worklink';

const FALLBACK_COURSERA_COURSES: ScrapedCourse[] = [
  {
    titulo: 'Aprendiendo a aprender: Herramientas mentales potentes',
    descripcion: 'Aprende técnicas de aprendizaje sencillas pero muy eficaces basadas en la neurociencia cognitiva. Excelente para estudiantes en cualquier disciplina. Ofrecido por la Universidad de California en San Diego.',
    fuenteUrl: 'https://www.coursera.org/learn/aprendizaje',
    codigoExterno: 'coursera-aprendizaje',
    duracionHoras: 15,
    nivel: 'Básico',
    areaConocimiento: 'Administración y Negocios',
    imagenUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Introducción a la programación en Python',
    descripcion: 'Aprende los conceptos básicos de programación usando Python. No se requiere experiencia previa en codificación. Desarrollado y ofrecido por la Universidad Austral.',
    fuenteUrl: 'https://www.coursera.org/learn/programacion-python',
    codigoExterno: 'coursera-programacion-python',
    duracionHoras: 28,
    nivel: 'Básico',
    areaConocimiento: 'Programación',
    imagenUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Inteligencia Artificial para Todos',
    descripcion: 'Descubre qué es la IA, el Machine Learning y el Deep Learning. Aprende a identificar oportunidades para aplicar IA en tu organización y comprende sus implicaciones éticas.',
    fuenteUrl: 'https://www.coursera.org/learn/ai-for-everyone-es',
    codigoExterno: 'coursera-ai-for-everyone',
    duracionHoras: 8,
    nivel: 'Básico',
    areaConocimiento: 'Inteligencia Artificial',
    imagenUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=400&auto=format&fit=crop'
  },
  {
    titulo: 'Soporte de TI de Google: Aspectos básicos del soporte técnico',
    descripcion: 'Comienza tu carrera en TI con este curso introductorio del certificado profesional de Google. Aprende sobre hardware, software, internet, solución de problemas y servicio al cliente.',
    fuenteUrl: 'https://www.coursera.org/learn/aspectos-basicos-soporte-tecnico',
    codigoExterno: 'coursera-google-support',
    duracionHoras: 24,
    nivel: 'Básico',
    areaConocimiento: 'Sistemas',
    imagenUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop'
  }
];

export class CourseraAdapter implements ScraperAdapter {
  name = 'Coursera';
  sourceKey = 'coursera';

  async run(
    logId: string,
    onProgress: (stats: PartialScraperStats) => Promise<void>
  ): Promise<ScrapedCourse[]> {
    console.log(`[Coursera Scraper] Consultando API pública: ${API_URL}...`);
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
        throw new Error(`Error HTTP de Coursera API: ${response.status}`);
      }

      const data = await response.json();
      const elements = data.elements || [];

      for (const item of elements) {
        if (item.name && item.slug) {
          courses.push({
            titulo: item.name,
            descripcion: item.description || undefined,
            fuenteUrl: `https://www.coursera.org/learn/${item.slug}`,
            codigoExterno: `coursera-${item.slug}`,
            duracionHoras: null, // API default
            nivel: null,
            areaConocimiento: null,
            imagenUrl: item.photoUrl || null
          });
        }
      }

      console.log(`[Coursera Scraper] API retornó ${courses.length} cursos.`);
    } catch (err: any) {
      console.warn(`[Coursera Scraper] Error consultando API: ${err.message}. Usando fallbacks.`);
      stats.errores++;
    }

    if (courses.length === 0) {
      console.log(`[Coursera Scraper] Cargando ${FALLBACK_COURSERA_COURSES.length} cursos desde fallbacks.`);
      courses.push(...FALLBACK_COURSERA_COURSES);
    }

    stats.encontrados = courses.length;
    await onProgress(stats);

    return courses;
  }
}
