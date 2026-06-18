import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

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

export async function GET(request) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    // Obtener todos los cursos con sus prerrequisitos asignados
    const cursos = await prisma.curso.findMany({
      select: {
        id: true,
        titulo: true,
        imgPortada: true,
        estado: true,
        prerrequisitosDe: {
          include: {
            prerrequisito: {
              select: {
                id: true,
                titulo: true,
              },
            },
          },
        },
      },
      orderBy: { creado: 'desc' },
    });

    return NextResponse.json({ cursos });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener prerrequisitos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { cursoId, prerrequisitoIds = [] } = body;

    if (!cursoId) {
      return NextResponse.json({ message: 'El ID del curso es obligatorio' }, { status: 400 });
    }

    // Verificar que el curso no se ponga a sí mismo como prerrequisito
    if (prerrequisitoIds.includes(cursoId)) {
      return NextResponse.json(
        { message: 'Un curso no puede tenerse a sí mismo como prerrequisito' },
        { status: 400 }
      );
    }

    // Guardar los prerrequisitos en una transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar prerrequisitos actuales
      await tx.prerrequisitoCurso.deleteMany({
        where: { cursoId },
      });

      // Crear nuevos prerrequisitos
      if (prerrequisitoIds && prerrequisitoIds.length > 0) {
        await tx.prerrequisitoCurso.createMany({
          data: prerrequisitoIds.map((prerrequisitoId) => ({
            cursoId,
            prerrequisitoId,
          })),
        });
      }
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: auth.payload.id,
        accion: 'ACTUALIZAR_PRERREQUISITOS_CURSO',
        tabla: 'prerrequisitos_curso',
        registroId: cursoId,
        datosDespues: JSON.stringify({ cursoId, prerrequisitoIds }),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({ message: 'Prerrequisitos actualizados exitosamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar prerrequisitos' }, { status: 500 });
  }
}
