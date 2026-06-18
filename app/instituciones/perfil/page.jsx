'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditarPerfil() {
  const router = useRouter();
  const [institucion, setInstitucion] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    cargarInstitucion();
  }, []);

  const cargarInstitucion = async () => {
    try {
      const resUsuario = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (resUsuario.status === 401) {
        router.push('/login');
        return;
      }

      const usuario = await resUsuario.json();
      if (!usuario.institucionId) {
        router.push('/');
        return;
      }

      const res = await fetch(`/api/instituciones/${usuario.institucionId}`);
      if (!res.ok) throw new Error('Error al cargar institución');
      const inst = await res.json();
      setInstitucion(inst);
      setForm({
        nombre: inst.nombre || '',
        descripcion: inst.descripcion || '',
        url: inst.url || '',
        logoUrl: inst.logoUrl || '',
        telefono: inst.telefono || '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setGuardando(true);

    try {
      const res = await fetch(`/api/instituciones/${institucion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar');
      }

      setExito('Perfil actualizado exitosamente');
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading)
    return (
      <div style={styles.page}>
        <p>Cargando...</p>
      </div>
    );
  if (!institucion)
    return (
      <div style={styles.page}>
        <p>Institución no encontrada</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <Link href="/instituciones/dashboard" style={styles.back}>
            ← Volver
          </Link>
          <h1 style={styles.titulo}>Editar perfil de la institución</h1>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}
        {exito && <div style={styles.exitoBanner}>{exito}</div>}

        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.campo}>
              <label style={styles.label} htmlFor="nombre">
                Nombre de la institución
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label} htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={4}
                style={styles.textarea}
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label} htmlFor="url">
                Sitio web
              </label>
              <input
                id="url"
                name="url"
                type="url"
                value={form.url}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label} htmlFor="logoUrl">
                URL del logo
              </label>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                value={form.logoUrl}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label} htmlFor="telefono">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={form.telefono}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.acciones}>
              <button
                type="submit"
                disabled={guardando}
                style={guardando ? styles.btnDeshabilitado : styles.btnPrimario}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '24px 16px',
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  back: {
    color: '#1a56db',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  titulo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    margin: '12px 0 0 0',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
  },
  exitoBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#047857',
    fontSize: '14px',
    marginBottom: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  input: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  acciones: {
    marginTop: '12px',
  },
  btnPrimario: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnDeshabilitado: {
    backgroundColor: '#93c5fd',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
};
