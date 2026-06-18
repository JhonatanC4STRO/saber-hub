'use client';
import React, { useState, useEffect, useCallback } from 'react';
import VisorCurso from './VisorCurso';

export default function MisCursosEstudiante() {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dandoBaja, setDandoBaja] = useState(null);
  const [cursoVisor, setCursoVisor] = useState(null); // { cursoId, titulo }

  const fetchInscripciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inscripciones');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInscripciones(data.inscripciones);
    } catch {
      // silenciar
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInscripciones();
  }, [fetchInscripciones]);

  const handleDarseDeBaja = async (inscripcionId, tituloCurso) => {
    if (
      !confirm(
        `¿Seguro que deseas retirarte del curso "${tituloCurso}"?\nTu progreso quedará guardado.`
      )
    )
      return;
    setDandoBaja(inscripcionId);
    try {
      const res = await fetch(`/api/inscripciones/${inscripcionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'retirado' }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Te has retirado del curso. Tu progreso sigue guardado.`);
        fetchInscripciones();
      } else {
        alert('Error: ' + data.message);
      }
    } catch {
      alert('Error de red');
    } finally {
      setDandoBaja(null);
    }
  };

  if (loading) return <p>Cargando tus cursos...</p>;

  const activos = inscripciones.filter((i) => i.estado === 'activo');
  const retirados = inscripciones.filter((i) => i.estado === 'retirado');

  return (
    <div>
      <h2>Mis Cursos</h2>

      {activos.length === 0 ? (
        <div
          style={{
            padding: '30px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginTop: '10px',
          }}
        >
          <p style={{ color: '#666' }}>No estás inscrito en ningún curso todavía.</p>
          <p style={{ color: '#1a73e8', fontSize: '14px' }}>
            👈 Ve a "Explorar Cursos" para descubrirlos.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          {activos.map((ins) => (
            <div
              key={ins.id}
              style={{
                border: '1px solid #dadce0',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              }}
            >
              <div style={{ height: '120px', backgroundColor: '#e8f0fe', overflow: 'hidden' }}>
                {ins.curso.imgPortada ? (
                  <img
                    src={ins.curso.imgPortada}
                    alt={ins.curso.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                    }}
                  >
                    📚
                  </div>
                )}
              </div>
              <div style={{ padding: '14px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#1a73e8',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                  }}
                >
                  {ins.curso.categoria?.nombre || 'General'}
                </span>
                <h4 style={{ margin: '4px 0 8px 0', fontSize: '15px', color: '#202124' }}>
                  {ins.curso.titulo}
                </h4>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: '6px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '3px',
                    }}
                  >
                    <div
                      style={{
                        width: `${Number(ins.progreso) || 0}%`,
                        height: '100%',
                        backgroundColor: '#1a73e8',
                        borderRadius: '3px',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', color: '#5f6368', whiteSpace: 'nowrap' }}>
                    {Number(ins.progreso) || 0}%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#1a73e8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                    }}
                    onClick={() =>
                      setCursoVisor({ cursoId: ins.curso.id, titulo: ins.curso.titulo })
                    }
                  >
                    Continuar →
                  </button>
                  <button
                    onClick={() => handleDarseDeBaja(ins.id, ins.curso.titulo)}
                    disabled={dandoBaja === ins.id}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      color: '#c5221f',
                      border: '1px solid #c5221f',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {dandoBaja === ins.id ? '...' : 'Retirarme'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {retirados.length > 0 && (
        <details style={{ marginTop: '30px' }}>
          <summary style={{ cursor: 'pointer', color: '#5f6368', fontSize: '14px' }}>
            Cursos en que me retiré ({retirados.length})
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {retirados.map((ins) => (
              <div
                key={ins.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#80868b', fontSize: '14px' }}>{ins.curso.titulo}</span>
                <span style={{ fontSize: '12px', color: '#9aa0a6' }}>
                  Retirado — Progreso: {Number(ins.progreso) || 0}%
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
      {cursoVisor && (
        <VisorCurso
          cursoId={cursoVisor.cursoId}
          onCerrar={() => setCursoVisor(null)}
          onProgresoActualizado={fetchInscripciones}
        />
      )}
    </div>
  );
}
