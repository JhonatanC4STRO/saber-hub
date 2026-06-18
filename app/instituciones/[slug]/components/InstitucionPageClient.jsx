'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  ExternalLink,
  Globe,
  Phone,
  Mail,
  Building2,
  Play,
  ChevronRight,
  Calendar,
  Clock,
  Hash,
} from 'lucide-react';

/* ─── Logo con fallback ─── */
function InstitutionLogo({ logoUrl, nombre, size = 80 }) {
  const [error, setError] = useState(false);
  const initials = (nombre || '??').substring(0, 2).toUpperCase();
  return (
    <div
      className="shrink-0 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-white/20 shadow"
      style={{ width: size, height: size }}
    >
      {logoUrl && !error ? (
        <img
          src={logoUrl}
          alt={nombre}
          className="w-full h-full object-contain p-2"
          onError={() => setError(true)}
        />
      ) : (
        <span className="font-extrabold text-[#1E40AF] text-2xl select-none">{initials}</span>
      )}
    </div>
  );
}

/* ─── Card de curso estilo Cisco ─── */
function CursoCard({ curso, loggedIn }) {
  const href = curso.isExterno ? curso.fuenteUrl : `/cursos/${curso.id}`;
  const isExternal = curso.isExterno;

  return (
    <div
      className="bg-white border border-[#F3F4F6] rounded relative overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-[2px]"
      style={{ borderBottom: '2px solid #1E40AF' }}
    >
      {/* Imagen */}
      <div className="relative aspect-video w-full bg-[#E5E7EB] flex-shrink-0 overflow-hidden">
        {curso.imgPortada ? (
          <img
            src={curso.imgPortada}
            alt={curso.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#DBEAFE] flex items-center justify-center">
            <BookOpen size={40} className="text-[#93C5FD]" />
          </div>
        )}
        {/* Badge nivel */}
        <span className="absolute top-3 left-3 bg-[#1E40AF] text-white font-semibold text-[11px] px-3 py-1 rounded">
          {curso.nivel?.toUpperCase() || 'GENERAL'}
        </span>
        {/* Play / external button */}
        {isExternal ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <ExternalLink size={20} className="text-[#111827]" />
          </a>
        ) : (
          <Link
            href={href}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[52px] rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <Play size={20} className="text-[#111827] ml-1" fill="#111827" />
          </Link>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[13px]">🏛</span>
          <span className="font-medium text-[13px] text-[#374151] truncate">
            {isExternal ? curso.fuenteNombre || 'Externo' : 'SABERHUB'}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} className="text-[#4B5563]" />
            <span className="font-medium text-[13px] text-[#4B5563]">
              {curso.categoriaNombre}
            </span>
          </div>
        </div>

        {isExternal ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="no-underline">
            <h3 className="font-bold text-[15px] text-[#111827] leading-snug line-clamp-2 mb-1 hover:text-[#1E40AF] transition-colors">
              {curso.titulo}
            </h3>
          </a>
        ) : (
          <Link href={href} className="no-underline">
            <h3 className="font-bold text-[15px] text-[#111827] leading-snug line-clamp-2 mb-1 hover:text-[#1E40AF] transition-colors">
              {curso.titulo}
            </h3>
          </Link>
        )}

        <p className="text-[13px] text-[#4B5563] leading-relaxed line-clamp-2 mb-3 flex-1">
          {curso.descripcion || 'Explora este curso en SABERHUB.'}
        </p>

        <div className="mt-auto flex items-center gap-3 text-[12px] text-[#6B7280]">
          {curso.duracionCalculada && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {curso.duracionCalculada}
            </span>
          )}
          {!isExternal && (
            <span className="flex items-center gap-1">
              <Users size={12} /> {curso.inscripciones.toLocaleString('es-CO')}
            </span>
          )}
          {isExternal && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              🟢 Acceso externo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */
export default function InstitucionPageClient({
  institucion,
  cursos,
  totalInscritos,
  instructores,
  loggedIn,
  usuario,
}) {
  const [activeTab, setActiveTab] = useState('cursos');

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return (
    <>
      {/* ── HERO OSCURO ── */}
      <section style={{ backgroundColor: '#0F172A' }} className="px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-[1440px] mx-auto">
          {/* Breadcrumb */}
          <nav className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/catalogo" className="hover:text-white transition-colors no-underline" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Instituciones
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-white font-semibold">{institucion.nombre}</span>
          </nav>

          <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-16">
            {/* Izquierda */}
            <div className="flex-1">
              <InstitutionLogo logoUrl={institucion.logoUrl} nombre={institucion.nombre} size={80} />

              <h1 className="font-bold text-[32px] lg:text-[36px] text-white leading-tight mt-5 mb-2">
                {institucion.nombre}
              </h1>

              {institucion.descripcion && (
                <p className="text-[15px] leading-[1.7] max-w-[620px] mb-6"
                   style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {institucion.descripcion}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-8 mb-7">
                <div>
                  <p className="font-bold text-[24px] text-white">{cursos.length}</p>
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Cursos</p>
                </div>
                <div>
                  <p className="font-bold text-[24px] text-white">
                    {totalInscritos.toLocaleString('es-CO')}
                  </p>
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Estudiantes</p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('cursos')}
                  className="bg-[#1E40AF] hover:bg-[#1A368F] text-white font-semibold text-[14px] px-6 py-3 rounded transition-colors"
                >
                  Ver cursos
                </button>
                {institucion.url && (
                  <a
                    href={institucion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white/30 text-white hover:bg-white/10 font-semibold text-[14px] px-6 py-3 rounded transition-colors no-underline flex items-center gap-2"
                  >
                    Sitio web oficial
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Derecha — imagen decorativa o avatar grande */}
            <div className="hidden lg:flex w-[340px] flex-shrink-0 items-center justify-center">
              {institucion.logoUrl ? (
                <div className="w-[260px] h-[200px] rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden p-8">
                  <img
                    src={institucion.logoUrl}
                    alt={institucion.nombre}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-[260px] h-[200px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Building2 size={80} className="text-white/20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <div className="sticky top-[80px] z-40 bg-white border-b border-[#F3F4F6] px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex gap-8 overflow-x-auto hide-scrollbar">
          {[
            { key: 'cursos', label: 'Cursos' },
            { key: 'sobre', label: 'Sobre nosotros' },
            { key: 'instructores', label: 'Instructores' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative py-4 font-semibold text-[14px] whitespace-nowrap bg-transparent border-0 transition-colors ${
                activeTab === t.key ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              {t.label}
              {activeTab === t.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E40AF]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── CUERPO ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-10">

        {/* TAB: CURSOS */}
        {activeTab === 'cursos' && (
          <div className="flex flex-col xl:flex-row gap-10">
            {/* Grid de cursos */}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-[22px] text-[#111827] mb-6">
                Cursos de {institucion.nombre} en SABERHUB
              </h2>

              {cursos.length === 0 ? (
                <div className="text-center py-16 border border-[#F3F4F6] rounded">
                  <BookOpen size={48} className="mx-auto text-[#D1D5DB] mb-4" />
                  <p className="font-medium text-[16px] text-[#374151]">Sin cursos publicados aún.</p>
                  <Link href="/catalogo" className="mt-4 inline-block text-[#1E40AF] font-semibold text-[14px] hover:underline no-underline">
                    Explorar catálogo →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cursos.map((curso) => (
                    <CursoCard key={curso.id} curso={curso} loggedIn={loggedIn} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-full xl:w-[340px] flex-shrink-0 flex flex-col gap-6">

              {/* Card — Sobre la institución */}
              <div className="border border-[#F3F4F6] rounded" style={{ borderBottom: '2px solid #1E40AF' }}>
                <div className="p-5 border-b border-[#F3F4F6]">
                  <h3 className="font-bold text-[15px] text-[#111827]">
                    Sobre {institucion.nombre}
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {institucion.nit && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-[#6B7280]">
                        <Hash size={14} /> NIT
                      </span>
                      <span className="font-medium text-[#111827]">{institucion.nit}</span>
                    </div>
                  )}
                  {institucion.fechaCreacion && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-[#6B7280]">
                        <Calendar size={14} /> Incorporación
                      </span>
                      <span className="font-medium text-[#111827]">{formatDate(institucion.fechaCreacion)}</span>
                    </div>
                  )}
                  {institucion.url && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-[#6B7280]">
                        <Globe size={14} /> Sitio web
                      </span>
                      <a
                        href={institucion.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[#1E40AF] hover:underline truncate max-w-[160px]"
                      >
                        {institucion.url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {institucion.telefono && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-[#6B7280]">
                        <Phone size={14} /> Teléfono
                      </span>
                      <span className="font-medium text-[#111827]">{institucion.telefono}</span>
                    </div>
                  )}
                  {institucion.correoAdmin && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2 text-[#6B7280]">
                        <Mail size={14} /> Contacto
                      </span>
                      <a
                        href={`mailto:${institucion.correoAdmin}`}
                        className="font-medium text-[#1E40AF] hover:underline truncate max-w-[160px]"
                      >
                        {institucion.correoAdmin}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Card — Estadísticas */}
              <div className="border border-[#F3F4F6] rounded" style={{ borderBottom: '2px solid #1E40AF' }}>
                <div className="p-5 border-b border-[#F3F4F6]">
                  <h3 className="font-bold text-[15px] text-[#111827]">Estadísticas</h3>
                </div>
                <div className="p-5 grid grid-cols-2 gap-5">
                  <div>
                    <p className="font-bold text-[22px] text-[#1E40AF]">{cursos.length}</p>
                    <p className="text-[11px] text-[#6B7280] uppercase tracking-wide">Cursos</p>
                  </div>
                  <div>
                    <p className="font-bold text-[22px] text-[#1E40AF]">
                      {totalInscritos.toLocaleString('es-CO')}
                    </p>
                    <p className="text-[11px] text-[#6B7280] uppercase tracking-wide">Estudiantes</p>
                  </div>
                </div>
              </div>

              {/* Card — Instructores (si existen) */}
              {instructores.length > 0 && (
                <div className="border border-[#F3F4F6] rounded" style={{ borderBottom: '2px solid #1E40AF' }}>
                  <div className="p-5 border-b border-[#F3F4F6]">
                    <h3 className="font-bold text-[15px] text-[#111827]">Instructores destacados</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {instructores.map((inst) => (
                      <div key={inst.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {inst.imagen ? (
                            <img src={inst.imagen} alt={inst.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-[#1E40AF] text-[13px]">
                              {(inst.nombre || '?').substring(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[13px] text-[#111827]">{inst.nombre}</p>
                          <p className="text-[12px] text-[#6B7280]">Instructor</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SOBRE NOSOTROS */}
        {activeTab === 'sobre' && (
          <div className="max-w-[800px]">
            <h2 className="font-bold text-[22px] text-[#111827] mb-6">Sobre {institucion.nombre}</h2>

            {institucion.descripcion ? (
              <p className="text-[15px] text-[#4B5563] leading-[1.8] mb-8">{institucion.descripcion}</p>
            ) : (
              <p className="text-[15px] text-[#9CA3AF] italic mb-8">Sin descripción registrada.</p>
            )}

            <div className="border border-[#F3F4F6] rounded divide-y divide-[#F3F4F6]" style={{ borderBottom: '2px solid #1E40AF' }}>
              {[
                institucion.nit && { icon: Hash, label: 'NIT', value: institucion.nit },
                institucion.fechaCreacion && { icon: Calendar, label: 'Incorporación a SABERHUB', value: formatDate(institucion.fechaCreacion) },
                institucion.url && { icon: Globe, label: 'Sitio web oficial', value: institucion.url, href: institucion.url },
                institucion.telefono && { icon: Phone, label: 'Teléfono', value: institucion.telefono },
                institucion.correoAdmin && { icon: Mail, label: 'Correo de contacto', value: institucion.correoAdmin, href: `mailto:${institucion.correoAdmin}` },
              ].filter(Boolean).map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-4">
                  <span className="flex items-center gap-2 text-[14px] text-[#6B7280]">
                    <row.icon size={16} />
                    {row.label}
                  </span>
                  {row.href ? (
                    <a href={row.href} target={row.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                       className="font-medium text-[14px] text-[#1E40AF] hover:underline">
                      {row.value}
                    </a>
                  ) : (
                    <span className="font-medium text-[14px] text-[#111827]">{row.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: INSTRUCTORES */}
        {activeTab === 'instructores' && (
          <div>
            <h2 className="font-bold text-[22px] text-[#111827] mb-6">Instructores</h2>
            {instructores.length === 0 ? (
              <div className="text-center py-16 border border-[#F3F4F6] rounded">
                <Users size={48} className="mx-auto text-[#D1D5DB] mb-4" />
                <p className="font-medium text-[16px] text-[#374151]">Sin instructores registrados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instructores.map((inst) => (
                  <div key={inst.id} className="border border-[#F3F4F6] rounded p-5 flex items-center gap-4"
                       style={{ borderBottom: '2px solid #1E40AF' }}>
                    <div className="w-14 h-14 rounded-full bg-[#E5E7EB] flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {inst.imagen ? (
                        <img src={inst.imagen} alt={inst.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-[#1E40AF] text-[16px]">
                          {(inst.nombre || '?').substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-[15px] text-[#111827]">{inst.nombre}</p>
                      <p className="text-[13px] text-[#6B7280]">Instructor certificado</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-[#171717] px-8 py-10 mt-12 w-full">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-[15px] text-white">SABERHUB</span>
          <span className="text-[12px] text-[#9CA3AF]">
            © {new Date().getFullYear()} SABERHUB. Todos los derechos reservados.
          </span>
          <div className="flex gap-4 text-[12px] text-[#9CA3AF]">
            <Link href="/terminos" className="hover:text-white transition-colors no-underline">Términos</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors no-underline">Privacidad</Link>
          </div>
        </div>
      </footer>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
