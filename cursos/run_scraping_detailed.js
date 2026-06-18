const { chromium } = require("playwright");
const fs = require("fs");

async function obtenerCursos() {
  console.log("Iniciando navegador...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let todosLosCursos = [];

  for (let i = 1; i <= 43; i++) {
    console.log(`Scrapeando página ${i}...`);
    try {
      const url = `https://betowa.sena.edu.co/oferta?level=11&page=${i}`;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(2000);

      const cursos = await page.evaluate(() => {
        let results = [];
        const articles = document.querySelectorAll('article');
        articles.forEach(article => {
          const aTag = article.querySelector('a');
          const h2Tag = article.querySelector('h2');
          
          if (aTag && h2Tag) {
            const titulo = h2Tag.innerText.trim();
            const urlPath = aTag.getAttribute('href');
            if (titulo && urlPath) {
              results.push({
                titulo: titulo,
                url: `https://betowa.sena.edu.co${urlPath}`
              });
            }
          }
        });
        return results;
      });

      console.log(`Página ${i}: Encontrados ${cursos.length} cursos.`);
      todosLosCursos.push(...cursos);
    } catch (e) {
      console.error(`Error en la página ${i}:`, e.message);
    }
  }

  await browser.close();

  // Deduplicar basados en URL
  const mapaUnicos = new Map();
  todosLosCursos.forEach(curso => {
    if (!mapaUnicos.has(curso.url)) {
      mapaUnicos.set(curso.url, curso);
    }
  });
  
  const unicos = Array.from(mapaUnicos.values());
  
  fs.writeFileSync("cursos_detallados.json", JSON.stringify(unicos, null, 2), "utf-8");
  console.log(`Scraping completado. Guardados ${unicos.length} cursos en cursos_detallados.json.`);
  return unicos;
}

obtenerCursos();
