import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ForoClient from '@/components/foro/ForoClient';

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
        title: 'Foro no encontrado | SABERHUB',
        description: 'El foro solicitado no existe.',
      };
    }

    return {
      title: `Foro de Discusión: ${course.titulo} | SABERHUB`,
      description: `Participa en los hilos de conversación, resuelve tus dudas e interactúa con instructores del curso "${course.titulo}".`,
    };
  } catch (error) {
    console.error('Error generating forum metadata:', error);
    return {
      title: 'Foro de Discusión | SABERHUB',
      description: 'Interactúa en el foro de discusión del curso.',
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
export default async function ForoPage({ params }) {
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
    console.error('Error verifying session in Foro Page Server Component:', error);
  }

  // Deny access if unauthorized
  if (!usuario || !hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-2xl mb-4">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-800">Acceso Denegado</h2>
        <p className="text-slate-600 mt-2 max-w-sm">
          Debes haber iniciado sesión y estar inscrito en este curso para participar en el foro de discusión.
        </p>
        <Link href={`/cursos/${id}`} className="mt-6 inline-block bg-[#1E40AF] text-white px-5 py-2.5 rounded-[4px] font-semibold hover:bg-blue-800 transition-colors">
          Volver al curso
        </Link>
      </div>
    );
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
    <ForoClient
      course={courseSerialized}
      currentUser={usuarioSerialized}
    />
  );
}
