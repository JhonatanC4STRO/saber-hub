'use client';
import React, { useState, useEffect } from 'react';
import GestorContenido from './GestorContenido';

export default function EditarCurso({ curso, usuario, onCerrar, onActualizado }) {
  const [activeTab, setActiveTab] = useState(1); // 1: Info, 2: Constructor, 3: Ajustes

  // Tab 1: Info Básica
  const [titulo, setTitulo] = useState(curso.titulo || '');
  const [descripcion, setDescripcion] = useState(curso.descripcion || '');
  const [categoria, setCategoria] = useState(curso.categoria?.nombre || '');
  const [archivoImagen, setArchivoImagen] = useState(null);

  // Tab 3: Ajustes
  const [otorgaCertificado, setOtorgaCertificado] = useState(curso.otorgaCertificado || false);
  const [criterioLeccionesMin, setCriterioLeccionesMin] = useState(
    curso.criterioLeccionesMin || 100
  );
  const [criterioEvalAprobadas, setCriterioEvalAprobadas] = useState(
    curso.criterioEvalAprobadas || false
  );
  const [criterioNotaGlobal, setCriterioNotaGlobal] = useState(curso.criterioNotaGlobal || 70);

  const [subiendo, setSubiendo] = useState(false);

  const [instructores, setInstructores] = useState([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState(curso.instructorId || '');

  useEffect(() => {
    if (usuario?.rol === 'admin') {
      fetch('/api/admin/instructores')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setInstructores(data);
        })
        .catch((err) => console.error(err));
    }
  }, [usuario]);

  const categoriasDisponibles = [
    'programacion',
    'cienciadedatos',
    'diseño',
    'marketing',
    'idiomas',
    'negocios',
    'deporte',
    'arquitectura',
    'musica',
    'fotografia',
    'cocina',
    'educacion',
    'animacion',
    'educacion-primaria',
    'educacion-secundaria',
  ];

  const handleSubmitBasics = async (e) => {
    e?.preventDefault();
    setSubiendo(true);

    try {
      let imgPortadaFinal = curso.imgPortada;
      if (archivoImagen) {
        const formData = new FormData();
        formData.append('file', archivoImagen);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Error al subir la nueva imagen');
        const uploadData = await uploadRes.json();
        imgPortadaFinal = uploadData.url;
      }

      const response = await fetch(`/api/cursos/${curso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descripcion,
          categoria,
          imgPortada: imgPortadaFinal,
          instructorId: usuario?.rol === 'admin' ? selectedInstructorId : undefined,
        }),
      });

      if (response.ok) {
        alert('Configuración inicial guardada');
        onActualizado();
        setActiveTab(2); // Pasar al siguiente paso
      } else {
        const errorData = await response.json();
        alert('Error: ' + (errorData.message || 'No se pudo actualizar'));
      }
    } catch (error) {
      alert('Hubo un problema: ' + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  const handleSubmitAjustes = async (e) => {
    e?.preventDefault();
    setSubiendo(true);
    try {
      const response = await fetch(`/api/cursos/${curso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otorgaCertificado,
          criterioLeccionesMin: otorgaCertificado ? criterioLeccionesMin : null,
          criterioEvalAprobadas: otorgaCertificado ? criterioEvalAprobadas : false,
          criterioNotaGlobal: otorgaCertificado ? criterioNotaGlobal : null,
        }),
      });
      if (response.ok) {
        alert('Ajustes finales guardados exitosamente');
        onActualizado();
      } else {
        const errorData = await response.json();
        alert('Error: ' + (errorData.message || 'No se pudo actualizar'));
      }
    } catch (error) {
      alert('Hubo un problema: ' + error.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '20px',
        marginTop: '20px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2>Flujo de Edición del Curso</h2>
        <button onClick={onCerrar}>Cerrar Editor</button>
      </div>

      {/* Navegación por Pasos */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab(1)}
          style={{
            fontWeight: activeTab === 1 ? 'bold' : 'normal',
            backgroundColor: activeTab === 1 ? '#e0e0e0' : 'transparent',
          }}
        >
          Paso 1: Lo Macro
        </button>
        <button
          onClick={() => setActiveTab(2)}
          style={{
            fontWeight: activeTab === 2 ? 'bold' : 'normal',
            backgroundColor: activeTab === 2 ? '#e0e0e0' : 'transparent',
          }}
        >
          Paso 2 y 3: Constructor y Contenido
        </button>
        <button
          onClick={() => setActiveTab(3)}
          style={{
            fontWeight: activeTab === 3 ? 'bold' : 'normal',
            backgroundColor: activeTab === 3 ? '#e0e0e0' : 'transparent',
          }}
        >
          Paso 4: Ajustes y Lanzamiento
        </button>
      </div>

      {/* Tab 1: Info */}
      {activeTab === 1 && (
        <form onSubmit={handleSubmitBasics}>
          <h3>Configuración Inicial</h3>

          <div style={{ marginBottom: '10px' }}>
            <label>Título del Curso</label>
            <br />
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Descripción corta</label>
            <br />
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              style={{ width: '100%', height: '80px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Categoría</label>
            <br />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
              style={{ width: '100%' }}
            >
              <option value="">Selecciona</option>
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {usuario?.rol === 'admin' && (
            <div style={{ marginBottom: '10px' }}>
              <label>Instructor asignado</label>
              <br />
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dadce0',
                  borderRadius: '4px',
                }}
              >
                <option value="">Selecciona un instructor</option>
                {instructores.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.nombre} ({ins.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <label>Imagen de portada o Tráiler (Dejar en blanco para mantener la actual)</label>
            <br />
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setArchivoImagen(e.target.files[0])}
            />
            {curso.imgPortada && !archivoImagen && (
              <div style={{ marginTop: '10px' }}>
                <p>Archivo actual:</p>
                <img src={curso.imgPortada} alt="Portada actual" width="150" />
              </div>
            )}
          </div>

          <button type="submit" disabled={subiendo}>
            {subiendo ? 'Guardando...' : 'Guardar y Continuar ->'}
          </button>
        </form>
      )}

      {/* Tab 2: Contenido */}
      {activeTab === 2 && (
        <div>
          <h3>El Esqueleto y Detalle Multimedia</h3>
          <p>
            Primero arma los módulos y las lecciones. Luego haz clic en "Editar Contenido" en cada
            lección.
          </p>
          <GestorContenido cursoId={curso.id} />
        </div>
      )}

      {/* Tab 3: Ajustes */}
      {activeTab === 3 && (
        <form onSubmit={handleSubmitAjustes}>
          <h3>Ajustes finales y Publicación</h3>

          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="checkbox"
                checked={otorgaCertificado}
                onChange={(e) => setOtorgaCertificado(e.target.checked)}
              />
              Otorgar certificado automático al cumplir los requisitos
            </label>
          </div>

          {otorgaCertificado && (
            <div
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '15px',
                backgroundColor: '#f0f4f8',
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Criterios de Aprobación</h4>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  Porcentaje mínimo de lecciones completadas (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criterioLeccionesMin}
                  onChange={(e) => setCriterioLeccionesMin(Number(e.target.value))}
                  style={{ width: '100px', padding: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={criterioEvalAprobadas}
                    onChange={(e) => setCriterioEvalAprobadas(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Debe aprobar todas las evaluaciones del curso
                </label>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  Nota mínima global ponderada (0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criterioNotaGlobal}
                  onChange={(e) => setCriterioNotaGlobal(Number(e.target.value))}
                  style={{ width: '100px', padding: '5px' }}
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={subiendo}>
            {subiendo ? 'Guardando...' : 'Guardar Ajustes Finales'}
          </button>

          <div
            style={{
              marginTop: '30px',
              padding: '10px',
              border: '1px solid #ddd',
              backgroundColor: '#fff',
            }}
          >
            <h4>Lanzamiento</h4>
            <p>
              Estado actual: <strong>{curso.estado.toUpperCase()}</strong>
            </p>
            <p style={{ fontSize: '12px' }}>
              Recuerda que debes tener al menos 1 módulo con 1 lección antes de publicar.
            </p>
            {/* El botón publicar de la tabla hace la función, pero podemos guiarlo ahí */}
            <p style={{ color: 'blue' }}>
              * Cierra el editor para usar el botón "Publicar" en la tabla de cursos.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
