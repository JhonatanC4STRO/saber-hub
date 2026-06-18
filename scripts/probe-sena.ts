import 'dotenv/config';
import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120');
  await page.goto('https://betowa.sena.edu.co/oferta', { waitUntil: 'networkidle2', timeout: 40000 });
  await new Promise(r => setTimeout(r, 3000));

  const result = await page.evaluate(function() {
    var scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    var parsed = scripts.map(function(s) { try { return JSON.parse(s.textContent || ''); } catch(e) { return null; } }).filter(Boolean);
    var list = parsed.find(function(d) { return d['@type'] === 'ItemList'; });
    if (!list) return 'no ItemList. scripts found: ' + scripts.length;
    return JSON.stringify({ total: list.numberOfItems, inPage: (list.itemListElement||[]).length, sample: (list.itemListElement||[]).slice(0,3) });
  });

  console.log(result);

  // Also check article structure
  const articleData = await page.evaluate(function() {
    var articles = Array.from(document.querySelectorAll('article'));
    if (!articles.length) return 'no articles';
    var first = articles[0];
    return first.innerHTML.slice(0, 2000);
  });
  console.log('\n=== FIRST ARTICLE HTML ===\n' + articleData);

  // Check pagination
  const paginationInfo = await page.evaluate(function() {
    var pag = document.querySelector('[aria-label*="paginaci"], nav[role="navigation"], .pagination, [class*="pagination"]');
    return pag ? pag.textContent?.trim().slice(0, 300) : 'no pagination element found';
  });
  console.log('\n=== PAGINATION ===\n' + paginationInfo);

  await browser.close();
}

run().catch(function(e) { console.error(e.message); process.exit(1); });
