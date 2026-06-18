import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { enviarNotificacionConfigurada } from '@/lib/notificaciones';
import { triggerWebhook } from '@/lib/webhooks';

// GET: Listar inscripciones (admin/instructor) o las del propio alumno
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

    const { searchParams } = new URL(request.url);
    const cursoId = searchParams.get('cursoId');
    const usuarioId = searchParams.get('usuarioId');

    let where = {};

    if (payload.rol === 'estudiante') {
      // Un estudiante solo ve sus propias inscripciones activas (no retiradas)
      where.usuarioId = payload.id;
      where.estado = { not: 'retirado' };
    } else if (payload.rol === 'instructor') {
      // Instructor ve inscripciones de sus cursos
      where.curso = { instructorId: payload.id };
    }
    // Admin ve todo

    if (cursoId) where.cursoId = cursoId;
    if (usuarioId && payload.rol !== 'estudiante') where.usuarioId = usuarioId;

    const inscripciones = await prisma.inscripcion.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, email: true, documento: true } },
        certificacion: {
          select: { id: true, codigoUnico: true, urlPdf: true },
        },
        curso: {
          select: {
            id: true,
            titulo: true,
            descripcion: true,
            imgPortada: true,
            categoria: { select: { nombre: true } },
            institucion: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaInscripcion: 'desc' },
    });

    return NextResponse.json({ inscripciones });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}

// POST: Auto-inscripción de estudiante o inscripción manual por admin/instructor
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

    const body = await request.json();
    // usuarioId puede ser uno o un array; cursoId siempre requerido
    let { usuarioIds, cursoId } = body;

    if (!cursoId) return NextResponse.json({ message: 'Se requiere cursoId' }, { status: 400 });

    // Auto-inscripción del propio estudiante
    if (payload.rol === 'estudiante') {
      usuarioIds = [payload.id];
    }

    if (!usuarioIds || usuarioIds.length === 0) {
      return NextResponse.json({ message: 'Se requiere al menos un usuarioId' }, { status: 400 });
    }

    // Solo admin o instructor pueden inscribir a otros
    if (payload.rol === 'estudiante' && (usuarioIds.length > 1 || usuarioIds[0] !== payload.id)) {
      return NextResponse.json(
        { message: 'No puedes inscribir a otros usuarios' },
        { status: 403 }
      );
    }

    // Verificar que el curso existe y está publicado
    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, titulo: true, estado: true, instructorId: true },
    });

    if (!curso) return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
    if (curso.estado !== 'publicado') {
      return NextResponse.json(
        { message: 'Solo se puede inscribir en cursos publicados' },
        { status: 400 }
      );
    }

    // Instructor solo puede inscribir en sus propios cursos
    if (payload.rol === 'instructor' && curso.instructorId !== payload.id) {
      return NextResponse.json(
        { message: 'Solo puedes inscribir alumnos en tus propios cursos' },
        { status: 403 }
      );
    }

    const resultados = { exitosos: [], duplicados: [], errores: [] };

    // Obtener prerrequisitos del curso
    const prerrequisitos = await prisma.prerrequisitoCurso.findMany({
      where: { cursoId },
      include: {
        prerrequisito: {
          select: { id: true, titulo: true },
        },
      },
    });

    for (const uid of usuarioIds) {
      try {
        // Validar prerrequisitos
        if (prerrequisitos.length > 0) {
          const certificaciones = await prisma.certificacion.findMany({
            where: {
              inscripcion: {
                usuarioId: uid,
                cursoId: { in: prerrequisitos.map((p) => p.prerrequisitoId) },
              },
            },
            include: {
              inscripcion: {
                select: { cursoId: true },
              },
            },
          });

          const completadosIds = certificaciones.map((c) => c.inscripcion.cursoId);
          const faltantes = prerrequisitos.filter(
            (p) => !completadosIds.includes(p.prerrequisitoId)
          );

          if (faltantes.length > 0) {
            const nombresFaltantes = faltantes.map((p) => p.prerrequisito.titulo).join(', ');
            if (payload.rol === 'estudiante') {
              return NextResponse.json(
                {
                  message: `No cumples con los prerrequisitos obligatorios para este curso. Debes completar primero: ${nombresFaltantes}`,
                },
                { status: 400 }
              );
            } else {
              resultados.errores.push(uid);
              continue;
            }
          }
        }

        const inscripcionExistente = await prisma.inscripcion.findUnique({
          where: {
            usuarioId_cursoId: {
              usuarioId: uid,
              cursoId,
            },
          },
        });

        if (inscripcionExistente) {
          if (inscripcionExistente.estado === 'retirado') {
            await prisma.inscripcion.update({
              where: { id: inscripcionExistente.id },
              data: {
                estado: 'activo',
                fechaInscripcion: new Date(),
                progreso: 0,
              },
            });
            resultados.exitosos.push(uid);
          } else {
            resultados.duplicados.push(uid);
            continue;
          }
        } else {
          await prisma.inscripcion.create({
            data: { usuarioId: uid, cursoId },
          });
          resultados.exitosos.push(uid);
        }

        // Disparar Webhook
        triggerWebhook('inscripcion.creada', {
          usuarioId: uid,
          cursoId,
          fechaInscripcion: new Date().toISOString(),
        });

        // Enviar notificaciones configuradas (a alumno e instructor)
        try {
          const alumnoObj = await prisma.usuario.findUnique({
            where: { id: uid },
            select: { nombre: true },
          });

          if (alumnoObj) {
            // 1. Notificar al alumno
            await enviarNotificacionConfigurada({
              usuarioId: uid,
              tipo: 'inscripcion',
              titulo: `¡Te has inscrito al curso "${curso.titulo}"! 🚀`,
              contenido: `Felicidades, te has inscrito exitosamente en el curso "${curso.titulo}". Ya puedes acceder a todas las lecciones y recursos desde tu panel de control. ¡Mucho éxito en tu aprendizaje!`,
              urlDestino: `/cursos/${curso.id}`,
            });

            // 2. Notificar al instructor
            await enviarNotificacionConfigurada({
              usuarioId: curso.instructorId,
              tipo: 'inscripcion',
              titulo: `Nueva inscripción en tu curso: ${curso.titulo} 🎓`,
              contenido: `El estudiante ${alumnoObj.nombre} se ha inscrito exitosamente en tu curso "${curso.titulo}".`,
              urlDestino: `/dashboard/cursos/gestion`,
            });
          }
        } catch (notifErr) {
          console.error('[Error enviando notif de inscripcion]', notifErr);
        }
      } catch (err) {
        if (err.code === 'P2002') {
          resultados.duplicados.push(uid); // Ya inscrito (UNIQUE constraint)
        } else {
          resultados.errores.push(uid);
        }
      }
    }

    const totalExitosos = resultados.exitosos.length;

    return NextResponse.json(
      {
        message: `${totalExitosos} inscripción(es) completada(s)`,
        resultados,
      },
      { status: totalExitosos > 0 ? 201 : 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
