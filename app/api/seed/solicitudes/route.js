import prisma from '@/lib/prisma';

export async function GET() {
  // ⚠️ SOLO PARA DESARROLLO. Elimina después.
  try {
    const usuarios = await prisma.usuario.findMany({
      where: {
        rol: {
          nombre: 'estudiante',
        },
      },
      take: 5,
    });

    if (usuarios.length === 0) {
      return new Response(JSON.stringify({ error: 'Sin usuarios estudiantes' }), { status: 400 });
    }

    const estados = ['pendiente', 'en_revision', 'aprobada', 'rechazada'];
    const solicitudes = [];

    for (let i = 0; i < Math.min(usuarios.length, 5); i++) {
      const estado = estados[i % estados.length];
      const diasAtras = Math.floor(Math.random() * 30);

      const sol = await prisma.solicitudInstructor.create({
        data: {
          usuarioId: usuarios[i].id,
          estado,
          experiencia: `Tengo ${3 + i} años de experiencia en desarrollo web, python y diseño. Quiero compartir mis conocimientos con nuevos estudiantes.`,
          urlCurriculum: `https://drive.google.com/file/d/curriculum-${i}`,
          fechaSolicitud: new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000),
          motivoRechazo:
            estado === 'rechazada' ? 'Falta documentación de certificados profesionales.' : null,
        },
      });
      solicitudes.push(sol);
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: solicitudes.length,
        usuarios: usuarios.map((u) => u.nombre),
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
