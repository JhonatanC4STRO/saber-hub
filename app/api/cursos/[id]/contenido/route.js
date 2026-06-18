import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request, { params }) {
  try {
    const { id: cursoId } = await params;
    const modulos = await prisma.modulo.findMany({
      where: { cursoId },
      orderBy: { orden: 'asc' },
      include: {
        lecciones: {
          orderBy: { orden: 'asc' },
          include: { recursos: true },
        },
      },
    });
    return NextResponse.json(modulos, { status: 200 });
  } catch (error) {
    console.error('Error al obtener contenido:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
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

    const { id: cursoId } = await params;

    // Verificar propiedad
    const curso = await prisma.curso.findUnique({ where: { id: cursoId } });
    if (!curso) return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });

    if (payload.rol === 'instructor' && curso.instructorId !== payload.id) {
      return NextResponse.json(
        { message: 'No puedes editar el contenido de este curso' },
        { status: 403 }
      );
    }

    const modulos = await request.json();

    // Para evitar pérdida de progreso de alumnos, eliminamos únicamente lo que el usuario borró en la UI.
    // Realizamos un borrado en cascada y luego actualizamos/creamos los elementos restantes.

    await prisma.$transaction(async (tx) => {
      const payloadModuloIds = modulos
        .map((m) => m.id)
        .filter((id) => id && !id.toString().startsWith('temp-'));

      const payloadLeccionIds = modulos
        .flatMap((m) => m.lecciones || [])
        .map((l) => l.id)
        .filter((id) => id && !id.toString().startsWith('temp-'));

      // 1. Eliminar lecciones que no están en el payload
      await tx.leccion.deleteMany({
        where: {
          modulo: { cursoId },
          NOT: { id: { in: payloadLeccionIds } },
        },
      });

      // 2. Eliminar módulos que no están en el payload
      await tx.modulo.deleteMany({
        where: {
          cursoId,
          NOT: { id: { in: payloadModuloIds } },
        },
      });

      // 3. Desplazar temporalmente a orden negativo para evitar violación de @@unique([cursoId, orden]) y @@unique([moduloId, orden])
      const remainingModulos = await tx.modulo.findMany({
        where: { cursoId },
      });
      for (let i = 0; i < remainingModulos.length; i++) {
        await tx.modulo.update({
          where: { id: remainingModulos[i].id },
          data: { orden: -1 - i },
        });
      }

      const remainingLecciones = await tx.leccion.findMany({
        where: { modulo: { cursoId } },
      });
      for (let j = 0; j < remainingLecciones.length; j++) {
        await tx.leccion.update({
          where: { id: remainingLecciones[j].id },
          data: { orden: -1 - j },
        });
      }

      for (let i = 0; i < modulos.length; i++) {
        const mod = modulos[i];

        let modId = mod.id;
        if (mod.id && !mod.id.toString().startsWith('temp-')) {
          await tx.modulo.update({
            where: { id: mod.id },
            data: { titulo: mod.titulo, descripcion: mod.descripcion, orden: i },
          });
        } else {
          const newMod = await tx.modulo.create({
            data: {
              cursoId,
              titulo: mod.titulo,
              descripcion: mod.descripcion,
              orden: i,
            },
          });
          modId = newMod.id;
        }

        // Lecciones
        if (mod.lecciones) {
          for (let j = 0; j < mod.lecciones.length; j++) {
            const lec = mod.lecciones[j];
            const getResourceType = (name) => {
              const ext = name.split('.').pop()?.toLowerCase();
              if (['pdf'].includes(ext)) return 'pdf';
              if (['mp4', 'mov', 'webm'].includes(ext)) return 'video';
              if (['mp3', 'wav'].includes(ext)) return 'audio';
              if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'imagen';
              if (['ppt', 'pptx'].includes(ext)) return 'presentacion';
              return 'otro';
            };

            const recursosData = (lec.recursos || []).map((r) => ({
              titulo: r.titulo,
              tipo: r.tipo || getResourceType(r.titulo),
              urlDocumento: r.urlDocumento,
            }));

            if (lec.id && !lec.id.toString().startsWith('temp-')) {
              await tx.leccion.update({
                where: { id: lec.id },
                data: {
                  modulo: { connect: { id: modId } },
                  orden: j,
                  titulo: lec.titulo,
                  contenidoTexto: lec.contenidoTexto,
                  urlVideo: lec.urlVideo,
                  esPreview: lec.esPreview,
                  duracion: lec.duracion ? parseInt(lec.duracion, 10) : null,
                  subtitulos: lec.subtitulos,
                },
              });

              // Sync recursos
              await tx.recurso.deleteMany({
                where: { leccionId: lec.id },
              });

              if (recursosData.length > 0) {
                await tx.recurso.createMany({
                  data: recursosData.map((r) => ({
                    leccionId: lec.id,
                    ...r,
                  })),
                });
              }
            } else {
              const newLec = await tx.leccion.create({
                data: {
                  modulo: { connect: { id: modId } },
                  orden: j,
                  titulo: lec.titulo,
                  contenidoTexto: lec.contenidoTexto,
                  urlVideo: lec.urlVideo,
                  esPreview: lec.esPreview || false,
                  duracion: lec.duracion ? parseInt(lec.duracion, 10) : null,
                  subtitulos: lec.subtitulos,
                },
              });

              if (recursosData.length > 0) {
                await tx.recurso.createMany({
                  data: recursosData.map((r) => ({
                    leccionId: newLec.id,
                    ...r,
                  })),
                });
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ message: 'Contenido actualizado exitosamente' }, { status: 200 });
  } catch (error) {
    console.error('Error al guardar contenido:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al guardar contenido' },
      { status: 500 }
    );
  }
}
