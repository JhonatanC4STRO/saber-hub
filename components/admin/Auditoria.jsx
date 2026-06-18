'use client';
import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, X, Bot, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const ACCIONES = [
  'ACCESO_EXITOSO',
  'ACCESO_FALLIDO',
  'CIERRE_SESION',
  'CREAR_USUARIO',
  'EDITAR_USUARIO',
  'DESACTIVAR_USUARIO',
  'PUBLICAR_CURSO',
  'DESPUBLICAR_CURSO',
  'ELIMINAR_CURSO_SOFT',
  'INSCRIPCION_MASIVA',
  'REVOCAR_CERTIFICADO',
];

const ACCION_COLOR = {
  ACCESO_EXITOSO: { bg: '#e6f4ea', color: '#137333' },
  ACCESO_FALLIDO: { bg: '#fce8e6', color: '#c5221f' },
  CIERRE_SESION: { bg: '#f1f3f4', color: '#5f6368' },
  CREAR_USUARIO: { bg: '#e6f4ea', color: '#137333' },
  EDITAR_USUARIO: { bg: '#e8f0fe', color: '#1967d2' },
  DESACTIVAR_USUARIO: { bg: '#fce8e6', color: '#c5221f' },
  REVOCAR_CERTIFICADO: { bg: '#fce8e6', color: '#c5221f' },
};
const defaultColor = { bg: '#e8f0fe', color: '#1967d2' };

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const [filtros, setFiltros] = useState({
    usuario: '',
    accion: '',
    fechaDesde: '',
    fechaHasta: '',
    pagina: 1,
  });

  const fetchLogs = useCallback(async (f) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (f.usuario) params.set('usuario', f.usuario);
      if (f.accion) params.set('accion', f.accion);
      if (f.fechaDesde) params.set('fechaDesde', f.fechaDesde);
      if (f.fechaHasta) params.set('fechaHasta', f.fechaHasta);
      params.set('pagina', String(f.pagina));

      const res = await fetch(`/api/admin/auditoria?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
    } catch {
      setError('No se pudo cargar el historial de auditoría');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(filtros);
  }, []);

  const aplicarFiltros = () => {
    const f = { ...filtros, pagina: 1 };
    setFiltros(f);
    fetchLogs(f);
  };

  const limpiarFiltros = () => {
    const f = { usuario: '', accion: '', fechaDesde: '', fechaHasta: '', pagina: 1 };
    setFiltros(f);
    fetchLogs(f);
  };

  const cambiarPagina = (nueva) => {
    const f = { ...filtros, pagina: nueva };
    setFiltros(f);
    fetchLogs(f);
  };

  const formatearDescripcion = (log) => {
    let antes = {};
    let despues = {};
    try {
      if (log.datosAntes) antes = JSON.parse(log.datosAntes);
      if (log.datosDespues) despues = JSON.parse(log.datosDespues);
    } catch {}

    switch (log.accion) {
      case 'ACCESO_EXITOSO':
        return `Acceso exitoso como ${despues.rol || ''}`;
      case 'ACCESO_FALLIDO': {
        const motivos = {
          usuario_no_encontrado: 'usuario no encontrado',
          cuenta_desactivada: 'cuenta desactivada',
          contrasena_incorrecta: 'contraseña incorrecta',
        };
        return `Intento fallido: ${motivos[antes.motivo] || antes.motivo || ''}`;
      }
      case 'CIERRE_SESION':
        return 'Cerró sesión';
      case 'CREAR_USUARIO':
        return `Registró al usuario ${despues.email || ''} con rol ${despues.rol || 'estudiante'}`;
      case 'DESACTIVAR_USUARIO':
        return 'Desactivó al usuario del sistema';
      case 'REVOCAR_CERTIFICADO':
        return `Revocó certificado. Motivo: ${despues.motivo || ''}`;
      case 'EDITAR_USUARIO': {
        const cambios = [];
        if (antes.rol !== despues.rol && despues.rol) cambios.push(`Cambió rol a ${despues.rol}`);
        if (antes.activo !== despues.activo)
          cambios.push(despues.activo ? 'Reactivó cuenta' : 'Desactivó cuenta');
        if (antes.nombre !== despues.nombre) cambios.push('Editó nombre');
        if (antes.email !== despues.email) cambios.push('Editó correo');
        if (antes.documento !== despues.documento) cambios.push('Editó documento');
        return cambios.length ? cambios.join(' | ') : 'Actualizó datos internos';
      }
      default:
        return log.accion.replace(/_/g, ' ');
    }
  };

  const renderModal = () => {
    if (!selectedLog) return null;
    let antes = {},
      despues = {};
    try {
      if (selectedLog.datosAntes) antes = JSON.parse(selectedLog.datosAntes);
      if (selectedLog.datosDespues) despues = JSON.parse(selectedLog.datosDespues);
    } catch {}

    const keys = new Set([...Object.keys(antes), ...Object.keys(despues)]);
    const cambios = [];
    keys.forEach((k) => {
      if (JSON.stringify(antes[k]) !== JSON.stringify(despues[k])) {
        cambios.push({ key: k, antes: antes[k], despues: despues[k] });
      }
    });

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '12px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: 0, color: '#202124', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} className="text-[#1a73e8]" style={{ shrink: 0 }} /> Detalle del Evento
            </h3>
            <button
              onClick={() => setSelectedLog(null)}
              style={{
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#5f6368',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Cerrar modal"
            >
              <X size={16} />
            </button>
          </div>

          <div
            style={{
              marginBottom: '25px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e8eaed',
            }}
          >
            <p style={{ margin: '0 0 8px 0', color: '#3c4043' }}>
              <strong>Acción:</strong>{' '}
              <span style={{ fontWeight: 600, color: '#1a73e8' }}>
                {selectedLog.accion.replace(/_/g, ' ')}
              </span>
            </p>
            <p style={{ margin: '0 0 8px 0', color: '#3c4043' }}>
              <strong>Tabla:</strong> {selectedLog.tabla || '—'}
            </p>
            <p style={{ margin: '0 0 8px 0', color: '#3c4043' }}>
              <strong>IP:</strong> {selectedLog.ip || '—'}
            </p>
            <p style={{ margin: '0 0 8px 0', color: '#3c4043' }}>
              <strong>Fecha:</strong> {new Date(selectedLog.fecha).toLocaleString()}
            </p>
            <p style={{ margin: 0, color: '#3c4043' }}>
              <strong>Actor:</strong>{' '}
              {selectedLog.usuario
                ? `${selectedLog.usuario.nombre} (${selectedLog.usuario.email})`
                : 'Sistema / Desconocido'}
            </p>
          </div>

          <h4 style={{ color: '#202124', marginBottom: '12px' }}>Comparador de Cambios</h4>
          {cambios.length === 0 ? (
            <p
              style={{
                color: '#5f6368',
                fontStyle: 'italic',
                padding: '10px',
                backgroundColor: '#f1f3f4',
                borderRadius: '6px',
              }}
            >
              Sin cambios estructurales registrados.
            </p>
          ) : (
            <div style={{ border: '1px solid #e8eaed', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f3f4', textAlign: 'left' }}>
                    <th
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #dadce0',
                        color: '#5f6368',
                      }}
                    >
                      Campo
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #dadce0',
                        color: '#5f6368',
                      }}
                    >
                      Antes
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid #dadce0',
                        color: '#5f6368',
                      }}
                    >
                      Después
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cambios.map((c, i) => (
                    <tr key={c.key} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #eee',
                          fontWeight: 600,
                          color: '#3c4043',
                        }}
                      >
                        {c.key}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #eee',
                          color: '#d93025',
                          backgroundColor: c.antes !== undefined ? '#fce8e6' : 'transparent',
                        }}
                      >
                        {c.antes !== undefined ? (
                          String(c.antes)
                        ) : (
                          <em style={{ color: '#9aa0a6' }}>vacío</em>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #eee',
                          color: '#188038',
                          backgroundColor: c.despues !== undefined ? '#e6f4ea' : 'transparent',
                        }}
                      >
                        {c.despues !== undefined ? (
                          String(c.despues)
                        ) : (
                          <em style={{ color: '#9aa0a6' }}>vacío</em>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <button
              onClick={() => setSelectedLog(null)}
              style={{
                padding: '10px 20px',
                cursor: 'pointer',
                backgroundColor: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Historial de Auditoría</h2>

      {/* Filtros */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e8eaed',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#5f6368', fontWeight: 600 }}>Usuario</label>
          <input
            type="text"
            placeholder="Nombre o email"
            value={filtros.usuario}
            onChange={(e) => setFiltros((f) => ({ ...f, usuario: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px',
              width: '200px',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#5f6368', fontWeight: 600 }}>Acción</label>
          <select
            value={filtros.accion}
            onChange={(e) => setFiltros((f) => ({ ...f, accion: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px',
              width: '200px',
            }}
          >
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#5f6368', fontWeight: 600 }}>Desde</label>
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => setFiltros((f) => ({ ...f, fechaDesde: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#5f6368', fontWeight: 600 }}>Hasta</label>
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => setFiltros((f) => ({ ...f, fechaHasta: e.target.value }))}
            style={{
              padding: '8px 12px',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <button
            onClick={aplicarFiltros}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Filtrar
          </button>
          <button
            onClick={limpiarFiltros}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fff',
              color: '#5f6368',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {loading && <p>Cargando auditoría...</p>}
      {error && <p style={{ color: '#c5221f' }}>{error}</p>}

      {!loading && !error && (
        <>
          <p style={{ fontSize: '13px', color: '#5f6368', marginBottom: '12px' }}>
            {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>

          {logs.length === 0 ? (
            <p>No hay registros de auditoría.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                border="0"
                cellPadding="12"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f8f9fa',
                      textAlign: 'left',
                      borderBottom: '2px solid #e8eaed',
                    }}
                  >
                    <th style={{ color: '#5f6368', fontWeight: 600 }}>Fecha / Hora</th>
                    <th style={{ color: '#5f6368', fontWeight: 600 }}>Usuario (Actor)</th>
                    <th style={{ color: '#5f6368', fontWeight: 600 }}>Acción</th>
                    <th style={{ color: '#5f6368', fontWeight: 600 }}>Descripción</th>
                    <th style={{ color: '#5f6368', fontWeight: 600 }}>IP</th>
                    <th style={{ color: '#5f6368', fontWeight: 600 }}>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const { bg, color } = ACCION_COLOR[log.accion] || defaultColor;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #e8eaed' }}>
                        <td style={{ color: '#3c4043' }}>
                          {new Date(log.fecha).toLocaleDateString()}
                          <br />
                          <span style={{ color: '#5f6368', fontSize: '13px' }}>
                            {new Date(log.fecha).toLocaleTimeString()}
                          </span>
                        </td>
                        <td style={{ color: '#3c4043' }}>
                          {log.usuario ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  backgroundColor: '#e8f0fe',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  color: '#1a73e8',
                                  fontWeight: 'bold',
                                }}
                              >
                                {log.usuario.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ display: 'block' }}>{log.usuario.nombre}</strong>
                                <span style={{ color: '#5f6368', fontSize: '13px' }}>
                                  {log.usuario.email}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Bot size={14} className="text-[#5f6368]" /> Sistema / Desconocido
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: bg,
                              color,
                            }}
                          >
                            {log.accion}
                          </span>
                        </td>
                        <td style={{ color: '#3c4043' }}>{formatearDescripcion(log)}</td>
                        <td style={{ color: '#5f6368', fontSize: '13px' }}>{log.ip || '—'}</td>
                        <td>
                          <button
                            onClick={() => setSelectedLog(log)}
                            style={{
                              background: 'none',
                              border: '1px solid #dadce0',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              color: '#1a73e8',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Eye size={13} /> Ver más
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '20px',
              }}
            >
              <button
                onClick={() => cambiarPagina(filtros.pagina - 1)}
                disabled={filtros.pagina <= 1}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  cursor: filtros.pagina <= 1 ? 'not-allowed' : 'pointer',
                  color: filtros.pagina <= 1 ? '#9aa0a6' : '#1a73e8',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Anterior
              </button>
              <span style={{ fontSize: '14px', color: '#3c4043' }}>
                Página {filtros.pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => cambiarPagina(filtros.pagina + 1)}
                disabled={filtros.pagina >= totalPaginas}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                  cursor: filtros.pagina >= totalPaginas ? 'not-allowed' : 'pointer',
                  color: filtros.pagina >= totalPaginas ? '#9aa0a6' : '#1a73e8',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Siguiente <ChevronRight size={16} style={{ marginLeft: '4px' }} />
              </button>
            </div>
          )}
        </>
      )}

      {renderModal()}
    </div>
  );
}
