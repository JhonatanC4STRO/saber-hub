'use client';
import { useState, useEffect } from 'react';

export default function AdminCertificados() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null); // id del cert a revocar
  const [motivo, setMotivo] = useState('');
  const [msg, setMsg] = useState(null);

  const cargar = () => {
    setLoading(true);
    fetch('/api/certificados')
      .then((r) => r.json())
      .then((d) => {
        setCerts(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  };
  useEffect(() => {
    cargar();
  }, []);

  const revocar = async () => {
    if (!motivo.trim()) return;
    const res = await fetch(`/api/certificados/${revoking}/revocar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo }),
    });
    const data = await res.json();
    setMsg(res.ok ? '✅ Certificado revocado' : '❌ ' + data.message);
    setRevoking(null);
    setMotivo('');
    cargar();
  };

  const s = {
    wrap: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '1.5rem 1rem',
      fontFamily: 'system-ui, sans-serif',
    },
    h2: { fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' },
    msg: {
      background: '#f0fdf4',
      border: '1px solid #86efac',
      color: '#166534',
      padding: '.75rem 1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontSize: '.9rem',
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' },
    th: {
      background: '#f8fafc',
      padding: '.7rem 1rem',
      textAlign: 'left',
      fontWeight: '700',
      color: '#64748b',
      borderBottom: '2px solid #e2e8f0',
      fontSize: '.8rem',
      textTransform: 'uppercase',
    },
    td: {
      padding: '.75rem 1rem',
      borderBottom: '1px solid #f1f5f9',
      color: '#1e293b',
      verticalAlign: 'top',
    },
    badgeE: {
      display: 'inline-block',
      background: '#dcfce7',
      color: '#166534',
      padding: '.15rem .5rem',
      borderRadius: '20px',
      fontWeight: '700',
      fontSize: '.75rem',
    },
    badgeR: {
      display: 'inline-block',
      background: '#fee2e2',
      color: '#991b1b',
      padding: '.15rem .5rem',
      borderRadius: '20px',
      fontWeight: '700',
      fontSize: '.75rem',
    },
    btnRev: {
      background: '#fee2e2',
      color: '#b91c1c',
      border: '1.5px solid #fca5a5',
      padding: '.3rem .75rem',
      borderRadius: '7px',
      fontSize: '.8rem',
      fontWeight: '600',
      cursor: 'pointer',
    },
    modal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
    },
    mBox: {
      background: '#fff',
      borderRadius: '14px',
      padding: '2rem',
      maxWidth: '420px',
      width: '90%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    input: {
      padding: '.6rem .9rem',
      border: '1.5px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '.9rem',
      fontFamily: 'inherit',
    },
    btnPri: {
      background: '#b91c1c',
      color: '#fff',
      border: 'none',
      padding: '.65rem 1.4rem',
      borderRadius: '9px',
      fontWeight: '700',
      cursor: 'pointer',
      fontSize: '.9rem',
    },
    btnSec: {
      background: '#f1f5f9',
      border: '1.5px solid #e2e8f0',
      color: '#475569',
      padding: '.65rem 1.2rem',
      borderRadius: '9px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '.88rem',
    },
  };

  return (
    <div style={s.wrap}>
      <h2 style={s.h2}>🎓 Gestión de Certificados</h2>
      {msg && (
        <div style={s.msg}>
          {msg}{' '}
          <button
            onClick={() => setMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {loading && <p style={{ color: '#94a3b8' }}>Cargando…</p>}
      {!loading && !certs.length && (
        <p style={{ color: '#94a3b8' }}>No hay certificados emitidos aún.</p>
      )}

      {!loading && certs.length > 0 && (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Alumno</th>
              <th style={s.th}>Curso</th>
              <th style={s.th}>Código</th>
              <th style={s.th}>Fecha</th>
              <th style={s.th}>Estado</th>
              <th style={s.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((c) => (
              <tr key={c.id}>
                <td style={s.td}>{c.inscripcion.usuario.nombre}</td>
                <td style={s.td}>{c.inscripcion.curso.titulo}</td>
                <td style={s.td}>
                  <code
                    style={{
                      fontSize: '.78rem',
                      background: '#f1f5f9',
                      padding: '.1rem .35rem',
                      borderRadius: '4px',
                    }}
                  >
                    {c.codigoUnico}
                  </code>
                </td>
                <td style={s.td}>{new Date(c.fechaEmision).toLocaleDateString('es-CO')}</td>
                <td style={s.td}>
                  <span style={c.estado === 'emitido' ? s.badgeE : s.badgeR}>{c.estado}</span>
                  {c.estado === 'revocado' && (
                    <div style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.2rem' }}>
                      {c.motivoRevocacion}
                    </div>
                  )}
                </td>
                <td style={s.td}>
                  {c.estado === 'emitido' && (
                    <button
                      style={s.btnRev}
                      onClick={() => {
                        setRevoking(c.id);
                        setMotivo('');
                      }}
                    >
                      🚫 Revocar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {revoking && (
        <div style={s.modal}>
          <div style={s.mBox}>
            <h3 style={{ margin: 0 }}>Revocar certificado</h3>
            <p style={{ color: '#64748b', fontSize: '.9rem', margin: 0 }}>
              Esta acción no se puede deshacer. El alumno dejará de poder usar este certificado.
            </p>
            <input
              style={s.input}
              placeholder="Motivo de revocación *"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
              <button style={s.btnSec} onClick={() => setRevoking(null)}>
                Cancelar
              </button>
              <button style={s.btnPri} onClick={revocar} disabled={!motivo.trim()}>
                Confirmar Revocación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
