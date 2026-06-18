import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function authAndOwn(request, id) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { error: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) };
  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    return { error: NextResponse.json({ message: 'Token inválido' }, { status: 401 }) };
  }
  const p = await prisma.preguntaBanco.findUnique({
    where: { id },
    include: { opciones: true, categoria: { select: { id: true, nombre: true } } },
  });
  if (!p) return { error: NextResponse.json({ message: 'No encontrada' }, { status: 404 }) };
  if (p.creadorId !== payload.id && payload.rol !== 'admin')
    return { error: NextResponse.json({ message: 'Sin permiso' }, { status: 403 }) };
  return { payload, pregunta: p };
}

/** GET /api/banco/[id] */
export async function GET(request, { params }) {
  const { id } = await params;
  const { error, pregunta } = await authAndOwn(request, id);
  if (error) return error;
  return NextResponse.json(pregunta);
}

/** PUT /api/banco/[id] – actualiza pregunta del banco */
export async function PUT(request, { params }) {
  const { id } = await params;
  const { error } = await authAndOwn(request, id);
  if (error) return error;

  const { pregunta, tipo, puntos, categoriaId, respuestaCorrecta, patronRegex, opciones } =
    await request.json();

  await prisma.$transaction(async (tx) => {
    await tx.preguntaBanco.update({
      where: { id },
      data: {
        pregunta,
        tipo,
        puntos: Number(puntos) || 1,
        categoriaId: categoriaId || null,
        respuestaCorrecta: respuestaCorrecta || null,
        patronRegex: patronRegex || null,
      },
    });
    if (opciones !== undefined) {
      await tx.opcionBanco.deleteMany({ where: { preguntaId: id } });
      if (opciones?.length) {
        await tx.opcionBanco.createMany({
          data: opciones.map((o) => ({
            preguntaId: id,
            textoOpcion: o.textoOpcion,
            esCorrecta: o.esCorrecta ?? false,
          })),
        });
      }
    }
  });

  const updated = await prisma.preguntaBanco.findUnique({
    where: { id },
    include: { opciones: true, categoria: { select: { id: true, nombre: true } } },
  });
  return NextResponse.json(updated);
}

/** DELETE /api/banco/[id] */
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { error } = await authAndOwn(request, id);
  if (error) return error;
  await prisma.preguntaBanco.delete({ where: { id } });
  return NextResponse.json({ message: 'Eliminada del banco' });
}
