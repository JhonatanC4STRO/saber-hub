import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se encontró ningún archivo' }, { status: 400 });
    }

    // Validar tamaño máximo: 10 MB
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 10 MB.' },
        { status: 400 }
      );
    }

    // Convertir file a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validar tipo MIME real por magic bytes (file signature)
    let realMimetype = null;
    if (buffer.length >= 4) {
      // PNG magic bytes: 89 50 4E 47
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        realMimetype = 'image/png';
      }
      // PDF magic bytes: 25 50 44 46 (%PDF)
      else if (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      ) {
        realMimetype = 'application/pdf';
      }
    }

    if (!realMimetype && buffer.length >= 3) {
      // JPEG magic bytes: FF D8 FF
      if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        realMimetype = 'image/jpeg';
      }
    }

    if (!realMimetype) {
      return NextResponse.json(
        {
          error:
            'Formato no permitido. Solo se aceptan archivos PDF, JPG y PNG. Se ha detectado una firma de archivo incompatible.',
        },
        { status: 400 }
      );
    }

    // Crear directorio de destino de forma segura
    const uploadDir = path.join(process.cwd(), 'uploads', 'solicitudes');
    await fs.mkdir(uploadDir, { recursive: true });

    // Generar nombre de archivo único y seguro
    const originalName = file.name || 'documento';
    const sanitizedOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const uniqueFilename = `${uniqueSuffix}-${sanitizedOriginalName}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    // Escribir archivo al disco
    await fs.writeFile(filePath, buffer);

    return NextResponse.json(
      {
        success: true,
        nombre: originalName,
        filename: uniqueFilename,
        mimetype: realMimetype,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en POST /api/solicitudes-instructor/upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el archivo.' },
      { status: 500 }
    );
  }
}
