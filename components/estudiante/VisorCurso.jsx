'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  BarChart3, 
  X, 
  List, 
  Paperclip, 
  Search, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Info, 
  Clock, 
  Maximize2, 
  Accessibility, 
  FileText,
  AlertCircle,
  Menu,
  Film,
  Music,
  Image as ImageIcon,
  BarChart,
  Link2,
  BookOpen as BookOpenIcon,
  Play,
  RotateCw,
  Lock,
  Video
} from 'lucide-react';
import TomarEvaluacion from '@/components/evaluaciones/TomarEvaluacion';
import ForoTab from '@/components/estudiante/ForoTab';
import SesionesClient from '@/components/sesiones/SesionesClient';
import HeartbeatTracker from '@/components/cursos/HeartbeatTracker';
import ComentariosLeccion from '@/components/estudiante/ComentariosLeccion';

// Helper para iconos vectoriales de recursos
const getResourceIcon = (tipo) => {
  switch (tipo) {
    case 'pdf': return <FileText size={18} className="text-[#EF4444] shrink-0" />;
    case 'video': return <Film size={18} className="text-[#3B82F6] shrink-0" />;
    case 'audio': return <Music size={18} className="text-[#10B981] shrink-0" />;
    case 'imagen': return <ImageIcon size={18} className="text-[#EC4899] shrink-0" />;
    case 'presentacion': return <BarChart size={18} className="text-[#F59E0B] shrink-0" />;
    case 'enlace': return <Link2 size={18} className="text-[#6366F1] shrink-0" />;
    default: return <Paperclip size={18} className="text-[#6B7280] shrink-0" />;
  }
};

