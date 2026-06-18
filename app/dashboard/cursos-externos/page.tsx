import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';
import CursosExternosPanel from '@/components/admin/CursosExternosPanel';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Revisión de Cursos Externos | SABERHUB Admin',
};

export default async function CursosExternosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuario = await verifyToken(token ?? '');

  if (!usuario || usuario.rol !== 'admin') redirect('/login');

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      <HeaderAdmin usuario={usuario} />
      <main className="max-w-[1440px] mx-auto px-6 md:px-8 pt-10 pb-20">
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-[#1E40AF] uppercase tracking-wider mb-1">
            Administración · Importaciones
          </p>
          <h1 className="text-[26px] font-bold text-[#111827]">Revisión de cursos externos</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Revisa, aprueba, edita o rechaza los cursos importados por los scrapers antes de publicarlos en el catálogo.
          </p>
        </div>

        <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <CursosExternosPanel />
        </div>
      </main>
      <FooterAdmin />
    </div>
  );
}
