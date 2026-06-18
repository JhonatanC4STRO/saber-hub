const { chromium } = require("playwright");
const fs = require("fs");

async function obtenerCursosCoursera() {
  console.log("Iniciando navegador...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navegando a la página principal de Coursera...");
  await page.goto("https://www.coursera.org/", { waitUntil: "domcontentloaded", timeout: 60000 });
  
  // Esperar a que la página cargue su contenido dinámico
  await page.waitForTimeout(5000);

  const cursos = await page.evaluate(() => {
    let results = [];
    
    // Coursera tiene estructuras cambiantes, buscaremos los enlaces que contengan /learn/, /professional-certificates/ o /specializations/
    const aTags = Array.from(document.querySelectorAll('a'));
    
    const titulosVistos = new Set();

    aTags.forEach(a => {
        const href = a.getAttribute('href');
        if (href && (href.includes('/learn/') || href.includes('/professional-certificates/') || href.includes('/specializations/'))) {
            // Buscamos el título dentro del enlace, usualmente está en un h3, h2 o es el texto principal
            const tituloEl = a.querySelector('h3, h2');
            let titulo = tituloEl ? tituloEl.innerText.trim() : a.innerText.trim();
            
            // Ignorar textos muy cortos o vacíos
            if (titulo && titulo.length > 10 && !titulo.includes('Coursera') && !titulo.includes('Join for Free')) {
                // A veces incluyen la empresa/universidad en un p o span
                let institucion = "Institución Asociada";
                const parrafos = Array.from(a.querySelectorAll('p, span'));
                const instParrafo = parrafos.find(p => p.innerText.trim().length > 2 && p.innerText.trim() !== titulo);
                if (instParrafo) {
                    institucion = instParrafo.innerText.trim();
                }

                // URL absoluta
                const urlAbsoluta = href.startsWith('http') ? href : `https://www.coursera.org${href}`;

                if (!titulosVistos.has(titulo)) {
                    titulosVistos.add(titulo);
                    
                    // Solo guardar si parece un título de curso válido (no multilinea largo)
                    if (titulo.split('\n').length <= 2) {
                        results.push({
                            titulo: titulo.split('\n')[0], // Limpiar posibles saltos de línea extras
                            institucion: institucion.split('\n')[0],
                            url: urlAbsoluta
                        });
                    }
                }
            }
        }
    });

    return results;
  });

  console.log(`Encontrados ${cursos.length} cursos/certificados destacados.`);
  
  fs.writeFileSync("cursos_coursera.json", JSON.stringify(cursos, null, 2), "utf-8");
  console.log(`Scraping completado. Guardados en cursos_coursera.json.`);
  
  await browser.close();
  return cursos;
}

obtenerCursosCoursera();