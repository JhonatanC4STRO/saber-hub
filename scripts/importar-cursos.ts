import fs from 'node:fs';
import {
  createPrisma,
  normalizeEmail,
  optionalString,
  parseArgs,
  parseBoolean,
  parseInteger,
  printMode,
  required,
  resolveInputPath,
} from './lib/importacion';

type ResourceInput = {
  titulo: string;
  descripcion?: string;
  tipo: 'pdf' | 'video' | 'audio' | 'imagen' | 'presentacion' | 'enlace' | 'otro';
  urlDocumento: string;
};
type LessonInput = {
  titulo: string;
  contenidoTexto?: string;
  urlVideo?: string;
  duracion?: number;
  esPreview: boolean;
  subtitulos?: string;
  recursos: ResourceInput[];
};
type ModuleInput = {
  titulo: string;
  descripcion?: string;
  estado: 'activo' | 'oculto';
  lecciones: LessonInput[];
};
type CourseInput = {
  titulo: string;
  instructorEmail: string;
  descripcion?: string;
  categoria: string;
  institucionSlug?: string;
  estado: 'borrador' | 'publicado' | 'archivado';
  imgPortada?: string;
  nivel?: string;
  subtitulo?: string;
  subcategoria?: string;
  duracion?: number;
  duracionUnidad?: string;
  idioma?: string;
  objetivos: string[];
  requisitos: string[];
  tags: string[];
  otorgaCertificado: boolean;
  criterioLeccionesMin?: number;
  criterioEvalAprobadas: boolean;
  criterioNotaGlobal?: number;
  modulos: ModuleInput[];
};

const COURSE_STATES = new Set(['borrador', 'publicado', 'archivado']);
const MODULE_STATES = new Set(['activo', 'oculto']);
const RESOURCE_TYPES = new Set([
  'pdf',
  'video',
  'audio',
  'imagen',
  'presentacion',
  'enlace',
  'otro',
]);
const HELP = `
Importar cursos, módulos, lecciones y recursos desde JSON

Uso:
  npm run courses:import -- --file scripts/data/cursos.ejemplo.json [--apply]

La identidad idempotente de un curso es instructorEmail + titulo. Los módulos y
lecciones se actualizan por su posición. La vista previa es el modo predeterminado.
`;

function stringArray(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`"${field}" debe ser un arreglo.`);
  return value.map((item, index) => required(item, `${field}[${index}]`));
}

