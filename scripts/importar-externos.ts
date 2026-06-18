import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { isPathAllowed, getCrawlDelay } from '../lib/robots-checker';

// Inicializar Prisma
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Dominios e instituciones
const INSTITUCIONES_DATA = [
  { slug: 'coursera', nombre: 'Coursera', url: 'https://www.coursera.org', nit: 'COURSERA-999', descripcion: 'Plataforma líder en educación virtual global con universidades aliadas.' },
  { slug: 'avanzatec', nombre: 'AvanzaTEC', url: 'https://www.avanzatec.gov.co', nit: 'AVANZATEC-999', descripcion: 'Portal del Ministerio TIC de Colombia para el desarrollo de talento digital.' },
  { slug: 'talentotech', nombre: 'TalentoTech', url: 'https://talentotech2.com.co', nit: 'TALENTOTECH-999', descripcion: 'Programa intensivo de bootcamps tecnológicos del Gobierno de Colombia.' },
  { slug: 'carlosslim', nombre: 'Fundación Carlos Slim', url: 'https://fundacioncarlosslim.org', nit: 'SLIM-999', descripcion: 'Fundación que provee educación y capacitación gratuita para el empleo.' },
  { slug: 'sena', nombre: 'SENA', url: 'https://www.sena.edu.co', nit: '899999034', descripcion: 'Servicio Nacional de Aprendizaje — Colombia. Institución pública de educación técnica.' }
];

// Helper para esperar
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper para categorización y estructuración inteligente por título
function analizarCurso(titulo: string, categoryDefault: string, url: string) {
  const t = titulo.toLowerCase();
  let categoria = categoryDefault;
  let duracion = 40;
  let nivel = 'Básico';

  // Categorías
  if (t.includes('python') || t.includes('programación') || t.includes('desarrollo') || t.includes('javascript') || t.includes('java') || t.includes('software') || t.includes('clases') || t.includes('poo') || t.includes('código') || t.includes('web')) {
    categoria = 'Programación';
  } else if (t.includes('data') || t.includes('datos') || t.includes('analytics') || t.includes('analista') || t.includes('excel') || t.includes('power bi') || t.includes('bi ') || t.includes('k-means')) {
    categoria = 'Análisis de Datos';
  } else if (t.includes('ia') || t.includes('inteligencia artificial') || t.includes('copilot') || t.includes('gemini') || t.includes('generativa') || t.includes('prompt') || t.includes('machine learning') || t.includes('llm') || t.includes('agentic')) {
    categoria = 'Inteligencia Artificial';
  } else if (t.includes('cloud') || t.includes('nube') || t.includes('azure') || t.includes('aws') || t.includes('realidad mixta') || t.includes('digital twins')) {
    categoria = 'Arquitectura en la Nube';
  } else if (t.includes('ciberseguridad') || t.includes('cybersecurity') || t.includes('fortinet') || t.includes('seguridad') || t.includes('hacker') || t.includes('sarlaft')) {
    categoria = 'Ciberseguridad';
  } else if (t.includes('blockchain') || t.includes('cripto') || t.includes('contratos inteligentes')) {
    categoria = 'Blockchain';
  } else if (t.includes('lider') || t.includes('comunicacion') || t.includes('gestión') || t.includes('gerencia') || t.includes('proyectos') || t.includes('administración') || t.includes('empleo') || t.includes('recursos humanos') || t.includes('finanzas') || t.includes('financiero') || t.includes('contabilidad')) {
    categoria = 'Administración y Negocios';
  } else if (t.includes('salud') || t.includes('medicina') || t.includes('coach') || t.includes('mental') || t.includes('nutrición') || t.includes('alimentación') || t.includes('médica') || t.includes('enfermería')) {
    categoria = 'Salud y Bienestar';
  } else if (t.includes('ambiental') || t.includes('ecología') || t.includes('sostenible') || t.includes('conservación') || t.includes('agua') || t.includes('agro') || t.includes('tierra') || t.includes('cultivo')) {
    categoria = 'Sostenibilidad y Agropecuario';
  }

  // Nivel
  if (t.includes('avanzad') || t.includes('innovador') || t.includes('expert') || t.includes('architect') || t.includes('v4.0') || t.includes('v3.5') || t.includes('professional') || t.includes('hcia')) {
    nivel = 'Avanzado';
    duracion = 120;
  } else if (t.includes('intermedio') || t.includes('integrador') || t.includes('desarrollador') || t.includes('analista') || t.includes('aplicaciones') || t.includes('gestión') || t.includes('diseño') || t.includes('planeación')) {
    nivel = 'Intermedio';
    duracion = 80;
  } else if (t.includes('básico') || t.includes('explorador') || t.includes('fundamentos') || t.includes('introducción') || t.includes('conceptos') || t.includes('iniciación') || t.includes('fácil') || t.includes('comprendiendo')) {
    nivel = 'Básico';
    duracion = 40;
  } else {
    // Valor por defecto razonable
    nivel = 'Intermedio';
    duracion = 48;
  }

  return { categoria, nivel, duracion };
}

