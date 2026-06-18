import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

/**
 * POST /api/inscripciones/masiva-nuevos
 *
 * Crea usuarios nuevos (si no existen) con contraseña = documento
 * y los inscribe en el curso indicado.
 *
 * Body: { cursoId: string, usuarios: [{ nombre, email, documento }] }
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

    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return NextResponse.json(
        { message: 'Acceso denegado. Solo administradores o instructores.' },
        { status: 403 }
      );
    }

    const { cursoId, usuarios } = await request.json();

    if (!cursoId) return NextResponse.json({ message: 'cursoId es obligatorio' }, { status: 400 });
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return NextResponse.json({ message: 'Debes enviar al menos un usuario' }, { status: 400 });
    }

    const curso = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, titulo: true, estado: true, instructorId: true },
    });
    if (!curso) return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });

    // Si es un instructor, validar que sea el dueño del curso
    if (payload.rol === 'instructor' && curso.instructorId !== payload.id) {
      return NextResponse.json(
        { message: 'Acceso denegado. Solo puedes inscribir alumnos en tus propios cursos.' },
        { status: 403 }
      );
    }

    if (curso.estado !== 'publicado') {
      return NextResponse.json(
        { message: 'Solo se puede inscribir en cursos publicados' },
        { status: 400 }
      );
    }

    // Buscar o crear el rol 'estudiante'
    const rolEstudiante = await prisma.rol.upsert({
      where: { nombre: 'estudiante' },
      update: {},
      create: { nombre: 'estudiante', descripcion: 'Rol de estudiante' },
    });

    const resultados = { creados: [], yaExistian: [], duplicados: [], errores: [] };

    for (const u of usuarios) {
      const { nombre, email, documento } = u;

      if (!nombre || !email || !documento) {
        resultados.errores.push({ email: email || '?', razon: 'Campos incompletos' });
        continue;
      }

      // Contraseña siempre es el número de documento
      const passwordUsada = String(documento).trim();
      let usuarioId;
      let esNuevo = false;

      try {
        const existente = await prisma.usuario.findFirst({
          where: { OR: [{ email }, { documento: String(documento) }] },
        });

        if (existente) {
          usuarioId = existente.id;
          // Si el usuario ya existía pero no estaba verificado, lo verificamos
          if (!existente.verificado) {
            await prisma.usuario.update({
              where: { id: existente.id },
              data: { verificado: true },
            });
          }
          resultados.yaExistian.push({ email, nombre: existente.nombre });
        } else {
          const passwordHash = await bcrypt.hash(passwordUsada, 10);
          const nuevo = await prisma.usuario.create({
            data: {
              nombre,
              email,
              documento: String(documento),
              passwordHash,
              rolId: rolEstudiante.id,
              verificado: true, // Al ser creados por un administrador de manera masiva, se marcan como verificados automáticamente
            },
          });
          usuarioId = nuevo.id;
          esNuevo = true;

          await prisma.logAuditoria.create({
            data: {
              usuarioId: payload.id,
              accion: 'CREAR_USUARIO',
              tabla: 'usuarios',
              registroId: nuevo.id,
              datosDespues: JSON.stringify({
                nombre,
                email,
                documento,
                rol: 'estudiante',
                origen: 'inscripcion_masiva_excel',
              }),
              ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
            },
          });

          resultados.creados.push({ email, nombre });
        }

        await prisma.inscripcion.create({ data: { usuarioId, cursoId } });

        await prisma.logAuditoria.create({
          data: {
            usuarioId: payload.id,
            accion: 'INSCRIPCION_MASIVA',
            tabla: 'inscripciones',
            registroId: usuarioId,
            datosDespues: JSON.stringify({
              cursoId,
              curso: curso.titulo,
              email,
              usuarioNuevo: esNuevo,
            }),
            ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
          },
        });
      } catch (err) {
        if (err.code === 'P2002') {
          resultados.duplicados.push({ email });
        } else {
          resultados.errores.push({ email, razon: err.message });
        }
      }
    }

    return NextResponse.json(
      {
        message: `Proceso completado: ${resultados.creados.length} nuevos, ${resultados.yaExistian.length} existentes inscritos, ${resultados.duplicados.length} ya inscritos, ${resultados.errores.length} errores.`,
        resultados,
      },
      { status: 207 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
