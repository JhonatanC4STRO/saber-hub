import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// Mapeo de categorías a palabras clave de áreas de conocimiento
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  programación: ['desarrollo', 'software', 'programación', 'web', 'frontend', 'backend', 'fullstack', 'javascript', 'python', 'java', 'código'],
  desarrollo: ['desarrollo', 'software', 'programación', 'web', 'frontend', 'backend', 'fullstack', 'aplicaciones'],
  'inteligencia artificial': ['inteligencia artificial', 'datos', 'machine learning', 'ciencia de datos', 'deep learning', 'ia', 'analytics', 'big data'],
  datos: ['datos', 'data', 'analytics', 'big data', 'ciencia de datos', 'estadística', 'base de datos', 'sql'],
  ciberseguridad: ['seguridad', 'ciberseguridad', 'hacking', 'ethical hacking', 'forense', 'pentesting', 'defensa', 'amenazas'],
  seguridad: ['seguridad', 'ciberseguridad', 'hacking', 'defensa', 'amenazas', 'protección'],
  redes: ['redes', 'telecomunicaciones', 'infraestructura', 'networking', 'cisco', 'tcp/ip', 'comunicaciones'],
  diseño: ['diseño', 'ux', 'ui', 'gráfico', 'figma', 'photoshop', 'ilustración', 'experiencia de usuario'],
  marketing: ['marketing', 'digital', 'seo', 'publicidad', 'redes sociales', 'community', 'contenido'],
  negocios: ['negocios', 'administración', 'gestión', 'emprendimiento', 'finanzas', 'liderazgo', 'proyecto'],
  'cloud computing': ['cloud', 'nube', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'infraestructura'],
};

function getKeywordsForCategory(categoryName: string): string[] {
  const normalized = categoryName.toLowerCase().trim();
  
  // Búsqueda directa
  if (CATEGORY_KEYWORDS[normalized]) {
    return CATEGORY_KEYWORDS[normalized];
  }
  
  // Búsqueda parcial
  for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return keywords;
    }
  }
  
  // Fallback: usar el nombre de la categoría como keyword
  return [normalized];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const cursoId = searchParams.get('cursoId');
    const limit = Math.min(6, Math.max(1, parseInt(searchParams.get('limit') || '3', 10)));

    // Obtener usuario autenticado (opcional)
    let usuarioId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      if (token) {
        const usuario = await verifyToken(token);
        usuarioId = usuario?.id ? String(usuario.id) : null;
      }
    } catch {
      // No autenticado, OK
    }

    let keywords: string[] = [];

    // Si se proporciona cursoId, buscar por categoría del curso
    if (cursoId) {
      const curso = await prisma.curso.findUnique({
        where: { id: cursoId },
        select: {
          categoriaId: true,
          categoria: { select: { nombre: true } },
          titulo: true,
          nivel: true,
        },
      });

      if (curso?.categoria?.nombre) {
        keywords = getKeywordsForCategory(curso.categoria.nombre);
      }
      
      // Agregar palabras del título como keywords adicionales
      if (curso?.titulo) {
        const titleWords = curso.titulo.toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 3);
        keywords = [...new Set([...keywords, ...titleWords])];
      }
    } else if (usuarioId) {
      // Sin cursoId: recomendar basándose en historial del usuario
      const inscripciones = await prisma.inscripcion.findMany({
        where: { usuarioId, estado: { in: ['activo', 'finalizado'] } },
        select: {
          curso: {
            select: {
              categoria: { select: { nombre: true } },
            },
          },
        },
        take: 10,
        orderBy: { fechaInscripcion: 'desc' },
      });

      const categorias = inscripciones
        .map((i) => i.curso?.categoria?.nombre)
        .filter(Boolean) as string[];

      for (const cat of categorias) {
        keywords = [...new Set([...keywords, ...getKeywordsForCategory(cat)])];
      }
    }

    // IDs de cursos ya clickeados por el usuario (para excluir)
    let clickedIds: string[] = [];
    if (usuarioId) {
      const clicked = await prisma.logClickExterno.findMany({
        where: { usuarioId },
        select: { cursoExternoId: true },
        take: 50,
        orderBy: { creadoEn: 'desc' },
      });
      clickedIds = clicked.map((c) => c.cursoExternoId);
    }

    // Construir query base
    const baseWhere = {
      estaActivo: true,
      estado: 'aprobado' as const,
      esComplementario: true,
      ...(clickedIds.length > 0 && { id: { notIn: clickedIds } }),
    };

    let complementarios: any[] = [];

    // Estrategia 1: Buscar por keywords en areaConocimiento
    if (keywords.length > 0) {
      const orConditions = keywords.map((kw) => ({
        areaConocimiento: { contains: kw, mode: 'insensitive' as const },
      }));

      complementarios = await prisma.cursoExterno.findMany({
        where: {
          ...baseWhere,
          OR: orConditions,
        },
        select: {
          id: true,
          titulo: true,
          fuenteNombre: true,
          fuenteUrl: true,
          imagenUrl: true,
          duracionHoras: true,
          nivel: true,
          areaConocimiento: true,
          modalidad: true,
          institucion: {
            select: { nombre: true, logoUrl: true },
          },
        },
        orderBy: { creadoEn: 'desc' },
        take: limit,
      });
    }

    // Estrategia 2: Fallback - si no hay suficientes, completar con los más recientes
    if (complementarios.length < limit) {
      const existingIds = complementarios.map((c) => c.id);
      const fallback = await prisma.cursoExterno.findMany({
        where: {
          ...baseWhere,
          id: { notIn: [...existingIds, ...clickedIds] },
        },
        select: {
          id: true,
          titulo: true,
          fuenteNombre: true,
          fuenteUrl: true,
          imagenUrl: true,
          duracionHoras: true,
          nivel: true,
          areaConocimiento: true,
          modalidad: true,
          institucion: {
            select: { nombre: true, logoUrl: true },
          },
        },
        orderBy: { creadoEn: 'desc' },
        take: limit - complementarios.length,
      });

      complementarios = [...complementarios, ...fallback];
    }

    return NextResponse.json({ complementarios });
  } catch (err) {
    console.error('Error en cursos complementarios:', err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
