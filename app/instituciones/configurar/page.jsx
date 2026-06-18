'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfigurarAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    documento: '',
    password: '',
    passwordConfirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!token) {
        throw new Error('Token no válido');
      }

      const res = await fetch(`/api/instituciones/admin/configurar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al configurar la cuenta');
        return;
      }

      setExito(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.titulo}>Token inválido</h2>
          <p style={styles.subtitulo}>El link de invitación no es válido o ha expirado.</p>
          <Link href="/" style={styles.btnPrimario}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.titulo}>¡Cuenta creada!</h2>
          <p style={styles.subtitulo}>
            Tu cuenta de administrador ha sido creada exitosamente. Redirigiendo al login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.titulo}>Configurar administrador institucional</h1>
          <p style={styles.subtitulo}>
            Complete el formulario para crear su cuenta de administrador
          </p>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.campo}>
            <label style={styles.label} htmlFor="nombre">
              Nombre completo <span style={styles.requerido}>*</span>
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre completo"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label} htmlFor="email">
              Correo electrónico <span style={styles.requerido}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label} htmlFor="documento">
              Documento <span style={styles.requerido}>*</span>
            </label>
            <input
              id="documento"
              name="documento"
              type="text"
              value={form.documento}
              onChange={handleChange}
              placeholder="Cédula o documento"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label} htmlFor="password">
              Contraseña <span style={styles.requerido}>*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              required
              style={styles.input}
            />
            <span style={styles.ayuda}>Debe tener al menos 8 caracteres</span>
          </div>

          <div style={styles.campo}>
            <label style={styles.label} htmlFor="passwordConfirm">
              Confirmar contraseña <span style={styles.requerido}>*</span>
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              value={form.passwordConfirm}
              onChange={handleChange}
              placeholder="Repita su contraseña"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.accionesFooter}>
            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.btnDeshabilitado : styles.btnPrimario}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '32px 16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '500px',
    padding: '40px',
  },
  header: {
    marginBottom: '32px',
  },
  titulo: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  subtitulo: {
    fontSize: '15px',
    color: '#6b7280',
    margin: '0',
    lineHeight: '1.6',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  requerido: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  ayuda: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '24px',
  },
  accionesFooter: {
    paddingTop: '8px',
  },
  btnPrimario: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'background-color 0.15s',
  },
  btnDeshabilitado: {
    backgroundColor: '#93c5fd',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#d1fae5',
    color: '#059669',
    fontSize: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
};