// Scraper con Puppeteer para extraer detalles reales
async function intentarScraparDetalles(browser: puppeteer.Browser, url: string, fuenteNombre: string): Promise<{ descripcion: string | null; duracion: number | null }> {
  try {
    // 1. Validar robots.txt
    const pathParsed = new URL(url).pathname + new URL(url).search;
    const isAllowed = await isPathAllowed(url, pathParsed);
    if (!isAllowed) {
      console.log(`  🤖 [Scraper] Raspado bloqueado por robots.txt para: ${url}`);
      return { descripcion: null, duracion: null };
    }

    console.log(`  🔎 [Scraper] Raspando detalles de: ${url}...`);
    const page = await browser.newPage();
    // User Agent amigable
    await page.setUserAgent('SaberHubBot/1.0 (+https://saberhub.co)');
    
    // Configurar timeouts razonables
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    
    // Esperar a que la página se estabilice
    await sleep(2000);

    let descripcion: string | null = null;
    let duracion: number | null = null;

    if (fuenteNombre === 'Coursera') {
      // Intentar obtener descripción de metadatos o elementos clave
      descripcion = await page.evaluate(() => {
        // Buscar metatag description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.getAttribute('content')) {
          return metaDesc.getAttribute('content')!.trim();
        }
        // Buscar encabezados de descripción
        const descDiv = document.querySelector('.description, .content-section, .about-section');
        return descDiv ? descDiv.textContent?.trim() || null : null;
      });
      
      // Intentar extraer horas
      const horasText = await page.evaluate(() => {
        return document.body.innerText.match(/(\d+)\s*(horas|hours)/i)?.[1] || null;
      });
      if (horasText) duracion = parseInt(horasText, 10);
    } 
    else if (fuenteNombre === 'AvanzaTEC') {
      descripcion = await page.evaluate(() => {
        // En AvanzaTEC, usualmente la información está en divs principales
        const contentEl = document.querySelector('.detalle-curso, .content, #main-content, article');
        if (contentEl) return contentEl.textContent?.replace(/\s+/g, ' ').trim().slice(0, 500) || null;
        
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.getAttribute('content')?.trim() || null : null;
      });
    }
    else if (fuenteNombre === 'SENA Betowa') {
      descripcion = await page.evaluate(() => {
        const descContainer = document.querySelector('.programa-descripcion, .oferta-detalle, p');
        return descContainer ? descContainer.textContent?.trim() || null : null;
      });
    }

    await page.close();

    // Limpieza de descripción
    if (descripcion) {
      descripcion = descripcion.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      if (descripcion.length > 500) {
        descripcion = descripcion.slice(0, 497) + '...';
      }
    }

    return { descripcion, duracion };
  } catch (error: any) {
    console.log(`  ⚠️ [Scraper] No se pudo obtener información dinámica de la página: ${error.message}`);
    return { descripcion: null, duracion: null };
  }
}

