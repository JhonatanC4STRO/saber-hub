'use client';
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Modal de Lección ---
function ModalLeccion({ leccion, onSave, onClose }) {
  const [titulo, setTitulo] = useState(leccion?.titulo || '');
  const [contenidoTexto, setContenidoTexto] = useState(leccion?.contenidoTexto || '');
  const [urlVideo, setUrlVideo] = useState(leccion?.urlVideo || '');
  const [esPreview, setEsPreview] = useState(leccion?.esPreview || false);
  const [archivoVideo, setArchivoVideo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!titulo) return alert('El título es obligatorio');

    let videoUrlFinal = urlVideo;
    if (archivoVideo) {
      setSubiendo(true);
      try {
        const formData = new FormData();
        formData.append('file', archivoVideo);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Error al subir video');
        const uploadData = await uploadRes.json();
        videoUrlFinal = uploadData.url;
      } catch (error) {
        alert(error.message);
        setSubiendo(false);
        return;
      }
    }

    onSave({
      ...leccion,
      titulo,
      contenidoTexto,
      urlVideo: videoUrlFinal,
      esPreview,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          width: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h3>{leccion?.id ? 'Editar Lección' : 'Nueva Lección'}</h3>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '10px' }}>
            <label>Título de la Lección *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Contenido / Texto (Opcional)</label>
            <textarea
              value={contenidoTexto}
              onChange={(e) => setContenidoTexto(e.target.value)}
              style={{ width: '100%', height: '80px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>URL de Video Existente (YouTube/Vimeo)</label>
            <input
              type="url"
              value={urlVideo}
              onChange={(e) => setUrlVideo(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>O Subir Archivo de Video (Sustituirá la URL si se sube con éxito)</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setArchivoVideo(e.target.files[0])}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="checkbox"
                checked={esPreview}
                onChange={(e) => setEsPreview(e.target.checked)}
              />
              Marcar como Lección Pública (Preview Gratuito)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} disabled={subiendo}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={subiendo}
              style={{ backgroundColor: '#0070f3', color: '#fff' }}
            >
              {subiendo ? 'Subiendo video...' : 'Guardar Lección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Item del Módulo (Sortable) ---
function SortableModule({ modulo, onEditModulo, onAddLeccion, onEditLeccion }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: modulo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: '1px solid #ccc',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#fff',
    cursor: 'default',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', marginRight: '10px', fontSize: '20px' }}
          >
            ≡
          </span>
          <strong>{modulo.titulo}</strong>
        </div>
        <div>
          <button
            type="button"
            onClick={() => onEditModulo(modulo.id)}
            style={{ marginRight: '5px' }}
          >
            Editar Módulo
          </button>
          <button
            type="button"
            onClick={() => onAddLeccion(modulo.id)}
            style={{
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              padding: '3px 8px',
            }}
          >
            + Lección
          </button>
        </div>
      </div>

      {/* Lista de Lecciones básica */}
      <div style={{ paddingLeft: '30px', marginTop: '10px' }}>
        {modulo.lecciones?.map((lec, idx) => (
          <div
            key={lec.id || idx}
            style={{
              padding: '5px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              - {lec.titulo}{' '}
              {lec.esPreview && <span style={{ color: 'green', fontSize: '12px' }}>(Preview)</span>}
            </span>
            <button
              type="button"
              onClick={() => onEditLeccion(modulo.id, lec)}
              style={{ fontSize: '11px', padding: '2px 5px' }}
            >
              Editar Contenido
            </button>
          </div>
        ))}
        {(!modulo.lecciones || modulo.lecciones.length === 0) && (
          <p style={{ fontSize: '12px', color: '#666' }}>No hay lecciones en este módulo.</p>
        )}
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function GestorContenido({ cursoId }) {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estado para el Modal de Lección
  const [modalLeccion, setModalLeccion] = useState({
    isOpen: false,
    moduloId: null,
    leccion: null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchContenido();
  }, [cursoId]);

  const fetchContenido = async () => {
    try {
      const res = await fetch(`/api/cursos/${cursoId}/contenido`);
      if (res.ok) {
        const data = await res.json();
        setModulos(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setModulos((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}/contenido`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modulos),
      });
      if (res.ok) {
        alert('Estructura guardada exitosamente!');
        fetchContenido();
      } else {
        alert('Error al guardar');
      }
    } catch (error) {
      console.error(error);
      alert('Error');
    } finally {
      setGuardando(false);
    }
  };

  const addNewModulo = () => {
    const titulo = prompt('Título del nuevo módulo:');
    if (!titulo) return;
    const newMod = {
      id: 'temp-' + Date.now(),
      titulo,
      descripcion: '',
      lecciones: [],
    };
    setModulos([...modulos, newMod]);
  };

  const openAddLeccionModal = (moduloId) => {
    setModalLeccion({
      isOpen: true,
      moduloId,
      leccion: { id: null, titulo: '', contenidoTexto: '', urlVideo: '', esPreview: false },
    });
  };

  const openEditLeccionModal = (moduloId, leccion) => {
    setModalLeccion({ isOpen: true, moduloId, leccion });
  };

  const handleSaveLeccionModal = (leccionGuardada) => {
    setModulos((mods) =>
      mods.map((m) => {
        if (m.id === modalLeccion.moduloId) {
          if (leccionGuardada.id) {
            // Edición
            return {
              ...m,
              lecciones: m.lecciones.map((l) =>
                l.id === leccionGuardada.id ? leccionGuardada : l
              ),
            };
          } else {
            // Nueva lección
            return {
              ...m,
              lecciones: [...m.lecciones, { ...leccionGuardada, id: 'temp-' + Date.now() }],
            };
          }
        }
        return m;
      })
    );
    setModalLeccion({ isOpen: false, moduloId: null, leccion: null });
  };

  if (loading) return <p>Cargando contenido...</p>;

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '15px',
        border: '1px solid #0070f3',
        borderRadius: '5px',
        backgroundColor: '#fff',
      }}
    >
      <h4>Gestor de Contenido (Módulos y Lecciones)</h4>
      <p style={{ fontSize: '13px', color: '#555' }}>
        Arrastra los módulos por el ícono (≡) para reordenarlos. Al guardar la estructura, se
        guardan los cambios de tus lecciones de forma segura.
      </p>

      {modalLeccion.isOpen && (
        <ModalLeccion
          leccion={modalLeccion.leccion}
          onSave={handleSaveLeccionModal}
          onClose={() => setModalLeccion({ isOpen: false, moduloId: null, leccion: null })}
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modulos.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          {modulos.map((mod) => (
            <SortableModule
              key={mod.id}
              modulo={mod}
              onEditModulo={(id) => {
                const nuevoTitulo = prompt('Editar título:', mod.titulo);
                if (nuevoTitulo) {
                  setModulos((mods) =>
                    mods.map((m) => (m.id === id ? { ...m, titulo: nuevoTitulo } : m))
                  );
                }
              }}
              onAddLeccion={openAddLeccionModal}
              onEditLeccion={openEditLeccionModal}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button onClick={addNewModulo}>+ Añadir Módulo</button>
        <button
          onClick={guardarCambios}
          disabled={guardando}
          style={{
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '4px',
          }}
        >
          {guardando ? 'Guardando...' : 'Guardar Estructura'}
        </button>
      </div>
    </div>
  );
}
