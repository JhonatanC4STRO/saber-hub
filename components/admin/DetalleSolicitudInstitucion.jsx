'use client';
import { useState } from 'react';
import Link from 'next/link';

const ESTADOS_META = {
  pendiente: { label: 'Pendiente', color: '#92400E', bg: '#FEF3C7' },
  en_revision: { label: 'En revisión', color: '#1E40AF', bg: '#DBEAFE' },
  pendiente_informacion: { label: 'Pendiente de info.', color: '#6D28D9', bg: '#EDE9FE' },
  aprobada: { label: 'Aprobada', color: '#065F46', bg: '#D1FAE5' },
  rechazada: { label: 'Rechazada', color: '#991B1B', bg: '#FEE2E2' },
};

function Campo({ label, valor }) {
  return (
    <>
      <dt style={{ color: '#6B7280', fontWeight: 500, fontSize: 13 }}>{label}</dt>
      <dd style={{ color: '#111827', margin: 0, fontSize: 14, wordBreak: 'break-word' }}>
        {valor || '—'}
      </dd>
    </>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #F3F4F6',
        borderRadius: 4,
        borderBottom: '2px solid #1E40AF',
        padding: 24,
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default function DetalleSolicitudInstitucion({ solicitud: initialSolicitud }) {
  const [solicitud, setSolicitud] = useState(initialSolicitud);
  const [accionActiva, setAccionActiva] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const meta = ESTADOS_META[solicitud.estado] || {};
  const esEstadoFinal = ['aprobada', 'rechazada'].includes(solicitud.estado);

  async function ejecutarAccion(accion, payload = {}) {
    setLoading(true);
    setError('');
    setExito('');
    try {
      const res = await fetch(`/api/admin/instituciones/solicitudes/${solicitud.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al procesar la acción.');
      setSolicitud(data.solicitud);
      setAccionActiva(null);
      setMotivo('');
      setMensaje('');
      setExito('Acción aplicada correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const btnBase = {
    width: '100%',
    padding: '9px 16px',
    borderRadius: 4,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  };

  return (
    <div>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Link
            href="/dashboard/instituciones/solicitudes"
            style={{
              fontSize: 13,
              color: '#6B7280',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 8,
            }}
          >
            ← Volver a solicitudes
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>
            {solicitud.nombreLegal}
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: '4px 0 0' }}>
            NIT: {solicitud.nit} · ID:{' '}
            <span style={{ fontFamily: 'monospace' }}>{solicitud.id}</span>
          </p>
        </div>
        <span
          style={{
            background: meta.bg,
            color: meta.color,
            fontWeight: 700,
            fontSize: 12,
            padding: '6px 16px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          {meta.label || solicitud.estado}
        </span>
      </div>

      {exito && (
        <div
          style={{
            background: '#D1FAE5',
            color: '#065F46',
            padding: '10px 16px',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {exito}
        </div>
      )}
      {error && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '10px 16px',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}
      >
        {/* ── DATOS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Seccion titulo="Datos de la institución">
            <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px 16px' }}>
              <Campo label="Nombre legal" valor={solicitud.nombreLegal} />
              <Campo label="NIT" valor={solicitud.nit} />
              <Campo label="Sitio web" valor={solicitud.sitioWeb} />
              <Campo label="Descripción" valor={solicitud.descripcion} />
            </dl>
          </Seccion>

          <Seccion titulo="Representante">
            <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px 16px' }}>
              <Campo label="Nombre" valor={solicitud.nombreRepresentante} />
              <Campo label="Correo" valor={solicitud.correoInstitucional} />
              <Campo label="Teléfono" valor={solicitud.telefono} />
            </dl>
          </Seccion>

          {(solicitud.logoUrl || solicitud.documentoUrl) && (
            <Seccion titulo="Documentos adjuntos">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {solicitud.logoUrl && (
                  <a
                    href={solicitud.logoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '7px 16px',
                      border: '1px solid #D1D5DB',
                      borderRadius: 4,
                      color: '#1E40AF',
                      fontWeight: 600,
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    Ver logo →
                  </a>
                )}
                {solicitud.documentoUrl && (
                  <a
                    href={solicitud.documentoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '7px 16px',
                      border: '1px solid #D1D5DB',
                      borderRadius: 4,
                      color: '#1E40AF',
                      fontWeight: 600,
                      fontSize: 13,
                      textDecoration: 'none',
                    }}
                  >
                    Ver documento →
                  </a>
                )}
              </div>
            </Seccion>
          )}

          {solicitud.motivoRechazo && (
            <div
              style={{
                padding: 16,
                borderRadius: 4,
                background: solicitud.estado === 'rechazada' ? '#FEF2F2' : '#FFFBEB',
                border: `1px solid ${solicitud.estado === 'rechazada' ? '#FECACA' : '#FDE68A'}`,
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  margin: '0 0 6px',
                  color: solicitud.estado === 'rechazada' ? '#991B1B' : '#92400E',
                }}
              >
                {solicitud.estado === 'rechazada' ? 'Motivo de rechazo' : 'Información solicitada'}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: solicitud.estado === 'rechazada' ? '#7F1D1D' : '#78350F',
                }}
              >
                {solicitud.motivoRechazo}
              </p>
            </div>
          )}

          <div
            style={{ fontSize: 12, color: '#9CA3AF', display: 'flex', gap: 20, flexWrap: 'wrap' }}
          >
            <span>Solicitud: {new Date(solicitud.fechaSolicitud).toLocaleString('es-CO')}</span>
            {solicitud.fechaRevision && (
              <span>
                Última revisión: {new Date(solicitud.fechaRevision).toLocaleString('es-CO')}
              </span>
            )}
          </div>
        </div>

        {/* ── ACCIONES ── */}
        <div
          style={{
            background: 'white',
            border: '1px solid #F3F4F6',
            borderBottom: '2px solid #1E40AF',
            borderRadius: 4,
            padding: 24,
            position: 'sticky',
            top: 90,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
            Acciones
          </h2>

          {esEstadoFinal ? (
            <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
              Esta solicitud ya fue{' '}
              <strong>{solicitud.estado === 'aprobada' ? 'aprobada' : 'rechazada'}</strong> y no
              puede modificarse.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Marcar en revisión */}
              {solicitud.estado !== 'en_revision' && accionActiva === null && (
                <button
                  onClick={() => ejecutarAccion('en_revision')}
                  disabled={loading}
                  style={{
                    ...btnBase,
                    border: '1px solid #D1D5DB',
                    background: 'white',
                    color: '#374151',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  Marcar en revisión
                </button>
              )}

              {/* Solicitar información */}
              {accionActiva !== 'pendiente_informacion' ? (
                accionActiva === null && (
                  <button
                    onClick={() => setAccionActiva('pendiente_informacion')}
                    disabled={loading}
                    style={{
                      ...btnBase,
                      border: '1px solid #F59E0B',
                      background: '#FFFBEB',
                      color: '#92400E',
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    Solicitar información
                  </button>
                )
              ) : (
                <div
                  style={{
                    border: '1px solid #FDE68A',
                    borderRadius: 4,
                    padding: 12,
                    background: '#FFFBEB',
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#92400E', margin: '0 0 6px' }}>
                    Mensaje para el representante *
                  </p>
                  <textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    rows={3}
                    placeholder="Especifique qué información adicional se requiere…"
                    style={{
                      width: '100%',
                      border: '1px solid #FDE68A',
                      borderRadius: 4,
                      padding: 8,
                      fontSize: 13,
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => ejecutarAccion('pendiente_informacion', { mensaje })}
                      disabled={loading || !mensaje.trim()}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        background: '#F59E0B',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: !mensaje.trim() || loading ? 'not-allowed' : 'pointer',
                        opacity: !mensaje.trim() ? 0.5 : 1,
                      }}
                    >
                      {loading ? 'Enviando…' : 'Enviar'}
                    </button>
                    <button
                      onClick={() => {
                        setAccionActiva(null);
                        setMensaje('');
                      }}
                      style={{
                        padding: '7px 12px',
                        background: 'white',
                        color: '#6B7280',
                        border: '1px solid #D1D5DB',
                        borderRadius: 4,
                        fontWeight: 500,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Aprobar */}
              {accionActiva !== 'aprobar' ? (
                accionActiva === null && (
                  <button
                    onClick={() => setAccionActiva('aprobar')}
                    disabled={loading}
                    style={{
                      ...btnBase,
                      border: '1px solid #059669',
                      background: '#D1FAE5',
                      color: '#065F46',
                      fontWeight: 700,
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    Aprobar solicitud
                  </button>
                )
              ) : (
                <div
                  style={{
                    border: '1px solid #6EE7B7',
                    borderRadius: 4,
                    padding: 12,
                    background: '#ECFDF5',
                  }}
                >
                  <p
                    style={{ fontSize: 12, color: '#065F46', margin: '0 0 10px', lineHeight: 1.5 }}
                  >
                    Se creará el registro de la institución y se enviará un correo al representante
                    con el enlace para crear su cuenta de administrador.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => ejecutarAccion('aprobar')}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      {loading ? 'Procesando…' : 'Confirmar aprobación'}
                    </button>
                    <button
                      onClick={() => setAccionActiva(null)}
                      style={{
                        padding: '7px 12px',
                        background: 'white',
                        color: '#6B7280',
                        border: '1px solid #D1D5DB',
                        borderRadius: 4,
                        fontWeight: 500,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Rechazar */}
              {accionActiva !== 'rechazar' ? (
                accionActiva === null && (
                  <button
                    onClick={() => setAccionActiva('rechazar')}
                    disabled={loading}
                    style={{
                      ...btnBase,
                      border: '1px solid #EF4444',
                      background: '#FEF2F2',
                      color: '#991B1B',
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    Rechazar solicitud
                  </button>
                )
              ) : (
                <div
                  style={{
                    border: '1px solid #FECACA',
                    borderRadius: 4,
                    padding: 12,
                    background: '#FEF2F2',
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', margin: '0 0 6px' }}>
                    Motivo de rechazo * (obligatorio)
                  </p>
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={3}
                    placeholder="Explique el motivo del rechazo…"
                    style={{
                      width: '100%',
                      border: '1px solid #FECACA',
                      borderRadius: 4,
                      padding: 8,
                      fontSize: 13,
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => ejecutarAccion('rechazar', { motivo })}
                      disabled={loading || !motivo.trim()}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        background: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: !motivo.trim() || loading ? 'not-allowed' : 'pointer',
                        opacity: !motivo.trim() ? 0.5 : 1,
                      }}
                    >
                      {loading ? 'Procesando…' : 'Confirmar rechazo'}
                    </button>
                    <button
                      onClick={() => {
                        setAccionActiva(null);
                        setMotivo('');
                      }}
                      style={{
                        padding: '7px 12px',
                        background: 'white',
                        color: '#6B7280',
                        border: '1px solid #D1D5DB',
                        borderRadius: 4,
                        fontWeight: 500,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
