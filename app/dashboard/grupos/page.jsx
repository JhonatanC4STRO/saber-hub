import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import GruposClient from './components/GruposClient';

export default async function GestionGruposPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuarioSession = await verifyToken(token);

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

  const total = await prisma.grupo.count();
  const activos = await prisma.grupo.count({ where: { activo: true } });
  const inactivos = await prisma.grupo.count({ where: { activo: false } });

  // Contar alumnos únicos vinculados a grupos
  const alumnosUnicosResult = await prisma.miembroGrupo.groupBy({
    by: ['usuarioId'],
  });
  const alumnosUnicos = alumnosUnicosResult.length;

  const stats = {
    total,
    activos,
    inactivos,
    alumnos: alumnosUnicos,
  };

  // Consultar instructores y admins para asignación
  const instructores = await prisma.usuario.findMany({
    where: {
      rol: {
        nombre: { in: ['instructor', 'admin'] },
      },
    },
    select: {
      id: true,
      nombre: true,
      email: true,
    },
    orderBy: {
      nombre: 'asc',
    },
  });

  const grupos = await prisma.grupo.findMany({
    include: {
      creador: {
        select: {
          id: true,
          nombre: true,
        },
      },
      _count: {
        select: {
          miembros: true,
          cursos: true,
        },
      },
    },
    orderBy: {
      creado: 'desc',
    },
  });

  // Serializar objetos complejos de fecha a strings JSON seguros
  const serializedGrupos = grupos.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    descripcion: g.descripcion || '',
    fechaInicio: g.fechaInicio ? g.fechaInicio.toISOString() : null,
    fechaFin: g.fechaFin ? g.fechaFin.toISOString() : null,
    activo: g.activo,
    creado: g.creado ? g.creado.toISOString() : null,
    creadorId: g.creadorId,
    creador: g.creador ? { id: g.creador.id, nombre: g.creador.nombre } : null,
    miembrosCount: g._count.miembros,
    cursosCount: g._count.cursos,
  }));

  return (
    <GruposClient
      grupos={serializedGrupos}
      stats={stats}
      usuarioSession={usuarioSession}
      instructores={instructores}
    />
  );
}
