import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario?.id) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const body = await req.json();
    const { cursoExternoId, pantallaOrigen } = body;

    if (!cursoExternoId) {
      return NextResponse.json({ message: 'cursoExternoId es requerido' }, { status: 400 });
    }

    const pantallasValidas = ['detalle_curso', 'dashboard', 'explorar'];
    const pantalla = pantallasValidas.includes(pantallaOrigen)
      ? pantallaOrigen
      : 'explorar';

    // Verificar que el curso externo existe
    const cursoExterno = await prisma.cursoExterno.findUnique({
      where: { id: cursoExternoId },
      select: { id: true, fuenteUrl: true },
    });

    if (!cursoExterno) {
      return NextResponse.json({ message: 'Curso externo no encontrado' }, { status: 404 });
    }

    // Registrar el click
    await prisma.logClickExterno.create({
      data: {
        usuarioId: String(usuario.id),
        cursoExternoId,
        pantallaOrigen: pantalla,
      },
    });

    return NextResponse.json({
      success: true,
      fuenteUrl: cursoExterno.fuenteUrl,
    });
  } catch (err) {
    console.error('Error registrando click externo:', err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