async function main() {
  console.log('🚀 Iniciando script de importación y enriquecimiento de cursos...');
  
  // 1. Obtener o crear instituciones
  const instMap = new Map<string, string>(); // slug -> institucionId
  console.log('\n🏢 Verificando y creando instituciones en la base de datos...');
  for (const instData of INSTITUCIONES_DATA) {
    const inst = await prisma.institucion.upsert({
      where: { slug: instData.slug },
      update: {
        nombre: instData.nombre,
        url: instData.url,
        descripcion: instData.descripcion,
        nit: instData.nit
      },
      create: {
        slug: instData.slug,
        nombre: instData.nombre,
        url: instData.url,
        descripcion: instData.descripcion,
        nit: instData.nit
      }
    });
    instMap.set(instData.slug, inst.id);
    console.log(`  ✅ Institución: "${inst.nombre}" activa (ID: ${inst.id})`);
  }

  // 2. Levantar Puppeteer para raspado de muestra
  console.log('\n🤖 Iniciando Puppeteer para raspado web de muestras reales...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  // Estadísticas globales
  const stats = {
    talentotech: { total: 0, creados: 0, actualizados: 0 },
    avanzatec: { total: 0, creados: 0, actualizados: 0 },
    coursera: { total: 0, creados: 0, actualizados: 0 },
    carlosslim: { total: 0, creados: 0, actualizados: 0 },
    sena: { total: 0, creados: 0, actualizados: 0 }
  };

  const cursosDir = path.join(process.cwd(), 'cursos');

  // ==========================================
  // A. COURSERA (`cursos_coursera.json`)
  // ==========================================
  const courseraFile = path.join(cursosDir, 'cursos_coursera.json');
  if (fs.existsSync(courseraFile)) {
    console.log('\n📖 Cargando cursos de Coursera...');
    const rawData = JSON.parse(fs.readFileSync(courseraFile, 'utf-8'));
    const instId = instMap.get('coursera')!;
    
    // Raspar una muestra real (el primer curso)
    let muestraUrl = rawData[0]?.url;
    let muestraInfo = { descripcion: null as string | null, duracion: null as number | null };
    if (muestraUrl) {
      muestraInfo = await intentarScraparDetalles(browser, muestraUrl, 'Coursera');
    }

    for (let idx = 0; idx < rawData.length; idx++) {
      const item = rawData[idx];
      stats.coursera.total++;
      
      const { categoria, nivel, duracion } = analizarCurso(item.titulo, 'Tecnología', item.url);
      
      // La descripción real obtenida en la muestra, o una descripción estructurada
      let finalDesc = (idx === 0 && muestraInfo.descripcion) 
        ? muestraInfo.descripcion 
        : `Aprende y especialízate en "${item.titulo}", un completo programa ofrecido en Coursera por ${item.institucion || 'universidades de primer nivel'}. Desarrolla competencias prácticas y habilidades de alta demanda en el mercado digital moderno.`;
      
      let finalDuracion = (idx === 0 && muestraInfo.duracion) ? muestraInfo.duracion : duracion;

      // Buscar si ya existe
      const existe = await prisma.cursoExterno.findFirst({
        where: { fuenteUrl: item.url }
      });

      const dataPayload = {
        titulo: item.titulo,
        descripcion: finalDesc,
        fuenteUrl: item.url,
        fuenteNombre: 'Coursera',
        duracionHoras: finalDuracion,
        nivel: nivel,
        modalidad: 'Virtual',
        idioma: 'es',
        imagenUrl: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop`,
        areaConocimiento: categoria,
        estaActivo: true,
        estado: 'pendiente',
        institucionId: instId
      };

      if (existe) {
        await prisma.cursoExterno.update({
          where: { id: existe.id },
          data: dataPayload
        });
        stats.coursera.actualizados++;
      } else {
        await prisma.cursoExterno.create({
          data: dataPayload
        });
        stats.coursera.creados++;
      }
    }
    console.log(`  📊 Coursera: ${stats.coursera.creados} creados, ${stats.coursera.actualizados} actualizados.`);
  }

  // ==========================================
  // B. AVANZATEC (`cursos_avanzatec.json`)
  // ==========================================
  const avanzatecFile = path.join(cursosDir, 'cursos_avanzatec.json');
  if (fs.existsSync(avanzatecFile)) {
    console.log('\n📖 Cargando cursos de AvanzaTEC...');
    const rawData = JSON.parse(fs.readFileSync(avanzatecFile, 'utf-8'));
    const instId = instMap.get('avanzatec')!;

    // Raspar una muestra real (el primer curso)
    let muestraUrl = rawData[0]?.url;
    let muestraInfo = { descripcion: null as string | null, duracion: null as number | null };
    if (muestraUrl && muestraUrl !== '#') {
      muestraInfo = await intentarScraparDetalles(browser, muestraUrl, 'AvanzaTEC');
    }

    for (let idx = 0; idx < rawData.length; idx++) {
      const item = rawData[idx];
      stats.avanzatec.total++;
      
      const { categoria, nivel, duracion } = analizarCurso(item.titulo, 'Tecnología', item.url);
      
      let finalDesc = (idx === 0 && muestraInfo.descripcion) 
        ? muestraInfo.descripcion 
        : `Curso oficial de "${item.titulo}" provisto por ${item.institucion || 'entidades aliadas'} a través de la alianza AvanzaTEC. Formación estructurada ideal para potenciar tus competencias digitales y certificar tu aprendizaje con validez laboral.`;
      
      let finalDuracion = duracion;

      // Buscar si ya existe
      const existe = await prisma.cursoExterno.findFirst({
        where: { fuenteUrl: item.url }
      });

      const dataPayload = {
        titulo: item.titulo,
        descripcion: finalDesc,
        fuenteUrl: item.url,
        fuenteNombre: 'AvanzaTEC',
        duracionHoras: finalDuracion,
        nivel: nivel,
        modalidad: 'Virtual',
        idioma: 'es',
        imagenUrl: `https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400&auto=format&fit=crop`,
        areaConocimiento: categoria,
        estaActivo: true,
        estado: 'pendiente',
        institucionId: instId
      };

      if (existe) {
        await prisma.cursoExterno.update({
          where: { id: existe.id },
          data: dataPayload
        });
        stats.avanzatec.actualizados++;
      } else {
        await prisma.cursoExterno.create({
          data: dataPayload
        });
        stats.avanzatec.creados++;
      }
    }
    console.log(`  📊 AvanzaTEC: ${stats.avanzatec.creados} creados, ${stats.avanzatec.actualizados} actualizados.`);
  }

  // ==========================================
  // C. TALENTOTECH (`bootcamps_talentotech.json`)
  // ==========================================
  const talentotechFile = path.join(cursosDir, 'bootcamps_talentotech.json');
  if (fs.existsSync(talentotechFile)) {
    console.log('\n📖 Cargando bootcamps de TalentoTech...');
    const rawData = JSON.parse(fs.readFileSync(talentotechFile, 'utf-8'));
    const instId = instMap.get('talentotech')!;

    for (let idx = 0; idx < rawData.length; idx++) {
      const item = rawData[idx];
      stats.talentotech.total++;
      
      const { categoria, nivel, duracion } = analizarCurso(item.titulo, item.categoria || 'Tecnología', item.url);
      
      let finalDesc = item.descripcion || `Bootcamp intensivo del programa TalentoTech: "${item.titulo}". Aprende competencias avanzadas y metodologías ágiles requeridas en la industria del software. Incluye proyectos reales y mentoría personalizada.`;
      
      // Buscar si ya existe
      const existe = await prisma.cursoExterno.findFirst({
        where: { fuenteUrl: item.url, titulo: item.titulo }
      });

      const dataPayload = {
        titulo: item.titulo,
        descripcion: finalDesc,
        fuenteUrl: item.url,
        fuenteNombre: 'TalentoTech',
        duracionHoras: duracion,
        nivel: nivel,
        modalidad: 'Virtual',
        idioma: 'es',
        imagenUrl: `https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=400&auto=format&fit=crop`,
        areaConocimiento: item.categoria || categoria,
        estaActivo: true,
        estado: 'pendiente',
        institucionId: instId
      };

      if (existe) {
        await prisma.cursoExterno.update({
          where: { id: existe.id },
          data: dataPayload
        });
        stats.talentotech.actualizados++;
      } else {
        await prisma.cursoExterno.create({
          data: dataPayload
        });
        stats.talentotech.creados++;
      }
    }
    console.log(`  📊 TalentoTech: ${stats.talentotech.creados} creados, ${stats.talentotech.actualizados} actualizados.`);
  }

  // ==========================================
  // D. FUNDACIÓN CARLOS SLIM (`programas_carlosslim.json`)
  // ==========================================
  const slimFile = path.join(cursosDir, 'programas_carlosslim.json');
  if (fs.existsSync(slimFile)) {
    console.log('\n📖 Cargando programas de Fundación Carlos Slim...');
    const rawData = JSON.parse(fs.readFileSync(slimFile, 'utf-8'));
    const instId = instMap.get('carlosslim')!;

    for (let idx = 0; idx < rawData.length; idx++) {
      const item = rawData[idx];
      stats.carlosslim.total++;
      
      // Mapear campos ya que usa 'title' y 'description' en vez de 'titulo'
      const title = item.title || item.titulo;
      const description = item.description || item.descripcion;

      const { categoria, nivel, duracion } = analizarCurso(title, 'Educación y Empleo', item.url);
      
      let finalDesc = description || `Programa interactivo de capacitación gratuita provisto por la Fundación Carlos Slim en la plataforma Aprende.org. Enfoque práctico orientado a habilidades productivas y de desarrollo personal.`;

      // Buscar si ya existe
      const existe = await prisma.cursoExterno.findFirst({
        where: { fuenteUrl: item.url, titulo: title }
      });

      const dataPayload = {
        titulo: title,
        descripcion: finalDesc,
        fuenteUrl: item.url,
        fuenteNombre: 'Fundación Carlos Slim',
        duracionHoras: duracion,
        nivel: nivel,
        modalidad: 'Virtual',
        idioma: 'es',
        imagenUrl: `https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=400&auto=format&fit=crop`,
        areaConocimiento: categoria,
        estaActivo: true,
        estado: 'pendiente',
        institucionId: instId
      };

      if (existe) {
        await prisma.cursoExterno.update({
          where: { id: existe.id },
          data: dataPayload
        });
        stats.carlosslim.actualizados++;
      } else {
        await prisma.cursoExterno.create({
          data: dataPayload
        });
        stats.carlosslim.creados++;
      }
    }
    console.log(`  📊 Fundación Carlos Slim: ${stats.carlosslim.creados} creados, ${stats.carlosslim.actualizados} actualizados.`);
  }

  // ==========================================
  // E. SENA (`cursos_detallados.json`)
  // ==========================================
  const senaFile = path.join(cursosDir, 'cursos_detallados.json');
  if (fs.existsSync(senaFile)) {
    console.log('\n📖 Procesando nuevos cursos detallados del SENA (si aplican)...');
    const rawData = JSON.parse(fs.readFileSync(senaFile, 'utf-8'));
    const instId = instMap.get('sena')!;
    
    // Importamos una muestra limitada para evitar saturar el script y por velocidad de respuesta
    // solo procesaremos los primeros 25 por si hay novedades.
    const limitedData = rawData.slice(0, 25);

    for (let idx = 0; idx < limitedData.length; idx++) {
      const item = limitedData[idx];
      stats.sena.total++;
      
      // Extraer programId
      let programId: string | null = null;
      try {
        const u = new URL(item.url);
        programId = u.searchParams.get('programId');
      } catch {}

      const { categoria, nivel, duracion } = analizarCurso(item.titulo, 'COMPLEMENTARIA VIRTUAL', item.url);

      const existe = await prisma.cursoExterno.findFirst({
        where: { fuenteUrl: item.url }
      });

      const dataPayload = {
        titulo: item.titulo,
        descripcion: `Curso virtual complementario del SENA: "${item.titulo}". Proporciona formación técnica estructurada y habilidades prácticas certificadas para el desarrollo productivo y laboral.`,
        fuenteUrl: item.url,
        fuenteNombre: 'SENA Betowa',
        codigoExterno: programId,
        duracionHoras: duracion,
        nivel: 'Complementaria',
        modalidad: 'Virtual',
        idioma: 'es',
        imagenUrl: `https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=400&auto=format&fit=crop`,
        areaConocimiento: 'COMPLEMENTARIA VIRTUAL',
        estaActivo: true,
        estado: 'pendiente',
        institucionId: instId
      };

      if (existe) {
        await prisma.cursoExterno.update({
          where: { id: existe.id },
          data: dataPayload
        });
        stats.sena.actualizados++;
      } else {
        await prisma.cursoExterno.create({
          data: dataPayload
        });
        stats.sena.creados++;
      }
    }
    console.log(`  📊 SENA Betowa (Muestra): ${stats.sena.creados} creados, ${stats.sena.actualizados} actualizados.`);
  }

  // Cerrar Puppeteer
  await browser.close();

  console.log('\n🎉 ¡PROCESO DE IMPORTACIÓN Y ENRIQUECIMIENTO COMPLETADO CON ÉXITO! 🎉');
  console.log('-------------------------------------------------------------------');
  console.log(`- Coursera:             ${stats.coursera.creados} nuevos, ${stats.coursera.actualizados} actualizados.`);
  console.log(`- AvanzaTEC:            ${stats.avanzatec.creados} nuevos, ${stats.avanzatec.actualizados} actualizados.`);
  console.log(`- TalentoTech:          ${stats.talentotech.creados} nuevos, ${stats.talentotech.actualizados} actualizados.`);
  console.log(`- Fundación Carlos Slim: ${stats.carlosslim.creados} nuevos, ${stats.carlosslim.actualizados} actualizados.`);
  console.log(`- SENA Betowa (Muestra): ${stats.sena.creados} nuevos, ${stats.sena.actualizados} actualizados.`);
  console.log('-------------------------------------------------------------------');
}

main()
  .catch((error) => {
    console.error('\n❌ Error catastrófico en el script:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
