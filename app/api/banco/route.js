import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

const requireInstructorOrAdmin = async (request) => {
  const token = request.cookies.get('token')?.value;
  if (!token) return { error: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) };
  try {
    const payload = await verifyToken(token);
    if (payload.rol !== 'instructor' && payload.rol !== 'admin') {
      return { error: NextResponse.json({ message: 'Acceso denegado' }, { status: 403 }) };
    }
    return { payload };
  } catch {
    return { error: NextResponse.json({ message: 'Token inválido' }, { status: 401 }) };
  }
};

/** GET /api/banco  – lista preguntas del banco del usuario (con filtros) */
export async function GET(request) {
  try {
    const { error, payload } = await requireInstructorOrAdmin(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const categoriaId = searchParams.get('categoriaId');
    const tipo = searchParams.get('tipo');
    const q = searchParams.get('q');
    const formato = searchParams.get('formato'); // json | xlsx (para export)

    const where = {
      creadorId: payload.id,
      ...(categoriaId && { categoriaId }),
      ...(tipo && { tipo }),
      ...(q && { pregunta: { contains: q, mode: 'insensitive' } }),
    };

    const preguntas = await prisma.preguntaBanco.findMany({
      where,
      include: {
        categoria: { select: { id: true, nombre: true } },
        opciones: true,
      },
      orderBy: { creadoEn: 'desc' },
    });

    // Export
    if (formato === 'json') {
      return new NextResponse(JSON.stringify(preguntas, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="banco-preguntas.json"',
        },
      });
    }
    if (formato === 'xlsx') {
      try {
        const XLSX = await import('xlsx');
        const rows = preguntas.map((p) => ({
          id: p.id,
          pregunta: p.pregunta,
          tipo: p.tipo,
          puntos: p.puntos,
          categoria: p.categoria?.nombre || '',
          respuestaCorrecta: p.respuestaCorrecta || '',
          patronRegex: p.patronRegex || '',
          opciones: p.opciones
            .map((o) => `${o.textoOpcion}${o.esCorrecta ? ' [CORRECTA]' : ''}`)
            .join(' | '),
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Banco');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return new NextResponse(buf, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="banco-preguntas.xlsx"',
          },
        });
      } catch (e) {
        console.error('XLSX export error', e);
        return NextResponse.json({ message: 'Error al generar XLSX' }, { status: 500 });
      }
    }

    return NextResponse.json(preguntas);
  } catch (error) {
    console.error('[GET /api/banco]', error);
    return NextResponse.json({ message: 'Error interno', detail: error?.message }, { status: 500 });
  }
}

/** POST /api/banco  – crear pregunta en el banco */
export async function POST(request) {
  try {
    const { error, payload } = await requireInstructorOrAdmin(request);
    if (error) return error;

    const body = await request.json();
    const { pregunta, tipo, puntos, categoriaId, respuestaCorrecta, patronRegex, opciones } = body;

    if (!pregunta || !tipo) {
      return NextResponse.json({ message: 'pregunta y tipo son obligatorios' }, { status: 400 });
    }

    const nueva = await prisma.preguntaBanco.create({
      data: {
        creadorId: payload.id,
        pregunta,
        tipo,
        puntos: Number(puntos) || 1,
        categoriaId: categoriaId || null,
        respuestaCorrecta: respuestaCorrecta || null,
        patronRegex: patronRegex || null,
        opciones: opciones?.length
          ? {
              create: opciones.map((o) => ({
                textoOpcion: o.textoOpcion,
                esCorrecta: o.esCorrecta ?? false,
              })),
            }
          : undefined,
      },
      include: { opciones: true, categoria: { select: { id: true, nombre: true } } },
    });

    return NextResponse.json(nueva, { status: 201 });
  } catch (error) {
    console.error('[POST /api/banco]', error);
    return NextResponse.json({ message: 'Error interno', detail: error?.message }, { status: 500 });
  }
}
