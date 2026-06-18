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

export async function POST(request, { params }) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id: grupoId } = await params;
    const body = await request.json();
    const { cursoId } = body;

    if (!cursoId) {
      return NextResponse.json({ message: 'El cursoId es obligatorio' }, { status: 400 });
    }

    // Verificar si el grupo y el curso existen
    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      include: {
        miembros: {
          select: { usuarioId: true },
        },
      },
    });

    if (!grupo) {
      return NextResponse.json({ message: 'Grupo no encontrado' }, { status: 404 });
    }

    const curso = await prisma.curso.findUnique({ where: { id: cursoId } });
    if (!curso) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    // Crear asignación de curso
    const asignacionExistente = await prisma.asignacionGrupoCurso.findUnique({
      where: {
        grupoId_cursoId: {
          grupoId,
          cursoId,
        },
      },
    });

    if (asignacionExistente) {
      return NextResponse.json(
        { message: 'El curso ya está asignado a este grupo' },
        { status: 409 }
      );
    }

    const nuevaAsignacion = await prisma.asignacionGrupoCurso.create({
      data: {
        grupoId,
        cursoId,
      },
    });

    // MATRICULAR A TODOS LOS ALUMNOS DEL GRUPO EN EL CURSO
    let matriculados = 0;
    let yaMatriculados = 0;

    for (const miembro of grupo.miembros) {
      const { usuarioId } = miembro;

      const inscripcionExistente = await prisma.inscripcion.findUnique({
        where: {
          usuarioId_cursoId: {
            usuarioId,
            cursoId,
          },
        },
      });

      if (inscripcionExistente) {
        yaMatriculados++;
      } else {
        await prisma.inscripcion.create({
          data: {
            usuarioId,
            cursoId,
            estado: 'activo',
          },
        });
        matriculados++;
      }
    }

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: auth.payload.id,
        accion: 'ASIGNAR_GRUPO_CURSO',
        tabla: 'asignaciones_grupo_curso',
        registroId: nuevaAsignacion.id,
        datosDespues: JSON.stringify({
          grupoId,
          cursoId,
          matriculadosCount: matriculados,
          yaMatriculadosCount: yaMatriculados,
        }),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({
      message: 'Curso asignado al grupo exitosamente',
      asignacion: nuevaAsignacion,
      stats: {
        matriculados,
        yaMatriculados,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al asignar curso al grupo' }, { status: 500 });
  }
}
