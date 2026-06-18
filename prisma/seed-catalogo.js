import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const INSTRUCTOR_ID = 'cmpaeu2js000268uqi6coyput';

async function main() {
  console.log('🌱 Iniciando seed del catálogo...\n');

  // ============================================================
  // 1. CATEGORÍAS (upsert por nombre único)
  // ============================================================
  const categoriasData = [
    {
      nombre: 'Ciberseguridad',
      descripcion: 'Seguridad informática, hacking ético y protección de datos.',
    },
    { nombre: 'Programación', descripcion: 'Desarrollo de software, lenguajes y frameworks.' },
    {
      nombre: 'Inteligencia Artificial',
      descripcion: 'Machine learning, deep learning y aplicaciones de IA.',
    },
    {
      nombre: 'Redes',
      descripcion: 'Infraestructura de redes, protocolos y administración de sistemas.',
    },
    {
      nombre: 'Datos y Analítica',
      descripcion: 'Análisis de datos, Business Intelligence y visualización.',
    },
    {
      nombre: 'Marketing Digital',
      descripcion: 'Estrategias digitales, SEO, SEM y redes sociales.',
    },
    { nombre: 'Diseño Digital', descripcion: 'Diseño UX/UI, gráfico y experiencia de usuario.' },
    {
      nombre: 'Habilidades Profesionales',
      descripcion: 'Liderazgo, comunicación efectiva y desarrollo profesional.',
    },
  ];

  const categorias = {};
  for (const cat of categoriasData) {
    const categoria = await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: { descripcion: cat.descripcion },
      create: cat,
    });
    categorias[cat.nombre] = categoria;
    console.log(`  ✅ Categoría: ${categoria.nombre} (${categoria.id})`);
  }

  // ============================================================
  // 2. INSTITUCIONES (create)
  // ============================================================
  const institucionesData = [
    {
      nombre: 'SENA',
      slug: 'sena',
      descripcion: 'Servicio Nacional de Aprendizaje – formación profesional integral en Colombia.',
      url: 'https://www.sena.edu.co',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logo_SENA_Colombia.svg/200px-Logo_SENA_Colombia.svg.png',
    },
    {
      nombre: 'MinTIC',
      slug: 'mintic',
      descripcion: 'Ministerio de Tecnologías de la Información y las Comunicaciones de Colombia.',
      url: 'https://www.mintic.gov.co',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Min_tic_colombia.png/200px-Min_tic_colombia.png',
    },
    {
      nombre: 'Universidad Nacional de Colombia',
      slug: 'universidad-nacional',
      descripcion: 'Principal universidad pública de Colombia con más de 150 años de historia.',
      url: 'https://unal.edu.co',
      logoUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Escudo_de_la_Universidad_Nacional_de_Colombia.svg/200px-Escudo_de_la_Universidad_Nacional_de_Colombia.svg.png',
    },
    {
      nombre: 'SABERHUB Academy',
      slug: 'saberhub-academy',
      descripcion: 'Plataforma de aprendizaje en línea con cursos especializados en tecnología.',
      url: 'https://saberhub.academy',
      logoUrl: null,
    },
  ];

  const instituciones = {};
  for (const inst of institucionesData) {
    const institucion = await prisma.institucion.create({ data: inst });
    instituciones[inst.nombre] = institucion;
    console.log(`  🏛️  Institución: ${institucion.nombre} (${institucion.id})`);
  }

  // ============================================================
  // 3. CURSOS CON MÓDULOS Y LECCIONES
  // ============================================================
  const cursosData = [
    // ── Curso 1 ──
    {
      titulo: 'Introducción a la Ciberseguridad',
      descripcion:
        'Aprende los fundamentos de la seguridad informática, las amenazas más comunes y cómo proteger sistemas y datos. Este curso cubre desde conceptos básicos de criptografía hasta la gestión de vulnerabilidades en entornos empresariales.',
      imgPortada: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&h=338&fit=crop',
      institucionNombre: 'MinTIC',
      categoriaNombre: 'Ciberseguridad',
      otorgaCertificado: true,
      modulos: [
        {
          orden: 1,
          titulo: 'Fundamentos de Seguridad',
          descripcion: 'Conceptos clave y principios de la ciberseguridad.',
          lecciones: [
            {
              orden: 1,
              titulo: '¿Qué es la Ciberseguridad?',
              contenidoTexto:
                'Introducción al campo de la seguridad informática y su importancia en la era digital.',
              duracion: 15,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'Tipos de amenazas y ataques',
              contenidoTexto:
                'Malware, phishing, ransomware, ataques DDoS y otras amenazas comunes.',
              duracion: 20,
            },
            {
              orden: 3,
              titulo: 'Principios CIA: Confidencialidad, Integridad y Disponibilidad',
              contenidoTexto: 'Los tres pilares fundamentales de la seguridad de la información.',
              duracion: 18,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'Protección de Datos',
          descripcion: 'Estrategias para proteger información sensible.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Criptografía básica',
              contenidoTexto: 'Cifrado simétrico, asimétrico y funciones hash.',
              duracion: 25,
            },
            {
              orden: 2,
              titulo: 'Gestión de contraseñas y autenticación',
              contenidoTexto:
                'Buenas prácticas para la gestión de credenciales y autenticación multifactor.',
              duracion: 20,
            },
          ],
        },
      ],
    },
    // ── Curso 2 ──
    {
      titulo: 'Introducción a la Inteligencia Artificial Moderna',
      descripcion:
        'Descubre cómo la inteligencia artificial está transformando el mundo. Desde los algoritmos clásicos de machine learning hasta las redes neuronales profundas, este curso te dará una base sólida para comprender y aplicar IA.',
      imgPortada:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=338&fit=crop',
      institucionNombre: 'SENA',
      categoriaNombre: 'Inteligencia Artificial',
      otorgaCertificado: true,
      modulos: [
        {
          orden: 1,
          titulo: 'Conceptos Básicos de IA',
          descripcion: 'Historia, definiciones y aplicaciones actuales de la IA.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Historia y evolución de la IA',
              contenidoTexto:
                'Desde los primeros sistemas expertos hasta los modelos generativos actuales.',
              duracion: 18,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'Tipos de aprendizaje automático',
              contenidoTexto: 'Aprendizaje supervisado, no supervisado y por refuerzo.',
              duracion: 22,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'Machine Learning en la Práctica',
          descripcion: 'Algoritmos y herramientas para construir modelos de ML.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Regresión y clasificación',
              contenidoTexto: 'Modelos lineales, árboles de decisión y métricas de evaluación.',
              duracion: 25,
            },
            {
              orden: 2,
              titulo: 'Introducción a redes neuronales',
              contenidoTexto: 'Perceptrones, capas ocultas y funciones de activación.',
              duracion: 30,
            },
            {
              orden: 3,
              titulo: 'Herramientas: Python, Scikit-learn y TensorFlow',
              contenidoTexto: 'Configuración del entorno y primeros modelos prácticos.',
              duracion: 28,
            },
          ],
        },
        {
          orden: 3,
          titulo: 'IA Generativa',
          descripcion: 'Modelos de lenguaje y generación de contenido.',
          lecciones: [
            {
              orden: 1,
              titulo: 'GPT y modelos de lenguaje',
              contenidoTexto: 'Cómo funcionan los transformers y los grandes modelos de lenguaje.',
              duracion: 22,
            },
            {
              orden: 2,
              titulo: 'Aplicaciones prácticas de IA generativa',
              contenidoTexto: 'Generación de texto, imágenes y código con herramientas de IA.',
              duracion: 20,
            },
          ],
        },
      ],
    },
    // ── Curso 3 ──
    {
      titulo: 'Fundamentos de Redes',
      descripcion:
        'Domina los conceptos esenciales de redes de computadores. Aprenderás sobre el modelo OSI, protocolos TCP/IP, direccionamiento IP y configuración básica de switches y routers.',
      imgPortada: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=338&fit=crop',
      institucionNombre: 'SABERHUB Academy',
      categoriaNombre: 'Redes',
      otorgaCertificado: false,
      modulos: [
        {
          orden: 1,
          titulo: 'Modelo OSI y TCP/IP',
          descripcion: 'Capas de red y protocolos fundamentales.',
          lecciones: [
            {
              orden: 1,
              titulo: 'El modelo OSI: las 7 capas',
              contenidoTexto:
                'Capa física, enlace de datos, red, transporte, sesión, presentación y aplicación.',
              duracion: 20,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'Protocolo TCP/IP',
              contenidoTexto: 'Estructura del stack TCP/IP y comparación con el modelo OSI.',
              duracion: 22,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'Direccionamiento y Subnetting',
          descripcion: 'IPv4, IPv6 y segmentación de redes.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Direccionamiento IPv4',
              contenidoTexto: 'Clases de direcciones, máscara de subred y notación CIDR.',
              duracion: 25,
            },
            {
              orden: 2,
              titulo: 'Subnetting práctico',
              contenidoTexto: 'Cálculo de subredes, hosts disponibles y ejercicios prácticos.',
              duracion: 30,
            },
            {
              orden: 3,
              titulo: 'Introducción a IPv6',
              contenidoTexto: 'Por qué necesitamos IPv6 y cómo funciona el nuevo protocolo.',
              duracion: 18,
            },
          ],
        },
      ],
    },
    // ── Curso 4 ──
    {
      titulo: 'Programación en Python desde Cero',
      descripcion:
        'Aprende a programar desde cero con Python, uno de los lenguajes más populares y versátiles. Este curso cubre desde variables y estructuras de control hasta programación orientada a objetos y manejo de archivos.',
      imgPortada:
        'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=338&fit=crop',
      institucionNombre: 'SENA',
      categoriaNombre: 'Programación',
      otorgaCertificado: true,
      modulos: [
        {
          orden: 1,
          titulo: 'Fundamentos de Python',
          descripcion: 'Primeros pasos con el lenguaje Python.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Instalación y primer programa',
              contenidoTexto:
                'Cómo instalar Python, configurar el IDE y escribir tu primer script "Hola Mundo".',
              duracion: 12,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'Variables, tipos de datos y operadores',
              contenidoTexto: 'Enteros, flotantes, strings, booleanos y operaciones básicas.',
              duracion: 20,
            },
            {
              orden: 3,
              titulo: 'Estructuras de control',
              contenidoTexto: 'Condicionales if/elif/else y bucles for/while.',
              duracion: 25,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'Funciones y Estructuras de Datos',
          descripcion: 'Organiza tu código y maneja colecciones.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Funciones y parámetros',
              contenidoTexto: 'Definición de funciones, argumentos, retorno de valores y scope.',
              duracion: 22,
            },
            {
              orden: 2,
              titulo: 'Listas, tuplas y diccionarios',
              contenidoTexto: 'Colecciones de datos, iteración y métodos principales.',
              duracion: 28,
            },
          ],
        },
        {
          orden: 3,
          titulo: 'Programación Orientada a Objetos',
          descripcion: 'Clases, herencia y polimorfismo en Python.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Clases y objetos',
              contenidoTexto: 'Definición de clases, atributos, métodos y el constructor __init__.',
              duracion: 25,
            },
            {
              orden: 2,
              titulo: 'Herencia y polimorfismo',
              contenidoTexto:
                'Reutilización de código mediante herencia y sobrescritura de métodos.',
              duracion: 22,
            },
          ],
        },
      ],
    },
    // ── Curso 5 ──
    {
      titulo: 'Análisis de Datos con Excel y SQL',
      descripcion:
        'Conviértete en un analista de datos competente dominando Excel avanzado y SQL. Aprenderás a limpiar, transformar y visualizar datos para tomar decisiones basadas en evidencia.',
      imgPortada: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=338&fit=crop',
      institucionNombre: 'Universidad Nacional de Colombia',
      categoriaNombre: 'Datos y Analítica',
      otorgaCertificado: true,
      modulos: [
        {
          orden: 1,
          titulo: 'Excel Avanzado para Análisis',
          descripcion: 'Fórmulas, tablas dinámicas y gráficos.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Fórmulas avanzadas y funciones',
              contenidoTexto: 'BUSCARV, INDICE/COINCIDIR, SI anidados y funciones de texto.',
              duracion: 25,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'Tablas dinámicas y gráficos',
              contenidoTexto:
                'Creación de informes interactivos con tablas dinámicas y dashboards.',
              duracion: 30,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'SQL para Analistas',
          descripcion: 'Consultas y manipulación de bases de datos.',
          lecciones: [
            {
              orden: 1,
              titulo: 'SELECT, WHERE y JOINs',
              contenidoTexto: 'Consultas básicas, filtrado de datos y combinación de tablas.',
              duracion: 28,
            },
            {
              orden: 2,
              titulo: 'Funciones de agregación y subconsultas',
              contenidoTexto: 'GROUP BY, HAVING, COUNT, SUM, AVG y subconsultas correlacionadas.',
              duracion: 30,
            },
            {
              orden: 3,
              titulo: 'Optimización de consultas',
              contenidoTexto:
                'Índices, planes de ejecución y buenas prácticas para consultas eficientes.',
              duracion: 22,
            },
          ],
        },
      ],
    },
    // ── Curso 6 ──
    {
      titulo: 'Marketing Digital para Emprendedores',
      descripcion:
        'Aprende a crear estrategias de marketing digital efectivas para tu emprendimiento. Desde SEO y redes sociales hasta campañas de email marketing y publicidad paga.',
      imgPortada:
        'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&h=338&fit=crop',
      institucionNombre: 'MinTIC',
      categoriaNombre: 'Marketing Digital',
      otorgaCertificado: false,
      modulos: [
        {
          orden: 1,
          titulo: 'Fundamentos del Marketing Digital',
          descripcion: 'Conceptos clave y ecosistema digital.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Ecosistema digital y buyer persona',
              contenidoTexto:
                'Cómo definir tu público objetivo y entender el recorrido del cliente digital.',
              duracion: 18,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'SEO: Optimización para buscadores',
              contenidoTexto:
                'Palabras clave, optimización on-page, link building y herramientas SEO.',
              duracion: 25,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'Redes Sociales y Publicidad',
          descripcion: 'Estrategias para redes sociales y campañas pagadas.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Estrategia en redes sociales',
              contenidoTexto:
                'Planificación de contenido, calendario editorial y métricas de engagement.',
              duracion: 22,
            },
            {
              orden: 2,
              titulo: 'Publicidad en Google Ads y Meta Ads',
              contenidoTexto:
                'Configuración de campañas, segmentación de audiencias y optimización de presupuesto.',
              duracion: 28,
            },
            {
              orden: 3,
              titulo: 'Email marketing y automatización',
              contenidoTexto:
                'Construcción de listas, diseño de newsletters y flujos automatizados.',
              duracion: 20,
            },
          ],
        },
      ],
    },
    // ── Curso 7 ──
    {
      titulo: 'Diseño de Experiencia de Usuario (UX/UI)',
      descripcion:
        'Descubre cómo diseñar productos digitales centrados en el usuario. Este curso abarca desde la investigación de usuarios hasta la creación de prototipos interactivos y pruebas de usabilidad.',
      imgPortada:
        'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=338&fit=crop',
      institucionNombre: 'SABERHUB Academy',
      categoriaNombre: 'Diseño Digital',
      otorgaCertificado: true,
      modulos: [
        {
          orden: 1,
          titulo: 'Investigación de Usuarios',
          descripcion: 'Técnicas para comprender las necesidades del usuario.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Métodos de investigación UX',
              contenidoTexto: 'Entrevistas, encuestas, tests de usabilidad y análisis heurístico.',
              duracion: 20,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'Personas y mapas de empatía',
              contenidoTexto:
                'Cómo crear representaciones del usuario ideal y comprender sus motivaciones.',
              duracion: 18,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'Diseño de Interfaces',
          descripcion: 'Principios de diseño visual y sistemas de diseño.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Principios de diseño visual',
              contenidoTexto: 'Tipografía, color, jerarquía visual y accesibilidad.',
              duracion: 22,
            },
            {
              orden: 2,
              titulo: 'Wireframes y prototipos',
              contenidoTexto: 'Creación de wireframes de baja y alta fidelidad con Figma.',
              duracion: 28,
            },
            {
              orden: 3,
              titulo: 'Sistemas de diseño y componentes',
              contenidoTexto: 'Librerías de componentes, tokens de diseño y documentación.',
              duracion: 25,
            },
          ],
        },
      ],
    },
    // ── Curso 8 ──
    {
      titulo: 'Habilidades Blandas para el Éxito Profesional',
      descripcion:
        'Desarrolla las competencias interpersonales más demandadas en el mercado laboral. Aprende comunicación efectiva, liderazgo, trabajo en equipo y gestión del tiempo para destacar profesionalmente.',
      imgPortada:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=338&fit=crop',
      institucionNombre: 'Universidad Nacional de Colombia',
      categoriaNombre: 'Habilidades Profesionales',
      otorgaCertificado: false,
      modulos: [
        {
          orden: 1,
          titulo: 'Comunicación y Liderazgo',
          descripcion: 'Habilidades de comunicación efectiva y liderazgo.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Comunicación asertiva',
              contenidoTexto:
                'Técnicas para expresar ideas con claridad, escucha activa y comunicación no verbal.',
              duracion: 15,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'Liderazgo y motivación de equipos',
              contenidoTexto: 'Estilos de liderazgo, delegación efectiva y cómo inspirar a otros.',
              duracion: 20,
            },
            {
              orden: 3,
              titulo: 'Resolución de conflictos',
              contenidoTexto:
                'Estrategias para manejar conflictos en el entorno laboral de forma constructiva.',
              duracion: 18,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'Productividad Personal',
          descripcion: 'Gestión del tiempo y organización.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Gestión del tiempo y priorización',
              contenidoTexto:
                'Método Pomodoro, matriz de Eisenhower y técnicas para eliminar distracciones.',
              duracion: 18,
            },
            {
              orden: 2,
              titulo: 'Trabajo en equipo y colaboración remota',
              contenidoTexto:
                'Herramientas colaborativas, dinámicas de equipo y metodologías ágiles.',
              duracion: 22,
            },
          ],
        },
      ],
    },
    // ── Curso 9 ──
    {
      titulo: 'Ciberseguridad Avanzada en la Nube',
      descripcion:
        'Profundiza en la seguridad de infraestructuras cloud. Aprenderás sobre arquitecturas seguras en AWS, Azure y GCP, gestión de identidades, monitoreo de amenazas y respuesta a incidentes en entornos cloud.',
      imgPortada:
        'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=600&h=338&fit=crop',
      institucionNombre: 'MinTIC',
      categoriaNombre: 'Ciberseguridad',
      otorgaCertificado: true,
      modulos: [
        {
          orden: 1,
          titulo: 'Seguridad en la Nube: Fundamentos',
          descripcion: 'Modelos de responsabilidad compartida y amenazas cloud.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Modelos de servicio cloud (IaaS, PaaS, SaaS)',
              contenidoTexto:
                'Diferencias entre modelos de servicio y sus implicaciones de seguridad.',
              duracion: 20,
              esPreview: true,
            },
            {
              orden: 2,
              titulo: 'Modelo de responsabilidad compartida',
              contenidoTexto:
                'Qué protege el proveedor cloud y qué es responsabilidad del cliente.',
              duracion: 18,
            },
            {
              orden: 3,
              titulo: 'Amenazas comunes en entornos cloud',
              contenidoTexto:
                'Configuraciones erróneas, accesos no autorizados y exfiltración de datos.',
              duracion: 22,
            },
          ],
        },
        {
          orden: 2,
          titulo: 'IAM y Monitoreo',
          descripcion: 'Gestión de identidades y detección de amenazas.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Gestión de identidades y accesos (IAM)',
              contenidoTexto:
                'Políticas de acceso, roles, principio de menor privilegio y federación de identidades.',
              duracion: 25,
            },
            {
              orden: 2,
              titulo: 'Monitoreo y respuesta a incidentes',
              contenidoTexto:
                'Herramientas SIEM, CloudTrail, Azure Monitor y playbooks de respuesta.',
              duracion: 28,
            },
          ],
        },
        {
          orden: 3,
          titulo: 'Arquitecturas Seguras',
          descripcion: 'Diseño de infraestructuras cloud seguras.',
          lecciones: [
            {
              orden: 1,
              titulo: 'Zero Trust en la nube',
              contenidoTexto:
                'Implementación de arquitecturas Zero Trust con microsegmentación y verificación continua.',
              duracion: 25,
            },
            {
              orden: 2,
              titulo: 'DevSecOps y seguridad en CI/CD',
              contenidoTexto:
                'Integración de seguridad en pipelines de desarrollo y despliegue continuo.',
              duracion: 22,
            },
          ],
        },
      ],
    },
  ];

  let totalCursos = 0;
  let totalModulos = 0;
  let totalLecciones = 0;

  for (const cursoData of cursosData) {
    const { modulos, institucionNombre, categoriaNombre, ...cursoFields } = cursoData;

    const curso = await prisma.curso.create({
      data: {
        ...cursoFields,
        estado: 'publicado',
        instructorId: INSTRUCTOR_ID,
        institucionId: instituciones[institucionNombre].id,
        categoriaId: categorias[categoriaNombre].id,
      },
    });
    totalCursos++;
    console.log(`\n  📚 Curso: ${curso.titulo}`);

    for (const moduloData of modulos) {
      const { lecciones, ...moduloFields } = moduloData;

      const modulo = await prisma.modulo.create({
        data: {
          ...moduloFields,
          cursoId: curso.id,
          estado: 'activo',
        },
      });
      totalModulos++;
      console.log(`     📦 Módulo ${modulo.orden}: ${modulo.titulo}`);

      for (const leccionData of lecciones) {
        const leccion = await prisma.leccion.create({
          data: {
            ...leccionData,
            moduloId: modulo.id,
          },
        });
        totalLecciones++;
        console.log(`        📄 Lección ${leccion.orden}: ${leccion.titulo}`);
      }
    }
  }

  // ============================================================
  // RESUMEN
  // ============================================================
  console.log('\n' + '='.repeat(55));
  console.log('  🎉 Seed del catálogo completado exitosamente');
  console.log('='.repeat(55));
  console.log(`  📂 Categorías:    ${categoriasData.length} (upsert)`);
  console.log(`  🏛️  Instituciones: ${institucionesData.length} (creadas)`);
  console.log(`  📚 Cursos:        ${totalCursos}`);
  console.log(`  📦 Módulos:       ${totalModulos}`);
  console.log(`  📄 Lecciones:     ${totalLecciones}`);
  console.log('='.repeat(55) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
