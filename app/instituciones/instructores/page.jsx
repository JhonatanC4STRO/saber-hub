'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GestionarInstructores() {
  const router = useRouter();
  const [institucionId, setInstitucionId] = useState(null);
  const [correo, setCorreo] = useState('');
  const [invitaciones, setInvitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
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

      setInstitucionId(usuario.institucionId);
      cargarInvitaciones(usuario.institucionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarInvitaciones = async (instId) => {
    try {
      const res = await fetch(`/api/instituciones/${instId}/invitar-instructor`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setInvitaciones(data.invitaciones || []);
      }
    } catch (err) {
      console.error('Error al cargar invitaciones:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');
    setEnviando(true);

    try {
      const res = await fetch(`/api/instituciones/${institucionId}/invitar-instructor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ correo }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar invitación');
      }

      setExito('Invitación enviada exitosamente');
      setCorreo('');
      cargarInvitaciones(institucionId);
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading)
    return (
      <div style={styles.page}>
        <p>Cargando...</p>
      </div>
    );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <Link href="/instituciones/dashboard" style={styles.back}>
            ← Volver
          </Link>
          <h1 style={styles.titulo}>Gestionar instructores</h1>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}
        {exito && <div style={styles.exitoBanner}>{exito}</div>}

        <div style={styles.card}>
          <h2 style={styles.seccionTitulo}>Invitar nuevo instructor</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.campo}>
              <label style={styles.label} htmlFor="correo">
                Correo electrónico del instructor
              </label>
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="instructor@ejemplo.com"
                required
                style={styles.input}
              />
              <span style={styles.ayuda}>
                El instructor recibirá un correo con un link para registrarse
              </span>
            </div>

            <button
              type="submit"
              disabled={enviando}
              style={enviando ? styles.btnDeshabilitado : styles.btnPrimario}
            >
              {enviando ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <h2 style={styles.seccionTitulo}>Invitaciones enviadas</h2>
          {invitaciones.length === 0 ? (
            <p style={styles.sinDatos}>No hay invitaciones enviadas</p>
          ) : (
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Expira</th>
                </tr>
              </thead>
              <tbody>
                {invitaciones.map((inv) => {
                  const ahora = new Date();
                  const expira = new Date(inv.expira);
                  const expirada = expira < ahora;
                  const usado = inv.usado;

                  return (
                    <tr key={inv.id} style={styles.tr}>
                      <td style={styles.td}>{inv.correo}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.badge,
                            ...(usado
                              ? styles.badgeSuccess
                              : expirada
                                ? styles.badgeError
                                : styles.badgePending),
                          }}
                        >
                          {usado ? 'Aceptada' : expirada ? 'Expirada' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(inv.creado).toLocaleDateString()}</td>
                      <td style={styles.td}>{new Date(inv.expira).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
    maxWidth: '900px',
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
    marginBottom: '16px',
  },
  seccionTitulo: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 16px 0',
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
  ayuda: {
    fontSize: '12px',
    color: '#9ca3af',
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
    alignSelf: 'flex-start',
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
    alignSelf: 'flex-start',
  },
  sinDatos: {
    color: '#6b7280',
    fontSize: '14px',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: '600',
    fontSize: '13px',
    color: '#374151',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px',
    fontSize: '13px',
    color: '#111827',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  badgeSuccess: {
    backgroundColor: '#d1fae5',
    color: '#047857',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
};
