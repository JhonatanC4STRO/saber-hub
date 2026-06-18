'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardInstitucion() {
  const router = useRouter();
  const [institucion, setInstitucion] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

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

      const resInstitucion = await fetch(`/api/instituciones/${usuario.institucionId}`);
      if (!resInstitucion.ok) throw new Error('Error al cargar institución');
      const inst = await resInstitucion.json();
      setInstitucion(inst);

      const resCursos = await fetch(`/api/instituciones/${usuario.institucionId}/cursos`);
      if (!resCursos.ok) throw new Error('Error al cargar cursos');
      const cursosData = await resCursos.json();
      setCursos(cursosData.cursos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div style={styles.page}>
        <p>Cargando...</p>
      </div>
    );
  if (error)
    return (
      <div style={styles.page}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  if (!institucion)
    return (
      <div style={styles.page}>
        <p>Institución no encontrada</p>
      </div>
    );

  const cursosPublicados = cursos.filter((c) => c.estado === 'publicado').length;
  const cursosBorradores = cursos.filter((c) => c.estado === 'borrador').length;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.titulo}>{institucion.nombre}</h1>
          <nav style={styles.nav}>
            <Link href="/instituciones/perfil" style={styles.navLink}>
              Perfil
            </Link>
            <Link href="/instituciones/instructores" style={styles.navLink}>
              Instructores
            </Link>
            <Link href="/instituciones/cursos" style={styles.navLink}>
              Cursos
            </Link>
            <button
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (err) {
                  console.error('Error al cerrar sesión:', err);
                }
                window.location.href = '/login';
              }}
              style={{
                ...styles.navLink,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                font: 'inherit',
                display: 'inline-block',
              }}
            >
              Salir
            </button>
          </nav>
        </header>

        <div style={styles.cardsGrid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Cursos publicados</h3>
            <div style={styles.cardNumero}>{cursosPublicados}</div>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Cursos en borrador</h3>
            <div style={styles.cardNumero}>{cursosBorradores}</div>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Total de cursos</h3>
            <div style={styles.cardNumero}>{cursos.length}</div>
          </div>
        </div>

        <section style={styles.seccion}>
          <h2 style={styles.seccionTitulo}>Cursos recientes</h2>
          {cursos.length === 0 ? (
            <p style={styles.sinDatos}>No hay cursos creados aún</p>
          ) : (
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Instructor</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Inscritos</th>
                </tr>
              </thead>
              <tbody>
                {cursos.slice(0, 5).map((curso) => (
                  <tr key={curso.id} style={styles.tr}>
                    <td style={styles.td}>{curso.titulo}</td>
                    <td style={styles.td}>{curso.instructor.nombre}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(curso.estado === 'publicado'
                            ? styles.badgeSuccess
                            : styles.badgeDefault),
                        }}
                      >
                        {curso.estado}
                      </span>
                    </td>
                    <td style={styles.td}>{curso._count.inscripciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={styles.accion}>
            <Link href="/instituciones/cursos" style={styles.btnSecundario}>
              Ver todos los cursos
            </Link>
          </div>
        </section>
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
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  titulo: {
    margin: '0 0 16px 0',
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
  },
  nav: {
    display: 'flex',
    gap: '16px',
  },
  navLink: {
    padding: '8px 16px',
    textDecoration: 'none',
    color: '#1a56db',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  cardTitulo: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 12px 0',
    fontWeight: '500',
  },
  cardNumero: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a56db',
  },
  seccion: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  seccionTitulo: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 16px 0',
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
    fontSize: '14px',
    color: '#374151',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
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
  badgeDefault: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  accion: {
    marginTop: '16px',
  },
  btnSecundario: {
    padding: '10px 20px',
    textDecoration: 'none',
    color: '#1a56db',
    border: '1px solid #1a56db',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'inline-block',
  },
};
