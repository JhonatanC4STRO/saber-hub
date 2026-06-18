import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import DetalleCursoClient from '@/components/estudiante/DetalleCursoClient';

// 1. Generación dinámica de Metadatos para SEO
export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const course = await prisma.curso.findUnique({
      where: { id },
      select: { titulo: true, descripcion: true },
    });

    if (!course) {
      return {
        title: 'Curso no encontrado | SABERHUB',
        description: 'El curso solicitado no existe en la plataforma SABERHUB.',
      };
    }

    return {
      title: `${course.titulo} | SABERHUB`,
      description:
        course.descripcion?.slice(0, 160) ||
        'Detalle del curso en la plataforma de aprendizaje SABERHUB.',
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Curso | SABERHUB',
      description: 'Explora este curso en SABERHUB.',
    };
  }
}

// 2. Componente de Servidor Principal
export default async function CursoDetailPage({ params }) {
  const { id } = await params;

  // Buscar el curso en la base de datos con todas sus relaciones
  const course = await prisma.curso.findUnique({
    where: { id },
    include: {
      categoria: true,
      institucion: true,
      instructor: {
        select: {
          id: true,
          nombre: true,
          email: true,
          imagen: true,
          _count: {
            select: { cursosCreados: true },
          },
        },
      },
      modulos: {
        orderBy: { orden: 'asc' },
        include: {
          lecciones: {
            orderBy: { orden: 'asc' },
            include: { recursos: true },
          },
        },
      },
      _count: {
        select: { inscripciones: true },
      },
    },
  });

  if (!course || course.estado === 'archivado') {
    notFound();
  }

  // Verificar si el usuario está autenticado y su rol
  let usuario = null;
  let yaInscrito = false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      usuario = await verifyToken(token);

      // Si es estudiante, verificar si ya está inscrito
      if (usuario && usuario.id) {
        const inscripcion = await prisma.inscripcion.findUnique({
          where: {
            usuarioId_cursoId: {
              usuarioId: usuario.id,
              cursoId: id,
            },
          },
        });

        // Si está inscrito y no se retiró
        if (inscripcion && inscripcion.estado !== 'retirado') {
          yaInscrito = true;
        }
      }
    }
  } catch (error) {
    console.error('Error verificando sesión en DetalleCurso Server Component:', error);
  }

  // Serialización segura de tipos de datos complejos (Date) a tipos primitivos JSON
  const courseSerialized = {
    ...course,
    creado: course.creado?.toISOString() || null,
    actualizado: course.actualizado?.toISOString() || null,
    modulos: course.modulos.map((m) => ({
      ...m,
      creado: m.creado?.toISOString() || null,
      lecciones: m.lecciones.map((l) => ({
        ...l,
        creado: l.creado?.toISOString() || null,
        recursos: l.recursos.map((r) => ({
          ...r,
          fechaCreacion: r.fechaCreacion?.toISOString() || null,
        })),
      })),
    })),
  };

  return (
    <DetalleCursoClient
      course={courseSerialized}
      currentUser={usuario}
      isInitiallyEnrolled={yaInscrito}
    />
  );
}
