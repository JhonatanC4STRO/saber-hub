import 'dotenv/config';
import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120');
  await page.goto('https://betowa.sena.edu.co/oferta', { waitUntil: 'networkidle2', timeout: 40000 });
  await new Promise(r => setTimeout(r, 3000));

  // Find pagination links/buttons
  const pagInfo = await page.evaluate(function() {
    // Look for page links
    var links = Array.from(document.querySelectorAll('a[href*="page"], a[href*="pagina"], button[aria-label*="page"], button[aria-label*="página"], [aria-label*="siguiente"], [aria-label*="next"]'));
    var hrefs = links.map(function(el) { return (el as HTMLAnchorElement).href || (el as HTMLElement).textContent || ''; });

    // Also look for any nav
    var navs = Array.from(document.querySelectorAll('nav'));
    var navTexts = navs.map(function(n) { return n.getAttribute('aria-label') + ': ' + (n.textContent || '').slice(0,100); });

    // Check URL params on next buttons
    var nextBtns = Array.from(document.querySelectorAll('[aria-label*="iguiente"], [aria-label*="ext page"], [rel="next"]'));
    var nextInfo = nextBtns.map(function(el) { return el.tagName + ' href=' + ((el as HTMLAnchorElement).href || 'N/A') + ' aria=' + el.getAttribute('aria-label'); });

    // All anchor hrefs that look like pagination
    var allLinks = Array.from(document.querySelectorAll('a')).filter(function(a) {
      return a.href && (a.href.includes('page=') || a.href.includes('pagina=') || a.href.includes('/oferta/'));
    }).slice(0,10).map(function(a) { return a.href; });

    return { pagLinks: hrefs.slice(0,10), navs: navTexts, nextBtns: nextInfo, allLinks };
  });

  console.log('Pagination info:', JSON.stringify(pagInfo, null, 2));

  // Check current URL for filter
  console.log('\nCurrent URL:', page.url());

  // Check what URL params exist for virtual filter
  const virtualFilter = await page.evaluate(function() {
    var buttons = Array.from(document.querySelectorAll('button'));
    var virtualBtn = buttons.find(function(b) { return (b.textContent || '').toLowerCase().includes('virtual'); });
    return virtualBtn ? { text: virtualBtn.textContent?.trim().slice(0,100), parent: (virtualBtn.parentElement?.innerHTML || '').slice(0,300) } : 'no virtual button found';
  });
  console.log('\nVirtual filter:', JSON.stringify(virtualFilter, null, 2));

  // Try page 2 URL
  await page.goto('https://betowa.sena.edu.co/oferta?page=2', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const p2Url = page.url();
  const p2Items = await page.evaluate(function() {
    var scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    var parsed = scripts.map(function(s) { try { return JSON.parse(s.textContent || ''); } catch(e) { return null; } }).filter(Boolean);
    var list = parsed.find(function(d) { return d['@type'] === 'ItemList'; });
    return list ? { items: (list.itemListElement||[]).length, first: (list.itemListElement||[])[0]?.name } : 'no list';
  });
  console.log('\nPage 2 URL:', p2Url);
  console.log('Page 2 items:', JSON.stringify(p2Items));

  await browser.close();
}

run().catch(function(e) { console.error(e.message); process.exit(1); });
