'use client';

import React, { useState, useEffect } from 'react';
import HeaderAdmin from '../../components/HeaderAdmin';
import FooterAdmin from '../../components/FooterAdmin';
import {
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  BarChart2,
  Users,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function ReportesClient({ cursos = [], grupos = [], usuarioSession }) {
  const [selectedCurso, setSelectedCurso] = useState(cursos[0]?.id || '');
  const [selectedGrupo, setSelectedGrupo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [alumnoFiltro, setAlumnoFiltro] = useState('');

  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Efecto para cargar automáticamente el listado de alumnos al cambiar los filtros
  useEffect(() => {
    if (!selectedCurso) return;

    const cargarDatos = async () => {
      setLoading(true);
      setError('');
      try {
        let url = `/api/reportes/exportar?format=json&cursoId=${selectedCurso}`;
        if (selectedGrupo) url += `&grupoId=${selectedGrupo}`;
        if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
        if (fechaFin) url += `&fechaFin=${fechaFin}`;
        if (alumnoFiltro) url += `&usuarioId=${alumnoFiltro}`; // Si decides usar ID, o lo filtramos del lado cliente para el buscador interactivo

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setAlumnos(data.data || []);
        } else {
          setError(data.message || 'Error al cargar las métricas de alumnos.');
        }
      } catch {
        setError('Error de comunicación con el servidor. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [selectedCurso, selectedGrupo, fechaInicio, fechaFin]);

  // Filtrado interactivo en el cliente para el buscador de alumnos (por nombre, correo o documento)
  const alumnosFiltrados = alumnos.filter((alumno) => {
    if (!alumnoFiltro.trim()) return true;
    const query = alumnoFiltro.toLowerCase();
    return (
      alumno.nombre.toLowerCase().includes(query) ||
      alumno.email.toLowerCase().includes(query) ||
      alumno.documento.toLowerCase().includes(query)
    );
  });

  // Cálculos estadísticos rápidos
  const totalAlumnos = alumnosFiltrados.length;
  const progresoPromedio =
    totalAlumnos > 0
      ? Math.round(alumnosFiltrados.reduce((acc, a) => acc + a.progreso, 0) / totalAlumnos)
      : 0;
  const totalCompletados = alumnosFiltrados.filter(
    (a) => a.estado === 'finalizado' || a.progreso >= 100
  ).length;
  const totalActivos = alumnosFiltrados.filter((a) => a.estado === 'activo').length;

  // Manejo de descargas de reportes en PDF o Excel
  const handleExportar = (formato) => {
    if (!selectedCurso) {
      alert('Por favor selecciona un curso para exportar.');
      return;
    }
    let url = `/api/reportes/exportar?format=${formato}&cursoId=${selectedCurso}`;
    if (selectedGrupo) url += `&grupoId=${selectedGrupo}`;
    if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
    if (fechaFin) url += `&fechaFin=${fechaFin}`;

    // Abrir descarga en una nueva pestaña del navegador de forma segura
    window.open(url, '_blank');
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-slate-50 text-slate-800"
      style={{ fontFamily: 'Inter, Arial, sans-serif' }}
    >
      <HeaderAdmin usuario={usuarioSession} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:px-6">
        {/* Cabecera del Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Seguimiento y Reportes
            </h1>
            <p className="mt-1 text-base text-slate-500">
              Monitorea el progreso, tiempo de conexión y calificaciones de tus alumnos.
            </p>
          </div>

          {/* Botones de Exportación */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExportar('excel')}
              disabled={loading || totalAlumnos === 0}
              className="flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[14px] font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar a Excel
            </button>
            <button
              onClick={() => handleExportar('pdf')}
              disabled={loading || totalAlumnos === 0}
              className="flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-[14px] font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar a PDF
            </button>
          </div>
        </div>

        {/* Panel de Filtros */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Filtros de Reporte
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Selector de Curso */}
            <div>
              <label
                htmlFor="curso"
                className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase"
              >
                Curso
              </label>
              <select
                id="curso"
                value={selectedCurso}
                onChange={(e) => {
                  setSelectedCurso(e.target.value);
                  setSelectedGrupo('');
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                {cursos.length === 0 ? (
                  <option value="">No hay cursos creados</option>
                ) : (
                  cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Selector de Grupo */}
            <div>
              <label
                htmlFor="grupo"
                className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase"
              >
                Grupo
              </label>
              <select
                id="grupo"
                value={selectedGrupo}
                onChange={(e) => setSelectedGrupo(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-600"
              >
                <option value="">Todos los grupos</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Rango de Fechas - Inicio */}
            <div>
              <label
                htmlFor="fechaInicio"
                className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase"
              >
                Inscritos Desde
              </label>
              <input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-600"
              />
            </div>

            {/* Rango de Fechas - Fin */}
            <div>
              <label
                htmlFor="fechaFin"
                className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase"
              >
                Inscritos Hasta
              </label>
              <input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-600"
              />
            </div>

            {/* Buscador de Alumno */}
            <div>
              <label
                htmlFor="alumno"
                className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase"
              >
                Búsqueda rápida
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="alumno"
                  type="text"
                  placeholder="Nombre, email o doc..."
                  value={alumnoFiltro}
                  onChange={(e) => setAlumnoFiltro(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">
                Alumnos Filtrados
              </span>
              <span className="block text-2xl font-black text-slate-900 mt-0.5">
                {totalAlumnos}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3.5 bg-violet-50 text-violet-600 rounded-xl">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">
                Progreso Promedio
              </span>
              <span className="block text-2xl font-black text-slate-900 mt-0.5">
                {progresoPromedio}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">
                Completados
              </span>
              <span className="block text-2xl font-black text-slate-900 mt-0.5">
                {totalCompletados}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase">
                Alumnos Activos
              </span>
              <span className="block text-2xl font-black text-slate-900 mt-0.5">
                {totalActivos}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Métricas de Alumnos */}
        <div className="bg-white rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-bottom border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              Panel de Resultados
              {loading && <RefreshCw className="ml-3 h-4 w-4 animate-spin text-blue-600" />}
            </h3>
            <span className="text-xs font-medium text-slate-500">
              Mostrando {alumnosFiltrados.length} registros
            </span>
          </div>

          {error && (
            <div className="p-6 text-center text-[#EF4444] bg-red-50/50 border-bottom border-red-100">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase bg-slate-50/20">
                  <th className="px-6 py-4">Alumno</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Avance de Curso</th>
                  <th className="px-6 py-4">Nota Promedio</th>
                  <th className="px-6 py-4">Tiempo Conectado</th>
                  <th className="px-6 py-4">Último Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[14px]">
                {loading && alumnosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center">
                        <RefreshCw className="h-10 w-10 animate-spin text-blue-600 mb-3" />
                        Cargando métricas de progreso de estudiantes...
                      </div>
                    </td>
                  </tr>
                ) : alumnosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No se encontraron alumnos matriculados que coincidan con los filtros
                      seleccionados.
                    </td>
                  </tr>
                ) : (
                  alumnosFiltrados.map((alumno) => (
                    <tr
                      key={alumno.documento + alumno.email}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <span className="block font-semibold text-slate-900 leading-tight">
                            {alumno.nombre}
                          </span>
                          <span className="block text-xs text-slate-400 mt-0.5">
                            {alumno.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{alumno.documento}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            alumno.estado === 'activo'
                              ? 'bg-emerald-50 text-emerald-700'
                              : alumno.estado === 'finalizado'
                                ? 'bg-blue-50 text-blue-700'
                                : alumno.estado === 'retirado'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {alumno.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                alumno.progreso >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${alumno.progreso}%` }}
                            />
                          </div>
                          <span
                            className={`font-bold ${alumno.progreso >= 100 ? 'text-emerald-600' : 'text-slate-800'}`}
                          >
                            {alumno.progreso}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold ${alumno.calificacionPromedio >= 70 ? 'text-blue-600' : 'text-amber-600'}`}
                        >
                          {alumno.calificacionPromedio}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {alumno.tiempoConectado}
                      </td>
                      <td className="px-6 py-4">
                        <span className="block text-xs font-medium text-slate-500">
                          {alumno.ultimoAcceso}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <FooterAdmin />
    </div>
  );
}
