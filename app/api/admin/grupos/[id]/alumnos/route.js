import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Helper to verify admin or instructor access
async function authorize(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return { error: 'No autorizado', status: 401 };

  try {
    const payload = await verifyToken(token);
    if (payload.rol !== 'admin' && payload.rol !== 'instructor') {
      return { error: 'Acceso denegado', status: 403 };
    }
    return { payload };
  } catch (err) {
    return { error: 'Token inválido', status: 401 };
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { id: grupoId } = await params;
    const body = await request.json();
    const { alumnosIds = [], alumnosEmails = [], alumnosDocumentos = [] } = body;

    const grupo = await prisma.grupo.findUnique({
      where: { id: grupoId },
      include: {
        cursos: {
          select: { cursoId: true },
        },
      },
    });

    if (!grupo) {
      return NextResponse.json({ message: 'Grupo no encontrado' }, { status: 404 });
    }

    const agregados = [];
    const yaExistian = [];
    const noEncontrados = [];

    // 1. Resolver todos los IDs de usuario válidos
    const targetUserIds = new Set();

    // Agregar IDs directos
    if (alumnosIds.length > 0) {
      const users = await prisma.usuario.findMany({
        where: { id: { in: alumnosIds } },
        select: { id: true, nombre: true, email: true },
      });
      users.forEach((u) => targetUserIds.add(u.id));
    }

    // Resolver por Emails
    if (alumnosEmails.length > 0) {
      const trimmedEmails = alumnosEmails.map((e) => e.trim().toLowerCase());
      const users = await prisma.usuario.findMany({
        where: { email: { in: trimmedEmails } },
        select: { id: true, nombre: true, email: true },
      });

      const foundEmails = new Set(users.map((u) => u.email.toLowerCase()));
      trimmedEmails.forEach((email) => {
        if (!foundEmails.has(email)) {
          noEncontrados.push(email);
        }
      });

      users.forEach((u) => targetUserIds.add(u.id));
    }

    // Resolver por Documentos
    if (alumnosDocumentos.length > 0) {
      const docStrings = alumnosDocumentos.map((d) => String(d).trim());
      const users = await prisma.usuario.findMany({
        where: { documento: { in: docStrings } },
        select: { id: true, nombre: true, documento: true },
      });

      const foundDocs = new Set(users.map((u) => u.documento));
      docStrings.forEach((doc) => {
        if (!foundDocs.has(doc)) {
          noEncontrados.push(`Doc: ${doc}`);
        }
      });

      users.forEach((u) => targetUserIds.add(u.id));
    }

    // 2. Procesar las inscripciones en el grupo
    const userIdsArray = Array.from(targetUserIds);
    for (const usuarioId of userIdsArray) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { nombre: true, email: true },
      });

      if (!usuario) continue;

      const miembroExistente = await prisma.miembroGrupo.findUnique({
        where: {
          grupoId_usuarioId: {
            grupoId,
            usuarioId,
          },
        },
      });

      if (miembroExistente) {
        yaExistian.push(usuario.nombre || usuario.email);
      } else {
        // Crear miembro
        await prisma.miembroGrupo.create({
          data: {
            grupoId,
            usuarioId,
          },
        });
        agregados.push(usuario.nombre || usuario.email);

        // PROPAGACIÓN AUTOMÁTICA: Matricular en los cursos asignados al grupo
        if (grupo.cursos.length > 0) {
          for (const asignacion of grupo.cursos) {
            const inscripcionExistente = await prisma.inscripcion.findUnique({
              where: {
                usuarioId_cursoId: {
                  usuarioId,
                  cursoId: asignacion.cursoId,
                },
              },
            });

            if (!inscripcionExistente) {
              await prisma.inscripcion.create({
                data: {
                  usuarioId,
                  cursoId: asignacion.cursoId,
                  estado: 'activo',
                },
              });
            }
          }
        }
      }
    }

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: auth.payload.id,
        accion: 'VINCULAR_ALUMNOS_GRUPO',
        tabla: 'miembros_grupo',
        registroId: grupoId,
        datosDespues: JSON.stringify({
          grupoId,
          agregados,
          yaExistian,
          noEncontrados,
        }),
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      },
    });

    return NextResponse.json({
      message: 'Procesamiento de alumnos completado',
      stats: {
        agregadosCount: agregados.length,
        yaExistianCount: yaExistian.length,
        noEncontradosCount: noEncontrados.length,
      },
      agregados,
      yaExistian,
      noEncontrados,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al agregar alumnos al grupo' }, { status: 500 });
  }
}
