import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';
import InstitucionesAdminClient from './components/InstitucionesAdminClient';

export const metadata = {
  title: 'Instituciones | SABERHUB Admin',
};

export default async function InstitucionesAdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuario = await verifyToken(token);

  if (!usuario || usuario.rol !== 'admin') redirect('/dashboard');

  const [instituciones, solicitudes] = await Promise.all([
    prisma.institucion.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        logoUrl: true,
        slug: true,
        nit: true,
        fechaCreacion: true,
        cursos: {
          where: { estado: 'publicado' },
          select: {
            _count: { select: { inscripciones: true } },
          },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    }),
    prisma.solicitudInstitucion.findMany({
      where: {
        estado: { in: ['pendiente', 'en_revision', 'pendiente_informacion'] },
      },
      select: {
        id: true,
        nombreLegal: true,
        nit: true,
        descripcion: true,
        logoUrl: true,
        estado: true,
        fechaSolicitud: true,
      },
      orderBy: { fechaSolicitud: 'desc' },
    }),
  ]);

  const institucionesProcesadas = instituciones.map((inst) => ({
    id: inst.id,
    nombre: inst.nombre,
    descripcion: inst.descripcion,
    logoUrl: inst.logoUrl,
    slug: inst.slug,
    nit: inst.nit,
    fechaCreacion: inst.fechaCreacion?.toISOString() ?? null,
    cursosCount: inst.cursos.length,
    alumnosCount: inst.cursos.reduce((s, c) => s + (c._count?.inscripciones || 0), 0),
  }));

  const solicitudesProcesadas = solicitudes.map((s) => ({
    id: s.id,
    nombreLegal: s.nombreLegal,
    nit: s.nit,
    descripcion: s.descripcion,
    logoUrl: s.logoUrl,
    estado: s.estado,
    fechaSolicitud: s.fechaSolicitud?.toISOString() ?? null,
  }));

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      <HeaderAdmin usuario={usuario} />
      <main className="max-w-[1440px] mx-auto px-6 md:px-8 pt-8 pb-20">
        <InstitucionesAdminClient
          instituciones={institucionesProcesadas}
          solicitudes={solicitudesProcesadas}
        />
      </main>
      <FooterAdmin />
    </div>
  );
}
