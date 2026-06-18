import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import SesionesClient from '@/components/sesiones/SesionesClient';

// 1. Dynamic SEO Metadata Generation
export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const course = await prisma.curso.findUnique({
      where: { id },
      select: { titulo: true },
    });

    if (!course) {
      return {
        title: 'Sesiones no encontradas | SABERHUB',
        description: 'La página de sesiones en vivo solicitada no existe.',
      };
    }

    return {
      title: `Sesiones en Vivo: ${course.titulo} | SABERHUB`,
      description: `Participa en las tutorías y clases sincrónicas en vivo programadas para el curso "${course.titulo}".`,
    };
  } catch (error) {
    console.error('Error generating sessions metadata:', error);
    return {
      title: 'Sesiones en Vivo | SABERHUB',
      description: 'Interactúa en las videoconferencias sincrónicas del curso.',
    };
  }
}

// Helper to check user participation in a course
async function checkCourseAccess(usuario, cursoId) {
  if (usuario.rol === 'admin') return true;

  // Check if instructor of the course
  const curso = await prisma.curso.findFirst({
    where: { id: cursoId, instructorId: usuario.id },
  });
  if (curso) return true;

  // Check if student enrolled in the course
  const inscripcion = await prisma.inscripcion.findFirst({
    where: { usuarioId: usuario.id, cursoId, estado: 'activo' },
  });
  if (inscripcion) return true;

  return false;
}

// 2. Server Page Component
export default async function SesionesPage({ params }) {
  const { id } = await params;

  // Fetch course details
  const course = await prisma.curso.findUnique({
    where: { id },
    include: {
      categoria: true,
      instructor: {
        select: {
          id: true,
          nombre: true,
          email: true,
          imagen: true,
        },
      },
    },
  });

  if (!course || course.estado === 'archivado') {
    notFound();
  }

  // Session verification
  let usuario = null;
  let hasAccess = false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      usuario = await verifyToken(token);
      if (usuario) {
        hasAccess = await checkCourseAccess(usuario, id);
      }
    }
  } catch (error) {
    console.error('Error verifying session in Sesiones Page Server Component:', error);
  }

  // Deny access if unauthorized
  if (!usuario || !hasAccess) {
    redirect(`/cursos/${id}?error=NoAutorizado`);
  }

  // Serializing complex data (Date objects) to standard JSON primitives
  const courseSerialized = {
    ...course,
    creado: course.creado?.toISOString() || null,
    actualizado: course.actualizado?.toISOString() || null,
  };

  const usuarioSerialized = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    imagen: usuario.imagen || null,
    rol: usuario.rol,
  };

  return (
    <SesionesClient
      course={courseSerialized}
      currentUser={usuarioSerialized}
    />
  );
}
