const ESTADOS_BADGE = {
  pendiente: { bg: '#FEF3C7', color: '#92400E', label: 'PENDIENTE' },
  en_revision: { bg: '#DBEAFE', color: '#1E40AF', label: 'EN REVISIÓN' },
  aprobada: { bg: '#D1FAE5', color: '#065F46', label: 'APROBADA' },
  rechazada: { bg: '#FEE2E2', color: '#991B1B', label: 'RECHAZADA' },
};

export default function CardSolicitudInstructor({ solicitud, onDetalle }) {
  const badge = ESTADOS_BADGE[solicitud.estado] || ESTADOS_BADGE.pendiente;
  const diasAtras = solicitud.fechaSolicitud
    ? Math.floor((Date.now() - new Date(solicitud.fechaSolicitud)) / (1000 * 60 * 60 * 24))
    : 0;

  const initials =
    solicitud.usuario?.nombre
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'SI';

  let docs = [];
  if (solicitud.documentos) {
    try {
      docs = JSON.parse(solicitud.documentos);
    } catch (e) {
      console.error('Error parseando documentos in CardSolicitudInstructor', e);
    }
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #F3F4F6',
        borderRadius: 4,
        padding: 20,
        borderBottom: '2px solid #1E40AF',
        display: 'flex',
        gap: 20,
      }}
    >
      {/* Perfil (25%) */}
      <div style={{ flex: '0 0 25%', minWidth: 0 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E40AF',
            fontWeight: 700,
            fontSize: 18,
            marginBottom: 12,
          }}
        >
          {initials}
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
          {solicitud.usuario?.nombre || 'Usuario'}
        </p>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 8px 0' }}>
          {solicitud.usuario?.email || 'sin@email.com'}
        </p>
        <div
          style={{
            display: 'inline-block',
            background: '#F3F4F6',
            color: '#374151',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          ALUMNO
        </div>
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Miembro desde ene 2026</p>
      </div>

      {/* Detalles (50%) */}
      <div style={{ flex: '0 0 50%', minWidth: 0 }}>
        {/* Áreas */}
        <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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

        {/* Experiencia */}
        <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: '0 0 8px 0' }}>
          📅{' '}
          {solicitud.aniosExperiencia !== null && solicitud.aniosExperiencia !== undefined
            ? `${solicitud.aniosExperiencia} años`
            : 'Sin especificar'}{' '}
          de experiencia
        </p>

        {/* Motivación */}
        <p
          style={{
            fontSize: 13,
            color: '#4B5563',
            margin: '0 0 8px 0',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          "{solicitud.motivacion || solicitud.experiencia || 'Sin detalles de motivación.'}"
        </p>

        {/* Documentos */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {solicitud.enlacePortafolio && (
            <a
              href={solicitud.enlacePortafolio}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#E0F2FE',
                color: '#0369A1',
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 4,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              🌐 Portafolio / Web
            </a>
          )}
          {docs.map((file) => {
            const isPdf = file.mimetype && file.mimetype.includes('pdf');
            return (
              <a
                key={file.filename}
                href={`/api/solicitudes-instructor/documentos/${file.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: isPdf ? '#FEE2E2' : '#D1FAE5',
                  color: isPdf ? '#991B1B' : '#065F46',
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {isPdf ? '📄' : '🖼️'} {file.nombre}
              </a>
            );
          })}
          {!solicitud.enlacePortafolio && docs.length === 0 && (
            <span
              style={{
                background: '#F3F4F6',
                color: '#6B7280',
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              Sin documentos adicionales
            </span>
          )}
        </div>
        <button
          onClick={onDetalle}
          style={{
            background: 'none',
            border: 'none',
            color: '#1E40AF',
            fontWeight: 500,
            fontSize: 12,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Ver detalles de postulación →
        </button>

        {/* Fecha */}
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '8px 0 0 0' }}>
          📅 Enviada el{' '}
          {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}{' '}
          (hace {diasAtras} día{diasAtras !== 1 ? 's' : ''})
        </p>
      </div>

      {/* Acciones (25%) */}
      <div style={{ flex: '0 0 25%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            background: badge.bg,
            color: badge.color,
            padding: '6px 12px',
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 11,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {badge.label}
        </div>

        <button
          onClick={onDetalle}
          style={{
            width: '100%',
            height: 40,
            background: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ✓ Aprobar
        </button>
        <button
          style={{
            width: '100%',
            height: 40,
            background: 'white',
            color: '#1E40AF',
            border: `1px solid #1E40AF`,
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Solicitar más info
        </button>
        <button
          style={{
            width: '100%',
            height: 40,
            background: 'white',
            color: '#DC2626',
            border: `1px solid #FCA5A5`,
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
