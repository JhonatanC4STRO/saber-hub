import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// PUT: Cambiar estado de inscripción (ej: dar de baja → 'retirado')
export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    const { estado } = await request.json();

    const estadosPermitidos = ['activo', 'inactivo', 'retirado', 'finalizado'];
    if (!estadosPermitidos.includes(estado)) {
      return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
    }

    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id },
      include: { curso: { select: { instructorId: true } } },
    });

    if (!inscripcion)
      return NextResponse.json({ message: 'Inscripción no encontrada' }, { status: 404 });

    // Un estudiante solo puede retirarse a sí mismo
    if (payload.rol === 'estudiante') {
      if (inscripcion.usuarioId !== payload.id) {
        return NextResponse.json(
          { message: 'No puedes modificar la inscripción de otro usuario' },
          { status: 403 }
        );
      }
      if (estado !== 'retirado') {
        return NextResponse.json({ message: 'Solo puedes retirarte del curso' }, { status: 403 });
      }
    }

    // Instructor solo puede dar de baja alumnos de sus cursos
    if (payload.rol === 'instructor' && inscripcion.curso.instructorId !== payload.id) {
      return NextResponse.json(
        { message: 'No tienes permisos sobre esta inscripción' },
        { status: 403 }
      );
    }

    const actualizada = await prisma.inscripcion.update({
      where: { id },
      data: { estado },
    });

    return NextResponse.json({
      message: `Inscripción actualizada a estado "${estado}"`,
      inscripcion: actualizada,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
