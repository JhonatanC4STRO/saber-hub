'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import { useState, useEffect, useCallback } from 'react';
import styles from './TomarEvaluacion.module.css';

export default function TomarEvaluacion({ evaluacionId, onFinalizado }) {
  const [estado, setEstado] = useState('previa_cargando'); // previa_cargando | previa | iniciando | listo | enviando | resultado | error
  const [evaluacion, setEvaluacion] = useState(null);
  const [intento, setIntento] = useState(null);
  const [respuestas, setRespuestas] = useState({}); // { preguntaId: { opcionId?, textoRespuesta? } }
  const [resultado, setResultado] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar info previa (metadata, sin consumir intento)
  useEffect(() => {
    async function cargarPrevia() {
      try {
        const res = await fetch(`/api/evaluaciones/${evaluacionId}`);
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.message);
          setEstado('error');
          return;
        }
        setEvaluacion(data);
        setEstado('previa');
      } catch {
        setErrorMsg('Error al cargar la evaluación');
        setEstado('error');
      }
    }
    cargarPrevia();
  }, [evaluacionId]);

  // Iniciar intento consumiendo 1 oportunidad y generando las preguntas reales
  const iniciarExamen = async () => {
    setEstado('iniciando');
    try {
      const res = await fetch(`/api/evaluaciones/${evaluacionId}/intentos`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message);
        setEstado('error');
        return;
      }
      setIntento(data.intento);
      setEvaluacion(data.evaluacion); // Esto ya trae las preguntas
      // Inicializar respuestas vacías
      const init = {};
      data.evaluacion.preguntas.forEach((p) => {
        init[p.id] = {};
      });
      setRespuestas(init);
      if (data.evaluacion.duracionMinutos) {
        setTiempoRestante(data.evaluacion.duracionMinutos * 60);
      }
      setEstado('listo');
    } catch {
      setErrorMsg('Error al iniciar la evaluación');
      setEstado('error');
    }
  };

  // Temporizador
  useEffect(() => {
    if (tiempoRestante === null || estado !== 'listo') return;
    if (tiempoRestante <= 0) {
      enviarRespuestas();
      return;
    }
    const timer = setTimeout(() => setTiempoRestante((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [tiempoRestante, estado]);

  const formatTiempo = (seg) => {
    const m = Math.floor(seg / 60)
      .toString()
      .padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const setRespuesta = (preguntaId, campo, valor) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: { ...prev[preguntaId], [campo]: valor } }));
  };

  const enviarRespuestas = useCallback(async () => {
    if (estado === 'enviando') return;
    setEstado('enviando');
    try {
      const payload = Object.entries(respuestas).map(([preguntaId, r]) => ({
        preguntaId,
        opcionId: r.opcionId || null,
        textoRespuesta: r.textoRespuesta || null,
      }));
      const res = await fetch(`/api/intentos/${intento.id}/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuestas: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message);
        setEstado('error');
        return;
      }
      setResultado(data);
      setEstado('resultado');
    } catch {
      setErrorMsg('Error al enviar las respuestas');
      setEstado('error');
    }
  }, [respuestas, intento, estado]);

  if (estado === 'previa_cargando' || estado === 'iniciando')
    return (
      <div className={styles.center}>
        <div className={styles.spinner}></div>
        <p>{estado === 'iniciando' ? 'Generando examen...' : 'Cargando evaluación...'}</p>
      </div>
    );

  if (estado === 'previa')
    return (
      <div className={styles.previaWrap}>
        <div className={styles.previaCard}>
          <div className={styles.previaIcon}><EmojiIcon emoji="📋" size={40} /></div>
          <h2 className={styles.previaTitle}>{evaluacion.titulo}</h2>
          {evaluacion.descripcion && <p className={styles.previaDesc}>{evaluacion.descripcion}</p>}

          <div className={styles.previaInfo}>
            <div className={styles.infoItem}>
              <span>⏱ Duración</span>
              <strong>
                {evaluacion.duracionMinutos
                  ? `${evaluacion.duracionMinutos} minutos`
                  : 'Sin límite'}
              </strong>
            </div>
            <div className={styles.infoItem}>
              <span><EmojiIcon emoji="🎯" className="mr-1" /> Aprobación</span>
              <strong>{evaluacion.puntajeMinimo}%</strong>
            </div>
            <div className={styles.infoItem}>
              <span><EmojiIcon emoji="🔄" className="mr-1" /> Intentos permitidos</span>
              <strong>{evaluacion.intentosMaximos}</strong>
            </div>
            <div className={styles.infoItem}>
              <span><EmojiIcon emoji="❓" className="mr-1" /> Preguntas</span>
              <strong>{evaluacion.preguntas?.length || 0}</strong>
            </div>
          </div>

          <div className={styles.previaActions}>
            <button className={styles.btnVolver} onClick={() => onFinalizado?.()}>
              Volver
            </button>
            <button className={styles.btnIniciar} onClick={iniciarExamen}>
              Comenzar Examen
            </button>
          </div>
        </div>
      </div>
    );

  if (estado === 'error')
    return (
      <div className={styles.errorBox}>
        <span><EmojiIcon emoji="⚠️" /></span>
        <p>{errorMsg}</p>
      </div>
    );

  if (estado === 'resultado')
    return (
      <div className={styles.resultadoWrap}>
        <div
          className={`${styles.resultadoCard} ${resultado.aprobado ? styles.aprobado : styles.reprobado}`}
        >
          <div className={styles.resultadoIcon}>{resultado.aprobado ? '🎉' : '📚'}</div>
          <h2 className={styles.resultadoTitle}>
            {resultado.aprobado ? '¡Aprobado!' : 'No aprobado'}
          </h2>
          <div className={styles.puntajeGrande}>{resultado.puntaje}%</div>
          <p className={styles.puntajeDetalle}>
            Puntaje mínimo: {evaluacion.puntajeMinimo}% · Obtenido: {resultado.puntaje}%
          </p>

          {resultado.tienePendientes && (
            <div className={styles.pendienteBadge}>
              ⏳ Tienes preguntas de desarrollo <strong>pendientes de revisión</strong> por el
              instructor. Tu puntaje puede cambiar una vez calificadas.
            </div>
          )}

          <button className={styles.btnVolver} onClick={() => onFinalizado?.()}>
            Volver
          </button>
        </div>
      </div>
    );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.titulo}>{evaluacion.titulo}</h2>
          {evaluacion.descripcion && <p className={styles.descripcion}>{evaluacion.descripcion}</p>}
        </div>
        {tiempoRestante !== null && (
          <div className={`${styles.timer} ${tiempoRestante < 120 ? styles.timerRed : ''}`}>
            ⏱ {formatTiempo(tiempoRestante)}
          </div>
        )}
      </div>

      {/* Preguntas */}
      <div className={styles.preguntasList}>
        {evaluacion.preguntas.map((p, idx) => (
          <div key={p.id} className={styles.preguntaCard}>
            <div className={styles.preguntaHeaderRow}>
              <span className={styles.preguntaNum}>Pregunta {idx + 1}</span>
              <span className={styles.tipoBadge}>{labelTipo(p.tipo)}</span>
              <span className={styles.puntosBadge}>
                {p.puntos} pt{p.puntos !== 1 ? 's' : ''}
              </span>
            </div>
            <p className={styles.enunciado}>{p.pregunta}</p>

            {/* Opción múltiple / Verdadero‑Falso */}
            {(p.tipo === 'opcion_multiple' || p.tipo === 'verdadero_falso') && (
              <div className={styles.opciones}>
                {p.opciones.map((o) => (
                  <label
                    key={o.id}
                    className={`${styles.opcionLabel} ${respuestas[p.id]?.opcionId === o.id ? styles.opcionSeleccionada : ''}`}
                  >
                    <input
                      type="radio"
                      name={`preg-${p.id}`}
                      value={o.id}
                      checked={respuestas[p.id]?.opcionId === o.id}
                      onChange={() => setRespuesta(p.id, 'opcionId', o.id)}
                      className={styles.radioHidden}
                    />
                    <span className={styles.radioCustom}></span>
                    {o.textoOpcion}
                  </label>
                ))}
              </div>
            )}

            {/* Respuesta corta */}
            {p.tipo === 'respuesta_corta' && (
              <input
                className={styles.inputCorta}
                type="text"
                placeholder="Escribe tu respuesta..."
                value={respuestas[p.id]?.textoRespuesta || ''}
                onChange={(e) => setRespuesta(p.id, 'textoRespuesta', e.target.value)}
              />
            )}

            {/* Desarrollo */}
            {p.tipo === 'desarrollo' && (
              <div>
                <textarea
                  className={styles.textareaDesarrollo}
                  rows={5}
                  placeholder="Desarrolla tu respuesta aquí..."
                  value={respuestas[p.id]?.textoRespuesta || ''}
                  onChange={(e) => setRespuesta(p.id, 'textoRespuesta', e.target.value)}
                />
                <p className={styles.hintDesarrollo}>
                  ⏳ Esta pregunta será revisada manualmente por el instructor.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón enviar */}
      <div className={styles.footer}>
        <button
          className={styles.btnEnviar}
          onClick={enviarRespuestas}
          disabled={estado === 'enviando'}
        >
          {estado === 'enviando' ? 'Enviando…' : '📨 Enviar Evaluación'}
        </button>
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
