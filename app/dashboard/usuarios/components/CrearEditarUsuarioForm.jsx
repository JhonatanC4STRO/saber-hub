'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Eye,
  EyeOff,
  Info,
  Check,
  Lock,
  RefreshCw,
  Shield,
  UserX,
  Trash2,
  ChevronDown,
  Calendar,
  Phone,
  Lightbulb,
  X,
} from 'lucide-react';
import HeaderAdmin from '../../components/HeaderAdmin';
import FooterAdmin from '../../components/FooterAdmin';

/* ─────────────────────── helpers ─────────────────────── */
const ROL_CONFIG = {
  admin: {
    label: 'ADMINISTRADOR',
    bg: '#1E3A8A',
    text: '#FFFFFF',
  },
  instructor: {
    label: 'INSTRUCTOR',
    bg: '#1E40AF',
    text: '#FFFFFF',
  },
  tutor: {
    label: 'TUTOR',
    bg: '#F59E0B',
    text: '#FFFFFF',
  },
  estudiante: {
    label: 'ALUMNO',
    bg: '#6B7280',
    text: '#FFFFFF',
  },
};

function getInitials(nombres, apellidos) {
  const n = (nombres || '').trim();
  const a = (apellidos || '').trim();
  if (!n && !a) return null;
  const first = n[0] || '';
  const second = a[0] || '';
  return (first + second).toUpperCase() || n.substring(0, 2).toUpperCase();
}

function PasswordStrengthBar({ password }) {
  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const colors = ['#EF4444', '#F59E0B', '#EAB308', '#22C55E'];
  const labels = ['Muy débil', 'Débil', 'Moderada', 'Fuerte'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 60,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < strength ? colors[strength - 1] : '#E5E7EB',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>
      {password && (
        <span style={{ fontSize: 11, color: colors[strength - 1] || '#9CA3AF', fontWeight: 500 }}>
          {labels[strength - 1] || ''}
        </span>
      )}
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast.show) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        border: `1px solid ${isSuccess ? '#10B981' : '#EF4444'}`,
        background: isSuccess ? '#ECFDF5' : '#FEF2F2',
        color: isSuccess ? '#065F46' : '#991B1B',
        fontWeight: 600,
        fontSize: 14,
        minWidth: 260,
        maxWidth: 400,
        animation: 'fadeInRight 0.2s ease',
      }}
    >
      {isSuccess ? <Check size={16} /> : <X size={16} />}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          padding: 2,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
