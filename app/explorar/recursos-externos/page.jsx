'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  ExternalLink,
  Clock,
  BookOpen,
  Filter,
  X,
  Sparkles,
  GraduationCap,
  Globe,
} from 'lucide-react';

const SOURCE_COLORS = {
  'SENA': { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  'Coursera': { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  'edX': { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  'Khan Academy': { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  'UNAL': { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  'UdeA': { bg: '#FDF4FF', text: '#9333EA', border: '#E9D5FF' },
  'EAFIT': { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  'Javeriana': { bg: '#FFFBEB', text: '#CA8A04', border: '#FEF08A' },
};

function getSourceStyle(fuenteNombre) {
  const key = Object.keys(SOURCE_COLORS).find((k) =>
    fuenteNombre?.toLowerCase().includes(k.toLowerCase())
  );
  return SOURCE_COLORS[key] || { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' };
}

const SOURCES = [
  'Todas', 'SENA', 'Coursera', 'edX', 'Khan Academy', 'UNAL', 'UdeA', 'EAFIT', 'Javeriana',
];

const LEVELS = ['Todos', 'Básico', 'Intermedio', 'Avanzado'];

const DURATION_RANGES = [
  { label: 'Todas', min: null, max: null },
  { label: '< 20 horas', min: null, max: 20 },
  { label: '20 - 60 horas', min: 20, max: 60 },
  { label: '> 60 horas', min: 60, max: null },
];

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-100 rounded" />
          <div className="h-5 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-5 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-50 rounded w-1/2" />
        <div className="h-9 bg-gray-100 rounded w-full mt-2" />
      </div>
    </div>
  );
}

export default function RecursosExternosPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fuente, setFuente] = useState('Todas');
  const [nivel, setNivel] = useState('Todos');
  const [duracionIdx, setDuracionIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (fuente !== 'Todas') params.set('fuente', fuente);
      if (nivel !== 'Todos') params.set('nivel', nivel);

      const dur = DURATION_RANGES[duracionIdx];
      if (dur.min !== null) params.set('duracionMin', String(dur.min));
      if (dur.max !== null) params.set('duracionMax', String(dur.max));

      params.set('page', String(page));
      params.set('limit', '12');

      const res = await fetch(`/api/cursos/externos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCursos(data.cursos || []);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error cargando recursos externos:', err);
    } finally {
      setLoading(false);
    }
  }, [search, fuente, nivel, duracionIdx, page]);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [search, fuente, nivel, duracionIdx]);

  const handleClickCurso = async (curso) => {
    try {
      fetch('/api/cursos/complementarios/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoExternoId: curso.id,
          pantallaOrigen: 'explorar',
        }),
      });
    } catch {
      // No bloquear
    }
    window.open(curso.fuenteUrl, '_blank', 'noopener,noreferrer');
  };

  const activeFiltersCount =
    (fuente !== 'Todas' ? 1 : 0) +
    (nivel !== 'Todos' ? 1 : 0) +
    (duracionIdx !== 0 ? 1 : 0);

  const clearFilters = () => {
    setSearch('');
    setFuente('Todas');
    setNivel('Todos');
    setDuracionIdx(0);
    setPage(1);
  };

  return (
    <div
      className="min-h-screen bg-[#FAFBFC] font-sans flex flex-col"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 h-[80px] bg-white border-b border-[#E5E7EB] flex items-center px-6 lg:px-8">
        <Link href="/dashboard" className="flex flex-col mr-8">
          <span className="font-bold text-[14px] text-[#111827] leading-tight tracking-wide">
            SABERHUB
          </span>
          <span className="font-normal text-[11px] text-[#6B7280] leading-tight">
            Learning Platform
          </span>
        </Link>

        <div className="hidden lg:flex flex-1 max-w-[480px] items-center border border-[#E5E7EB] rounded-lg h-12 bg-white px-4 focus-within:border-[#1E40AF] focus-within:ring-1 focus-within:ring-[#1E40AF]">
          <Search size={18} className="text-[#9CA3AF] mr-3" />
          <input
            type="text"
            placeholder="Buscar recursos externos..."
            className="flex-1 outline-none text-[14px] text-[#111827] placeholder-[#9CA3AF]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="font-semibold text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors hidden md:block"
          >
            Mi Aprendizaje
          </Link>
          <Link
            href="/catalogo"
            className="font-semibold text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors hidden md:block"
          >
            Catálogo
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white py-14 px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#1E40AF] rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#7C3AED] rounded-full blur-[150px]" />
        </div>

        <div className="max-w-[1280px] mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#1E40AF]/20 border border-[#1E40AF]/30 flex items-center justify-center">
              <Globe size={24} className="text-[#60A5FA]" />
            </div>
            <span className="bg-[#1E40AF]/30 text-[#93C5FD] font-bold text-[11px] px-3 py-1 rounded-full tracking-wider uppercase border border-[#1E40AF]/30">
              Recursos Externos
            </span>
          </div>

          <h1 className="font-bold text-[32px] md:text-[40px] leading-tight max-w-2xl">
            Explora cursos gratuitos de universidades y plataformas
          </h1>
          <p className="font-normal text-[16px] md:text-[18px] text-[#94A3B8] mt-3 max-w-2xl leading-relaxed">
            Accede a formación de calidad del SENA, Coursera, edX, Khan Academy y las principales
            universidades colombianas. Todos los recursos son gratuitos y accesibles desde Colombia.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            {['SENA', 'Coursera', 'edX', 'Khan Academy', 'UNAL'].map((src) => {
              const style = getSourceStyle(src);
              return (
                <button
                  key={src}
                  onClick={() => {
                    setFuente(fuente === src ? 'Todas' : src);
                    setPage(1);
                  }}
                  className={`font-semibold text-[12px] px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    fuente === src
                      ? 'ring-2 ring-white/50 scale-105'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: style.bg,
                    color: style.text,
                    border: `1px solid ${style.border}`,
                  }}
                >
                  {src}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-[80px] z-30">
        <div className="max-w-[1280px] mx-auto px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Mobile search */}
          <div className="lg:hidden flex items-center border border-[#D1D5DB] rounded-lg h-10 px-3 bg-white w-full">
            <Search size={16} className="text-[#9CA3AF] mr-2" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              className="flex-1 outline-none text-[13px] text-[#111827] placeholder-[#9CA3AF]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Fuente filter */}
            <div className="relative">
              <select
                className="border border-[#D1D5DB] rounded-lg h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
                value={fuente}
                onChange={(e) => setFuente(e.target.value)}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s === 'Todas' ? 'Todas las fuentes' : s}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
              />
            </div>

            {/* Nivel filter */}
            <div className="relative">
              <select
                className="border border-[#D1D5DB] rounded-lg h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l === 'Todos' ? 'Todos los niveles' : l}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
              />
            </div>

            {/* Duración filter */}
            <div className="relative">
              <select
                className="border border-[#D1D5DB] rounded-lg h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
                value={duracionIdx}
                onChange={(e) => setDuracionIdx(Number(e.target.value))}
              >
                {DURATION_RANGES.map((d, i) => (
                  <option key={i} value={i}>
                    {d.label === 'Todas' ? 'Cualquier duración' : d.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
              />
            </div>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[#DC2626] font-medium text-[13px] hover:underline"
              >
                <X size={14} />
                Limpiar ({activeFiltersCount})
              </button>
            )}

            {/* Results count */}
            <span className="ml-auto text-[13px] text-[#6B7280] font-medium hidden sm:block">
              {total} {total === 1 ? 'curso encontrado' : 'cursos encontrados'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : cursos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-4">
              <GraduationCap size={36} className="text-[#1E40AF]" />
            </div>
            <h3 className="font-bold text-[20px] text-[#111827] mb-2">
              No se encontraron cursos
            </h3>
            <p className="text-[14px] text-[#6B7280] max-w-md mb-6">
              Intenta ajustar tus filtros o busca con otros términos para encontrar recursos
              gratuitos.
            </p>
            <button
              onClick={clearFilters}
              className="bg-[#1E40AF] text-white font-semibold text-[14px] px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursos.map((curso) => {
                const style = getSourceStyle(curso.fuenteNombre);
                return (
                  <div
                    key={curso.id}
                    className="bg-white border border-[#F3F4F6] rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col"
                  >
                    {/* Imagen */}
                    <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden flex-shrink-0">
                      {curso.imagenUrl ? (
                        <img
                          src={curso.imagenUrl}
                          alt={curso.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: style.bg }}
                          >
                            <BookOpen size={28} style={{ color: style.text }} />
                          </div>
                        </div>
                      )}

                      {/* Badge GRATUITO */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-[#059669] text-white font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                          GRATUITO
                        </span>
                      </div>

                      {/* Institución */}
                      {curso.institucion?.nombre && (
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-black/60 backdrop-blur-sm text-white font-medium text-[10px] px-2.5 py-1 rounded-full">
                            {curso.institucion.nombre}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                        <span
                          className="font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase"
                          style={{
                            backgroundColor: style.bg,
                            color: style.text,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          {curso.fuenteNombre}
                        </span>
                        {curso.nivel && (
                          <span className="bg-[#F3F4F6] text-[#4B5563] font-medium text-[10px] px-2 py-0.5 rounded-full">
                            {curso.nivel}
                          </span>
                        )}
                        {curso.modalidad && (
                          <span className="bg-[#F3F4F6] text-[#4B5563] font-medium text-[10px] px-2 py-0.5 rounded-full">
                            {curso.modalidad}
                          </span>
                        )}
                      </div>

                      {/* Título */}
                      <h3 className="font-bold text-[15px] text-[#111827] leading-snug line-clamp-2 mb-2 group-hover:text-[#1E40AF] transition-colors">
                        {curso.titulo}
                      </h3>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-[12px] text-[#6B7280] mb-3 mt-auto">
                        {curso.duracionHoras && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {curso.duracionHoras}h
                          </span>
                        )}
                        {curso.areaConocimiento && (
                          <span className="flex items-center gap-1 truncate">
                            <BookOpen size={12} />
                            {curso.areaConocimiento}
                          </span>
                        )}
                      </div>

                      {/* Botón */}
                      <button
                        onClick={() => handleClickCurso(curso)}
                        className="w-full h-[40px] bg-[#1E40AF] text-white font-semibold text-[13px] rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Ver curso
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-10 px-4 border border-[#D1D5DB] rounded-lg text-[13px] font-semibold text-[#4B5563] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-[13px] font-semibold transition-colors ${
                          page === pageNum
                            ? 'bg-[#1E40AF] text-white'
                            : 'text-[#4B5563] hover:bg-gray-50 border border-[#D1D5DB]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-10 px-4 border border-[#D1D5DB] rounded-lg text-[13px] font-semibold text-[#4B5563] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#111827] text-white py-10 px-6 mt-auto border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[14px] tracking-wider">SABERHUB</span>
            <span className="text-[12px] text-[#6B7280]">·</span>
            <span className="text-[12px] text-[#9CA3AF]">
              Recursos Externos Gratuitos
            </span>
          </div>
          <span className="text-[12px] text-[#6B7280]">
            © {new Date().getFullYear()} SABERHUB. Todos los derechos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
