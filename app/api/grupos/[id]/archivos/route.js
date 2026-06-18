import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { v2 as cloudinary } from 'cloudinary';

async function checkGroupAccess(usuarioId, rol, grupoId) {
  if (rol === 'admin') return true;
  const grupo = await prisma.grupo.findUnique({
    where: { id: grupoId },
    include: { miembros: true },
  });
  if (!grupo) return false;
  if (grupo.creadorId === usuarioId) return true;
  if (grupo.miembros.some((m) => m.usuarioId === usuarioId)) return true;
  return false;
}

export async function GET(request, { params }) {
  try {
    const { id: grupoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const hasAccess = await checkGroupAccess(payload.id, payload.rol, grupoId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acceso denegado a este grupo' }, { status: 403 });
    }

    // Obtener todos los archivos del grupo
    const archivos = await prisma.archivoGrupo.findMany({
      where: { grupoId },
      include: {
        autor: {
          select: { id: true, nombre: true, imagen: true },
        },
      },
      orderBy: { creado: 'desc' },
    });

    // Agruparlos por nombre (case-insensitive para agrupar de forma más robusta)
    // El objeto final contendrá el archivo con la mayor versión como el principal
    // y una lista de versiones anteriores ordenadas de mayor a menor.
    const mapArchivos = {};

    for (const file of archivos) {
      const key = file.nombre.toLowerCase();

      if (!mapArchivos[key]) {
        mapArchivos[key] = {
          ...file,
          versiones: [],
        };
      } else {
        // Si esta versión es más alta, se convierte en la principal
        if (file.version > mapArchivos[key].version) {
          const oldMain = { ...mapArchivos[key] };
          delete oldMain.versiones;

          mapArchivos[key].versiones.push(oldMain);

          const tempVersiones = mapArchivos[key].versiones;
          Object.assign(mapArchivos[key], file);
          mapArchivos[key].versiones = tempVersiones;
        } else {
          // Si es menor o igual, va al historial
          mapArchivos[key].versiones.push(file);
        }
      }
    }

    // Ordenar el historial de versiones de forma descendente por número de versión
    Object.values(mapArchivos).forEach((item) => {
      item.versiones.sort((a, b) => b.version - a.version);
    });

    // Retornamos los archivos ordenados por su fecha de creación más reciente (la de la versión principal)
    const listadoAgrupado = Object.values(mapArchivos).sort(
      (a, b) => b.creado.getTime() - a.creado.getTime()
    );

    return NextResponse.json(listadoAgrupado);
  } catch (error) {
    console.error('[GET /api/grupos/[id]/archivos]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: grupoId } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const hasAccess = await checkGroupAccess(payload.id, payload.rol, grupoId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permiso para subir archivos a este grupo' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const filename = file.name;
    const size = file.size; // en bytes
    const mimeType = file.type;

    // Determinar categoría del archivo
    const isVideo = mimeType.startsWith('video/');
    const isDoc =
      mimeType.includes('pdf') ||
      mimeType.includes('presentation') ||
      mimeType.includes('document') ||
      mimeType.includes('sheet') ||
      mimeType.includes('excel') ||
      mimeType.includes('word') ||
      filename.endsWith('.pdf') ||
      filename.endsWith('.docx') ||
      filename.endsWith('.xlsx') ||
      filename.endsWith('.pptx') ||
      filename.endsWith('.doc') ||
      filename.endsWith('.xls') ||
      filename.endsWith('.ppt');

    // Validar tamaños de carga
    const maxSizeVideo = 500 * 1024 * 1024; // 500 MB
    const maxSizeDoc = 50 * 1024 * 1024; // 50 MB
    const maxSizeDefault = 10 * 1024 * 1024; // 10 MB

    let tipoCat = 'otro';
    if (isVideo) {
      tipoCat = 'video';
      if (size > maxSizeVideo) {
        return NextResponse.json(
          { error: 'El archivo de video excede el límite permitido de 500 MB' },
          { status: 400 }
        );
      }
    } else if (isDoc) {
      tipoCat = 'documento';
      if (size > maxSizeDoc) {
        return NextResponse.json(
          { error: 'El documento excede el límite permitido de 50 MB' },
          { status: 400 }
        );
      }
    } else {
      // Por ejemplo, imágenes, audio, etc.
      if (mimeType.startsWith('image/')) {
        tipoCat = 'imagen';
      } else if (mimeType.startsWith('audio/')) {
        tipoCat = 'audio';
      }
      if (size > maxSizeDefault) {
        return NextResponse.json(
          { error: 'El archivo excede el límite permitido de 10 MB' },
          { status: 400 }
        );
      }
    }

    // Convertir a buffer para subir a Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const resourceType = isVideo ? 'video' : 'auto';

    // Subir a Cloudinary en una carpeta designada
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'saberhub-grupos', resource_type: resourceType },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // Detectar colisiones de nombres para calcular la versión
    const existing = await prisma.archivoGrupo.findMany({
      where: {
        grupoId,
        nombre: filename,
      },
      orderBy: { version: 'desc' },
      take: 1,
    });

    let version = 1;
    if (existing.length > 0) {
      version = existing[0].version + 1;
    }

    // Crear el registro del archivo en la base de datos
    const nuevoArchivo = await prisma.archivoGrupo.create({
      data: {
        grupoId,
        autorId: payload.id,
        nombre: filename,
        tipo: tipoCat,
        url: result.secure_url,
        peso: size,
        version,
      },
      include: {
        autor: {
          select: { id: true, nombre: true, imagen: true },
        },
      },
    });

    return NextResponse.json(nuevoArchivo, { status: 201 });
  } catch (error) {
    console.error('[POST /api/grupos/[id]/archivos]', error);
    return NextResponse.json({ error: 'Error al procesar la subida del archivo' }, { status: 500 });
  }
}
