'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Award,
  Globe,
  Users,
  MessageSquare,
  Bell,
  Shield,
  Eye,
  Lock,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Settings2,
  Star,
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

/* ─────────── Toggle ─────────── */
function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:ring-offset-1 flex-shrink-0 ${
        checked ? 'bg-[#1E40AF]' : 'bg-[#D1D5DB]'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/* ─────────── Section Card ─────────── */
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  iconColor = '#1E40AF',
  iconBg = '#DBEAFE',
}) {
  return (
    <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-8">
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div>
          <h2 className="font-bold text-[18px] text-[#111827]">{title}</h2>
          {description && <p className="text-[13px] text-[#6B7280] mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─────────── Option Row ─────────── */
function OptionRow({ id, label, description, checked, onChange, disabled = false }) {
  return (
    <div
      className={`flex items-center justify-between py-4 border-b border-[#F3F4F6] last:border-0 ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex-1 pr-4">
        <p className="font-medium text-[14px] text-[#111827]">{label}</p>
        {description && (
          <p className="text-[12px] text-[#6B7280] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <Toggle id={id} checked={checked} onChange={disabled ? () => {} : onChange} />
    </div>
  );
}

/* ─────────── MAIN COMPONENT ─────────── */
export default function ConfiguracionEditor({ usuario }) {
  const router = useRouter();
  const [cursoId, setCursoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [isInstitucion, setIsInstitucion] = useState(false);

  /* ─── Certificado ─── */
  const [otorgaCertificado, setOtorgaCertificado] = useState(false);
  const [criterioLeccionesMin, setCriterioLeccionesMin] = useState(80);
  const [criterioEvalAprobadas, setCriterioEvalAprobadas] = useState(true);
  const [criterioNotaGlobal, setCriterioNotaGlobal] = useState(70);

  /* ─── Acceso ─── */
  const [visibleCatalogo, setVisibleCatalogo] = useState(true);
  const [libreInscripcion, setLibreInscripcion] = useState(true);
  const [requiereAprobacion, setRequiereAprobacion] = useState(false);

  /* ─── Comunicación ─── */
  const [foroActivo, setForoActivo] = useState(true);
  const [permitirComentarios, setPermitirComentarios] = useState(true);

  /* ─── Notificaciones ─── */
  const [notifNuevasLecciones, setNotifNuevasLecciones] = useState(true);
  const [notifRecordatorios, setNotifRecordatorios] = useState(false);

  /* ─── Cargar configuración existente ─── */
  useEffect(() => {
    const id = sessionStorage.getItem('saberhub_curso_id');
    if (id) {
      setCursoId(id);
      fetch(`/api/cursos/${id}`)
        .then((r) => r.json())
        .then((curso) => {
          if (curso) {
            setOtorgaCertificado(curso.otorgaCertificado || false);
            setCriterioLeccionesMin(curso.criterioLeccionesMin || 80);
            setCriterioEvalAprobadas(curso.criterioEvalAprobadas !== false);
            setCriterioNotaGlobal(curso.criterioNotaGlobal || 70);
            if (curso.institucion) setIsInstitucion(true);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /* ─── Guardar configuración ─── */
  const saveConfig = useCallback(async () => {
    if (!cursoId) {
      setSaveError('No hay un curso activo. Ve al paso 1 primero.');
      return false;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otorgaCertificado,
          criterioLeccionesMin: otorgaCertificado ? Number(criterioLeccionesMin) : null,
          criterioEvalAprobadas: otorgaCertificado ? criterioEvalAprobadas : false,
          criterioNotaGlobal: otorgaCertificado ? Number(criterioNotaGlobal) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.message || 'Error al guardar la configuración');
        return false;
      }
      setSavedAt(new Date());
      return true;
    } catch {
      setSaveError('Error de conexión. Intenta de nuevo.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [cursoId, otorgaCertificado, criterioLeccionesMin, criterioEvalAprobadas, criterioNotaGlobal]);

  const handleContinue = useCallback(async () => {
    const ok = await saveConfig();
    if (ok) router.push('/CrearCursos/publicar');
  }, [saveConfig, router]);

  const handleSaveAndExit = useCallback(async () => {
    const ok = await saveConfig();
    if (ok) {
      sessionStorage.removeItem('saberhub_curso_id');
      router.push('/dashboard');
    }
  }, [saveConfig, router]);

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
              href="/CrearCursos/evaluaciones"
              className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] font-medium mb-2 transition-colors w-fit"
            >
              <ArrowLeft size={14} /> Volver a evaluaciones
            </Link>
            <h1 className="font-bold text-[28px] text-[#111827] leading-tight">
              Configuración del curso
            </h1>
            <p className="text-[14px] text-[#6B7280] font-normal mt-1">
              Define las opciones de acceso, certificados y comunicación.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {saveError && (
              <span className="text-[13px] text-[#EF4444] font-medium max-w-[260px] text-right">
                {saveError}
              </span>
            )}
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-2 bg-white border border-[#D1D5DB] px-5 py-3 rounded text-[14px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Guardar como borrador
            </button>
            <button
              onClick={handleSaveAndExit}
              disabled={saving}
              className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-3 rounded text-[14px] font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Guardar y salir
            </button>
            <button
              onClick={handleContinue}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-6 py-3 rounded text-[14px] font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              Continuar → Publicar
            </button>
          </div>
        </div>

        {/* Stepper */}
        <Stepper current={4} />

        {/* No course warning */}
        {!cursoId && (
          <div className="flex items-center gap-2 bg-[#FEF3C7] border border-[#F59E0B] rounded px-4 py-3 mb-6 text-[#92400E] text-[13px] font-medium">
            <AlertCircle size={15} /> No hay un curso activo.{' '}
            <Link href="/CrearCursos" className="underline ml-1">
              Ve al paso 1
            </Link>{' '}
            para crear o continuar uno.
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ══════ LEFT COLUMN ══════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* ── Certificado ── */}
            <SectionCard
              icon={Award}
              title="Certificado de finalización"
              description="Configura si el curso otorga un certificado al completarse."
              iconColor="#7C3AED"
              iconBg="#EDE9FE"
            >
              <OptionRow
                id="config-otorga-cert"
                label="Otorgar certificado al completar"
                description="Los estudiantes recibirán un certificado descargable con firma y código único de verificación."
                checked={otorgaCertificado}
                onChange={setOtorgaCertificado}
              />

              {otorgaCertificado && (
                <div className="mt-6 pl-2 flex flex-col gap-5">
                  <p className="text-[13px] font-semibold text-[#111827] mb-2">
                    Criterios para obtener el certificado:
                  </p>

                  {/* % Lecciones */}
                  <div>
                    <label
                      htmlFor="criterio-lecciones"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Lecciones completadas (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="criterio-lecciones"
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={criterioLeccionesMin}
                        onChange={(e) => setCriterioLeccionesMin(e.target.value)}
                        className="flex-1 h-2 accent-[#1E40AF]"
                      />
                      <span className="w-14 h-10 border border-[#D1D5DB] rounded text-[14px] font-semibold text-[#1E40AF] text-center flex items-center justify-center">
                        {criterioLeccionesMin}%
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6B7280] mt-1">
                      El estudiante debe completar al menos este porcentaje de lecciones.
                    </p>
                  </div>

                  {/* Nota global */}
                  <div>
                    <label
                      htmlFor="criterio-nota"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Nota mínima global (sobre 100)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="criterio-nota"
                        type="number"
                        min={0}
                        max={100}
                        value={criterioNotaGlobal}
                        onChange={(e) => setCriterioNotaGlobal(e.target.value)}
                        className="w-28 h-10 px-3 border border-[#D1D5DB] rounded text-[14px] text-[#111827] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all"
                      />
                    </div>
                  </div>

                  <OptionRow
                    id="criterio-eval"
                    label="Requerir aprobar todas las evaluaciones"
                    description="El estudiante debe aprobar todas las evaluaciones del curso."
                    checked={criterioEvalAprobadas}
                    onChange={setCriterioEvalAprobadas}
                  />
                </div>
              )}
            </SectionCard>

            {/* ── Acceso ── */}
            <SectionCard
              icon={Globe}
              title="Acceso y visibilidad"
              description="Controla quién puede ver e inscribirse en el curso."
              iconColor="#059669"
              iconBg="#D1FAE5"
            >
              <OptionRow
                id="config-visible-catalogo"
                label="Visible en el catálogo público"
                description="El curso aparecerá en las búsquedas y listados de la plataforma."
                checked={visibleCatalogo}
                onChange={setVisibleCatalogo}
              />
              <OptionRow
                id="config-libre-inscripcion"
                label="Inscripción libre"
                description="Cualquier estudiante puede inscribirse sin necesitar aprobación."
                checked={libreInscripcion}
                onChange={(v) => {
                  setLibreInscripcion(v);
                  if (v) setRequiereAprobacion(false);
                }}
              />
              <OptionRow
                id="config-requiere-aprobacion"
                label="Requerir aprobación del instructor"
                description="El instructor debe aceptar cada solicitud de inscripción manualmente."
                checked={requiereAprobacion}
                onChange={(v) => {
                  setRequiereAprobacion(v);
                  if (v) setLibreInscripcion(false);
                }}
              />
              {isInstitucion && (
                <div className="mt-4 flex items-start gap-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded p-4 text-[#312E81]">
                  <Shield size={16} className="text-[#4F46E5] flex-shrink-0 mt-0.5" />
                  <p className="text-[12.5px] leading-relaxed text-[#3730A3]">
                    Al ser un <strong>curso institucional</strong>, la visibilidad y el acceso
                    pueden estar regulados por las políticas de tu institución.
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ── Comunicación ── */}
            <SectionCard
              icon={MessageSquare}
              title="Comunicación"
              description="Configura las herramientas de interacción entre estudiantes e instructores."
              iconColor="#D97706"
              iconBg="#FEF3C7"
            >
              <OptionRow
                id="config-foro"
                label="Activar foro de discusión"
                description="Los estudiantes podrán hacer preguntas y discutir el contenido del curso."
                checked={foroActivo}
                onChange={setForoActivo}
              />
              <OptionRow
                id="config-comentarios"
                label="Permitir comentarios en lecciones"
                description="Los estudiantes pueden dejar comentarios al finalizar cada lección."
                checked={permitirComentarios}
                onChange={setPermitirComentarios}
              />
            </SectionCard>

            {/* ── Notificaciones ── */}
            <SectionCard
              icon={Bell}
              title="Notificaciones"
              description="Define cuándo y cómo se notifica a los inscritos sobre cambios en el curso."
              iconColor="#1E40AF"
              iconBg="#DBEAFE"
            >
              <OptionRow
                id="config-notif-lecciones"
                label="Notificar nuevas lecciones"
                description="Los estudiantes inscritos reciben una notificación cuando se agrega contenido nuevo."
                checked={notifNuevasLecciones}
                onChange={setNotifNuevasLecciones}
              />
              <OptionRow
                id="config-notif-recordatorios"
                label="Recordatorios de inactividad"
                description="Enviar un recordatorio si un estudiante no accede al curso por más de 7 días."
                checked={notifRecordatorios}
                onChange={setNotifRecordatorios}
              />
            </SectionCard>
          </div>

          {/* ══════ RIGHT SIDEBAR ══════ */}
          <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-5 lg:sticky lg:top-24">
            {/* Resumen de configuración */}
            <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-6">
              <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-4">
                Resumen
              </p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    icon: Award,
                    label: 'Certificado',
                    value: otorgaCertificado ? 'Sí, al completar' : 'No',
                    color: otorgaCertificado ? '#059669' : '#6B7280',
                  },
                  {
                    icon: Eye,
                    label: 'Visibilidad',
                    value: visibleCatalogo ? 'Público' : 'Oculto',
                    color: visibleCatalogo ? '#059669' : '#6B7280',
                  },
                  {
                    icon: Users,
                    label: 'Inscripción',
                    value: libreInscripcion
                      ? 'Libre'
                      : requiereAprobacion
                        ? 'Con aprobación'
                        : 'Restringida',
                    color: '#1E40AF',
                  },
                  {
                    icon: MessageSquare,
                    label: 'Foro',
                    value: foroActivo ? 'Activo' : 'Desactivado',
                    color: foroActivo ? '#059669' : '#6B7280',
                  },
                  {
                    icon: Bell,
                    label: 'Notificaciones',
                    value: notifNuevasLecciones ? 'Activadas' : 'Desactivadas',
                    color: notifNuevasLecciones ? '#059669' : '#6B7280',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2 border-b border-[#F9FAFB] last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-[#6B7280] flex-shrink-0" />
                        <span className="text-[13px] text-[#4B5563] font-medium">{item.label}</span>
                      </div>
                      <span className="text-[13px] font-semibold" style={{ color: item.color }}>
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Certificado preview */}
            {otorgaCertificado && (
              <div className="bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] rounded p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={18} className="text-yellow-300" fill="currentColor" />
                  <span className="font-bold text-[14px]">Vista previa del certificado</span>
                </div>
                <div className="bg-white/10 rounded p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={20} className="text-yellow-300" />
                    <span className="font-bold text-[13px]">SABERHUB</span>
                  </div>
                  <p className="text-[11px] text-white/80 mb-1">Certifica que</p>
                  <p className="font-bold text-[14px]">Nombre del Estudiante</p>
                  <p className="text-[11px] text-white/80 mt-1">
                    ha completado exitosamente el curso con
                  </p>
                  <p className="text-[12px] font-semibold mt-0.5">
                    {criterioLeccionesMin}% lecciones · Nota ≥{criterioNotaGlobal}
                    {criterioEvalAprobadas ? ' · Evaluaciones aprobadas' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded p-4">
              <div className="flex items-start gap-2 mb-2">
                <Settings2 size={16} className="text-[#1E40AF] flex-shrink-0 mt-0.5" />
                <span className="font-semibold text-[13px] text-[#1E40AF]">Buenas prácticas</span>
              </div>
              <ul className="flex flex-col gap-1.5 pl-1">
                {[
                  'Activa el certificado para motivar a los estudiantes.',
                  'El foro aumenta el engagement hasta un 40%.',
                  'La inscripción libre maximiza el número de estudiantes.',
                  'Configura criterios de certificado razonables (70-80%).',
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-1.5 text-[12px] text-[#1E3A8A] leading-relaxed"
                  >
                    <span className="text-[#1E40AF] mt-0.5 flex-shrink-0">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Save indicator */}
      {savedAt && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-[#F3F4F6] rounded px-4 py-2 shadow-sm">
          <CheckCircle size={13} className="text-[#10B981]" />
          <span className="text-[12px] text-[#6B7280] font-normal">
            Guardado a las{' '}
            {savedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      <FooterAdmin />
    </div>
  );
}
