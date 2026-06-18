import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

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

export async function GET(request) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const rutas = await prisma.rutaFormacion.findMany({
      include: {
        creador: {
          select: {
            nombre: true,
            email: true,
          },
        },
        cursos: {
          orderBy: { orden: 'asc' },
          include: {
            curso: {
              select: {
                id: true,
                titulo: true,
                descripcion: true,
                imgPortada: true,
              },
            },
          },
        },
        _count: {
          select: {
            certificados: true,
          },
        },
      },
      orderBy: { creado: 'desc' },
    });

    return NextResponse.json({ rutas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener rutas de formación' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await authorize(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { nombre, descripcion, imgPortada, lineal = true, cursos = [] } = body;

    if (!nombre) {
      return NextResponse.json({ message: 'El nombre es obligatorio' }, { status: 400 });
    }

    // Usar transacción para crear la ruta y opcionalmente sus cursos secuenciados
    const nuevaRuta = await prisma.$transaction(async (tx) => {
      const ruta = await tx.rutaFormacion.create({
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion ? descripcion.trim() : null,
          imgPortada: imgPortada ? imgPortada.trim() : null,
          lineal: Boolean(lineal),
          creadorId: auth.payload.id,
        },
      });

      if (cursos && cursos.length > 0) {
        // cursos es un arreglo de ids de cursos en orden
        await tx.cursoRuta.createMany({
          data: cursos.map((cursoId, index) => ({
            rutaId: ruta.id,
            cursoId,
            orden: index + 1,
          })),
        });
      }

      return ruta;
    });

    // Log de auditoría
    try {
      await prisma.logAuditoria.create({
        data: {
          usuarioId: auth.payload.id,
          accion: 'CREAR_RUTA_FORMACION',
          tabla: 'rutas_formacion',
          registroId: nuevaRuta.id,
          datosDespues: JSON.stringify(nuevaRuta),
          ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });
    } catch (err) {
      console.error('Error al guardar log de auditoría:', err);
    }

    return NextResponse.json(
      { message: 'Ruta de formación creada exitosamente', ruta: nuevaRuta },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear la ruta de formación' }, { status: 500 });
  }
}
