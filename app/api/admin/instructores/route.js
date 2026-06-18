import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const instructores = await prisma.usuario.findMany({
      where: {
        rol: {
          nombre: 'instructor',
        },
      },
      select: {
        id: true,
        nombre: true,
        email: true,
      },
    });

    return NextResponse.json(instructores);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener instructores' }, { status: 500 });
  }
}
