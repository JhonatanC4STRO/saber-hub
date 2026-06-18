'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import { useState, useEffect } from 'react';
import TomarEvaluacion from './TomarEvaluacion';
import styles from './MisEvaluaciones.module.css';

export default function MisEvaluaciones() {
  const [evaluaciones, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluActiva, setEvalActiva] = useState(null); // id de la evaluación que se está tomando

  useEffect(() => {
    fetch('/api/evaluaciones')
      .then((r) => r.json())
      .then((data) => {
        setEvals(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  if (evaluActiva) {
    return (
      <TomarEvaluacion
        evaluacionId={evaluActiva}
        onFinalizado={() => {
          setEvalActiva(null);
          setLoading(true);
          fetch('/api/evaluaciones')
            .then((r) => r.json())
            .then((d) => {
              setEvals(Array.isArray(d) ? d : []);
              setLoading(false);
            });
        }}
      />
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Mis Evaluaciones</h2>

      {loading && <p className={styles.hint}>Cargando evaluaciones disponibles…</p>}

      {!loading && !evaluaciones.length && (
        <div className={styles.empty}>
          <span><EmojiIcon emoji="📋" /></span>
          <p>No hay evaluaciones disponibles por ahora.</p>
        </div>
      )}

      <div className={styles.grid}>
        {evaluaciones.map((ev) => (
          <div key={ev.id} className={styles.card}>
            <div className={styles.cardTop}>
              <h3 className={styles.cardTitle}>{ev.titulo}</h3>
              {ev.descripcion && <p className={styles.cardDesc}>{ev.descripcion}</p>}
            </div>
            <div className={styles.cardMeta}>
              {ev.curso && <span className={styles.tag}><EmojiIcon emoji="📚" className="mr-1" /> {ev.curso.titulo}</span>}
              {ev.modulo && <span className={styles.tag}><EmojiIcon emoji="📦" className="mr-1" /> {ev.modulo.titulo}</span>}
              <span className={styles.tag}><EmojiIcon emoji="❓" className="mr-1" /> {ev._count?.preguntas ?? 0} preguntas</span>
              <span className={styles.tag}><EmojiIcon emoji="🎯" className="mr-1" /> Aprobación: {ev.puntajeMinimo}%</span>
              {ev.duracionMinutos && <span className={styles.tag}>⏱ {ev.duracionMinutos} min</span>}
              <span className={styles.tag}>
                🔄 {ev.intentosMaximos} intento{ev.intentosMaximos !== 1 ? 's' : ''}
              </span>
            </div>
            <button className={styles.btnTomar} onClick={() => setEvalActiva(ev.id)}>
              Comenzar evaluación →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
