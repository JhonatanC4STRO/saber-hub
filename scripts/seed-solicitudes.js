const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    // Obtener usuarios estudiantes para crear solicitudes
    const usuarios = await prisma.usuario.findMany({
      where: {
        rol: {
          nombre: 'estudiante',
        },
      },
      take: 5,
    });

    if (usuarios.length === 0) {
      console.log('No hay usuarios estudiantes en la BD.');
      return;
    }

    const solicitudes = [];
    const estados = ['pendiente', 'en_revision', 'aprobada', 'rechazada'];

    for (let i = 0; i < Math.min(usuarios.length, 5); i++) {
      const estado = estados[i % estados.length];
      const diasAtras = Math.floor(Math.random() * 30);

      const sol = await prisma.solicitudInstructor.create({
        data: {
          usuarioId: usuarios[i].id,
          estado,
          experiencia: `Tengo ${3 + i} años de experiencia en desarrollo web, python y diseño. Quiero compartir mis conocimientos con nuevos estudiantes que desean aprender programación desde cero.`,
          urlCurriculum: `https://drive.google.com/file/d/curriculum-${i}`,
          fechaSolicitud: new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000),
          motivoRechazo:
            estado === 'rechazada' ? 'Falta documentación de certificados profesionales.' : null,
        },
      });
      solicitudes.push(sol);
    }

    console.log(`✅ Creadas ${solicitudes.length} solicitudes de instructor`);
    solicitudes.forEach((s, idx) => {
      console.log(`  - ${usuarios[idx].nombre}: ${s.estado}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
