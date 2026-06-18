import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ReportesClient from './components/ReportesClient';

export default async function ReportesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let usuarioSession;
  try {
    usuarioSession = await verifyToken(token);
  } catch {
    redirect('/login');
  }

  // Restringir acceso solo a instructores y administradores
  if (usuarioSession.rol !== 'admin' && usuarioSession.rol !== 'instructor') {
    redirect('/dashboard');
  }

  // Obtener cursos vinculados (si es instructor, solo los suyos. Si es admin, todos)
  const whereCurso = usuarioSession.rol === 'instructor' ? { instructorId: usuarioSession.id } : {};
  const cursos = await prisma.curso.findMany({
    where: whereCurso,
    select: { id: true, titulo: true },
  });

  // Obtener todos los grupos activos
  const grupos = await prisma.grupo.findMany({
    select: { id: true, nombre: true },
  });

  return <ReportesClient cursos={cursos} grupos={grupos} usuarioSession={usuarioSession} />;
}
