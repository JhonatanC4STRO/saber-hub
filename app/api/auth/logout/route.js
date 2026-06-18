import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(req) {
  const token = req.cookies.get('token')?.value;
  if (token) {
    try {
      const payload = await verifyToken(token);
      await prisma.logAuditoria.create({
        data: {
          usuarioId: payload.id,
          accion: 'CIERRE_SESION',
          tabla: 'usuarios',
          registroId: payload.id,
          datosDespues: JSON.stringify({ email: payload.email }),
          ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
        },
      });
    } catch {}
  }

  const res = NextResponse.json({ message: 'Logout exitoso' }, { status: 200 });

  res.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return res;
}
