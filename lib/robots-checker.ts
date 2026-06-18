/**
 * RL-01 — Verificación de robots.txt
 *
 * Antes de ejecutar cualquier scraper, llamar a `isPathAllowed(siteUrl, path)`.
 * Si retorna false, NO scrapar ese path y registrar el bloqueo en el log.
 */
import robotsParser from 'robots-parser';

const SABERHUB_BOT = 'SaberHubBot';

// In-process cache: evita fetches repetidos al mismo robots.txt dentro del proceso.
// En producción serverless el cache no persiste entre invocaciones — está bien,
// cumple la función durante ejecuciones largas (scripts de importación batch).
const cache = new Map<string, { text: string; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

async function fetchRobotsTxt(origin: string): Promise<string | null> {
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.text;
  }

  try {
    const robotsUrl = `${origin}/robots.txt`;
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': SABERHUB_BOT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      // 404 = no robots.txt → allow
      return null;
    }
    const text = await res.text();
    cache.set(origin, { text, fetchedAt: Date.now() });
    return text;
  } catch {
    // Network error → conservative allow, no block
    return null;
  }
}

/**
 * Verifica si `targetPath` está permitido en robots.txt de `siteUrl`.
 *
 * @returns true si está permitido o si robots.txt no existe / hay error de red.
 *          false si el path está explícitamente bloqueado.
 */
export async function isPathAllowed(siteUrl: string, targetPath: string): Promise<boolean> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    console.warn(`[robots-checker] URL inválida: ${siteUrl}`);
    return false;
  }

  const robotsTxt = await fetchRobotsTxt(origin);

  if (!robotsTxt) {
    // Sin robots.txt → permitido
    return true;
  }

  const robots = robotsParser(`${origin}/robots.txt`, robotsTxt);
  const fullUrl = new URL(targetPath, origin).toString();
  const allowed = robots.isAllowed(fullUrl, SABERHUB_BOT) ?? true;

  if (!allowed) {
    console.warn(
      `[robots-checker] Path BLOQUEADO por robots.txt: ${fullUrl} en ${origin}`
    );
  }

  return allowed;
}

/**
 * Retorna el crawl-delay recomendado en segundos, o null si no está definido.
 * Respetar este delay entre requests al mismo dominio.
 */
export async function getCrawlDelay(siteUrl: string): Promise<number | null> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return null;
  }

  const robotsTxt = await fetchRobotsTxt(origin);
  if (!robotsTxt) return null;

  const robots = robotsParser(`${origin}/robots.txt`, robotsTxt);
  return robots.getCrawlDelay(SABERHUB_BOT) ?? null;
}

/**
 * Tabla de fuentes conocidas — documenta la política de scraping (RL-02).
 * Usar como referencia al implementar scrapers individuales.
 */
export const FUENTES_CONFIG = {
  'sena-sofia-plus': {
    nombre: 'SENA Sofia Plus',
    urlBase: 'https://oferta.senasofiaplus.edu.co',
    scraping: true,
    tieneApi: false,
    nota: 'Sitio público del Estado colombiano. Scraping de datos públicos permitido.',
  },
  coursera: {
    nombre: 'Coursera',
    urlBase: 'https://www.coursera.org',
    scraping: true,
    tieneApi: true,
    nota: 'Preferir API oficial. Scraping permitido con límites.',
  },
  edx: {
    nombre: 'edX',
    urlBase: 'https://www.edx.org',
    scraping: true,
    tieneApi: true,
    nota: 'Preferir API oficial.',
  },
  'khan-academy': {
    nombre: 'Khan Academy',
    urlBase: 'https://es.khanacademy.org',
    scraping: true,
    tieneApi: true,
    nota: 'Preferir API oficial.',
  },
  'miriada-x': {
    nombre: 'Miríada X',
    urlBase: 'https://miriadax.net',
    scraping: 'fallback' as const,
    tieneApi: false,
    nota: 'Revisar TOS periódicamente. Scraping como fallback si no hay API.',
  },
} as const;
