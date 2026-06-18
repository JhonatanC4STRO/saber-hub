import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import DetalleGrupoClient from './components/DetalleGrupoClient';

export default async function DetalleGrupoPage({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuarioSession = await verifyToken(token);
  const { id } = await params;

  // Validar rol
  if (usuarioSession.rol !== 'admin' && usuarioSession.rol !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-100 max-w-md">
          <h2 className="font-bold text-[22px] text-red-600">Acceso Denegado</h2>
          <p className="text-gray-600 mt-2 text-[14px]">
            No tienes permisos suficientes para acceder a la administración de grupos.
          </p>
        </div>
      </div>
    );
  }

  const grupo = await prisma.grupo.findUnique({
    where: { id },
    include: {
      creador: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
      miembros: {
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              documento: true,
              activo: true,
            },
          },
        },
        orderBy: {
          creado: 'desc',
        },
      },
      cursos: {
        include: {
          curso: {
            select: {
              id: true,
              titulo: true,
              estado: true,
              instructor: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: {
          creado: 'desc',
        },
      },
    },
  });

  if (!grupo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-100 max-w-md">
          <h2 className="font-bold text-[22px] text-red-600">No Encontrado</h2>
          <p className="text-gray-600 mt-2 text-[14px]">
            La cohorte o grupo solicitado no existe en la base de datos.
          </p>
        </div>
      </div>
    );
  }

  // Buscar todos los alumnos activos del sistema para el buscador de asignación
  const estudiantes = await prisma.usuario.findMany({
    where: {
      rol: {
        nombre: { in: ['estudiante', 'alumno'] },
      },
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      documento: true,
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  // Buscar todos los cursos disponibles del sistema
  const cursos = await prisma.curso.findMany({
    select: {
      id: true,
      titulo: true,
      estado: true,
    },
    orderBy: {
      titulo: 'asc',
    },
  });

  // Serializar objetos complejos de fecha a strings JSON seguros
  const serializedGrupo = {
    id: grupo.id,
    nombre: grupo.nombre,
    descripcion: grupo.descripcion || '',
    fechaInicio: grupo.fechaInicio ? grupo.fechaInicio.toISOString() : null,
    fechaFin: grupo.fechaFin ? grupo.fechaFin.toISOString() : null,
    activo: grupo.activo,
    creado: grupo.creado ? grupo.creado.toISOString() : null,
    creador: grupo.creador
      ? { id: grupo.creador.id, nombre: grupo.creador.nombre, email: grupo.creador.email }
      : null,
    miembros: grupo.miembros.map((m) => ({
      id: m.id,
      creado: m.creado.toISOString(),
      usuario: m.usuario
        ? {
            id: m.usuario.id,
            nombre: m.usuario.nombre,
            email: m.usuario.email,
            documento: m.usuario.documento || '',
            activo: m.usuario.activo,
          }
        : null,
    })),
    cursos: grupo.cursos.map((c) => ({
      id: c.id,
      creado: c.creado.toISOString(),
      curso: c.curso
        ? {
            id: c.curso.id,
            titulo: c.curso.titulo,
            estado: c.curso.estado,
            instructor: c.curso.instructor ? { nombre: c.curso.instructor.nombre } : null,
          }
        : null,
    })),
  };

  return (
    <DetalleGrupoClient
      grupo={serializedGrupo}
      estudiantes={estudiantes}
      cursos={cursos}
      usuarioSession={usuarioSession}
    />
  );
}
