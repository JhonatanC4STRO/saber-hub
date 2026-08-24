import bcrypt from 'bcryptjs';
import {
  createPrisma,
  optionalString,
  parseArgs,
  printMode,
  validatePassword,
} from './lib/importacion';

type SeedUser = {
  nombre: string;
  email: string;
  documento: string;
  rol: 'instructor' | 'estudiante';
};

type SeedQuestion = {
  pregunta: string;
  tipo: 'opcion_multiple' | 'verdadero_falso';
  opciones: Array<{ textoOpcion: string; esCorrecta: boolean }>;
};

type SeedCourse = {
  titulo: string;
  instructorEmail: string;
  descripcion: string;
  categoria: string;
  imgPortada: string;
  nivel: string;
  objetivos: string[];
  requisitos: string[];
  tags: string[];
  modulos: Array<{
    titulo: string;
    descripcion: string;
    lecciones: Array<{
      titulo: string;
      contenidoTexto: string;
      duracion: number;
      esPreview?: boolean;
      recurso?: { titulo: string; urlDocumento: string };
    }>;
  }>;
  evaluacion: {
    titulo: string;
    descripcion: string;
    preguntas: SeedQuestion[];
  };
};

const USERS: SeedUser[] = [
  {
    nombre: 'Laura Martínez',
    email: 'laura.instructora@saberhub.com',
    documento: 'SHI000001',
    rol: 'instructor',
  },
  {
    nombre: 'Andrés Gómez',
    email: 'andres.instructor@saberhub.com',
    documento: 'SHI000002',
    rol: 'instructor',
  },
  {
    nombre: 'Sofía Rodríguez',
    email: 'sofia.estudiante@saberhub.com',
    documento: 'SHE000001',
    rol: 'estudiante',
  },
  {
    nombre: 'Mateo Hernández',
    email: 'mateo.estudiante@saberhub.com',
    documento: 'SHE000002',
    rol: 'estudiante',
  },
  {
    nombre: 'Valentina López',
    email: 'valentina.estudiante@saberhub.com',
    documento: 'SHE000003',
    rol: 'estudiante',
  },
  {
    nombre: 'Samuel Torres',
    email: 'samuel.estudiante@saberhub.com',
    documento: 'SHE000004',
    rol: 'estudiante',
  },
  {
    nombre: 'Isabella Ramírez',
    email: 'isabella.estudiante@saberhub.com',
    documento: 'SHE000005',
    rol: 'estudiante',
  },
  {
    nombre: 'Daniel Castro',
    email: 'daniel.estudiante@saberhub.com',
    documento: 'SHE000006',
    rol: 'estudiante',
  },
];

