'use client';
import React, { useState, useEffect } from 'react';
import EditarCurso from './editar-curso';
import DetalleCurso from './DetalleCurso';
import InscripcionMasivaNuevos from '@/components/admin/InscripcionMasivaNuevos';

export default function MisCursos({ usuario }) {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursoEditando, setCursoEditando] = useState(null);
  const [cursoInscripcion, setCursoInscripcion] = useState(null);
  const [cursoDetalle, setCursoDetalle] = useState(null);

  const fetchCursos = async () => {
    try {
      const res = await fetch('/api/cursos');
      if (res.ok) {
        const data = await res.json();
        setCursos(data);
      } else {
        console.error('Error al obtener cursos');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCursos();
  }, []);

  const handlePublicar = async (cursoId, estadoActual) => {
    const nuevoEstado = estadoActual === 'publicado' ? 'borrador' : 'publicado';
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        alert(`Curso ${nuevoEstado} exitosamente.`);
        fetchCursos();
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (error) {
      alert('Error al actualizar el curso');
    }
  };

  const handleEliminar = async (cursoId) => {
    if (!confirm('¿Seguro que deseas eliminar (archivar) este curso?')) return;

    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Curso eliminado (archivado) exitosamente.');
        fetchCursos();
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (error) {
      alert('Error al eliminar el curso');
    }
  };

  if (loading) return <p>Cargando cursos...</p>;

  if (cursos.length === 0) return <p>No hay cursos disponibles.</p>;

  return (
    <div>
      <h3>Lista de Cursos</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', textAlign: 'left' }}>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Título</th>
            <th>Categoría</th>
            <th>Módulos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((curso) => (
            <tr key={curso.id}>
              <td>
                {curso.imgPortada && <img src={curso.imgPortada} alt={curso.titulo} width="80" />}
              </td>
              <td>{curso.titulo}</td>
              <td>{curso.categoria?.nombre || '-'}</td>
              <td>{curso.modulos?.length || 0}</td>
              <td>
                <strong>{curso.estado.toUpperCase()}</strong>
              </td>
              <td>
                <button
                  onClick={() => setCursoDetalle(curso)}
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#3c4043',
                    border: '1px solid #dadce0',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    borderRadius: '3px',
                  }}
                >
                  📋 Detalles
                </button>{' '}
                <button onClick={() => setCursoEditando(curso)}>Editar</button>{' '}
                <button onClick={() => handlePublicar(curso.id, curso.estado)}>
                  {curso.estado === 'publicado' ? 'Despublicar' : 'Publicar'}
                </button>{' '}
                {curso.estado === 'publicado' && (
                  <button
                    onClick={() => setCursoInscripcion(curso)}
                    style={{
                      backgroundColor: '#e8f0fe',
                      color: '#1a73e8',
                      border: '1px solid #1a73e8',
                      padding: '3px 8px',
                      cursor: 'pointer',
                      borderRadius: '3px',
                    }}
                  >
                    👥 Inscripción Masiva
                  </button>
                )}{' '}
                <button onClick={() => handleEliminar(curso.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {cursoEditando && (
        <EditarCurso
          curso={cursoEditando}
          usuario={usuario}
          onCerrar={() => setCursoEditando(null)}
          onActualizado={() => {
            setCursoEditando(null);
            fetchCursos();
          }}
        />
      )}

      {cursoInscripcion && (
        <InscripcionMasivaNuevos
          curso={cursoInscripcion}
          onCerrar={() => setCursoInscripcion(null)}
        />
      )}
      {cursoDetalle && <DetalleCurso curso={cursoDetalle} onCerrar={() => setCursoDetalle(null)} />}
    </div>
  );
}
