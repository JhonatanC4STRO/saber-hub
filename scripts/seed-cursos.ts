import 'dotenv/config';
import { PrismaClient } from '../app/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// Inicializar de la misma forma que el proyecto original
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const coursesToSeed = [
  {
    titulo: 'Introducción a JavaScript y Desarrollo Web Moderno',
    descripcion:
      'Aprende los fundamentos del lenguaje de la web: variables, funciones, manipulación del DOM, programación asíncrona y estándares modernos ES6+.',
    categoria: 'Desarrollo Web',
    imgPortada:
      'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?q=80&w=600&auto=format&fit=crop',
    modulos: [
      {
        titulo: 'Fundamentos Básicos',
        descripcion: 'Sintaxis, variables, condicionales y bucles en JavaScript.',
        lecciones: [
          {
            titulo: 'Hola Mundo y Configuración del Entorno',
            contenidoTexto:
              'Bienvenidos al curso. En esta lección instalaremos Node.js, configuraremos VS Code y escribiremos nuestro primer Hola Mundo en JavaScript.',
            duracion: 15,
          },
          {
            titulo: 'Variables y Tipos de Datos',
            contenidoTexto:
              'Aprende la diferencia entre let, const y var, así como los tipos de datos primitivos en JavaScript: String, Number, Boolean, null y undefined.',
            duracion: 20,
          },
        ],
      },
      {
        titulo: 'Funciones y Objetos',
        descripcion: 'Modulariza tu código y entiende las estructuras de datos clave.',
        lecciones: [
          {
            titulo: 'Declaración y Expresión de Funciones',
            contenidoTexto:
              'Estudiaremos cómo definir funciones, parámetros por defecto, funciones flecha (arrow functions) y el alcance de las variables (scope).',
            duracion: 18,
          },
          {
            titulo: 'Manipulación de Objetos y Arreglos',
            contenidoTexto:
              'Aprende a estructurar tus datos usando objetos literales, métodos de arreglos avanzados como map, filter, reduce y desestructuración.',
            duracion: 25,
          },
        ],
      },
    ],
  },
  {
    titulo: 'Desarrollo de APIs RESTful con Node.js y Express',
    descripcion:
      'Domina el desarrollo del lado del servidor construyendo APIs robustas, autenticación segura con JWT y conexión a bases de datos con ORMs.',
    categoria: 'Desarrollo Backend',
    imgPortada:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop',
    modulos: [
      {
        titulo: 'Iniciando con Node.js',
        descripcion: 'Conceptos clave del entorno de ejecución de JavaScript en el servidor.',
        lecciones: [
          {
            titulo: 'El Event Loop y Asincronía',
            contenidoTexto:
              'Entiende cómo funciona el motor de Node.js, su arquitectura no bloqueante y el bucle de eventos.',
            duracion: 15,
          },
          {
            titulo: 'Módulos y NPM',
            contenidoTexto:
              'Gestión de paquetes usando npm e importación de módulos usando CommonJS y ES Modules.',
            duracion: 20,
          },
        ],
      },
      {
        titulo: 'Construyendo APIs con Express',
        descripcion: 'Rutas, controladores y middlewares esenciales.',
        lecciones: [
          {
            titulo: 'Creación de Servidor y Routing',
            contenidoTexto:
              'Aprende a configurar un servidor web básico con Express, definir métodos HTTP (GET, POST, PUT, DELETE) y gestionar parámetros de ruta.',
            duracion: 22,
          },
          {
            titulo: 'Middlewares y Validación de Datos',
            contenidoTexto:
              'Qué son los middlewares, cómo interceptar solicitudes para validación, manejo de errores globales y parseo de JSON.',
            duracion: 25,
          },
        ],
      },
    ],
  },
  {
    titulo: 'Bases de Datos Relacionales y Modelado con PostgreSQL',
    descripcion:
      'Diseña bases de datos altamente optimizadas, domina el lenguaje de consultas SQL y maneja transacciones complejas con integridad referencial.',
    categoria: 'Bases de Datos',
    imgPortada:
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=600&auto=format&fit=crop',
    modulos: [
      {
        titulo: 'Introducción y SQL Básico',
        descripcion: 'Bases de la estructura de tablas y consultas sencillas.',
        lecciones: [
          {
            titulo: 'Instalación e Introducción a DDL',
            contenidoTexto:
              'Aprende a crear tablas, definir llaves primarias, foráneas y tipos de datos en PostgreSQL.',
            duracion: 18,
          },
          {
            titulo: 'Consultas SELECT y Filtrado',
            contenidoTexto:
              'Domina la cláusula SELECT, condiciones WHERE, ordenamiento ORDER BY y operadores lógicos.',
            duracion: 20,
          },
        ],
      },
      {
        titulo: 'Relaciones y Joins',
        descripcion: 'Combina información de múltiples tablas de forma eficiente.',
        lecciones: [
          {
            titulo: 'Inner Join y Outer Joins',
            contenidoTexto:
              'Aprende a cruzar tablas usando relaciones uno-a-muchos y muchos-a-muchos mediante JOINs de SQL.',
            duracion: 25,
          },
          {
            titulo: 'Funciones de Agregación',
            contenidoTexto:
              'Usa SUM, AVG, COUNT, GROUP BY y HAVING para generar reportes analíticos básicos de tus datos.',
            duracion: 30,
          },
        ],
      },
    ],
  },
  {
    titulo: 'Desarrollo Frontend React.js y Control de Estado',
    descripcion:
      'Aprende a crear aplicaciones web de una sola página (SPA) altamente interactivas usando componentes reutilizables, Hooks modernos y patrones avanzados.',
    categoria: 'Desarrollo Frontend',
    imgPortada:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop',
    modulos: [
      {
        titulo: 'Conceptos Clave de React',
        descripcion: 'Componentes funcionales, props y renderizado condicional.',
        lecciones: [
          {
            titulo: 'JSX y Virtual DOM',
            contenidoTexto:
              'Entiende qué es JSX, cómo funciona la renderización de React bajo el capó y la ventaja del Virtual DOM.',
            duracion: 20,
          },
          {
            titulo: 'Props y Estado Local (useState)',
            contenidoTexto:
              'Aprende a transferir datos a componentes mediante props y a controlar el ciclo de vida del componente con useState.',
            duracion: 22,
          },
        ],
      },
      {
        titulo: 'Hooks Avanzados e Integración',
        descripcion: 'Manejo de efectos secundarios y llamadas a APIs externas.',
        lecciones: [
          {
            titulo: 'Efectos Secundarios con useEffect',
            contenidoTexto:
              'Aprende a manejar el ciclo de vida de montaje, actualización y desmontaje para cargar datos desde un servidor remoto.',
            duracion: 25,
          },
          {
            titulo: 'Manejo de Formularios y Eventos',
            contenidoTexto:
              'Controla entradas de texto de formularios de forma reactiva en React y maneja eventos de usuario.',
            duracion: 28,
          },
        ],
      },
    ],
  },
  {
    titulo: 'Fundamentos de Python y Lógica de Programación',
    descripcion:
      'La puerta de entrada perfecta al desarrollo de software y ciencia de datos. Aprende algoritmos, estructuras de datos nativas y resolución de problemas.',
    categoria: 'Fundamentos de Programación',
    imgPortada:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
    modulos: [
      {
        titulo: 'Primeros Pasos con Python',
        descripcion: 'Sintaxis limpia e intuitiva característica de Python.',
        lecciones: [
          {
            titulo: 'Tipos de Variables y Operadores',
            contenidoTexto:
              'Conoce los tipos de variables, operaciones matemáticas y manipulación de texto básica en Python.',
            duracion: 15,
          },
          {
            titulo: 'Estructuras de Control de Flujo',
            contenidoTexto:
              'Aprende a tomar decisiones en tu código con if, elif, else y a repetir bloques de código con bucles while y for.',
            duracion: 18,
          },
        ],
      },
      {
        titulo: 'Estructuras de Datos Nativas',
        descripcion: 'Colecciones de datos integradas e indispensables.',
        lecciones: [
          {
            titulo: 'Listas y Tuplas',
            contenidoTexto:
              'Aprende a almacenar colecciones ordenadas de datos, agregar elementos, indexación y rebanado (slicing).',
            duracion: 20,
          },
          {
            titulo: 'Diccionarios y Conjuntos',
            contenidoTexto:
              'Entiende el modelado de datos clave-valor con diccionarios y colecciones sin duplicados usando conjuntos.',
            duracion: 22,
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log('🚀 Iniciando seed de cursos de programación...');

  try {
    // 1. Encontrar o crear un instructor/administrador válido en la BD
    let instructor = await prisma.usuario.findFirst({
      where: {
        rol: {
          nombre: { in: ['instructor', 'admin'] },
        },
      },
    });

    if (!instructor) {
      console.log('⚠️ No se encontró ningún instructor o administrador en la BD.');
      console.log('🔄 Buscando cualquier usuario para asignarlo como autor...');
      instructor = await prisma.usuario.findFirst();
    }

    if (!instructor) {
      console.log('❌ No hay ningún usuario registrado en la base de datos.');
      console.log('🔄 Creando un usuario instructor por defecto para asociar los cursos...');

      // Encontrar rol de instructor
      let rolInstructor = await prisma.rol.findUnique({
        where: { nombre: 'instructor' },
      });

      if (!rolInstructor) {
        rolInstructor = await prisma.rol.create({
          data: {
            nombre: 'instructor',
            descripcion: 'Docente encargado de impartir y calificar cursos.',
          },
        });
      }

      instructor = await prisma.usuario.create({
        data: {
          nombre: 'Docente Certificado',
          email: 'instructor.seed@saberhub.co',
          documento: '1234567890',
          passwordHash: '$2a$10$3Yd5qCq/eU9j25DfgJbW/e7/Z8V2lO5U5y1yT1mN.eR.Fm95y3YnC', // "Password123"
          rolId: rolInstructor.id,
          activo: true,
          verificado: true,
        },
      });
      console.log(
        `✅ Creado usuario instructor de respaldo: ${instructor.nombre} (${instructor.email})`
      );
    } else {
      console.log(
        `👤 Utilizando usuario existente como autor: ${instructor.nombre} (${instructor.email})`
      );
    }

    // 2. Iterar y sembrar los cursos
    for (const courseData of coursesToSeed) {
      console.log(`\n📚 Procesando curso: "${courseData.titulo}"...`);

      // Crear o buscar la categoría (UPSERT)
      // Tal como solicitó el usuario, si la categoría no existe, se guarda automáticamente en la BD
      const categoriaDb = await prisma.categoria.upsert({
        where: { nombre: courseData.categoria },
        update: {},
        create: {
          nombre: courseData.categoria,
          descripcion: `Cursos avanzados de la rama de ${courseData.categoria}`,
        },
      });
      console.log(`🏷️ Categoría resuelta: "${categoriaDb.nombre}" (ID: ${categoriaDb.id})`);

      // Crear el curso en estado publicado
      const cursoDb = await prisma.curso.create({
        data: {
          titulo: courseData.titulo,
          descripcion: courseData.descripcion,
          imgPortada: courseData.imgPortada,
          categoriaId: categoriaDb.id,
          instructorId: instructor.id,
          estado: 'publicado', // Se crea publicado para que sea visible inmediatamente en el catálogo
          otorgaCertificado: true,
        },
      });
      console.log(`✅ Curso creado: ID ${cursoDb.id}`);

      // Crear los módulos y lecciones asociadas de forma secuencial
      for (let mIdx = 0; mIdx < courseData.modulos.length; mIdx++) {
        const moduloData = courseData.modulos[mIdx];
        const moduloDb = await prisma.modulo.create({
          data: {
            cursoId: cursoDb.id,
            titulo: moduloData.titulo,
            descripcion: moduloData.descripcion,
            orden: mIdx + 1,
            estado: 'activo',
          },
        });
        console.log(`  📦 Módulo [${mIdx + 1}]: "${moduloDb.titulo}"`);

        for (let lIdx = 0; lIdx < moduloData.lecciones.length; lIdx++) {
          const leccionData = moduloData.lecciones[lIdx];
          const leccionDb = await prisma.leccion.create({
            data: {
              moduloId: moduloDb.id,
              titulo: leccionData.titulo,
              contenidoTexto: leccionData.contenidoTexto,
              duracion: leccionData.duracion,
              orden: lIdx + 1,
            },
          });
          console.log(`    📄 Lección [${lIdx + 1}]: "${leccionDb.titulo}"`);
        }
      }
    }

    console.log('\n✨ ¡Proceso de sembrado de cursos de programación completado con éxito! ✨');
  } catch (error: any) {
    console.error('\n❌ Error inesperado durante el sembrado:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
