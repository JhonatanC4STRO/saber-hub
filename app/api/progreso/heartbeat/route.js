import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { cursoId } = body;

    if (!cursoId) {
      return NextResponse.json({ error: 'cursoId es requerido' }, { status: 400 });
    }

    // Actualizar de forma atómica: incrementar tiempoConectado en 15 segundos y actualizar ultimoAcceso
    const updateResult = await prisma.inscripcion.updateMany({
      where: {
        usuarioId: payload.id,
        cursoId: cursoId,
      },
      data: {
        tiempoConectado: {
          increment: 15,
        },
        ultimoAcceso: new Date(),
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: 'Inscripción no encontrada para este usuario y curso.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Heartbeat registrado con éxito.',
    });
  } catch (error) {
    console.error('[POST /api/progreso/heartbeat]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
