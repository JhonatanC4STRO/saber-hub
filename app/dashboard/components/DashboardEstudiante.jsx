'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  BookOpen,
  Play,
  Clock,
  MoreVertical,
  HelpCircle,
  Check,
  ExternalLink,
  MessageSquare,
  Video,
  Trash2,
  Lock,
} from 'lucide-react';
import VisorCurso from '@/components/estudiante/VisorCurso';
import WidgetComplementarios from '@/components/estudiante/WidgetComplementarios';
import HeaderAdmin from './HeaderAdmin';

const YoutubeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);
const FacebookIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.81l.39-4h-4.2V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);
const InstagramIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
const LinkedinIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);
const TwitterIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

export default function DashboardEstudiante({ usuario }) {
  const [viewMode, setViewMode] = useState('grid');
  const [courses, setCourses] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [upcomingEvaluations, setUpcomingEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademy, setSelectedAcademy] = useState('Todas');
  const [selectedType, setSelectedType] = useState('Todos');
  const [cursoVisor, setCursoVisor] = useState(null);
  const [openMenuCourseId, setOpenMenuCourseId] = useState(null);
  const [cancelingCourseId, setCancelingCourseId] = useState(null);
  const [showLockWarning, setShowLockWarning] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuCourseId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleCancelEnrollment = async (inscripcionId, courseTitle) => {
    if (!window.confirm(`¿Estás seguro de que deseas darte de baja del curso "${courseTitle}"? Perderás todo tu progreso.`)) {
      return;
    }

    setCancelingCourseId(inscripcionId);
    try {
      const res = await fetch(`/api/inscripciones/${inscripcionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'retirado' }),
      });

      if (res.ok) {
        alert('Te has dado de baja del curso exitosamente.');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.message || 'Ocurrió un error al intentar darte de baja.');
      }
    } catch (error) {
      console.error('Error canceling enrollment:', error);
      alert('Error de conexión al servidor.');
    } finally {
      setCancelingCourseId(null);
      setOpenMenuCourseId(null);
    }
  };

  const fetchData = React.useCallback(async () => {
    try {
      const [resInscripciones, resCertificados, resEvaluaciones] = await Promise.all([
        fetch('/api/inscripciones'),
        fetch('/api/certificados'),
        fetch('/api/evaluaciones?pendientes=true'),
      ]);

      if (resInscripciones.ok) {
        const data = await resInscripciones.json();
        const mappedCourses = (data.inscripciones || [])
          .filter((ins) => ins.estado !== 'retirado')
          .map((ins) => ({
          id: ins.curso.id,
          inscripcionId: ins.id,
          image:
            ins.curso.imgPortada ||
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=338&fit=crop',
          level: 'PRINCIPIANTE',
          finished: ins.estado === 'finalizado' || ins.estado === 'finalizada',
          institution: ins.curso.institucion?.nombre || 'SABERHUB',
          type: ins.curso.categoria?.nombre
            ? `Course | ${ins.curso.categoria.nombre}`
            : 'Course | Self-paced',
          title: ins.curso.titulo,
          subtitle: ins.curso.titulo,
          description: ins.curso.descripcion || 'Sin descripción disponible.',
          date: ins.fechaInscripcion
            ? new Date(ins.fechaInscripcion).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                }).replace(/ de /g, ' ')
            : 'Fecha no disponible',
          progress: ins.progreso ? parseFloat(ins.progreso) : 0,
        }));
        setCourses(mappedCourses);
      }

      if (resCertificados.ok) {
        const certs = await resCertificados.json();
        const mappedAchievements = (certs || []).map((c) => ({
          icon: BookOpen,
          title: `Certificado de Aprobación`,
          course: c.inscripcion?.curso?.titulo || 'Curso Completado',
        }));
        setAchievements(mappedAchievements);
      }

      if (resEvaluaciones.ok) {
        const evals = await resEvaluaciones.json();
        const mappedEvals = evals.map((ev) => ({
          id: ev.id,
          titulo: ev.titulo,
          curso: ev.curso?.titulo || 'Curso Asignado',
          cursoId: ev.curso?.id || ev.cursoId || null,
          moduloId: ev.moduloId || null,
          preguntasCount: ev._count?.preguntas || 0,
          puntajeMinimo: ev.puntajeMinimo,
        }));
        setUpcomingEvaluations(mappedEvals);
      }
    } catch (error) {
      console.error('Error al cargar datos reales del estudiante:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesAcademy = true;
    if (selectedAcademy !== 'Todas') {
      matchesAcademy = course.institution.toLowerCase().includes(selectedAcademy.toLowerCase());
    }

    let matchesType = true;
    if (selectedType !== 'Todos') {
      matchesType = course.type.toLowerCase().includes(selectedType.toLowerCase());
    }

    return matchesSearch && matchesAcademy && matchesType;
  });

  return (
    <div
      className="min-h-screen bg-white font-sans flex flex-col"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <HeaderAdmin usuario={usuario} />

      {/* CUERPO DE LA PÁGINA */}
      <main className="flex-1 bg-white p-6 lg:p-8 max-w-[1440px] w-full mx-auto flex flex-col lg:flex-row gap-8">
        {/* COLUMNA PRINCIPAL */}
        <div className="flex-1 min-w-0">
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-8">
            <BookOpen size={40} className="text-[#1E40AF]" strokeWidth={1.5} />
            <h1 className="font-bold text-[28px] text-[#111827]">Mi Aprendizaje</h1>
          </div>

          <h2 className="font-bold text-[16px] text-[#111827] mb-4">En progreso</h2>

          {/* Barra de filtros */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center border border-[#D1D5DB] rounded-lg h-10 px-3 bg-white w-full sm:w-[320px]">
              <Search size={16} className="text-[#9CA3AF] mr-2" />
              <input
                type="text"
                placeholder="Buscar curso, formación"
                className="flex-1 outline-none text-[13px] text-[#111827] placeholder-[#9CA3AF]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[13px] text-[#4B5563] hidden sm:block">
                  Academia
                </span>
                <div className="relative">
                  <select
                    className="border border-[#D1D5DB] rounded-lg h-10 pl-3 pr-8 w-full sm:w-[180px] text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
                    value={selectedAcademy}
                    onChange={(e) => setSelectedAcademy(e.target.value)}
                  >
                    <option value="Todas">Todas</option>
                    <option value="SENA">SENA</option>
                    <option value="MinTIC">MinTIC</option>
                    <option value="Universidad Nacional">Universidad Nacional</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-[13px] text-[#4B5563] hidden sm:block">Tipo</span>
                <div className="relative">
                  <select
                    className="border border-[#D1D5DB] rounded-lg h-10 pl-3 pr-8 w-full sm:w-[180px] text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Course">Course</option>
                    <option value="Self-paced">Self-paced</option>
                    <option value="Instructor-led">Instructor-led</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                  />
                </div>
              </div>

              <div className="sm:ml-auto flex border border-[#D1D5DB] rounded-lg overflow-hidden flex-shrink-0">
                <button
                  className={`w-10 h-10 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#1E40AF] text-white' : 'bg-white text-[#9CA3AF]'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={`w-10 h-10 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-[#1E40AF] text-white' : 'bg-white text-[#9CA3AF]'}`}
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* GRID DE CARDS O SKELETON O EMPTY STATE */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#F3F4F6] rounded">
              <div className="w-12 h-12 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[14px] font-medium text-[#6B7280]">
                Cargando tus cursos reales...
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white border border-[#F3F4F6] rounded flex flex-col items-center justify-center py-16 px-6 text-center shadow-sm">
              <div className="w-24 h-24 mb-4 text-[#D1D5DB] flex items-center justify-center rounded-full bg-[#EFF6FF]">
                <BookOpen size={48} className="text-[#1E40AF]" />
              </div>
              <h3 className="font-bold text-[18px] text-[#111827] mb-2">
                No tienes cursos en tu aprendizaje todavía
              </h3>
              <p className="font-normal text-[14px] text-[#6B7280] mb-6 max-w-md">
                Inscríbete en cursos reales desde el catálogo para que aparezcan en esta sección.
              </p>
              <Link
                href="/catalogo"
                className="bg-[#1E40AF] text-white font-semibold text-[14px] px-6 py-3 rounded hover:bg-blue-800 transition-colors"
              >
                Explorar Catálogo de Cursos
              </Link>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {filteredCourses.map((course, idx) => (
                <div
                  key={idx}
                  className={`bg-white border border-[#F3F4F6] rounded flex relative overflow-hidden transition-all hover:shadow-md ${viewMode === 'grid' ? 'flex-col w-full' : 'flex-row w-full h-[180px]'}`}
                >
                  {/* Imagen */}
                  <div
                    className={`relative bg-gray-200 flex-shrink-0 ${viewMode === 'grid' ? 'w-full aspect-video' : 'w-[280px] h-full'}`}
                  >
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-[#1E40AF] text-white font-semibold text-[12px] px-3.5 py-1.5 rounded">
                        {course.level}
                      </span>
                      {course.finished && (
                        <span className="bg-[#EF4444] text-white font-semibold text-[12px] px-3.5 py-1.5 rounded">
                          CLASE TERMINADA
                        </span>
                      )}
                    </div>

                    {/* Play Button */}
                    <button
                      onClick={() => setCursoVisor({ cursoId: course.id, titulo: course.title })}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform shadow-lg cursor-pointer"
                    >
                      <Play size={24} className="text-[#111827] ml-1" fill="#111827" />
                    </button>
                  </div>

                  {/* Contenido */}
                  <div className="p-4 flex flex-col flex-1 relative bg-white">
                    <div className="flex items-center gap-1.5 mb-1 text-[#374151]">
                      <span className="text-[14px]">🏛</span>
                      <span className="font-medium text-[13px] truncate">{course.institution}</span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={14} className="text-[#4B5563]" />
                        <span className="font-medium text-[13px] text-[#4B5563]">
                          {course.type}
                        </span>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuCourseId(openMenuCourseId === course.id ? null : course.id);
                          }}
                          className="text-[#1E40AF] p-1 hover:bg-[#EFF6FF] rounded cursor-pointer"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {openMenuCourseId === course.id && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-7 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-[100] w-52 py-1.5 font-semibold text-[13px] text-[#475569] text-left"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCursoVisor({ cursoId: course.id, titulo: course.title });
                                setOpenMenuCourseId(null);
                              }}
                              className="w-full px-4 py-2 hover:bg-[#F8FAFC] hover:text-[#1E40AF] flex items-center gap-2 text-left font-semibold cursor-pointer"
                            >
                              <Play size={14} className="text-[#1E40AF]" fill="#1E40AF" />
                              Continuar aprendiendo
                            </button>

                            <Link href={`/cursos/${course.id}`} onClick={() => setOpenMenuCourseId(null)} className="no-underline">
                              <span className="block w-full px-4 py-2 hover:bg-[#F8FAFC] hover:text-[#1E40AF] flex items-center gap-2 font-semibold text-[#475569]">
                                <ExternalLink size={14} className="text-[#475569]" />
                                Ver detalles del curso
                              </span>
                            </Link>

                            <Link href={`/cursos/${course.id}/foro`} onClick={() => setOpenMenuCourseId(null)} className="no-underline">
                              <span className="block w-full px-4 py-2 hover:bg-[#F8FAFC] hover:text-[#1E40AF] flex items-center gap-2 font-semibold text-[#475569]">
                                <MessageSquare size={14} className="text-[#475569]" />
                                Foro de discusión
                              </span>
                            </Link>

                            <Link href={`/cursos/${course.id}/sesiones`} onClick={() => setOpenMenuCourseId(null)} className="no-underline">
                              <span className="block w-full px-4 py-2 hover:bg-[#F8FAFC] hover:text-[#1E40AF] flex items-center gap-2 font-semibold text-[#475569]">
                                <Video size={14} className="text-[#475569]" />
                                Clases en vivo
                              </span>
                            </Link>

                            <div className="h-[1px] bg-slate-100 my-1"></div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEnrollment(course.inscripcionId, course.title);
                              }}
                              disabled={cancelingCourseId === course.inscripcionId}
                              className="w-full px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center gap-2 text-left font-semibold disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 size={14} className="text-red-600" />
                              {cancelingCourseId === course.inscripcionId ? 'Cancelando...' : 'Dar de baja del curso'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <Link href={`/cursos/${course.id}`}>
                      <h3 className="font-bold text-[16px] text-[#111827] leading-snug line-clamp-2 mb-1 hover:text-[#1E40AF] transition-colors cursor-pointer">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="font-normal text-[14px] text-[#6B7280] mb-2 truncate">
                      {course.subtitle}
                    </p>
                    <p
                      className={`font-normal text-[14px] text-[#4B5563] leading-relaxed mb-4 ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}
                    >
                      {course.description}
                    </p>

                    <div className="mt-auto">
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="w-5 h-5 rounded-full border border-[#D1D5DB] flex items-center justify-center">
                          <Clock size={10} className="text-[#4B5563]" />
                        </div>
                        <span className="font-normal text-[13px] text-[#4B5563]">
                          {course.date}
                        </span>
                      </div>

                      {course.progress !== undefined && (
                        <div className="mb-2">
                          <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden mb-1">
                            <div
                              className="h-full bg-[#1E40AF]"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-[11px] text-[#4B5563]">
                            {course.progress}% completado
                          </span>
                        </div>
                      )}
                    </div>

                    {/* LÍNEA DECORATIVA AZUL (OBLIGATORIA) */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1E40AF]"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR DERECHO */}
        <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-8 bg-white lg:pt-0 pt-8">
          {/* Logros */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[16px] text-[#111827]">Últimos logros</h2>
              <button className="font-medium text-[13px] text-[#1E40AF] hover:underline cursor-pointer">
                Ver todo
              </button>
            </div>

            <div className="flex flex-col gap-0">
              {achievements.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-[#E5E7EB] rounded-lg">
                  <p className="text-[13px] text-[#6B7280]">
                    Aún no has obtenido ningún logro. ¡Completa tus cursos para obtener
                    certificaciones!
                  </p>
                </div>
              ) : (
                achievements.map((ach, idx) => {
                  const Icon = ach.icon;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start py-5 ${idx < achievements.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}
                    >
                      <div className="w-16 h-16 flex-shrink-0 rounded-full border-[4px] border-[#1E40AF] bg-white flex items-center justify-center">
                        <Icon size={28} className="text-[#1E40AF]" />
                      </div>
                      <div className="ml-4 flex flex-col justify-center min-h-[64px]">
                        <span className="font-medium text-[11px] tracking-widest text-[#6B7280] uppercase mb-1">
                          LOGROS
                        </span>
                        <h3 className="font-bold text-[15px] text-[#111827] leading-snug mb-1">
                          {ach.title}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={12} className="text-[#6B7280]" />
                          <span className="font-normal text-[12px] text-[#6B7280] truncate">
                            {ach.course}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="w-full h-px bg-[#F3F4F6] mt-2 mb-2"></div>
          </section>

          {/* Próximas Evaluaciones */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[16px] text-[#111827]">Próximas evaluaciones</h2>
              <span className="bg-[#1E40AF] text-white font-semibold text-[11px] px-2 py-0.5 rounded-[4px]">
                {upcomingEvaluations.length} PENDIENTES
              </span>
            </div>

            {upcomingEvaluations.length === 0 ? (
              <div className="bg-white border border-[#F3F4F6] rounded flex flex-col items-center justify-center py-10 px-6 text-center shadow-sm">
                <div className="w-12 h-12 mb-4 text-[#10B981] flex items-center justify-center rounded-full bg-[#ECFDF5]">
                  <Check size={20} />
                </div>
                <h3 className="font-bold text-[15px] text-[#111827] mb-1">¡Estás al día!</h3>
                <p className="font-normal text-[13px] text-[#6B7280]">
                  No tienes evaluaciones pendientes en tus cursos.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingEvaluations.map((ev) => {
                  const course = courses.find((c) => c.id === ev.cursoId);
                  const isCourseFinalExam = !ev.moduloId;
                  const isLocked = isCourseFinalExam && course && course.progress < 100;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        if (isLocked) {
                          setShowLockWarning(true);
                          return;
                        }
                        if (ev.cursoId) {
                          setCursoVisor({ cursoId: ev.cursoId, initialActiveItemId: ev.id });
                        } else {
                          alert('No se pudo encontrar el curso asociado a esta evaluación.');
                        }
                      }}
                      className={`bg-[#FBFBFB] border border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition-colors p-4 rounded-[4px] relative group overflow-hidden ${isLocked ? 'opacity-75' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-[11px] text-[#6B7280] uppercase tracking-wide">
                          {isCourseFinalExam ? 'Evaluación Final del Curso' : 'Evaluación'}
                        </span>
                        {isLocked && (
                          <span className="bg-amber-50 text-amber-700 font-semibold text-[10px] px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                            <Lock size={10} /> Bloqueado
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-[14px] text-[#111827] leading-[1.3] mt-1 mb-1.5 group-hover:text-[#1E40AF] transition-colors line-clamp-2">
                        {ev.titulo}
                      </h4>
                      <div className="flex flex-col gap-1 text-[#6B7280] text-[12px] mt-2">
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={12} className="text-[#4B5563]" /> {ev.curso}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <HelpCircle size={12} className="text-[#4B5563]" /> {ev.preguntasCount}{' '}
                          preguntas
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#F3F4F6] text-[12px]">
                        <span className="font-medium text-[#4B5563]">
                          Aprobar con: <strong className="text-[#1E40AF]">{ev.puntajeMinimo}%</strong>
                        </span>
                        {isLocked ? (
                          <span className="text-amber-600 font-bold hover:underline flex items-center gap-1">
                            <Lock size={12} /> Bloqueado
                          </span>
                        ) : (
                          <span className="text-[#1E40AF] font-bold hover:underline">
                            Presentar &rarr;
                          </span>
                        )}
                      </div>
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isLocked ? 'bg-amber-500' : 'bg-[#1E40AF]'}`}></div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Cursos Complementarios para ti (RF-03) */}
          <WidgetComplementarios />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#171717] px-8 py-12 mt-12 w-full">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-12">
            <div className="font-bold text-[16px] text-white flex-shrink-0">SABERHUB</div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-[14px] text-white mb-2">Catálogo de aprendizaje</h4>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Explorar cursos
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Instituciones
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Rutas de formación
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-[14px] text-white mb-2">Enseñar con nosotros</h4>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Cómo funciona
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Recursos para instructores
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Comunidad
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-[14px] text-white mb-2">Soporte</h4>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Centro de ayuda
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Contacto
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Acerca de SABERHUB
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <YoutubeIcon />
              </button>
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <FacebookIcon />
              </button>
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <InstagramIcon />
              </button>
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <LinkedinIcon />
              </button>
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <TwitterIcon />
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-[#4B5563] mb-6"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-normal text-[12px] text-[#9CA3AF]">
              © 2026 SABERHUB. Todos los derechos reservados.
            </span>
            <div className="flex flex-wrap justify-center gap-2 text-[12px] text-[#D1D5DB]">
              <a href="#" className="hover:text-white transition-colors">
                Términos
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Privacidad
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Protección de datos
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Marcas
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Accesibilidad
              </a>
            </div>
          </div>
        </div>
      </footer>
      {cursoVisor && (
        <VisorCurso
          cursoId={cursoVisor.cursoId}
          initialActiveItemId={cursoVisor.initialActiveItemId}
          onCerrar={() => setCursoVisor(null)}
          onProgresoActualizado={fetchData}
        />
      )}
      {showLockWarning && (
        <div className="fixed inset-0 bg-[#000000]/50 backdrop-blur-sm flex items-center justify-center z-[2100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4 flex-shrink-0">
              <Lock size={28} />
            </div>
            
            <h3 className="font-bold text-[20px] text-slate-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Examen Bloqueado
            </h3>
            
            <p className="font-normal text-[14px] text-slate-600 mb-6 leading-relaxed">
              Para poder presentar la <strong className="text-slate-950">Evaluación Final del Curso</strong> y obtener tu certificado, primero debes completar el <strong className="text-[#1E40AF]">100% de las lecciones</strong> disponibles. ¡Sigue aprendiendo!
            </p>

            <button
              type="button"
              onClick={() => setShowLockWarning(false)}
              className="w-full py-3 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-xl font-semibold text-[14px] transition-colors cursor-pointer outline-none shadow-lg shadow-blue-500/10"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
