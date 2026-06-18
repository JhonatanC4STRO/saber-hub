import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  let admin: any;
  try {
    admin = await verifyToken(token);
    if (admin?.rol !== 'admin') throw new Error();
  } catch {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ message: 'Sin IDs' }, { status: 400 });
  }
  if (ids.length > 50) {
    return NextResponse.json({ message: 'Máximo 50 por lote' }, { status: 400 });
  }

  const pendientes = await prisma.cursoExterno.findMany({
    where: { id: { in: ids }, estado: 'pendiente' },
  });

  const resultados: { id: string; ok: boolean; error?: string }[] = [];

  for (const ext of pendientes) {
    try {
      if (!ext.titulo || ext.titulo.trim() === '') {
        resultados.push({ id: ext.id, ok: false, error: 'El curso no tiene un título válido.' });
        continue;
      }

      const nuevoCurso = await prisma.curso.create({
        data: {
          titulo: ext.titulo.trim(),
          descripcion: ext.descripcion,
          imgPortada: ext.imagenUrl,
          nivel: ext.nivel,
          estado: 'publicado',
          instructorId: admin.id,
          institucionId: ext.institucionId,
        },
      });

      await prisma.cursoExterno.update({
        where: { id: ext.id },
        data: {
          estado: 'aprobado',
          estaActivo: true,
          cursoId: nuevoCurso.id,
          revisadoPorId: admin.id,
          revisadoEn: new Date(),
        },
      });

      resultados.push({ id: ext.id, ok: true });
    } catch (err) {
      resultados.push({ id: ext.id, ok: false, error: (err as Error).message });
    }
  }

  const exitosos = resultados.filter((r) => r.ok).length;
  const fallidos = resultados.filter((r) => !r.ok).length;

  try {
    await prisma.notificacion.create({
      data: {
        usuarioId: admin.id,
        tipo: 'sistema',
        titulo: 'Aprobación en lote finalizada',
        contenido: `Se completó la aprobación en lote. Aprobados: ${exitosos}, Fallidos/Omitidos: ${fallidos}.`,
        urlDestino: '/admin/cursos-externos',
      },
    });
  } catch (err) {
    console.error('Error al crear notificación de aprobación en lote:', err);
  }

  return NextResponse.json({ exitosos, fallidos, resultados });
}
