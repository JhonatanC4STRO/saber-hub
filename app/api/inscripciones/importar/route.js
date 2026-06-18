import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// POST: Importar inscripciones desde CSV ya parseado por el cliente
// Espera body: { registros: [{ email, cursoId }] }
export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const { registros } = await request.json();

    if (!Array.isArray(registros) || registros.length === 0) {
      return NextResponse.json({ message: 'No se recibieron registros válidos' }, { status: 400 });
    }

    const resultados = { exitosos: 0, duplicados: 0, errores: [] };

    for (const reg of registros) {
      const { email, cursoId } = reg;
      if (!email || !cursoId) {
        resultados.errores.push({ email, cursoId, razon: 'Campos faltantes' });
        continue;
      }

      try {
        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario) {
          resultados.errores.push({ email, cursoId, razon: 'Usuario no encontrado' });
          continue;
        }

        await prisma.inscripcion.create({ data: { usuarioId: usuario.id, cursoId } });
        resultados.exitosos++;
      } catch (err) {
        if (err.code === 'P2002') {
          resultados.duplicados++;
        } else {
          resultados.errores.push({ email, cursoId, razon: err.message });
        }
      }
    }

    return NextResponse.json({
      message: `Importación completada: ${resultados.exitosos} exitosas, ${resultados.duplicados} duplicadas, ${resultados.errores.length} errores.`,
      resultados,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
