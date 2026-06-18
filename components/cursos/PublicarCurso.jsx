'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  Film,
  FileText,
  Award,
  Eye,
  Rocket,
  Globe,
  Save,
  X,
  Users,
  Star,
  Clock,
  Shield,
  Building2,
  ChevronDown,
  ChevronRight,
  Play,
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';

/* ─────────── constants ─────────── */
const STEPS = [
  { n: 1, label: 'Información' },
  { n: 2, label: 'Módulos' },
  { n: 3, label: 'Evaluaciones' },
  { n: 4, label: 'Configuración' },
  { n: 5, label: 'Publicar' },
];

/* ─────────── Stepper ─────────── */
function Stepper({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 w-full overflow-x-auto py-2">
      {STEPS.map((step, idx) => {
        const isActive = step.n === current;
        const isDone = step.n < current;
        return (
          <React.Fragment key={step.n}>
            <div className="flex flex-col items-center min-w-[90px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all ${
                  isActive
                    ? 'bg-[#1E40AF] text-white'
                    : isDone
                      ? 'bg-[#1E40AF] text-white'
                      : 'bg-white border-2 border-[#D1D5DB] text-[#9CA3AF]'
                }`}
              >
                {isDone ? <Check size={14} /> : step.n}
              </div>
              <span
                className={`text-[11px] mt-1 text-center leading-tight ${
                  isActive ? 'font-semibold text-[#1E40AF]' : 'font-medium text-[#6B7280]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-1 mt-[-18px] min-w-[24px] ${
                  step.n < current ? 'bg-[#1E40AF]' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─────────── Checklist Item ─────────── */
function ChecklistItem({ label, ok, optional = false, actionLabel, actionHref }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#F3F4F6] last:border-0">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          ok ? 'bg-[#D1FAE5]' : optional ? 'bg-[#FEF3C7]' : 'bg-[#FEE2E2]'
        }`}
      >
        {ok ? (
          <Check size={14} className="text-[#059669]" />
        ) : optional ? (
          <AlertCircle size={14} className="text-[#D97706]" />
        ) : (
          <X size={14} className="text-[#EF4444]" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`text-[13px] font-medium ${ok ? 'text-[#111827]' : optional ? 'text-[#92400E]' : 'text-[#991B1B]'}`}
        >
          {label}
        </p>
        {!ok && optional && (
          <p className="text-[11px] text-[#6B7280] mt-0.5">Recomendado pero no obligatorio</p>
        )}
        {!ok && !optional && (
          <p className="text-[11px] text-[#6B7280] mt-0.5">Requerido para publicar</p>
        )}
      </div>
      {!ok && actionHref && (
        <Link
          href={actionHref}
          className="text-[12px] text-[#1E40AF] font-semibold hover:underline flex-shrink-0"
        >
          {actionLabel || 'Completar'}
        </Link>
      )}
    </div>
  );
}

/* ─────────── Published Success Modal ─────────── */
function SuccessModal({ curso, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl w-full max-w-[520px] overflow-hidden shadow-2xl">
        {/* Header animado */}
        <div className="bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Rocket size={36} className="text-white" />
          </div>
          <h2 className="font-bold text-[24px] text-white mb-1">¡Curso publicado!</h2>
          <p className="text-white/80 text-[14px]">
            Tu curso ya está disponible para los estudiantes.
          </p>
        </div>

        <div className="p-8">
          {/* Info del curso */}
          <div className="bg-[#F9FAFB] rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={14} className="text-[#10B981]" />
              <span className="text-[12px] font-semibold text-[#10B981] uppercase tracking-wide">
                Publicado
              </span>
            </div>
            <p className="font-bold text-[16px] text-[#111827] leading-tight">
              {curso?.titulo || 'Tu nuevo curso'}
            </p>
            {curso?.categoria?.nombre && (
              <p className="text-[12px] text-[#6B7280] mt-0.5">{curso.categoria.nombre}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full bg-[#1E40AF] hover:bg-[#1A368F] text-white py-3 rounded-lg text-[14px] font-semibold transition-colors text-center flex items-center justify-center gap-2"
              onClick={() => {
                sessionStorage.removeItem('saberhub_curso_id');
                onClose();
              }}
            >
              <BookOpen size={16} /> Ir a mis cursos
            </Link>
            {curso?.id && (
              <Link
                href={`/cursos/${curso.id}`}
                className="w-full bg-white border border-[#D1D5DB] hover:bg-gray-50 text-[#111827] py-3 rounded-lg text-[14px] font-semibold transition-colors text-center flex items-center justify-center gap-2"
              >
                <Eye size={16} /> Ver curso publicado
              </Link>
            )}
          </div>

          <p className="text-[11px] text-[#6B7280] text-center mt-4">
            Puedes editar el curso en cualquier momento desde tu dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────── MAIN COMPONENT ─────────── */
export default function PublicarCurso({ usuario }) {
  const router = useRouter();
  const [cursoId, setCursoId] = useState(null);
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [published, setPublished] = useState(false);
  const [modulosExpanded, setModulosExpanded] = useState(true);
  const [tieneEvaluacion, setTieneEvaluacion] = useState(false);

  /* ─── Cargar datos del curso ─── */
  useEffect(() => {
    const id = sessionStorage.getItem('saberhub_curso_id');
    if (id) {
      setCursoId(id);
      
      Promise.all([
        fetch(`/api/cursos/${id}`).then((r) => r.json()),
        fetch(`/api/evaluaciones?cursoId=${id}`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      ])
        .then(([cursoData, evalsData]) => {
          setCurso(cursoData);
          if (cursoData.estado === 'publicado') setPublished(true);
          
          if (Array.isArray(evalsData) && evalsData.length > 0) {
            setTieneEvaluacion(true);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /* ─── Checklist ─── */
  const tieneTitulo = !!curso?.titulo?.trim();
  const tieneDescripcion = !!curso?.descripcion?.trim();
  const tieneImagen = !!(curso?.imgPortada && !curso.imgPortada.startsWith('placeholder'));
  const tieneModulos = (curso?.modulos?.length || 0) > 0;
  const tieneLecciones = (curso?.modulos || []).some((m) => (m.lecciones?.length || 0) > 0);
  const canPublish = tieneTitulo && tieneDescripcion && tieneModulos && tieneLecciones;

  /* ─── Publicar ─── */
  const handlePublish = useCallback(async () => {
    if (!cursoId) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'publicado' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.message || 'Error al publicar el curso');
        return;
      }
      setCurso((prev) => ({ ...prev, estado: 'publicado' }));
      setPublished(true);
    } catch {
      setPublishError('Error de conexión. Intenta de nuevo.');
    } finally {
      setPublishing(false);
    }
  }, [cursoId]);

  /* ─── Guardar como borrador y salir ─── */
  const handleSaveDraft = useCallback(() => {
    sessionStorage.removeItem('saberhub_curso_id');
    router.push('/dashboard');
  }, [router]);

  /* ─── Stats ─── */
  const totalModulos = curso?.modulos?.length || 0;
  const totalLecciones = (curso?.modulos || []).reduce(
    (acc, m) => acc + (m.lecciones?.length || 0),
    0
  );
  const tieneVideos = (curso?.modulos || []).some((m) => m.lecciones?.some((l) => l.urlVideo));
  const tieneOtorgaCertificado = curso?.otorgaCertificado;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="text-[#1E40AF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      <HeaderAdmin usuario={usuario} />

      {/* Success Modal */}
      {published && <SuccessModal curso={curso} onClose={() => setPublished(false)} />}

      <main className="max-w-[1440px] mx-auto px-6 lg:px-8 pt-6 pb-24">
        {/* Breadcrumb */}
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li>
              <Link
                href="/dashboard"
                className="text-[#6B7280] hover:text-[#111827] font-medium transition-colors"
              >
                Mi aprendizaje
              </Link>
            </li>
            <li className="text-[#D1D5DB]">›</li>
            <li>
              <Link
                href="/dashboard"
                className="text-[#6B7280] hover:text-[#111827] font-medium transition-colors"
              >
                Mis cursos
              </Link>
            </li>
            <li className="text-[#D1D5DB]">›</li>
            <li className="text-[#111827] font-semibold">Crear curso</li>
          </ol>
        </nav>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <Link
              href="/CrearCursos/configuracion"
              className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] font-medium mb-2 transition-colors w-fit"
            >
              <ArrowLeft size={14} /> Volver a configuración
            </Link>
            <h1 className="font-bold text-[28px] text-[#111827] leading-tight">Publicar curso</h1>
            <p className="text-[14px] text-[#6B7280] font-normal mt-1">
              Revisa el resumen y publica tu curso cuando esté listo.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 bg-white border border-[#D1D5DB] px-5 py-3 rounded text-[14px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors"
            >
              <Save size={15} /> Guardar y salir
            </button>
            <button
              id="btn-publicar-curso"
              onClick={handlePublish}
              disabled={!canPublish || publishing || published}
              className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] disabled:bg-[#93C5FD] text-white px-6 py-3 rounded text-[14px] font-semibold transition-colors disabled:cursor-not-allowed"
            >
              {publishing ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
              {published ? 'Publicado ✓' : publishing ? 'Publicando...' : 'Publicar curso'}
            </button>
          </div>
        </div>

        {/* Stepper */}
        <Stepper current={5} />

        {/* Error */}
        {publishError && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#EF4444] rounded px-4 py-3 mb-6 text-[#991B1B] text-[13px] font-medium">
            <AlertCircle size={15} /> {publishError}
          </div>
        )}

        {/* No course warning */}
        {!cursoId && (
          <div className="flex items-center gap-2 bg-[#FEF3C7] border border-[#F59E0B] rounded px-4 py-3 mb-6 text-[#92400E] text-[13px] font-medium">
            <AlertCircle size={15} /> No hay un curso activo.
            <Link href="/CrearCursos" className="underline ml-1">
              Ve al paso 1 para comenzar.
            </Link>
          </div>
        )}

        {/* Published banner */}
        {curso?.estado === 'publicado' && (
          <div className="flex items-center gap-3 bg-[#D1FAE5] border border-[#10B981] rounded px-5 py-4 mb-6">
            <CheckCircle size={20} className="text-[#059669] flex-shrink-0" />
            <div>
              <p className="font-bold text-[14px] text-[#065F46]">Este curso ya está publicado</p>
              <p className="text-[12px] text-[#047857]">
                Los cambios que hagas se aplicarán inmediatamente.
              </p>
            </div>
            <div className="ml-auto">
              {curso?.id && (
                <Link
                  href={`/cursos/${curso.id}`}
                  className="text-[13px] text-[#059669] font-semibold hover:underline flex items-center gap-1"
                >
                  <Eye size={14} /> Ver curso
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ══════ LEFT ══════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Checklist de publicación */}
            <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-8">
              <h2 className="font-bold text-[18px] text-[#111827] mb-2">Lista de verificación</h2>
              <p className="text-[13px] text-[#6B7280] mb-6">
                Completa todos los ítems obligatorios antes de publicar.
              </p>

              <ChecklistItem
                label="Título del curso"
                ok={tieneTitulo}
                actionHref="/CrearCursos"
                actionLabel="Agregar"
              />
              <ChecklistItem
                label="Descripción completa"
                ok={tieneDescripcion}
                actionHref="/CrearCursos"
                actionLabel="Agregar"
              />
              <ChecklistItem
                label="Imagen de portada"
                ok={tieneImagen}
                optional
                actionHref="/CrearCursos"
                actionLabel="Subir"
              />
              <ChecklistItem
                label="Al menos un módulo creado"
                ok={tieneModulos}
                actionHref="/CrearCursos/modulos"
                actionLabel="Agregar módulo"
              />
              <ChecklistItem
                label="Al menos una lección en el primer módulo"
                ok={tieneLecciones}
                actionHref="/CrearCursos/modulos"
                actionLabel="Agregar lección"
              />
              <ChecklistItem
                label="Evaluación configurada"
                ok={tieneEvaluacion}
                optional
                actionHref="/CrearCursos/evaluaciones"
                actionLabel="Crear evaluación"
              />
              <ChecklistItem
                label="Certificado configurado"
                ok={!!tieneOtorgaCertificado}
                optional
                actionHref="/CrearCursos/configuracion"
                actionLabel="Configurar"
              />

              {/* Status global */}
              <div
                className={`mt-5 rounded p-4 flex items-center gap-3 ${
                  canPublish
                    ? 'bg-[#D1FAE5] border border-[#10B981]'
                    : 'bg-[#FEF3C7] border border-[#F59E0B]'
                }`}
              >
                {canPublish ? (
                  <>
                    <CheckCircle size={18} className="text-[#059669] flex-shrink-0" />
                    <p className="text-[14px] font-semibold text-[#065F46]">
                      ¡Listo para publicar! Tu curso cumple los requisitos mínimos.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="text-[#D97706] flex-shrink-0" />
                    <p className="text-[14px] font-semibold text-[#92400E]">
                      Completa los ítems obligatorios para poder publicar.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Resumen de contenido */}
            {curso && (
              <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-8">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setModulosExpanded(!modulosExpanded)}
                >
                  <h2 className="font-bold text-[18px] text-[#111827]">Contenido del curso</h2>
                  {modulosExpanded ? (
                    <ChevronDown size={18} className="text-[#6B7280]" />
                  ) : (
                    <ChevronRight size={18} className="text-[#6B7280]" />
                  )}
                </div>

                {modulosExpanded && (
                  <div className="mt-5">
                    {(curso.modulos || []).length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-[#E5E7EB] rounded">
                        <BookOpen size={32} className="mx-auto mb-2 text-[#D1D5DB]" />
                        <p className="text-[13px] text-[#6B7280]">
                          No hay módulos.{' '}
                          <Link
                            href="/CrearCursos/modulos"
                            className="text-[#1E40AF] font-semibold hover:underline"
                          >
                            Agregar módulos
                          </Link>
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {(curso.modulos || []).map((mod, i) => (
                          <div
                            key={mod.id}
                            className="border border-[#F3F4F6] rounded overflow-hidden"
                          >
                            <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB]">
                              <div className="w-6 h-6 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                                <span className="text-[#1E40AF] text-[11px] font-bold">
                                  {i + 1}
                                </span>
                              </div>
                              <p className="font-semibold text-[14px] text-[#111827] flex-1">
                                {mod.titulo}
                              </p>
                              <span className="text-[12px] text-[#6B7280]">
                                {mod.lecciones?.length || 0} lecciones
                              </span>
                            </div>
                            {(mod.lecciones || []).length > 0 && (
                              <div className="divide-y divide-[#F3F4F6]">
                                {mod.lecciones.slice(0, 4).map((lec, j) => (
                                  <div key={lec.id} className="flex items-center gap-2 px-4 py-2">
                                    <span className="text-[11px] text-[#9CA3AF] w-6 flex-shrink-0">
                                      {i + 1}.{j + 1}
                                    </span>
                                    {lec.urlVideo ? (
                                      <Film size={12} className="text-[#1E40AF] flex-shrink-0" />
                                    ) : (
                                      <FileText
                                        size={12}
                                        className="text-[#6B7280] flex-shrink-0"
                                      />
                                    )}
                                    <span className="text-[13px] text-[#374151] truncate">
                                      {lec.titulo}
                                    </span>
                                    {lec.esPreview && (
                                      <span className="bg-[#DBEAFE] text-[#1E40AF] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ml-auto flex-shrink-0">
                                        Preview
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {(mod.lecciones?.length || 0) > 4 && (
                                  <div className="px-4 py-2">
                                    <span className="text-[12px] text-[#6B7280]">
                                      +{mod.lecciones.length - 4} lecciones más
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ══════ RIGHT SIDEBAR ══════ */}
          <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-5 lg:sticky lg:top-24">
            {/* Vista previa del curso */}
            {curso && (
              <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-6">
                <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-4">
                  Vista previa del curso
                </p>
                <div className="border border-[#F3F4F6] rounded overflow-hidden">
                  {/* Cover */}
                  <div className="relative w-full aspect-video bg-[#1E40AF] flex items-center justify-center overflow-hidden">
                    {curso.imgPortada && !curso.imgPortada.startsWith('placeholder') ? (
                      <img
                        src={curso.imgPortada}
                        alt="Portada"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen size={36} className="text-white/50" />
                    )}
                    <div
                      className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded ${
                        curso.estado === 'publicado' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                      }`}
                    >
                      {curso.estado === 'publicado' ? 'PUBLICADO' : 'BORRADOR'}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <Play size={16} className="text-[#111827] ml-0.5" fill="#111827" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    {curso.institucion && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building2 size={11} className="text-[#4B5563]" />
                        <span className="text-[11px] text-[#4B5563] font-medium">
                          {curso.institucion.nombre}
                        </span>
                      </div>
                    )}
                    <p className="font-bold text-[15px] text-[#111827] leading-tight mb-1 line-clamp-2">
                      {curso.titulo}
                    </p>
                    {curso.categoria?.nombre && (
                      <span className="inline-block bg-[#DBEAFE] text-[#1E40AF] text-[10px] font-semibold px-2 py-0.5 rounded mb-2">
                        {curso.categoria.nombre}
                      </span>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#F3F4F6]">
                      {[
                        { icon: BookOpen, label: `${totalModulos} módulos` },
                        { icon: Film, label: `${totalLecciones} lecciones` },
                        {
                          icon: Award,
                          label: tieneOtorgaCertificado ? 'Con certificado' : 'Sin certificado',
                        },
                        { icon: Users, label: `${curso._count?.inscripciones || 0} inscritos` },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="flex items-center gap-1.5">
                            <Icon size={12} className="text-[#6B7280] flex-shrink-0" />
                            <span className="text-[11px] text-[#374151] font-medium">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estado del curso */}
            <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-6">
              <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-4">
                Estado actual
              </p>
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  curso?.estado === 'publicado'
                    ? 'bg-[#D1FAE5] border border-[#10B981]'
                    : 'bg-[#FEF3C7] border border-[#F59E0B]'
                }`}
              >
                {curso?.estado === 'publicado' ? (
                  <>
                    <Globe size={20} className="text-[#059669] flex-shrink-0" />
                    <div>
                      <p className="font-bold text-[14px] text-[#065F46]">Publicado</p>
                      <p className="text-[11px] text-[#047857]">
                        Visible para todos los estudiantes
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Shield size={20} className="text-[#D97706] flex-shrink-0" />
                    <div>
                      <p className="font-bold text-[14px] text-[#92400E]">Borrador</p>
                      <p className="text-[11px] text-[#78350F]">Solo tú puedes verlo</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* CTA Publicar */}
            <button
              onClick={handlePublish}
              disabled={!canPublish || publishing || published}
              className="w-full bg-[#1E40AF] hover:bg-[#1A368F] disabled:bg-[#93C5FD] text-white py-4 rounded-lg text-[15px] font-bold transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {publishing ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Publicando...
                </>
              ) : published ? (
                <>
                  <CheckCircle size={18} /> Curso publicado
                </>
              ) : (
                <>
                  <Rocket size={18} /> Publicar curso ahora
                </>
              )}
            </button>

            {!canPublish && (
              <p className="text-[12px] text-[#6B7280] text-center -mt-2">
                Completa los ítems obligatorios para habilitar la publicación.
              </p>
            )}

            {/* Qué pasa al publicar */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded p-4">
              <p className="font-semibold text-[13px] text-[#1E40AF] mb-3">
                ¿Qué pasa al publicar?
              </p>
              <ul className="flex flex-col gap-2">
                {[
                  'El curso aparece en el catálogo público',
                  'Los estudiantes pueden inscribirse',
                  'Se generan notificaciones para los inscritos',
                  'Puedes seguir editando el contenido',
                  'Recibirás estadísticas de visualización',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#1E3A8A]">
                    <CheckCircle size={13} className="text-[#1E40AF] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <FooterAdmin />
    </div>
  );
}
