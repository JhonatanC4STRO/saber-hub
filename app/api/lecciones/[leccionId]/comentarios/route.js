import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/lecciones/[leccionId]/comentarios
 *
 * Lists all comments for a lesson, including user profiles.
 */
export async function GET(request, { params }) {
  try {
    const { leccionId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verify course access: get lesson's course
    const leccion = await prisma.leccion.findUnique({
      where: { id: leccionId },
      include: {
        modulo: {
          select: { cursoId: true }
        }
      }
    });

    if (!leccion) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 });
    }

    const cursoId = leccion.modulo.cursoId;

    // Verify access (enrolled student, instructor of the course, or admin)
    const esInscrito = await prisma.inscripcion.findFirst({
      where: { usuarioId: payload.id, cursoId, estado: 'activo' }
    });
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { instructorId: true }
    });
    const esInstructor = payload.rol === 'instructor' && curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esInscrito && !esInstructor && !esAdmin) {
      return NextResponse.json({ error: 'No tienes acceso a esta lección' }, { status: 403 });
    }

    const comentarios = await prisma.comentarioLeccion.findMany({
      where: { leccionId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            imagen: true,
            rol: { select: { nombre: true } }
          }
        }
      },
      orderBy: { creado: 'asc' }
    });

    return NextResponse.json(comentarios, { status: 200 });
  } catch (error) {
    console.error('[GET /api/lecciones/[leccionId]/comentarios]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/lecciones/[leccionId]/comentarios
 *
 * Adds a new comment or reply to a lesson.
 */
export async function POST(request, { params }) {
  try {
    const { leccionId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const leccion = await prisma.leccion.findUnique({
      where: { id: leccionId },
      include: {
        modulo: {
          select: { cursoId: true }
        }
      }
    });

    if (!leccion) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 });
    }

    const cursoId = leccion.modulo.cursoId;

    // Verify access
    const esInscrito = await prisma.inscripcion.findFirst({
      where: { usuarioId: payload.id, cursoId, estado: 'activo' }
    });
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { instructorId: true }
    });
    const esInstructor = payload.rol === 'instructor' && curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esInscrito && !esInstructor && !esAdmin) {
      return NextResponse.json({ error: 'No tienes acceso a este curso' }, { status: 403 });
    }

    const body = await request.json();
    const { contenido, padreId } = body;

    if (!contenido || contenido.trim() === '') {
      return NextResponse.json({ error: 'El contenido del comentario es requerido' }, { status: 400 });
    }

    // Verify father comment if reply
    if (padreId) {
      const padre = await prisma.comentarioLeccion.findUnique({
        where: { id: padreId }
      });
      if (!padre) {
        return NextResponse.json({ error: 'Comentario principal no encontrado' }, { status: 404 });
      }
    }

    const nuevoComentario = await prisma.comentarioLeccion.create({
      data: {
        leccionId,
        usuarioId: payload.id,
        padreId: padreId || null,
        contenido: contenido.trim(),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            imagen: true,
            rol: { select: { nombre: true } }
          }
        }
      }
    });

    return NextResponse.json(nuevoComentario, { status: 201 });
  } catch (error) {
    console.error('[POST /api/lecciones/[leccionId]/comentarios]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
