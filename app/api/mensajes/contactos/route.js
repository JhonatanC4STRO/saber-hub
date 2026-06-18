import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await verifyToken(token);
    if (!usuario) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    let contactos = [];
    let grupos = [];

    if (usuario.rol === 'admin') {
      // Admins can see all users and all groups
      const allUsers = await prisma.usuario.findMany({
        where: { NOT: { id: usuario.id } },
        select: {
          id: true,
          nombre: true,
          email: true,
          imagen: true,
          rol: { select: { nombre: true } },
        },
      });
      contactos = allUsers.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        imagen: u.imagen,
        rol: u.rol.nombre,
      }));

      const allGroups = await prisma.grupo.findMany({
        select: { id: true, nombre: true, descripcion: true },
      });
      grupos = allGroups;
    } else if (usuario.rol === 'instructor') {
      // Instructors can see all students in their courses, all admins, and all groups they own/assigned
      const instructorCursos = await prisma.curso.findMany({
        where: { instructorId: usuario.id },
        select: { id: true, titulo: true },
      });
      const cursoIds = instructorCursos.map((c) => c.id);
      const cursoMap = new Map(instructorCursos.map((c) => [c.id, c.titulo]));

      // Get enrolled students
      const inscripciones = await prisma.inscripcion.findMany({
        where: { cursoId: { in: cursoIds } },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              imagen: true,
              rol: { select: { nombre: true } },
            },
          },
        },
      });

      // Get admins
      const admins = await prisma.usuario.findMany({
        where: { rol: { nombre: 'admin' } },
        select: {
          id: true,
          nombre: true,
          email: true,
          imagen: true,
          rol: { select: { nombre: true } },
        },
      });

      const userMap = new Map();
      admins.forEach((a) =>
        userMap.set(a.id, {
          id: a.id,
          nombre: a.nombre,
          email: a.email,
          imagen: a.imagen,
          rol: a.rol.nombre,
          cursosCompartidos: [],
        })
      );
      inscripciones.forEach((ins) => {
        if (ins.usuario && ins.usuario.id !== usuario.id) {
          const cursoTitulo = cursoMap.get(ins.cursoId) || '';
          const existing = userMap.get(ins.usuario.id);
          if (existing) {
            if (cursoTitulo && !existing.cursosCompartidos.includes(cursoTitulo)) {
              existing.cursosCompartidos.push(cursoTitulo);
            }
          } else {
            userMap.set(ins.usuario.id, {
              id: ins.usuario.id,
              nombre: ins.usuario.nombre,
              email: ins.usuario.email,
              imagen: ins.usuario.imagen,
              rol: ins.usuario.rol.nombre,
              cursosCompartidos: cursoTitulo ? [cursoTitulo] : [],
            });
          }
        }
      });

      contactos = Array.from(userMap.values());

      // Get instructor groups
      const instructorGroups = await prisma.grupo.findMany({
        where: { creadorId: usuario.id },
        select: { id: true, nombre: true, descripcion: true },
      });
      grupos = instructorGroups;
    } else {
      // Students can see:
      // 1. Enrolled course instructors
      // 2. Classmates in those courses
      // 3. Admins
      // 4. Groups they are in

      // Get ALL inscriptions for this user (any non-retirado state)
      const studentInscripciones = await prisma.inscripcion.findMany({
        where: {
          usuarioId: usuario.id,
          estado: { in: ['activo', 'inactivo', 'finalizado'] },
        },
        select: { cursoId: true },
      });
      const cursoIds = studentInscripciones.map((ins) => ins.cursoId);

      console.log('[contactos] Student', usuario.id, 'rol:', usuario.rol, 'inscripciones:', studentInscripciones.length, 'cursoIds:', cursoIds);

      // Get courses with their instructors and title
      const cursos = await prisma.curso.findMany({
        where: { id: { in: cursoIds } },
        select: {
          id: true,
          titulo: true,
          instructor: {
            select: {
              id: true,
              nombre: true,
              email: true,
              imagen: true,
              rol: { select: { nombre: true } },
            },
          },
        },
      });

      // Build a list of enrolled courses for the frontend to filter by
      const cursosInscritos = cursos.map((c) => ({ id: c.id, titulo: c.titulo }));

      // Get classmates (activo, inactivo, finalizado — exclude retirado)
      const classmates = await prisma.inscripcion.findMany({
        where: {
          cursoId: { in: cursoIds },
          estado: { in: ['activo', 'inactivo', 'finalizado'] },
          NOT: { usuarioId: usuario.id },
        },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              imagen: true,
              rol: { select: { nombre: true } },
            },
          },
          curso: {
            select: {
              id: true,
              titulo: true,
            },
          },
        },
      });

      console.log('[contactos] Classmates found:', classmates.length);

      // Get admins
      const admins = await prisma.usuario.findMany({
        where: { rol: { nombre: 'admin' } },
        select: {
          id: true,
          nombre: true,
          email: true,
          imagen: true,
          rol: { select: { nombre: true } },
        },
      });

      const userMap = new Map();
      admins.forEach((a) =>
        userMap.set(a.id, {
          id: a.id,
          nombre: a.nombre,
          email: a.email,
          imagen: a.imagen,
          rol: a.rol.nombre,
          cursosCompartidos: [],
        })
      );
      cursos.forEach((c) => {
        if (c.instructor && c.instructor.id !== usuario.id) {
          const existing = userMap.get(c.instructor.id);
          if (existing) {
            if (!existing.cursosCompartidos.includes(c.titulo)) {
              existing.cursosCompartidos.push(c.titulo);
            }
          } else {
            userMap.set(c.instructor.id, {
              id: c.instructor.id,
              nombre: c.instructor.nombre,
              email: c.instructor.email,
              imagen: c.instructor.imagen,
              rol: c.instructor.rol.nombre,
              cursosCompartidos: [c.titulo],
            });
          }
        }
      });
      classmates.forEach((c) => {
        if (c.usuario) {
          const existing = userMap.get(c.usuario.id);
          const cursoTitulo = c.curso?.titulo || '';
          if (existing) {
            if (cursoTitulo && !existing.cursosCompartidos.includes(cursoTitulo)) {
              existing.cursosCompartidos.push(cursoTitulo);
            }
          } else {
            userMap.set(c.usuario.id, {
              id: c.usuario.id,
              nombre: c.usuario.nombre,
              email: c.usuario.email,
              imagen: c.usuario.imagen,
              rol: c.usuario.rol.nombre,
              cursosCompartidos: cursoTitulo ? [cursoTitulo] : [],
            });
          }
        }
      });

      contactos = Array.from(userMap.values());

      console.log('[contactos] Total contacts for student:', contactos.length);

      // Get student groups
      const studentGroups = await prisma.miembroGrupo.findMany({
        where: { usuarioId: usuario.id },
        include: {
          grupo: {
            select: { id: true, nombre: true, descripcion: true },
          },
        },
      });
      grupos = studentGroups.map((sg) => sg.grupo).filter(Boolean);

      return NextResponse.json({ contactos, grupos, cursosInscritos });
    }

    return NextResponse.json({ contactos, grupos });
  } catch (error) {
    console.error('[GET /api/mensajes/contactos]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
