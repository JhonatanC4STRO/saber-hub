import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to verify admin or instructor access
async function authorize(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { error: 'No autorizado', status: 401 };

  try {
    const payload = await verifyToken(token);
    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return { error: 'Acceso denegado', status: 403 };
    }
    return { payload };
  } catch (err) {
    return { error: 'Token inválido', status: 401 };
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id: grupoId, cursoId } = await params;

    const asignacion = await prisma.asignacionGrupoCurso.findUnique({
      where: {
        grupoId_cursoId: {
          grupoId,
          cursoId,
        },
      },
    });

    if (!asignacion) {
      return NextResponse.json(
        { message: 'El curso no está asignado a este grupo' },
        { status: 404 }
      );
    }

    await prisma.asignacionGrupoCurso.delete({
      where: {
        grupoId_cursoId: {
          grupoId,
          cursoId,
        },
      },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: auth.payload.id,
        accion: 'DESASIGNAR_GRUPO_CURSO',
        tabla: 'asignaciones_grupo_curso',
        registroId: grupoId,
        datosAntes: JSON.stringify(asignacion),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ message: 'Curso desvinculado del grupo exitosamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al desvincular curso del grupo' }, { status: 500 });
  }
}
