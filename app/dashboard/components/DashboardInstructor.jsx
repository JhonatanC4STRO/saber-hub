'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  ChevronDown,
  BookOpen,
  Building,
  List,
  MoreVertical,
  Clock,
  Users,
  Layers,
  Award,
  CalendarClock,
  Edit,
  Eye,
  EyeOff,
  Rocket
} from 'lucide-react';
import HeaderAdmin from './HeaderAdmin';
import FooterAdmin from './FooterAdmin';
import DetalleCurso from '@/components/cursos/DetalleCurso';

const ESTADO_LABELS = {
  borrador: 'Borrador',
  publicado: 'Publicado',
  archivado: 'Archivado',
};

const TAB_ESTADOS = {
  Todos: null,
  Borradores: 'borrador',
  Publicados: 'publicado',
  Archivados: 'archivado',
};

function formatDate(value) {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Fecha pendiente';

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function normalizeText(value) {
  return (value || '').toString().toLowerCase().trim();
}

function getInitials(name) {
  return (name || 'SaberHub')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function CourseCover({ course }) {
  if (course.imgPortada) {
    return (
      <img src={course.imgPortada} alt={course.titulo} className="w-full h-full object-cover" />
    );
  }

  return (
    <div className="w-full h-full bg-[#EEF2FF] flex items-center justify-center">
      <BookOpen size={42} className="text-[#1E40AF]" strokeWidth={1.5} />
    </div>
  );
}

export default function DashboardInstructor({
  usuario,
  cursos = [],
  logrosRecientes = [],
  proximasTareas = [],
}) {
  const [activeTab, setActiveTab] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [tipo, setTipo] = useState('Todos');
  const [cursoDetalle, setCursoDetalle] = useState(null);
  
  const [cursosList, setCursosList] = useState(cursos);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    setCursosList(cursos);
  }, [cursos]);

  useEffect(() => {
    const handleClose = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const handleToggleEstado = async (cursoId, estadoActual) => {
    const nuevoEstado = estadoActual === 'publicado' ? 'borrador' : 'publicado';
    if (!confirm(`¿Deseas cambiar el estado del curso a ${nuevoEstado.toUpperCase()}?`)) return;
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        setCursosList((prev) =>
          prev.map((c) => (c.id === cursoId ? { ...c, estado: nuevoEstado } : c))
        );
        alert(`Curso ${nuevoEstado === 'publicado' ? 'publicado' : 'guardado como borrador'} exitosamente.`);
      } else {
        const err = await res.json();
        alert(err.message || 'Error al cambiar estado.');
      }
    } catch {
      alert('Error al conectar con el servidor.');
    }
  };

  const categorias = useMemo(() => {
    const names = cursosList.map((curso) => curso.categoria?.nombre).filter(Boolean);

    return ['Todas', ...Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'es'))];
  }, [cursosList]);

  const tabs = useMemo(
    () =>
      Object.entries(TAB_ESTADOS).map(([name, estado]) => ({
        name,
        count: estado ? cursosList.filter((curso) => curso.estado === estado).length : cursosList.length,
      })),
    [cursosList]
  );

  const filteredCourses = useMemo(() => {
    const selectedEstado = TAB_ESTADOS[activeTab];
    const query = normalizeText(searchTerm);

    return cursosList.filter((curso) => {
      const matchesTab = !selectedEstado || curso.estado === selectedEstado;
      const matchesCategory = categoria === 'Todas' || curso.categoria?.nombre === categoria;
      const matchesType =
        tipo === 'Todos' ||
        (tipo === 'Con certificado' && curso.otorgaCertificado) ||
        (tipo === 'Sin certificado' && !curso.otorgaCertificado);
      const searchable = normalizeText(
        [
          curso.titulo,
          curso.descripcion,
          curso.categoria?.nombre,
          curso.institucion?.nombre,
          curso.instructor?.nombre,
        ]
          .filter(Boolean)
          .join(' ')
      );
      const matchesSearch = !query || searchable.includes(query);

      return matchesTab && matchesCategory && matchesType && matchesSearch;
    });
  }, [activeTab, categoria, cursosList, searchTerm, tipo]);

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] font-sans"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <HeaderAdmin usuario={usuario} />

      <main className="w-full px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-8">
        <div className="flex-grow md:w-[75%]">
          <div className="flex items-center mb-8">
            <BookOpen size={40} className="text-[#1E40AF]" strokeWidth={1.5} />
            <h1 className="font-bold text-[28px] text-[#111827] ml-3">Mis cursos</h1>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[16px] text-[#111827]">Cursos asignados</h2>
            <Link
              href="/CrearCursos"
              onClick={() => {
                sessionStorage.removeItem('saberhub_curso_id');
              }}
              className="bg-[#1E40AF] px-[20px] py-[12px] rounded-[4px] font-semibold text-[14px] text-white hover:bg-[#1E3A8A] transition-colors no-underline"
            >
              + Crear curso
            </Link>
          </div>

          <div className="flex items-center gap-8 border-b border-[#E5E7EB] mb-6 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                type="button"
                onClick={() => setActiveTab(tab.name)}
                className={`relative flex items-center cursor-pointer pb-3 whitespace-nowrap bg-transparent border-0 px-0 ${
                  activeTab === tab.name ? 'text-[#1E40AF] font-bold' : 'text-[#6B7280] font-medium'
                }`}
              >
                <span className="text-[14px]">{tab.name}</span>
                <span className="ml-2 bg-[#F3F4F6] text-[#6B7280] px-[8px] py-[2px] rounded-[4px] font-semibold text-[11px]">
                  {tab.count}
                </span>
                {activeTab === tab.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E40AF]"></div>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6">
            <div className="relative w-full lg:w-[320px]">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar curso o formación"
                className="w-full h-[40px] pl-10 pr-4 bg-white border border-[#D1D5DB] rounded-[8px] outline-none font-normal text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:border-[#1E40AF]"
              />
            </div>

            <div className="flex items-center w-full lg:w-auto">
              <span className="font-medium text-[13px] text-[#4B5563] mr-3">Categoría</span>
              <div className="relative">
                <select
                  value={categoria}
                  onChange={(event) => setCategoria(event.target.value)}
                  className="h-[40px] px-4 pr-10 bg-white border border-[#D1D5DB] rounded-[8px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:border-[#1E40AF] cursor-pointer w-[180px]"
                >
                  {categorias.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
                />
              </div>
            </div>

            <div className="flex items-center w-full lg:w-auto">
              <span className="font-medium text-[13px] text-[#4B5563] mr-3">Tipo</span>
              <div className="relative">
                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value)}
                  className="h-[40px] px-4 pr-10 bg-white border border-[#D1D5DB] rounded-[8px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:border-[#1E40AF] cursor-pointer w-[180px]"
                >
                  <option>Todos</option>
                  <option>Con certificado</option>
                  <option>Sin certificado</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
                />
              </div>
            </div>

            <div className="flex-grow"></div>

            <div className="flex flex-shrink-0">
              <button
                type="button"
                aria-label="Vista en cuadrícula"
                onClick={() => setViewMode('grid')}
                className={`w-[40px] h-[40px] flex items-center justify-center rounded-l-[4px] cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#1E40AF] text-white border border-[#1E40AF]'
                    : 'bg-white text-[#6B7280] border border-[#D1D5DB] border-r-0'
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                aria-label="Vista en lista"
                onClick={() => setViewMode('list')}
                className={`w-[40px] h-[40px] flex items-center justify-center rounded-r-[4px] cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#1E40AF] text-white border border-[#1E40AF]'
                    : 'bg-white text-[#6B7280] border border-[#D1D5DB] border-l-0'
                }`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="border border-[#E5E7EB] rounded-[4px] p-10 text-center">
              <BookOpen size={34} className="text-[#9CA3AF] mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="font-bold text-[18px] text-[#111827] mb-1">
                No hay cursos para mostrar
              </h3>
              <p className="text-[14px] text-[#6B7280]">
                Ajusta los filtros o crea un curso nuevo para empezar.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {filteredCourses.map((course) => {
                const estadoLabel = ESTADO_LABELS[course.estado] || course.estado || 'Curso';
                const institucion = course.institucion?.nombre || 'SaberHub';
                const categoriaNombre = course.categoria?.nombre || 'General';
                const fecha = `Actualizado ${formatDate(course.actualizado || course.creado)}`;
                const isArchived = course.estado === 'archivado';

                return (
                  <div
                    key={course.id}
                    onClick={() => setCursoDetalle(course)}
                    className={`bg-white rounded-[4px] border border-[#F3F4F6] relative group overflow-hidden transition-all hover:-translate-y-[2px] cursor-pointer ${
                      viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''
                    }`}
                    style={
                      viewMode === 'grid'
                        ? { width: '100%', maxWidth: '340px', margin: '0 auto' }
                        : undefined
                    }
                  >
                    <div
                      className={`relative bg-gray-100 ${viewMode === 'list' ? 'w-full sm:w-[220px] aspect-video sm:aspect-auto sm:min-h-[170px] flex-shrink-0' : 'w-full aspect-video'}`}
                    >
                      <CourseCover course={course} />

                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="bg-[#1E40AF] text-white font-semibold text-[12px] px-[14px] py-[6px] rounded-[4px] uppercase">
                          {estadoLabel}
                        </span>
                        {isArchived && (
                          <span className="bg-[#EF4444] text-white font-semibold text-[12px] px-[14px] py-[6px] rounded-[4px] uppercase">
                            Archivado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-white flex flex-col flex-1">
                      <div className="flex items-center mb-2">
                        <Building size={14} className="text-[#4B5563] flex-shrink-0" />
                        <span className="font-medium text-[13px] text-[#374151] ml-1.5 truncate">
                          {institucion}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center min-w-0">
                          <BookOpen size={14} className="text-[#4B5563] flex-shrink-0" />
                          <span className="font-medium text-[13px] text-[#4B5563] ml-1.5 truncate">
                            {categoriaNombre}
                          </span>
                        </div>
                        <div className="relative">
                          <MoreVertical
                            size={16}
                            className="text-[#1E40AF] cursor-pointer flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(prev => prev === course.id ? null : course.id);
                            }}
                          />
                          {openDropdownId === course.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-[#E5E7EB] rounded shadow-lg z-50 py-1 text-left">
                              <Link
                                href="/CrearCursos"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sessionStorage.setItem('saberhub_curso_id', course.id);
                                }}
                                className="flex items-center gap-1.5 w-full px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 font-semibold no-underline"
                              >
                                <Edit size={14} className="text-gray-500" /> Editar
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCursoDetalle(course);
                                  setOpenDropdownId(null);
                                }}
                                className="flex items-center gap-1.5 w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 font-semibold bg-transparent border-0 cursor-pointer"
                              >
                                <Eye size={14} className="text-gray-500" /> Ver resumen
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleEstado(course.id, course.estado);
                                  setOpenDropdownId(null);
                                }}
                                className="flex items-center gap-1.5 w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 font-semibold bg-transparent border-0 cursor-pointer"
                              >
                                {course.estado === 'publicado' ? (
                                  <>
                                    <EyeOff size={14} className="text-gray-500" /> Despublicar
                                  </>
                                ) : (
                                  <>
                                    <Rocket size={14} className="text-gray-500" /> Publicar
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-[16px] text-[#111827] leading-[1.3] mb-1 line-clamp-2">
                        {course.titulo}
                      </h3>

                      <p className="font-normal text-[14px] text-[#6B7280] mb-2 truncate">
                        {course.otorgaCertificado
                          ? 'Curso con certificado'
                          : 'Curso sin certificado'}
                      </p>

                      <p className="font-normal text-[14px] text-[#4B5563] leading-[1.5] mb-4 line-clamp-2">
                        {course.descripcion || 'Este curso todavía no tiene descripción.'}
                      </p>

                      {/* 1. Módulos y Calificación Promedio (Estrellas) */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center gap-1.5 text-[13px] text-[#4B5563]">
                          <Layers size={13} /> {course._count?.modulos || 0} módulos
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[#F59E0B] text-[16px] leading-none">★</span>
                          <span className="font-bold text-[13px] text-[#111827]">
                            {course.calificacionPromedio || '4.5'}
                          </span>
                        </div>
                      </div>

                      {/* 2. Progreso Promedio (% de Avance) */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-[12px] text-[#4B5563] mb-1 font-medium">
                          <span>Progreso Promedio</span>
                          <span className="font-bold text-[#1E40AF]">
                            {course.avancePromedio || 0}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#1E40AF] to-[#10B981] rounded-full"
                            style={{ width: `${course.avancePromedio || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 3. Total de Inscritos y Alumnos Inactivos */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F3F4F6]">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} className="text-[#4B5563] flex-shrink-0" />
                          <span className="font-semibold text-[13px] text-[#111827]">
                            {course._count?.inscripciones || 0} inscritos
                          </span>
                        </div>
                        {course.alumnosInactivosCount > 0 ? (
                          <span className="bg-[#FEF2F2] text-[#EF4444] font-bold text-[11px] px-2 py-0.5 rounded-[4px] border border-[#FEE2E2] flex items-center gap-1 animate-pulse">
                            ⚠️ {course.alumnosInactivosCount} inactivos
                          </span>
                        ) : (
                          <span className="bg-[#ECFDF5] text-[#10B981] font-semibold text-[11px] px-2 py-0.5 rounded-[4px] border border-[#D1FAE5]">
                            Activos
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1E40AF]"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="w-full md:w-[360px] flex-shrink-0 bg-white p-6 rounded-[4px] border border-[#F3F4F6]">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[18px] text-[#111827]">Logros recientes</h3>
            </div>

            {logrosRecientes.length === 0 ? (
              <div className="py-8 text-center border border-[#F3F4F6] rounded-[4px]">
                <Award size={34} className="text-[#9CA3AF] mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-medium text-[14px] text-[#6B7280]">
                  Aún no hay certificados emitidos en tus cursos.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {logrosRecientes.map((logro) => (
                  <div key={logro.id} className="flex items-start py-5 border-b border-[#F3F4F6]">
                    <div className="w-[64px] h-[64px] rounded-full border-[4px] border-[#1E40AF] bg-white flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-[#1E40AF] text-[18px]">
                        {getInitials(logro.estudiante)}
                      </span>
                    </div>
                    <div className="ml-4 flex flex-col justify-center min-w-0">
                      <span className="font-medium text-[11px] text-[#6B7280] uppercase tracking-wide">
                        Certificado emitido
                      </span>
                      <span className="font-bold text-[15px] text-[#111827] leading-[1.3] mt-1 mb-1.5 line-clamp-2">
                        {logro.estudiante}
                      </span>
                      <div className="flex items-center text-[#6B7280] text-[12px]">
                        <BookOpen size={12} className="mr-1.5 flex-shrink-0" />
                        <span className="truncate">{logro.curso}</span>
                      </div>
                      <span className="text-[12px] text-[#9CA3AF] mt-1">
                        {formatDate(logro.fechaEmision)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[18px] text-[#111827]">Próximas tareas</h3>
            </div>

            {proximasTareas.length === 0 ? (
              <div className="bg-white border border-[#F3F4F6] rounded-[4px] p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
                <div className="w-[120px] h-[120px] mb-6 relative">
                  <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    <circle cx="50" cy="50" r="40" fill="#F3F4F6" />
                    <path
                      d="M40 70 L60 70"
                      stroke="#D1D5DB"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M45 60 L75 60"
                      stroke="#D1D5DB"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M35 50 L65 50"
                      stroke="#D1D5DB"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <circle cx="30" cy="35" r="12" fill="#E5E7EB" />
                    <path
                      d="M15 65 Q30 50 45 65"
                      stroke="#E5E7EB"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <circle cx="65" cy="35" r="15" stroke="#9CA3AF" strokeWidth="4" fill="none" />
                    <line
                      x1="55"
                      y1="45"
                      x2="45"
                      y2="55"
                      stroke="#9CA3AF"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h4 className="font-bold text-[18px] text-[#111827] mb-2">
                  No hay tareas próximas por ahora
                </h4>
                <p className="font-normal text-[14px] text-[#6B7280]">
                  Mantente al pendiente de este espacio.
                </p>
              </div>
            ) : (
              <div className="flex flex-col border border-[#F3F4F6] rounded-[4px]">
                {proximasTareas.map((tarea) => (
                  <div
                    key={tarea.id}
                    className="flex items-start gap-3 p-4 border-b border-[#F3F4F6] last:border-b-0"
                  >
                    <CalendarClock size={20} className="text-[#1E40AF] mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-[14px] text-[#111827] leading-[1.3] mb-1 line-clamp-2">
                        {tarea.titulo}
                      </h4>
                      <p className="text-[12px] text-[#6B7280] truncate">{tarea.curso}</p>
                      <p className="text-[12px] text-[#4B5563] mt-1">
                        {formatDateTime(tarea.fechaInicio)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      <FooterAdmin />

      {cursoDetalle && (
        <DetalleCurso
          curso={cursosList.find((c) => c.id === cursoDetalle.id) || cursoDetalle}
          onCerrar={() => setCursoDetalle(null)}
          onEstadoCambiado={(nuevoEstado) => {
            setCursosList((prev) =>
              prev.map((c) => (c.id === cursoDetalle.id ? { ...c, estado: nuevoEstado } : c))
            );
          }}
          userRole="instructor"
        />
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
