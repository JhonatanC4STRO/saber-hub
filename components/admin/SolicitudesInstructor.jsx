'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import { useState, useEffect, useCallback } from 'react';
import CardSolicitudInstructor from './CardSolicitudInstructor';
import ModalDetalleInstructor from './ModalDetalleInstructor';

const ESTADOS = [
  { key: 'pendiente', label: 'Pendientes', color: '#92400E', bg: '#FEF3C7' },
  { key: 'en_revision', label: 'En revisión', color: '#1E40AF', bg: '#DBEAFE' },
  { key: 'aprobada', label: 'Aprobadas', color: '#065F46', bg: '#D1FAE5' },
  { key: 'rechazada', label: 'Rechazadas', color: '#991B1B', bg: '#FEE2E2' },
];

export default function SolicitudesInstructor() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [conteos, setConteos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({ estado: 'pendiente', busqueda: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchSolicitudes = useCallback(async (f) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (f.estado) params.set('estado', f.estado);
      if (f.busqueda) params.set('busqueda', f.busqueda);
      const res = await fetch(`/api/admin/solicitudes-instructor?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSolicitudes(data.solicitudes || []);
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
    const f = { ...filtros, estado };
    setFiltros(f);
    fetchSolicitudes(f);
  }

  function buscar(e) {
    e.preventDefault();
    fetchSolicitudes(filtros);
  }

  const totalPendientes = conteos.pendiente || 0;
  const totalEnRevision = conteos.en_revision || 0;
  const totalAprobadas = conteos.aprobada || 0;
  const totalRechazadas = conteos.rechazada || 0;

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
          Inicio &gt; Solicitudes &gt; <strong>Solicitudes de instructor</strong>
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 40, color: '#1E40AF' }}><EmojiIcon emoji="🎓" size={40} /></div>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Solicitudes de instructor
                </h1>
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              Revisa y gestiona las solicitudes de alumnos que quieren convertirse en instructores.
            </p>
          </div>
          <div
            style={{
              background: '#1E40AF',
              color: 'white',
              padding: '6px 12px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 11,
              whiteSpace: 'nowrap',
            }}
          >
            {totalPendientes} NUEVAS
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'PENDIENTES', value: totalPendientes, color: '#F59E0B' },
          { label: 'EN REVISIÓN', value: totalEnRevision, color: '#1E40AF' },
          { label: 'APROBADAS (mes)', value: totalAprobadas, color: '#10B981' },
          { label: 'RECHAZADAS (mes)', value: totalRechazadas, color: '#EF4444' },
        ].map((metric) => (
          <div
            key={metric.label}
            style={{
              background: 'white',
              border: '1px solid #F3F4F6',
              borderRadius: 4,
              padding: 20,
              borderBottom: `2px solid #1E40AF`,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#6B7280',
                margin: '0 0 8px 0',
                letterSpacing: '0.04em',
              }}
            >
              {metric.label}
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color: metric.color, margin: 0 }}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid #F3F4F6',
          paddingBottom: 16,
        }}
      >
        {ESTADOS.map((e) => {
          const count = conteos[e.key] || 0;
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
            </button>
          );
        })}
      </div>

      {/* Buscador */}
      <form
        onSubmit={buscar}
        style={{
          background: 'white',
          border: '1px solid #F3F4F6',
          borderRadius: 4,
          padding: 16,
          marginBottom: 16,
          borderBottom: '2px solid #1E40AF',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Buscar por nombre, email o área…"
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
        <select
          style={{
            height: 40,
            padding: '0 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 13,
            outline: 'none',
            background: 'white',
          }}
        >
          <option>Área</option>
        </select>
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
        <button
          type="button"
          onClick={() => {
            setFiltros({ estado: 'pendiente', busqueda: '' });
            fetchSolicitudes({ estado: 'pendiente', busqueda: '' });
          }}
          style={{
            height: 40,
            padding: '0 16px',
            background: 'white',
            color: '#1E40AF',
            border: '1px solid #1E40AF',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Limpiar filtros
        </button>
      </form>

      {error && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '12px 14px',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {solicitudes.map((s) => (
            <CardSolicitudInstructor
              key={s.id}
              solicitud={s}
              onDetalle={() => {
                setSelectedId(s.id);
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {modalOpen && selectedId && (
        <ModalDetalleInstructor
          solicitudId={selectedId}
          onClose={() => {
            setModalOpen(false);
            setSelectedId(null);
          }}
          onRefresh={() => fetchSolicitudes(filtros)}
        />
      )}
    </div>
  );
}
