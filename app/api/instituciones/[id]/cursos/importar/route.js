import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

const IMAGENES_CATEGORIA = {
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

function obtenerImagenPredeterminada(titulo, areaConocimiento) {
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


export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id: institucionId } = await params;

    // Verificar que la institución existe y el usuario es su admin
    const institucion = await prisma.institucion.findUnique({
      where: { id: institucionId },
      include: { admin: true },
    });

    if (!institucion) {
      return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 });
    }

    // Permitir si es el admin de la institución o el super administrador global
    if (payload.rol !== 'admin' && (!institucion.admin || institucion.admin.id !== payload.id)) {
      return NextResponse.json({ error: 'No tienes permiso para importar cursos en esta institución' }, { status: 403 });
    }

    const body = await request.json();
    const { cursos } = body;

    if (!cursos || !Array.isArray(cursos) || cursos.length === 0) {
      return NextResponse.json({ error: 'El formato de los cursos es inválido o el arreglo está vacío' }, { status: 400 });
    }

    // Validar campos requeridos mínimos
    const cursosValidos = cursos.filter(c => c.titulo && c.titulo.trim() !== '' && c.fuenteUrl && c.fuenteUrl.trim() !== '');
    if (cursosValidos.length === 0) {
      return NextResponse.json({ error: 'Ningún curso tiene los campos mínimos requeridos (titulo y fuenteUrl)' }, { status: 400 });
    }

    // Insertar cursos en CursoExterno en lote
    const result = await prisma.cursoExterno.createMany({
      data: cursosValidos.map((c) => {
        const cover = c.imagenUrl && c.imagenUrl.trim() !== '' ? c.imagenUrl : obtenerImagenPredeterminada(c.titulo, c.nivel);
        return {
          titulo: c.titulo.trim(),
          descripcion: c.descripcion?.trim() || null,
          fuenteUrl: c.fuenteUrl.trim(),
          fuenteNombre: institucion.nombre,
          codigoExterno: c.codigoExterno?.trim() || `EXT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          duracionHoras: c.duracionHoras ? parseInt(c.duracionHoras) : null,
          nivel: c.nivel?.trim() || 'General',
          modalidad: c.modalidad?.trim() || 'Virtual',
          estado: 'aprobado', // Se aprueba automáticamente al ser importado por el admin
          institucionId: institucionId,
          imagenUrl: cover,
        };
      }),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: 'Importación completada con éxito',
      registrados: result.count,
      totalProcesados: cursosValidos.length
    });
  } catch (error) {
    console.error('[POST /api/instituciones/[id]/cursos/importar]', error);
    return NextResponse.json({ error: 'Error interno al importar los cursos' }, { status: 500 });
  }
}
