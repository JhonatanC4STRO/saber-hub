/**
 * scripts/inspect-sena.ts
 * Diagnóstico: vuelca HTML de betowa.sena.edu.co/oferta
 * Uso: npx tsx scripts/inspect-sena.ts
 */
import 'dotenv/config';
import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { join } from 'path';

const URL = 'https://betowa.sena.edu.co/oferta';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120');

  console.log(`Navegando a ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 40_000 });
  await new Promise(r => setTimeout(r, 4000));

  console.log(`URL final: ${page.url()}`);

  // Screenshot
  const screenshotPath = join(process.cwd(), 'scripts', 'sena-inspect2.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot: ${screenshotPath}`);

  // HTML del contenedor principal (sin TypeScript en evaluate)
  const html = await page.evaluate(function() {
    var main = document.querySelector('main') ||
               document.querySelector('[class*="result"]') ||
               document.querySelector('[class*="oferta"]') ||
               document.querySelector('[class*="programa"]') ||
               document.body;
    return main ? main.innerHTML.slice(0, 8000) : 'no main found';
  });

  const rawPath = join(process.cwd(), 'scripts', 'sena-raw.html');
  writeFileSync(rawPath, html, 'utf8');
  console.log(`HTML parcial guardado: ${rawPath}`);

  // Tags y clases más frecuentes en el DOM
  const tagReport = await page.evaluate(function() {
    var counts = {};
    document.querySelectorAll('*').forEach(function(el) {
      var key = el.tagName.toLowerCase() +
                (el.className && typeof el.className === 'string'
                  ? '.' + el.className.trim().split(/\s+/).slice(0,3).join('.')
                  : '');
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(function(a, b) { return (b[1] as number) - (a[1] as number); })
      .slice(0, 40)
      .map(function(e) { return e[1] + 'x  ' + e[0]; })
      .join('\n');
  });

  console.log('\n=== TAGS MÁS FRECUENTES ===\n' + tagReport);

  // Elementos que parecen items de lista de cursos
  const items = await page.evaluate(function() {
    var candidatos = [];
    var todos = Array.from(document.querySelectorAll('li, article, [class*="item"], [class*="card"], [class*="program"], [class*="curso"], [class*="result"]'));
    todos.slice(0, 15).forEach(function(el) {
      var cls = typeof el.className === 'string' ? el.className.slice(0, 80) : '';
      var txt = (el.textContent || '').trim().slice(0, 120).replace(/\s+/g, ' ');
      candidatos.push('<' + el.tagName.toLowerCase() + ' class="' + cls + '">\n  ' + txt);
    });
    return candidatos;
  });

  console.log('\n=== CANDIDATOS ITEMS ===');
  items.forEach(function(it, i) { console.log('[' + i + '] ' + it + '\n'); });

  await browser.close();
  console.log('\nDone.');
}

run().catch(function(err) { console.error(err); process.exit(1); });