export default function VisorCurso({ cursoId, initialActiveItemId = null, onCerrar, onProgresoActualizado }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leccionActiva, setLeccionActiva] = useState(null);
  const [marcando, setMarcando] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLockWarning, setShowLockWarning] = useState(false);

  // Estados interactivos premium
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState('esquema'); // 'esquema' | 'recursos'
  const [mainTab, setMainTab] = useState('contenido'); // 'contenido' | 'analiticas'
  const [usuarioSession, setUsuarioSession] = useState(null);

  // Fetch logged in user details for comments author profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const u = await res.json();
          setUsuarioSession(u);
        }
      } catch (err) {
        console.error('Error fetching user session in VisorCurso:', err);
      }
    };
    fetchUser();
  }, []);

  // Escuchar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchProgreso = useCallback(async () => {
    try {
      const res = await fetch(`/api/progreso/curso/${cursoId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDatos(data);
      
      // Seleccionar automáticamente la lección/evaluación inicial o la primera incompleta
      if (!leccionActiva) {
        if (initialActiveItemId) {
          let foundItem = null;
          for (const modulo of data.curso.modulos) {
            const lec = modulo.lecciones.find((l) => l.id === initialActiveItemId);
            if (lec) {
              foundItem = { ...lec, isEvaluacion: false };
              break;
            }
            const ev = (modulo.evaluaciones || []).find((e) => e.id === initialActiveItemId);
            if (ev) {
              foundItem = { ...ev, isEvaluacion: true };
              break;
            }
          }
          if (!foundItem && data.curso.evaluaciones) {
            const ev = data.curso.evaluaciones.find((e) => e.id === initialActiveItemId);
            if (ev) {
              foundItem = { ...ev, isEvaluacion: true, isFinalExam: true };
            }
          }
          if (foundItem) {
            // Verificar si el examen final está bloqueado (lecciones completadas < total lecciones)
            const totalLec = data.curso.modulos.reduce((acc, m) => acc + m.lecciones.length, 0);
            const compl = data.curso.modulos.reduce((acc, m) => acc + m.completadas, 0);
            if (foundItem.isFinalExam && compl < totalLec) {
              setShowLockWarning(true);
              // Fallback a primera incompleta
              for (const modulo of data.curso.modulos) {
                const primera = modulo.lecciones.find((l) => !l.completada) || modulo.lecciones[0];
                if (primera) {
                  setLeccionActiva(primera);
                  break;
                }
              }
              return;
            }

            setLeccionActiva(foundItem);
            return;
          }
        }

        // Fallback a primera incompleta
        for (const modulo of data.curso.modulos) {
          const primera = modulo.lecciones.find((l) => !l.completada) || modulo.lecciones[0];
          if (primera) {
            setLeccionActiva(primera);
            break;
          }
        }
      }
    } catch {
      // silenciar
    } finally {
      setLoading(false);
    }
  }, [cursoId, leccionActiva, initialActiveItemId]);

  useEffect(() => {
    fetchProgreso();
  }, []); // eslint-disable-line

  const handleMarcarCompleta = async () => {
    if (!leccionActiva || leccionActiva.completada) return;
    setMarcando(true);
    try {
      const res = await fetch('/api/progreso/leccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leccionId: leccionActiva.id, cursoId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchProgreso();
        onProgresoActualizado?.();
        if (data.cursoFinalizado) {
          alert('🎓 ¡Felicitaciones! Completaste el 100% del curso.');
        }
      } else {
        alert('Error: ' + data.message);
      }
    } catch {
      alert('Error de red');
    } finally {
      setMarcando(false);
    }
  };

  // Obtener lista plana de todas las lecciones y evaluaciones en orden para la navegación Cisco
  const getPlanoItems = () => {
    if (!datos) return [];
    const items = [];
    datos.curso.modulos.forEach((modulo) => {
      modulo.lecciones.forEach((l) => {
        items.push({ ...l, isEvaluacion: false });
      });
      modulo.evaluaciones?.forEach((ev) => {
        items.push({ ...ev, isEvaluacion: true });
      });
    });
    datos.curso.evaluaciones?.forEach((ev) => {
      items.push({ ...ev, isEvaluacion: true });
    });
    return items;
  };

  const planoItems = getPlanoItems();
  const currentIndex = planoItems.findIndex((item) => item.id === leccionActiva?.id);

  const irAPrevia = () => {
    if (currentIndex > 0) {
      setLeccionActiva(planoItems[currentIndex - 1]);
      if (isMobile) setSidebarOpen(false);
    }
  };

  const irASiguiente = () => {
    if (currentIndex < planoItems.length - 1) {
      setLeccionActiva(planoItems[currentIndex + 1]);
      if (isMobile) setSidebarOpen(false);
    }
  };

  // Obtener todos los recursos del curso para el tab dedicado
  const getTodosLosRecursos = () => {
    if (!datos) return [];
    const recursosList = [];
    datos.curso.modulos.forEach((modulo) => {
      modulo.lecciones.forEach((leccion) => {
        if (leccion.recursos && leccion.recursos.length > 0) {
          leccion.recursos.forEach((r) => {
            recursosList.push({ ...r, leccionTitulo: leccion.titulo });
          });
        }
      });
    });
    return recursosList;
  };

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <RotateCw size={48} className="animate-spin text-[#1E40AF]" />
          <p style={{ color: '#1E40AF', fontSize: '16px', fontWeight: '600' }}>Cargando esquema de curso de SABERHUB...</p>
        </div>
      </div>
    );
  }

  if (!datos) return null;

  const { curso, inscripcion } = datos;
  const totalLecciones = curso.modulos.reduce((acc, m) => acc + m.lecciones.length, 0);
  const completadas = curso.modulos.reduce((acc, m) => acc + m.completadas, 0);
  const todosLosRecursos = getTodosLosRecursos();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2000,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <HeartbeatTracker cursoId={cursoId} />

      {/* ── HEADER SUPERIOR (Alto 64px, fondo blanco, estilo Cisco) ── */}
      <header
        style={{
          height: '64px',
          backgroundColor: '#FFFFFF',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          borderBottom: '1px solid #F3F4F6',
          flexShrink: 0,
        }}
      >
        {/* Izquierda: Logo SABERHUB + Info curso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={onCerrar}>
            <span style={{ fontWeight: '800', fontSize: '13px', color: '#111827', tracking: '0.5px' }}>SABERHUB</span>
            <span style={{ fontSize: '10px', color: '#6B7280', marginTop: '-2px' }}>Learning Platform</span>
          </div>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#E5E7EB', display: isMobile ? 'none' : 'block' }} />

          <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <BookOpen size={15} className="text-[#4B5563]" />
            <span 
              style={{ 
                fontSize: '13px', 
                fontWeight: '500', 
                color: '#4B5563', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}
              title={curso.titulo}
            >
              {curso.titulo}
            </span>
          </div>
        </div>

        {/* Centro: Tabs Contenido / Progreso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
          <button
            onClick={() => setMainTab('contenido')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '100%',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: mainTab === 'contenido' ? '600' : '500',
              color: mainTab === 'contenido' ? '#1E40AF' : '#6B7280',
              position: 'relative',
              padding: '0 4px',
              transition: 'color 0.2s',
            }}
          >
            <BookOpen size={16} />
            <span>Contenido</span>
            {mainTab === 'contenido' && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#1E40AF' }} />
            )}
          </button>

          <button
            onClick={() => setMainTab('analiticas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '100%',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: mainTab === 'analiticas' ? '600' : '500',
              color: mainTab === 'analiticas' ? '#1E40AF' : '#6B7280',
              position: 'relative',
              padding: '0 4px',
              transition: 'color 0.2s',
            }}
          >
            <BarChart3 size={16} />
            <span>Progreso</span>
            {mainTab === 'analiticas' && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#1E40AF' }} />
            )}
          </button>
        </div>

        {/* Derecha: Botón Cerrar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1, gap: '12px' }}>
          {inscripcion?.certificacion && (
            <a
              href={inscripcion.certificacion.urlPdf}
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE68A',
                color: '#92400E',
                fontWeight: '700',
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            >
              🏆 Ver Certificado
            </a>
          )}
          <button
            onClick={onCerrar}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#111827'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}
            aria-label="Cerrar reproductor"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL (Layout sin fondo oscuro, 2 columnas) ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Toggle del Sidebar en responsivo */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: 'absolute',
              bottom: '96px',
              left: '20px',
              zIndex: 1001,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#1E40AF',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Mostrar esquema del curso"
          >
            <Menu size={20} />
          </button>
        )}

        {/* ── COLUMNA IZQUIERDA (Esquema del curso / recursos, ancho 280px, fondo blanco, estilo Cisco) ── */}
        <aside
          style={{
            width: '280px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #F3F4F6',
            flexShrink: 0,
            position: isMobile ? 'absolute' : 'relative',
            top: 0,
            bottom: 0,
            left: isMobile ? (sidebarOpen ? '0' : '-280px') : '0',
            zIndex: 1000,
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isMobile && sidebarOpen ? '4px 0 20px rgba(0, 0, 0, 0.08)' : 'none',
          }}
        >
          {/* Tabs del Sidebar: Esquema / Recursos */}
          <div
            style={{
              height: '48px',
              display: 'flex',
              borderBottom: '1px solid #F3F4F6',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setSidebarTab('esquema')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: sidebarTab === 'esquema' ? '600' : '500',
                color: sidebarTab === 'esquema' ? '#1E40AF' : '#6B7280',
                position: 'relative',
                transition: 'color 0.2s',
              }}
            >
              <List size={14} />
              <span>Esquema</span>
              {sidebarTab === 'esquema' && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', backgroundColor: '#1E40AF' }} />
              )}
            </button>

            <button
              onClick={() => setSidebarTab('recursos')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: sidebarTab === 'recursos' ? '600' : '500',
                color: sidebarTab === 'recursos' ? '#1E40AF' : '#6B7280',
                position: 'relative',
                transition: 'color 0.2s',
              }}
            >
              <Paperclip size={14} />
              <span>Recursos</span>
              {sidebarTab === 'recursos' && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', backgroundColor: '#1E40AF' }} />
              )}
            </button>
          </div>

          {/* Buscador dentro del outline */}
          {sidebarTab === 'esquema' && (
            <div style={{ padding: '12px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  height: '36px',
                  padding: '0 12px',
                  gap: '8px',
                }}
              >
                <Search size={14} className="text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Buscar en el esquema..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
                    color: '#111827',
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Listado del Sidebar */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sidebarTab === 'esquema' ? (
              // VISTA 1: ESQUEMA DEL CURSO (Cisco Style)
              curso.modulos.map((modulo, mi) => {
                const leccionesFiltradas = modulo.lecciones.filter((l) =>
                  l.titulo.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const evaluacionesFiltradas = (modulo.evaluaciones || []).filter((e) =>
                  e.titulo.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (searchQuery && leccionesFiltradas.length === 0 && evaluacionesFiltradas.length === 0) {
                  return null;
                }

                // ¿Tiene alguna lección activa en este módulo?
                const isModuloActivo = 
                  leccionActiva && (
                    leccionesFiltradas.some(l => l.id === leccionActiva.id) ||
                    evaluacionesFiltradas.some(e => e.id === leccionActiva.id)
                  );

                return (
                  <div key={modulo.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {/* Header de módulo */}
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: isModuloActivo ? '#EFF6FF' : '#F9FAFB',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        borderBottom: '1px solid #F3F4F6',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: isModuloActivo ? '#1E40AF' : '#6B7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Módulo {mi + 1}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: isModuloActivo ? '#1E40AF' : '#374151',
                          }}
                        >
                          {modulo.titulo}
                        </span>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {modulo.progresoModulo === 100 && (
                            <Check size={14} className="text-[#1E40AF]" />
                          )}
                          <span style={{ fontSize: '11px', color: isModuloActivo ? '#1E40AF' : '#6B7280', fontWeight: '500' }}>
                            {modulo.completadas}/{modulo.total}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Listado de Lecciones */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {leccionesFiltradas.map((leccion, li) => {
                        const isActive = leccionActiva?.id === leccion.id;
                        return (
                          <button
                            key={leccion.id}
                            onClick={() => {
                              setLeccionActiva(leccion);
                              if (isMobile) setSidebarOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '12px 16px',
                              backgroundColor: isActive ? '#EFF6FF' : '#FFFFFF',
                              border: 'none',
                              borderLeft: isActive ? '3px solid #1E40AF' : '3px solid transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'between',
                              gap: '8px',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                              {isActive ? (
                                <ChevronRight size={14} className="text-[#1E40AF] shrink-0" />
                              ) : (
                                <div style={{ width: '14px' }} />
                              )}
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: isActive ? '600' : '500',
                                  color: isActive ? '#1E40AF' : '#374151',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {li + 1}. {leccion.titulo}
                              </span>
                            </div>

                            {leccion.completada && (
                              <Check size={14} className="text-[#10B981] shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {/* Evaluaciones de Módulo */}
                      {evaluacionesFiltradas.map((ev) => {
                        const isActive = leccionActiva?.id === ev.id;
                        return (
                          <button
                            key={`ev-${ev.id}`}
                            onClick={() => {
                              setLeccionActiva({ ...ev, isEvaluacion: true });
                              if (isMobile) setSidebarOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '12px 16px',
                              backgroundColor: isActive ? '#EFF6FF' : '#FFFFFF',
                              border: 'none',
                              borderLeft: isActive ? '3px solid #1E40AF' : '3px solid transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'between',
                              gap: '8px',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                              {isActive ? (
                                <ChevronRight size={14} className="text-[#1E40AF] shrink-0" />
                              ) : (
                                <div style={{ width: '14px' }} />
                              )}
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: isActive ? '600' : '500',
                                  color: isActive ? '#1E40AF' : '#4B5563',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontStyle: 'italic',
                                }}
                              >
                                Examen: {ev.titulo}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              // VISTA 2: LISTADO DE RECURSOS DEL CURSO (Cisco Style)
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', margin: '0 0 4px 0' }}>
                  Recursos descargables ({todosLosRecursos.length})
                </p>
                {todosLosRecursos.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
                    No hay recursos en este curso.
                  </p>
                ) : (
                  todosLosRecursos.map((rec) => (
                    <a
                      key={rec.id}
                      href={rec.urlDocumento}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                    >
                      {getResourceIcon(rec.tipo)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rec.titulo}
                        </p>
                        <p style={{ margin: '1px 0 0 0', fontSize: '10px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Clase: {rec.leccionTitulo}
                        </p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            )}
            
            {/* Exámenes globales de certificación del curso */}
            {sidebarTab === 'esquema' && curso.evaluaciones?.length > 0 && (
              <div style={{ borderBottom: '1px solid #F3F4F6', marginTop: '10px' }}>
                <div style={{ padding: '12px 16px', backgroundColor: '#FEF3C7', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#D97706', textTransform: 'uppercase' }}>
                    Evaluación Final del Curso
                  </span>
                </div>
                {curso.evaluaciones.map((ev) => {
                  const isActive = leccionActiva?.id === ev.id;
                  const isLocked = completadas < totalLecciones;
                  return (
                    <button
                      key={`curso-ev-${ev.id}`}
                      onClick={() => {
                        if (isLocked) {
                          setShowLockWarning(true);
                          return;
                        }
                        setLeccionActiva({ ...ev, isEvaluacion: true });
                        if (isMobile) setSidebarOpen(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        backgroundColor: isActive ? '#EFF6FF' : '#FFFFFF',
                        border: 'none',
                        borderLeft: isActive ? '3px solid #1E40AF' : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: isLocked ? 0.6 : 1,
                      }}
                    >
                      {isLocked ? (
                        <Lock size={14} className="text-gray-400 shrink-0" />
                      ) : isActive ? (
                        <ChevronRight size={14} className="text-[#1E40AF] shrink-0" />
                      ) : (
                        <div style={{ width: '14px' }} />
                      )}
                      <span style={{ fontSize: '13px', fontWeight: '600', color: isActive ? '#1E40AF' : isLocked ? '#9CA3AF' : '#374151' }}>
                        {ev.titulo}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Opciones de Interacción */}
            {sidebarTab === 'esquema' && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ padding: '12px 16px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
                    Interacción
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setLeccionActiva({ id: 'foro-tab', isForo: true, titulo: 'Foro del Curso' });
                    if (isMobile) setSidebarOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    backgroundColor: leccionActiva?.isForo ? '#EFF6FF' : '#FFFFFF',
                    border: 'none',
                    borderLeft: leccionActiva?.isForo ? '3px solid #1E40AF' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ width: '14px', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px' }}>💬</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: leccionActiva?.isForo ? '600' : '500', color: leccionActiva?.isForo ? '#1E40AF' : '#374151' }}>
                    Foro de Discusión
                  </span>
                </button>

                <button
                  onClick={() => {
                    setLeccionActiva({ id: 'sesiones-tab', isSesiones: true, titulo: 'Clases en Vivo' });
                    if (isMobile) setSidebarOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    backgroundColor: leccionActiva?.isSesiones ? '#EFF6FF' : '#FFFFFF',
                    border: 'none',
                    borderLeft: leccionActiva?.isSesiones ? '3px solid #1E40AF' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ width: '14px', display: 'flex', justifyContent: 'center' }}>
                    <Video size={14} className={leccionActiva?.isSesiones ? 'text-[#1E40AF]' : 'text-[#6B7280]'} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: leccionActiva?.isSesiones ? '600' : '500', color: leccionActiva?.isSesiones ? '#1E40AF' : '#374151' }}>
                    Clases en vivo
                  </span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── COLUMNA DERECHA — PANEL PRINCIPAL (Fondo blanco, diseño impecable estilo Cisco) ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Tabs y barra superior interna de la lección (Cisco outline style) */}
          <div
            style={{
              height: '48px',
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #F3F4F6',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', height: '100%' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#1E40AF',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  padding: '0 4px',
                }}
              >
                Contenido de la Lección
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', backgroundColor: '#1E40AF' }} />
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#6B7280' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#F3F4F6', padding: '3px 8px', borderRadius: '4px', color: '#374151' }}>
                ES
              </span>
              <Accessibility size={16} style={{ cursor: 'pointer' }} title="Accesibilidad" />
              <Maximize2 size={16} style={{ cursor: 'pointer' }} title="Pantalla completa" />
            </div>
          </div>

          {/* Contenedor con Scroll para el contenido o el panel secundario */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            
            {mainTab === 'contenido' ? (
              // TAB CENTRAL 1: CONTENIDO DE LA CLASE
              !leccionActiva ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', flex: 1 }}>
                  <BookOpenIcon size={48} className="text-[#1E40AF] opacity-50 mb-4" />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>Comienza a aprender</h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '400px', margin: 0 }}>
                    Selecciona un módulo o lección del esquema de la barra lateral izquierda para cargar tu material de estudio.
                  </p>
                </div>
              ) : leccionActiva.isEvaluacion ? (
                // Evaluaciones en contenedor limpio de alto contraste
                <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: isMobile ? '24px 16px' : '40px' }}>
                  <TomarEvaluacion
                    evaluacionId={leccionActiva.id}
                    onFinalizado={() => {
                      fetchProgreso();
                      setLeccionActiva(null);
                    }}
                  />
                </div>
              ) : leccionActiva.isForo ? (
                <div style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                  <ForoTab cursoId={cursoId} />
                </div>
              ) : leccionActiva.isSesiones ? (
                <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px' }}>
                  <SesionesClient course={datos.curso} currentUser={{ id: 'visor-user', rol: datos.usuarioRole }} isEmbed={true} />
                </div>
              ) : (
                // Detalle estándar de Lección
                <div style={{ padding: isMobile ? '32px 16px 80px 16px' : '48px 48px 96px 48px', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
                  
                  {/* Encabezado Cisco style */}
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Lección Interactiva
                    </span>
                    <h1 style={{ fontSize: isMobile ? '26px' : '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', lineHeight: '1.2' }}>
                      {leccionActiva.titulo}
                    </h1>
                    <p style={{ fontSize: '18px', fontWeight: '400', color: '#6B7280', margin: '0 0 12px 0' }}>
                      {curso.titulo}
                    </p>
                    {leccionActiva.duracion && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280', backgroundColor: '#F3F4F6', padding: '4px 12px', borderRadius: '100px' }}>
                        <Clock size={13} className="text-[#1E40AF]" />
                        <span>Duración estimada: {leccionActiva.duracion} minutos</span>
                      </div>
                    )}
                  </div>

                  {/* Video Player */}
                  {leccionActiva.urlVideo && (
                    <div style={{ marginBottom: '36px' }}>
                      <div
                        style={{
                          borderRadius: '6px',
                          overflow: 'hidden',
                          backgroundColor: '#000000',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                          aspectRatio: '16/9',
                          width: '100%',
                        }}
                      >
                        {(() => {
                          const url = leccionActiva.urlVideo;
                          const ytRegex =
                            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
                          const ytMatch = url.match(ytRegex);
                          if (ytMatch && ytMatch[1]) {
                            return (
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`}
                                title={`Video: ${leccionActiva.titulo}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ display: 'block', width: '100%', height: '100%' }}
                              ></iframe>
                            );
                          }
                          const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
                          const vimeoMatch = url.match(vimeoRegex);
                          if (vimeoMatch && vimeoMatch[1]) {
                            return (
                              <iframe
                                src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                                width="100%"
                                height="100%"
                                title={`Video: ${leccionActiva.titulo}`}
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                style={{ display: 'block', width: '100%', height: '100%' }}
                              ></iframe>
                            );
                          }
                          return (
                            <video
                              controls
                              controlsList="nodownload"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              aria-label={`Video: ${leccionActiva.titulo}`}
                              src={url}
                            >
                              Tu navegador no soporta el elemento de video.
                            </video>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Card de Información / Contenido de Texto */}
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      padding: isMobile ? '20px' : '28px',
                      borderBottom: '2px solid #1E40AF',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                      marginBottom: '36px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Info size={16} className="text-[#1E40AF]" />
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Detalles e Instrucciones
                      </h3>
                    </div>

                    <div 
                      style={{ 
                        fontSize: '14px', 
                        lineHeight: '1.8', 
                        color: '#4B5563', 
                        whiteSpace: 'pre-line' 
                      }}
                    >
                      {leccionActiva.contenidoTexto || 'No hay descripción adicional provista para esta lección.'}
                    </div>
                  </div>

                  {/* Recursos de la lección activa */}
                  {leccionActiva.recursos?.length > 0 && (
                    <div style={{ marginBottom: '36px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#374151', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Archivos complementarios de la clase
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                        {leccionActiva.recursos.map((r) => (
                          <a
                            key={r.id}
                            href={r.urlDocumento}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '14px',
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E5E7EB',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              transition: 'box-shadow 0.2s, border-color 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1E40AF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                          >
                            {getResourceIcon(r.tipo)}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: '600', fontSize: '13px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.titulo}
                              </p>
                              {r.descripcion && (
                                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {r.descripcion}
                                </p>
                              )}
                            </div>
                            <ChevronRight size={14} className="text-[#9CA3AF] shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón principal centrado */}
                  {!leccionActiva.completada && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                      <button
                        onClick={handleMarcarCompleta}
                        disabled={marcando}
                        style={{
                          height: '56px',
                          padding: '0 40px',
                          backgroundColor: marcando ? '#6B7280' : '#1E40AF',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: '700',
                          fontSize: '15px',
                          cursor: marcando ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          boxShadow: '0 4px 14px rgba(30, 64, 175, 0.25)',
                          transition: 'background-color 0.2s, transform 0.1s',
                        }}
                        onMouseEnter={(e) => { if (!marcando) e.currentTarget.style.backgroundColor = '#1A368F'; }}
                        onMouseLeave={(e) => { if (!marcando) e.currentTarget.style.backgroundColor = '#1E40AF'; }}
                        onMouseDown={(e) => { if (!marcando) e.currentTarget.style.transform = 'scale(0.98)'; }}
                        onMouseUp={(e) => { if (!marcando) e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        {marcando ? (
                          <>
                            <RotateCw size={16} className="animate-spin" />
                            <span>Guardando progreso...</span>
                          </>
                        ) : (
                          <>
                            <Check size={18} />
                            <span>Marcar lección como completada</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Comentarios en contexto de la lección */}
                  <ComentariosLeccion leccionId={leccionActiva.id} currentUser={usuarioSession} />
                </div>
              )
            ) : (
              // TAB CENTRAL 2: ESTADÍSTICAS Y PROGRESO (Cisco Style Analytics)
              <div style={{ padding: isMobile ? '32px 16px' : '48px', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Tu Progreso de Aprendizaje</h1>
                <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '32px' }}>
                  Monitorea tu avance general y las lecciones completadas en el curso de {curso.titulo}.
                </p>

                {inscripcion?.certificacion && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', 
                    border: '1px solid #FCD34D', 
                    borderRadius: '8px', 
                    padding: '24px', 
                    marginBottom: '32px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    gap: '16px', 
                    flexWrap: 'wrap', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
                  }}>
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <h3 style={{ margin: 0, color: '#92400E', fontSize: '18px', fontWeight: '800' }}>🎉 ¡Felicitaciones, has completado el curso!</h3>
                      <p style={{ margin: '4px 0 0 0', color: '#B45309', fontSize: '14px', fontWeight: '500', lineHeight: '1.4' }}>
                        Tu certificado de finalización ha sido generado con éxito con el código único: <strong style={{ color: '#78350F' }}>{inscripcion.certificacion.codigoUnico}</strong>.
                      </p>
                    </div>
                    <a 
                      href={inscripcion.certificacion.urlPdf} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        backgroundColor: '#1E40AF', 
                        color: '#FFFFFF', 
                        fontWeight: '700', 
                        fontSize: '14px', 
                        padding: '12px 24px', 
                        borderRadius: '6px', 
                        textDecoration: 'none', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        boxShadow: '0 4px 6px -1px rgba(30, 64, 175, 0.2)', 
                        transition: 'background-color 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1A368F'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E40AF'}
                    >
                      🏆 Descargar Certificado
                    </a>
                  </div>
                )}

                {/* Métricas clave */}
                <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', display: 'grid', gap: '20px', marginBottom: '36px' }}>
                  <div style={{ padding: '20px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', borderBottom: '2px solid #1E40AF' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Progreso General</span>
                    <p style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: '800', color: '#1E40AF' }}>
                      {inscripcion.progreso}%
                    </p>
                  </div>
                  
                  <div style={{ padding: '20px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', borderBottom: '2px solid #10B981' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Lecciones Completadas</span>
                    <p style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: '800', color: '#10B981' }}>
                      {completadas} / {totalLecciones}
                    </p>
                  </div>

                  <div style={{ padding: '20px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px', borderBottom: '2px solid #6366F1' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Módulos del Curso</span>
                    <p style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: '800', color: '#6366F1' }}>
                      {curso.modulos.length}
                    </p>
                  </div>
                </div>

                {/* Lista de progreso detallado por módulo */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>Desglose por Módulo</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid #E5E7EB' }}>
                    {curso.modulos.map((modulo, index) => (
                      <div key={modulo.id} style={{ padding: '16px', borderBottom: index < curso.modulos.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            Módulo {index + 1}: {modulo.titulo}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E40AF' }}>
                            {modulo.progresoModulo}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${modulo.progresoModulo}%`,
                              backgroundColor: modulo.progresoModulo === 100 ? '#10B981' : '#1E40AF',
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER STICKY DE NAVEGACIÓN (Fondo blanco, borde superior, estilo Cisco) ── */}
          {mainTab === 'contenido' && leccionActiva && !leccionActiva.isForo && !leccionActiva.isSesiones && (
            <footer
              style={{
                height: '64px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #F3F4F6',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                boxShadow: '0 -2px 10px rgba(0,0,0,0.02)',
              }}
            >
              {/* Lección anterior */}
              <button
                onClick={irAPrevia}
                disabled={currentIndex <= 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  background: 'none',
                  cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
                  color: currentIndex <= 0 ? '#9CA3AF' : '#6B7280',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                <ChevronLeft size={16} />
                <span>Lección anterior</span>
              </button>

              {/* Botón rápido de completado en el centro */}
              {!leccionActiva.completada && !leccionActiva.isEvaluacion && (
                <button
                  onClick={handleMarcarCompleta}
                  disabled={marcando}
                  style={{
                    height: '38px',
                    padding: '0 20px',
                    backgroundColor: '#1E40AF',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Check size={14} />
                  <span>{marcando ? 'Guardando...' : 'Completar clase'}</span>
                </button>
              )}

              {/* Lección siguiente */}
              <button
                onClick={irASiguiente}
                disabled={currentIndex >= planoItems.length - 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  background: 'none',
                  cursor: currentIndex >= planoItems.length - 1 ? 'not-allowed' : 'pointer',
                  color: currentIndex >= planoItems.length - 1 ? '#9CA3AF' : '#1E40AF',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                <span>Lección siguiente</span>
                <ChevronRight size={16} />
              </button>
            </footer>
          )}

          {/* Flecha de navegación flotante derecha */}
          {mainTab === 'contenido' && leccionActiva && !leccionActiva.isForo && !leccionActiva.isSesiones && currentIndex < planoItems.length - 1 && (
            <div
              onClick={irASiguiente}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '72px',
                backgroundColor: '#1E40AF',
                borderTopLeftRadius: '6px',
                borderBottomLeftRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
                boxShadow: '-2px 4px 12px rgba(0,0,0,0.1)',
                transition: 'background-color 0.2s',
                zIndex: 1000,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1A368F'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E40AF'; }}
              title="Siguiente clase"
            >
              <ChevronRight size={24} />
            </div>
          )}

        </div>
      </div>

      {/* MODAL DE ADVERTENCIA DE EXAMEN BLOQUEADO */}
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
