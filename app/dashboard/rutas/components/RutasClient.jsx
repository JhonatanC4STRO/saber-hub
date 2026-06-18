'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Award,
  Lock,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  BookMarked,
} from 'lucide-react';

export default function RutasClient({
  usuarioSession,
  cursos,
  rutas,
  prerrequisitos,
  inscripciones,
  certificaciones,
  certificadosRuta,
}) {
  const router = useRouter();
  const isAdminOrInstructor = usuarioSession.rol === 'admin' || usuarioSession.rol === 'instructor';

  // States for Admin/Instructor tabs
  const [activeTab, setActiveTab] = useState('rutas');

  // States for Route CRUD
  const [editingRuta, setEditingRuta] = useState(null); // null means creating new or viewing list
  const [showRutaForm, setShowRutaForm] = useState(false);
  const [rutaNombre, setRutaNombre] = useState('');
  const [rutaDescripcion, setRutaDescripcion] = useState('');
  const [rutaLineal, setRutaLineal] = useState(true);
  const [rutaCursos, setRutaCursos] = useState([]); // array of course IDs in ordered sequence

  // States for Prerequisites Management
  const [selectedPrereqCursoId, setSelectedPrereqCursoId] = useState('');
  const [prereqCheckedIds, setPrereqCheckedIds] = useState([]);

  // States for Student view
  const [expandedRutaId, setExpandedRutaId] = useState(rutas[0]?.id || '');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Clean messages after 4 seconds
  const flashMessage = (type, msg) => {
    if (type === 'error') {
      setErrorMessage(msg);
      setSuccessMessage('');
    } else {
      setSuccessMessage(msg);
      setErrorMessage('');
    }
    setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 5000);
  };

  // --- Handlers for Route CRUD ---

  const handleOpenNewRuta = () => {
    setEditingRuta(null);
    setRutaNombre('');
    setRutaDescripcion('');
    setRutaLineal(true);
    setRutaCursos([]);
    setShowRutaForm(true);
  };

  const handleOpenEditRuta = (ruta) => {
    setEditingRuta(ruta);
    setRutaNombre(ruta.nombre);
    setRutaDescripcion(ruta.descripcion || '');
    setRutaLineal(ruta.lineal);
    setRutaCursos(ruta.cursos.map((c) => c.cursoId));
    setShowRutaForm(true);
  };

  const handleAddCursoToRuta = (cursoId) => {
    if (!cursoId) return;
    if (rutaCursos.includes(cursoId)) {
      flashMessage('error', 'El curso ya está agregado a esta ruta');
      return;
    }
    setRutaCursos([...rutaCursos, cursoId]);
  };

  const handleRemoveCursoFromRuta = (index) => {
    const updated = [...rutaCursos];
    updated.splice(index, 1);
    setRutaCursos(updated);
  };

  const handleMoveCurso = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rutaCursos.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...rutaCursos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setRutaCursos(updated);
  };

  const handleSaveRuta = async (e) => {
    e.preventDefault();
    if (!rutaNombre) {
      flashMessage('error', 'El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const url = editingRuta ? `/api/admin/rutas/${editingRuta.id}` : '/api/admin/rutas';
      const method = editingRuta ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: rutaNombre,
          descripcion: rutaDescripcion,
          lineal: rutaLineal,
          cursos: rutaCursos,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        flashMessage(
          'success',
          editingRuta ? 'Ruta actualizada exitosamente' : 'Ruta creada exitosamente'
        );
        setShowRutaForm(false);
        router.refresh();
        // Recargar la página para asegurar la obtención de datos frescos
        setTimeout(() => window.location.reload(), 1000);
      } else {
        flashMessage('error', data.message || 'Error al guardar la ruta');
      }
    } catch (error) {
      console.error(error);
      flashMessage('error', 'Error de red al intentar guardar la ruta');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRuta = async (id) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar esta ruta de formación? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rutas/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        flashMessage('success', 'Ruta eliminada con éxito');
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        flashMessage('error', data.message || 'Error al eliminar la ruta');
      }
    } catch (error) {
      console.error(error);
      flashMessage('error', 'Error de red al intentar eliminar la ruta');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Prerequisites ---

  const handleSelectCursoForPrereq = (cursoId) => {
    setSelectedPrereqCursoId(cursoId);
    if (!cursoId) {
      setPrereqCheckedIds([]);
      return;
    }
    // Filtrar los prerrequisitos actuales para el curso seleccionado
    const actuales = prerrequisitos
      .filter((p) => p.cursoId === cursoId)
      .map((p) => p.prerrequisitoId);
    setPrereqCheckedIds(actuales);
  };

  const handleTogglePrereqCheckbox = (cursoId) => {
    if (prereqCheckedIds.includes(cursoId)) {
      setPrereqCheckedIds(prereqCheckedIds.filter((id) => id !== cursoId));
    } else {
      setPrereqCheckedIds([...prereqCheckedIds, cursoId]);
    }
  };

  const handleSavePrereqs = async () => {
    if (!selectedPrereqCursoId) {
      flashMessage('error', 'Por favor selecciona un curso primero');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/cursos/prerrequisitos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoId: selectedPrereqCursoId,
          prerrequisitoIds: prereqCheckedIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        flashMessage('success', 'Prerrequisitos actualizados exitosamente');
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        flashMessage('error', data.message || 'Error al actualizar prerrequisitos');
      }
    } catch (error) {
      console.error(error);
      flashMessage('error', 'Error de red al intentar guardar prerrequisitos');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Student ---

  const handleEnrollInCourse = async (cursoId) => {
    setLoading(true);
    try {
      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        flashMessage('success', 'Te has inscrito al curso exitosamente. ¡Comencemos!');
        router.refresh();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        flashMessage('error', data.message || 'Error al inscribirse en el curso');
      }
    } catch (error) {
      console.error(error);
      flashMessage('error', 'Error de red al intentar inscribirse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-gray-900 pb-16 pt-6 px-4 md:px-8">
      {/* HEADER SIMPLE */}
      <div className="max-w-6xl mx-auto mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookMarked className="text-blue-600" />
            Rutas de Formación y Prerrequisitos
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Organiza tu aprendizaje en secuencias lógicas o administra la malla curricular de la
            plataforma.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al Tablero
        </Link>
      </div>

      {/* NOTIFICACIONES FLASH */}
      {errorMessage && (
        <div className="max-w-6xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="max-w-6xl mx-auto mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          <strong>Éxito:</strong> {successMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* ========================================== */}
        {/* VISTA ADMINISTRADOR O INSTRUCTOR           */}
        {/* ========================================== */}
        {isAdminOrInstructor && (
          <div className="space-y-6">
            {/* TABS DE SELECCION */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-lg border-x border-t">
              <button
                onClick={() => {
                  setActiveTab('rutas');
                  setShowRutaForm(false);
                }}
                className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-colors ${
                  activeTab === 'rutas'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Gestión de Rutas de Formación
              </button>
              <button
                onClick={() => {
                  setActiveTab('prerrequisitos');
                }}
                className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-colors ${
                  activeTab === 'prerrequisitos'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/10'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Prerrequisitos de Cursos
              </button>
            </div>

            {/* CONTENIDO TAB 1: GESTIÓN DE RUTAS */}
            {activeTab === 'rutas' && (
              <div className="bg-white border border-gray-200 rounded-b-lg p-6 shadow-sm">
                {!showRutaForm ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-gray-800">
                        Listado de Rutas de Formación
                      </h2>
                      <button
                        onClick={handleOpenNewRuta}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={16} /> Nueva Ruta de Formación
                      </button>
                    </div>

                    {rutas.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg text-gray-500">
                        No hay rutas de formación creadas en el sistema todavía.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                                Nombre
                              </th>
                              <th className="border border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-700">
                                Descripción
                              </th>
                              <th className="border border-gray-200 px-4 py-2.5 text-center font-semibold text-gray-700">
                                Tipo de Ruta
                              </th>
                              <th className="border border-gray-200 px-4 py-2.5 text-center font-semibold text-gray-700">
                                Cantidad Cursos
                              </th>
                              <th className="border border-gray-200 px-4 py-2.5 text-center font-semibold text-gray-700">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {rutas.map((ruta) => (
                              <tr key={ruta.id} className="hover:bg-gray-50 transition-colors">
                                <td className="border border-gray-200 px-4 py-3 font-bold text-gray-900">
                                  {ruta.nombre}
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-gray-600 max-w-xs truncate">
                                  {ruta.descripcion || 'Sin descripción'}
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-center">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${
                                      ruta.lineal
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-teal-50 text-teal-700 border border-teal-200'
                                    }`}
                                  >
                                    {ruta.lineal ? 'Lineal (Orden estricto)' : 'Flexible'}
                                  </span>
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-800">
                                  {ruta.cursos.length} cursos
                                </td>
                                <td className="border border-gray-200 px-4 py-3 text-center">
                                  <div className="inline-flex gap-2">
                                    <button
                                      onClick={() => handleOpenEditRuta(ruta)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Editar Ruta"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRuta(ruta.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Eliminar Ruta"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  /* FORMULARIO CREACION / EDICION RUTA */
                  <form onSubmit={handleSaveRuta} className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <h2 className="text-lg font-bold text-gray-800">
                        {editingRuta
                          ? `Editar Ruta: ${editingRuta.nombre}`
                          : 'Crear Nueva Ruta de Formación'}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setShowRutaForm(false)}
                        className="text-sm text-gray-500 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Datos de metadatos */}
                      <div className="md:col-span-1 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Nombre de la Ruta *
                          </label>
                          <input
                            type="text"
                            value={rutaNombre}
                            onChange={(e) => setRutaNombre(e.target.value)}
                            required
                            placeholder="Ej. Desarrollador Web Full Stack"
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Descripción
                          </label>
                          <textarea
                            value={rutaDescripcion}
                            onChange={(e) => setRutaDescripcion(e.target.value)}
                            placeholder="Escribe una breve descripción de la ruta de formación..."
                            rows={4}
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Tipo de Ruta (Secuencia)
                          </label>
                          <select
                            value={rutaLineal ? 'true' : 'false'}
                            onChange={(e) => setRutaLineal(e.target.value === 'true')}
                            className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-600 bg-white"
                          >
                            <option value="true">
                              Lineal (El estudiante debe completar los cursos en el orden
                              establecido)
                            </option>
                            <option value="false">
                              Flexible (El estudiante escoge el orden en que realiza los cursos)
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Ordenación de cursos en la ruta */}
                      <div className="md:col-span-2 space-y-4 border-l border-gray-100 pl-0 md:pl-6">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Agregar Cursos a la Ruta
                          </label>
                          <div className="flex gap-2">
                            <select
                              id="addCursoSelect"
                              defaultValue=""
                              onChange={(e) => {
                                handleAddCursoToRuta(e.target.value);
                                e.target.value = ''; // Reset dropdown
                              }}
                              className="flex-1 border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-600 bg-white"
                            >
                              <option value="" disabled>
                                Selecciona un curso para agregar...
                              </option>
                              {cursos.filter((curso) => !curso.esExterno).map((curso) => (
                                <option key={curso.id} value={curso.id}>
                                  {curso.titulo}{' '}
                                  {curso.estado !== 'publicado' ? `(${curso.estado})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Secuencia Ordenada de Cursos
                          </label>
                          {rutaCursos.length === 0 ? (
                            <p className="text-gray-500 text-xs py-4">
                              No has agregado ningún curso a esta ruta aún. Agrégalos arriba.
                            </p>
                          ) : (
                            <div className="border border-gray-200 rounded divide-y divide-gray-200">
                              {rutaCursos.map((cursoId, index) => {
                                const cursoInfo = cursos.find((c) => c.id === cursoId);
                                return (
                                  <div
                                    key={cursoId}
                                    className="flex items-center justify-between p-3 text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                        {index + 1}
                                      </span>
                                      <div>
                                        <p className="font-semibold text-gray-900">
                                          {cursoInfo?.titulo || 'Curso desconocido'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {cursoInfo?.instructorNombre}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => handleMoveCurso(index, 'up')}
                                        className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 rounded"
                                      >
                                        <ArrowUp size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={index === rutaCursos.length - 1}
                                        onClick={() => handleMoveCurso(index, 'down')}
                                        className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 rounded"
                                      >
                                        <ArrowDown size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCursoFromRuta(index)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRutaForm(false)}
                        className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded font-semibold text-sm transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Guardando...' : 'Guardar Ruta de Formación'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* CONTENIDO TAB 2: PRERREQUISITOS DE CURSOS */}
            {activeTab === 'prerrequisitos' && (
              <div className="bg-white border border-gray-200 rounded-b-lg p-6 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                    Definir Prerrequisitos de Cursos
                  </h2>
                  <p className="text-gray-600 text-xs">
                    Selecciona un curso destino para configurar qué otros cursos deben estar
                    completados antes de que un estudiante pueda inscribirse.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Selector de curso principal */}
                  <div className="md:col-span-1 space-y-4">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Curso Destino
                    </label>
                    <select
                      value={selectedPrereqCursoId}
                      onChange={(e) => handleSelectCursoForPrereq(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="">-- Selecciona un curso --</option>
                      {cursos.filter((c) => !c.esExterno).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.titulo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Listado de cursos elegibles como prerrequisito */}
                  <div className="md:col-span-2 border-l border-gray-100 pl-0 md:pl-6 space-y-4">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Marcar Cursos Requeridos (Prerrequisitos)
                    </label>

                    {!selectedPrereqCursoId ? (
                      <p className="text-gray-500 text-xs italic py-4">
                        Selecciona un curso a la izquierda para configurar sus prerrequisitos.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="border border-gray-200 rounded max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                          {cursos
                            .filter((c) => c.id !== selectedPrereqCursoId && !c.esExterno) // Excluir el mismo curso y externos
                            .map((c) => (
                              <label
                                key={c.id}
                                className="flex items-center gap-3 p-3 text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={prereqCheckedIds.includes(c.id)}
                                  onChange={() => handleTogglePrereqCheckbox(c.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                  <span className="font-semibold text-gray-900">{c.titulo}</span>
                                  <span className="block text-xs text-gray-500">
                                    Instructor: {c.instructorNombre}
                                  </span>
                                </div>
                              </label>
                            ))}
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={handleSavePrereqs}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Guardando...' : 'Guardar Prerrequisitos'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* VISTA ESTUDIANTE                           */}
        {/* ========================================== */}
        {!isAdminOrInstructor && (
          <div>
            {rutas.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500 shadow-sm">
                No hay rutas de formación disponibles en este momento. ¡Vuelve pronto!
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LISTA DE RUTAS DISPONIBLES */}
                <div className="lg:col-span-1 space-y-4">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Rutas de Formación Disponibles
                  </h2>
                  <div className="space-y-3">
                    {rutas.map((ruta) => {
                      const isExpanded = expandedRutaId === ruta.id;
                      // Calcular progreso de la ruta
                      const cursosIds = ruta.cursos.map((c) => c.cursoId);
                      const certsRuta = certificaciones.filter((c) =>
                        cursosIds.includes(c.cursoId)
                      );
                      const totalCursos = cursosIds.length;
                      const completados = certsRuta.length;

                      return (
                        <div
                          key={ruta.id}
                          onClick={() => setExpandedRutaId(ruta.id)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all shadow-sm ${
                            isExpanded
                              ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <h3 className="font-bold text-gray-900">{ruta.nombre}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {ruta.descripcion || 'Sin descripción'}
                          </p>

                          {/* Mini barra de progreso */}
                          <div className="mt-3">
                            <div className="flex justify-between items-center text-xs text-gray-500 font-semibold mb-1">
                              <span>Progreso</span>
                              <span>
                                {completados}/{totalCursos} completados
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{
                                  width:
                                    totalCursos > 0
                                      ? `${(completados / totalCursos) * 100}%`
                                      : '0%',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DETALLE Y MAPA VISUAL DE LA RUTA SELECCIONADA */}
                <div className="lg:col-span-2">
                  {(() => {
                    const rutaSeleccionada = rutas.find((r) => r.id === expandedRutaId);
                    if (!rutaSeleccionada)
                      return (
                        <p className="text-gray-500 italic">
                          Selecciona una ruta para ver su mapa de progreso.
                        </p>
                      );

                    const cursosIds = rutaSeleccionada.cursos.map((c) => c.cursoId);
                    const totalCursos = cursosIds.length;
                    const certsEstudiante = certificaciones.filter((c) =>
                      cursosIds.includes(c.cursoId)
                    );
                    const completados = certsEstudiante.length;
                    const completadoTodo = completados === totalCursos && totalCursos > 0;

                    // Buscar certificado de ruta emitido
                    const certRutaEmitido = certificadosRuta.find(
                      (cr) => cr.rutaId === rutaSeleccionada.id
                    );

                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
                        {/* Cabecera del detalle */}
                        <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                rutaSeleccionada.lineal
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              Ruta {rutaSeleccionada.lineal ? 'Lineal Estricta' : 'Flexible'}
                            </span>
                            <h2 className="text-xl font-bold text-gray-900 mt-1">
                              {rutaSeleccionada.nombre}
                            </h2>
                            <p className="text-gray-600 text-xs mt-1">
                              {rutaSeleccionada.descripcion ||
                                'Sin descripción disponible para esta ruta.'}
                            </p>
                          </div>

                          {/* Certificado de ruta completa */}
                          {completadoTodo && (
                            <div className="flex-shrink-0">
                              {certRutaEmitido ? (
                                <a
                                  href={`/api/certificados/ruta-pdf/${certRutaEmitido.codigoUnico}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2.5 rounded shadow transition-colors"
                                >
                                  <Award size={16} /> Descargar Certificado de Ruta
                                </a>
                              ) : (
                                <div className="text-right">
                                  <span className="text-xs text-gray-500 block mb-1">
                                    ¡Ruta finalizada con éxito!
                                  </span>
                                  <button
                                    onClick={async () => {
                                      // Disparar manualmente la validación y recarga
                                      setLoading(true);
                                      try {
                                        // Hacemos una llamada ficticia para forzar la reevaluación o simplemente refrescamos
                                        router.refresh();
                                        setTimeout(() => window.location.reload(), 500);
                                      } catch (err) {}
                                      setLoading(false);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded"
                                  >
                                    Obtener Certificado de Ruta
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mapa visual secuencial de cursos */}
                        <div className="space-y-6">
                          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Secuencia de Cursos
                          </h3>

                          {rutaSeleccionada.cursos.length === 0 ? (
                            <p className="text-gray-500 text-xs italic py-4">
                              Esta ruta no tiene cursos asignados todavía.
                            </p>
                          ) : (
                            <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-6">
                              {rutaSeleccionada.cursos.map((cr, idx) => {
                                const cursoId = cr.cursoId;
                                const cursoTitulo = cr.titulo;
                                const cursoDescripcion = cr.descripcion;
                                const orden = cr.orden;

                                // Determinar estado de este curso para el estudiante
                                const inscripcion = inscripciones.find(
                                  (ins) => ins.cursoId === cursoId
                                );
                                const cert = certificaciones.find((c) => c.cursoId === cursoId);

                                let status = 'bloqueado'; // bloqueado, disponible, en_progreso, completado
                                let prereqsFaltantes = [];

                                // Buscar prerrequisitos para este curso
                                const cursoPrereqs = prerrequisitos.filter(
                                  (p) => p.cursoId === cursoId
                                );
                                if (cursoPrereqs.length > 0) {
                                  const completadosIds = certificaciones.map((c) => c.cursoId);
                                  prereqsFaltantes = cursoPrereqs
                                    .filter((p) => !completadosIds.includes(p.prerrequisitoId))
                                    .map((p) => p.prerrequisitoTitulo);
                                }

                                // Si la ruta es lineal y hay cursos anteriores no completados
                                if (rutaSeleccionada.lineal && idx > 0) {
                                  // Verificar que todos los cursos anteriores en la secuencia tengan certificacion
                                  const anteriores = rutaSeleccionada.cursos.slice(0, idx);
                                  const anterioresCompletados = anteriores.every((ant) =>
                                    certificaciones.some((c) => c.cursoId === ant.cursoId)
                                  );
                                  if (!anterioresCompletados) {
                                    // Agregar los títulos de cursos anteriores no completados a los prereqs faltantes
                                    anteriores
                                      .filter(
                                        (ant) =>
                                          !certificaciones.some((c) => c.cursoId === ant.cursoId)
                                      )
                                      .forEach((ant) => {
                                        if (!prereqsFaltantes.includes(ant.titulo)) {
                                          prereqsFaltantes.push(ant.titulo);
                                        }
                                      });
                                  }
                                }

                                if (cert) {
                                  status = 'completado';
                                } else if (prereqsFaltantes.length > 0) {
                                  status = 'bloqueado';
                                } else if (inscripcion) {
                                  status = 'en_progreso';
                                } else {
                                  status = 'disponible';
                                }

                                return (
                                  <div key={cursoId} className="relative">
                                    {/* Icono de estado en el conector vertical */}
                                    <div className="absolute -left-[35px] top-0.5">
                                      {status === 'completado' && (
                                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center border-2 border-white shadow-sm">
                                          <CheckCircle size={15} />
                                        </div>
                                      )}
                                      {status === 'en_progreso' && (
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border-2 border-white shadow-sm font-bold text-xs">
                                          {orden}
                                        </div>
                                      )}
                                      {status === 'disponible' && (
                                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center border-2 border-white shadow-sm font-bold text-xs">
                                          {orden}
                                        </div>
                                      )}
                                      {status === 'bloqueado' && (
                                        <div className="w-6 h-6 rounded-full bg-red-50 text-red-500 flex items-center justify-center border-2 border-white shadow-sm">
                                          <Lock size={12} />
                                        </div>
                                      )}
                                    </div>

                                    {/* Contenido del curso */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-gray-400">
                                            Paso {orden}
                                          </span>
                                          {status === 'completado' && (
                                            <span className="bg-green-100 text-green-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                                              Completado
                                            </span>
                                          )}
                                          {status === 'en_progreso' && (
                                            <span className="bg-blue-100 text-blue-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                                              En Progreso
                                            </span>
                                          )}
                                          {status === 'disponible' && (
                                            <span className="bg-gray-200 text-gray-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                                              Disponible
                                            </span>
                                          )}
                                          {status === 'bloqueado' && (
                                            <span className="bg-red-100 text-red-800 text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                                              Bloqueado
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                                          {cursoTitulo}
                                        </h4>
                                        <p className="text-xs text-gray-500 max-w-lg">
                                          {cursoDescripcion}
                                        </p>

                                        {status === 'bloqueado' && prereqsFaltantes.length > 0 && (
                                          <p className="text-[11px] text-red-600 font-semibold bg-red-50 p-2 rounded mt-2 max-w-lg border border-red-100">
                                            Debes completar primero: {prereqsFaltantes.join(', ')}
                                          </p>
                                        )}
                                      </div>

                                      {/* Acciones */}
                                      <div className="flex-shrink-0 self-start sm:self-center">
                                        {status === 'completado' && (
                                          <a
                                            href={`/api/certificados/pdf/${cert.codigoUnico}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3.5 py-2 rounded shadow transition-colors"
                                          >
                                            <Award size={14} /> Certificado
                                          </a>
                                        )}

                                        {status === 'en_progreso' && (
                                          <div className="flex flex-col sm:items-end gap-1.5">
                                            <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                                              Progreso: {inscripcion.progreso}%
                                            </span>
                                            <Link
                                              href={`/cursos/${cursoId}`}
                                              className="inline-flex items-center gap-0.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded shadow transition-colors"
                                            >
                                              Estudiar <ChevronRight size={14} />
                                            </Link>
                                          </div>
                                        )}

                                        {status === 'disponible' && (
                                          <button
                                            onClick={() => handleEnrollInCourse(cursoId)}
                                            disabled={loading}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded shadow transition-colors disabled:opacity-50"
                                          >
                                            {loading ? 'Inscribiendo...' : 'Inscribirse'}
                                          </button>
                                        )}

                                        {status === 'bloqueado' && (
                                          <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-bold px-3 py-2 border border-gray-200 bg-white rounded cursor-not-allowed">
                                            <Lock size={12} /> Bloqueado
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
