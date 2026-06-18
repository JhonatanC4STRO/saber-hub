'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VisorCurso from './VisorCurso';
import CursosComplementarios from './CursosComplementarios';
import {
  Search,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  BookOpen,
  Play,
  Clock,
  Globe,
  HelpCircle,
  Bell,
  Check,
  Star,
  Copy,
  ChevronRight,
  Eye,
  Rocket
} from 'lucide-react';

export default function DetalleCursoClient({ course, currentUser, isInitiallyEnrolled }) {
  const router = useRouter();
  const objetivosFiltrados = (course.objetivos || []).filter(Boolean);
  const requisitosFiltrados = (course.requisitos || []).filter(Boolean);
  const [activeTab, setActiveTab] = useState('descripcion');
  const [expandedModules, setExpandedModules] = useState({ 0: true }); // Módulo 1 (índice 0) abierto por defecto
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [yaInscrito, setYaInscrito] = useState(isInitiallyEnrolled);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isStickyTabs, setIsStickyTabs] = useState(false);
  const [mostrarVisor, setMostrarVisor] = useState(false);
  const [enrollModal, setEnrollModal] = useState({
    showConfirm: false,
    showSuccess: false,
    loading: false,
    errorMsg: '',
  });

  // Referencias para scroll-anchor
  const descRef = useRef(null);
  const contenidoRef = useRef(null);
  const instructorRef = useRef(null);
  const resenasRef = useRef(null);
  const requisitosRef = useRef(null);
  const tabsRef = useRef(null);

  // Monitorizar scroll para tab sticky y activo
  useEffect(() => {
    const handleScroll = () => {
      if (!tabsRef.current) return;
      const tabsTop = tabsRef.current.getBoundingClientRect().top;

      // Activar sticky si la barra de pestañas llega al tope de la pantalla
      setIsStickyTabs(tabsTop <= 80);

      // Calcular qué sección está actualmente en vista para iluminar el tab
      const scrollPos = window.scrollY + 160;

      const getSectionTop = (ref) => (ref.current ? ref.current.offsetTop : 0);

      const descTop = getSectionTop(descRef);
      const contTop = getSectionTop(contenidoRef);
      const instTop = getSectionTop(instructorRef);
      const reqTop = requisitosFiltrados.length > 0 ? getSectionTop(requisitosRef) : 0;
      const resTop = getSectionTop(resenasRef);

      if (scrollPos >= resTop - 20) {
        setActiveTab('reseñas');
      } else if (scrollPos >= instTop - 20) {
        setActiveTab('instructor');
      } else if (scrollPos >= contTop - 20) {
        setActiveTab('contenido');
      } else if (reqTop > 0 && scrollPos >= reqTop - 20) {
        setActiveTab('prerrequisitos');
      } else {
        setActiveTab('descripcion');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [requisitosFiltrados.length]);

  // Calcular duración total y cantidad de lecciones en tiempo real
  let totalMinutos = 0;
  let totalLecciones = 0;
  course.modulos?.forEach((modulo) => {
    totalLecciones += modulo.lecciones?.length || 0;
    modulo.lecciones?.forEach((leccion) => {
      if (leccion.duracion) {
        totalMinutos += leccion.duracion;
      }
    });
  });

  // Determinar la duración a mostrar
  let duracionTexto = '';
  if (course.duracion) {
    duracionTexto = `${course.duracion} ${course.duracionUnidad || 'horas'}`;
  } else {
    if (totalMinutos > 0) {
      const horas = Math.ceil(totalMinutos / 60);
      duracionTexto = `${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    } else {
      duracionTexto = 'A tu propio ritmo';
    }
  }

  // Manejar expansión/colapso de acordeón
  const toggleModulo = (idx) => {
    setExpandedModules((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Scroll suave al hacer clic en pestañas
  const scrollToSection = (sectionId, ref) => {
    setActiveTab(sectionId);
    if (ref.current) {
      const topOffset = ref.current.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({
        top: topOffset,
        behavior: 'smooth',
      });
    }
  };

  // Acción de Inscribirse
  const handleInscripcion = () => {
    if (!currentUser) {
      alert('Debes iniciar sesión para inscribirte en este curso.');
      router.push('/login');
      return;
    }
    setEnrollModal({
      showConfirm: true,
      showSuccess: false,
      loading: false,
      errorMsg: '',
    });
  };

  const confirmInscripcion = async () => {
    setEnrollModal(prev => ({ ...prev, loading: true, errorMsg: '' }));
    try {
      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId: course.id }),
      });

      const data = await res.json();

      if (res.ok || res.status === 201) {
        setYaInscrito(true);
        setEnrollModal({
          showConfirm: false,
          showSuccess: true,
          loading: false,
          errorMsg: '',
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else if (res.status === 409) {
        setYaInscrito(true);
        setEnrollModal({
          showConfirm: false,
          showSuccess: true,
          loading: false,
          errorMsg: 'Ya estás inscrito en este curso.',
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else {
        setEnrollModal(prev => ({
          ...prev,
          loading: false,
          errorMsg: data.message || 'Intenta nuevamente',
        }));
      }
    } catch (err) {
      console.error(err);
      setEnrollModal(prev => ({
        ...prev,
        loading: false,
        errorMsg: 'Ocurrió un error de red. Intenta nuevamente.',
      }));
    }
  };

  // Copiar enlace al portapapeles
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Contactar al instructor por mensaje directo
  const handleContactarInstructor = () => {
    if (!currentUser) {
      alert('Debes iniciar sesión para enviar un mensaje al instructor.');
      router.push('/login');
      return;
    }
    if (!course.instructor?.id) {
      alert('Información del instructor no disponible.');
      return;
    }
    router.push(`/dashboard/mensajes?contactId=${course.instructor.id}`);
  };

  return (
    <div
      className="min-h-screen bg-white font-sans flex flex-col"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. HEADER SUPERIOR (Idéntico al del catálogo) */}
      <HeaderAdmin usuario={currentUser} />

      {/* 2. HERO SECTION DEL CURSO (Fondo azul oscuro #0F172A) */}
      <section className="bg-[#0F172A] text-white py-12 px-6 lg:px-12 w-full">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Columna Izquierda (Hero Metadata - 60% / col-span-7) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Breadcrumb */}
            <div className="text-[13px] text-[#94A3B8] font-normal flex items-center gap-1">
              <span>Catálogo</span>
              <ChevronRight size={12} className="text-[#64748B]" />
              <span className="capitalize">
                {course.categoria?.nombre?.toLowerCase() || 'General'}
              </span>
              <ChevronRight size={12} className="text-[#64748B]" />
              <span className="text-[#CBD5E1] font-semibold truncate max-w-[200px] md:max-w-none">
                {course.titulo}
              </span>
            </div>

            {/* Badge de Nivel */}
            <div className="w-fit">
              <span className="bg-[#1E40AF] text-white font-semibold text-[12px] px-3.5 py-1.5 rounded tracking-wider text-center uppercase">
                {course.nivel || 'GENERAL'}
              </span>
            </div>

            {/* Título */}
            <h1 className="font-bold text-[28px] md:text-[36px] text-white leading-tight">
              {course.titulo}
            </h1>

            {/* Instructor dictante con enlace para enviar mensaje */}
            {course.instructor && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[12px] flex items-center justify-center border border-slate-700 overflow-hidden shadow-sm">
                    {course.instructor.imagen ? (
                      <img src={course.instructor.imagen} alt={course.instructor.nombre} className="w-full h-full object-cover" />
                    ) : (
                      course.instructor.nombre.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-[14px] text-[#CBD5E1]">
                    Dictado por <span className="font-semibold text-white">{course.instructor.nombre}</span>
                  </span>
                </div>
                {(!currentUser || currentUser.id !== course.instructor.id) && (
                  <button
                    onClick={handleContactarInstructor}
                    className="bg-[#1E40AF]/60 hover:bg-[#1E40AF] text-white border border-blue-500/30 px-3 py-1 rounded text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    💬 Enviar mensaje
                  </button>
                )}
              </div>
            )}

            {/* Subtítulo */}
            <h2 className="font-normal text-[16px] md:text-[18px] text-[#94A3B8] italic pt-1">
              {course.subtitulo || course.categoria?.nombre || 'Especialización del curso'}
            </h2>

            {/* Descripción breve */}
            <p className="font-normal text-[15px] md:text-[16px] text-[#CBD5E1] leading-relaxed max-w-2xl">
              {course.descripcion
                ? course.descripcion.slice(0, 200) + (course.descripcion.length > 200 ? '...' : '')
                : 'Explora y aprende los conceptos, herramientas y metodologías clave de este curso para impulsar tu perfil profesional.'}
            </p>

            {/* Fila de Métricas */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-[14px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">⭐ 4.8</span>
                <span className="text-[#94A3B8]">(1.247 reseñas)</span>
              </div>
              <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                <span><EmojiIcon emoji="👥" /></span>
                <span>
                  {course._count?.inscripciones
                    ? (course._count.inscripciones).toLocaleString()
                    : '0'}{' '}
                  alumnos inscritos
                </span>
              </div>
              <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                <Clock size={15} />
                <span>
                  {duracionTexto.includes('hora')
                    ? `${duracionTexto} de contenido`
                    : duracionTexto}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                <BookOpen size={15} />
                <span>{course.modulos?.length || 0} módulos</span>
              </div>
            </div>

            {/* Institución */}
            <div className="flex items-center gap-2 pt-2 text-[14px] text-[#CBD5E1]">
              <span className="text-[16px]">🏛</span>
              <span className="font-medium">
                Creado por{' '}
                {course.institucion?.nombre || 'SaberHub'}
              </span>
            </div>

            {/* Fechas */}
            <div className="flex items-center gap-2 text-[13px] text-[#94A3B8]">
              <span>⏰</span>
              <span>Disponibilidad: Abierto para inscripción</span>
            </div>
          </div>

          {/* Columna Derecha (Falsa columna vacía de 5 cols para centrar el float en Desktop) */}
          <div className="lg:col-span-5 h-full hidden lg:block"></div>
        </div>
      </section>

      {/* 3. TABS HORIZONTALES (Sticky) */}
      <div
        ref={tabsRef}
        className={`bg-white border-b border-[#F3F4F6] w-full z-40 transition-all ${
          isStickyTabs ? 'fixed top-[80px] shadow-sm' : 'relative'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 flex items-center h-14 gap-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'descripcion', label: 'Descripción', ref: descRef, show: true },
            { id: 'prerrequisitos', label: 'Prerrequisitos', ref: requisitosRef, show: requisitosFiltrados.length > 0 },
            { id: 'contenido', label: 'Contenido', ref: contenidoRef, show: true },
            { id: 'instructor', label: 'Instructor', ref: instructorRef, show: !!course.instructor },
            { id: 'reseñas', label: 'Reseñas', ref: resenasRef, show: true },
          ].filter(tab => tab.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id, tab.ref)}
              className={`relative h-full font-semibold text-[14px] transition-colors flex-shrink-0 ${
                activeTab === tab.id ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E40AF]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 4. CUERPO PRINCIPAL DE LA PÁGINA (Layout de columnas con sidebar) */}
      <main className="flex-1 bg-white py-8 px-6 lg:px-12 w-full max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
          {/* COLUMNA PRINCIPAL (70% - col-span-8) */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            {/* CARD 1: ¿Qué aprenderás? */}
            {objetivosFiltrados.length > 0 && (
              <div
                ref={descRef}
                className="bg-white border border-[#F3F4F6] rounded p-6 shadow-sm border-b-2 border-b-[#1E40AF]"
              >
                <h3 className="font-bold text-[20px] text-[#111827] mb-4">¿Qué aprenderás?</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {objetivosFiltrados.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-[#1E40AF] mt-0.5 font-bold">✅</span>
                      <span className="font-normal text-[14px] text-[#374151] leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CARD 2: Descripción del curso */}
            <div className="bg-white border border-[#F3F4F6] rounded p-6 shadow-sm border-b-2 border-b-[#1E40AF]">
              <h3 className="font-bold text-[20px] text-[#111827] mb-4">Descripción del curso</h3>

              <div className="text-[15px] text-[#4B5563] space-y-4 leading-relaxed font-normal">
                {course.descripcion ? (
                  <p className="whitespace-pre-line">
                    {isDescExpanded
                      ? course.descripcion
                      : `${course.descripcion.slice(0, 300)}${course.descripcion.length > 300 ? '...' : ''}`}
                  </p>
                ) : (
                  <p>No hay una descripción disponible para este curso todavía.</p>
                )}
              </div>

              {course.descripcion && course.descripcion.length > 300 && (
                <button
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="mt-4 text-[#1E40AF] font-bold text-[14px] hover:underline flex items-center gap-1"
                >
                  {isDescExpanded ? 'Leer menos' : 'Leer más...'}
                </button>
              )}
            </div>

            {/* CARD 3: Requisitos previos */}
            {requisitosFiltrados.length > 0 && (
              <div
                ref={requisitosRef}
                className="bg-white border border-[#F3F4F6] rounded p-6 shadow-sm border-b-2 border-b-[#1E40AF]"
              >
                <h3 className="font-bold text-[20px] text-[#111827] mb-4">Requisitos previos</h3>
                <ul className="list-disc list-inside text-[15px] text-[#4B5563] space-y-3 leading-relaxed">
                  {requisitosFiltrados.map((item, idx) => (
                    <li key={idx} className="font-normal">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CARD 4: Contenido del curso (Acordeón) */}
            <div
              ref={contenidoRef}
              className="bg-white border border-[#F3F4F6] rounded p-6 shadow-sm border-b-2 border-b-[#1E40AF]"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-bold text-[20px] text-[#111827]">Contenido del curso</h3>
                  <p className="font-medium text-[13px] text-[#6B7280] mt-1">
                    {course.modulos?.length || 0} módulos · {totalLecciones} lecciones ·{' '}
                    {duracionTexto}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const allExpanded =
                      Object.keys(expandedModules).length === course.modulos?.length;
                    if (allExpanded) {
                      setExpandedModules({});
                    } else {
                      const expanded = {};
                      course.modulos?.forEach((_, idx) => {
                        expanded[idx] = true;
                      });
                      setExpandedModules(expanded);
                    }
                  }}
                  className="text-[#1E40AF] font-semibold text-[13px] hover:underline self-start md:self-auto"
                >
                  {Object.keys(expandedModules).length === course.modulos?.length
                    ? 'Colapsar todo'
                    : 'Expandir todo'}
                </button>
              </div>

              {/* Lista de Módulos (Acordeón) */}
              <div className="border border-[#F3F4F6] rounded divide-y divide-[#F3F4F6]">
                {course.modulos && course.modulos.length > 0 ? (
                  course.modulos.map((modulo, idx) => {
                    const isOpen = !!expandedModules[idx];
                    const numLec = modulo.lecciones?.length || 0;

                    let minModulo = 0;
                    modulo.lecciones?.forEach((l) => {
                      if (l.duracion) minModulo += l.duracion;
                    });
                    const durModulo = minModulo > 0 ? `${Math.ceil(minModulo / 60)}h` : '45min';

                    return (
                      <div key={modulo.id} className="flex flex-col bg-white">
                        {/* Header del acordeón */}
                        <div
                          onClick={() => toggleModulo(idx)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3 pr-4">
                            <span
                              className={`text-slate-500 font-bold transition-transform ${isOpen ? 'rotate-90' : ''}`}
                            >
                              ▶
                            </span>
                            <span className="font-semibold text-[15px] text-[#111827]">
                              Módulo {idx + 1}: {modulo.titulo}
                            </span>
                          </div>
                          <div className="text-[13px] text-[#6B7280] flex-shrink-0">
                            {numLec} lecciones · {durModulo}
                          </div>
                        </div>

                        {/* Cuerpo del acordeón */}
                        {isOpen && (
                          <div className="bg-white border-t border-[#F3F4F6] px-4 py-2 divide-y divide-[#F9FAFB]">
                            {modulo.lecciones && modulo.lecciones.length > 0 ? (
                              modulo.lecciones.map((leccion, lIdx) => {
                                // Determinar icono
                                let icon = '📄';
                                if (leccion.urlVideo) icon = '🎬';
                                else if (leccion.recursos?.length > 0) icon = '📎';

                                const canOpenVisor =
                                  yaInscrito ||
                                  currentUser?.rol === 'admin' ||
                                  currentUser?.rol === 'instructor';
                                return (
                                  <div
                                    key={leccion.id}
                                    onClick={canOpenVisor ? () => setMostrarVisor(true) : undefined}
                                    className={`flex items-center justify-between py-3 px-2 rounded ${
                                      canOpenVisor
                                        ? 'cursor-pointer hover:bg-blue-50/80 text-[#1E40AF] transition-colors font-medium'
                                        : 'hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 pr-4">
                                      <span className="text-[16px]">{icon}</span>
                                      <span className="font-normal text-[14px] text-[#374151]">
                                        {idx + 1}.{lIdx + 1} {leccion.titulo}
                                      </span>
                                      {leccion.esPreview && (
                                        <span className="bg-[#EFF6FF] text-[#1E40AF] font-bold text-[9px] px-2 py-0.5 rounded tracking-wide border border-[#BFDBFE]">
                                          PREVIEW
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[13px] text-[#6B7280] flex-shrink-0">
                                      {leccion.duracion ? `${leccion.duracion} min` : '10 min'}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[13px] text-[#6B7280] p-4 text-center">
                                Este módulo aún no tiene lecciones creadas.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center p-8 text-[#6B7280]">
                    Este curso no tiene módulos estructurados todavía.
                  </p>
                )}
              </div>
            </div>

            {/* CARD 5: Acerca del instructor */}
            <div
              ref={instructorRef}
              className="bg-white border border-[#F3F4F6] rounded p-6 shadow-sm border-b-2 border-b-[#1E40AF]"
            >
              <h3 className="font-bold text-[20px] text-[#111827] mb-4">Acerca del instructor</h3>

              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Avatar */}
                <div className="w-[72px] h-[72px] rounded-full bg-[#1E40AF] text-white font-bold text-[24px] flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
                  {course.instructor?.imagen ? (
                    <img src={course.instructor.imagen} alt={course.instructor.nombre} className="w-full h-full object-cover" />
                  ) : (
                    course.instructor?.nombre?.charAt(0).toUpperCase() || 'I'
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="font-bold text-[18px] text-[#111827]">
                      {course.instructor?.nombre || 'Carlos Méndez Ramírez'}
                    </h4>
                    {(!currentUser || currentUser.id !== course.instructor?.id) && (
                      <button
                        onClick={handleContactarInstructor}
                        className="bg-[#1E40AF] hover:bg-blue-800 text-white px-4 py-1.5 rounded text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm w-fit"
                      >
                        💬 Enviar mensaje
                      </button>
                    )}
                  </div>
                  <p className="font-normal text-[14px] text-[#6B7280]">
                    {!course.instructor || course.instructor.nombre === 'Carlos Méndez Ramírez'
                      ? 'Especialista Principal en Ciberseguridad · Ministerio TIC de Colombia'
                      : 'Instructor calificado en SaberHub'}
                  </p>

                  {/* Métricas */}
                  <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#4B5563] pt-1">
                    <span>
                      ⭐ <strong className="text-[#111827]">4.8</strong> calificación
                    </span>
                    <span>
                      👥 <strong className="text-[#111827]">
                        {!course.instructor || course.instructor.nombre === 'Carlos Méndez Ramírez' ? '15.420' : '1.200+'}
                      </strong> alumnos
                    </span>
                    <span>
                      📚{' '}
                      <strong className="text-[#111827]">
                        {course.instructor?._count?.cursosCreados || 3}
                      </strong>{' '}
                      cursos
                    </span>
                  </div>

                  {/* Biografía */}
                  <p className="font-normal text-[14px] text-[#4B5563] leading-relaxed pt-2">
                    {!course.instructor || course.instructor.nombre === 'Carlos Méndez Ramírez' ? (
                      'Ingeniero de Sistemas con más de 12 años de experiencia en el sector de defensa digital y mitigación de amenazas críticas. Certificado CISSP y CEH, ha liderado las políticas públicas de ciberseguridad nacional y colaborado con equipos de respuesta gubernamentales como el ColCERT.'
                    ) : (
                      'Instructor comprometido con el desarrollo del talento y competencias profesionales, enfocado en diseñar experiencias de aprendizaje dinámicas, estructuradas y orientadas a resultados.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA SIDEBAR FLOTANTE (30% - col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* CARD FLOTANTE DE INSCRIPCIÓN (Posición Sticky en Desktop) */}
            <div className="lg:sticky lg:top-[160px] z-30 space-y-6 bg-white">
              <div className="bg-white border border-[#F3F4F6] rounded overflow-hidden shadow-md border-b-2 border-b-[#1E40AF]">
                {/* Imagen de Portada con Aspect Ratio 16:9 */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  {course.imgPortada ? (
                    <img
                      src={course.imgPortada}
                      alt={course.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-[#1E40AF] text-[48px]">
                      📚
                    </div>
                  )}
                  {/* Play Button Mockup */}
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform shadow-lg cursor-pointer"
                  >
                    <Play size={22} className="text-[#111827] ml-0.5" fill="#111827" />
                  </button>
                </div>

                {/* Contenido de la Card */}
                <div className="p-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-[22px] text-[#1E40AF]">
                      {currentUser?.rol === 'admin'
                        ? 'Vista de Administrador'
                        : currentUser?.rol === 'instructor'
                          ? 'Vista de Instructor'
                          : 'Inscripción gratuita'}
                    </span>
                    <span className="font-normal text-[13px] text-[#6B7280] mt-1">
                      {currentUser?.rol === 'admin' || currentUser?.rol === 'instructor'
                        ? 'Acceso de auditoría de contenidos'
                        : 'Accede a todo el contenido sin costo'}
                    </span>
                  </div>

                  {/* Botón Principal */}
                  {currentUser?.rol === 'admin' || currentUser?.rol === 'instructor' ? (
                    <button
                      onClick={() => setMostrarVisor(true)}
                      className="w-full h-[52px] bg-[#1E40AF] text-white font-bold text-[16px] rounded hover:bg-blue-800 transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Eye size={18} className="stroke-[2.5]" /> Ver contenido del curso
                    </button>
                  ) : yaInscrito ? (
                    <button
                      onClick={() => setMostrarVisor(true)}
                      className="w-full h-[52px] bg-[#10B981] text-white font-bold text-[16px] rounded hover:bg-emerald-600 transition-colors mt-6 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Rocket size={18} className="stroke-[2.5]" /> Continuar Aprendiendo
                    </button>
                  ) : (
                    <button
                      onClick={handleInscripcion}
                      disabled={inscribiendo}
                      className="w-full h-[52px] bg-[#1E40AF] text-white font-bold text-[16px] rounded hover:bg-blue-800 transition-colors mt-6 flex items-center justify-center"
                    >
                      {inscribiendo ? 'Inscribiendo...' : 'Inscribirme gratis'}
                    </button>
                  )}

                  {/* Botón de Inicio de sesión alternativo (solo si no está logueado) */}
                  {!currentUser && (
                    <>
                      <div className="flex items-center my-4">
                        <div className="flex-1 h-px bg-[#E5E7EB]"></div>
                        <span className="text-[12px] text-[#9CA3AF] px-3">o</span>
                        <div className="flex-1 h-px bg-[#E5E7EB]"></div>
                      </div>
                      <button
                        onClick={() => router.push('/login')}
                        className="w-full h-[48px] bg-white border border-[#D1D5DB] text-[#111827] font-semibold text-[15px] rounded hover:bg-gray-50 transition-colors flex items-center justify-center"
                      >
                        Iniciar sesión
                      </button>
                    </>
                  )}

                  {/* Beneficios */}
                  <div className="mt-6 pt-5 border-t border-[#F3F4F6] space-y-3">
                    {[
                      'Acceso completo de por vida',
                      'Certificado verificado al completar',
                      'Soporte directo del instructor',
                      'Recursos adicionales descargables',
                      'Estudio 100% self-paced a tu ritmo',
                    ].map((benefit, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-3">
                        <span className="text-[#10B981] font-bold text-[13px]">✅</span>
                        <span className="font-normal text-[13px] text-[#374151]">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD: Información del curso (Sidebar) */}
              <div className="bg-white border border-[#F3F4F6] rounded p-6 shadow-sm border-b-2 border-b-[#1E40AF]">
                <h3 className="font-bold text-[16px] text-[#111827] mb-4">Información del curso</h3>

                <div className="divide-y divide-[#F3F4F6] text-[13px]">
                  {[
                    { label: 'NIVEL', val: course.nivel || 'Principiante' },
                    { label: 'DURACIÓN', val: duracionTexto },
                    { label: 'MÓDULOS', val: `${course.modulos?.length || 0} módulos` },
                    { label: 'LECCIONES', val: `${totalLecciones} temas` },
                    { label: 'IDIOMA', val: 'Español (Colombia)' },
                    { label: 'MODALIDAD', val: 'Virtual autogestionado' },
                    {
                      label: 'CERTIFICADO',
                      val: course.otorgaCertificado
                        ? 'Sí (Verificado)'
                        : 'Sí, al cumplir criterios',
                    },
                    { label: 'INSTITUCIÓN', val: course.institucion?.nombre || 'SaberHub' },
                    {
                      label: 'ÚLTIMA ACTUALIZACIÓN',
                      val: course.actualizado
                        ? new Date(course.actualizado).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                          })
                        : 'Enero 2026',
                    },
                  ].map((info, iIdx) => (
                    <div key={iIdx} className="flex justify-between items-center py-2.5">
                      <span className="font-semibold text-[#6B7280] tracking-wide uppercase text-[11px]">
                        {info.label}
                      </span>
                      <span className="font-bold text-[#111827] text-right">{info.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD: Comparte este curso */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded p-4 shadow-sm flex flex-col space-y-3">
                <h4 className="font-semibold text-[14px] text-[#1E40AF]">Comparte este curso</h4>

                <div className="flex items-center gap-3">
                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-[#0077B5] hover:scale-105 transition-transform flex items-center justify-center text-white"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>

                  {/* Twitter/X */}
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-[#111827] hover:scale-105 transition-transform flex items-center justify-center text-white"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href="https://api.whatsapp.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-[#25D366] hover:scale-105 transition-transform flex items-center justify-center text-white"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.002-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.688 1.97 14.22 .947 11.998.947c-5.442 0-9.87 4.372-9.874 9.802-.001 1.726.46 3.413 1.332 4.908l-.994 3.633 3.73-.974zm12.383-7.531c-.272-.136-1.61-.794-1.86-.885-.25-.091-.432-.136-.613.136-.182.273-.704.885-.863 1.067-.158.182-.318.204-.59.068-.272-.136-1.15-.424-2.19-1.352-.809-.722-1.356-1.616-1.515-1.888-.159-.272-.017-.419.119-.554.123-.122.272-.318.409-.477.136-.159.182-.272.272-.454.091-.181.045-.34-.022-.477-.068-.136-.613-1.477-.84-2.023-.222-.534-.44-.46-.613-.47-.159-.009-.34-.01-.523-.01-.182 0-.477.068-.727.34-.25.272-.954.932-.954 2.272 0 1.34.977 2.635 1.113 2.817.136.182 1.92 2.931 4.65 4.113.65.28 1.157.446 1.55.572.653.208 1.25.179 1.72.109.525-.078 1.61-.659 1.838-1.296.227-.636.227-1.182.159-1.296-.069-.114-.249-.159-.523-.295z" />
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-[#1877F2] hover:scale-105 transition-transform flex items-center justify-center text-white"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>

                  {/* Botón Copiar Enlace */}
                  <button
                    onClick={handleCopyLink}
                    className="w-10 h-10 rounded-full bg-white border border-[#D1D5DB] text-[#4B5563] hover:scale-105 hover:bg-gray-50 transition-all flex items-center justify-center cursor-pointer relative"
                    title="Copiar enlace"
                  >
                    <Copy size={16} />
                    {copiedLink && (
                      <span className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap shadow font-semibold">
                        ¡Copiado!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 5. SECCIÓN DE RESEÑAS (Margen superior 32px, Ancho completo) */}
      <section
        ref={resenasRef}
        className="bg-white py-10 px-6 lg:px-12 w-full max-w-[1280px] mx-auto border-t border-[#F3F4F6]"
      >
        <div className="bg-white border border-[#F3F4F6] rounded p-6 shadow-sm border-b-2 border-b-[#1E40AF]">
          <h3 className="font-bold text-[20px] text-[#111827] mb-6">
            Lo que dicen los estudiantes
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Rating Grande Centrado */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 border-b lg:border-b-0 lg:border-r border-[#F3F4F6]">
              <span className="font-bold text-[56px] text-[#111827] leading-none">4.8</span>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={20} className="text-[#F59E0B]" fill="#F59E0B" />
                ))}
              </div>
              <span className="font-medium text-[13px] text-[#6B7280]">
                (1.247 reseñas registradas)
              </span>
            </div>

            {/* Listado de Reseñas Grid de 2 Columnas */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: 'Carlos Mario Restrepo',
                  stars: 5,
                  txt: 'Excelente curso, sumamente completo y metodológico. El material y las guías brindan conocimientos sumamente prácticos y aplicables para el entorno profesional real.',
                  avatar: 'CR',
                },
                {
                  name: 'Diana Gomez Tobón',
                  stars: 5,
                  txt: 'La metodología es excelente. Los ejercicios prácticos ayudan de forma asombrosa a asimilar los conceptos clave. Totalmente recomendado para empezar.',
                  avatar: 'DG',
                },
                {
                  name: 'Andrés Felipe Muñoz',
                  stars: 4,
                  txt: 'Un temario bastante robusto y un docente con conocimientos sobresalientes. Recomiendo prestar mucha atención a los conceptos prácticos de los módulos avanzados.',
                  avatar: 'AM',
                },
                {
                  name: 'Camila Torres Prada',
                  stars: 5,
                  txt: 'Me encantó de principio a fin. El certificado de la plataforma SABERHUB le da un valor gigante a mi portafolio y hoja de vida profesional.',
                  avatar: 'CT',
                },
              ].map((resena, rIdx) => (
                <div
                  key={rIdx}
                  className="flex gap-4 items-start bg-slate-50 p-4 rounded shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1E40AF]/10 text-[#1E40AF] font-bold text-[14px] flex items-center justify-center flex-shrink-0">
                    {resena.avatar}
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-[14px] text-[#111827]">{resena.name}</h5>
                    <div className="flex gap-0.5 items-center">
                      {[...Array(resena.stars)].map((_, i) => (
                        <Star key={i} size={12} className="text-[#F59E0B]" fill="#F59E0B" />
                      ))}
                    </div>
                    <p className="font-normal text-[13px] text-[#4B5563] leading-relaxed">
                      &quot;{resena.txt}&quot;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE CURSOS COMPLEMENTARIOS (RF-02) */}
      <CursosComplementarios cursoId={course.id} />

      {/* 6. FOOTER (Idéntico al dashboard) */}
      <footer className="bg-[#111827] text-white py-12 px-6 lg:px-8 mt-auto border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="font-bold text-[16px] leading-tight tracking-wider">SABERHUB</span>
              <span className="font-normal text-[11px] text-[#9CA3AF] leading-tight">
                Learning Platform
              </span>
            </div>
            <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
              Plataforma nacional de educación digital avanzada en tecnologías TI, ciberseguridad e
              innovación corporativa.
            </p>
          </div>
          <div>
            <h5 className="font-bold text-[14px] tracking-wide mb-4 text-[#CBD5E1]">Formaciones</h5>
            <ul className="space-y-2 text-[13px] text-[#9CA3AF]">
              <li>Ciberseguridad Avanzada</li>
              <li>Redes y Telecomunicaciones</li>
              <li>Inteligencia Artificial Aplicada</li>
              <li>Desarrollo de Software</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-[14px] tracking-wide mb-4 text-[#CBD5E1]">Institución</h5>
            <ul className="space-y-2 text-[13px] text-[#9CA3AF]">
              <li>Sobre SABERHUB</li>
              <li>Ministerio TIC Colombia</li>
              <li>Alianzas Estratégicas</li>
              <li>Términos de Servicio</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-[14px] tracking-wide mb-4 text-[#CBD5E1]">
              Soporte y Contacto
            </h5>
            <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
              ¿Tienes dudas o inconvenientes con un curso? Visita nuestro Centro de Ayuda o
              escríbenos directamente.
            </p>
            <button className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[13px] px-4 py-2 rounded mt-4 transition-colors">
              Centro de Soporte 💬
            </button>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto border-t border-slate-800 mt-10 pt-6 text-center text-[12px] text-[#6B7280]">
          © {new Date().getFullYear()} SABERHUB & Ministerio de Tecnologías de la Información y las
          Comunicaciones. Todos los derechos reservados.
        </div>
      </footer>

      {/* 7. MODAL DE VIDEO PREVIEW (MOCKUP INTERACTIVO) */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-[800px] rounded-lg overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 text-white hover:text-[#94A3B8] font-bold text-[18px] z-10 w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center"
            >
              ✕
            </button>
            <div className="aspect-video relative w-full bg-black flex items-center justify-center">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Course Preview Video"
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-slate-950 text-white flex justify-between items-center">
              <div>
                <span className="text-[11px] text-[#94A3B8] font-bold tracking-widest uppercase">
                  Video Introductorio
                </span>
                <h4 className="font-bold text-[15px] text-[#F9FAFB] mt-0.5">{course.titulo}</h4>
              </div>
              <span className="text-[12px] text-[#64748B] font-semibold">Duración: 2:30 min</span>
            </div>
          </div>
        </div>
      )}

      {mostrarVisor && (
        <VisorCurso
          cursoId={course.id}
          onCerrar={() => setMostrarVisor(false)}
          onProgresoActualizado={() => {
            router.refresh();
          }}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE INSCRIPCIÓN */}
      {enrollModal.showConfirm && (
        <div className="fixed inset-0 bg-[#000000]/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center mb-4 flex-shrink-0">
              <BookOpen size={28} />
            </div>
            
            <h3 className="font-bold text-[20px] text-slate-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Confirmar Inscripción
            </h3>
            
            <p className="font-normal text-[14px] text-slate-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas inscribirte en el curso <strong className="text-slate-950">"{course.titulo}"</strong>? Tendrás acceso completo e inmediato a todo el material de estudio de forma gratuita.
            </p>

            {enrollModal.errorMsg && (
              <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-[13px] font-medium mb-4 text-left">
                ⚠️ {enrollModal.errorMsg}
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                type="button"
                disabled={enrollModal.loading}
                onClick={() => setEnrollModal(prev => ({ ...prev, showConfirm: false }))}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-[14px] transition-colors cursor-pointer outline-none disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enrollModal.loading}
                onClick={confirmInscripcion}
                className="flex-1 py-3 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-xl font-semibold text-[14px] transition-colors cursor-pointer outline-none shadow-lg shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enrollModal.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Inscribiendo...</span>
                  </>
                ) : (
                  <span>Sí, inscribirme</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO DE INSCRIPCIÓN */}
      {enrollModal.showSuccess && (
        <div className="fixed inset-0 bg-[#000000]/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 flex-shrink-0 animate-bounce">
              <Check size={28} />
            </div>
            
            <h3 className="font-bold text-[20px] text-slate-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {enrollModal.errorMsg ? 'Ya estás inscrito' : '¡Inscripción Exitosa!'}
            </h3>
            
            <p className="font-normal text-[14px] text-slate-600 mb-6 leading-relaxed">
              {enrollModal.errorMsg 
                ? 'Ya cuentas con acceso a este curso. Te estamos redirigiendo a tu panel de aprendizaje...'
                : `Te has inscrito correctamente en "${course.titulo}". Te estamos redirigiendo a tu panel de aprendizaje...`
              }
            </p>

            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-[14px] transition-colors cursor-pointer outline-none shadow-lg shadow-emerald-500/10 mb-4 flex items-center justify-center gap-2"
            >
              <span>Ir a mi Dashboard</span>
              <ChevronRight size={16} />
            </button>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all ease-linear animate-enroll-progress" />
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes enrollProgress {
              from { width: 0%; }
              to { width: 100%; }
            }
            .animate-enroll-progress {
              animation: enrollProgress 2.5s linear forwards;
            }
          `}} />
        </div>
      )}
    </div>
  );
}
