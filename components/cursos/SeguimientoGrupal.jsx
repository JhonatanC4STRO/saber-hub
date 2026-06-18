'use client';
import React, { useState, useEffect, useCallback } from 'react';

function MedallaPosicion({ pos }) {
  if (pos === 1)
    return (
      <span title="1er lugar" style={{ fontSize: '20px' }}>
        🥇
      </span>
    );
  if (pos === 2)
    return (
      <span title="2do lugar" style={{ fontSize: '20px' }}>
        🥈
      </span>
    );
  if (pos === 3)
    return (
      <span title="3er lugar" style={{ fontSize: '20px' }}>
        🥉
      </span>
    );
  return (
    <span
      style={{
        color: '#9ca3af',
        fontSize: '13px',
        fontWeight: 'bold',
        minWidth: '20px',
        textAlign: 'center',
        display: 'inline-block',
      }}
    >
      #{pos}
    </span>
  );
}

export default function SeguimientoGrupal({ cursoId, tituloExterno }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const fetchDatos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/progreso/grupo/${cursoId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDatos(data);
    } catch {
      // silenciar
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  if (loading)
    return (
      <p style={{ padding: '40px', textAlign: 'center', color: '#5f6368' }}>
        Cargando seguimiento...
      </p>
    );
  if (!datos) return <p style={{ color: '#c5221f' }}>Error al cargar los datos del grupo.</p>;

  const { ranking, promedioProgreso, totalInscritos, distribucion, totalLecciones } = datos;

  const rankingFiltrado = ranking.filter((r) => {
    const matchBusqueda =
      !busqueda ||
      r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(r.documento).includes(busqueda);
    const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const colorProgreso = (p) => {
    if (p >= 100) return '#137333';
    if (p >= 75) return '#1a73e8';
    if (p >= 50) return '#f9ab00';
    if (p > 0) return '#e8710a';
    return '#c5221f';
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#202124' }}>📊 Seguimiento del Grupo</h2>
          {tituloExterno && (
            <p style={{ margin: '4px 0 0 0', color: '#5f6368', fontSize: '14px' }}>
              {tituloExterno}
            </p>
          )}
        </div>
        <button
          onClick={fetchDatos}
          style={{
            padding: '6px 14px',
            backgroundColor: '#e8f0fe',
            color: '#1a73e8',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* ── KPIs ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Total inscritos', value: totalInscritos, bg: '#e8f0fe', color: '#1a73e8' },
          {
            label: 'Progreso promedio',
            value: `${promedioProgreso}%`,
            bg: promedioProgreso >= 70 ? '#e6f4ea' : '#fef7e0',
            color: promedioProgreso >= 70 ? '#137333' : '#f9ab00',
          },
          { label: 'Activos', value: distribucion.activos, bg: '#e6f4ea', color: '#137333' },
          {
            label: 'Finalizados',
            value: distribucion.finalizados,
            bg: '#e8f0fe',
            color: '#1a73e8',
          },
          { label: 'Retirados', value: distribucion.retirados, bg: '#fce8e6', color: '#c5221f' },
          { label: 'Total lecciones', value: totalLecciones, bg: '#f8f9fa', color: '#3c4043' },
        ].map(({ label, value, bg, color }) => (
          <div
            key={label}
            style={{
              padding: '16px',
              backgroundColor: bg,
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color }}>{value}</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#5f6368' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Barra visual distribución ── */}
      {totalInscritos > 0 && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e8eaed',
          }}
        >
          <p
            style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#202124', fontSize: '14px' }}
          >
            Distribución de estados
          </p>
          <div
            style={{
              display: 'flex',
              height: '16px',
              borderRadius: '8px',
              overflow: 'hidden',
              gap: '1px',
            }}
          >
            {[
              { n: distribucion.finalizados, color: '#1a73e8', label: 'Finalizados' },
              { n: distribucion.activos, color: '#34a853', label: 'Activos' },
              { n: distribucion.retirados, color: '#ea4335', label: 'Retirados' },
              { n: distribucion.inactivos, color: '#fbbc04', label: 'Inactivos' },
            ].map(({ n, color, label }) =>
              n > 0 ? (
                <div
                  key={label}
                  title={`${label}: ${n}`}
                  style={{ flex: n, backgroundColor: color }}
                />
              ) : null
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
            {[
              { n: distribucion.finalizados, color: '#1a73e8', label: 'Finalizados' },
              { n: distribucion.activos, color: '#34a853', label: 'Activos' },
              { n: distribucion.retirados, color: '#ea4335', label: 'Retirados' },
            ].map(({ n, color, label }) => (
              <span
                key={label}
                style={{
                  fontSize: '12px',
                  color: '#5f6368',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: color,
                    display: 'inline-block',
                  }}
                />
                {label}: <strong>{n}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, email o documento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #dadce0',
            fontSize: '13px',
          }}
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #dadce0',
            fontSize: '13px',
            backgroundColor: '#fff',
          }}
        >
          <option value="todos">Todos</option>
          <option value="activo">Activos</option>
          <option value="finalizado">Finalizados</option>
          <option value="retirado">Retirados</option>
        </select>
        <span style={{ fontSize: '12px', color: '#80868b' }}>
          Mostrando {rankingFiltrado.length}
        </span>
      </div>

      {/* ── Ranking ── */}
      {rankingFiltrado.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <p style={{ color: '#80868b' }}>No hay resultados.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #e8eaed', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th
                  style={{
                    padding: '11px 16px',
                    textAlign: 'center',
                    color: '#5f6368',
                    fontWeight: '600',
                    borderBottom: '1px solid #e8eaed',
                    width: '48px',
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: '11px 16px',
                    textAlign: 'left',
                    color: '#5f6368',
                    fontWeight: '600',
                    borderBottom: '1px solid #e8eaed',
                  }}
                >
                  Aprendiz
                </th>
                <th
                  style={{
                    padding: '11px 16px',
                    textAlign: 'left',
                    color: '#5f6368',
                    fontWeight: '600',
                    borderBottom: '1px solid #e8eaed',
                  }}
                >
                  Documento
                </th>
                <th
                  style={{
                    padding: '11px 16px',
                    textAlign: 'left',
                    color: '#5f6368',
                    fontWeight: '600',
                    borderBottom: '1px solid #e8eaed',
                  }}
                >
                  Avance
                </th>
                <th
                  style={{
                    padding: '11px 16px',
                    textAlign: 'center',
                    color: '#5f6368',
                    fontWeight: '600',
                    borderBottom: '1px solid #e8eaed',
                  }}
                >
                  Estado
                </th>
                <th
                  style={{
                    padding: '11px 16px',
                    textAlign: 'left',
                    color: '#5f6368',
                    fontWeight: '600',
                    borderBottom: '1px solid #e8eaed',
                  }}
                >
                  Último acceso
                </th>
              </tr>
            </thead>
            <tbody>
              {rankingFiltrado.map((r, i) => (
                <tr
                  key={r.usuarioId}
                  style={{
                    borderBottom: '1px solid #f1f3f4',
                    backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
                  }}
                >
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <MedallaPosicion pos={r.posicion} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#e8f0fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1a73e8',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          flexShrink: 0,
                        }}
                      >
                        {r.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', color: '#202124' }}>{r.nombre}</p>
                        <p style={{ margin: '1px 0 0 0', fontSize: '12px', color: '#5f6368' }}>
                          {r.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      color: '#3c4043',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                    }}
                  >
                    {r.documento}
                  </td>
                  <td style={{ padding: '12px 16px', minWidth: '180px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '4px',
                        }}
                      >
                        <div
                          style={{
                            width: `${r.progreso}%`,
                            height: '100%',
                            backgroundColor: colorProgreso(r.progreso),
                            borderRadius: '4px',
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: colorProgreso(r.progreso),
                          minWidth: '36px',
                          textAlign: 'right',
                        }}
                      >
                        {r.progreso}%
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#80868b' }}>
                      {r.leccionesCompletadas}/{r.totalLecciones} lecciones
                    </p>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor:
                          r.estado === 'activo'
                            ? '#e6f4ea'
                            : r.estado === 'finalizado'
                              ? '#e8f0fe'
                              : r.estado === 'retirado'
                                ? '#fce8e6'
                                : '#f1f3f4',
                        color:
                          r.estado === 'activo'
                            ? '#137333'
                            : r.estado === 'finalizado'
                              ? '#1a73e8'
                              : r.estado === 'retirado'
                                ? '#c5221f'
                                : '#5f6368',
                      }}
                    >
                      {r.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#5f6368', fontSize: '12px' }}>
                    {r.ultimoAcceso ? new Date(r.ultimoAcceso).toLocaleString() : 'Sin acceso'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
