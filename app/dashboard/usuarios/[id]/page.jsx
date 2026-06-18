import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import DetalleUsuarioClient from './DetalleUsuarioClient';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { nombre: true },
  });
  return {
    title: usuario ? `${usuario.nombre} — SABERHUB` : 'Usuario — SABERHUB',
    description: 'Detalle de usuario en el panel de administración de SABERHUB.',
  };
}

export default async function DetalleUsuarioPage({ params }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuarioSession = await verifyToken(token);

  if (!usuarioSession || usuarioSession.rol !== 'admin') {
    redirect('/dashboard');
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      rol: true,
      cursosCreados: {
        select: {
          id: true,
          titulo: true,
          estado: true,
          creado: true,
          _count: { select: { inscripciones: true } },
        },
        orderBy: { creado: 'desc' },
        take: 12,
      },
      inscripciones: {
        select: { id: true },
      },
      logsAuditoria: {
        orderBy: { fecha: 'desc' },
        take: 10,
        select: {
          id: true,
          accion: true,
          tabla: true,
          fecha: true,
          ip: true,
          registroId: true,
          datosAntes: true,
          datosDespues: true,
        },
      },
      _count: {
        select: {
          cursosCreados: true,
          inscripciones: true,
        },
      },
    },
  });

  if (!usuario) notFound();

  // Count certificates issued by this user (if instructor)
  const certificadosEmitidos = await prisma.certificacion.count({
    where: {
      inscripcion: {
        curso: { instructorId: id },
      },
      estado: 'emitido',
    },
  });

  // Alumno count (unique students in their courses)
  const alumnosInscritos =
    usuario.rol?.nombre === 'instructor'
      ? await prisma.inscripcion.count({
          where: { curso: { instructorId: id } },
        })
      : usuario._count.inscripciones;

  const serialized = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    documento: usuario.documento || '',
    telefono: usuario.telefono || '',
    imagen: usuario.imagen || null,
    activo: usuario.activo,
    verificado: usuario.verificado,
    ultimoLogin: usuario.ultimoLogin ? usuario.ultimoLogin.toISOString() : null,
    fechaRegistro: usuario.fechaRegistro ? usuario.fechaRegistro.toISOString() : null,
    rol: usuario.rol ? { id: usuario.rol.id, nombre: usuario.rol.nombre } : null,
    cursosCreados: usuario.cursosCreados.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      estado: c.estado,
      creado: c.creado ? c.creado.toISOString() : null,
      inscritos: c._count.inscripciones,
    })),
    totalCursos: usuario._count.cursosCreados,
    totalInscripciones: usuario._count.inscripciones,
    alumnosInscritos,
    certificadosEmitidos,
    logsAuditoria: usuario.logsAuditoria.map((l) => ({
      id: l.id,
      accion: l.accion,
      tabla: l.tabla,
      ip: l.ip || '',
      fecha: l.fecha ? l.fecha.toISOString() : null,
      detalles: l.datosAntes || l.datosDespues || null,
    })),
  };

  return <DetalleUsuarioClient usuario={serialized} usuarioSession={usuarioSession} />;
}
