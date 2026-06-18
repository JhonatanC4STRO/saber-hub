import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return new Response('No autenticado', { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return new Response('Sesión inválida', { status: 401 });
    }

    const { filename } = await params;
    if (!filename) {
      return new Response('Nombre de archivo faltante', { status: 400 });
    }

    // Buscar si existe una solicitud que contenga este filename en su campo documentos
    const solicitud = await prisma.solicitudInstructor.findFirst({
      where: {
        documentos: {
          contains: filename,
        },
      },
    });

    // Control de acceso estricto
    if (solicitud) {
      const isOwner = usuario.id === solicitud.usuarioId;
      const isAdmin = usuario.rol === 'admin';
      if (!isOwner && !isAdmin) {
        return new Response(
          'Acceso denegado. Solo el solicitante y los administradores pueden acceder a estos documentos.',
          { status: 403 }
        );
      }
    } else {
      // Si no hay solicitud asociada aún (el estudiante la está subiendo y previsualizando antes de enviar)
      // Solo permitimos a usuarios registrados acceder.
      if (!usuario.id) {
        return new Response('Acceso denegado.', { status: 403 });
      }
    }

    // Ruta física del archivo
    const filePath = path.join(process.cwd(), 'uploads', 'solicitudes', filename);

    try {
      // Verificar existencia física
      await fs.access(filePath);
    } catch {
      return new Response('Archivo no encontrado físicamente en el servidor.', { status: 404 });
    }

    // Leer archivo
    const fileBuffer = await fs.readFile(filePath);

    // Determinar content-type basado en la extensión
    let contentType = 'application/octet-stream';
    if (filename.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (filename.toLowerCase().endsWith('.png')) {
      contentType = 'image/png';
    } else if (
      filename.toLowerCase().endsWith('.jpg') ||
      filename.toLowerCase().endsWith('.jpeg')
    ) {
      contentType = 'image/jpeg';
    }

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error en GET /api/solicitudes-instructor/documentos/[filename]:', error);
    return new Response('Error interno del servidor.', { status: 500 });
  }
}
