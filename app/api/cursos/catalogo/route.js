import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    // Token verification removed to allow public access to the catalog
    // Traemos solo los cursos publicados
    const cursosPublicados = await prisma.curso.findMany({
      where: {
        estado: 'publicado',
        cursosExternos: { none: {} },
      },
      include: {
        categoria: { select: { nombre: true } },
        instructor: { select: { nombre: true } },
        institucion: { select: { nombre: true, logoUrl: true } },
        _count: {
          select: { modulos: true, inscripciones: true },
        },
      },
      orderBy: { actualizado: 'desc' },
    });

    return NextResponse.json(cursosPublicados, { status: 200 });
  } catch (error) {
    console.error('Error al obtener catálogo de cursos:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