const COURSES: SeedCourse[] = [
  {
    titulo: 'Fundamentos de Inteligencia Artificial',
    instructorEmail: 'laura.instructora@saberhub.com',
    descripcion:
      'Comprende cómo funciona la inteligencia artificial, reconoce sus aplicaciones y aprende a utilizarla de manera responsable en proyectos cotidianos.',
    categoria: 'Inteligencia Artificial',
    imgPortada:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=675&fit=crop',
    nivel: 'Básico',
    objetivos: [
      'Explicar los conceptos esenciales de la inteligencia artificial',
      'Diferenciar aprendizaje automático, redes neuronales e IA generativa',
      'Aplicar criterios de uso responsable y verificación',
    ],
    requisitos: ['Manejo básico de computador', 'Acceso a internet'],
    tags: ['IA', 'machine learning', 'IA generativa'],
    modulos: [
      {
        titulo: 'Introducción a la inteligencia artificial',
        descripcion: 'Conceptos, historia y tipos principales de sistemas inteligentes.',
        lecciones: [
          {
            titulo: '¿Qué es la inteligencia artificial?',
            contenidoTexto:
              'La inteligencia artificial reúne técnicas que permiten a una máquina realizar tareas asociadas con percepción, razonamiento, aprendizaje y toma de decisiones. En esta lección se estudian sus conceptos principales y sus límites.',
            duracion: 15,
            esPreview: true,
          },
          {
            titulo: 'Machine learning y redes neuronales',
            contenidoTexto:
              'El aprendizaje automático encuentra patrones en datos para realizar predicciones. Las redes neuronales son modelos compuestos por capas que aprenden representaciones cada vez más complejas.',
            duracion: 20,
            recurso: {
              titulo: 'Introducción al aprendizaje automático',
              urlDocumento: 'https://developers.google.com/machine-learning/intro-to-ml',
            },
          },
          {
            titulo: 'IA generativa y modelos de lenguaje',
            contenidoTexto:
              'Los modelos generativos producen texto, imágenes, audio y otros contenidos a partir de patrones aprendidos. Sus respuestas deben comprobarse porque pueden contener errores o información inventada.',
            duracion: 20,
          },
        ],
      },
      {
        titulo: 'Uso práctico y responsable',
        descripcion: 'Aplicaciones, creación de instrucciones y gestión de riesgos.',
        lecciones: [
          {
            titulo: 'Cómo escribir instrucciones claras',
            contenidoTexto:
              'Una buena instrucción define contexto, objetivo, restricciones y formato de salida. Iterar y aportar ejemplos permite obtener resultados más precisos y fáciles de verificar.',
            duracion: 20,
          },
          {
            titulo: 'Sesgos, privacidad y derechos de autor',
            contenidoTexto:
              'Los sistemas pueden reproducir sesgos presentes en sus datos. No se debe compartir información privada y siempre es necesario revisar las condiciones de uso y las fuentes del contenido.',
            duracion: 20,
            recurso: {
              titulo: 'Recomendación de la UNESCO sobre ética de la IA',
              urlDocumento:
                'https://www.unesco.org/es/artificial-intelligence/recommendation-ethics',
            },
          },
          {
            titulo: 'Proyecto: asistente para una tarea cotidiana',
            contenidoTexto:
              'Diseña un pequeño flujo asistido por IA. Define el problema, prepara una instrucción, revisa la respuesta, contrasta datos importantes y documenta las decisiones humanas.',
            duracion: 30,
          },
        ],
      },
    ],
    evaluacion: {
      titulo: 'Evaluación final de Inteligencia Artificial',
      descripcion: 'Comprueba los conceptos esenciales y las prácticas de uso responsable.',
      preguntas: [
        {
          pregunta: '¿Qué describe mejor al aprendizaje automático?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Aprende patrones a partir de datos', esCorrecta: true },
            { textoOpcion: 'Solo almacena archivos', esCorrecta: false },
            { textoOpcion: 'Sustituye cualquier decisión humana', esCorrecta: false },
          ],
        },
        {
          pregunta: 'Una respuesta de IA generativa siempre es verdadera.',
          tipo: 'verdadero_falso',
          opciones: [
            { textoOpcion: 'Verdadero', esCorrecta: false },
            { textoOpcion: 'Falso', esCorrecta: true },
          ],
        },
        {
          pregunta: '¿Qué debe incluir una instrucción clara?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Contexto, objetivo y formato esperado', esCorrecta: true },
            { textoOpcion: 'Solo una palabra', esCorrecta: false },
            { textoOpcion: 'Información privada del usuario', esCorrecta: false },
          ],
        },
        {
          pregunta: '¿Cuál es una práctica responsable?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Verificar información importante', esCorrecta: true },
            { textoOpcion: 'Compartir contraseñas', esCorrecta: false },
            { textoOpcion: 'Publicar sin revisar', esCorrecta: false },
          ],
        },
        {
          pregunta: 'Los datos de entrenamiento pueden introducir sesgos.',
          tipo: 'verdadero_falso',
          opciones: [
            { textoOpcion: 'Verdadero', esCorrecta: true },
            { textoOpcion: 'Falso', esCorrecta: false },
          ],
        },
      ],
    },
  },
  {
    titulo: 'Ciberseguridad para Todos',
    instructorEmail: 'andres.instructor@saberhub.com',
    descripcion:
      'Protege tus cuentas, dispositivos e información mediante hábitos sencillos de seguridad digital aplicables en el trabajo y en la vida diaria.',
    categoria: 'Ciberseguridad',
    imgPortada: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=675&fit=crop',
    nivel: 'Básico',
    objetivos: [
      'Reconocer amenazas digitales frecuentes',
      'Configurar contraseñas y autenticación seguras',
      'Responder adecuadamente ante un incidente básico',
    ],
    requisitos: ['Acceso a un computador o teléfono', 'No requiere conocimientos técnicos'],
    tags: ['seguridad', 'phishing', 'contraseñas'],
    modulos: [
      {
        titulo: 'Amenazas y protección de cuentas',
        descripcion: 'Riesgos frecuentes y medidas preventivas esenciales.',
        lecciones: [
          {
            titulo: 'Principios básicos de seguridad',
            contenidoTexto:
              'La confidencialidad protege el acceso, la integridad evita alteraciones indebidas y la disponibilidad mantiene los servicios accesibles. Estos tres principios orientan la protección de la información.',
            duracion: 15,
            esPreview: true,
          },
          {
            titulo: 'Contraseñas y autenticación multifactor',
            contenidoTexto:
              'Usa contraseñas únicas y extensas mediante un gestor confiable. La autenticación multifactor reduce el riesgo incluso cuando una contraseña ha sido comprometida.',
            duracion: 20,
          },
          {
            titulo: 'Cómo detectar phishing',
            contenidoTexto:
              'El phishing usa mensajes urgentes, enlaces engañosos y remitentes falsificados. Verifica el dominio, evita abrir archivos inesperados y confirma las solicitudes por un canal independiente.',
            duracion: 20,
            recurso: {
              titulo: 'Guía de phishing de INCIBE',
              urlDocumento: 'https://www.incibe.es/ciudadania/tematicas/phishing',
            },
          },
        ],
      },
      {
        titulo: 'Dispositivos, navegación e incidentes',
        descripcion: 'Protección práctica y respuesta ante problemas de seguridad.',
        lecciones: [
          {
            titulo: 'Actualizaciones y copias de seguridad',
            contenidoTexto:
              'Mantén aplicaciones y sistemas actualizados. Conserva copias de seguridad separadas y verifica periódicamente que puedan restaurarse.',
            duracion: 15,
          },
          {
            titulo: 'Navegación y redes seguras',
            contenidoTexto:
              'Evita operaciones sensibles en redes públicas, comprueba HTTPS y limita los permisos de aplicaciones y extensiones. Una VPN no sustituye los demás controles.',
            duracion: 20,
          },
          {
            titulo: 'Qué hacer ante un incidente',
            contenidoTexto:
              'Desconecta el equipo cuando sea necesario, cambia credenciales desde un dispositivo confiable, conserva evidencias y reporta el incidente al responsable correspondiente.',
            duracion: 25,
            recurso: {
              titulo: 'Recursos de seguridad digital',
              urlDocumento: 'https://www.cisa.gov/secure-our-world',
            },
          },
        ],
      },
    ],
    evaluacion: {
      titulo: 'Evaluación final de Ciberseguridad',
      descripcion: 'Evalúa hábitos de prevención y respuesta ante incidentes.',
      preguntas: [
        {
          pregunta: '¿Cuál es una señal frecuente de phishing?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Urgencia y enlaces sospechosos', esCorrecta: true },
            { textoOpcion: 'Un mensaje esperado y verificado', esCorrecta: false },
            { textoOpcion: 'Una copia local de seguridad', esCorrecta: false },
          ],
        },
        {
          pregunta: 'Es recomendable reutilizar una contraseña segura.',
          tipo: 'verdadero_falso',
          opciones: [
            { textoOpcion: 'Verdadero', esCorrecta: false },
            { textoOpcion: 'Falso', esCorrecta: true },
          ],
        },
        {
          pregunta: '¿Para qué sirve la autenticación multifactor?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Añade una verificación adicional', esCorrecta: true },
            { textoOpcion: 'Elimina la necesidad de actualizar', esCorrecta: false },
            { textoOpcion: 'Hace públicos los archivos', esCorrecta: false },
          ],
        },
        {
          pregunta: 'Las copias de seguridad deben probarse periódicamente.',
          tipo: 'verdadero_falso',
          opciones: [
            { textoOpcion: 'Verdadero', esCorrecta: true },
            { textoOpcion: 'Falso', esCorrecta: false },
          ],
        },
        {
          pregunta: '¿Qué hacer primero ante una cuenta comprometida?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Cambiar credenciales desde un equipo confiable', esCorrecta: true },
            { textoOpcion: 'Ignorar el aviso', esCorrecta: false },
            { textoOpcion: 'Compartir la contraseña', esCorrecta: false },
          ],
        },
      ],
    },
  },
  {
    titulo: 'Excel y Análisis de Datos desde Cero',
    instructorEmail: 'laura.instructora@saberhub.com',
    descripcion:
      'Organiza, limpia y analiza información en hojas de cálculo para producir indicadores y visualizaciones que apoyen decisiones.',
    categoria: 'Datos y Analítica',
    imgPortada: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop',
    nivel: 'Básico',
    objetivos: [
      'Organizar datos en tablas consistentes',
      'Utilizar fórmulas y funciones frecuentes',
      'Construir tablas dinámicas y gráficos claros',
    ],
    requisitos: ['Microsoft Excel o una hoja de cálculo compatible'],
    tags: ['Excel', 'datos', 'visualización'],
    modulos: [
      {
        titulo: 'Organización y fórmulas',
        descripcion: 'Bases para trabajar con datos confiables en una hoja de cálculo.',
        lecciones: [
          {
            titulo: 'Estructura de una tabla de datos',
            contenidoTexto:
              'Cada fila debe representar un registro y cada columna una variable. Usa encabezados únicos, evita celdas combinadas y conserva un solo tipo de dato por columna.',
            duracion: 15,
            esPreview: true,
          },
          {
            titulo: 'Referencias y fórmulas esenciales',
            contenidoTexto:
              'Las referencias relativas cambian al copiar una fórmula y las absolutas permanecen fijas. Practica SUMA, PROMEDIO, MIN, MAX y operaciones aritméticas.',
            duracion: 25,
          },
          {
            titulo: 'Funciones condicionales y de búsqueda',
            contenidoTexto:
              'SI permite evaluar condiciones. CONTAR.SI y SUMAR.SI agregan datos con criterios. BUSCARX relaciona información entre tablas mediante una clave.',
            duracion: 30,
            recurso: {
              titulo: 'Centro de ayuda de Excel',
              urlDocumento: 'https://support.microsoft.com/es-es/excel',
            },
          },
        ],
      },
      {
        titulo: 'Análisis y comunicación visual',
        descripcion: 'Limpieza, resumen y presentación efectiva de información.',
        lecciones: [
          {
            titulo: 'Limpieza y validación de datos',
            contenidoTexto:
              'Identifica duplicados, valores faltantes y formatos inconsistentes. La validación de datos limita entradas incorrectas y mejora la calidad desde el origen.',
            duracion: 25,
          },
          {
            titulo: 'Tablas dinámicas',
            contenidoTexto:
              'Una tabla dinámica resume grandes conjuntos de información. Distribuye campos en filas, columnas, valores y filtros según la pregunta de análisis.',
            duracion: 30,
          },
          {
            titulo: 'Gráficos e indicadores',
            contenidoTexto:
              'Selecciona el gráfico según el mensaje: barras para comparar, líneas para tendencias y dispersión para relaciones. Evita adornos que dificulten la lectura.',
            duracion: 25,
          },
        ],
      },
    ],
    evaluacion: {
      titulo: 'Evaluación final de Excel y Datos',
      descripcion: 'Comprueba los fundamentos de organización, cálculo y visualización.',
      preguntas: [
        {
          pregunta: '¿Qué debe representar cada fila de una tabla?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Un registro', esCorrecta: true },
            { textoOpcion: 'Varios encabezados', esCorrecta: false },
            { textoOpcion: 'Una celda combinada', esCorrecta: false },
          ],
        },
        {
          pregunta: 'Una referencia absoluta cambia al copiar la fórmula.',
          tipo: 'verdadero_falso',
          opciones: [
            { textoOpcion: 'Verdadero', esCorrecta: false },
            { textoOpcion: 'Falso', esCorrecta: true },
          ],
        },
        {
          pregunta: '¿Qué herramienta resume datos por categorías?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Tabla dinámica', esCorrecta: true },
            { textoOpcion: 'Celda combinada', esCorrecta: false },
            { textoOpcion: 'Color de fondo', esCorrecta: false },
          ],
        },
        {
          pregunta: '¿Qué gráfico suele mostrar mejor una tendencia temporal?',
          tipo: 'opcion_multiple',
          opciones: [
            { textoOpcion: 'Gráfico de líneas', esCorrecta: true },
            { textoOpcion: 'Gráfico circular 3D', esCorrecta: false },
            { textoOpcion: 'Cuadro de texto', esCorrecta: false },
          ],
        },
        {
          pregunta: 'La validación de datos ayuda a prevenir entradas incorrectas.',
          tipo: 'verdadero_falso',
          opciones: [
            { textoOpcion: 'Verdadero', esCorrecta: true },
            { textoOpcion: 'Falso', esCorrecta: false },
          ],
        },
      ],
    },
  },
];

