import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

/** PATCH /api/certificados/[id]/revocar – Admin revoca un certificado */
export async function PATCH(request, { params }) {
  const token = request.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
  }
  if (payload.rol !== 'admin')
    return NextResponse.json({ message: 'Solo admin puede revocar' }, { status: 403 });

  const { id } = await params;
  const { motivo } = await request.json();
  if (!motivo) return NextResponse.json({ message: 'El motivo es obligatorio' }, { status: 400 });

  const cert = await prisma.certificacion.findUnique({ where: { id } });
  if (!cert) return NextResponse.json({ message: 'No encontrado' }, { status: 404 });
  if (cert.estado === 'revocado')
    return NextResponse.json({ message: 'Ya está revocado' }, { status: 400 });

  const updated = await prisma.certificacion.update({
    where: { id },
    data: { estado: 'revocado', motivoRevocacion: motivo },
  });

  await prisma.logAuditoria.create({
    data: {
      usuarioId: payload.id,
      accion: 'REVOCAR_CERTIFICADO',
      tabla: 'certificaciones',
      registroId: id,
      datosAntes: JSON.stringify({ estado: cert.estado }),
      datosDespues: JSON.stringify({ estado: 'revocado', motivo }),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
    },
  });

  return NextResponse.json(updated);
}
