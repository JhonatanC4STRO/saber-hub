'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import { useState, useEffect } from 'react';
import styles from './BancoPreguntas.module.css';

const TIPOS = ['opcion_multiple', 'verdadero_falso', 'respuesta_corta', 'desarrollo'];
const TIPO_LABEL = {
  opcion_multiple: 'Opción múltiple',
  verdadero_falso: 'Verdadero/Falso',
  respuesta_corta: 'Respuesta corta',
  desarrollo: 'Desarrollo',
};

function FormPregunta({ inicial, categorias, onGuardar, onCancelar }) {
  const [form, setForm] = useState(
    inicial || {
      pregunta: '',
      tipo: 'opcion_multiple',
      puntos: 1,
      categoriaId: '',
      respuestaCorrecta: '',
      patronRegex: '',
      opciones: [
        { textoOpcion: '', esCorrecta: false },
        { textoOpcion: '', esCorrecta: false },
      ],
    }
  );
  const [saving, setSaving] = useState(false);

  const updF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addOpc = () =>
    setForm((f) => ({ ...f, opciones: [...f.opciones, { textoOpcion: '', esCorrecta: false }] }));
  const remOpc = (i) =>
    setForm((f) => ({ ...f, opciones: f.opciones.filter((_, idx) => idx !== i) }));
  const updOpc = (i, k, v) =>
    setForm((f) => {
      const o = [...f.opciones];
      if (k === 'esCorrecta')
        o.forEach((_, idx) => {
          o[idx] = { ...o[idx], esCorrecta: false };
        });
      o[i] = { ...o[i], [k]: v };
      return { ...f, opciones: o };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onGuardar(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      <div className={styles.row2}>
        <label className={styles.label}>
          Tipo
          <select
            className={styles.input}
            value={form.tipo}
            onChange={(e) => updF('tipo', e.target.value)}
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Categoría
          <select
            className={styles.input}
            value={form.categoriaId}
            onChange={(e) => updF('categoriaId', e.target.value)}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.label}>
        Enunciado *
        <textarea
          className={styles.textarea}
          rows={3}
          value={form.pregunta}
          onChange={(e) => updF('pregunta', e.target.value)}
          required
        />
      </label>
      <label className={styles.label}>
        Puntos
        <input
          className={styles.input}
          type="number"
          min={1}
          value={form.puntos}
          onChange={(e) => updF('puntos', Number(e.target.value))}
        />
      </label>

      {(form.tipo === 'opcion_multiple' || form.tipo === 'verdadero_falso') && (
        <div className={styles.opcionesBlock}>
          <p className={styles.opcionesLabel}>Opciones (✓ = correcta)</p>
          {form.opciones.map((o, i) => (
            <div key={i} className={styles.opcionRow}>
              <input
                type="radio"
                name="correcta"
                checked={o.esCorrecta}
                onChange={() => updOpc(i, 'esCorrecta', true)}
              />
              <input
                className={styles.inputOpc}
                value={o.textoOpcion}
                onChange={(e) => updOpc(i, 'textoOpcion', e.target.value)}
                placeholder={`Opción ${i + 1}`}
                disabled={form.tipo === 'verdadero_falso'}
              />
              {form.tipo === 'opcion_multiple' && form.opciones.length > 2 && (
                <button type="button" onClick={() => remOpc(i)} className={styles.btnRem}>
                  ✕
                </button>
              )}
            </div>
          ))}
          {form.tipo === 'opcion_multiple' && (
            <button type="button" className={styles.btnAddOpc} onClick={addOpc}>
              + Opción
            </button>
          )}
        </div>
      )}

      {form.tipo === 'respuesta_corta' && (
        <div className={styles.row2}>
          <label className={styles.label}>
            Respuesta exacta
            <input
              className={styles.input}
              value={form.respuestaCorrecta}
              onChange={(e) => updF('respuestaCorrecta', e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Regex (opcional)
            <input
              className={styles.input}
              value={form.patronRegex}
              onChange={(e) => updF('patronRegex', e.target.value)}
              placeholder="^(sí|si)$"
            />
          </label>
        </div>
      )}

      <div className={styles.formFooter}>
        <button type="button" className={styles.btnSec} onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPri} disabled={saving}>
          {saving ? 'Guardando…' : '💾 Guardar'}
        </button>
      </div>
    </form>
  );
}

export default function BancoPreguntas() {
  const [tab, setTab] = useState('lista');
  const [preguntas, setPregs] = useState([]);
  const [categorias, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [filtros, setFiltros] = useState({ categoriaId: '', tipo: '', q: '' });
  const [nuevaCat, setNuevaCat] = useState('');
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filtros).filter(([, v]) => v))
      );
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/banco?${params}`),
        fetch('/api/banco/categorias'),
      ]);

      let p = [],
        c = [];
      if (pRes.ok) {
        try {
          p = await pRes.json();
        } catch {
          setMsg('Error al leer la respuesta del banco');
        }
      } else {
        try {
          const errData = await pRes.json();
          setMsg(
            `Error banco (${pRes.status}): ${errData.detail || errData.message || 'Error desconocido'}`
          );
        } catch {
          setMsg(`Error banco HTTP ${pRes.status}`);
        }
      }
      if (cRes.ok) {
        try {
          c = await cRes.json();
        } catch {
          console.error('Error parsing /api/banco/categorias response');
        }
      } else {
        console.error('API /api/banco/categorias error:', cRes.status);
      }

      setPregs(Array.isArray(p) ? p : []);
      setCats(Array.isArray(c) ? c : []);
    } catch (err) {
      console.error('Error cargando banco:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtros]);

  const guardarPregunta = async (form) => {
    const method = editando ? 'PUT' : 'POST';
    const url = editando ? `/api/banco/${editando.id}` : '/api/banco';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg(editando ? 'Pregunta actualizada' : 'Pregunta creada');
      setEditando(null);
      setTab('lista');
      cargar();
    } else {
      const d = await res.json();
      setMsg('Error: ' + (d.message || 'desconocido'));
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta pregunta del banco?')) return;
    await fetch(`/api/banco/${id}`, { method: 'DELETE' });
    cargar();
  };

  const exportar = (fmt) => {
    const params = new URLSearchParams({
      ...Object.fromEntries(Object.entries(filtros).filter(([, v]) => v)),
      formato: fmt,
    });
    window.location.href = `/api/banco?${params}`;
  };

  const importar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/banco/importar', { method: 'POST', body: fd });
    const d = await res.json();
    setMsg(d.message);
    setImporting(false);
    cargar();
    e.target.value = '';
  };

  const crearCategoria = async () => {
    if (!nuevaCat.trim()) return;
    await fetch('/api/banco/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevaCat }),
    });
    setNuevaCat('');
    cargar();
  };

  const eliminarCategoria = async (id) => {
    if (!confirm('¿Eliminar esta categoría? Las preguntas quedarán sin categoría.')) return;
    await fetch('/api/banco/categorias', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    cargar();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}><EmojiIcon emoji="📚" className="mr-1" /> Banco de Preguntas</h2>
      {msg && (
        <div className={styles.msgBanner}>
          {msg}
          <button onClick={() => setMsg(null)}><EmojiIcon emoji="✕" /></button>
        </div>
      )}

      <div className={styles.tabs}>
        {['lista', 'crear', 'categorias', 'importar'].map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.active : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'lista'
              ? <span><EmojiIcon emoji="📋" className="mr-1" /> Lista</span>
              : t === 'crear'
                ? <span><EmojiIcon emoji="➕" className="mr-1" /> Nueva</span>
                : t === 'categorias'
                  ? <span><EmojiIcon emoji="🏷" className="mr-1" /> Categorías</span>
                  : <span><EmojiIcon emoji="📤" className="mr-1" /> Importar/Exportar</span>}
          </button>
        ))}
      </div>

      {/* ── LISTA ── */}
      {tab === 'lista' && (
        <div>
          <div className={styles.filtros}>
            <input
              className={styles.input}
              placeholder="🔍 Buscar…"
              value={filtros.q}
              onChange={(e) => setFiltros((f) => ({ ...f, q: e.target.value }))}
            />
            <select
              className={styles.input}
              value={filtros.tipo}
              onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
            <select
              className={styles.input}
              value={filtros.categoriaId}
              onChange={(e) => setFiltros((f) => ({ ...f, categoriaId: e.target.value }))}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <div className={styles.exportBtns}>
              <button className={styles.btnSec} onClick={() => exportar('json')}>
                ⬇ JSON
              </button>
              <button className={styles.btnSec} onClick={() => exportar('xlsx')}>
                ⬇ XLSX
              </button>
            </div>
          </div>

          {loading && <p className={styles.hint}>Cargando…</p>}
          {!loading && !preguntas.length && (
            <div className={styles.empty}>
              <span><EmojiIcon emoji="🗂" /></span>
              <p>No hay preguntas en el banco todavía.</p>
              <button className={styles.btnPri} onClick={() => setTab('crear')}>
                Crear primera pregunta
              </button>
            </div>
          )}
          <div className={styles.pregList}>
            {preguntas.map((p) => (
              <div key={p.id} className={styles.pregCard}>
                <div className={styles.pregHeader}>
                  <span className={styles.tipoBadge}>{TIPO_LABEL[p.tipo]}</span>
                  {p.categoria && <span className={styles.catBadge}>{p.categoria.nombre}</span>}
                  <span className={styles.puntosBadge}>
                    {p.puntos} pt{p.puntos !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className={styles.enunciado}>{p.pregunta}</p>
                {p.opciones?.length > 0 && (
                  <div className={styles.opcsPreview}>
                    {p.opciones.map((o) => (
                      <span
                        key={o.id}
                        className={`${styles.opc} ${o.esCorrecta ? styles.opcCorrecta : ''}`}
                      >
                        {o.textoOpcion}
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.pregAcciones}>
                  <button
                    className={styles.btnEditar}
                    onClick={() => {
                      setEditando(p);
                      setTab('crear');
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button className={styles.btnEliminar} onClick={() => eliminar(p.id)}>
                    🗑 Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CREAR / EDITAR ── */}
      {tab === 'crear' && (
        <FormPregunta
          inicial={editando ? { ...editando, categoriaId: editando.categoriaId || '' } : null}
          categorias={categorias}
          onGuardar={guardarPregunta}
          onCancelar={() => {
            setEditando(null);
            setTab('lista');
          }}
        />
      )}

      {/* ── CATEGORÍAS ── */}
      {tab === 'categorias' && (
        <div>
          <div className={styles.newCatRow}>
            <input
              className={styles.input}
              placeholder="Nombre de categoría…"
              value={nuevaCat}
              onChange={(e) => setNuevaCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && crearCategoria()}
            />
            <button className={styles.btnPri} onClick={crearCategoria}>
              + Crear
            </button>
          </div>
          <div className={styles.catList}>
            {categorias.map((c) => (
              <div key={c.id} className={styles.catCard}>
                <div>
                  <strong>{c.nombre}</strong>
                  <span className={styles.catCount}>{c._count?.preguntas ?? 0} preguntas</span>
                </div>
                <button className={styles.btnEliminar} onClick={() => eliminarCategoria(c.id)}>
                  🗑
                </button>
              </div>
            ))}
            {!categorias.length && <p className={styles.hint}>Aún no tienes categorías.</p>}
          </div>
        </div>
      )}

      {/* ── IMPORTAR/EXPORTAR ── */}
      {tab === 'importar' && (
        <div className={styles.importSection}>
          <h3>Importar preguntas</h3>
          <p className={styles.hint}>
            Soporta archivos <strong>.json</strong> y <strong>.xlsx</strong>.<br />
            Columnas XLSX: pregunta | tipo | puntos | opciones (separadas por <code>|</code>,
            marcadas con <code>[CORRECTA]</code>) | respuestaCorrecta | patronRegex
          </p>
          <label className={styles.fileLabel}>
            {importing ? '⏳ Importando…' : '📂 Seleccionar archivo'}
            <input
              type="file"
              accept=".json,.xlsx,.xls"
              onChange={importar}
              style={{ display: 'none' }}
              disabled={importing}
            />
          </label>
          <hr className={styles.sep} />
          <h3>Exportar banco</h3>
          <div className={styles.exportBtns}>
            <button className={styles.btnPri} onClick={() => exportar('json')}>
              ⬇ Exportar como JSON
            </button>
            <button className={styles.btnPri} onClick={() => exportar('xlsx')}>
              ⬇ Exportar como XLSX
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