export default function CrearEditarUsuarioForm({
  modo = 'crear',
  usuarioInicial = null,
  usuarioSession,
}) {
  const router = useRouter();
  const isEdit = modo === 'editar';

  /* ── Form state ── */
  const [form, setForm] = useState({
    nombres: usuarioInicial?.nombres || '',
    apellidos: usuarioInicial?.apellidos || '',
    tipoDocumento: usuarioInicial?.tipoDocumento || 'Cédula de ciudadanía',
    documento: usuarioInicial?.documento || '',
    telefono: usuarioInicial?.telefono || '',
    fechaNacimiento: usuarioInicial?.fechaNacimiento || '',
    email: usuarioInicial?.email || '',
    rol: usuarioInicial?.rol?.nombre || 'estudiante',
    password: '',
    generarPasswordAuto: true,
    cuentaActiva: usuarioInicial !== null ? (usuarioInicial.activo ?? true) : true,
    marcarEmailVerificado: usuarioInicial?.verificado || false,
    enviarBienvenida: true,
    imagen: usuarioInicial?.imagen || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 5000);
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('La imagen supera el límite de 10 MB', 'error');
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al subir la imagen');
      }

      const data = await response.json();
      handleChange('imagen', data.url);
      showToast('Foto de perfil subida correctamente.');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error al subir la imagen', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  /* ── Computed preview ── */
  const initials = getInitials(form.nombres, form.apellidos);
  const fullName = [form.nombres, form.apellidos].filter(Boolean).join(' ').trim() || null;
  const rolConfig = ROL_CONFIG[form.rol] || ROL_CONFIG.estudiante;
  const isSelf = isEdit && usuarioInicial?.id === usuarioSession?.id;
  const isRoleEditable = usuarioSession?.rol === 'admin' && !isSelf;

  /* ── Handlers ── */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombres.trim()) errs.nombres = 'Este campo es obligatorio';
    if (!form.apellidos.trim()) errs.apellidos = 'Este campo es obligatorio';
    if (!form.documento.trim()) errs.documento = 'Este campo es obligatorio';
    if (!form.email.trim()) {
      errs.email = 'Este campo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Correo electrónico inválido';
    }
    if ((!isEdit && !form.generarPasswordAuto) || (isEdit && changePassword)) {
      if (!form.password) {
        errs.password = 'Este campo es obligatorio';
      } else if (form.password.length < 6) {
        errs.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    if (form.fechaNacimiento) {
      const selectedDate = new Date(form.fechaNacimiento);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        errs.fechaNacimiento = 'La fecha de nacimiento no puede ser en el futuro';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isFormValid =
    form.nombres.trim() &&
    form.apellidos.trim() &&
    form.documento.trim() &&
    form.email.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    (!form.fechaNacimiento || new Date(form.fechaNacimiento) <= new Date()) &&
    (isEdit ? (!changePassword || (form.password && form.password.length >= 6)) : (form.generarPasswordAuto || form.password.length >= 6));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const nombre = [form.nombres, form.apellidos].filter(Boolean).join(' ');
      const body = {
        nombre,
        documento: form.documento,
        email: form.email,
        role: form.rol,
        activo: form.cuentaActiva,
        imagen: form.imagen,
      };
      if (!isEdit && !form.generarPasswordAuto && form.password) {
        body.password = form.password;
      }
      if (!isEdit && form.generarPasswordAuto) {
        // Generate a random password server-side; we send a flag
        body.password = Math.random().toString(36).slice(-10) + 'A1!';
      }
      if (isEdit && changePassword && form.password) {
        body.password = form.password;
      }
      if (form.telefono) body.telefono = form.telefono;

      let response;
      if (isEdit) {
        response = await fetch(isSelf ? '/api/auth/me' : `/api/admin/usuarios/${usuarioInicial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        response = await fetch('/api/admin/crear-usuario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        if (
          data.message?.toLowerCase().includes('correo') ||
          data.message?.toLowerCase().includes('email') ||
          data.error?.toLowerCase().includes('correo') ||
          data.error?.toLowerCase().includes('email')
        ) {
          setErrors((prev) => ({ ...prev, email: data.message || data.error }));
        } else if (data.message?.toLowerCase().includes('documento') || data.error?.toLowerCase().includes('documento')) {
          setErrors((prev) => ({ ...prev, documento: data.message || data.error }));
        } else {
          showToast(data.message || data.error || 'Error al procesar la solicitud', 'error');
        }
      } else {
        showToast(isEdit ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        if (isSelf) {
          setChangePassword(false);
          setForm((prev) => ({ ...prev, password: '' }));
          router.refresh();
        } else {
          const redirectPath = (usuarioSession.rol === 'admin' && !isSelf) ? '/dashboard/usuarios' : '/dashboard';
          setTimeout(() => {
            router.push(redirectPath);
            router.refresh();
          }, 1200);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!usuarioInicial) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/usuarios/${usuarioInicial.id}`, {
        method: !usuarioInicial.activo ? 'PUT' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: !usuarioInicial.activo ? JSON.stringify({ activo: true }) : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al cambiar estado', 'error');
      } else {
        showToast(usuarioInicial.activo ? 'Cuenta desactivada' : 'Cuenta activada');
        router.refresh();
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!usuarioInicial) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/usuarios/${usuarioInicial.id}?hard=true`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al eliminar el usuario', 'error');
      } else {
        showToast('Usuario eliminado permanentemente');
        setTimeout(() => {
          router.push('/dashboard/usuarios');
          router.refresh();
        }, 1200);
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ─────────── STYLES ─────────── */
  const inputBase = {
    height: 44,
    padding: '0 16px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#D1D5DB',
    borderRadius: 4,
    background: '#FFFFFF',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const inputError = { borderColor: '#EF4444' };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 500,
    color: '#4B5563',
    marginBottom: 6,
    display: 'block',
  };

  const errorStyle = {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 400,
    marginTop: 4,
  };

  const sectionTitle = {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 20,
  };

  /* ─── Breadcrumb ─── */
  const breadcrumbParts = isEdit
    ? ['Usuarios', usuarioInicial?.nombre || 'Usuario', 'Editar']
    : ['Usuarios', 'Crear nuevo usuario'];

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <Toast toast={toast} onClose={() => setToast((p) => ({ ...p, show: false }))} />

      <HeaderAdmin usuario={usuarioSession} />

      <main
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '24px 32px 64px',
        }}
      >
        {/* ── Breadcrumb ── */}
        <nav style={{ marginBottom: 16 }} aria-label="Breadcrumb">
          <ol
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            {breadcrumbParts.map((part, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && (
                  <span style={{ color: '#9CA3AF', fontSize: 13, fontWeight: 400 }}>›</span>
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: i === breadcrumbParts.length - 1 ? '#111827' : '#6B7280',
                  }}
                >
                  {i === 0 ? (
                    <Link
                      href="/dashboard/usuarios"
                      style={{ color: '#6B7280', textDecoration: 'none' }}
                    >
                      {part}
                    </Link>
                  ) : (
                    part
                  )}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Page Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <Link
              href="/dashboard/usuarios"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 500,
                color: '#6B7280',
                textDecoration: 'none',
                marginBottom: 8,
              }}
            >
              <ArrowLeft size={15} />
              Volver a usuarios
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: '4px 0 6px' }}>
              {isEdit ? `Editar usuario` : 'Crear nuevo usuario'}
            </h1>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#6B7280', margin: 0 }}>
              {isEdit
                ? `Modifica la información de ${usuarioInicial?.nombre || 'este usuario'}.`
                : 'Completa la información para registrar un nuevo usuario en la plataforma.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/dashboard/usuarios"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 44,
                padding: '0 20px',
                borderRadius: 4,
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="user-form"
              disabled={!isFormValid || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 44,
                padding: '0 24px',
                borderRadius: 4,
                border: 'none',
                background: isFormValid && !loading ? '#1E40AF' : '#1E40AF',
                fontSize: 14,
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: !isFormValid || loading ? 'not-allowed' : 'pointer',
                opacity: !isFormValid || loading ? 0.5 : 1,
                transition: 'opacity 0.15s, background 0.15s',
              }}
            >
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <form
          id="user-form"
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* ═══════════════ LEFT COLUMN ═══════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #F3F4F6',
                borderBottom: '2px solid #1E40AF',
                borderRadius: 4,
                padding: 32,
              }}
            >
              {/* ── Edit: avatar row ── */}
              {isEdit && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                    marginBottom: 32,
                    paddingBottom: 24,
                    borderBottom: '1px solid #F3F4F6',
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: form.imagen ? 'transparent' : (initials ? '#DBEAFE' : '#F3F4F6'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      fontWeight: 700,
                      color: initials ? '#1E40AF' : '#9CA3AF',
                      flexShrink: 0,
                      overflow: 'hidden',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    {form.imagen ? (
                      <img src={form.imagen} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials || '?'
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                      {fullName || 'Nombre del usuario'}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                      {form.email || 'correo@ejemplo.com'}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1E40AF',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                        padding: '4px 0',
                        marginTop: 4,
                        opacity: uploadingImage ? 0.6 : 1,
                      }}
                    >
                      {uploadingImage ? 'Subiendo...' : 'Cambiar foto'}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── Sección 1: Información personal ─── */}
              <h2 style={sectionTitle}>Información personal</h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  columnGap: 16,
                  rowGap: 20,
                }}
              >
                {/* Nombres */}
                <div>
                  <label htmlFor="nombres" style={labelStyle}>
                    Nombres <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="nombres"
                    type="text"
                    aria-required="true"
                    placeholder="Carlos Felipe"
                    value={form.nombres}
                    onChange={(e) => handleChange('nombres', e.target.value)}
                    style={{ ...inputBase, ...(errors.nombres ? inputError : {}) }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1E40AF';
                      e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.nombres ? '#EF4444' : '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {errors.nombres && (
                    <p style={errorStyle} aria-live="polite">
                      {errors.nombres}
                    </p>
                  )}
                </div>

                {/* Apellidos */}
                <div>
                  <label htmlFor="apellidos" style={labelStyle}>
                    Apellidos <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="apellidos"
                    type="text"
                    aria-required="true"
                    placeholder="Méndez Ramírez"
                    value={form.apellidos}
                    onChange={(e) => handleChange('apellidos', e.target.value)}
                    style={{ ...inputBase, ...(errors.apellidos ? inputError : {}) }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1E40AF';
                      e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.apellidos ? '#EF4444' : '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {errors.apellidos && (
                    <p style={errorStyle} aria-live="polite">
                      {errors.apellidos}
                    </p>
                  )}
                </div>

                {/* Tipo de documento */}
                <div>
                  <label htmlFor="tipoDocumento" style={labelStyle}>
                    Tipo de documento
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      id="tipoDocumento"
                      value={form.tipoDocumento}
                      onChange={(e) => handleChange('tipoDocumento', e.target.value)}
                      style={{
                        ...inputBase,
                        appearance: 'none',
                        paddingRight: 40,
                        cursor: 'pointer',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1E40AF';
                        e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D1D5DB';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <option>Cédula de ciudadanía</option>
                      <option>Cédula de extranjería</option>
                      <option>Pasaporte</option>
                      <option>Tarjeta de identidad</option>
                    </select>
                    <ChevronDown
                      size={14}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#1E40AF',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Número de documento */}
                <div>
                  <label htmlFor="documento" style={labelStyle}>
                    Número de documento <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="documento"
                    type="text"
                    aria-required="true"
                    placeholder="1.024.567.890"
                    value={form.documento}
                    onChange={(e) => handleChange('documento', e.target.value)}
                    style={{ ...inputBase, ...(errors.documento ? inputError : {}) }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1E40AF';
                      e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.documento ? '#EF4444' : '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {errors.documento && (
                    <p style={errorStyle} aria-live="polite">
                      {errors.documento}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="telefono" style={labelStyle}>
                    Teléfono
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      height: 44,
                      border: '1px solid #D1D5DB',
                      borderRadius: 4,
                      overflow: 'hidden',
                      background: '#FFFFFF',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocusCapture={(e) => {
                      e.currentTarget.style.borderColor = '#1E40AF';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                    }}
                    onBlurCapture={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        background: '#F9FAFB',
                        borderRight: '1px solid #D1D5DB',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#374151',
                        flexShrink: 0,
                        userSelect: 'none',
                      }}
                    >
                      <Phone size={13} style={{ marginRight: 5, color: '#6B7280' }} />
                      +57
                    </div>
                    <input
                      id="telefono"
                      type="tel"
                      placeholder="300 123 4567"
                      value={form.telefono}
                      onChange={(e) => handleChange('telefono', e.target.value)}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        padding: '0 14px',
                        fontSize: 14,
                        color: '#111827',
                        fontFamily: 'Inter, sans-serif',
                        background: 'transparent',
                      }}
                    />
                  </div>
                </div>

                {/* Fecha de nacimiento */}
                <div>
                  <label htmlFor="fechaNacimiento" style={labelStyle}>
                    Fecha de nacimiento
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="fechaNacimiento"
                      type="date"
                      value={form.fechaNacimiento}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                      style={{ ...inputBase, paddingRight: 40, ...(errors.fechaNacimiento ? inputError : {}) }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1E40AF';
                        e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.fechaNacimiento ? '#EF4444' : '#D1D5DB';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <Calendar
                      size={15}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#1E40AF',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                  {errors.fechaNacimiento && <p style={errorStyle}>{errors.fechaNacimiento}</p>}
                </div>
              </div>

              {/* ─── Sección 2: Información de la cuenta ─── */}
              <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #F3F4F6' }}>
                <h2 style={sectionTitle}>Información de la cuenta</h2>

                {/* Email */}
                <div style={{ marginBottom: 20 }}>
                  <label htmlFor="email" style={labelStyle}>
                    Correo electrónico <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: 44,
                      border: `1px solid ${errors.email ? '#EF4444' : '#D1D5DB'}`,
                      borderRadius: 4,
                      background: isEdit ? '#F9FAFB' : '#FFFFFF',
                      overflow: 'hidden',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocusCapture={(e) => {
                      if (!isEdit) {
                        e.currentTarget.style.borderColor = errors.email ? '#EF4444' : '#1E40AF';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                      }
                    }}
                    onBlurCapture={(e) => {
                      if (!isEdit) {
                        e.currentTarget.style.borderColor = errors.email ? '#EF4444' : '#D1D5DB';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        flexShrink: 0,
                      }}
                    >
                      {isEdit ? (
                        <Lock size={14} style={{ color: '#9CA3AF' }} />
                      ) : (
                        <Mail size={14} style={{ color: '#6B7280' }} />
                      )}
                    </div>
                    <input
                      id="email"
                      type="email"
                      aria-required="true"
                      placeholder="usuario@correo.com"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={isEdit}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        padding: '0 4px 0 0',
                        fontSize: 14,
                        color: isEdit ? '#6B7280' : '#111827',
                        fontFamily: 'Inter, sans-serif',
                        background: 'transparent',
                        cursor: isEdit ? 'not-allowed' : 'text',
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p style={errorStyle} aria-live="polite">
                      {errors.email.includes('registrado') ? (
                        <>
                          {errors.email.split('¿Quieres')[0]}
                          {errors.email.includes('¿Quieres') && (
                            <>
                              ¿Quieres{' '}
                              <Link
                                href="/dashboard/usuarios"
                                style={{ color: '#EF4444', fontWeight: 600 }}
                              >
                                ver el usuario existente
                              </Link>
                              ?
                            </>
                          )}
                        </>
                      ) : (
                        errors.email
                      )}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 5 }}>
                    {isEdit
                      ? 'El email no se puede cambiar después del registro.'
                      : 'Se enviará un correo de verificación a esta dirección.'}
                  </p>
                </div>

                {/* Rol – chips */}
                <div style={{ marginBottom: 20 }}>
                  <label id="rol-label" style={labelStyle}>
                    Rol <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {!isRoleEditable ? (
                      <div
                        style={{
                          padding: '8px 14px',
                           borderRadius: 4,
                           background: rolConfig.bg,
                           color: rolConfig.text,
                           fontSize: 12,
                           fontWeight: 600,
                           letterSpacing: '0.05em',
                           textTransform: 'uppercase',
                           border: '2px solid transparent',
                        }}
                      >
                        {rolConfig.label}
                      </div>
                    ) : (
                      Object.entries(ROL_CONFIG).map(([key, cfg]) => {
                        const isSelected = form.rol === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleChange('rol', key)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 4,
                              background: cfg.bg,
                              color: cfg.text,
                              fontSize: 12,
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              border: isSelected ? '2px solid #1E40AF' : '2px solid transparent',
                              outline: isSelected ? '2px solid #93C5FD' : 'none',
                              outlineOffset: 2,
                              cursor: 'pointer',
                              transition: 'outline 0.1s, transform 0.1s',
                              transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                            }}
                          >
                            {cfg.label}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
                    {!isRoleEditable
                      ? 'No tienes permisos para modificar tu rol.'
                      : 'Define qué puede hacer este usuario en la plataforma.'}
                  </p>
                </div>

                {/* Contraseña */}
                {isEdit ? (
                  <div>
                    {!changePassword ? (
                      <div>
                        <label style={labelStyle}>Contraseña</label>
                        <button
                          type="button"
                          onClick={() => setChangePassword(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 40,
                            padding: '0 16px',
                            borderRadius: 4,
                            border: '1px solid #D1D5DB',
                            background: '#FFFFFF',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#374151',
                            cursor: 'pointer',
                          }}
                        >
                          <RefreshCw size={13} />
                          Restablecer contraseña
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={labelStyle}>Nueva contraseña</label>
                          <button
                            type="button"
                            onClick={() => {
                              setChangePassword(false);
                              handleChange('password', '');
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#EF4444',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 6 caracteres"
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            style={{
                              ...inputBase,
                              paddingRight: 44,
                              ...(errors.password ? inputError : {}),
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#1E40AF';
                              e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = errors.password ? '#EF4444' : '#D1D5DB';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            style={{
                              position: 'absolute',
                              right: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#6B7280',
                              padding: 2,
                            }}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {errors.password && <p style={errorStyle}>{errors.password}</p>}
                        <PasswordStrengthBar password={form.password} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Toggle generar automáticamente */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <label style={labelStyle}>Contraseña temporal</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#4B5563', fontWeight: 500 }}>
                          Generar automáticamente
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={form.generarPasswordAuto}
                          onClick={() =>
                            handleChange('generarPasswordAuto', !form.generarPasswordAuto)
                          }
                          style={{
                            width: 44,
                            height: 24,
                            borderRadius: 12,
                            background: form.generarPasswordAuto ? '#1E40AF' : '#D1D5DB',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background 0.2s',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              position: 'absolute',
                              top: 3,
                              left: form.generarPasswordAuto ? 23 : 3,
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {form.generarPasswordAuto ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: 16,
                          borderRadius: 4,
                          background: '#EFF6FF',
                          borderLeft: '4px solid #1E40AF',
                        }}
                      >
                        <Info size={16} style={{ color: '#1E40AF', marginTop: 1, flexShrink: 0 }} />
                        <p style={{ fontSize: 13, color: '#1E3A8A', margin: 0, lineHeight: 1.6 }}>
                          La contraseña se generará automáticamente y se enviará al correo del
                          usuario junto con un enlace para cambiarla en su primer ingreso.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ position: 'relative' }}>
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 6 caracteres"
                            value={form.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            style={{
                              ...inputBase,
                              paddingRight: 44,
                              ...(errors.password ? inputError : {}),
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#1E40AF';
                              e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.15)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = errors.password ? '#EF4444' : '#D1D5DB';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            style={{
                              position: 'absolute',
                              right: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#6B7280',
                              padding: 2,
                            }}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        {errors.password && <p style={errorStyle}>{errors.password}</p>}
                        <PasswordStrengthBar password={form.password} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── Sección 3: Configuración inicial ─── */}
              <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #F3F4F6' }}>
                <h2 style={sectionTitle}>Configuración inicial</h2>

                {[
                  {
                    key: 'cuentaActiva',
                    label: 'Cuenta activa',
                    desc: 'El usuario podrá iniciar sesión inmediatamente.',
                  },
                  {
                    key: 'marcarEmailVerificado',
                    label: 'Marcar email como verificado',
                    desc: 'Omite el paso de verificación de email.',
                  },
                  {
                    key: 'enviarBienvenida',
                    label: 'Enviar correo de bienvenida',
                    desc: 'El usuario recibirá un email con sus credenciales e instrucciones.',
                  },
                ].map(({ key, label, desc }) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      marginBottom: 20,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ position: 'relative', marginTop: 1, flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) => handleChange(key, e.target.checked)}
                        style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
                      />
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          border: form[key] ? '1px solid #1E40AF' : '1px solid #D1D5DB',
                          background: form[key] ? '#1E40AF' : '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        {form[key] && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{label}</div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* ─── Sección 4 (solo editar): Acciones avanzadas ─── */}
              {isEdit && (
                <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid #F3F4F6' }}>
                  <h2 style={sectionTitle}>Acciones avanzadas</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {!changePassword && (
                      <button
                        type="button"
                        onClick={() => setChangePassword(true)}
                        style={{
                          height: 44,
                          borderRadius: 4,
                          border: '1px solid #D1D5DB',
                          background: '#FFFFFF',
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#374151',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        <RefreshCw size={15} />
                        Restablecer contraseña
                      </button>
                    )}

                    {usuarioSession?.rol === 'admin' && !isSelf && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('rol-label');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{
                            height: 44,
                            borderRadius: 4,
                            border: '1px solid #1E40AF',
                            background: '#FFFFFF',
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#1E40AF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          <Shield size={15} />
                          Cambiar rol
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleStatus}
                          style={{
                            height: 44,
                            borderRadius: 4,
                            border: '1px solid #FCA5A5',
                            background: '#FFFFFF',
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#DC2626',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          <UserX size={15} />
                          {usuarioInicial?.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                        </button>

                        <div>
                          <button
                            type="button"
                            onClick={handleDeleteUser}
                            style={{
                              height: 44,
                              borderRadius: 4,
                              border: 'none',
                              background: '#EF4444',
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#FFFFFF',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              width: '100%',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#DC2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#EF4444')}
                          >
                            <Trash2 size={15} />
                            Eliminar usuario
                          </button>
                          <p
                            style={{
                              fontSize: 12,
                              color: '#9CA3AF',
                              marginTop: 6,
                              textAlign: 'center',
                            }}
                          >
                            Solo disponible si no tiene cursos ni inscripciones.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              position: 'sticky',
              top: 96,
            }}
          >
            {/* Card: Vista previa */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #F3F4F6',
                borderBottom: '2px solid #1E40AF',
                borderRadius: 4,
                padding: 24,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 20,
                  margin: '0 0 20px',
                }}
              >
                VISTA PREVIA
              </p>

              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: initials ? '#DBEAFE' : '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    fontWeight: 700,
                    color: initials ? '#1E40AF' : '#9CA3AF',
                    transition: 'all 0.2s',
                  }}
                >
                  {initials || (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: fullName ? '#111827' : '#9CA3AF',
                    marginTop: 12,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {fullName || 'Nombre del usuario'}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: form.email ? '#6B7280' : '#9CA3AF',
                    marginTop: 4,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {form.email || 'correo@ejemplo.com'}
                </div>

                {/* Chip de rol */}
                <div
                  style={{
                    marginTop: 12,
                    padding: '5px 12px',
                    borderRadius: 4,
                    background: rolConfig.bg,
                    color: rolConfig.text,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s',
                  }}
                >
                  {rolConfig.label}
                </div>
              </div>

              {/* Separator */}
              <div style={{ height: 1, background: '#F3F4F6', margin: '16px 0' }} />

              {/* Data summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  <span style={{ color: '#6B7280' }}>Documento: </span>
                  {form.documento || <span style={{ color: '#9CA3AF' }}>Sin definir</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                  <span style={{ color: '#6B7280' }}>Teléfono: </span>
                  {form.telefono ? (
                    `+57 ${form.telefono}`
                  ) : (
                    <span style={{ color: '#9CA3AF' }}>Sin definir</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span style={{ color: '#6B7280' }}>Cuenta: </span>
                  {form.cuentaActiva ? (
                    <>
                      <Check size={12} style={{ color: '#10B981' }} />
                      <span style={{ color: '#10B981' }}>Activa</span>
                    </>
                  ) : (
                    <span style={{ color: '#6B7280' }}>Inactiva</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card: ¿Cómo funciona? */}
            <div
              style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 4,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Lightbulb size={16} style={{ color: '#1E40AF', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1E40AF', margin: '0 0 8px' }}>
                    ¿Cómo funciona?
                  </p>
                  <ul
                    style={{
                      fontSize: 13,
                      color: '#1E3A8A',
                      lineHeight: 1.7,
                      margin: 0,
                      padding: '0 0 0 16px',
                    }}
                  >
                    <li>Se generará una contraseña temporal segura</li>
                    <li>Se enviará un correo al usuario</li>
                    <li>Deberá cambiar contraseña en el primer ingreso</li>
                    <li>Se registrará en los logs de auditoría</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Card: Estado de campos requeridos */}
            <div
              style={{
                background: '#FAFAFA',
                border: '1px solid #F3F4F6',
                borderRadius: 4,
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 12px',
                }}
              >
                Campos requeridos
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Nombres', filled: !!form.nombres.trim() },
                  { label: 'Apellidos', filled: !!form.apellidos.trim() },
                  { label: 'Documento', filled: !!form.documento.trim() },
                  {
                    label: 'Email',
                    filled: !!form.email.trim() && /\S+@\S+\.\S+/.test(form.email),
                  },
                  {
                    label: 'Contraseña',
                    filled: isEdit || form.generarPasswordAuto || form.password.length >= 6,
                    skip: isEdit || form.generarPasswordAuto,
                    skipLabel: isEdit ? '—' : 'Auto',
                  },
                ].map(({ label, filled, skip, skipLabel }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: skip ? '#E5E7EB' : filled ? '#10B981' : '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.2s',
                      }}
                    >
                      {(skip || filled) && (
                        <Check size={9} color={skip ? '#9CA3AF' : '#FFFFFF'} strokeWidth={3} />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: skip ? '#9CA3AF' : filled ? '#111827' : '#6B7280',
                        fontWeight: filled ? 500 : 400,
                      }}
                    >
                      {label}{' '}
                      {skip && skipLabel && (
                        <span style={{ fontStyle: 'italic', fontSize: 11 }}>({skipLabel})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </main>

      <FooterAdmin />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 900px) {
          form[id="user-form"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
