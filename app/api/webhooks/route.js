import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import crypto from 'crypto';

/**
 * GET /api/webhooks
 * Listar todas las suscripciones de webhooks configuradas.
 * Restringido a Administradores.
 */
export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin') {
      return NextResponse.json(
        { message: 'No tienes permisos para ver las configuraciones de webhooks' },
        { status: 403 }
      );
    }

    const webhooks = await prisma.webhook.findMany({
      orderBy: { creado: 'desc' },
    });

    return NextResponse.json(webhooks, { status: 200 });
  } catch (error) {
    console.error('[GET /api/webhooks]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/webhooks
 * Crear una nueva suscripción webhook.
 * Restringido a Administradores.
 * Body: { url, eventos, secreto }
 */
export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    if (payload.rol !== 'admin') {
      return NextResponse.json(
        { message: 'No tienes permisos para configurar webhooks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, eventos } = body;
    let { secreto } = body;

    if (!url || !eventos) {
      return NextResponse.json({ message: 'La URL y los eventos son requeridos' }, { status: 400 });
    }

    // Verificar formato de URL simple
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ message: 'URL con formato inválido' }, { status: 400 });
    }

    // Si no se provee secreto, auto-generar uno robusto
    if (!secreto || secreto.trim() === '') {
      secreto = crypto.randomBytes(24).toString('hex');
    }

    // Normalizar eventos (si es array, convertir a string separado por comas)
    let eventosString = '';
    if (Array.isArray(eventos)) {
      eventosString = eventos.map((e) => e.trim().toLowerCase()).join(',');
    } else if (typeof eventos === 'string') {
      eventosString = eventos
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .join(',');
    } else {
      return NextResponse.json(
        { message: 'El campo eventos debe ser un string o un array de strings' },
        { status: 400 }
      );
    }

    const nuevoWebhook = await prisma.webhook.create({
      data: {
        url,
        eventos: eventosString,
        secreto,
        activo: true,
      },
    });

    return NextResponse.json(nuevoWebhook, { status: 201 });
  } catch (error) {
    console.error('[POST /api/webhooks]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
