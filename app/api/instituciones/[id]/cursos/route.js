import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request, { params }) {
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

    const { id: institucionId } = await params;

    // Verificar que el usuario es admin de esta institución
    const institucion = await prisma.institucion.findUnique({
      where: { id: institucionId },
      include: { admin: true },
    });

    if (!institucion) {
      return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 });
    }

    if (!institucion.admin || institucion.admin.id !== payload.id) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    // Listar cursos de la institución
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo') || 'locales';

    if (tipo === 'externos') {
      const where = { institucionId };
      if (estado && estado !== 'todos') {
        where.estado = estado;
      }

      const cursos = await prisma.cursoExterno.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
      });

      const conteos = await prisma.cursoExterno.groupBy({
        by: ['estado'],
        where: { institucionId },
        _count: { id: true },
      });

      return NextResponse.json({
        cursos: cursos.map(c => ({
          ...c,
          // Mapear campos para que coincidan con la estructura de la tabla en el frontend
          instructor: { nombre: 'Sistema' },
          _count: { inscripciones: 0, modulos: 0 }
        })),
        conteos: Object.fromEntries(conteos.map((c) => [c.estado, c._count.id])),
      });
    }

    const where = { institucionId };
    if (estado && estado !== 'todos') {
      where.estado = estado;
    }

    const cursos = await prisma.curso.findMany({
      where,
      include: {
        instructor: { select: { id: true, nombre: true, email: true } },
        categoria: { select: { nombre: true } },
        _count: { select: { inscripciones: true, modulos: true } },
      },
      orderBy: { creado: 'desc' },
    });

    const conteos = await prisma.curso.groupBy({
      by: ['estado'],
      where: { institucionId },
      _count: { id: true },
    });

    return NextResponse.json({
      cursos,
      conteos: Object.fromEntries(conteos.map((c) => [c.estado, c._count.id])),
    });
  } catch (error) {
    console.error('[GET /api/instituciones/[id]/cursos]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
