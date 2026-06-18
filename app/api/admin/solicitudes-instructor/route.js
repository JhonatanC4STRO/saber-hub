import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const usuario = await verifyToken(token);

    if (usuario.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const estado = searchParams.get('estado');
    const busqueda = searchParams.get('busqueda');

    const whereClause = {};
    if (estado) whereClause.estado = estado;

    let solicitudes = await prisma.solicitudInstructor.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: { id: true, nombre: true, email: true, documento: true, fechaRegistro: true },
        },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });

    if (busqueda) {
      solicitudes = solicitudes.filter(
        (s) =>
          s.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
          s.usuario?.email?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    const conteos = {
      pendiente: await prisma.solicitudInstructor.count({ where: { estado: 'pendiente' } }),
      en_revision: await prisma.solicitudInstructor.count({ where: { estado: 'en_revision' } }),
      aprobada: await prisma.solicitudInstructor.count({ where: { estado: 'aprobada' } }),
      rechazada: await prisma.solicitudInstructor.count({ where: { estado: 'rechazada' } }),
    };

    return new Response(JSON.stringify({ solicitudes, conteos }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
