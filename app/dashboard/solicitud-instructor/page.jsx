import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import SolicitudInstructorClient from './components/SolicitudInstructorClient';

export default async function SolicitudInstructorPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  let usuarioSession = null;
  try {
    usuarioSession = await verifyToken(token);
  } catch (err) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        style={{ padding: '20px' }}
      >
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-100 max-w-md w-full">
          <h2 className="font-bold text-[22px] text-red-600">No autorizado</h2>
          <p className="text-gray-600 mt-2 text-[14px]">
            Por favor, inicia sesión para acceder a este formulario.
          </p>
        </div>
      </div>
    );
  }

  if (!usuarioSession) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        style={{ padding: '20px' }}
      >
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-100 max-w-md w-full">
          <h2 className="font-bold text-[22px] text-red-600">No autorizado</h2>
          <p className="text-gray-600 mt-2 text-[14px]">
            Por favor, inicia sesión para acceder a este formulario.
          </p>
        </div>
      </div>
    );
  }

  // Obtener usuario detallado
  const usuarioDb = await prisma.usuario.findUnique({
    where: { id: usuarioSession.id },
    include: { rol: true },
  });

  const userRole = usuarioDb?.rol?.nombre || 'estudiante';

  // Buscar si tiene alguna solicitud activa
  const activeRequest = await prisma.solicitudInstructor.findFirst({
    where: {
      usuarioId: usuarioSession.id,
      estado: { in: ['pendiente', 'en_revision'] },
    },
  });

  // Buscar si tiene alguna solicitud rechazada
  const lastRejected = await prisma.solicitudInstructor.findFirst({
    where: {
      usuarioId: usuarioSession.id,
      estado: 'rechazada',
    },
    orderBy: {
      fechaRevision: 'desc',
    },
  });

  // Serializar
  const serializedActiveRequest = activeRequest
    ? {
        id: activeRequest.id,
        estado: activeRequest.estado,
        fechaSolicitud: activeRequest.fechaSolicitud
          ? activeRequest.fechaSolicitud.toISOString()
          : null,
        areasExperiencia: activeRequest.areasExperiencia,
        aniosExperiencia: activeRequest.aniosExperiencia,
        motivacion: activeRequest.motivacion,
        enlacePortafolio: activeRequest.enlacePortafolio,
        documentos: activeRequest.documentos,
      }
    : null;

  const serializedLastRejected = lastRejected
    ? {
        id: lastRejected.id,
        estado: lastRejected.estado,
        fechaRevision: lastRejected.fechaRevision ? lastRejected.fechaRevision.toISOString() : null,
        motivoRechazo: lastRejected.motivoRechazo,
      }
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <HeaderAdmin usuario={usuarioSession} />
      <div style={{ padding: '24px 32px', minHeight: 'calc(100vh - 80px)', background: '#F9FAFB' }}>
        <SolicitudInstructorClient
          usuarioSession={usuarioSession}
          userRole={userRole}
          activeRequest={serializedActiveRequest}
          lastRejected={serializedLastRejected}
        />
      </div>
    </div>
  );
}
