import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

const IMAGENES_CATEGORIA: Record<string, string> = {
  ciberseguridad: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60',
  programacion: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&auto=format&fit=crop&q=60',
  inteligencia_artificial: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=60',
  redes: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=60',
  datos: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
  marketing: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
  diseno: 'https://images.unsplash.com/photo-1561070791-26c113006238?w=800&auto=format&fit=crop&q=60',
  habilidades: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60',
  default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'
};

function obtenerImagenPredeterminada(titulo: string, areaConocimiento?: string | null): string {
  const texto = `${titulo} ${areaConocimiento || ''}`.toLowerCase();
  
  if (texto.includes('ciber') || texto.includes('seguridad') || texto.includes('hacking') || texto.includes('firewall')) {
    return IMAGENES_CATEGORIA.ciberseguridad;
  }
  if (texto.includes('program') || texto.includes('desarrollo') || texto.includes('software') || texto.includes('web') || texto.includes('python') || texto.includes('codigo') || texto.includes('código') || texto.includes('javascript') || texto.includes('java') || texto.includes('html') || texto.includes('css')) {
    return IMAGENES_CATEGORIA.programacion;
  }
  if (texto.includes('intel') || texto.includes('artificial') || texto.includes('ia') || texto.includes('ai') || texto.includes('aprendizaje') || texto.includes('machine') || texto.includes('deep') || texto.includes('gpt')) {
    return IMAGENES_CATEGORIA.inteligencia_artificial;
  }
  if (texto.includes('redes') || texto.includes('telecom') || texto.includes('cisco') || texto.includes('routing')) {
    return IMAGENES_CATEGORIA.redes;
  }
  if (texto.includes('dat') || texto.includes('analit') || texto.includes('cienc') || texto.includes('excel') || texto.includes('sql') || texto.includes('db') || texto.includes('data')) {
    return IMAGENES_CATEGORIA.datos;
  }
  if (texto.includes('market') || texto.includes('ventas') || texto.includes('comerc') || texto.includes('digital') || texto.includes('publicidad')) {
    return IMAGENES_CATEGORIA.marketing;
  }
  if (texto.includes('dise') || texto.includes('ux') || texto.includes('ui') || texto.includes('grafic') || texto.includes('figma') || texto.includes('web design')) {
    return IMAGENES_CATEGORIA.diseno;
  }
  if (texto.includes('habil') || texto.includes('profes') || texto.includes('lider') || texto.includes('comunic') || texto.includes('trabajo') || texto.includes('personal') || texto.includes('blanda')) {
    return IMAGENES_CATEGORIA.habilidades;
  }
  
  return IMAGENES_CATEGORIA.default;
}


async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (payload?.rol !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

// GET /api/admin/cursos-externos/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const curso = await prisma.cursoExterno.findUnique({
    where: { id },
    include: {
      institucion: { select: { id: true, nombre: true, logoUrl: true, url: true } },
      curso: { select: { id: true, titulo: true, estado: true } },
    },
  });
  if (!curso) return NextResponse.json({ message: 'No encontrado' }, { status: 404 });

  // Cursos similares (mismo área, estado publicado)
  const similares = await prisma.curso.findMany({
    where: {
      estado: 'publicado',
      OR: [
        { titulo: { contains: curso.titulo.split(' ').slice(0, 3).join(' '), mode: 'insensitive' } },
      ],
    },
    select: { id: true, titulo: true, descripcion: true, imgPortada: true },
    take: 3,
  });

  return NextResponse.json({ curso, similares });
}

// PATCH /api/admin/cursos-externos/[id]
// Body: { accion: 'aprobar' | 'rechazar' | 'editar', motivoRechazo?, campos? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { accion, motivoRechazo, campos } = body;

  const existente = await prisma.cursoExterno.findUnique({ where: { id } });
  if (!existente) return NextResponse.json({ message: 'No encontrado' }, { status: 404 });

  if (accion === 'rechazar') {
    if (!motivoRechazo?.trim()) {
      return NextResponse.json({ message: 'Se requiere motivo de rechazo' }, { status: 400 });
    }
    const updated = await prisma.cursoExterno.update({
      where: { id },
      data: {
        estado: 'rechazado',
        estaActivo: false,
        motivoRechazo: motivoRechazo.trim(),
        revisadoPorId: admin.id as string,
        revisadoEn: new Date(),
      },
    });
    return NextResponse.json({ ok: true, curso: updated });
  }

  if (accion === 'aprobar' || accion === 'aprobar_con_ediciones') {
    // Merge edited fields if provided
    const datosFinales: Record<string, any> = {
      titulo: campos?.titulo ?? existente.titulo,
      descripcion: campos?.descripcion ?? existente.descripcion,
      nivel: campos?.nivel ?? existente.nivel,
      duracionHoras: campos?.duracionHoras ?? existente.duracionHoras,
      areaConocimiento: campos?.areaConocimiento ?? existente.areaConocimiento,
      imagenUrl: campos?.imagenUrl ?? existente.imagenUrl,
    };

    // Si no tiene imagen asignada, colocar automáticamente una ilustrativa premium por categoría
    if (!datosFinales.imagenUrl || datosFinales.imagenUrl.trim() === '') {
      datosFinales.imagenUrl = obtenerImagenPredeterminada(datosFinales.titulo, datosFinales.areaConocimiento);
    }

    // Create Curso record (RF-03)
    const nuevoCurso = await prisma.curso.create({
      data: {
        titulo: datosFinales.titulo,
        descripcion: datosFinales.descripcion,
        imgPortada: datosFinales.imagenUrl,
        nivel: datosFinales.nivel,
        estado: 'publicado',
        instructorId: admin.id as string,
        institucionId: existente.institucionId,
      },
    });

    // Update CursoExterno
    const updated = await prisma.cursoExterno.update({
      where: { id },
      data: {
        ...datosFinales,
        estado: 'aprobado',
        estaActivo: true,
        cursoId: nuevoCurso.id,
        revisadoPorId: admin.id,
        revisadoEn: new Date(),
      } as any,
    });

    // Create a Notificacion record for the admin (RF-03)
    try {
      await prisma.notificacion.create({
        data: {
          usuarioId: admin.id as string,
          tipo: 'sistema',
          titulo: 'Curso externo aprobado',
          contenido: `El curso externo "${datosFinales.titulo}" ha sido aprobado con éxito y ya está visible en el catálogo.`,
          urlDestino: '/admin/cursos-externos',
        },
      });
    } catch (err) {
      console.error('Error al crear notificación de aprobación:', err);
    }

    return NextResponse.json({ ok: true, curso: updated, cursoCreado: nuevoCurso });
  }

  if (accion === 'editar') {
    const updated = await prisma.cursoExterno.update({
      where: { id },
      data: {
        titulo: campos?.titulo ?? existente.titulo,
        descripcion: campos?.descripcion ?? existente.descripcion,
        nivel: campos?.nivel ?? existente.nivel,
        duracionHoras: campos?.duracionHoras ?? existente.duracionHoras,
        areaConocimiento: campos?.areaConocimiento ?? existente.areaConocimiento,
        imagenUrl: campos?.imagenUrl ?? existente.imagenUrl,
      } as any,
    });
    return NextResponse.json({ ok: true, curso: updated });
  }

  return NextResponse.json({ message: 'Acción inválida' }, { status: 400 });
}

// DELETE /api/admin/cursos-externos/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  try {
    // Delete the external course
    await prisma.cursoExterno.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: 'Curso externo eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar curso externo:', error);
    return NextResponse.json({ message: 'Error al eliminar el curso' }, { status: 500 });
  }
}
