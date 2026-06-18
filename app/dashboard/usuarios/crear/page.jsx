import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import CrearEditarUsuarioForm from '../components/CrearEditarUsuarioForm';

export const metadata = {
  title: 'Crear Usuario — SABERHUB Admin',
  description: 'Registra un nuevo usuario en la plataforma SABERHUB.',
};

export default async function CrearUsuarioPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuarioSession = await verifyToken(token);

  return <CrearEditarUsuarioForm modo="crear" usuarioSession={usuarioSession} />;
}
