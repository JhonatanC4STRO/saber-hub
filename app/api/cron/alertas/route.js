import { NextResponse } from 'next/server';
import { ejecutarEscaneoAlertas } from '@/lib/alertas';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const logs = await ejecutarEscaneoAlertas();
    
    // Publish scheduled announcements
    const avisosPublicadosCount = await publicarAvisosProgramados();

    return NextResponse.json({
      success: true,
      message: 'Escaneo de alertas y publicación de anuncios programados completado con éxito.',
      avisosPublicados: avisosPublicadosCount,
      ...logs,
    });
  } catch (error) {
    console.error('Error en GET /api/cron/alertas:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Ocurrió un error al procesar las alertas y anuncios.',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

async function publicarAvisosProgramados() {
  try {
    const now = new Date();
    const pending = await prisma.avisoGrupo.findMany({
      where: {
        publicado: false,
        fechaProgramada: { lte: now }
      },
      include: {
        autor: { select: { nombre: true } }
      }
    });

    let count = 0;
    const { enviarNotificacionConfigurada } = await import('@/lib/notificaciones');

    for (const aviso of pending) {
      await prisma.avisoGrupo.update({
        where: { id: aviso.id },
        data: { publicado: true }
      });
      count++;

      // Send notifications to group members
      try {
        const grupo = await prisma.grupo.findUnique({
          where: { id: aviso.grupoId },
          include: { miembros: { include: { usuario: true } } }
        });

        if (grupo) {
          for (const miembro of grupo.miembros) {
            const emailHtml = `
              <div style="font-family: 'Inter', sans-serif; padding: 40px 20px; background-color: #F9FAFB;">
                <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                  <div style="background-color: #1E40AF; padding: 30px; text-align: center;">
                    <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">SABERHUB</h1>
                    <p style="color: #E0E7FF; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Anuncio de la Cohorte</p>
                  </div>
                  <div style="padding: 40px 30px;">
                    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">¡Hola, ${miembro.usuario.nombre}! 👋</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin-bottom: 24px;">
                      Tu instructor <strong>${aviso.autor.nombre}</strong> ha publicado un anuncio oficial en la cohorte <strong>"${grupo.nombre}"</strong>.
                    </p>
                    <div style="background-color: #F8FAFC; border-left: 4px solid #1E40AF; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
                      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0F172A;">${aviso.titulo}</h3>
                      <p style="margin: 0; font-size: 14.5px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${aviso.contenido}</p>
                    </div>
                    <div style="text-align: center;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/grupos/workspace/${aviso.grupoId}" target="_blank" style="background-color: #1E40AF; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 6px; text-decoration: none; display: inline-block;">
                        Acceder a la Cohorte &rarr;
                      </a>
                    </div>
                  </div>
                  <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF;">
                    Recibes esto porque eres miembro de esta cohorte. © 2026 SABERHUB. Todos los derechos reservados.
                  </div>
                </div>
              </div>
            `;

            await enviarNotificacionConfigurada({
              usuarioId: miembro.usuario.id,
              tipo: 'sistema',
              titulo: `📢 Anuncio en cohorte: "${aviso.titulo}"`,
              contenido: `Se publicó un nuevo anuncio en la cohorte "${grupo.nombre}".`,
              urlDestino: `/dashboard/grupos/workspace/${aviso.grupoId}`,
              plantillaHtml: emailHtml
            });
          }
        }
      } catch (err) {
        console.error('Error notifying members in cron for aviso ID:', aviso.id, err);
      }
    }
    return count;
  } catch (error) {
    console.error('Error running publicarAvisosProgramados:', error);
    return 0;
  }
}
