import { ScrapedCourse } from './types';

// Categories matching CursosExternosPanel options and general fields
const CATEGORIES = [
  { keywords: ['python', 'programación', 'desarrollo', 'javascript', 'java', 'software', 'codigo', 'código', 'web', 'html', 'css', 'poo', 'frontend', 'backend', 'fullstack'], name: 'Programación' },
  { keywords: ['ciberseguridad', 'cybersecurity', 'seguridad', 'hacker', 'cripto', 'sarlaft', 'fortinet'], name: 'Ciberseguridad' },
  { keywords: ['ia', 'inteligencia artificial', 'generativa', 'prompt', 'machine learning', 'aprendizaje automático', 'copilot', 'gemini', 'llm', 'deep learning', 'redes neuronales'], name: 'Inteligencia Artificial' },
  { keywords: ['redes', 'telecomunicaciones', 'networking', 'cisco', 'ccna', 'enrutamiento', 'fibra'], name: 'Redes' },
  { keywords: ['datos', 'data', 'analítica', 'analytics', 'excel', 'power bi', 'sql', 'analytics', 'k-means', 'tableros', 'probabilidad', 'estadística'], name: 'Datos y Analítica' },
  { keywords: ['diseño', 'design', 'ux', 'ui', 'figma', 'gráfico', 'autocad', 'modelado', '3d'], name: 'Diseño' },
  { keywords: ['sistemas', 'computación', 'hardware', 'servidor', 'linux', 'windows server', 'virtualización', 'arquitectura'], name: 'Sistemas' },
  { keywords: ['cloud', 'nube', 'aws', 'azure', 'devops', 'infraestructura'], name: 'Sistemas' }, // Mapping cloud to Sistemas/Tecnología
  { keywords: ['lider', 'liderazgo', 'comunicación', 'gestión', 'gerencia', 'proyecto', 'administración', 'empleo', 'recursos humanos', 'finanzas', 'financiero', 'contabilidad', 'economía', 'marketing', 'negocios'], name: 'Administración y Negocios' },
  { keywords: ['salud', 'bienestar', 'medicina', 'mental', 'nutrición', 'alimentación', 'enfermería', 'psicología', 'deporte', 'ejercicio'], name: 'Salud y Bienestar' },
  { keywords: ['ambiental', 'ecología', 'sostenible', 'sostenibilidad', 'agro', 'tierra', 'cultivo', 'cambio climático', 'energía limpia'], name: 'Sostenibilidad y Agropecuario' }
];

export function cleanText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyCategory(title: string): string {
  const t = title.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(kw => t.includes(kw))) {
      return cat.name;
    }
  }
  return 'Tecnología'; // Default category
}

export function normalizeLevel(levelText?: string | null): string {
  if (!levelText) return 'Intermedio'; // Reasonable default
  const clean = levelText.toLowerCase();
  if (clean.includes('básico') || clean.includes('basico') || clean.includes('principiante') || clean.includes('introducción') || clean.includes('fundamentos') || clean.includes('easy') || clean.includes('beginner')) {
    return 'Básico';
  }
  if (clean.includes('avanzado') || clean.includes('innovador') || clean.includes('experto') || clean.includes('expert') || clean.includes('advanced') || clean.includes('profesional')) {
    return 'Avanzado';
  }
  return 'Intermedio';
}

export function normalizeHours(hours?: number | null, title?: string): number {
  if (hours && hours > 0) return hours;
  // Fallback to parsing from title if possible
  if (title) {
    const match = title.match(/(\d+)\s*(horas|hours|h\b)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > 0) return val;
    }
  }
  return 40; // Default course duration
}

export function isSpanish(title: string, description?: string): boolean {
  const text = `${title} ${description || ''}`.toLowerCase();
  // Common Spanish words that are extremely frequent
  const spanishStopWords = [' de ', ' la ', ' el ', ' en ', ' para ', ' con ', ' un ', ' una ', ' los ', ' las ', ' del ', ' al ', ' por ', ' curso ', ' introduccion ', ' introducción '];
  return spanishStopWords.some(word => text.includes(word));
}

export function normalizeCourse(course: ScrapedCourse): ScrapedCourse {
  const normalizedTitle = cleanText(course.titulo);
  const normalizedDesc = course.descripcion ? cleanText(course.descripcion).slice(0, 500) : '';
  const area = course.areaConocimiento || classifyCategory(normalizedTitle);
  const level = normalizeLevel(course.nivel);
  const duration = normalizeHours(course.duracionHoras, normalizedTitle);

  return {
    ...course,
    titulo: normalizedTitle,
    descripcion: normalizedDesc || `Accede al curso virtual "${normalizedTitle}" de forma gratuita y flexible. Desarrolla competencias en el área de ${area} con una duración estimada de ${duration} horas.`,
    areaConocimiento: area,
    nivel: level,
    duracionHoras: duration,
    modalidad: 'Virtual'
  };
}
