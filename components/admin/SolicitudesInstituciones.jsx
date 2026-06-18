'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const ESTADOS = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendiente', label: 'Pendiente', color: '#92400E', bg: '#FEF3C7' },
  { key: 'en_revision', label: 'En revisión', color: '#1E40AF', bg: '#DBEAFE' },
  { key: 'pendiente_informacion', label: 'Pend. información', color: '#6D28D9', bg: '#EDE9FE' },
  { key: 'aprobada', label: 'Aprobada', color: '#065F46', bg: '#D1FAE5' },
  { key: 'rechazada', label: 'Rechazada', color: '#991B1B', bg: '#FEE2E2' },
];

function EstadoBadge({ estado }) {
  const e = ESTADOS.find((s) => s.key === estado);
  if (!e?.color) return <span style={{ fontSize: 12 }}>{estado}</span>;
  return (
    <span
      style={{
        background: e.bg,
        color: e.color,
        fontWeight: 600,
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 4,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {e.label}
    </span>
  );
}

export default function SolicitudesInstituciones() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [conteos, setConteos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({ estado: 'todas', busqueda: '', pagina: 1 });

  const fetchSolicitudes = useCallback(async (f) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (f.estado !== 'todas') params.set('estado', f.estado);
      if (f.busqueda) params.set('busqueda', f.busqueda);
      params.set('pagina', String(f.pagina));
      const res = await fetch(`/api/admin/instituciones/solicitudes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSolicitudes(data.solicitudes);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
      setConteos(data.conteos || {});
    } catch {
      setError('No se pudo cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolicitudes(filtros);
  }, []);

  function cambiarEstado(estado) {
    const f = { ...filtros, estado, pagina: 1 };
    setFiltros(f);
    fetchSolicitudes(f);
  }

  function buscar(e) {
    e.preventDefault();
    const f = { ...filtros, pagina: 1 };
    setFiltros(f);
    fetchSolicitudes(f);
  }

  function cambiarPagina(p) {
    const f = { ...filtros, pagina: p };
    setFiltros(f);
    fetchSolicitudes(f);
  }

  const totalGlobal = Object.values(conteos).reduce((s, v) => s + v, 0);

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {ESTADOS.map((e) => {
          const count = e.key === 'todas' ? totalGlobal : conteos[e.key] || 0;
          const active = filtros.estado === e.key;
          return (
            <button
              key={e.key}
              onClick={() => cambiarEstado(e.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 4,
                cursor: 'pointer',
                border: active ? '2px solid #1E40AF' : '2px solid #E5E7EB',
                background: active ? '#DBEAFE' : 'white',
                color: active ? '#1E40AF' : '#374151',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {e.label}
              {(count > 0 || e.key === 'todas') && (
                <span
                  style={{
                    background: active ? '#1E40AF' : '#F3F4F6',
                    color: active ? 'white' : '#6B7280',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 10,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Buscador */}
      <form onSubmit={buscar} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar por nombre, NIT o representante…"
          value={filtros.busqueda}
          onChange={(e) => setFiltros((f) => ({ ...f, busqueda: e.target.value }))}
          style={{
            flex: 1,
            height: 40,
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            padding: '0 14px',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            height: 40,
            padding: '0 20px',
            background: '#1E40AF',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Buscar
        </button>
      </form>

      {error && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '10px 14px',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Cargando…</p>
      ) : solicitudes.length === 0 ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>
          No hay solicitudes con los filtros seleccionados.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                {[
                  'Institución',
                  'NIT',
                  'Representante',
                  'Correo',
                  'Estado',
                  'Fecha solicitud',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 12px',
                      fontWeight: 600,
                      color: '#6B7280',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 12px', fontWeight: 600, color: '#111827' }}>
                    {s.nombreLegal}
                  </td>
                  <td
                    style={{
                      padding: '12px 12px',
                      color: '#6B7280',
                      fontFamily: 'monospace',
                      fontSize: 13,
                    }}
                  >
                    {s.nit}
                  </td>
                  <td style={{ padding: '12px 12px', color: '#374151' }}>
                    {s.nombreRepresentante}
                  </td>
                  <td style={{ padding: '12px 12px', color: '#6B7280', fontSize: 13 }}>
                    {s.correoInstitucional}
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <EstadoBadge estado={s.estado} />
                  </td>
                  <td
                    style={{
                      padding: '12px 12px',
                      color: '#9CA3AF',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {new Date(s.fechaSolicitud).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <Link
                      href={`/dashboard/instituciones/solicitudes/${s.id}`}
                      style={{
                        padding: '5px 14px',
                        border: '1px solid #1E40AF',
                        borderRadius: 4,
                        color: '#1E40AF',
                        fontWeight: 600,
                        fontSize: 12,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => cambiarPagina(p)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 4,
                cursor: 'pointer',
                border: filtros.pagina === p ? '2px solid #1E40AF' : '1px solid #D1D5DB',
                background: filtros.pagina === p ? '#1E40AF' : 'white',
                color: filtros.pagina === p ? 'white' : '#374151',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 12, textAlign: 'right' }}>
        {total} solicitud{total !== 1 ? 'es' : ''} en total
      </p>
    </div>
  );
}
