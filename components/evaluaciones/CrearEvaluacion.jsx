'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import { useState } from 'react';
import styles from './CrearEvaluacion.module.css';

const TIPOS_PREGUNTA = [
  { value: 'opcion_multiple', label: <span><EmojiIcon emoji="📋" className="mr-1.5" /> Opción múltiple</span> },
  { value: 'verdadero_falso', label: <span><EmojiIcon emoji="✅" className="mr-1.5" /> Verdadero / Falso</span> },
  { value: 'respuesta_corta', label: <span><EmojiIcon emoji="✏️" className="mr-1.5" /> Respuesta corta</span> },
  { value: 'desarrollo', label: <span><EmojiIcon emoji="📝" className="mr-1.5" /> Desarrollo</span> },
];

function nuevaPregunta() {
  return {
    pregunta: '',
    tipo: 'opcion_multiple',
    puntos: 1,
    respuestaCorrecta: '',
    patronRegex: '',
    opciones: [
      { textoOpcion: '', esCorrecta: false },
      { textoOpcion: '', esCorrecta: false },
    ],
  };
}

export default function CrearEvaluacion({ usuario, cursos = [], onCreado }) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    cursoId: '',
    moduloId: '',
    puntajeMinimo: 70,
    duracionMinutos: '',
    intentosMaximos: 1,
  });
  const [preguntas, setPreguntas] = useState([nuevaPregunta()]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  const handleCursoChange = async (cursoId) => {
    setForm((f) => ({ ...f, cursoId, moduloId: '' }));
    if (!cursoId) {
      setModulos([]);
      return;
    }
    const curso = cursos.find((c) => c.id === cursoId);
    setModulos(curso?.modulos || []);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // ——— Preguntas ———
  const updatePregunta = (i, campo, valor) => {
    setPreguntas((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [campo]: valor };
      // Al cambiar tipo a verdadero/falso inicializar opciones
      if (campo === 'tipo' && valor === 'verdadero_falso') {
        next[i].opciones = [
          { textoOpcion: 'Verdadero', esCorrecta: false },
          { textoOpcion: 'Falso', esCorrecta: false },
        ];
      } else if (campo === 'tipo' && valor === 'opcion_multiple') {
        next[i].opciones = [
          { textoOpcion: '', esCorrecta: false },
          { textoOpcion: '', esCorrecta: false },
        ];
      }
      return next;
    });
  };

  const updateOpcion = (pi, oi, campo, valor) => {
    setPreguntas((prev) => {
      const next = [...prev];
      const opciones = [...next[pi].opciones];
      if (campo === 'esCorrecta') {
        // Solo una correcta en opcion_multiple/verdadero_falso
        opciones.forEach((o, idx) => {
          opciones[idx] = { ...o, esCorrecta: false };
        });
      }
      opciones[oi] = { ...opciones[oi], [campo]: valor };
      next[pi] = { ...next[pi], opciones };
      return next;
    });
  };

  const addOpcion = (pi) => {
    setPreguntas((prev) => {
      const next = [...prev];
      next[pi] = {
        ...next[pi],
        opciones: [...next[pi].opciones, { textoOpcion: '', esCorrecta: false }],
      };
      return next;
    });
  };

  const removeOpcion = (pi, oi) => {
    setPreguntas((prev) => {
      const next = [...prev];
      const opciones = next[pi].opciones.filter((_, idx) => idx !== oi);
      next[pi] = { ...next[pi], opciones };
      return next;
    });
  };

  const addPregunta = () => setPreguntas((p) => [...p, nuevaPregunta()]);
  const removePregunta = (i) => setPreguntas((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setError(null);

    // Validaciones básicas
    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      if (!p.pregunta.trim()) {
        setError(`La pregunta #${i + 1} no tiene enunciado.`);
        setLoading(false);
        return;
      }
      if (
        (p.tipo === 'opcion_multiple' || p.tipo === 'verdadero_falso') &&
        !p.opciones.some((o) => o.esCorrecta)
      ) {
        setError(`La pregunta #${i + 1} (${p.tipo}) debe tener una opción marcada como correcta.`);
        setLoading(false);
        return;
      }
    }

    try {
      const body = {
        ...form,
        cursoId: form.cursoId || null,
        moduloId: form.moduloId || null,
        duracionMinutos: form.duracionMinutos ? Number(form.duracionMinutos) : null,
        puntajeMinimo: Number(form.puntajeMinimo),
        intentosMaximos: Number(form.intentosMaximos),
        preguntas: preguntas.map((p) => ({
          ...p,
          puntos: Number(p.puntos),
          opciones: p.tipo === 'opcion_multiple' || p.tipo === 'verdadero_falso' ? p.opciones : [],
          respuestaCorrecta: p.tipo === 'respuesta_corta' ? p.respuestaCorrecta : null,
          patronRegex: p.tipo === 'respuesta_corta' ? p.patronRegex : null,
        })),
      };

      const res = await fetch('/api/evaluaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setMensaje('✅ Evaluación creada exitosamente');
      setTimeout(() => onCreado?.(), 1200);
      // Reset
      setForm({
        titulo: '',
        descripcion: '',
        cursoId: '',
        moduloId: '',
        puntajeMinimo: 70,
        duracionMinutos: '',
        intentosMaximos: 1,
      });
      setPreguntas([nuevaPregunta()]);
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Crear Evaluación</h2>

      {mensaje && <div className={styles.success}>{mensaje}</div>}
      {error && <div className={styles.errorMsg}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ——— Datos generales ——— */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>📌 Datos generales</h3>
          <div className={styles.grid2}>
            <label className={styles.label}>
              Título *
              <input
                className={styles.input}
                name="titulo"
                value={form.titulo}
                onChange={handleFormChange}
                required
                placeholder="Ej: Examen final del módulo 1"
              />
            </label>
            <label className={styles.label}>
              Curso *
              <select
                className={styles.input}
                name="cursoId"
                value={form.cursoId}
                onChange={(e) => handleCursoChange(e.target.value)}
                required
              >
                <option value="">-- Seleccionar curso --</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {modulos.length > 0 && (
            <label className={styles.label}>
              Módulo (opcional – si aplica a un módulo específico)
              <select
                className={styles.input}
                name="moduloId"
                value={form.moduloId}
                onChange={handleFormChange}
              >
                <option value="">-- Examen de curso completo --</option>
                {modulos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.titulo}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className={styles.label}>
            Descripción / Instrucciones
            <textarea
              className={styles.textarea}
              name="descripcion"
              value={form.descripcion}
              onChange={handleFormChange}
              rows={3}
              placeholder="Instrucciones para el estudiante..."
            />
          </label>

          <div className={styles.grid3}>
            <label className={styles.label}>
              Puntaje mínimo aprobatorio (%)
              <input
                className={styles.input}
                type="number"
                name="puntajeMinimo"
                value={form.puntajeMinimo}
                onChange={handleFormChange}
                min={0}
                max={100}
              />
            </label>
            <label className={styles.label}>
              Duración (min) – opcional
              <input
                className={styles.input}
                type="number"
                name="duracionMinutos"
                value={form.duracionMinutos}
                onChange={handleFormChange}
                min={1}
                placeholder="Sin límite"
              />
            </label>
            <label className={styles.label}>
              Intentos máximos
              <input
                className={styles.input}
                type="number"
                name="intentosMaximos"
                value={form.intentosMaximos}
                onChange={handleFormChange}
                min={1}
                max={10}
              />
            </label>
          </div>
        </section>

        {/* ——— Preguntas ——— */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}><EmojiIcon emoji="❓" className="mr-1" /> Preguntas ({preguntas.length})</h3>
            <button type="button" className={styles.btnAdd} onClick={addPregunta}>
              + Agregar pregunta
            </button>
          </div>

          {preguntas.map((p, pi) => (
            <div key={pi} className={styles.preguntaCard}>
              <div className={styles.preguntaHeader}>
                <span className={styles.preguntaNum}>Pregunta {pi + 1}</span>
                {preguntas.length > 1 && (
                  <button
                    type="button"
                    className={styles.btnRemove}
                    onClick={() => removePregunta(pi)}
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>

              <div className={styles.grid2}>
                <label className={styles.label}>
                  Tipo
                  <select
                    className={styles.input}
                    value={p.tipo}
                    onChange={(e) => updatePregunta(pi, 'tipo', e.target.value)}
                  >
                    {TIPOS_PREGUNTA.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  Puntos
                  <input
                    className={styles.input}
                    type="number"
                    value={p.puntos}
                    min={1}
                    onChange={(e) => updatePregunta(pi, 'puntos', Number(e.target.value))}
                  />
                </label>
              </div>

              <label className={styles.label}>
                Enunciado *
                <textarea
                  className={styles.textarea}
                  value={p.pregunta}
                  rows={2}
                  onChange={(e) => updatePregunta(pi, 'pregunta', e.target.value)}
                  placeholder="Escribe la pregunta aquí..."
                />
              </label>

              {/* Opciones para opcion_multiple y verdadero_falso */}
              {(p.tipo === 'opcion_multiple' || p.tipo === 'verdadero_falso') && (
                <div className={styles.opcionesBlock}>
                  <p className={styles.opcionesLabel}>Opciones (marca la correcta ✓)</p>
                  {p.opciones.map((o, oi) => (
                    <div key={oi} className={styles.opcionRow}>
                      <input
                        type="radio"
                        name={`correcta-${pi}`}
                        checked={o.esCorrecta}
                        onChange={() => updateOpcion(pi, oi, 'esCorrecta', true)}
                        className={styles.radio}
                        title="Marcar como correcta"
                      />
                      <input
                        className={styles.inputOpcion}
                        value={o.textoOpcion}
                        onChange={(e) => updateOpcion(pi, oi, 'textoOpcion', e.target.value)}
                        placeholder={`Opción ${oi + 1}`}
                        disabled={p.tipo === 'verdadero_falso'}
                      />
                      {p.tipo === 'opcion_multiple' && p.opciones.length > 2 && (
                        <button
                          type="button"
                          className={styles.btnRemoveOpcion}
                          onClick={() => removeOpcion(pi, oi)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {p.tipo === 'opcion_multiple' && (
                    <button
                      type="button"
                      className={styles.btnAddOpcion}
                      onClick={() => addOpcion(pi)}
                    >
                      + Opción
                    </button>
                  )}
                </div>
              )}

              {/* Respuesta corta */}
              {p.tipo === 'respuesta_corta' && (
                <div className={styles.grid2}>
                  <label className={styles.label}>
                    Respuesta correcta (exacta)
                    <input
                      className={styles.input}
                      value={p.respuestaCorrecta}
                      onChange={(e) => updatePregunta(pi, 'respuestaCorrecta', e.target.value)}
                      placeholder="Texto exacto esperado"
                    />
                  </label>
                  <label className={styles.label}>
                    Patrón Regex (opcional)
                    <input
                      className={styles.input}
                      value={p.patronRegex}
                      onChange={(e) => updatePregunta(pi, 'patronRegex', e.target.value)}
                      placeholder="Ej: ^(hola|hello)$"
                    />
                  </label>
                </div>
              )}

              {/* Desarrollo */}
              {p.tipo === 'desarrollo' && (
                <div className={styles.infoBox}>
                  📝 Esta pregunta será calificada <strong>manualmente</strong> por el instructor
                  después de que el alumno envíe el examen.
                </div>
              )}
            </div>
          ))}
        </section>

        <div className={styles.formFooter}>
          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? 'Guardando...' : '💾 Crear Evaluación'}
          </button>
        </div>
      </form>
    </div>
  );
}
