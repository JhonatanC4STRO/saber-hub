'use client';
import { useState, useEffect } from 'react';
import styles from './CalificarManual.module.css';

export default function CalificarManual({ evaluacionId }) {
  const [intentos, setIntentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // intento seleccionado
  const [detalle, setDetalle] = useState(null);
  const [califs, setCalifs] = useState({}); // { respuestaId: { calificacion, feedback } }
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch(`/api/evaluaciones/${evaluacionId}/intentos`)
      .then((r) => r.json())
      .then((data) => {
        setIntentos(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [evaluacionId]);

  const verDetalle = async (intento) => {
    setSelected(intento);
    setMsg(null);
    const res = await fetch(`/api/intentos/${intento.id}`);
    const data = await res.json();
    setDetalle(data);
    // Inicializar calificaciones con las existentes
    const init = {};
    data.respuestasAprendiz.forEach((r) => {
      if (r.pendienteRevision || r.pregunta.tipo === 'desarrollo') {
        init[r.id] = {
          calificacion: r.calificacion !== null ? Number(r.calificacion) : '',
          feedback: r.feedbackInstructor || '',
        };
      }
    });
    setCalifs(init);
  };

  const handleCalifChange = (id, campo, valor) => {
    setCalifs((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  };

  const guardar = async () => {
    setGuardando(true);
    setMsg(null);
    const payload = Object.entries(califs).map(([respuestaId, c]) => ({
      respuestaId,
      calificacion: Number(c.calificacion) || 0,
      feedbackInstructor: c.feedback || null,
    }));

    const res = await fetch(`/api/intentos/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calificaciones: payload }),
    });
    const data = await res.json();
    setMsg(res.ok ? { tipo: 'ok', texto: data.message } : { tipo: 'err', texto: data.message });
    if (res.ok) {
      // Recargar lista
      const lista = await fetch(`/api/evaluaciones/${evaluacionId}/intentos`).then((r) => r.json());
      setIntentos(Array.isArray(lista) ? lista : []);
    }
    setGuardando(false);
  };

  if (loading) return <p className={styles.hint}>Cargando intentos…</p>;
  if (!intentos.length)
    return <p className={styles.hint}>No hay intentos registrados para esta evaluación.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.split}>
        {/* Lista de intentos */}
        <aside className={styles.lista}>
          <h3 className={styles.listaTitle}>Intentos</h3>
          {intentos.map((it) => (
            <button
              key={it.id}
              className={`${styles.intentoBtn} ${selected?.id === it.id ? styles.activo : ''}`}
              onClick={() => verDetalle(it)}
            >
              <span className={styles.nombre}>{it.usuario.nombre}</span>
              <span className={`${styles.estadoBadge} ${styles['estado_' + it.estado]}`}>
                {it.estado}
              </span>
              {it.puntaje !== null && <span className={styles.puntaje}>{it.puntaje}%</span>}
              {it.respuestasAprendiz?.some((r) => r.pendienteRevision) && (
                <span className={styles.pendienteBadge}>⏳ Pendiente</span>
              )}
            </button>
          ))}
        </aside>

        {/* Detalle del intento */}
        <main className={styles.detalle}>
          {!detalle && <p className={styles.hint}>Selecciona un intento para calificar.</p>}
          {detalle && (
            <>
              <div className={styles.detalleHeader}>
                <div>
                  <h3 className={styles.detalleNombre}>{detalle.usuario.nombre}</h3>
                  <p className={styles.detalleEmail}>{detalle.usuario.email}</p>
                </div>
                <div className={`${styles.estadoBadge} ${styles['estado_' + detalle.estado]}`}>
                  {detalle.estado}
                </div>
              </div>

              {msg && (
                <div className={msg.tipo === 'ok' ? styles.successMsg : styles.errorMsg}>
                  {msg.texto}
                </div>
              )}

              {detalle.respuestasAprendiz.map((r) => (
                <div key={r.id} className={styles.respCard}>
                  <div className={styles.respHeader}>
                    <span className={styles.tipoBadge}>{labelTipo(r.pregunta.tipo)}</span>
                    <span className={styles.puntosMax}>
                      {r.pregunta.puntos} pt{r.pregunta.puntos !== 1 ? 's' : ''} máx.
                    </span>
                  </div>
                  <p className={styles.enunciado}>{r.pregunta.pregunta}</p>

                  {/* Respuesta del alumno */}
                  {r.opcion && (
                    <p className={styles.respuestaAlumno}>
                      Seleccionó: <strong>{r.opcion.textoOpcion}</strong>
                    </p>
                  )}
                  {r.textoRespuesta && (
                    <p className={styles.respuestaAlumno}>
                      Respondió: <em>"{r.textoRespuesta}"</em>
                    </p>
                  )}

                  {/* Calificación automática */}
                  {!r.pendienteRevision && r.calificacion !== null && (
                    <div className={styles.autoCalif}>
                      ✅ Calificación automática: <strong>{r.calificacion} pts</strong>
                    </div>
                  )}

                  {/* Calificación manual */}
                  {(r.pendienteRevision || r.pregunta.tipo === 'desarrollo') &&
                    califs[r.id] !== undefined && (
                      <div className={styles.manualBlock}>
                        <label className={styles.label}>
                          Puntaje otorgado (máx {r.pregunta.puntos})
                          <input
                            className={styles.input}
                            type="number"
                            min={0}
                            max={r.pregunta.puntos}
                            step={0.5}
                            value={califs[r.id].calificacion}
                            onChange={(e) =>
                              handleCalifChange(r.id, 'calificacion', e.target.value)
                            }
                          />
                        </label>
                        <label className={styles.label}>
                          Retroalimentación (opcional)
                          <textarea
                            className={styles.textarea}
                            rows={2}
                            placeholder="Comentario para el estudiante..."
                            value={califs[r.id].feedback}
                            onChange={(e) => handleCalifChange(r.id, 'feedback', e.target.value)}
                          />
                        </label>
                      </div>
                    )}
                </div>
              ))}

              {Object.keys(califs).length > 0 && (
                <div className={styles.footerAcciones}>
                  <button className={styles.btnGuardar} onClick={guardar} disabled={guardando}>
                    {guardando ? 'Guardando…' : '💾 Guardar calificaciones'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function labelTipo(tipo) {
  const map = {
    opcion_multiple: 'Opción múltiple',
    verdadero_falso: 'Verdadero / Falso',
    respuesta_corta: 'Respuesta corta',
    desarrollo: 'Desarrollo',
  };
  return map[tipo] || tipo;
}
