'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

function InstitutionLogo({ logoUrl, nombre }) {
  const [error, setError] = useState(false);
  return (
    <div className="shrink-0 w-14 h-14 rounded bg-[#DBEAFE] flex items-center justify-center overflow-hidden border border-[#E5E7EB]">
      {logoUrl && !error ? (
        <img
          src={logoUrl}
          alt={nombre}
          className="w-full h-full object-contain p-1 bg-white"
          onError={() => setError(true)}
        />
      ) : (
        <Building2 size={22} className="text-[#1E40AF]" />
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
}

const ESTADO_STYLE = {
  pendiente: { label: 'PENDIENTE', bg: 'bg-[#F59E0B]' },
  en_revision: { label: 'EN REVISIÓN', bg: 'bg-[#F59E0B]' },
  pendiente_informacion: { label: 'INFO PENDIENTE', bg: 'bg-[#F97316]' },
};

export default function InstitucionesAdminClient({ instituciones, solicitudes }) {
  const [tab, setTab] = useState('activas');

  const totalCursos = instituciones.reduce((s, i) => s + i.cursosCount, 0);

  const tabs = [
    { key: 'activas', label: 'Activas', count: instituciones.length },
    { key: 'revision', label: 'En revisión', count: solicitudes.length },
    { key: 'todas', label: 'Todas', count: instituciones.length + solicitudes.length },
  ];

  const items =
    tab === 'activas'
      ? instituciones.map((i) => ({ ...i, _tipo: 'activa' }))
      : tab === 'revision'
        ? solicitudes.map((s) => ({ ...s, nombre: s.nombreLegal, _tipo: 'solicitud' }))
        : [
            ...instituciones.map((i) => ({ ...i, _tipo: 'activa' })),
            ...solicitudes.map((s) => ({ ...s, nombre: s.nombreLegal, _tipo: 'solicitud' })),
          ];

  return (
    <>
      {/* Breadcrumb */}
      <nav className="text-[13px] text-[#6B7280] mb-6">
        <Link href="/dashboard" className="hover:text-[#1E40AF] no-underline">
          Inicio
        </Link>
        <span className="mx-1.5">›</span>
        <span className="font-semibold text-[#111827]">Instituciones</span>
      </nav>

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Building2 size={40} className="text-[#1E40AF]" />
          <div>
            <h1 className="font-bold text-[28px] text-[#111827]">Instituciones</h1>
            <p className="text-[14px] text-[#6B7280] mt-0.5">
              Gestiona las instituciones registradas en la plataforma.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/instituciones/solicitudes"
          className="bg-[#1E40AF] hover:bg-[#1A368F] text-white font-semibold text-[14px] px-5 py-3 rounded no-underline transition-colors whitespace-nowrap"
        >
          + Revisar solicitudes
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'TOTAL ACTIVAS', value: instituciones.length, borderColor: '#1E40AF' },
          { label: 'EN REVISIÓN', value: solicitudes.length, borderColor: '#F59E0B' },
          { label: 'CURSOS PUBLICADOS', value: totalCursos, borderColor: '#1E40AF' },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-[#FBFBFB] border border-[#F3F4F6] rounded p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            style={{ borderBottom: `2px solid ${m.borderColor}` }}
          >
            <p className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
              {m.label}
            </p>
            <p className="font-bold text-[32px] text-[#111827] mt-2 mb-1">
              {m.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative pb-3 mr-8 font-semibold text-[14px] whitespace-nowrap bg-transparent border-0 transition-colors ${
              tab === t.key ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            {t.label}
            <span className="ml-2 bg-[#F3F4F6] text-[#6B7280] text-[11px] font-semibold px-2 py-0.5 rounded">
              {t.count}
            </span>
            {tab === t.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E40AF] rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-24 text-[#6B7280]">
          <Building2 size={48} className="mx-auto mb-4 text-[#D1D5DB]" />
          <p className="font-medium text-[16px]">No hay instituciones en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((inst) => {
            const esSolicitud = inst._tipo === 'solicitud';
            const nombre = esSolicitud ? inst.nombreLegal || inst.nombre : inst.nombre;
            const fecha = esSolicitud ? inst.fechaSolicitud : inst.fechaCreacion;

            return (
              <div
                key={inst.id}
                className="bg-white border border-[#F3F4F6] rounded p-5 flex flex-col"
                style={{ borderBottom: '2px solid #1E40AF' }}
              >
                {/* Top */}
                <div className="flex items-start gap-3">
                  <InstitutionLogo logoUrl={inst.logoUrl} nombre={nombre} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[16px] text-[#111827] truncate">{nombre}</p>
                    <p className="text-[12px] text-[#6B7280] mt-0.5">
                      {inst.nit ? `NIT: ${inst.nit}` : 'Institución registrada'}
                    </p>
                    {esSolicitud ? (
                      <span
                        className={`inline-block mt-1.5 text-white text-[10px] font-semibold px-2 py-0.5 rounded ${
                          ESTADO_STYLE[inst.estado]?.bg || 'bg-[#F59E0B]'
                        }`}
                      >
                        {ESTADO_STYLE[inst.estado]?.label || 'EN REVISIÓN'}
                      </span>
                    ) : (
                      <span className="inline-block mt-1.5 bg-[#10B981] text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        ACTIVA
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics — solo instituciones activas */}
                {!esSolicitud && (
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-[#F3F4F6]">
                    <div>
                      <p className="font-bold text-[18px] text-[#1E40AF]">{inst.cursosCount}</p>
                      <p className="text-[11px] text-[#6B7280] uppercase tracking-wide">Cursos</p>
                    </div>
                    <div>
                      <p className="font-bold text-[18px] text-[#1E40AF]">
                        {(inst.alumnosCount || 0).toLocaleString('es-CO')}
                      </p>
                      <p className="text-[11px] text-[#6B7280] uppercase tracking-wide">Alumnos</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F3F4F6] mt-4">
                  <span className="text-[11px] text-[#9CA3AF]">Desde {formatDate(fecha)}</span>
                  <div className="flex items-center gap-3">
                    {!esSolicitud && (inst.slug || inst.id) && (
                      <Link
                        href={`/instituciones/${inst.slug || inst.id}`}
                        className="text-[13px] font-medium text-[#1E40AF] hover:underline no-underline"
                        target="_blank"
                      >
                        Ver página
                      </Link>
                    )}
                    <Link
                      href={
                        esSolicitud
                          ? `/dashboard/instituciones/solicitudes/${inst.id}`
                          : `/dashboard/instituciones/solicitudes`
                      }
                      className="border border-[#D1D5DB] text-[#374151] hover:bg-[#F9FAFB] font-semibold text-[12px] px-3 py-1.5 rounded no-underline transition-colors"
                    >
                      {esSolicitud ? 'Revisar' : 'Gestionar'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
