'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import { useState, useEffect } from 'react';
import CrearEvaluacion from './CrearEvaluacion';
import EditarEvaluacion from './EditarEvaluacion';
import CalificarManual from './CalificarManual';
import styles from './GestionEvaluaciones.module.css';

export default function GestionEvaluaciones({ usuario }) {
  const [vista, setVista] = useState('lista'); // lista | crear | editar | calificar
  const [evaluaciones, setEvals] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evalSeleccionada, setEval] = useState(null);

  const cargarDatos = async () => {
    setLoading(true);
    const [evRes, cRes] = await Promise.all([fetch('/api/evaluaciones'), fetch('/api/cursos')]);
    const evData = await evRes.json();
    const cData = await cRes.json();
    setEvals(Array.isArray(evData) ? evData : []);
    setCursos(Array.isArray(cData) ? cData : []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta evaluación? Los datos de intentos también se borrarán.')) return;
    await fetch(`/api/evaluaciones/${id}`, { method: 'DELETE' });
    cargarDatos();
  };

  const abrirEditar = (ev) => {
    setEval(ev);
    setVista('editar');
  };

  const abrirCalificar = (ev) => {
    setEval(ev);
    setVista('calificar');
  };

  const volverALista = () => {
    cargarDatos();
    setVista('lista');
  };

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${vista === 'lista' ? styles.active : ''}`}
          onClick={() => setVista('lista')}
        >
          📋 Mis Evaluaciones
        </button>
        <button
          className={`${styles.tab} ${vista === 'crear' ? styles.active : ''}`}
          onClick={() => setVista('crear')}
        >
          ➕ Crear Evaluación
        </button>
        {evalSeleccionada && vista === 'editar' && (
          <button className={`${styles.tab} ${styles.active}`}>
            ✏️ Editando: {evalSeleccionada.titulo}
          </button>
        )}
        {evalSeleccionada && vista === 'calificar' && (
          <button className={`${styles.tab} ${styles.active}`}>
            📝 Calificar: {evalSeleccionada.titulo}
          </button>
        )}
      </div>

      {/* Lista */}
      {vista === 'lista' && (
        <div className={styles.listaSection}>
          {loading && <p className={styles.hint}>Cargando evaluaciones…</p>}
          {!loading && !evaluaciones.length && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📄</span>
              <p>Aún no has creado ninguna evaluación.</p>
              <button className={styles.btnCreate} onClick={() => setVista('crear')}>
                Crear mi primera evaluación
              </button>
            </div>
          )}

          {!loading &&
            evaluaciones.map((ev) => (
              <div key={ev.id} className={styles.evCard}>
                <div className={styles.evInfo}>
                  <h3 className={styles.evTitulo}>{ev.titulo}</h3>
                  <div className={styles.evMeta}>
                    {ev.curso && <span className={styles.tag}><EmojiIcon emoji="📚" className="mr-1" /> {ev.curso.titulo}</span>}
                    {ev.modulo && <span className={styles.tag}><EmojiIcon emoji="📦" className="mr-1" /> {ev.modulo.titulo}</span>}
                    <span className={styles.tag}><EmojiIcon emoji="❓" className="mr-1" /> {ev._count?.preguntas ?? 0} preguntas</span>
                    <span className={styles.tag}><EmojiIcon emoji="👤" className="mr-1" /> {ev._count?.intentos ?? 0} intentos</span>
                    <span className={styles.tag}><EmojiIcon emoji="🎯" className="mr-1" /> Mín: {ev.puntajeMinimo}%</span>
                  </div>
                </div>
                <div className={styles.evAcciones}>
                  <button className={styles.btnEditar} onClick={() => abrirEditar(ev)}>
                    ✏️ Editar
                  </button>
                  <button className={styles.btnCalificar} onClick={() => abrirCalificar(ev)}>
                    📝 Calificar
                  </button>
                  <button className={styles.btnEliminar} onClick={() => eliminar(ev.id)}>
                    🗑 Eliminar
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Crear */}
      {vista === 'crear' && (
        <CrearEvaluacion usuario={usuario} cursos={cursos} onCreado={volverALista} />
      )}

      {/* Editar */}
      {vista === 'editar' && evalSeleccionada && (
        <EditarEvaluacion
          evaluacionId={evalSeleccionada.id}
          cursos={cursos}
          onGuardado={volverALista}
        />
      )}

      {/* Calificar */}
      {vista === 'calificar' && evalSeleccionada && (
        <CalificarManual evaluacionId={evalSeleccionada.id} />
      )}
    </div>
  );
}
