'use client';
import { useState, useEffect } from 'react';

export default function MisCertificados() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/certificados')
      .then((r) => r.json())
      .then((d) => {
        setCerts(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/certificados/verificar`
      : '/certificados/verificar';

  const s = {
    wrap: {
      maxWidth: '760px',
      margin: '0 auto',
      padding: '1.5rem 1rem',
      fontFamily: 'system-ui, sans-serif',
    },
    h2: { fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem' },
    card: {
      background: '#fff',
      border: '1.5px solid #e2e8f0',
      borderRadius: '14px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1rem',
      boxShadow: '0 1px 4px rgba(0,0,0,.05)',
    },
    badge: {
      display: 'inline-block',
      padding: '.25rem .65rem',
      borderRadius: '20px',
      fontSize: '.75rem',
      fontWeight: '700',
    },
    badgeE: { background: '#dcfce7', color: '#166534' },
    badgeR: { background: '#fee2e2', color: '#991b1b' },
    title: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: '.5rem 0 .25rem' },
    meta: { color: '#64748b', fontSize: '.85rem' },
    code: {
      fontFamily: 'monospace',
      background: '#f1f5f9',
      padding: '.3rem .65rem',
      borderRadius: '6px',
      fontSize: '.82rem',
      letterSpacing: '1px',
      color: '#475569',
      margin: '.75rem 0 .5rem',
      display: 'inline-block',
    },
    link: {
      display: 'inline-block',
      marginTop: '.5rem',
      background: '#6366f1',
      color: '#fff',
      padding: '.45rem 1rem',
      borderRadius: '8px',
      fontSize: '.85rem',
      fontWeight: '700',
      textDecoration: 'none',
    },
    empty: { textAlign: 'center', padding: '3rem', color: '#94a3b8' },
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.h2}>🎓 Mis Certificados</h2>
      {loading && <p style={{ color: '#94a3b8' }}>Cargando…</p>}
      {!loading && !certs.length && (
        <div style={s.empty}>
          <p style={{ fontSize: '2.5rem' }}>🎓</p>
          <p>Aún no tienes certificados. Completa un curso para obtener uno.</p>
        </div>
      )}
      {certs.map((c) => (
        <div key={c.id} style={s.card}>
          <span style={{ ...s.badge, ...(c.estado === 'emitido' ? s.badgeE : s.badgeR) }}>
            {c.estado === 'emitido' ? '✅ Válido' : '🚫 Revocado'}
          </span>
          <div style={s.title}>{c.inscripcion.curso.titulo}</div>
          <div style={s.meta}>
            👨‍🏫 {c.inscripcion.curso.instructor.nombre} &nbsp;·&nbsp; 📅{' '}
            {new Date(c.fechaEmision).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div style={s.code}>{c.codigoUnico}</div>
          {c.estado === 'revocado' && (
            <p style={{ color: '#991b1b', fontSize: '.85rem' }}>Motivo: {c.motivoRevocacion}</p>
          )}
          {c.estado === 'emitido' && (
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <a
                href={`${baseUrl}/${c.codigoUnico}`}
                target="_blank"
                rel="noreferrer"
                style={s.link}
              >
                🔍 Verificar
              </a>
              <a
                href={`/api/certificados/pdf/${c.codigoUnico}`}
                download
                style={{ ...s.link, background: '#059669' }}
              >
                ⬇ Descargar PDF
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
