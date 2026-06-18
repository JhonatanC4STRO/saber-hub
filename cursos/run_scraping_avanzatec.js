const { chromium } = require("playwright");
const fs = require("fs");

async function obtenerCursos() {
  console.log("Iniciando navegador...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("Navegando a AvanzaTEC...");
  await page.goto("https://www.avanzatec.gov.co/portal/Secciones/Nuestra-oferta/", { waitUntil: "domcontentloaded" });
  
  // Esperar a que los cursos carguen
  await page.waitForTimeout(3000);

  const cursos = await page.evaluate(() => {
    let results = [];
    
    // Los cursos parecen estar en divs que tienen tarjetas o items.
    // Observamos que los H4 tienen los títulos y antes o después puede estar la empresa.
    // Vamos a buscar todos los contenedores de los cursos.
    const courseCards = document.querySelectorAll('.card, .item-curso, div.col-md-4, div.col-lg-3, .box-curso'); // Clases típicas de bootstrap/cards
    
    // Un método alternativo es buscar por todos los enlaces o divs que contienen un h4.
    const h4Elements = Array.from(document.querySelectorAll('h4'));
    
    h4Elements.forEach(h4 => {
      // Normalmente la estructura es un div contenedor que tiene la etiqueta CURSO, el título h4 y la empresa.
      const container = h4.closest('div');
      if (container && container.innerText.includes('CURSO')) {
        const textParts = container.innerText.split('\n').map(t => t.trim()).filter(t => t.length > 0);
        
        // Normalmente: 
        // 0: CURSO
        // 1: Titulo
        // 2: Empresa/Universidad
        let titulo = h4.innerText.trim();
        let institucion = "No especificada";
        
        // Buscar la institución (usualmente el texto que sigue al título o está cerca)
        const indexTitulo = textParts.indexOf(titulo);
        if (indexTitulo !== -1 && textParts.length > indexTitulo + 1) {
            institucion = textParts[indexTitulo + 1];
        }

        // Intentar encontrar el enlace
        let enlace = "#";
        const aTag = container.querySelector('a');
        if (aTag && aTag.href) {
            enlace = aTag.href;
        } else {
            // A veces el enlace envuelve al contenedor
            const parentA = container.closest('a');
            if (parentA && parentA.href) {
                enlace = parentA.href;
            }
        }

        if (titulo && titulo.length > 3) {
           results.push({
             titulo: titulo,
             institucion: institucion,
             url: enlace
           });
        }
      }
    });

    // Limpiar duplicados por título
    const unicos = [];
    const titulosVistos = new Set();
    for (const item of results) {
        if (!titulosVistos.has(item.titulo)) {
            titulosVistos.add(item.titulo);
            unicos.push(item);
        }
    }

    return unicos;
  });

  console.log(`Encontrados ${cursos.length} cursos.`);
  
  fs.writeFileSync("cursos_avanzatec.json", JSON.stringify(cursos, null, 2), "utf-8");
  console.log(`Scraping completado. Guardados en cursos_avanzatec.json.`);
  
  await browser.close();
  return cursos;
}

obtenerCursos();