import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import InstitucionPageClient from './components/InstitucionPageClient';

function formatDuration(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const inst = await prisma.institucion.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: { nombre: true, descripcion: true, logoUrl: true },
    });
    if (!inst) return { title: 'Institución no encontrada | SABERHUB' };
    return {
      title: `${inst.nombre} | SABERHUB`,
      description:
        inst.descripcion?.slice(0, 160) ||
        `Explora los cursos gratuitos de ${inst.nombre} en SABERHUB.`,
      openGraph: {
        title: `${inst.nombre} | SABERHUB`,
        images: inst.logoUrl ? [{ url: inst.logoUrl }] : [],
      },
    };
  } catch {
    return { title: 'Institución | SABERHUB' };
  }
}

export default async function PublicInstitucionPage({ params }) {
  const { slug } = await params;

  const institucion = await prisma.institucion.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: {
      cursos: {
        where: {
          estado: 'publicado',
          cursosExternos: { none: {} },
        },
        include: {
          categoria: { select: { id: true, nombre: true } },
          instructor: { select: { id: true, nombre: true, imagen: true } },
          modulos: {
            where: { estado: 'activo' },
            include: { lecciones: { select: { duracion: true } } },
          },
          _count: { select: { inscripciones: true } },
        },
      },
      cursosExternos: {
        where: { estaActivo: true, estado: 'aprobado' },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          fuenteUrl: true,
          fuenteNombre: true,
          duracionHoras: true,
          nivel: true,
          imagenUrl: true,
          areaConocimiento: true,
        },
      },
    },
  });

  if (!institucion) notFound();

  let usuario = null;
  let loggedIn = false;
  let inscritasIds = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      usuario = await verifyToken(token);
      if (usuario?.id) {
        loggedIn = true;
        const inscripciones = await prisma.inscripcion.findMany({
          where: { usuarioId: usuario.id, estado: 'activo' },
          select: { cursoId: true },
        });
        inscritasIds = inscripciones.map((i) => i.cursoId);
      }
    }
  } catch {}

  const cursosProcesados = institucion.cursos.map((curso) => {
    const totalMin = curso.modulos.reduce(
      (s, m) => s + m.lecciones.reduce((sl, l) => sl + (l.duracion || 0), 0),
      0
    );
    return {
      id: curso.id,
      titulo: curso.titulo,
      descripcion: curso.descripcion,
      imgPortada: curso.imgPortada,
      nivel: curso.nivel,
      isExterno: false,
      categoriaNombre: curso.categoria?.nombre || 'General',
      inscripciones: curso._count?.inscripciones || 0,
      duracionCalculada: formatDuration(totalMin),
      yaInscrito: inscritasIds.includes(curso.id),
      instructorId: curso.instructor?.id,
      instructorNombre: curso.instructor?.nombre,
      instructorImagen: curso.instructor?.imagen,
      modulosCount: curso.modulos.length,
    };
  });

  const cursosExternosProcesados = (institucion.cursosExternos || []).map((curso) => ({
    id: curso.id,
    titulo: curso.titulo,
    descripcion: curso.descripcion,
    imgPortada: curso.imagenUrl,
    nivel: curso.nivel,
    isExterno: true,
    fuenteUrl: curso.fuenteUrl,
    fuenteNombre: curso.fuenteNombre,
    categoriaNombre: curso.areaConocimiento || 'General',
    inscripciones: 0,
    duracionCalculada: curso.duracionHoras ? `${curso.duracionHoras}h` : null,
    yaInscrito: false,
    instructorId: null,
    instructorNombre: null,
    instructorImagen: null,
    modulosCount: 0,
  }));

  const todosLosCursos = [...cursosProcesados, ...cursosExternosProcesados];
  const totalInscritos = cursosProcesados.reduce((s, c) => s + c.inscripciones, 0);

  const instructores = [
    ...new Map(
      cursosProcesados
        .map((c) => ({ id: c.instructorId, nombre: c.instructorNombre, imagen: c.instructorImagen }))
        .filter((i) => i.id)
        .map((i) => [i.id, i])
    ).values(),
  ].slice(0, 3);

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      <HeaderAdmin usuario={usuario} />
      <InstitucionPageClient
        institucion={{
          id: institucion.id,
          nombre: institucion.nombre,
          descripcion: institucion.descripcion,
          logoUrl: institucion.logoUrl,
          url: institucion.url,
          telefono: institucion.telefono,
          correoAdmin: institucion.correoAdmin,
          nit: institucion.nit,
          fechaCreacion: institucion.fechaCreacion?.toISOString() ?? null,
          slug: institucion.slug,
        }}
        cursos={todosLosCursos}
        totalInscritos={totalInscritos}
        instructores={instructores}
        loggedIn={loggedIn}
        usuario={usuario}
      />
    </div>
  );
}
