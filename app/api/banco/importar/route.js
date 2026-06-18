import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

async function auth(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { error: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) };
  try {
    return { payload: await verifyToken(token) };
  } catch {
    return { error: NextResponse.json({ message: 'Token inválido' }, { status: 401 }) };
  }
}

/**
 * POST /api/banco/importar
 * Body: multipart/form-data  → field "file" (JSON or XLSX)
 * JSON format:  array of { pregunta, tipo, puntos, categoriaId?, respuestaCorrecta?, patronRegex?, opciones: [{textoOpcion, esCorrecta}] }
 * XLSX format: columns: pregunta | tipo | puntos | opciones (pipe-separated, mark correct with [CORRECTA]) | respuestaCorrecta | patronRegex
 */
export async function POST(request) {
  const { error, payload } = await auth(request);
  if (error) return error;

  if (payload.rol !== 'instructor' && payload.rol !== 'admin') {
    return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) return NextResponse.json({ message: 'No se recibió archivo' }, { status: 400 });

  const nombre = file.name || '';
  const arrayBuf = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  let preguntas = [];

  if (nombre.endsWith('.json')) {
    preguntas = JSON.parse(buffer.toString('utf-8'));
  } else if (nombre.endsWith('.xlsx') || nombre.endsWith('.xls')) {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      preguntas = rows.map((r) => ({
        pregunta: r.pregunta || '',
        tipo: r.tipo || 'opcion_multiple',
        puntos: Number(r.puntos) || 1,
        respuestaCorrecta: r.respuestaCorrecta || null,
        patronRegex: r.patronRegex || null,
        opciones: r.opciones
          ? String(r.opciones)
              .split('|')
              .map((o) => {
                const correct = o.includes('[CORRECTA]');
                return { textoOpcion: o.replace('[CORRECTA]', '').trim(), esCorrecta: correct };
              })
          : [],
      }));
    } catch (e) {
      console.error('XLSX parse error', e);
      return NextResponse.json({ message: 'Error al leer el archivo XLSX' }, { status: 400 });
    }
  } else {
    return NextResponse.json(
      { message: 'Formato no soportado. Use .json o .xlsx' },
      { status: 400 }
    );
  }

  if (!preguntas.length)
    return NextResponse.json({ message: 'El archivo está vacío' }, { status: 400 });

  const TIPOS_VALIDOS = ['opcion_multiple', 'verdadero_falso', 'respuesta_corta', 'desarrollo'];
  let importadas = 0;

  for (const p of preguntas) {
    if (!p.pregunta || !TIPOS_VALIDOS.includes(p.tipo)) continue;
    await prisma.preguntaBanco.create({
      data: {
        creadorId: payload.id,
        pregunta: p.pregunta,
        tipo: p.tipo,
        puntos: Number(p.puntos) || 1,
        respuestaCorrecta: p.respuestaCorrecta || null,
        patronRegex: p.patronRegex || null,
        opciones: p.opciones?.length
          ? {
              create: p.opciones.map((o) => ({
                textoOpcion: o.textoOpcion,
                esCorrecta: o.esCorrecta ?? false,
              })),
            }
          : undefined,
      },
    });
    importadas++;
  }

  return NextResponse.json({
    message: `${importadas} preguntas importadas exitosamente`,
    importadas,
  });
}
