import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

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

    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 });
    }

    // Si es admin, ve todos. Si es instructor, solo los suyos. Excluir 'archivado' o incluirlos si queremos ver historial.
    // Vamos a mostrarlos todos excepto archivados, a menos que se requiera.
    let whereClause = { estado: { not: 'archivado' } };

    if (payload.rol === 'instructor') {
      whereClause.instructorId = payload.id;
    }

    const cursos = await prisma.curso.findMany({
      where: whereClause,
      include: {
        categoria: true,
        modulos: { include: { lecciones: true } },
        cursosExternos: true,
      },
      orderBy: { creado: 'desc' },
    });

    return NextResponse.json(cursos, { status: 200 });
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

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

    // 1. Validar que sea admin o instructor
    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return NextResponse.json(
        { message: 'Acceso denegado. Solo administradores o instructores pueden crear cursos.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      titulo,
      subtitulo,
      descripcion,
      categoria,
      subcategoria,
      instructorId,
      imgPortada,
      institucionId,
      nivel,
      idioma,
      duracion,
      duracionUnidad,
      objetivos,
      requisitos,
      tags,
    } = body;

    // 2. Validar campos exigidos
    if (!titulo || !descripcion || !categoria || !instructorId) {
      return NextResponse.json(
        {
          message: 'Faltan campos obligatorios: título, descripción, categoría, instructor',
        },
        { status: 400 }
      );
    }

    // Si es instructor, asegurar que no intente crear un curso a nombre de otro
    if (payload.rol === 'instructor' && instructorId !== payload.id) {
      return NextResponse.json(
        { message: 'No puedes crear un curso a nombre de otro instructor' },
        { status: 403 }
      );
    }

    // Crear o buscar la categoria para obtener su ID
    const categoriaDb = await prisma.categoria.upsert({
      where: { nombre: categoria },
      update: {},
      create: { nombre: categoria, descripcion: `Categoría ${categoria}` },
    });

    // Resolver de manera segura la institucion si es instructor
    let finalInstitucionId = institucionId || null;
    if (payload.rol === 'instructor') {
      const inv = await prisma.tokenInvitacionInstructor.findFirst({
        where: {
          correo: payload.email.toLowerCase(),
          usado: true,
        },
      });
      if (inv) {
        finalInstitucionId = inv.institucionId;
      }
    }

    // 3. Crear el curso (el estado 'borrador' viene por defecto desde Prisma)
    const nuevoCurso = await prisma.curso.create({
      data: {
        titulo,
        subtitulo,
        descripcion,
        categoriaId: categoriaDb.id,
        subcategoria,
        instructorId,
        imgPortada,
        institucionId: finalInstitucionId,
        nivel,
        idioma,
        duracion: duracion ? parseInt(duracion, 10) : null,
        duracionUnidad,
        objetivos: Array.isArray(objetivos) ? objetivos : [],
        requisitos: Array.isArray(requisitos) ? requisitos : [],
        tags: Array.isArray(tags) ? tags : [],
      },
    });

    return NextResponse.json(
      { message: 'Curso creado exitosamente', curso: nuevoCurso },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear curso:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al crear el curso' },
      { status: 500 }
    );
  }
}
