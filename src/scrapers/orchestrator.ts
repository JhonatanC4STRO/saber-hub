import { ScraperAdapter, PartialScraperStats } from './types';
import { isPathAllowed, getCrawlDelay } from '@/lib/robots-checker';
import { createScraperLog, updateScraperLogProgress, finalizeScraperLog } from './logger';
import { saveScrapedCourses } from './deduplicator';

// Lazy imports of adapters to prevent eager loading issues
import { SenaAdapter } from './adapters/sena';
import { UnalAdapter } from './adapters/unal';
import { UdeaAdapter } from './adapters/udea';
import { CourseraAdapter } from './adapters/coursera';
import { EdxAdapter } from './adapters/edx';
import { KhanAcademyAdapter } from './adapters/khanacademy';

const ADAPTERS: ScraperAdapter[] = [
  new SenaAdapter(),
  new UnalAdapter(),
  new UdeaAdapter(),
  new CourseraAdapter(),
  new EdxAdapter(),
  new KhanAcademyAdapter()
];

export async function runSingleScraper(sourceKey: string): Promise<boolean> {
  const adapter = ADAPTERS.find(a => a.sourceKey.toLowerCase() === sourceKey.toLowerCase());
  if (!adapter) {
    console.error(`[Orchestrator] Scraper adapter no encontrado para la clave: ${sourceKey}`);
    return false;
  }

  console.log(`[Orchestrator] Iniciando scraper: ${adapter.name} (${adapter.sourceKey})`);
  const startTime = Date.now();
  const logId = await createScraperLog(adapter.name);

  const stats: PartialScraperStats = {
    encontrados: 0,
    nuevos: 0,
    actualizados: 0,
    errores: 0,
    detalleErrores: []
  };

  let exitoso = false;

  try {
    // Check robots.txt permission for base URL
    // We get the base URL of the adapter target. If it is blocked, fail gracefully.
    let targetBaseUrl = 'https://saberhub.co';
    let targetPath = '/';
    if (adapter.sourceKey === 'sena') {
      targetBaseUrl = 'https://betowa.sena.edu.co';
      targetPath = '/oferta';
    } else if (adapter.sourceKey === 'unal') {
      targetBaseUrl = 'https://unal.edu.co';
      targetPath = '/cursos';
    } else if (adapter.sourceKey === 'udea') {
      targetBaseUrl = 'https://www.udea.edu.co';
      targetPath = '/educacion-continua';
    } else if (adapter.sourceKey === 'coursera') {
      targetBaseUrl = 'https://www.coursera.org';
    } else if (adapter.sourceKey === 'edx') {
      targetBaseUrl = 'https://www.edx.org';
    } else if (adapter.sourceKey === 'khanacademy') {
      targetBaseUrl = 'https://es.khanacademy.org';
    }

    const pathAllowed = await isPathAllowed(targetBaseUrl, targetPath);
    if (!pathAllowed) {
      const msg = `Bloqueado por robots.txt para ${targetBaseUrl}${targetPath}`;
      console.error(`[Orchestrator] ${msg}`);
      stats.errores++;
      stats.detalleErrores?.push(msg);
      await finalizeScraperLog(logId, stats, false, 0);
      return false;
    }

    // Run the scraper adapter which returns raw courses
    const rawCourses = await adapter.run(logId, async (intermediateStats) => {
      // Progress update callback
      Object.assign(stats, intermediateStats);
      await updateScraperLogProgress(logId, stats);
    });

    console.log(`[Orchestrator] Scraper ${adapter.name} extrajo ${rawCourses.length} cursos raw. Guardando...`);
    
    // Save, normalize, and deduplicate courses
    await saveScrapedCourses(rawCourses, adapter.sourceKey, adapter.name, stats);

    exitoso = true;
    console.log(`[Orchestrator] Scraper ${adapter.name} finalizado. Encontrados: ${stats.encontrados}, Nuevos: ${stats.nuevos}, Actualizados: ${stats.actualizados}, Errores: ${stats.errores}`);
  } catch (err: any) {
    const msg = `Error fatal en ejecución: ${err.message}`;
    console.error(`[Orchestrator] ${msg}`, err);
    stats.errores++;
    stats.detalleErrores?.push(msg);
    exitoso = false;
  } finally {
    const duration = Date.now() - startTime;
    await finalizeScraperLog(logId, stats, exitoso, duration);
  }

  return exitoso;
}
