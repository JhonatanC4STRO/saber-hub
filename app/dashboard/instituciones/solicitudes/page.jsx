import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import Link from 'next/link';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';
import SolicitudesInstituciones from '@/components/admin/SolicitudesInstituciones';

export default async function SolicitudesInstitucionesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuario = await verifyToken(token);

  if (!usuario || usuario.rol !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-600 text-3xl mb-5 shadow-[0_4px_10px_rgba(239,68,68,0.1)]">
          ⚠️
        </div>
        <h2 className="text-[24px] font-extrabold text-[#111827] tracking-tight">Acceso Denegado</h2>
        <p className="text-[#6B7280] mt-3 text-[14px] leading-relaxed max-w-md">
          No tienes permisos para gestionar solicitudes de instituciones. Esta sección está reservada exclusivamente para los administradores globales de la plataforma.
        </p>
        <Link 
          href="/dashboard" 
          className="mt-8 inline-flex items-center justify-center bg-[#1E40AF] text-[#FFFFFF] text-[14px] font-semibold h-11 px-6 rounded-lg hover:bg-blue-800 shadow-[0_4px_12px_rgba(30,64,175,0.15)] transition-all"
        >
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans">
      <HeaderAdmin usuario={usuario} />
      <main className="max-w-[1440px] mx-auto px-6 md:px-8 pt-10 pb-20">
        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-[#111827]">Solicitudes de instituciones</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Revisa, aprueba o rechaza las solicitudes de registro de instituciones en SABERHUB.
          </p>
        </div>
        <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <SolicitudesInstituciones />
        </div>
      </main>
      <FooterAdmin />
    </div>
  );
}
