'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import { useEffect, useState } from 'react';

export default function VerificadorCertificado({ codigo }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/certificados/verificar/${codigo}`)
      .then((r) => r.json())
      .then((d) => {
        setDatos(d);
        setLoading(false);
      })
      .catch(() => {
        setError('Error de red');
        setLoading(false);
      });
  }, [codigo]);

  const s = {
    page: {
      minHeight: '100vh',
      background: '#f0f9ff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
    },
    card: {
      background: '#fff',
      borderRadius: '16px',
      padding: '3rem 2.5rem',
      maxWidth: '560px',
      width: '100%',
      boxShadow: '0 8px 40px rgba(0,0,0,.08)',
      textAlign: 'center',
    },
    icon: { fontSize: '4rem', marginBottom: '1rem' },
    h1: { fontSize: '1.6rem', fontWeight: '700', margin: '0 0 .5rem' },
    sub: { color: '#64748b', fontSize: '.95rem', marginBottom: '2rem' },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '.75rem',
      textAlign: 'left',
      marginBottom: '1.5rem',
    },
    item: { background: '#f8fafc', borderRadius: '10px', padding: '.75rem 1rem' },
    label: {
      fontSize: '.75rem',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '.5px',
      display: 'block',
      marginBottom: '.15rem',
    },
    value: { fontSize: '.95rem', fontWeight: '600', color: '#1e293b' },
    code: {
      fontFamily: 'monospace',
      background: '#f1f5f9',
      padding: '.4rem .8rem',
      borderRadius: '6px',
      fontSize: '.85rem',
      letterSpacing: '1px',
      color: '#475569',
      marginBottom: '1.5rem',
      display: 'inline-block',
    },
    hash: { fontSize: '.7rem', color: '#94a3b8', wordBreak: 'break-all', marginTop: '.5rem' },
    valid: {
      background: '#dcfce7',
      border: '2px solid #86efac',
      borderRadius: '12px',
      padding: '.75rem 1.5rem',
      color: '#166534',
      fontWeight: '700',
      display: 'inline-block',
      marginBottom: '1.5rem',
      fontSize: '1rem',
    },
    revoked: {
      background: '#fee2e2',
      border: '2px solid #fca5a5',
      borderRadius: '12px',
      padding: '.75rem 1.5rem',
      color: '#991b1b',
      fontWeight: '700',
      display: 'inline-block',
      marginBottom: '1.5rem',
      fontSize: '1rem',
    },
    notfound: {
      background: '#fff7ed',
      border: '2px solid #fed7aa',
      borderRadius: '12px',
      padding: '.75rem 1.5rem',
      color: '#9a3412',
      fontWeight: '700',
      display: 'inline-block',
      marginBottom: '1.5rem',
      fontSize: '1rem',
    },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}><EmojiIcon emoji="🎓" size={40} /></div>
        <h1 style={s.h1}>Verificación de Certificado</h1>
        <p style={s.sub}>SaberHub – Plataforma LMS</p>

        {loading && <p style={{ color: '#64748b' }}>⏳ Consultando base de datos…</p>}

        {!loading && error && <div style={s.notfound}><EmojiIcon emoji="⚠️" className="mr-1" /> {error}</div>}

        {!loading && datos && !datos.valido && datos.estado !== 'revocado' && (
          <div style={s.notfound}><EmojiIcon emoji="❌" className="mr-1" /> Código no encontrado o inválido</div>
        )}

        {!loading && datos?.estado === 'revocado' && (
          <>
            <div style={s.revoked}><EmojiIcon emoji="🚫" className="mr-1" /> Certificado REVOCADO</div>
            {datos.motivoRevocacion && (
              <p style={{ color: '#991b1b', fontSize: '.9rem', marginBottom: '1rem' }}>
                Motivo: {datos.motivoRevocacion}
              </p>
            )}
          </>
        )}

        {!loading && datos?.valido && (
          <>
            <div style={s.valid}><EmojiIcon emoji="✅" className="mr-1" /> Certificado VÁLIDO y AUTÉNTICO</div>
            <div style={s.code}>{datos.codigoUnico}</div>
            <div style={s.grid}>
              <div style={s.item}>
                <span style={s.label}>Alumno</span>
                <span style={s.value}>{datos.alumno}</span>
              </div>
              <div style={s.item}>
                <span style={s.label}>Curso</span>
                <span style={s.value}>{datos.curso}</span>
              </div>
              <div style={s.item}>
                <span style={s.label}>Instructor</span>
                <span style={s.value}>{datos.instructor}</span>
              </div>
              <div style={s.item}>
                <span style={s.label}>Fecha de emisión</span>
                <span style={s.value}>
                  {new Date(datos.fechaEmision).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {datos.institucion && (
                <div style={{ ...s.item, gridColumn: '1/-1' }}>
                  <span style={s.label}>Institución</span>
                  <span style={s.value}>{datos.institucion}</span>
                </div>
              )}
            </div>
            <p style={s.hash}>SHA-256: {datos.hashVerificacion}</p>
          </>
        )}
      </div>
    </div>
  );
}
