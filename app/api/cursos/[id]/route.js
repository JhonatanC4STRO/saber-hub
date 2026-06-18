import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Función auxiliar para registrar logs de auditoría
async function logAuditoria(usuarioId, accion, tabla, registroId, datosAntes, datosDespues) {
  try {
    await prisma.logAuditoria.create({
      data: {
        usuarioId,
        accion,
        tabla,
        registroId,
        datosAntes: datosAntes ? JSON.stringify(datosAntes) : null,
        datosDespues: datosDespues ? JSON.stringify(datosDespues) : null,
      },
    });
  } catch (error) {
    console.error('Error al guardar log de auditoría:', error);
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const curso = await prisma.curso.findUnique({
      where: { id },
      include: {
        categoria: true,
        institucion: true,
        instructor: {
          select: {
            id: true,
            nombre: true,
            email: true,
            imagen: true,
            _count: {
              select: { cursosCreados: true },
            },
          },
        },
        modulos: {
          orderBy: { orden: 'asc' },
          include: {
            lecciones: {
              orderBy: { orden: 'asc' },
              include: { recursos: true },
            },
          },
        },
        _count: {
          select: { inscripciones: true },
        },
      },
    });

    if (!curso) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    return NextResponse.json(curso, { status: 200 });
  } catch (error) {
    console.error('Error al obtener curso:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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

    const { id } = await params;
    const cursoExistente = await prisma.curso.findUnique({
      where: { id },
      include: {
        modulos: {
          include: { lecciones: true },
        },
      },
    });

    if (!cursoExistente) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    if (payload.rol === 'instructor' && cursoExistente.instructorId !== payload.id) {
      return NextResponse.json(
        { message: 'No puedes editar un curso que no es tuyo' },
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
      imgPortada,
      estado,
      otorgaCertificado,
      criterioLeccionesMin,
      criterioEvalAprobadas,
      criterioNotaGlobal,
      instructorId,
      nivel,
      idioma,
      duracion,
      duracionUnidad,
      objetivos,
      requisitos,
      tags,
    } = body;

    // Regla de publicación
    if (estado === 'publicado' && cursoExistente.estado !== 'publicado') {
      const tieneLecciones = cursoExistente.modulos.some((modulo) => modulo.lecciones.length > 0);
      if (!tieneLecciones) {
        return NextResponse.json(
          { message: 'Para publicar el curso, debe tener al menos un módulo con una lección.' },
          { status: 400 }
        );
      }
    }

    let categoriaId = cursoExistente.categoriaId;
    if (categoria) {
      const categoriaDb = await prisma.categoria.upsert({
        where: { nombre: categoria },
        update: {},
        create: { nombre: categoria, descripcion: `Categoría ${categoria}` },
      });
      categoriaId = categoriaDb.id;
    }

    const cursoActualizado = await prisma.curso.update({
      where: { id },
      data: {
        ...(titulo && { titulo }),
        ...(subtitulo !== undefined && { subtitulo }),
        ...(descripcion && { descripcion }),
        ...(categoriaId && { categoriaId }),
        ...(subcategoria !== undefined && { subcategoria }),
        ...(imgPortada && { imgPortada }),
        ...(estado && { estado }),
        ...(otorgaCertificado !== undefined && { otorgaCertificado }),
        ...(otorgaCertificado !== undefined && { criterioLeccionesMin }),
        ...(otorgaCertificado !== undefined && { criterioEvalAprobadas }),
        ...(otorgaCertificado !== undefined && { criterioNotaGlobal }),
        ...(payload.rol === 'admin' && instructorId && { instructorId }),
        ...(nivel && { nivel }),
        ...(idioma !== undefined && { idioma }),
        ...(duracion !== undefined && { duracion: duracion ? parseInt(duracion, 10) : null }),
        ...(duracionUnidad !== undefined && { duracionUnidad }),
        ...(objetivos !== undefined && { objetivos: Array.isArray(objetivos) ? objetivos : [] }),
        ...(requisitos !== undefined && { requisitos: Array.isArray(requisitos) ? requisitos : [] }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      },
    });

    // Log de auditoría si cambia el estado a publicado/despublicado
    if (estado && estado !== cursoExistente.estado) {
      if (estado === 'publicado') {
        await logAuditoria(
          payload.id,
          'PUBLICAR_CURSO',
          'cursos',
          id,
          cursoExistente.estado,
          estado
        );
      } else if (cursoExistente.estado === 'publicado') {
        await logAuditoria(
          payload.id,
          'DESPUBLICAR_CURSO',
          'cursos',
          id,
          cursoExistente.estado,
          estado
        );
      }
    }

    return NextResponse.json(
      { message: 'Curso actualizado exitosamente', curso: cursoActualizado },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al actualizar el curso' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = await params;
    const cursoExistente = await prisma.curso.findUnique({
      where: { id },
    });

    if (!cursoExistente) {
      return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    }

    if (payload.rol === 'instructor' && cursoExistente.instructorId !== payload.id) {
      return NextResponse.json(
        { message: 'No puedes eliminar un curso que no es tuyo' },
        { status: 403 }
      );
    }

    if (cursoExistente.estado === 'archivado') {
      // Hard delete (físico)
      await prisma.curso.delete({
        where: { id },
      });

      await logAuditoria(
        payload.id,
        'ELIMINAR_CURSO_HARD',
        'cursos',
        id,
        cursoExistente,
        null
      );

      return NextResponse.json(
        { message: 'Curso eliminado permanentemente exitosamente' },
        { status: 200 }
      );
    } else {
      // Soft delete (archivado)
      const cursoArchivado = await prisma.curso.update({
        where: { id },
        data: { estado: 'archivado' },
      });

      await logAuditoria(
        payload.id,
        'ELIMINAR_CURSO_SOFT',
        'cursos',
        id,
        cursoExistente.estado,
        'archivado'
      );

      return NextResponse.json(
        { message: 'Curso eliminado (archivado) exitosamente', curso: cursoArchivado },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al eliminar el curso' },
      { status: 500 }
    );
  }
}
