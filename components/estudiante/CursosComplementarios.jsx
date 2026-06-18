'use client';
import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, BookOpen, Sparkles } from 'lucide-react';

// Colores por fuente de curso externo
const SOURCE_COLORS = {
  'SENA': { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', badge: '#059669' },
  'Coursera': { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', badge: '#2563EB' },
  'edX': { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', badge: '#DC2626' },
  'Khan Academy': { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', badge: '#16A34A' },
  'UNAL': { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', badge: '#D97706' },
  'UdeA': { bg: '#FDF4FF', text: '#9333EA', border: '#E9D5FF', badge: '#9333EA' },
};

function getSourceStyle(fuenteNombre) {
  const key = Object.keys(SOURCE_COLORS).find((k) =>
    fuenteNombre?.toLowerCase().includes(k.toLowerCase())
  );
  return SOURCE_COLORS[key] || { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB', badge: '#4B5563' };
}

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

export default function CursosComplementarios({ cursoId }) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplementarios = async () => {
      try {
        const url = cursoId
          ? `/api/cursos/complementarios?cursoId=${cursoId}&limit=3`
          : `/api/cursos/complementarios?limit=3`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setCursos(data.complementarios || []);
        }
      } catch (err) {
        console.error('Error cargando cursos complementarios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplementarios();
  }, [cursoId]);

  const handleClickCurso = async (curso) => {
    // Registrar click en background
    try {
      fetch('/api/cursos/complementarios/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoExternoId: curso.id,
          pantallaOrigen: 'detalle_curso',
        }),
      });
    } catch {
      // No bloquear la navegación si falla el log
    }

    // Abrir en nueva pestaña
    window.open(curso.fuenteUrl, '_blank', 'noopener,noreferrer');
  };

  if (!loading && cursos.length === 0) {
    return null; // No mostrar sección si no hay complementarios
  }

  return (
    <section className="bg-white py-10 px-6 lg:px-12 w-full max-w-[1280px] mx-auto border-t border-[#F3F4F6]">
      <div className="bg-white border border-[#F3F4F6] rounded-lg p-6 shadow-sm border-b-2 border-b-[#1E40AF]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
            <Sparkles size={20} className="text-[#1E40AF]" />
          </div>
          <div>
            <h3 className="font-bold text-[20px] text-[#111827]">
              Sigue aprendiendo — Cursos relacionados gratuitos
            </h3>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Complementa tu formación con recursos de universidades y plataformas reconocidas
            </p>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
            : cursos.map((curso) => {
                const style = getSourceStyle(curso.fuenteNombre);
                return (
                  <div
                    key={curso.id}
                    className="bg-white border border-[#F3F4F6] rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 group flex flex-col"
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
                        <div className="w-full h-full flex items-center justify-center">
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
                      </div>

                      {/* Título */}
                      <h4 className="font-bold text-[15px] text-[#111827] leading-snug line-clamp-2 mb-2 group-hover:text-[#1E40AF] transition-colors">
                        {curso.titulo}
                      </h4>

                      {/* Meta info */}
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
                        className="w-full h-[38px] bg-[#1E40AF] text-white font-semibold text-[13px] rounded-md hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Ver curso
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
