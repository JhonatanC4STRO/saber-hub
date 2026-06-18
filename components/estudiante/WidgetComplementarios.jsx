'use client';
import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, BookOpen, Clock } from 'lucide-react';

const SOURCE_COLORS = {
  'SENA': '#059669',
  'Coursera': '#2563EB',
  'edX': '#DC2626',
  'Khan Academy': '#16A34A',
  'UNAL': '#D97706',
  'UdeA': '#9333EA',
};

function getSourceColor(fuenteNombre) {
  const key = Object.keys(SOURCE_COLORS).find((k) =>
    fuenteNombre?.toLowerCase().includes(k.toLowerCase())
  );
  return SOURCE_COLORS[key] || '#4B5563';
}

export default function WidgetComplementarios() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/cursos/complementarios?limit=3');
        if (res.ok) {
          const data = await res.json();
          setCursos(data.complementarios || []);
        }
      } catch (err) {
        console.error('Error cargando widget complementarios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClick = async (curso) => {
    try {
      fetch('/api/cursos/complementarios/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoExternoId: curso.id,
          pantallaOrigen: 'dashboard',
        }),
      });
    } catch {
      // No bloquear la navegación
    }
    window.open(curso.fuenteUrl, '_blank', 'noopener,noreferrer');
  };

  if (!loading && cursos.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#1E40AF]" />
          <h2 className="font-bold text-[16px] text-[#111827]">Cursos complementarios para ti</h2>
        </div>
        <span className="bg-[#059669] text-white font-bold text-[10px] px-2 py-0.5 rounded-[4px] tracking-wider">
          GRATIS
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[#F3F4F6] rounded-[4px] p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-16" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-50 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cursos.map((curso) => {
            const color = getSourceColor(curso.fuenteNombre);
            return (
              <div
                key={curso.id}
                onClick={() => handleClick(curso)}
                className="bg-[#FBFBFB] border border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition-colors p-4 rounded-[4px] relative group overflow-hidden"
              >
                <div className="flex gap-3">
                  {/* Ícono de fuente */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <BookOpen size={18} style={{ color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-bold text-[9px] tracking-widest uppercase"
                      style={{ color }}
                    >
                      {curso.fuenteNombre}
                    </span>
                    <h4 className="font-bold text-[13px] text-[#111827] leading-[1.3] mt-0.5 line-clamp-2 group-hover:text-[#1E40AF] transition-colors">
                      {curso.titulo}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6B7280]">
                      {curso.duracionHoras && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {curso.duracionHoras}h
                        </span>
                      )}
                      {curso.nivel && (
                        <span>· {curso.nivel}</span>
                      )}
                    </div>
                  </div>

                  {/* Botón */}
                  <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={14} className="text-[#1E40AF]" />
                  </div>
                </div>

                {/* Línea lateral decorativa */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ backgroundColor: color }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="w-full h-px bg-[#F3F4F6] mt-4 mb-2" />
    </section>
  );
}
