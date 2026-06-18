import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';
import CertificadosClient from './components/CertificadosClient';

export default async function CertificadosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  let usuarioSession = null;
  try {
    usuarioSession = await verifyToken(token);
  } catch (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-100 max-w-md">
          <h2 className="font-bold text-[22px] text-red-600">No autorizado</h2>
          <p className="text-gray-600 mt-2 text-[14px]">
            Por favor, inicia sesión para acceder a tus certificados.
          </p>
        </div>
      </div>
    );
  }

  const isEstudiante = usuarioSession.rol === 'estudiante';

  // 1. Obtener todas las certificaciones de curso individual
  const certificaciones = await prisma.certificacion.findMany({
    where: isEstudiante ? { inscripcion: { usuarioId: usuarioSession.id } } : {},
    include: {
      inscripcion: {
        include: {
          usuario: { select: { nombre: true, email: true } },
          curso: {
            select: {
              id: true,
              titulo: true,
              imgPortada: true,
              instructor: { select: { nombre: true } },
              institucion: { select: { nombre: true } },
            },
          },
        },
      },
    },
    orderBy: { fechaEmision: 'desc' },
  });

  // 2. Obtener certificados de rutas de aprendizaje
  const certificadosRuta = await prisma.certificadoRuta.findMany({
    where: isEstudiante ? { usuarioId: usuarioSession.id } : {},
    include: {
      usuario: { select: { nombre: true, email: true } },
      ruta: {
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          imgPortada: true,
          creador: { select: { nombre: true } },
        },
      },
    },
    orderBy: { fechaEmision: 'desc' },
  });

  // Serializar fechas de forma segura para evitar problemas de hidratación en Next.js Server Components
  const serializedCertificaciones = certificaciones.map((c) => ({
    id: c.id,
    codigoUnico: c.codigoUnico,
    hashVerificacion: c.hashVerificacion,
    urlPdf: c.urlPdf,
    estado: c.estado,
    fechaEmision: c.fechaEmision ? c.fechaEmision.toISOString() : null,
    alumnoNombre: c.inscripcion.usuario.nombre,
    alumnoEmail: c.inscripcion.usuario.email,
    cursoId: c.inscripcion.curso.id,
    cursoTitulo: c.inscripcion.curso.titulo,
    cursoImgPortada: c.inscripcion.curso.imgPortada || null,
    cursoInstructor: c.inscripcion.curso.instructor?.nombre || 'Instructor',
    cursoInstitucion: c.inscripcion.curso.institucion?.nombre || 'SABERHUB',
  }));

  const serializedCertificadosRuta = certificadosRuta.map((cr) => ({
    id: cr.id,
    codigoUnico: cr.codigoUnico,
    hashVerificacion: cr.hashVerificacion,
    urlPdf: cr.urlPdf,
    fechaEmision: cr.fechaEmision ? cr.fechaEmision.toISOString() : null,
    alumnoNombre: cr.usuario.nombre,
    alumnoEmail: cr.usuario.email,
    rutaId: cr.ruta.id,
    rutaNombre: cr.ruta.nombre,
    rutaDescripcion: cr.ruta.descripcion || '',
    rutaImgPortada: cr.ruta.imgPortada || null,
    rutaCreador: cr.ruta.creador?.nombre || 'Instructor',
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      <HeaderAdmin usuario={usuarioSession} />
      <main className="flex-grow">
        <CertificadosClient
          usuarioSession={usuarioSession}
          certificaciones={serializedCertificaciones}
          certificadosRuta={serializedCertificadosRuta}
        />
      </main>
      <FooterAdmin />
    </div>
  );
}
