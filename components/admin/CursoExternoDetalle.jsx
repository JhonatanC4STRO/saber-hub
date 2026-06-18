'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Check, X, Edit2, ArrowLeft, BookOpen, Trash2 } from 'lucide-react';

export default function CursoExternoDetalle({ id }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [campos, setCampos] = useState({});
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/cursos-externos/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setCampos({
          titulo: d.curso?.titulo || '',
          descripcion: d.curso?.descripcion || '',
          nivel: d.curso?.nivel || '',
          duracionHoras: d.curso?.duracionHoras || '',
          areaConocimiento: d.curso?.areaConocimiento || '',
          imagenUrl: d.curso?.imagenUrl || '',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const doAction = async (accion, extra = {}) => {
    setSaving(true);
    setMsg(null);
    const body = { accion, ...extra };
    if (editMode && (accion === 'aprobar' || accion === 'aprobar_con_ediciones')) {
      body.accion = 'aprobar_con_ediciones';
      body.campos = campos;
    }
    if (accion === 'editar') {
      body.campos = campos;
    }
    const res = await fetch(`/api/admin/cursos-externos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json();
      setMsg({
        type: 'success',
        text: accion === 'rechazar' ? 'Curso rechazado.' : (accion === 'editar' ? 'Cambios guardados con éxito.' : 'Curso aprobado y publicado.')
      });
      if (accion === 'editar') {
        setData((prev) => ({ ...prev, curso: d.curso }));
        setEditMode(false);
      } else {
        setTimeout(() => router.push('/admin/cursos-externos'), 1500);
      }
    } else {
      const d = await res.json();
      setMsg({ type: 'error', text: d.message || 'Error' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar permanentemente este curso externo?')) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/cursos-externos/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Curso externo eliminado correctamente.' });
        setTimeout(() => router.push('/admin/cursos-externos'), 1500);
      } else {
        const d = await res.json();
        setMsg({ type: 'error', text: d.message || 'Error al eliminar' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Error de red.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.curso) {
    return <p className="text-[#6B7280] py-12 text-center">Curso no encontrado.</p>;
  }

  const c = data.curso;
  const isPendiente = c.estado === 'pendiente';

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/cursos-externos"
        className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1E40AF] hover:underline no-underline"
      >
        <ArrowLeft size={15} /> Volver al panel
      </Link>

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-[13px] font-semibold border ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: main detail + edit form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Course info card */}
          <div className="border border-[#F3F4F6] rounded-xl overflow-hidden">
            {/* Image */}
            <div className="w-full h-[180px] bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center relative">
              {(editMode ? campos.imagenUrl : c.imagenUrl)
                ? <img src={editMode ? campos.imagenUrl : c.imagenUrl} alt={c.titulo} className="w-full h-full object-cover" />
                : <div className="text-white text-center"><div className="text-[48px]">🎓</div><p className="font-bold text-[14px] mt-1">{c.fuenteNombre}</p></div>}
              <span className="absolute top-3 left-3 bg-white text-[#1E40AF] font-bold text-[10px] px-2 py-0.5 rounded">
                {c.modalidad?.toUpperCase() || 'VIRTUAL'}
              </span>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-full">
                  <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">{c.fuenteNombre}</p>
                  {editMode ? (
                    <input
                      className="font-bold text-[20px] text-[#111827] border-b border-[#1E40AF] outline-none w-full bg-transparent pb-1"
                      value={campos.titulo}
                      onChange={(e) => setCampos((p) => ({ ...p, titulo: e.target.value }))}
                    />
                  ) : (
                    <h2 className="font-bold text-[20px] text-[#111827] leading-snug break-words">{c.titulo}</h2>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Nivel', key: 'nivel' },
                  { label: 'Duración (horas)', key: 'duracionHoras', type: 'number' },
                  { label: 'Área de conocimiento', key: 'areaConocimiento' },
                  { label: 'Imagen URL', key: 'imagenUrl' },
                ].map(({ label, key, type = 'text' }) => (
                  <div key={key}>
                    <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">{label}</p>
                    {editMode ? (
                      <input
                        type={type}
                        className="border border-[#D1D5DB] rounded px-2 py-1.5 text-[13px] outline-none focus:border-[#1E40AF] w-full"
                        value={campos[key] ?? ''}
                        onChange={(e) => setCampos((p) => ({ ...p, [key]: e.target.value }))}
                      />
                    ) : (
                      <p className="text-[13px] text-[#374151] break-words">{c[key] ?? '—'}</p>
                    )}
                  </div>
                ))}
                <div>
                  <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Código externo</p>
                  <p className="text-[13px] text-[#374151] font-mono break-all">{c.codigoExterno ?? '—'}</p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">Descripción</p>
                {editMode ? (
                  <textarea
                    className="border border-[#D1D5DB] rounded px-3 py-2 text-[13px] outline-none focus:border-[#1E40AF] w-full resize-none"
                    rows={3}
                    value={campos.descripcion ?? ''}
                    onChange={(e) => setCampos((p) => ({ ...p, descripcion: e.target.value }))}
                  />
                ) : (
                  <p className="text-[13px] text-[#374151] leading-relaxed break-words whitespace-pre-wrap">{c.descripcion || '—'}</p>
                )}
              </div>

              {/* External link */}
              <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
                <a
                  href={c.fuenteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1E40AF] hover:underline"
                >
                  <ExternalLink size={14} />
                  Ver en {c.fuenteNombre}
                </a>
              </div>
            </div>
          </div>

          {/* Reject form */}
          {isPendiente && showRejectForm && (
            <div className="border border-red-200 rounded-xl p-5 bg-red-50">
              <h3 className="font-bold text-[15px] text-red-700 mb-3">Motivo de rechazo</h3>
              <textarea
                className="w-full border border-red-200 rounded-lg p-3 text-[13px] outline-none focus:border-red-500 resize-none bg-white"
                rows={3}
                placeholder="Describe por qué se rechaza este curso..."
                value={rejectMotivo}
                onChange={(e) => setRejectMotivo(e.target.value)}
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => doAction('rechazar', { motivoRechazo: rejectMotivo })}
                  disabled={!rejectMotivo.trim() || saving}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-[13px] px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? 'Rechazando...' : 'Confirmar rechazo'}
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="border border-[#D1D5DB] bg-white text-[#374151] font-semibold text-[13px] px-5 py-2 rounded-lg hover:bg-[#F9FAFB]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: actions + similar courses */}
        <div className="space-y-5">
          {/* Action buttons */}
          {isPendiente && (
            <div className="border border-[#F3F4F6] rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-[15px] text-[#111827] mb-1">Decisión</h3>
              <button
                onClick={() => doAction('aprobar')}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-[14px] py-3 rounded-lg transition-colors disabled:opacity-60"
              >
                <Check size={16} />
                Aprobar tal cual
              </button>
              {editMode && (
                <button
                  onClick={() => doAction('aprobar_con_ediciones')}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white font-semibold text-[14px] py-3 rounded-lg transition-colors disabled:opacity-60"
                >
                  <Check size={16} />
                  Aprobar con ediciones
                </button>
              )}
              <button
                onClick={() => setShowRejectForm((s) => !s)}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-[14px] py-3 rounded-lg transition-colors"
              >
                <X size={16} />
                Rechazar
              </button>

              <div className="pt-3 border-t border-[#F3F4F6] text-[11px] text-[#9CA3AF] space-y-1">
                <p><strong>Aprobar:</strong> Crea curso en catálogo con estado Publicado.</p>
                <p><strong>Rechazar:</strong> El curso no volverá a importarse.</p>
              </div>
            </div>
          )}

          {/* State info */}
          {!isPendiente && (
            <div className={`border rounded-xl p-5 ${c.estado === 'aprobado' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`font-bold text-[14px] mb-1 ${c.estado === 'aprobado' ? 'text-green-700' : 'text-red-700'}`}>
                {c.estado === 'aprobado' ? '✓ Curso aprobado' : '✗ Curso rechazado'}
              </p>
              {c.revisadoEn && (
                <p className="text-[12px] text-[#6B7280]">
                  {new Date(c.revisadoEn).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
              {c.motivoRechazo && (
                <p className="text-[12px] text-red-600 mt-1">Motivo: {c.motivoRechazo}</p>
              )}
              {c.curso && (
                <Link href={`/cursos/${c.curso.id}`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1E40AF] hover:underline mt-2 no-underline">
                  <BookOpen size={13} /> Ver en catálogo
                </Link>
              )}
            </div>
          )}

          {/* Administración Box */}
          <div className="border border-[#F3F4F6] rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-[15px] text-[#111827] mb-1">Administración</h3>
            
            {editMode ? (
              <button
                onClick={() => doAction('editar')}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white font-semibold text-[14px] py-3 rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Check size={16} />
                Guardar cambios
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F9FAFB] font-semibold text-[14px] py-3 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 size={16} />
                Editar metadatos
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-[14px] py-3 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
              Eliminar curso externo
            </button>
          </div>

          {/* Similar courses */}
          {data.similares?.length > 0 && (
            <div className="border border-[#F3F4F6] rounded-xl p-5">
              <h3 className="font-bold text-[14px] text-[#111827] mb-3">Cursos similares en SABERHUB</h3>
              <div className="space-y-3">
                {data.similares.map((s) => (
                  <Link
                    key={s.id}
                    href={`/cursos/${s.id}`}
                    className="flex items-start gap-3 p-3 border border-[#F3F4F6] rounded-lg hover:border-[#1E40AF] transition-colors no-underline group"
                  >
                    <div className="w-10 h-10 rounded bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                      {s.imgPortada
                        ? <img src={s.imgPortada} alt={s.titulo} className="w-full h-full object-cover rounded" />
                        : <BookOpen size={18} className="text-[#1E40AF]" />}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#111827] leading-snug group-hover:text-[#1E40AF]">{s.titulo}</p>
                      {s.descripcion && <p className="text-[11px] text-[#6B7280] truncate">{s.descripcion}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border border-[#F3F4F6] rounded-xl p-5">
            <h3 className="font-bold text-[14px] text-[#111827] mb-3">Metadatos</h3>
            <dl className="space-y-2">
              {[
                ['Institución', c.institucion?.nombre],
                ['Importado', new Date(c.creadoEn).toLocaleDateString('es-CO')],
                ['Idioma', c.idioma],
                ['Modalidad', c.modalidad],
              ].map(([label, value]) => value && (
                <div key={label} className="flex justify-between gap-4 text-[12px]">
                  <dt className="text-[#6B7280] shrink-0">{label}</dt>
                  <dd className="font-medium text-[#374151] text-right break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
