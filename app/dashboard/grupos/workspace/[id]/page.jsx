import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import WorkspaceClient from './components/WorkspaceClient';

export default async function GrupoWorkspacePage({ params }) {
  const resolvedParams = await params;
  const { id: grupoId } = resolvedParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    redirect('/login');
  }

  const usuario = await verifyToken(token);
  if (!usuario) {
    redirect('/login');
  }

  // 1. Obtener detalles del grupo
  const grupo = await prisma.grupo.findUnique({
    where: { id: grupoId },
    include: {
      creador: { select: { id: true, nombre: true } },
      miembros: {
        include: {
          usuario: { select: { id: true, nombre: true, email: true, imagen: true } },
        },
      },
      cursos: {
        include: {
          curso: {
            include: {
              sesiones: {
                orderBy: { fechaInicio: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!grupo) {
    notFound();
  }

  if (usuario.rol === 'admin') {
    // Los administradores solo gestionan los grupos, no entran a su espacio colaborativo
    redirect('/dashboard/grupos');
  }

  // 2. Verificar acceso del usuario actual al grupo (miembro o creador)
  const esCreador = grupo.creadorId === usuario.id;
  const esMiembro = grupo.miembros.some((m) => m.usuarioId === usuario.id);

  if (!esCreador && !esMiembro) {
    // Redirigir si no tiene permiso para entrar al espacio del grupo
    redirect('/dashboard/grupos/workspace?error=AccesoDenegado');
  }

  // Extraer las sesiones de videoconferencia reales asociadas a los cursos del grupo
  const sesiones = [];
  if (grupo.cursos) {
    grupo.cursos.forEach((ac) => {
      if (ac.curso && ac.curso.sesiones) {
        ac.curso.sesiones.forEach((s) => {
          if (s.estado === 'programada' || s.estado === 'en_curso') {
            sesiones.push({
              id: s.id,
              titulo: s.titulo,
              descripcion: s.descripcion,
              fechaInicio: s.fechaInicio.toISOString(),
              urlReunion: s.urlReunion,
              duracion: s.duracion,
              cursoTitulo: ac.curso.titulo,
            });
          }
        });
      }
    });
  }

  // Ordenar sesiones cronológicamente
  sesiones.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());

  // Sanitizar objeto para pasarlo al cliente de forma segura
  const grupoSanitizado = {
    id: grupo.id,
    nombre: grupo.nombre,
    descripcion: grupo.descripcion,
    fechaInicio: grupo.fechaInicio.toISOString(),
    fechaFin: grupo.fechaFin ? grupo.fechaFin.toISOString() : null,
    activo: grupo.activo,
    creadorId: grupo.creadorId,
    creadorNombre: grupo.creador.nombre,
    miembros: grupo.miembros.map((m) => ({
      id: m.usuario.id,
      nombre: m.usuario.nombre,
      email: m.usuario.email,
      imagen: m.usuario.imagen,
    })),
  };

  return <WorkspaceClient grupo={grupoSanitizado} usuarioSession={usuario} sesiones={sesiones} />;
}
