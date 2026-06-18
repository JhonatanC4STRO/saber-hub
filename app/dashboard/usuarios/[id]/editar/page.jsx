import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CrearEditarUsuarioForm from '../../components/CrearEditarUsuarioForm';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { nombre: true },
  });
  return {
    title: usuario
      ? `Editar ${usuario.nombre} — SABERHUB Admin`
      : 'Editar Usuario — SABERHUB Admin',
    description: 'Modifica la información de un usuario en la plataforma SABERHUB.',
  };
}

export default async function EditarUsuarioPage({ params }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuarioSession = await verifyToken(token);

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { rol: true },
  });

  if (!usuario) {
    notFound();
  }

  // Separar nombre completo en partes para el formulario
  const nombreParts = (usuario.nombre || '').trim().split(' ');
  const nombres = nombreParts.slice(0, Math.ceil(nombreParts.length / 2)).join(' ');
  const apellidos = nombreParts.slice(Math.ceil(nombreParts.length / 2)).join(' ');

  // Serializar datos del usuario para el cliente
  const usuarioInicial = {
    id: usuario.id,
    nombre: usuario.nombre,
    nombres,
    apellidos,
    email: usuario.email,
    documento: usuario.documento || '',
    telefono: usuario.telefono || '',
    imagen: usuario.imagen || '',
    activo: usuario.activo,
    verificado: usuario.verificado,
    fechaRegistro: usuario.fechaRegistro?.toISOString() || null,
    ultimoLogin: usuario.ultimoLogin?.toISOString() || null,
    rol: usuario.rol ? { nombre: usuario.rol.nombre } : null,
  };

  return (
    <CrearEditarUsuarioForm
      modo="editar"
      usuarioInicial={usuarioInicial}
      usuarioSession={usuarioSession}
    />
  );
}
