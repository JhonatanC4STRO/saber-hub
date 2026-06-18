'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Upload, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GestionarCursos() {
  const router = useRouter();
  const [institucionId, setInstitucionId] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [tipoCursos, setTipoCursos] = useState('locales'); // locales | externos
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState({});
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, tipoCursos]);

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

      const params = `?tipo=${tipoCursos}${filtroEstado !== 'todos' ? `&estado=${filtroEstado}` : ''}`;
      const res = await fetch(`/api/instituciones/${usuario.institucionId}/cursos${params}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Error al cargar cursos');
      const data = await res.json();
      setCursos(data.cursos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoCurso = async (cursoId, nuevoEstado) => {
    setProcesando({ ...procesando, [cursoId]: true });
    setError('');
    setExito('');

    try {
      const res = await fetch(`/api/instituciones/${institucionId}/cursos/${cursoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar curso');
      }

      setExito(data.message || 'Curso actualizado');
      cargarDatos();
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando({ ...procesando, [cursoId]: false });
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setExito('');
    setLoading(true);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        throw new Error('El archivo CSV está vacío o solo contiene cabeceras');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const parsedCursos = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Simple comma split supporting quotes basic checks
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const values = matches.map(val => val.replace(/^"|"$/g, '').trim());

        const cursoObj = {};
        headers.forEach((header, index) => {
          if (values[index] !== undefined) {
            cursoObj[header] = values[index];
          }
        });

        if (cursoObj.titulo && (cursoObj.fuenteurl || cursoObj.url)) {
          parsedCursos.push({
            titulo: cursoObj.titulo,
            descripcion: cursoObj.descripcion || '',
            fuenteUrl: cursoObj.fuenteurl || cursoObj.url,
            duracionHoras: cursoObj.duracionhoras || cursoObj.horas ? parseInt(cursoObj.duracionhoras || cursoObj.horas) : null,
            nivel: cursoObj.nivel || 'General',
            modalidad: cursoObj.modalidad || 'Virtual',
            codigoExterno: cursoObj.codigo || null
          });
        }
      }

      if (parsedCursos.length === 0) {
        throw new Error('No se encontraron registros válidos con columnas "titulo" y "fuenteurl" en el CSV');
      }

      const res = await fetch(`/api/instituciones/${institucionId}/cursos/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cursos: parsedCursos }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al importar los cursos');
      }

      setExito(`¡Excelente! Se han importado con éxito ${data.registrados} cursos de ${data.totalProcesados} procesados.`);
      cargarDatos();
      setTimeout(() => setExito(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (loading)
    return (
      <div style={styles.loadingScreen}>
        <RefreshCw size={36} className="animate-spin text-[#2563EB]" />
        <p style={{ marginTop: 12, fontWeight: 600, color: '#4B5563' }}>Cargando catálogo institucional...</p>
      </div>
    );

  const cursosFiltrados =
    filtroEstado === 'todos' ? cursos : cursos.filter((c) => c.estado === filtroEstado);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Cabecera Premium */}
        <div style={styles.header}>
          <Link href="/instituciones/dashboard" style={styles.back}>
            ← Volver al Dashboard
          </Link>
          <div style={styles.titleContainer}>
            <div>
              <h1 style={styles.titulo}>Gestionar Cursos</h1>
              <p style={styles.subtitulo}>Administra la oferta educativa y los programas de tu institución</p>
            </div>
            {/* Botón de Importación CSV */}
            {tipoCursos === 'externos' && (
              <label style={styles.importBtn}>
                <Upload size={16} />
                Importar Cursos (.csv)
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Notificaciones */}
        {error && (
          <div style={styles.errorBanner}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {exito && (
          <div style={styles.exitoBanner}>
            <CheckCircle2 size={18} />
            <span>{exito}</span>
          </div>
        )}

        {/* Selector de Tipo de Cursos (Tabs Locales vs Externos) */}
        <div style={styles.tabSelector}>
          <button
            onClick={() => { setTipoCursos('locales'); setFiltroEstado('todos'); }}
            style={{
              ...styles.tabBtn,
              ...(tipoCursos === 'locales' ? styles.tabBtnActive : {}),
            }}
          >
            <BookOpen size={16} />
            Cursos Propios (LMS)
          </button>
          <button
            onClick={() => { setTipoCursos('externos'); setFiltroEstado('todos'); }}
            style={{
              ...styles.tabBtn,
              ...(tipoCursos === 'externos' ? styles.tabBtnActive : {}),
            }}
          >
            <Layers size={16} />
            Cursos Externos (Importados CSV)
          </button>
        </div>

        {/* Filtros de Estado */}
        <div style={styles.filtros}>
          <label style={styles.label}>
            Filtrar por estado:
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={styles.select}
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
              <option value="archivado">Archivado</option>
            </select>
          </label>
        </div>

        {/* Listado Principal */}
        {cursosFiltrados.length === 0 ? (
          <div style={styles.card}>
            {tipoCursos === 'externos' ? (
              <div style={styles.noDataContainer}>
                <Upload size={48} style={{ color: '#9CA3AF', marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>No hay cursos importados</h3>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 16px', maxWidth: 380 }}>
                  Sube un archivo CSV con las columnas <strong>titulo</strong> y <strong>fuenteurl</strong> para integrar tus cursos en un segundo.
                </p>
                <label style={styles.importBtn}>
                  <Upload size={16} />
                  Seleccionar archivo CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            ) : (
              <p style={styles.sinDatos}>No hay cursos propios creados aún en esta categoría.</p>
            )}
          </div>
        ) : (
          <div style={styles.card}>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Título</th>
                  {tipoCursos === 'externos' ? (
                    <>
                      <th style={styles.th}>Duración</th>
                      <th style={styles.th}>Modalidad</th>
                      <th style={styles.th}>Nivel</th>
                      <th style={styles.th}>Enlace de Origen</th>
                    </>
                  ) : (
                    <>
                      <th style={styles.th}>Instructor</th>
                      <th style={styles.th}>Estado</th>
                      <th style={styles.th}>Módulos</th>
                      <th style={styles.th}>Inscritos</th>
                      <th style={styles.th}>Acciones</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {cursosFiltrados.map((curso) => (
                  <tr key={curso.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{curso.titulo}</td>
                    {tipoCursos === 'externos' ? (
                      <>
                        <td style={styles.td}>{curso.duracionHoras ? `${curso.duracionHoras} hrs` : '—'}</td>
                        <td style={styles.td}><span style={styles.metaBadge}>{curso.modalidad}</span></td>
                        <td style={styles.td}><span style={styles.metaBadge}>{curso.nivel}</span></td>
                        <td style={styles.td}>
                          <a href={curso.fuenteUrl} target="_blank" rel="noopener noreferrer" style={styles.linkText}>
                            Ir al curso original ↗
                          </a>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={styles.td}>{curso.instructor.nombre}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              ...(curso.estado === 'publicado'
                                ? styles.badgeSuccess
                                : curso.estado === 'archivado'
                                  ? styles.badgeError
                                  : styles.badgeDefault),
                            }}
                          >
                            {curso.estado.toUpperCase()}
                          </span>
                        </td>
                        <td style={styles.td}>{curso._count.modulos}</td>
                        <td style={styles.td}>{curso._count.inscripciones}</td>
                        <td style={styles.td}>
                          <div style={styles.acciones}>
                            {curso.estado === 'borrador' && (
                              <button
                                onClick={() => cambiarEstadoCurso(curso.id, 'publicado')}
                                disabled={procesando[curso.id]}
                                style={
                                  procesando[curso.id]
                                    ? styles.btnPequenoDeshabilitado
                                    : styles.btnPequeño
                                }
                              >
                                {procesando[curso.id] ? '...' : 'Publicar'}
                              </button>
                            )}
                            {curso.estado === 'publicado' && (
                              <button
                                onClick={() => cambiarEstadoCurso(curso.id, 'borrador')}
                                disabled={procesando[curso.id]}
                                style={
                                  procesando[curso.id]
                                    ? styles.btnPequenoDeshabilitado
                                    : styles.btnPequeño
                                }
                              >
                                {procesando[curso.id] ? '...' : 'Despublicar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
    padding: '40px 24px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  header: {
    marginBottom: '32px',
  },
  back: {
    color: '#2563EB',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  titulo: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitulo: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '4px 0 0 0',
  },
  importBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#2563EB',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.2s',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: '10px',
    padding: '14px 18px',
    color: '#DC2626',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  exitoBanner: {
    backgroundColor: '#ECFDF5',
    border: '1px solid #6EE7B7',
    borderRadius: '10px',
    padding: '14px 18px',
    color: '#059669',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  tabSelector: {
    display: 'flex',
    gap: '12px',
    borderBottom: '2px solid #E5E7EB',
    marginBottom: '24px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 16px',
    border: 'none',
    borderBottom: '2px solid transparent',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4B5563',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '-2px',
  },
  tabBtnActive: {
    color: '#2563EB',
    borderBottom: '2px solid #2563EB',
  },
  filtros: {
    backgroundColor: '#ffffff',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #F3F4F6',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  select: {
    padding: '8px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    border: '1px solid #F3F4F6',
  },
  sinDatos: {
    color: '#6B7280',
    fontSize: '14px',
    textAlign: 'center',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '24px 0',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '16px 12px',
    borderBottom: '2px solid #E5E7EB',
    fontWeight: '700',
    fontSize: '12px',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid #F3F4F6',
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '16px 12px',
    fontSize: '14px',
    color: '#1F2937',
  },
  badge: {
    display: 'inline-flex',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  badgeDefault: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  },
  badgeError: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  metaBadge: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  linkText: {
    color: '#2563EB',
    textDecoration: 'none',
    fontWeight: '600',
  },
  acciones: {
    display: 'flex',
    gap: '8px',
  },
  btnPequeño: {
    backgroundColor: '#2563EB',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  btnPequenoDeshabilitado: {
    backgroundColor: '#93C5FD',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'not-allowed',
  },
};
