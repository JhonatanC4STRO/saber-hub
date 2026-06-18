import puppeteer, { Browser, Page } from 'puppeteer';
import { ScraperAdapter, ScrapedCourse, PartialScraperStats } from '../types';
import { getCrawlDelay } from '@/lib/robots-checker';

const BASE_URL = 'https://betowa.sena.edu.co';
const OFERTA_PATH = '/oferta';
const OFERTA_URL = `${BASE_URL}${OFERTA_PATH}`;

const DEFAULT_DELAY_MS = 2500;
const PAGE_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const MAX_PAGES = 10; // Capped to 10 pages for sanity and safety in standard runs, but expandable

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class SenaAdapter implements ScraperAdapter {
  name = 'SENA Betowa';
  sourceKey = 'sena';

  async run(
    logId: string,
    onProgress: (stats: PartialScraperStats) => Promise<void>
  ): Promise<ScrapedCourse[]> {
    console.log(`[SENA Scraper] Launching Puppeteer...`);
    const crawlDelay = await getCrawlDelay(BASE_URL);
    const delayEfectivo = Math.max(DEFAULT_DELAY_MS, (crawlDelay ?? 0) * 1000);

    const stats: PartialScraperStats = {
      encontrados: 0,
      nuevos: 0,
      actualizados: 0,
      errores: 0,
      detalleErrores: []
    };

    let browser: Browser | null = null;
    const allCourses: ScrapedCourse[] = [];

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--lang=es-CO'
        ]
      });

      const page = await browser.newPage();
      page.setDefaultTimeout(PAGE_TIMEOUT_MS);
      await page.setUserAgent(
        'Mozilla/5.0 (compatible; SaberHubBot/1.0; +https://saberhub.co/robots)'
      );

      // Block resources to speed up page loads
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['font', 'media', 'image'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Load Page 1
      let intent = 0;
      while (intent < MAX_RETRIES) {
        try {
          await page.goto(OFERTA_URL, { waitUntil: 'networkidle2', timeout: PAGE_TIMEOUT_MS });
          break;
        } catch (err: any) {
          intent++;
          if (intent >= MAX_RETRIES) throw err;
          console.warn(`[SENA Scraper] Reintento 1 en página 1: ${err.message}`);
          await sleep(3000 * intent);
        }
      }
      await sleep(1500);

      // Extract details from page 1
      const p1 = await this.extraerPagina(page);
      const totalCursos = p1.total;
      const totalPaginas = Math.min(Math.ceil(totalCursos / 10), MAX_PAGES);

      console.log(`[SENA Scraper] Total en Betowa: ${totalCursos} → ${totalPaginas} páginas programadas.`);
      
      allCourses.push(...p1.cursos);
      stats.encontrados += p1.cursos.length;
      await onProgress(stats);

      // Crawl subsequent pages
      for (let pagina = 2; pagina <= totalPaginas; pagina++) {
        await sleep(delayEfectivo);
        console.log(`[SENA Scraper] Navegando a página ${pagina}/${totalPaginas}...`);

        let paginaCursos: ScrapedCourse[] = [];
        for (let r = 0; r < MAX_RETRIES; r++) {
          try {
            await page.goto(`${OFERTA_URL}?page=${pagina}`, {
              waitUntil: 'networkidle2',
              timeout: PAGE_TIMEOUT_MS
            });
            await sleep(1500);
            const result = await this.extraerPagina(page);
            paginaCursos = result.cursos;
            break;
          } catch (err: any) {
            if (r === MAX_RETRIES - 1) {
              const msg = `Página ${pagina} falló tras reintentos: ${err.message}`;
              console.error(`[SENA Scraper] ${msg}`);
              stats.errores++;
              stats.detalleErrores?.push(msg);
            } else {
              console.warn(`[SENA Scraper] Reintento página ${pagina} (${r + 1}/${MAX_RETRIES})`);
              await sleep(3000 * (r + 1));
            }
          }
        }

        allCourses.push(...paginaCursos);
        stats.encontrados += paginaCursos.length;
        await onProgress(stats);
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return allCourses;
  }

  private async extraerPagina(page: Page): Promise<{ cursos: ScrapedCourse[]; total: number }> {
    const raw = await page.evaluate(() => {
      // Find JSON-LD containing ItemList
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const parsed = scripts
        .map((s) => {
          try {
            return JSON.parse(s.textContent || '');
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      
      const list = parsed.find((d: any) => d['@type'] === 'ItemList') as any;
      const jsonItems: any[] = list ? list.itemListElement || [] : [];

      const articles = Array.from(document.querySelectorAll('article'));
      const links = articles.map((art) => {
        const a = art.querySelector('a[href]') as HTMLAnchorElement | null;
        return a ? a.href : '';
      });

      return {
        jsonItems,
        links,
        total: list ? (list.numberOfItems as number) : 0
      };
    });

    const cursos: ScrapedCourse[] = [];

    for (let i = 0; i < raw.jsonItems.length; i++) {
      const item = raw.jsonItems[i];
      const href = raw.links[i] || '';

      let programId: string | null = null;
      let modality: string | null = null;
      try {
        const url = new URL(href);
        programId = url.searchParams.get('programId');
        modality = url.searchParams.get('modality');
      } catch {
        continue;
      }

      // Filter for virtual courses (V)
      if (modality !== 'V') continue;

      const horasMatch = (item.timeRequired || '').match(/(\d+)/);
      const duracionHoras = horasMatch ? parseInt(horasMatch[1], 10) : null;

      cursos.push({
        titulo: (item.name || '').replace(/\s+/g, ' ').trim(),
        descripcion: (item.description || null),
        codigoExterno: programId ? `sena-${programId}` : `sena-${Math.random().toString(36).substring(2, 9)}`,
        nivel: (item.educationalLevel as string) || null,
        modalidad: 'Virtual',
        duracionHoras,
        areaConocimiento: (item.category as string) || null,
        fuenteUrl: href || OFERTA_URL,
        imagenUrl: null,
        fechaInicio: null,
        fechaCierre: null
      });
    }

    return { cursos, total: raw.total };
  }
}
