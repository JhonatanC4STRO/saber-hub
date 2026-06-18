import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: {
        prefEmailInscripcion: true,
        prefInAppInscripcion: true,
        prefEmailEvaluacion: true,
        prefInAppEvaluacion: true,
        prefEmailCertificado: true,
        prefInAppCertificado: true,
        prefEmailForo: true,
        prefInAppForo: true,
        prefEmailMensaje: true,
        prefInAppMensaje: true,
        prefEmailSesion: true,
        prefInAppSesion: true,
        prefEmailSolicitud: true,
        prefInAppSolicitud: true,
      },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('[GET /api/notificaciones/preferencias]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();

    // Whitelist only notification preference fields
    const allowedKeys = [
      'prefEmailInscripcion',
      'prefInAppInscripcion',
      'prefEmailEvaluacion',
      'prefInAppEvaluacion',
      'prefEmailCertificado',
      'prefInAppCertificado',
      'prefEmailForo',
      'prefInAppForo',
      'prefEmailMensaje',
      'prefInAppMensaje',
      'prefEmailSesion',
      'prefInAppSesion',
      'prefEmailSolicitud',
      'prefInAppSolicitud',
    ];

    const dataToUpdate = {};
    for (const key of allowedKeys) {
      if (typeof body[key] === 'boolean') {
        dataToUpdate[key] = body[key];
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron datos válidos para actualizar' },
        { status: 400 }
      );
    }

    const usuarioActualizado = await prisma.usuario.update({
      where: { id: payload.id },
      data: dataToUpdate,
      select: {
        prefEmailInscripcion: true,
        prefInAppInscripcion: true,
        prefEmailEvaluacion: true,
        prefInAppEvaluacion: true,
        prefEmailCertificado: true,
        prefInAppCertificado: true,
        prefEmailForo: true,
        prefInAppForo: true,
        prefEmailMensaje: true,
        prefInAppMensaje: true,
        prefEmailSesion: true,
        prefInAppSesion: true,
        prefEmailSolicitud: true,
        prefInAppSolicitud: true,
      },
    });

    return NextResponse.json({
      message: 'Preferencias actualizadas con éxito',
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error('[PATCH /api/notificaciones/preferencias]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
