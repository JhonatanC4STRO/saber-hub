'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import { useState, useEffect } from 'react';
// Reutiliza los estilos de CrearEvaluacion
import styles from './CrearEvaluacion.module.css';

const TIPOS_PREGUNTA = [
  { value: 'opcion_multiple', label: <span><EmojiIcon emoji="📋" className="mr-1.5" /> Opción múltiple</span> },
  { value: 'verdadero_falso', label: <span><EmojiIcon emoji="✅" className="mr-1.5" /> Verdadero / Falso</span> },
  { value: 'respuesta_corta', label: <span><EmojiIcon emoji="✏️" className="mr-1.5" /> Respuesta corta</span> },
  { value: 'desarrollo', label: <span><EmojiIcon emoji="📝" className="mr-1.5" /> Desarrollo</span> },
];

function preguntaVacia() {
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

/** Convierte la pregunta que llega de la API al formato interno del formulario */
function mapPreguntaApi(p) {
  return {
    pregunta: p.pregunta || '',
    tipo: p.tipo || 'opcion_multiple',
    puntos: p.puntos ?? 1,
    respuestaCorrecta: p.respuestaCorrecta || '',
    patronRegex: p.patronRegex || '',
    opciones: p.opciones?.length
      ? p.opciones.map((o) => ({ textoOpcion: o.textoOpcion, esCorrecta: o.esCorrecta ?? false }))
      : [
          { textoOpcion: '', esCorrecta: false },
          { textoOpcion: '', esCorrecta: false },
        ],
  };
}

export default function EditarEvaluacion({ evaluacionId, cursos = [], onGuardado }) {
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  // Cargar evaluación existente
  useEffect(() => {
    async function cargar() {
      const res = await fetch(`/api/evaluaciones/${evaluacionId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        setCargando(false);
        return;
      }

      setForm({
        titulo: data.titulo || '',
        descripcion: data.descripcion || '',
        cursoId: data.cursoId || '',
        moduloId: data.moduloId || '',
        puntajeMinimo: data.puntajeMinimo ?? 70,
        duracionMinutos: data.duracionMinutos ?? '',
        intentosMaximos: data.intentosMaximos ?? 1,
      });
      setPreguntas(data.preguntas?.map(mapPreguntaApi) || [preguntaVacia()]);

      // Cargar módulos del curso actual si aplica
      if (data.cursoId) {
        const curso = cursos.find((c) => c.id === data.cursoId);
        setModulos(curso?.modulos || []);
      }
      setCargando(false);
    }
    cargar();
  }, [evaluacionId]);

  const handleCursoChange = (cursoId) => {
    setForm((f) => ({ ...f, cursoId, moduloId: '' }));
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
        opciones.forEach((_, idx) => {
          opciones[idx] = { ...opciones[idx], esCorrecta: false };
        });
      }
      opciones[oi] = { ...opciones[oi], [campo]: valor };
      next[pi] = { ...next[pi], opciones };
      return next;
    });
  };

  const addOpcion = (pi) =>
    setPreguntas((prev) => {
      const n = [...prev];
      n[pi] = { ...n[pi], opciones: [...n[pi].opciones, { textoOpcion: '', esCorrecta: false }] };
      return n;
    });
  const removeOpcion = (pi, oi) =>
    setPreguntas((prev) => {
      const n = [...prev];
      n[pi] = { ...n[pi], opciones: n[pi].opciones.filter((_, idx) => idx !== oi) };
      return n;
    });
  const addPregunta = () => setPreguntas((p) => [...p, preguntaVacia()]);
  const removePregunta = (i) => setPreguntas((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setError(null);

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
        setError(`La pregunta #${i + 1} debe tener una opción marcada como correcta.`);
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

      const res = await fetch(`/api/evaluaciones/${evaluacionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }
      setMensaje('✅ Evaluación actualizada exitosamente');
      setTimeout(() => onGuardado?.(), 1200);
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (cargando)
    return (
      <div className={styles.container}>
        <p>Cargando evaluación…</p>
      </div>
    );
  if (!form)
    return (
      <div className={styles.container}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Editar Evaluación</h2>

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
              Módulo (opcional)
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
            />
          </label>

          <div className={styles.grid3}>
            <label className={styles.label}>
              Puntaje mínimo (%)
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
              Duración (min)
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
                />
              </label>

              {(p.tipo === 'opcion_multiple' || p.tipo === 'verdadero_falso') && (
                <div className={styles.opcionesBlock}>
                  <p className={styles.opcionesLabel}>Opciones (marca la correcta ✓)</p>
                  {p.opciones.map((o, oi) => (
                    <div key={oi} className={styles.opcionRow}>
                      <input
                        type="radio"
                        name={`correcta-edit-${pi}`}
                        checked={o.esCorrecta}
                        onChange={() => updateOpcion(pi, oi, 'esCorrecta', true)}
                        className={styles.radio}
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

              {p.tipo === 'respuesta_corta' && (
                <div className={styles.grid2}>
                  <label className={styles.label}>
                    Respuesta correcta (exacta)
                    <input
                      className={styles.input}
                      value={p.respuestaCorrecta}
                      onChange={(e) => updatePregunta(pi, 'respuestaCorrecta', e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    Patrón Regex (opcional)
                    <input
                      className={styles.input}
                      value={p.patronRegex}
                      onChange={(e) => updatePregunta(pi, 'patronRegex', e.target.value)}
                      placeholder="Ej: ^(sí|si)$"
                    />
                  </label>
                </div>
              )}

              {p.tipo === 'desarrollo' && (
                <div className={styles.infoBox}>
                  📝 Esta pregunta será calificada <strong>manualmente</strong> por el instructor.
                </div>
              )}
            </div>
          ))}
        </section>

        <div className={styles.formFooter}>
          <button type="button" className={styles.btnCancelar} onClick={() => onGuardado?.()}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnSubmit} disabled={loading}>
            {loading ? 'Guardando…' : '💾 Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
