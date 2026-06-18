import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const instituciones = await prisma.institucion.findMany({
      where: {
        NOT: {
          nombre: {
            equals: 'PPC',
            mode: 'insensitive',
          },
        },
      },
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        logoUrl: true,
        url: true,
        telefono: true,
        correoAdmin: true,
        _count: {
          select: {
            cursos: {
              where: {
                estado: 'publicado',
                cursosExternos: { none: {} },
              },
            },
            cursosExternos: {
              where: { estaActivo: true, estado: 'aprobado' },
            },
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json(instituciones, { status: 200 });
  } catch (error) {
    console.error('Error al obtener instituciones:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
