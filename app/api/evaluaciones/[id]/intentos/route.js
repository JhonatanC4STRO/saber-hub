import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/**
 * POST /api/evaluaciones/:id/intentos
 * Estudiante inicia o reanuda un intento de evaluación.
 */
export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { id: evaluacionId } = await params;

    const evaluacion = await prisma.evaluacion.findUnique({
      where: { id: evaluacionId },
      include: { preguntas: { orderBy: { orden: 'asc' }, include: { opciones: true } } },
    });
    if (!evaluacion)
      return NextResponse.json({ message: 'Evaluación no encontrada' }, { status: 404 });

    // Verificar intentos previos
    const intentosPrevios = await prisma.intentoExamen.findMany({
      where: { usuarioId: payload.id, evaluacionId },
      orderBy: { fechaInicio: 'desc' },
    });

    // Si ya tiene uno en_curso, lo devolvemos
    const enCurso = intentosPrevios.find((i) => i.estado === 'en_curso');
    if (enCurso) {
      return NextResponse.json({ intento: enCurso, evaluacion });
    }

    // Verificar si ya consumió todos los intentos
    const finalizados = intentosPrevios.filter(
      (i) => i.estado === 'finalizado' || i.estado === 'calificado'
    );
    if (finalizados.length >= evaluacion.intentosMaximos) {
      return NextResponse.json(
        { message: `Ya agotó los ${evaluacion.intentosMaximos} intento(s) permitido(s)` },
        { status: 403 }
      );
    }

    const intento = await prisma.intentoExamen.create({
      data: {
        usuarioId: payload.id,
        evaluacionId: evaluacion.id,
        estado: 'en_curso',
      },
    });

    return NextResponse.json({ intento, evaluacion }, { status: 201 });
  } catch (error) {
    console.error('POST /api/evaluaciones/[id]/intentos', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

/**
 * GET /api/evaluaciones/:id/intentos
 * Instructor/Admin: lista todos los intentos de esta evaluación.
 * Estudiante: lista sus propios intentos.
 */
export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const { id: evaluacionId } = await params;

    const where = { evaluacionId };
    if (payload.rol === 'estudiante') {
      where.usuarioId = payload.id;
    }

    const intentos = await prisma.intentoExamen.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        respuestasAprendiz: {
          include: {
            pregunta: { select: { id: true, pregunta: true, tipo: true, puntos: true } },
            opcion: { select: { id: true, textoOpcion: true } },
          },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    });

    return NextResponse.json(intentos);
  } catch (error) {
    console.error('GET /api/evaluaciones/[id]/intentos', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
