import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** GET /api/certificados/verificar/[codigo] – público, sin autenticación */
export async function GET(request, { params }) {
  const { codigo } = await params;
  const cert = await prisma.certificacion.findUnique({
    where: { codigoUnico: codigo.toUpperCase() },
    include: {
      inscripcion: {
        include: {
          usuario: { select: { nombre: true } },
          curso: {
            select: {
              titulo: true,
              instructor: { select: { nombre: true } },
              institucion: { select: { nombre: true } },
            },
          },
        },
      },
    },
  });

  if (!cert)
    return NextResponse.json({ valido: false, message: 'Código no encontrado' }, { status: 404 });

  return NextResponse.json({
    valido: cert.estado === 'emitido',
    estado: cert.estado,
    codigoUnico: cert.codigoUnico,
    hashVerificacion: cert.hashVerificacion,
    fechaEmision: cert.fechaEmision,
    alumno: cert.inscripcion.usuario.nombre,
    curso: cert.inscripcion.curso.titulo,
    instructor: cert.inscripcion.curso.instructor.nombre,
    institucion: cert.inscripcion.curso.institucion?.nombre || null,
    motivoRevocacion: cert.estado === 'revocado' ? cert.motivoRevocacion : null,
  });
}
