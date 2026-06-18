import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Historial de Importaciones | SABERHUB Admin',
};

export default async function LogsScrapingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuario = await verifyToken(token ?? '');

  if (!usuario || usuario.rol !== 'admin') redirect('/login');

  const logs = await prisma.logScraping.findMany({
    orderBy: { fechaEjecucion: 'desc' },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      <HeaderAdmin usuario={usuario} />
      <main className="max-w-[1440px] mx-auto px-6 md:px-8 pt-10 pb-20">
        <div className="mb-6">
          <Link
            href="/dashboard/cursos-externos"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1E40AF] hover:underline no-underline mb-3"
          >
            <ArrowLeft size={15} /> Volver al panel
          </Link>
          <p className="text-[11px] font-semibold text-[#1E40AF] uppercase tracking-wider mb-1">
            Administración · Importaciones
          </p>
          <h1 className="text-[26px] font-bold text-[#111827]">Historial de importaciones</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Registro de cada ejecución de scrapers. Últimas 50 ejecuciones.
          </p>
        </div>

        <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] text-[14px]">
              No hay registros de ejecución todavía.
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  {['Fecha', 'Fuente', 'Encontrados', 'Nuevos', 'Actualizados', 'Errores', 'Duración', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-[12px] text-[#6B7280] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 text-[#374151] whitespace-nowrap">
                      {new Date(log.fechaEjecucion).toLocaleString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-[#1E40AF] text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                        {log.fuente}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{log.cursosEncontrados}</td>
                    <td className="px-4 py-3 text-center font-mono text-green-600 font-semibold">{log.cursosNuevos}</td>
                    <td className="px-4 py-3 text-center font-mono text-blue-600">{log.cursosActualizados}</td>
                    <td className="px-4 py-3 text-center">
                      {log.errores > 0 ? (
                        <span className="text-red-600 font-semibold">{log.errores}</span>
                      ) : (
                        <span className="text-[#9CA3AF]">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">
                      {log.duracionMs ? `${Math.round(log.duracionMs / 1000)}s` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {log.exitoso ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                          ✓ Exitoso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                          ✗ Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Error details expandable section */}
          {logs.some((l) => l.detalleErrores) && (
            <div className="border-t border-[#F3F4F6] p-6">
              <h3 className="font-bold text-[14px] text-[#111827] mb-4">Detalle de errores</h3>
              <div className="space-y-3">
                {logs.filter((l) => l.detalleErrores).map((log) => (
                  <details key={log.id} className="border border-red-200 rounded-lg overflow-hidden">
                    <summary className="px-4 py-2.5 bg-red-50 cursor-pointer text-[12px] font-semibold text-red-700 list-none flex items-center justify-between">
                      <span>
                        {new Date(log.fechaEjecucion).toLocaleString('es-CO')} — {log.fuente} — {log.errores} errores
                      </span>
                      <span className="text-[11px]">▼</span>
                    </summary>
                    <pre className="p-4 bg-white text-[11px] text-[#374151] overflow-x-auto whitespace-pre-wrap font-mono">
                      {log.detalleErrores}
                    </pre>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <FooterAdmin />
    </div>
  );
}
