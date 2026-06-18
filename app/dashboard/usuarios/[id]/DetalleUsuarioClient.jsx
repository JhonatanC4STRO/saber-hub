'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Pencil,
  MoreVertical,
  CheckCircle,
  User,
  Phone,
  CreditCard,
  Calendar,
  BookOpen,
  Users,
  Star,
  Award,
  Lock,
  RefreshCw,
  Shield,
  Ban,
  Trash2,
  BookMarked,
  Activity,
  Settings,
  FileText,
  LogIn,
  Upload,
  BarChart2,
  ChevronDown,
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';

/* ──────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */
function timeAgo(isoString) {
  if (!isoString) return 'Nunca';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Hace un momento';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Hace ${days} días`;
  return new Date(isoString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function initials(nombre) {
  if (!nombre) return '??';
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/* ──────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────── */
function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white border border-[#F3F4F6] rounded-[4px] border-b-2 border-b-[#1E40AF] ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({ color = 'blue', children }) {
  const colors = {
    blue: 'bg-[#1E40AF] text-white',
    green: 'bg-[#10B981] text-white',
    greenLight: 'bg-[#D1FAE5] text-[#065F46]',
    gray: 'bg-[#F3F4F6] text-[#4B5563]',
    yellow: 'bg-[#FEF3C7] text-[#92400E]',
    red: 'bg-[#FEE2E2] text-[#DC2626]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-[10px] py-[4px] rounded-[4px] font-semibold text-[11px] uppercase tracking-wide ${colors[color]}`}
    >
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-[4px] p-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full border-[3px] border-[#1E40AF] bg-white flex items-center justify-center">
        <Icon size={18} className="text-[#1E40AF]" />
      </div>
      <div>
        <p className="font-bold text-[28px] text-[#111827] leading-none">{value}</p>
        <p className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}

function ActivityItem({ icon: Icon, action, detail, timestamp }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors -mx-6 px-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#1E40AF] bg-white flex items-center justify-center mt-0.5">
        <Icon size={14} className="text-[#1E40AF]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-[#111827] font-medium">
          {action} {detail && <span className="font-semibold text-[#111827]">"{detail}"</span>}
        </p>
        <p className="text-[12px] text-[#6B7280] mt-0.5">{timestamp}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, children, variant = 'secondary', onClick, className = '' }) {
  const base =
    'w-full h-11 flex items-center gap-3 px-4 rounded-[4px] font-semibold text-[14px] transition-colors cursor-pointer text-left';
  const variants = {
    secondary: 'bg-white border border-[#D1D5DB] text-[#111827] hover:bg-[#F9FAFB]',
    dangerOutline: 'bg-white border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2]',
    danger: 'bg-[#EF4444] border border-[#EF4444] text-white hover:bg-[#DC2626]',
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      <Icon size={16} />
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────
   TABS
────────────────────────────────────────────── */
const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'cursos', label: 'Cursos', badge: null },
  { key: 'certificados', label: 'Certificados', badge: null },
  { key: 'actividad', label: 'Actividad' },
  { key: 'permisos', label: 'Permisos' },
  { key: 'logs', label: 'Logs' },
];

/* ──────────────────────────────────────────────
   MODAL CONFIRMACION
────────────────────────────────────────────── */
function ConfirmModal({ open, onClose, onConfirm, title, description, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-[8px] w-full max-w-[400px] mx-4 shadow-xl">
        <div className="p-6">
          <h3 className="font-bold text-[18px] text-[#111827] mb-2">{title}</h3>
          <p className="text-[14px] text-[#4B5563] leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#D1D5DB] rounded-[4px] font-semibold text-[14px] text-[#111827] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-[4px] font-semibold text-[14px] transition-colors ${
              danger
                ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                : 'bg-[#1E40AF] text-white hover:bg-[#1A368F]'
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────── */
export default function DetalleUsuarioClient({ usuario, usuarioSession }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('resumen');
  const [cuentaActiva, setCuentaActiva] = useState(usuario.activo);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null); // { title, description, danger, action }
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);

  const tabs = TABS.map((t) => {
    if (t.key === 'cursos') return { ...t, badge: usuario.totalCursos };
    if (t.key === 'certificados') return { ...t, badge: usuario.certificadosEmitidos };
    return t;
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleToggleActive() {
    const newState = !cuentaActiva;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${usuario.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: newState }),
      });
      if (res.ok) {
        setCuentaActiva(newState);
        showToast(newState ? 'Cuenta activada correctamente.' : 'Cuenta desactivada.');
      } else {
        showToast('Error al actualizar el estado.', 'error');
      }
    } catch {
      showToast('Error de conexión.', 'error');
    }
    setLoading(false);
  }

  function openModal(config) {
    setDropdownOpen(false);
    setModal(config);
  }

  async function executeModalAction() {
    if (!modal?.action) {
      setModal(null);
      return;
    }
    setLoading(true);
    try {
      await modal.action();
      showToast('Acción ejecutada correctamente.');
    } catch {
      showToast('Error al ejecutar la acción.', 'error');
    }
    setLoading(false);
    setModal(null);
  }

  const rolNombre = usuario.rol?.nombre || 'estudiante';
  const isInstructor = rolNombre === 'instructor';
  const hasNoCourses = usuario.totalCursos === 0 && usuario.totalInscripciones === 0;

  /* ── Actividad mock basada en logs reales ── */
  const actividadItems =
    usuario.logsAuditoria.length > 0
      ? usuario.logsAuditoria.slice(0, 5).map((log) => ({
          icon: Activity,
          action: log.accion,
          detail: log.tabla,
          timestamp: timeAgo(log.fecha),
        }))
      : [
          {
            icon: LogIn,
            action: 'Inició sesión',
            detail: null,
            timestamp: timeAgo(usuario.ultimoLogin),
          },
          {
            icon: Upload,
            action: 'Actualizó su perfil',
            detail: null,
            timestamp: 'Hace 1 día',
          },
        ];

  return (
    <>
      <HeaderAdmin usuario={usuarioSession} />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-[6px] shadow-lg font-semibold text-[14px] transition-all ${
            toast.type === 'error' ? 'bg-[#EF4444] text-white' : 'bg-[#10B981] text-white'
          }`}
        >
          {toast.type === 'error' ? <Ban size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!modal}
        onClose={() => setModal(null)}
        onConfirm={executeModalAction}
        title={modal?.title || ''}
        description={modal?.description || ''}
        danger={modal?.danger}
      />

      <main className="bg-white min-h-screen">
        <div className="max-w-[1280px] mx-auto px-8 py-6">
          {/* ── Breadcrumb + Acciones ── */}
          <div className="mb-6">
            <nav aria-label="breadcrumb" className="mb-3">
              <p className="text-[13px] font-medium text-[#6B7280]">
                <Link href="/dashboard/usuarios" className="hover:text-[#1E40AF] transition-colors">
                  Usuarios
                </Link>
                {' > '}
                <span className="font-semibold text-[#111827]">{usuario.nombre}</span>
              </p>
            </nav>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Link
                href="/dashboard/usuarios"
                className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#111827] text-[14px] font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Volver a usuarios
              </Link>
              <div className="flex items-center gap-2">
                <button
                  id="btn-enviar-mensaje"
                  className="flex items-center gap-2 bg-white border border-[#D1D5DB] px-5 py-3 rounded-[4px] font-semibold text-[14px] text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                >
                  <Mail size={16} className="text-[#1E40AF]" />
                  Enviar mensaje
                </button>
                <Link
                  href={`/dashboard/usuarios/${usuario.id}/editar`}
                  id="btn-editar-usuario"
                  className="flex items-center gap-2 bg-white border border-[#D1D5DB] px-5 py-3 rounded-[4px] font-semibold text-[14px] text-[#111827] hover:bg-[#F9FAFB] transition-colors"
                >
                  <Pencil size={16} className="text-[#1E40AF]" />
                  Editar
                </Link>
                {/* Dropdown ⋮ */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="btn-mas-opciones"
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="w-11 h-11 flex items-center justify-center bg-white border border-[#D1D5DB] rounded-[4px] hover:bg-[#F9FAFB] transition-colors"
                    aria-label="Más opciones"
                  >
                    <MoreVertical size={18} className="text-[#1E40AF]" />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-12 w-52 bg-white border border-[#E5E7EB] rounded-[6px] shadow-lg z-50 overflow-hidden">
                      {[
                        {
                          label: 'Restablecer contraseña',
                          icon: Lock,
                          action: () =>
                            openModal({
                              title: 'Restablecer contraseña',
                              description: `Se enviará un correo a ${usuario.email} con instrucciones para restablecer su contraseña.`,
                              danger: false,
                              action: async () => {
                                await fetch(`/api/admin/usuarios/${usuario.id}/reset-password`, {
                                  method: 'POST',
                                });
                              },
                            }),
                        },
                        {
                          label: 'Cambiar rol',
                          icon: RefreshCw,
                          action: () =>
                            openModal({
                              title: 'Cambiar rol',
                              description:
                                'Esta funcionalidad está disponible desde el formulario de edición de usuario.',
                              danger: false,
                              action: null,
                            }),
                        },
                        {
                          label: 'Desactivar cuenta',
                          icon: Ban,
                          action: () =>
                            openModal({
                              title: 'Desactivar cuenta',
                              description: `¿Estás seguro de que deseas desactivar la cuenta de ${usuario.nombre}? El usuario no podrá iniciar sesión.`,
                              danger: true,
                              action: async () => {
                                await fetch(`/api/admin/usuarios/${usuario.id}/estado`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ activo: false }),
                                });
                                setCuentaActiva(false);
                              },
                            }),
                        },
                        {
                          label: 'Eliminar usuario',
                          icon: Trash2,
                          action: () =>
                            openModal({
                              title: 'Eliminar usuario',
                              description: `¿Estás seguro de que deseas eliminar permanentemente a ${usuario.nombre}? Esta acción no se puede deshacer.`,
                              danger: true,
                              action: async () => {
                                await fetch(`/api/admin/usuarios/${usuario.id}`, {
                                  method: 'DELETE',
                                });
                                router.push('/dashboard/usuarios');
                              },
                            }),
                        },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[14px] text-[#111827] hover:bg-[#F9FAFB] transition-colors text-left"
                        >
                          <item.icon size={15} className="text-[#6B7280]" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 1: Tarjeta de perfil principal ── */}
          <Card className="mb-6 p-8">
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-[#DBEAFE] flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                  {usuario.imagen ? (
                    <img
                      src={usuario.imagen}
                      alt={usuario.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-[36px] text-[#1E40AF]">
                      {initials(usuario.nombre)}
                    </span>
                  )}
                </div>
              </div>

              {/* Info central */}
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-[28px] text-[#111827] leading-tight">
                  {usuario.nombre}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge color="blue">{rolNombre}</Badge>
                  {usuario.verificado && (
                    <Badge color="green">
                      <CheckCircle size={11} />
                      Verificado
                    </Badge>
                  )}
                  <Badge color={cuentaActiva ? 'greenLight' : 'gray'}>
                    {cuentaActiva ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {[
                    { icon: Mail, text: usuario.email },
                    { icon: Phone, text: usuario.telefono || '+57 — sin registrar' },
                    { icon: CreditCard, text: `CC ${usuario.documento || '—'}` },
                    {
                      icon: Calendar,
                      text: `Registrado: ${formatDate(usuario.fechaRegistro)}`,
                    },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Icon size={15} className="text-[#6B7280] flex-shrink-0" />
                      <span className="font-medium text-[14px] text-[#4B5563] truncate">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lado derecho: estado y toggle */}
              <div className="flex-shrink-0 flex flex-col items-end gap-4 min-w-[160px]">
                <div className="text-right">
                  <p className="font-medium text-[11px] text-[#6B7280] uppercase tracking-wide">
                    Última conexión
                  </p>
                  <p
                    className={`font-semibold text-[16px] mt-1 ${
                      usuario.ultimoLogin ? 'text-[#10B981]' : 'text-[#6B7280]'
                    }`}
                  >
                    {timeAgo(usuario.ultimoLogin)}
                  </p>
                </div>

                {/* Toggle */}
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[13px] text-[#4B5563]">Cuenta activa</span>
                  <button
                    onClick={handleToggleActive}
                    disabled={loading}
                    aria-label={cuentaActiva ? 'Desactivar cuenta' : 'Activar cuenta'}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:ring-offset-2 ${
                      cuentaActiva ? 'bg-[#1E40AF]' : 'bg-[#D1D5DB]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        cuentaActiva ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* ── SECCIÓN 2: Tabs ── */}
          <div className="border-b border-[#F3F4F6] mb-6 overflow-x-auto">
            <nav className="flex gap-0" role="tablist" aria-label="Secciones del usuario">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  id={`tab-${tab.key}`}
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 font-semibold text-[14px] whitespace-nowrap border-b-[3px] -mb-px transition-colors ${
                    activeTab === tab.key
                      ? 'text-[#1E40AF] border-[#1E40AF]'
                      : 'text-[#6B7280] border-transparent hover:text-[#111827]'
                  }`}
                >
                  {tab.label}
                  {tab.badge != null && (
                    <span className="bg-[#F3F4F6] text-[#4B5563] px-2 py-0.5 rounded-[4px] font-semibold text-[11px]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* ── CONTENIDO TABS ── */}

          {/* TAB: RESUMEN */}
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.65fr] gap-6">
              {/* Columna izquierda */}
              <div className="flex flex-col gap-6">
                {/* Estadísticas */}
                <Card className="p-6">
                  <h2 className="font-bold text-[18px] text-[#111827] mb-4">Estadísticas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard icon={BookOpen} value={usuario.totalCursos} label="Cursos creados" />
                    <StatCard
                      icon={Users}
                      value={usuario.alumnosInscritos}
                      label="Alumnos inscritos"
                    />
                    <StatCard icon={Star} value="—" label="Calificación" />
                    <StatCard
                      icon={Award}
                      value={usuario.certificadosEmitidos}
                      label="Certificados emitidos"
                    />
                  </div>
                </Card>

                {/* Información personal */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-[18px] text-[#111827]">Información personal</h2>
                    <Link
                      href={`/dashboard/usuarios/${usuario.id}/editar`}
                      className="font-semibold text-[14px] text-[#1E40AF] hover:underline"
                    >
                      Editar
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { label: 'TIPO DE DOCUMENTO', value: 'Cédula de ciudadanía' },
                      {
                        label: 'NÚMERO DE DOCUMENTO',
                        value: usuario.documento || '—',
                      },
                      { label: 'TELÉFONO', value: usuario.telefono || '—' },
                      { label: 'EMAIL', value: usuario.email },
                      {
                        label: 'FECHA DE REGISTRO',
                        value: formatDate(usuario.fechaRegistro),
                      },
                      { label: 'ROL', value: rolNombre },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="font-medium text-[11px] text-[#6B7280] uppercase tracking-wide">
                          {label}
                        </p>
                        <p className="font-medium text-[14px] text-[#111827] mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Bio */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-[18px] text-[#111827]">
                      Sobre {usuario.nombre.split(' ')[0]}
                    </h2>
                    <Link
                      href={`/dashboard/usuarios/${usuario.id}/editar`}
                      className="font-semibold text-[14px] text-[#1E40AF] hover:underline"
                    >
                      Editar
                    </Link>
                  </div>
                  <p className="font-normal text-[14px] text-[#4B5563] leading-[1.6]">
                    {isInstructor
                      ? 'Instructor registrado en SABERHUB. Ha creado y publicado cursos para la plataforma.'
                      : 'Estudiante activo en la plataforma SABERHUB con acceso a cursos y recursos de aprendizaje.'}
                  </p>
                </Card>
              </div>

              {/* Columna derecha */}
              <div className="flex flex-col gap-4">
                {/* Info de cuenta */}
                <Card className="p-6">
                  <h2 className="font-bold text-[18px] text-[#111827] mb-4">Cuenta</h2>
                  <div className="flex flex-col divide-y divide-[#F3F4F6]">
                    {[
                      {
                        label: 'EMAIL',
                        value: (
                          <span className="flex items-center gap-2">
                            <span className="text-[#111827]">{usuario.email}</span>
                            {usuario.verificado && (
                              <span className="bg-[#D1FAE5] text-[#065F46] text-[10px] font-semibold px-2 py-0.5 rounded-[4px] uppercase">
                                Verificado
                              </span>
                            )}
                          </span>
                        ),
                      },
                      {
                        label: 'ROL',
                        value: (
                          <span className="flex items-center gap-2">
                            <Badge color="blue">{rolNombre}</Badge>
                            <Link
                              href={`/dashboard/usuarios/${usuario.id}/editar`}
                              className="text-[#1E40AF] text-[12px] font-semibold hover:underline"
                            >
                              Cambiar
                            </Link>
                          </span>
                        ),
                      },
                      {
                        label: 'FECHA REGISTRO',
                        value: formatDate(usuario.fechaRegistro),
                      },
                      {
                        label: 'ÚLTIMA ACTIVIDAD',
                        value: (
                          <span className="text-[#10B981] font-semibold">
                            {timeAgo(usuario.ultimoLogin)}
                          </span>
                        ),
                      },
                      {
                        label: 'ESTADO',
                        value: cuentaActiva ? (
                          <span className="text-[#10B981] font-semibold">Activa</span>
                        ) : (
                          <span className="text-[#DC2626] font-semibold">Inactiva</span>
                        ),
                      },
                      {
                        label: 'CUENTA BLOQUEADA',
                        value: 'No',
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between py-2.5 hover:bg-[#F9FAFB] -mx-6 px-6 transition-colors"
                      >
                        <span className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
                          {label}
                        </span>
                        <span className="font-medium text-[14px] text-[#111827]">{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Acciones */}
                <Card className="p-6">
                  <h2 className="font-bold text-[18px] text-[#111827] mb-4">Acciones</h2>
                  <div className="flex flex-col gap-1.5">
                    <ActionButton
                      icon={Lock}
                      onClick={() =>
                        openModal({
                          title: 'Restablecer contraseña',
                          description: `Se enviará un correo a ${usuario.email} con instrucciones para restablecer su contraseña.`,
                          danger: false,
                          action: async () => {
                            await fetch(`/api/admin/usuarios/${usuario.id}/reset-password`, {
                              method: 'POST',
                            });
                          },
                        })
                      }
                    >
                      Restablecer contraseña
                    </ActionButton>
                    <ActionButton
                      icon={RefreshCw}
                      onClick={() =>
                        openModal({
                          title: 'Cambiar rol',
                          description:
                            'Redirigiendo al formulario de edición para cambiar el rol del usuario.',
                          danger: false,
                          action: null,
                        })
                      }
                    >
                      Cambiar rol
                    </ActionButton>
                    <ActionButton
                      icon={Mail}
                      onClick={() =>
                        openModal({
                          title: 'Enviar correo de verificación',
                          description: `Se enviará un correo de verificación a ${usuario.email}.`,
                          danger: false,
                          action: async () => {
                            await fetch(`/api/admin/usuarios/${usuario.id}/enviar-verificacion`, {
                              method: 'POST',
                            });
                          },
                        })
                      }
                    >
                      Enviar correo de verificación
                    </ActionButton>
                    <ActionButton
                      icon={Ban}
                      variant="dangerOutline"
                      onClick={() =>
                        openModal({
                          title: 'Desactivar cuenta',
                          description: `¿Estás seguro de que deseas desactivar la cuenta de ${usuario.nombre}? El usuario no podrá iniciar sesión mientras esté desactivada.`,
                          danger: true,
                          action: async () => {
                            await fetch(`/api/admin/usuarios/${usuario.id}/estado`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ activo: false }),
                            });
                            setCuentaActiva(false);
                          },
                        })
                      }
                    >
                      Desactivar cuenta
                    </ActionButton>
                    <ActionButton
                      icon={Trash2}
                      variant="danger"
                      onClick={() =>
                        openModal({
                          title: 'Eliminar usuario',
                          description: `¿Estás seguro de que deseas eliminar permanentemente a ${usuario.nombre}? Esta acción NO se puede deshacer y se perderán todos sus datos.`,
                          danger: true,
                          action: async () => {
                            await fetch(`/api/admin/usuarios/${usuario.id}`, {
                              method: 'DELETE',
                            });
                            router.push('/dashboard/usuarios');
                          },
                        })
                      }
                    >
                      Eliminar usuario
                    </ActionButton>
                    {!hasNoCourses && (
                      <p className="text-[12px] text-[#6B7280] mt-1 text-center">
                        La eliminación solo está disponible si el usuario no tiene cursos ni
                        inscripciones.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB: CURSOS */}
          {activeTab === 'cursos' && (
            <div>
              <Card className="p-6">
                <h2 className="font-bold text-[18px] text-[#111827] mb-4">
                  Cursos ({usuario.totalCursos})
                </h2>
                {usuario.cursosCreados.length === 0 ? (
                  <div className="text-center py-12 text-[#6B7280]">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-[14px]">Este usuario no ha creado cursos.</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#F3F4F6]">
                    {usuario.cursosCreados.map((curso) => (
                      <div
                        key={curso.id}
                        className="flex items-center justify-between py-3 hover:bg-[#F9FAFB] -mx-6 px-6 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-[14px] text-[#111827]">{curso.titulo}</p>
                          <p className="text-[12px] text-[#6B7280] mt-0.5">
                            {formatDate(curso.creado)} · {curso.inscritos} inscritos
                          </p>
                        </div>
                        <Badge
                          color={
                            curso.estado === 'publicado'
                              ? 'greenLight'
                              : curso.estado === 'archivado'
                                ? 'gray'
                                : 'yellow'
                          }
                        >
                          {curso.estado}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB: CERTIFICADOS */}
          {activeTab === 'certificados' && (
            <Card className="p-6">
              <h2 className="font-bold text-[18px] text-[#111827] mb-4">
                Certificados emitidos ({usuario.certificadosEmitidos})
              </h2>
              <div className="text-center py-12 text-[#6B7280]">
                <Award size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-medium text-[14px]">
                  {usuario.certificadosEmitidos === 0
                    ? 'No se han emitido certificados aún.'
                    : `${usuario.certificadosEmitidos} certificados emitidos para los estudiantes de sus cursos.`}
                </p>
              </div>
            </Card>
          )}

          {/* TAB: ACTIVIDAD */}
          {activeTab === 'actividad' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[18px] text-[#111827]">Actividad reciente</h2>
                <button className="font-semibold text-[14px] text-[#1E40AF] hover:underline">
                  Ver todo →
                </button>
              </div>
              {actividadItems.length === 0 ? (
                <div className="text-center py-12 text-[#6B7280]">
                  <Activity size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium text-[14px]">Sin actividad registrada.</p>
                </div>
              ) : (
                actividadItems.map((item, i) => <ActivityItem key={i} {...item} />)
              )}
            </Card>
          )}

          {/* TAB: PERMISOS */}
          {activeTab === 'permisos' && (
            <Card className="p-6">
              <h2 className="font-bold text-[18px] text-[#111827] mb-4">Permisos</h2>
              <div className="flex items-center gap-4 py-4 bg-[#F9FAFB] rounded-[4px] px-4">
                <Shield size={32} className="text-[#1E40AF]" />
                <div>
                  <p className="font-semibold text-[15px] text-[#111827]">Rol: {rolNombre}</p>
                  <p className="text-[13px] text-[#6B7280] mt-0.5">
                    Los permisos se gestionan a través de los roles del sistema. Para cambiar los
                    permisos, cambia el rol del usuario.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* TAB: LOGS */}
          {activeTab === 'logs' && (
            <Card className="p-6">
              <h2 className="font-bold text-[18px] text-[#111827] mb-4">Logs de auditoría</h2>
              {usuario.logsAuditoria.length === 0 ? (
                <div className="text-center py-12 text-[#6B7280]">
                  <FileText size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="font-medium text-[14px]">Sin logs registrados.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-[#F3F4F6]">
                  {usuario.logsAuditoria.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between py-3 hover:bg-[#F9FAFB] -mx-6 px-6 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-[14px] text-[#111827]">
                          {log.accion}
                          {log.tabla && (
                            <span className="font-normal text-[#6B7280]"> → {log.tabla}</span>
                          )}
                        </p>
                        {log.ip && (
                          <p className="text-[12px] text-[#9CA3AF] mt-0.5">IP: {log.ip}</p>
                        )}
                      </div>
                      <span className="text-[12px] text-[#6B7280] whitespace-nowrap ml-4">
                        {timeAgo(log.fecha)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ── Actividad reciente (al final del tab Resumen, ancho completo) ── */}
          {activeTab === 'resumen' && (
            <Card className="p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[18px] text-[#111827]">Actividad reciente</h2>
                <button
                  onClick={() => setActiveTab('actividad')}
                  className="font-semibold text-[14px] text-[#1E40AF] hover:underline"
                >
                  Ver todo →
                </button>
              </div>
              {actividadItems.map((item, i) => (
                <ActivityItem key={i} {...item} />
              ))}
            </Card>
          )}
        </div>
      </main>

      <FooterAdmin />
    </>
  );
}