const HELP = `
Crear contenido inicial completo para SABERHUB

Uso:
  npm run content:seed
  SABERHUB_SEED_PASSWORD='Temporal123!' npm run content:seed -- --apply

Crea 2 instructores, 6 estudiantes, 3 cursos publicados, 18 lecciones,
3 evaluaciones y 18 inscripciones. La vista previa es el modo predeterminado.
`;

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log(HELP.trim());
    return;
  }

  const prisma = createPrisma();
  try {
    const emails = USERS.map((user) => user.email);
    const existingUsers = await prisma.usuario.findMany({ where: { email: { in: emails } } });
    const newUserCount = USERS.length - existingUsers.length;
    const existingCourseCount = await prisma.curso.count({
      where: { titulo: { in: COURSES.map((course) => course.titulo) } },
    });

    printMode(args.apply);
    console.log(`Usuarios: ${USERS.length} (${newUserCount} nuevos).`);
    console.log(`Cursos: ${COURSES.length} (${COURSES.length - existingCourseCount} nuevos).`);
    console.log('Contenido: 6 módulos, 18 lecciones, 3 evaluaciones y 15 preguntas.');
    console.log('Inscripciones previstas: 18.');

    if (!args.apply) {
      console.log('Define SABERHUB_SEED_PASSWORD y repite con --apply para confirmar.');
      return;
    }

    const password = optionalString(process.env.SABERHUB_SEED_PASSWORD);
    if (!password) throw new Error('Define SABERHUB_SEED_PASSWORD antes de aplicar.');
    validatePassword(password, 'SABERHUB_SEED_PASSWORD');
    const passwordHash = await bcrypt.hash(password, 10);

    const savedUsers = new Map<string, { id: string; rol: string }>();
    await prisma.$transaction(async (tx) => {
      const roles = new Map<string, string>();
      for (const name of ['instructor', 'estudiante'] as const) {
        const role = await tx.rol.upsert({
          where: { nombre: name },
          update: {},
          create: { nombre: name, descripcion: `Rol de ${name}` },
        });
        roles.set(name, role.id);
      }

      for (const user of USERS) {
        const documentOwner = await tx.usuario.findUnique({ where: { documento: user.documento } });
        if (documentOwner && documentOwner.email !== user.email) {
          throw new Error(`El documento ${user.documento} pertenece a ${documentOwner.email}.`);
        }
        const existing = await tx.usuario.findUnique({ where: { email: user.email } });
        const saved = existing
          ? await tx.usuario.update({
              where: { id: existing.id },
              data: {
                nombre: user.nombre,
                documento: user.documento,
                rolId: roles.get(user.rol)!,
                activo: true,
                verificado: true,
              },
            })
          : await tx.usuario.create({
              data: {
                nombre: user.nombre,
                email: user.email,
                documento: user.documento,
                passwordHash,
                rolId: roles.get(user.rol)!,
                activo: true,
                verificado: true,
              },
            });
        savedUsers.set(user.email, { id: saved.id, rol: user.rol });
      }
    });

    const savedCourses: string[] = [];
    for (const course of COURSES) {
      const instructor = savedUsers.get(course.instructorEmail);
      if (!instructor) throw new Error(`No se resolvió el instructor ${course.instructorEmail}.`);

      const savedCourse = await prisma.$transaction(async (tx) => {
        const category = await tx.categoria.upsert({
          where: { nombre: course.categoria },
          update: {},
          create: { nombre: course.categoria, descripcion: `Cursos de ${course.categoria}` },
        });
        const existing = await tx.curso.findFirst({
          where: { titulo: course.titulo, instructorId: instructor.id },
        });
        const courseData = {
          titulo: course.titulo,
          instructorId: instructor.id,
          categoriaId: category.id,
          descripcion: course.descripcion,
          imgPortada: course.imgPortada,
          estado: 'publicado' as const,
          nivel: course.nivel,
          idioma: 'Español',
          duracion: course.modulos.reduce(
            (total, moduleData) =>
              total + moduleData.lecciones.reduce((sum, lesson) => sum + lesson.duracion, 0),
            0
          ),
          duracionUnidad: 'minutos',
          objetivos: course.objetivos,
          requisitos: course.requisitos,
          tags: course.tags,
          otorgaCertificado: true,
          criterioLeccionesMin: 6,
          criterioEvalAprobadas: true,
          criterioNotaGlobal: 70,
        };
        const saved = existing
          ? await tx.curso.update({ where: { id: existing.id }, data: courseData })
          : await tx.curso.create({ data: courseData });

        for (let moduleIndex = 0; moduleIndex < course.modulos.length; moduleIndex += 1) {
          const moduleData = course.modulos[moduleIndex];
          const savedModule = await tx.modulo.upsert({
            where: { cursoId_orden: { cursoId: saved.id, orden: moduleIndex + 1 } },
            update: {
              titulo: moduleData.titulo,
              descripcion: moduleData.descripcion,
              estado: 'activo',
            },
            create: {
              cursoId: saved.id,
              orden: moduleIndex + 1,
              titulo: moduleData.titulo,
              descripcion: moduleData.descripcion,
              estado: 'activo',
            },
          });

          for (let lessonIndex = 0; lessonIndex < moduleData.lecciones.length; lessonIndex += 1) {
            const lesson = moduleData.lecciones[lessonIndex];
            const savedLesson = await tx.leccion.upsert({
              where: { moduloId_orden: { moduloId: savedModule.id, orden: lessonIndex + 1 } },
              update: {
                titulo: lesson.titulo,
                contenidoTexto: lesson.contenidoTexto,
                duracion: lesson.duracion,
                esPreview: lesson.esPreview ?? false,
              },
              create: {
                moduloId: savedModule.id,
                orden: lessonIndex + 1,
                titulo: lesson.titulo,
                contenidoTexto: lesson.contenidoTexto,
                duracion: lesson.duracion,
                esPreview: lesson.esPreview ?? false,
              },
            });
            if (lesson.recurso) {
              const existingResource = await tx.recurso.findFirst({
                where: { leccionId: savedLesson.id, titulo: lesson.recurso.titulo },
              });
              if (existingResource) {
                await tx.recurso.update({
                  where: { id: existingResource.id },
                  data: { tipo: 'enlace', urlDocumento: lesson.recurso.urlDocumento },
                });
              } else {
                await tx.recurso.create({
                  data: {
                    leccionId: savedLesson.id,
                    titulo: lesson.recurso.titulo,
                    tipo: 'enlace',
                    urlDocumento: lesson.recurso.urlDocumento,
                  },
                });
              }
            }
          }
        }

        const existingEvaluation = await tx.evaluacion.findFirst({
          where: { cursoId: saved.id, titulo: course.evaluacion.titulo },
          include: { _count: { select: { intentos: true } } },
        });
        const evaluation = existingEvaluation
          ? await tx.evaluacion.update({
              where: { id: existingEvaluation.id },
              data: {
                descripcion: course.evaluacion.descripcion,
                creadorId: instructor.id,
                puntajeMinimo: 70,
                duracionMinutos: 20,
                intentosMaximos: 3,
                ordenAleatorio: true,
                mostrarRespuestas: true,
              },
            })
          : await tx.evaluacion.create({
              data: {
                cursoId: saved.id,
                creadorId: instructor.id,
                titulo: course.evaluacion.titulo,
                descripcion: course.evaluacion.descripcion,
                puntajeMinimo: 70,
                duracionMinutos: 20,
                intentosMaximos: 3,
                ordenAleatorio: true,
                mostrarRespuestas: true,
              },
            });

        if (!existingEvaluation || existingEvaluation._count.intentos === 0) {
          if (existingEvaluation) {
            await tx.pregunta.deleteMany({ where: { evaluacionId: evaluation.id } });
          }
          for (
            let questionIndex = 0;
            questionIndex < course.evaluacion.preguntas.length;
            questionIndex += 1
          ) {
            const question = course.evaluacion.preguntas[questionIndex];
            const savedQuestion = await tx.pregunta.create({
              data: {
                evaluacionId: evaluation.id,
                pregunta: question.pregunta,
                tipo: question.tipo,
                puntos: 1,
                orden: questionIndex + 1,
              },
            });
            await tx.opcion.createMany({
              data: question.opciones.map((option) => ({
                preguntaId: savedQuestion.id,
                textoOpcion: option.textoOpcion,
                esCorrecta: option.esCorrecta,
              })),
            });
          }
        }

        return saved;
      });
      savedCourses.push(savedCourse.id);
      console.log(`OK curso: ${course.titulo}`);
    }

    const students = USERS.filter((user) => user.rol === 'estudiante');
    for (const student of students) {
      const savedStudent = savedUsers.get(student.email)!;
      for (const savedCourseId of savedCourses) {
        const existing = await prisma.inscripcion.findUnique({
          where: {
            usuarioId_cursoId: { usuarioId: savedStudent.id, cursoId: savedCourseId },
          },
        });
        if (!existing) {
          await prisma.inscripcion.create({
            data: { usuarioId: savedStudent.id, cursoId: savedCourseId },
          });
        } else if (existing.estado === 'retirado') {
          await prisma.inscripcion.update({
            where: { id: existing.id },
            data: { estado: 'activo', fechaInscripcion: new Date() },
          });
        }
      }
    }

    console.log('Carga inicial completada. Las contraseñas de cuentas existentes se conservaron.');
    console.log('Cambia las contraseñas temporales después del primer inicio de sesión.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
