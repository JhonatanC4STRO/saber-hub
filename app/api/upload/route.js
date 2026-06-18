import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const maxDuration = 300; // Aumentar límite de ejecución a 5 minutos para subidas grandes

// GET: Generar firma de subida para subir directo desde el cliente (bypaseando el servidor de Next.js)
export async function GET(request) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'saberhub-cursos';

    const cloudName = cloudinary.config().cloud_name;
    const apiKey = cloudinary.config().api_key;
    const apiSecret = cloudinary.config().api_secret;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { message: 'Cloudinary no está correctamente configurado en el servidor' },
        { status: 500 }
      );
    }

    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json(
      {
        signature,
        timestamp,
        folder,
        apiKey,
        cloudName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al generar firma de Cloudinary:', error);
    return NextResponse.json(
      { message: 'Error interno al generar firma de subida' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ message: 'No se encontró ningún archivo' }, { status: 400 });
    }

    const isVideo = file.type.startsWith('video/');
    const isDoc =
      file.type.includes('pdf') ||
      file.type.includes('presentation') ||
      file.type.includes('document');

    // Tamaños máximos
    const maxSizeVideo = 100 * 1024 * 1024; // 100 MB
    const maxSizeDoc = 50 * 1024 * 1024; // 50 MB
    const maxSizeDefault = 10 * 1024 * 1024; // 10 MB para imagenes comunes

    if (isVideo && file.size > maxSizeVideo) {
      const currentSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { message: `El video debe pesar menos de 100 MB. El peso actual es de ${currentSizeMB} MB.` },
        { status: 400 }
      );
    }
    if (isDoc && file.size > maxSizeDoc) {
      return NextResponse.json(
        { message: 'El documento excede el tamaño máximo de 50 MB' },
        { status: 400 }
      );
    }
    if (!isVideo && !isDoc && file.size > maxSizeDefault) {
      return NextResponse.json(
        { message: 'El archivo excede el límite permitido' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Para videos es importante especificar resource_type: 'video' para que use streaming adaptativo HLS
    const resourceType = isVideo ? 'video' : 'auto';

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'saberhub-cursos', resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url, format: result.format }, { status: 200 });
  } catch (error) {
    console.error('Error al subir a Cloudinary:', error);
    return NextResponse.json({ message: 'Error interno al subir la imagen' }, { status: 500 });
  }
}
