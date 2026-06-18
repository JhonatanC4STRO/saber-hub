import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import UsuariosClient from './components/UsuariosClient';

export default async function GestionUsuariosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuarioSession = await verifyToken(token);
  const total = await prisma.usuario.count();
  const activos = await prisma.usuario.count({ where: { activo: true } });
  const inactivos = await prisma.usuario.count({ where: { activo: false } });
  const verificados = await prisma.usuario.count({ where: { verificado: true } });

  const stats = {
    total,
    activos,
    inactivos,
    verificados,
  };

  const usuarios = await prisma.usuario.findMany({
    include: {
      rol: true,
    },
    orderBy: {
      fechaRegistro: 'desc',
    },
  });

  // Convertir objetos complejos de fecha a strings JSON seguros para pasar al cliente
  const serializedUsuarios = usuarios.map((u) => ({
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    documento: u.documento || '',
    activo: u.activo,
    verificado: u.verificado,
    ultimoLogin: u.ultimoLogin ? u.ultimoLogin.toISOString() : null,
    fechaRegistro: u.fechaRegistro ? u.fechaRegistro.toISOString() : null,
    rol: u.rol ? { nombre: u.rol.nombre } : null,
  }));

  return (
    <UsuariosClient usuarios={serializedUsuarios} stats={stats} usuarioSession={usuarioSession} />
  );
}
