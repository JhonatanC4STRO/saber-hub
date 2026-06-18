import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to get authenticated user token payload
async function getPayload(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  try {
    return await verifyToken(token);
  } catch (err) {
    return null;
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = await getPayload(request);
    if (!payload) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id: grupoId, alumnoId } = await params;

    // Autorizado si es admin, instructor o el propio alumno que se auto-retira
    const isSelf = payload.id === alumnoId;
    const isStaff = payload.rol === 'admin' || payload.rol === 'instructor';

    if (!isSelf && !isStaff) {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    const miembro = await prisma.miembroGrupo.findUnique({
      where: {
        grupoId_usuarioId: {
          grupoId,
          usuarioId: alumnoId,
        },
      },
    });

    if (!miembro) {
      return NextResponse.json({ message: 'El alumno no pertenece a este grupo' }, { status: 404 });
    }

    await prisma.miembroGrupo.delete({
      where: {
        grupoId_usuarioId: {
          grupoId,
          usuarioId: alumnoId,
        },
      },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: payload.id,
        accion: isSelf ? 'ABANDONAR_GRUPO_AUTO' : 'DESVINCULAR_ALUMNO_GRUPO',
        tabla: 'miembros_grupo',
        registroId: grupoId,
        datosAntes: JSON.stringify(miembro),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({
      message: isSelf ? 'Has abandonado el grupo exitosamente' : 'Alumno removido del grupo exitosamente'
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al remover alumno del grupo' }, { status: 500 });
  }
}