function prepareCourse(raw: Record<string, unknown>, courseIndex: number): CourseInput {
  const label = `Curso ${courseIndex + 1}`;
  try {
    const estado = optionalString(raw.estado) || 'borrador';
    if (!COURSE_STATES.has(estado)) throw new Error(`estado inválido: ${estado}`);
    const modulesRaw = raw.modulos ?? [];
    if (!Array.isArray(modulesRaw)) throw new Error('"modulos" debe ser un arreglo.');

    const modulos = modulesRaw.map((moduleValue, moduleIndex): ModuleInput => {
      const moduleData = moduleValue as Record<string, unknown>;
      const moduleState = optionalString(moduleData.estado) || 'activo';
      if (!MODULE_STATES.has(moduleState))
        throw new Error(`módulo ${moduleIndex + 1}: estado inválido.`);
      if (!Array.isArray(moduleData.lecciones))
        throw new Error(`módulo ${moduleIndex + 1}: "lecciones" debe ser un arreglo.`);
      return {
        titulo: required(moduleData.titulo, `módulo ${moduleIndex + 1}.titulo`),
        descripcion: optionalString(moduleData.descripcion),
        estado: moduleState as ModuleInput['estado'],
        lecciones: moduleData.lecciones.map((lessonValue, lessonIndex): LessonInput => {
          const lesson = lessonValue as Record<string, unknown>;
          const resourcesRaw = lesson.recursos ?? [];
          if (!Array.isArray(resourcesRaw))
            throw new Error(`lección ${lessonIndex + 1}: "recursos" debe ser un arreglo.`);
          return {
            titulo: required(lesson.titulo, `lección ${lessonIndex + 1}.titulo`),
            contenidoTexto: optionalString(lesson.contenidoTexto),
            urlVideo: optionalString(lesson.urlVideo),
            duracion: parseInteger(lesson.duracion, 'duracion'),
            esPreview: parseBoolean(lesson.esPreview, false),
            subtitulos: optionalString(lesson.subtitulos),
            recursos: resourcesRaw.map((resourceValue, resourceIndex): ResourceInput => {
              const resource = resourceValue as Record<string, unknown>;
              const tipo = required(resource.tipo, `recurso ${resourceIndex + 1}.tipo`);
              if (!RESOURCE_TYPES.has(tipo)) throw new Error(`tipo de recurso inválido: ${tipo}`);
              return {
                titulo: required(resource.titulo, `recurso ${resourceIndex + 1}.titulo`),
                descripcion: optionalString(resource.descripcion),
                tipo: tipo as ResourceInput['tipo'],
                urlDocumento: required(
                  resource.urlDocumento,
                  `recurso ${resourceIndex + 1}.urlDocumento`
                ),
              };
            }),
          };
        }),
      };
    });

    if (estado === 'publicado' && !modulos.some((module) => module.lecciones.length > 0)) {
      throw new Error('un curso publicado debe incluir al menos una lección.');
    }

    return {
      titulo: required(raw.titulo, 'titulo'),
      instructorEmail: normalizeEmail(raw.instructorEmail),
      descripcion: optionalString(raw.descripcion),
      categoria: required(raw.categoria, 'categoria'),
      institucionSlug: optionalString(raw.institucionSlug),
      estado: estado as CourseInput['estado'],
      imgPortada: optionalString(raw.imgPortada),
      nivel: optionalString(raw.nivel),
      subtitulo: optionalString(raw.subtitulo),
      subcategoria: optionalString(raw.subcategoria),
      duracion: parseInteger(raw.duracion, 'duracion'),
      duracionUnidad: optionalString(raw.duracionUnidad),
      idioma: optionalString(raw.idioma),
      objetivos: stringArray(raw.objetivos, 'objetivos'),
      requisitos: stringArray(raw.requisitos, 'requisitos'),
      tags: stringArray(raw.tags, 'tags'),
      otorgaCertificado: parseBoolean(raw.otorgaCertificado, false),
      criterioLeccionesMin: parseInteger(raw.criterioLeccionesMin, 'criterioLeccionesMin'),
      criterioEvalAprobadas: parseBoolean(raw.criterioEvalAprobadas, false),
      criterioNotaGlobal: parseInteger(raw.criterioNotaGlobal, 'criterioNotaGlobal'),
      modulos,
    };
  } catch (error) {
    throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.log(HELP.trim());
    return;
  }

  const input = resolveInputPath(required(args.values.file, 'file'));
  const parsed = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (!Array.isArray(parsed) || parsed.length === 0)
    throw new Error('El JSON debe contener un arreglo de cursos.');
  const courses = parsed.map((course, index) => prepareCourse(course, index));
  const identities = new Set<string>();
  for (const course of courses) {
    const identity = `${course.instructorEmail}\u0000${course.titulo.toLowerCase()}`;
    if (identities.has(identity))
      throw new Error(
        `Curso repetido en el archivo: ${course.titulo} (${course.instructorEmail}).`
      );
    identities.add(identity);
  }

  const prisma = createPrisma();
  try {
    const instructorEmails = [...new Set(courses.map((course) => course.instructorEmail))];
    const instructors = await prisma.usuario.findMany({
      where: { email: { in: instructorEmails } },
      include: { rol: true },
    });
    const instructorByEmail = new Map(instructors.map((user) => [user.email, user]));
    for (const email of instructorEmails) {
      const instructor = instructorByEmail.get(email);
      if (!instructor) throw new Error(`No existe el instructor ${email}.`);
      if (!['admin', 'instructor'].includes(instructor.rol.nombre))
        throw new Error(`${email} no tiene rol admin o instructor.`);
    }

    const slugs = [
      ...new Set(courses.map((course) => course.institucionSlug).filter(Boolean)),
    ] as string[];
    const institutions = await prisma.institucion.findMany({ where: { slug: { in: slugs } } });
    const institutionBySlug = new Map(
      institutions.map((institution) => [institution.slug, institution])
    );
    for (const slug of slugs) {
      if (!institutionBySlug.has(slug))
        throw new Error(`No existe la institución con slug "${slug}".`);
    }

    let creates = 0;
    let updates = 0;
    for (const course of courses) {
      const instructor = instructorByEmail.get(course.instructorEmail)!;
      const existing = await prisma.curso.findFirst({
        where: { instructorId: instructor.id, titulo: course.titulo },
      });
      if (existing) updates += 1;
      else creates += 1;
    }

    printMode(args.apply);
    console.log(`Archivo: ${input}`);
    console.log(`Cursos: ${courses.length} (${creates} nuevos, ${updates} actualizaciones).`);
    console.log(
      `Contenido: ${courses.reduce((sum, course) => sum + course.modulos.length, 0)} módulos.`
    );
    if (!args.apply) {
      console.log('Repite el comando con --apply para confirmar.');
      return;
    }

    for (const course of courses) {
      const instructor = instructorByEmail.get(course.instructorEmail)!;
      const institutionId = course.institucionSlug
        ? institutionBySlug.get(course.institucionSlug)!.id
        : null;
      await prisma.$transaction(async (tx) => {
        const category = await tx.categoria.upsert({
          where: { nombre: course.categoria },
          update: {},
          create: { nombre: course.categoria, descripcion: `Categoría ${course.categoria}` },
        });
        const existing = await tx.curso.findFirst({
          where: { instructorId: instructor.id, titulo: course.titulo },
        });
        const data = {
          titulo: course.titulo,
          descripcion: course.descripcion ?? null,
          categoriaId: category.id,
          institucionId: institutionId,
          instructorId: instructor.id,
          estado: course.estado,
          imgPortada: course.imgPortada ?? null,
          nivel: course.nivel ?? null,
          subtitulo: course.subtitulo ?? null,
          subcategoria: course.subcategoria ?? null,
          duracion: course.duracion ?? null,
          duracionUnidad: course.duracionUnidad ?? null,
          idioma: course.idioma ?? null,
          objetivos: course.objetivos,
          requisitos: course.requisitos,
          tags: course.tags,
          otorgaCertificado: course.otorgaCertificado,
          criterioLeccionesMin: course.otorgaCertificado
            ? (course.criterioLeccionesMin ?? null)
            : null,
          criterioEvalAprobadas: course.otorgaCertificado && course.criterioEvalAprobadas,
          criterioNotaGlobal: course.otorgaCertificado ? (course.criterioNotaGlobal ?? null) : null,
        };
        const saved = existing
          ? await tx.curso.update({ where: { id: existing.id }, data })
          : await tx.curso.create({ data });

        for (let moduleIndex = 0; moduleIndex < course.modulos.length; moduleIndex += 1) {
          const moduleData = course.modulos[moduleIndex];
          const savedModule = await tx.modulo.upsert({
            where: { cursoId_orden: { cursoId: saved.id, orden: moduleIndex + 1 } },
            update: {
              titulo: moduleData.titulo,
              descripcion: moduleData.descripcion ?? null,
              estado: moduleData.estado,
            },
            create: {
              cursoId: saved.id,
              orden: moduleIndex + 1,
              titulo: moduleData.titulo,
              descripcion: moduleData.descripcion,
              estado: moduleData.estado,
            },
          });

          for (let lessonIndex = 0; lessonIndex < moduleData.lecciones.length; lessonIndex += 1) {
            const lesson = moduleData.lecciones[lessonIndex];
            const savedLesson = await tx.leccion.upsert({
              where: { moduloId_orden: { moduloId: savedModule.id, orden: lessonIndex + 1 } },
              update: {
                titulo: lesson.titulo,
                contenidoTexto: lesson.contenidoTexto ?? null,
                urlVideo: lesson.urlVideo ?? null,
                duracion: lesson.duracion ?? null,
                esPreview: lesson.esPreview,
                subtitulos: lesson.subtitulos ?? null,
              },
              create: {
                moduloId: savedModule.id,
                orden: lessonIndex + 1,
                titulo: lesson.titulo,
                contenidoTexto: lesson.contenidoTexto,
                urlVideo: lesson.urlVideo,
                duracion: lesson.duracion,
                esPreview: lesson.esPreview,
                subtitulos: lesson.subtitulos,
              },
            });
            await tx.recurso.deleteMany({ where: { leccionId: savedLesson.id } });
            if (lesson.recursos.length > 0) {
              await tx.recurso.createMany({
                data: lesson.recursos.map((resource) => ({
                  leccionId: savedLesson.id,
                  titulo: resource.titulo,
                  descripcion: resource.descripcion,
                  tipo: resource.tipo,
                  urlDocumento: resource.urlDocumento,
                })),
              });
            }
          }
        }
      });
      console.log(`OK: ${course.titulo}`);
    }

    console.log(`Importación completada: ${creates} creados y ${updates} actualizados.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
