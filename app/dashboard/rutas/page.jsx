import React from 'react';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';
import RutasClient from './components/RutasClient';

export default async function RutasPage() {
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
            Por favor, inicia sesión para acceder a las rutas de formación.
          </p>
        </div>
      </div>
    );
  }

  // 1. Obtener todos los cursos publicados (para estudiantes) y todos los cursos (para admin/instructor)
  const isEstudiante = usuarioSession.rol === 'estudiante';

  const cursos = await prisma.curso.findMany({
    where: isEstudiante ? { estado: 'publicado' } : {},
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      imgPortada: true,
      estado: true,
      instructor: {
        select: {
          nombre: true,
        },
      },
      cursosExternos: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { creado: 'desc' },
  });

  // 2. Obtener todas las rutas de formación
  const rutas = await prisma.rutaFormacion.findMany({
    include: {
      creador: {
        select: {
          nombre: true,
        },
      },
      cursos: {
        orderBy: { orden: 'asc' },
        include: {
          curso: {
            select: {
              id: true,
              titulo: true,
              descripcion: true,
              imgPortada: true,
              estado: true,
            },
          },
        },
      },
    },
    orderBy: { creado: 'desc' },
  });

  // 3. Obtener prerrequisitos globales
  const prerrequisitos = await prisma.prerrequisitoCurso.findMany({
    include: {
      prerrequisito: {
        select: {
          id: true,
          titulo: true,
        },
      },
    },
  });

  // 4. Si es estudiante, obtener sus inscripciones, certificaciones individuales y certificados de ruta
  let inscripciones = [];
  let certificaciones = [];
  let certificadosRuta = [];

  if (isEstudiante) {
    inscripciones = await prisma.inscripcion.findMany({
      where: { usuarioId: usuarioSession.id },
      select: {
        id: true,
        cursoId: true,
        progreso: true,
        estado: true,
      },
    });

    certificaciones = await prisma.certificacion.findMany({
      where: {
        inscripcion: {
          usuarioId: usuarioSession.id,
        },
      },
      select: {
        id: true,
        codigoUnico: true,
        fechaEmision: true,
        inscripcion: {
          select: {
            cursoId: true,
          },
        },
      },
    });

    certificadosRuta = await prisma.certificadoRuta.findMany({
      where: { usuarioId: usuarioSession.id },
      select: {
        id: true,
        rutaId: true,
        codigoUnico: true,
        fechaEmision: true,
      },
    });
  }

  // Serializar fechas, decimales y objetos complejos de forma segura para NextJS Server Components
  const serializedCursos = cursos.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    descripcion: c.descripcion || '',
    imgPortada: c.imgPortada || null,
    estado: c.estado,
    instructorNombre: c.instructor?.nombre || 'Instructor',
    esExterno: c.cursosExternos && c.cursosExternos.length > 0,
  }));

  const serializedRutas = rutas.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion || '',
    imgPortada: r.imgPortada || null,
    lineal: r.lineal,
    creador: r.creador ? { nombre: r.creador.nombre } : null,
    cursos: r.cursos.map((cr) => ({
      id: cr.id,
      cursoId: cr.cursoId,
      orden: cr.orden,
      titulo: cr.curso.titulo,
      descripcion: cr.curso.descripcion || '',
      imgPortada: cr.curso.imgPortada || null,
      estado: cr.curso.estado,
    })),
  }));

  const serializedPrerrequisitos = prerrequisitos.map((p) => ({
    id: p.id,
    cursoId: p.cursoId,
    prerrequisitoId: p.prerrequisitoId,
    prerrequisitoTitulo: p.prerrequisito.titulo,
  }));

  const serializedInscripciones = inscripciones.map((ins) => ({
    id: ins.id,
    cursoId: ins.cursoId,
    progreso: ins.progreso ? Number(ins.progreso) : 0,
    estado: ins.estado,
  }));

  const serializedCertificaciones = certificaciones.map((c) => ({
    id: c.id,
    codigoUnico: c.codigoUnico,
    fechaEmision: c.fechaEmision ? c.fechaEmision.toISOString() : null,
    cursoId: c.inscripcion.cursoId,
  }));

  const serializedCertificadosRuta = certificadosRuta.map((cr) => ({
    id: cr.id,
    rutaId: cr.rutaId,
    codigoUnico: cr.codigoUnico,
    fechaEmision: cr.fechaEmision ? cr.fechaEmision.toISOString() : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans">
      <HeaderAdmin usuario={usuarioSession} />
      <main className="flex-grow">
        <RutasClient
          usuarioSession={usuarioSession}
          cursos={serializedCursos}
          rutas={serializedRutas}
          prerrequisitos={serializedPrerrequisitos}
          inscripciones={serializedInscripciones}
          certificaciones={serializedCertificaciones}
          certificadosRuta={serializedCertificadosRuta}
        />
      </main>
      <FooterAdmin />
    </div>
  );
}
