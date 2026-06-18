import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/upload/scorm
 * Subir e importar un paquete SCORM (ZIP).
 * Restringido a instructores del curso o administradores.
 * Body: FormData con 'file' (ZIP) y 'leccionId' (String).
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

    const formData = await request.formData();
    const file = formData.get('file');
    const leccionId = formData.get('leccionId');

    if (!file || !leccionId) {
      return NextResponse.json(
        { message: 'Archivo zip y leccionId son requeridos' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { message: 'El archivo debe ser un paquete comprimido en formato ZIP' },
        { status: 400 }
      );
    }

    // Buscar lección y validar que el usuario es instructor del curso o admin
    const leccion = await prisma.leccion.findUnique({
      where: { id: leccionId },
      include: {
        modulo: {
          include: {
            curso: { select: { instructorId: true } },
          },
        },
      },
    });

    if (!leccion) {
      return NextResponse.json({ message: 'Lección no encontrada' }, { status: 404 });
    }

    const esInstructor =
      payload.rol === 'instructor' && leccion.modulo.curso.instructorId === payload.id;
    const esAdmin = payload.rol === 'admin';

    if (!esInstructor && !esAdmin) {
      return NextResponse.json(
        { message: 'No tienes permisos para modificar esta lección' },
        { status: 403 }
      );
    }

    // Leer el buffer del archivo subido
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ruta de extracción en public/scorm/<leccionId>
    const extractPath = path.join(process.cwd(), 'public', 'scorm', leccionId);

    // Asegurar que el directorio de extracción exista
    if (fs.existsSync(extractPath)) {
      // Si ya existía, limpiar archivos viejos para evitar basura
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    fs.mkdirSync(extractPath, { recursive: true });

    // Descomprimir usando adm-zip
    const zip = new AdmZip(buffer);
    zip.extractAllTo(extractPath, true);

    // Analizar imsmanifest.xml para buscar el archivo de lanzamiento (Launch HTML)
    const manifestPath = path.join(extractPath, 'imsmanifest.xml');
    let launchFile = 'index.html'; // Default por defecto

    if (fs.existsSync(manifestPath)) {
      try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        // Buscar el href de la sección <resource>
        const match = manifestContent.match(/<resource[^>]*\shref="([^"]+)"/i);
        if (match && match[1]) {
          launchFile = match[1];
        }
      } catch (manifestErr) {
        console.error('Error leyendo imsmanifest.xml:', manifestErr);
      }
    }

    const scormUrl = `/scorm/${leccionId}/${launchFile}`;

    // Actualizar lección con el URL SCORM
    const leccionActualizada = await prisma.leccion.update({
      where: { id: leccionId },
      data: {
        esScorm: true,
        scormUrl,
      },
    });

    return NextResponse.json(
      {
        message: 'Paquete SCORM importado y extraído correctamente',
        leccion: leccionActualizada,
        scormUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/upload/scorm]', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al procesar el SCORM' },
      { status: 500 }
    );
  }
}
