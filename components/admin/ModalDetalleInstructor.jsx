'use client';
import { useState, useEffect } from 'react';

const ESTADOS_BADGE = {
  pendiente: { bg: '#FEF3C7', color: '#92400E', label: 'PENDIENTE' },
  en_revision: { bg: '#DBEAFE', color: '#1E40AF', label: 'EN REVISIÓN' },
  aprobada: { bg: '#D1FAE5', color: '#065F46', label: 'APROBADA' },
  rechazada: { bg: '#FEE2E2', color: '#991B1B', label: 'RECHAZADA' },
};

export default function ModalDetalleInstructor({ solicitudId, onClose, onRefresh }) {
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('perfil');
  const [decision, setDecision] = useState('aprobar');
  const [motivo, setMotivo] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [activePreview, setActivePreview] = useState(null);

  useEffect(() => {
    fetch(`/api/admin/solicitudes-instructor/${solicitudId}`)
      .then((res) => res.json())
      .then((data) => {
        setSolicitud(data.solicitud);
        setLoading(false);
        if (data.solicitud?.documentos) {
          try {
            const parsed = JSON.parse(data.solicitud.documentos);
            if (parsed && parsed.length > 0) {
              setActivePreview(parsed[0]);
            }
          } catch (e) {
            console.error('Error setting initial preview in ModalDetalleInstructor', e);
          }
        }
      })
      .catch(() => setLoading(false));
  }, [solicitudId]);

  async function handleDecision() {
    if (decision === 'rechazar' && motivo.trim().length < 20) {
      setMessage('El motivo debe tener al menos 20 caracteres.');
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      const res = await fetch(`/api/admin/solicitudes-instructor/${solicitudId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado:
            decision === 'aprobar'
              ? 'aprobada'
              : decision === 'rechazar'
                ? 'rechazada'
                : 'en_revision',
          motivo,
        }),
      });

      if (res.ok) {
        setMessage('Decisión registrada correctamente.');
        setTimeout(() => {
          onRefresh();
          onClose();
        }, 1000);
      } else {
        setMessage('Error al procesar la solicitud.');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading)
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div style={{ background: 'white', padding: 40, borderRadius: 8 }}>Cargando…</div>
      </div>
    );

  if (!solicitud) return null;

  const badge = ESTADOS_BADGE[solicitud.estado] || ESTADOS_BADGE.pendiente;
  const initials =
    solicitud.usuario?.nombre
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'SI';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          width: '90%',
          maxWidth: 720,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 32,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1E40AF',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
                {solicitud.usuario?.nombre}
              </p>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                {solicitud.usuario?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            ✕
          </button>
        </div>

        {/* Estado y fecha */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div
            style={{
              background: badge.bg,
              color: badge.color,
              padding: '6px 12px',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 11,
            }}
          >
            {badge.label}
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
            Enviada el {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-CO')}
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{ display: 'flex', gap: 12, borderBottom: '1px solid #E5E7EB', marginBottom: 24 }}
        >
          {['perfil', 'documentos', 'historial'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                fontSize: 14,
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? '#1E40AF' : '#6B7280',
                borderBottom: tab === t ? '3px solid #1E40AF' : 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t === 'perfil' && 'Perfil'}
              {t === 'documentos' && 'Documentos'}
              {t === 'historial' && 'Historial'}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'perfil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#6B7280',
                  margin: '0 0 6px 0',
                  letterSpacing: '0.04em',
                }}
              >
                ÁREAS DE EXPERIENCIA
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(solicitud.areasExperiencia
                  ? solicitud.areasExperiencia
                      .split(',')
                      .map((a) => a.trim())
                      .filter(Boolean)
                  : ['General']
                ).map((area) => (
                  <span
                    key={area}
                    style={{
                      background: '#DBEAFE',
                      color: '#1E40AF',
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '3px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#6B7280',
                  margin: '0 0 6px 0',
                  letterSpacing: '0.04em',
                }}
              >
                AÑOS DE EXPERIENCIA
              </p>
              <p style={{ fontSize: 14, color: '#374151', margin: 0, fontWeight: 600 }}>
                {solicitud.aniosExperiencia !== null && solicitud.aniosExperiencia !== undefined
                  ? `${solicitud.aniosExperiencia} años`
                  : 'Sin especificar'}
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#6B7280',
                  margin: '0 0 6px 0',
                  letterSpacing: '0.04em',
                }}
              >
                MOTIVACIÓN
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: '#374151',
                  margin: 0,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontStyle: 'italic',
                  background: '#F9FAFB',
                  padding: 14,
                  borderRadius: 6,
                  border: '1px solid #E5E7EB',
                }}
              >
                "{solicitud.motivacion || solicitud.experiencia || 'Sin detalles de motivación.'}"
              </p>
            </div>
          </div>
        )}

        {tab === 'documentos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {solicitud.enlacePortafolio && (
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#6B7280',
                    margin: '0 0 6px 0',
                    letterSpacing: '0.04em',
                  }}
                >
                  PORTAFOLIO / ENLACE PROFESIONAL
                </p>
                <a
                  href={solicitud.enlacePortafolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 14,
                    color: '#1E40AF',
                    textDecoration: 'underline',
                    fontWeight: 600,
                    wordBreak: 'break-all',
                  }}
                >
                  🔗 {solicitud.enlacePortafolio}
                </a>
              </div>
            )}

            <div>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#6B7280',
                  margin: '0 0 12px 0',
                  letterSpacing: '0.04em',
                }}
              >
                DOCUMENTOS DE RESPALDO ADJUNTOS
              </p>

              {(() => {
                let docs = [];
                if (solicitud.documentos) {
                  try {
                    docs = JSON.parse(solicitud.documentos);
                  } catch (e) {
                    console.error('Error parseando documentos in ModalDetalleInstructor', e);
                  }
                }

                if (docs.length === 0) {
                  return (
                    <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>
                      El solicitante no adjuntó documentos de respaldo (hoja de vida, certificados o
                      títulos).
                    </p>
                  );
                }

                return (
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {/* Lista de Documentos */}
                    <div
                      style={{
                        flex: '1 1 250px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {docs.map((file) => {
                        const isPdf = file.mimetype && file.mimetype.includes('pdf');
                        const isSelected = activePreview?.filename === file.filename;

                        return (
                          <div
                            key={file.filename}
                            onClick={() => setActivePreview(file)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px',
                              background: isSelected ? '#EFF6FF' : '#F9FAFB',
                              border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                              borderRadius: 6,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 4,
                                  background: isPdf ? '#FEE2E2' : '#D1FAE5',
                                  color: isPdf ? '#991B1B' : '#065F46',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: 11,
                                }}
                              >
                                {isPdf ? 'PDF' : 'IMG'}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#374151',
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {file.nombre}
                                </span>
                                <span style={{ fontSize: 11, color: '#6B7280' }}>
                                  Clic para previsualizar
                                </span>
                              </div>
                            </div>

                            <a
                              href={`/api/solicitudes-instructor/documentos/${file.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: 12,
                                color: '#1E40AF',
                                textDecoration: 'none',
                                fontWeight: 600,
                                background: '#E0F2FE',
                                padding: '4px 8px',
                                borderRadius: 4,
                              }}
                            >
                              Descargar
                            </a>
                          </div>
                        );
                      })}
                    </div>

                    {/* Panel de Previsualización */}
                    <div
                      style={{
                        flex: '1 1 300px',
                        border: '1px solid #E5E7EB',
                        borderRadius: 6,
                        padding: 16,
                        background: '#F9FAFB',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 300,
                      }}
                    >
                      {activePreview ? (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderBottom: '1px solid #E5E7EB',
                              paddingBottom: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#374151',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '80%',
                              }}
                            >
                              Previsualizando: {activePreview.nombre}
                            </span>
                            <a
                              href={`/api/solicitudes-instructor/documentos/${activePreview.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 11,
                                color: '#1E40AF',
                                fontWeight: 600,
                                textDecoration: 'underline',
                              }}
                            >
                              Abrir completo ↗
                            </a>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              background: '#F3F4F6',
                              borderRadius: 4,
                              padding: 8,
                              overflow: 'auto',
                              flex: 1,
                              minHeight: 250,
                            }}
                          >
                            {activePreview.mimetype &&
                            activePreview.mimetype.startsWith('image/') ? (
                              <img
                                src={`/api/solicitudes-instructor/documentos/${activePreview.filename}`}
                                alt={activePreview.nombre}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '350px',
                                  objectFit: 'contain',
                                  borderRadius: 4,
                                }}
                              />
                            ) : activePreview.mimetype && activePreview.mimetype.includes('pdf') ? (
                              <iframe
                                src={`/api/solicitudes-instructor/documentos/${activePreview.filename}`}
                                style={{
                                  width: '100%',
                                  height: '350px',
                                  border: 'none',
                                  borderRadius: 4,
                                }}
                                title={activePreview.nombre}
                              />
                            ) : (
                              <span style={{ fontSize: 13, color: '#6B7280' }}>
                                Previsualización no disponible para este formato.
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: 250,
                            color: '#9CA3AF',
                            textAlign: 'center',
                          }}
                        >
                          <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>
                            👁️
                          </span>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                            Selecciona un documento de la lista para ver su previsualización
                            interactiva.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {tab === 'historial' && (
          <div>
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>Primera solicitud</p>
          </div>
        )}

        {/* Decisión */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24, marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
            Tomar decisión
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {[
              {
                id: 'aprobar',
                label: 'Aprobar',
                color: '#10B981',
                desc: 'El alumno se convertirá en instructor y recibirá un correo de bienvenida.',
              },
              {
                id: 'solicitar_info',
                label: 'Solicitar información adicional',
                color: '#1E40AF',
                desc: '',
              },
              {
                id: 'rechazar',
                label: 'Rechazar',
                color: '#EF4444',
                desc: 'Proporciona un motivo del rechazo.',
              },
            ].map((d) => (
              <div
                key={d.id}
                onClick={() => setDecision(d.id)}
                style={{
                  border: decision === d.id ? `2px solid ${d.color}` : '1px solid #E5E7EB',
                  background: decision === d.id ? d.color + '10' : 'white',
                  padding: 12,
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    checked={decision === d.id}
                    onChange={() => setDecision(d.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600, color: '#111827' }}>{d.label}</span>
                </label>
                {d.desc && (
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0 24px' }}>{d.desc}</p>
                )}
              </div>
            ))}
          </div>

          {(decision === 'rechazar' || decision === 'solicitar_info') && (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 8,
                }}
              >
                {decision === 'rechazar'
                  ? 'Motivo del rechazo (mínimo 20 caracteres)'
                  : 'Información solicitada'}
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 12,
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                placeholder={
                  decision === 'rechazar'
                    ? 'Explica por qué se rechaza la solicitud...'
                    : 'Especifica qué información necesitas...'
                }
              />
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0 0' }}>
                {motivo.length} caracteres
              </p>
            </div>
          )}

          {decision === 'rechazar' && (
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
                padding: 12,
                borderRadius: 4,
                marginBottom: 20,
                fontSize: 12,
                color: '#92400E',
              }}
            >
              ℹ️ El solicitante deberá esperar 30 días para volver a aplicar.
            </div>
          )}

          {message && (
            <div
              style={{
                background: message.includes('Error') ? '#FEE2E2' : '#ECFDF5',
                color: message.includes('Error') ? '#991B1B' : '#065F46',
                padding: 12,
                borderRadius: 4,
                marginBottom: 20,
                fontSize: 13,
              }}
            >
              {message}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#374151',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              disabled={processing}
            >
              Cancelar
            </button>
            <button
              onClick={handleDecision}
              disabled={processing}
              style={{
                padding: '10px 20px',
                background:
                  decision === 'aprobar'
                    ? '#10B981'
                    : decision === 'rechazar'
                      ? '#EF4444'
                      : '#1E40AF',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: processing ? 0.6 : 1,
              }}
            >
              {processing ? 'Procesando…' : 'Confirmar decisión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
