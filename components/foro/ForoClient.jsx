'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Pin,
  Check,
  Search,
  Plus,
  ChevronDown,
  ThumbsUp,
  Share2,
  ArrowLeft,
  Trash2,
  Lock,
  MoreVertical,
  Clock,
  User,
  ExternalLink,
  Bold,
  Italic,
  Code,
  List,
  AlertCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';

export default function ForoClient({ course, currentUser }) {
  const router = useRouter();

  // Core States
  const [hilos, setHilos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Category / Navigation
  const [activeCategory, setActiveCategory] = useState('Todas las discusiones');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recientes'); // 'recientes' | 'populares'
  const [filterStatus, setFilterStatus] = useState('Todos'); // 'Todos' | 'Resueltos' | 'Fijados'
  const [soloSinRespuesta, setSoloSinRespuesta] = useState(false);

  // Thread Creation Form
  const [mostrarCrearHilo, setMostrarCrearHilo] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [crearCategoria, setCrearCategoria] = useState('Preguntas sobre el curso');
  const [creandoHilo, setCreandoHilo] = useState(false);

  // Active Opened Thread Details
  const [hiloActivoId, setHiloActivoId] = useState(null);

  // Replies states
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [replyToId, setReplyToId] = useState(null); // ID of comment we are replying to
  const [citaMsg, setCitaMsg] = useState(null); // Quoted message object
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 10 Mock Threads for high fidelity initial demo + fallback when db empty
  const mockThreads = useMemo(() => [], []);

  // Fetch Forum Data from database
  const loadForumData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/cursos/${course.id}/foro`);
      if (res.ok) {
        const data = await res.json();
        
        // Match existing hilos and enrich them with categories/views dynamically for high fidelity UI
        const dbHilos = data.hilos || [];
        const enriched = dbHilos.map((h) => {
          return {
            ...h,
            categoria: h.categoria || 'Preguntas sobre el curso',
            vistas: h.vistas || 0,
            resuelto: h.resuelto || h.bloqueado || false
          };
        });
        
        setHilos(enriched);
      } else {
        setHilos([]);
      }
    } catch (err) {
      console.error(err);
      setHilos([]);
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    loadForumData();
  }, [loadForumData]);

  // Handle Like/Reaction
  const handleLike = async (msgId) => {
    try {
      const res = await fetch(`/api/cursos/${course.id}/foro/${msgId}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        
        const updateLikes = (list) => {
          return list.map((item) => {
            if (item.id === msgId) {
              return {
                ...item,
                usuarioReacciono: data.liked,
                reaccionesCount: data.count,
              };
            }
            if (item.respuestas) {
              return {
                ...item,
                respuestas: updateLikes(item.respuestas),
              };
            }
            return item;
          });
        };

        setHilos((prev) => updateLikes(prev));
        showToast(data.liked ? '¡Me gusta añadido!' : 'Me gusta removido');
      }
    } catch (error) {
      console.error('Error al reaccionar:', error);
    }
  };

  // Handle Moderation
  const handleMod = async (msgId, field, value) => {
    try {
      const res = await fetch(`/api/cursos/${course.id}/foro/${msgId}/mod`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setHilos((prev) =>
          prev.map((item) => {
            if (item.id === msgId) {
              return { ...item, [field]: value };
            }
            return item;
          })
        );
        showToast(value ? `Hilo marcado como ${field}` : `Hilo desmarcado como ${field}`);
      }
    } catch (error) {
      console.error('Error al moderar:', error);
    }
  };

  // Handle Create Hilo
  const handleCrearHilo = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) {
      showToast('Por favor, completa el título y contenido', 'error');
      return;
    }
    setCreandoHilo(true);
    try {
      const res = await fetch(`/api/cursos/${course.id}/foro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: nuevoTitulo,
          contenido: nuevoContenido,
          categoria: crearCategoria,
        }),
      });
      if (res.ok) {
        const newHilo = await res.json();
        
        // Enrich locally with category and metadata
        const enrichedNew = {
          ...newHilo,
          categoria: crearCategoria,
          vistas: 0,
          resuelto: false,
          respuestas: []
        };
        
        setHilos((prev) => [enrichedNew, ...prev]);
        setNuevoTitulo('');
        setNuevoContenido('');
        setMostrarCrearHilo(false);
        showToast('¡Nuevo hilo publicado con éxito!');
      } else {
        // Fallback simulate local save on offline/database issues
        const localMock = {
          id: `local-${Date.now()}`,
          titulo: nuevoTitulo,
          contenido: nuevoContenido,
          fijado: false,
          bloqueado: false,
          creado: new Date().toISOString(),
          actualizado: new Date().toISOString(),
          categoria: crearCategoria,
          vistas: 0,
          resuelto: false,
          reaccionesCount: 0,
          usuarioReacciono: false,
          usuario: {
            id: currentUser?.id || 'me',
            nombre: currentUser?.nombre || 'Jhonatan',
            imagen: currentUser?.imagen || null,
            rol: currentUser?.rol || 'alumno'
          },
          respuestas: []
        };
        setHilos((prev) => [localMock, ...prev]);
        setNuevoTitulo('');
        setNuevoContenido('');
        setMostrarCrearHilo(false);
        showToast('Publicado localmente (Modo Demo)');
      }
    } catch (error) {
      console.error('Error al crear hilo:', error);
    } finally {
      setCreandoHilo(false);
    }
  };

  // Handle Create Reply
  const handleEnviarRespuesta = async (e) => {
    e.preventDefault();
    if (!respuestaTexto.trim()) return;
    setEnviandoRespuesta(true);
    try {
      const res = await fetch(`/api/cursos/${course.id}/foro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenido: respuestaTexto,
          padreId: replyToId,
          citaId: citaMsg?.id,
        }),
      });
      
      const userObj = {
        id: currentUser?.id || 'me',
        nombre: currentUser?.nombre || 'Jhonatan',
        rol: currentUser?.rol || 'alumno',
        imagen: currentUser?.imagen || null
      };

      if (res.ok) {
        const newReply = await res.json();
        
        const insertReply = (list) => {
          return list.map((item) => {
            if (item.id === newReply.padreId) {
              return {
                ...item,
                respuestas: [...(item.respuestas || []), { ...newReply, respuestas: [] }],
              };
            }
            if (item.respuestas) {
              return {
                ...item,
                respuestas: insertReply(item.respuestas),
              };
            }
            return item;
          });
        };
        setHilos((prev) => insertReply(prev));
        setRespuestaTexto('');
        setCitaMsg(null);
        setReplyToId(null);
        showToast('Respuesta publicada con éxito');
      } else {
        // Fallback simulate local save on offline/database issues
        const mockNewReply = {
          id: `local-rep-${Date.now()}`,
          padreId: replyToId,
          contenido: respuestaTexto,
          creado: new Date().toISOString(),
          usuario: userObj,
          reaccionesCount: 0,
          usuarioReacciono: false,
          cita: citaMsg ? {
            id: citaMsg.id,
            contenido: citaMsg.contenido,
            usuarioNombre: citaMsg.usuario.nombre
          } : null,
          respuestas: []
        };
        
        const insertReply = (list) => {
          return list.map((item) => {
            if (item.id === replyToId) {
              return {
                ...item,
                respuestas: [...(item.respuestas || []), mockNewReply],
              };
            }
            if (item.respuestas) {
              return {
                ...item,
                respuestas: insertReply(item.respuestas),
              };
            }
            return item;
          });
        };
        setHilos((prev) => insertReply(prev));
        setRespuestaTexto('');
        setCitaMsg(null);
        setReplyToId(null);
        showToast('Respuesta agregada (Modo Demo)');
      }
    } catch (error) {
      console.error('Error al responder:', error);
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  // Helper properties
  const isModerator = currentUser?.rol === 'admin' || currentUser?.rol === 'instructor';

  // Statistics calculation
  const totalHilosCount = hilos.length;
  const totalRespuestasCount = hilos.reduce(
    (sum, h) => sum + (h.respuestas?.reduce((s, r) => s + 1 + (r.respuestas?.length || 0), 0) || 0),
    0
  );
  
  const uniqueParticipants = useMemo(() => {
    const ids = new Set();
    hilos.forEach((h) => {
      if (h.usuario?.id) ids.add(h.usuario.id);
      h.respuestas?.forEach((r) => {
        if (r.usuario?.id) ids.add(r.usuario.id);
        r.respuestas?.forEach((sr) => {
          if (sr.usuario?.id) ids.add(sr.usuario.id);
        });
      });
    });
    return Math.max(ids.size, 1);
  }, [hilos]);

  // Sidebar Category Item click handler
  const selectCategory = (cat) => {
    setActiveCategory(cat);
    setHiloActivoId(null);
  };

  // Filter & Search computation
  const filteredHilos = useMemo(() => {
    return hilos
      .filter((h) => {
        // Category filtering
        if (activeCategory !== 'Todas las discusiones' && h.categoria !== activeCategory) {
          return false;
        }
        
        // Search filtering
        if (searchQuery.trim() !== '') {
          const s = searchQuery.toLowerCase();
          const matchTitle = h.titulo?.toLowerCase().includes(s);
          const matchContent = h.contenido?.toLowerCase().includes(s);
          const matchAuthor = h.usuario?.nombre?.toLowerCase().includes(s);
          if (!matchTitle && !matchContent && !matchAuthor) return false;
        }

        // Status filter
        if (filterStatus === 'Resueltos' && !h.resuelto) return false;
        if (filterStatus === 'Fijados' && !h.fijado) return false;

        // Solo sin respuesta filter
        if (soloSinRespuesta && h.respuestas && h.respuestas.length > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recientes') {
          return new Date(b.creado) - new Date(a.creado);
        }
        if (sortBy === 'populares') {
          return (b.reaccionesCount || 0) + (b.respuestas?.length || 0) * 2 - ((a.reaccionesCount || 0) + (a.respuestas?.length || 0) * 2);
        }
        return 0;
      });
  }, [hilos, activeCategory, searchQuery, sortBy, filterStatus, soloSinRespuesta]);

  // Active Open Thread
  const activeThread = hilos.find((h) => h.id === hiloActivoId);

  // Textarea rich insert tool
  const insertFormatting = (tag) => {
    const textareas = document.getElementById('resp-textarea');
    if (!textareas) return;
    const start = textareas.selectionStart;
    const end = textareas.selectionEnd;
    const text = textareas.value;
    const selected = text.substring(start, end);
    let replacement = '';
    
    if (tag === 'bold') replacement = `**${selected || 'texto'}**`;
    else if (tag === 'italic') replacement = `*${selected || 'texto'}*`;
    else if (tag === 'code') replacement = `\`${selected || 'código'}\``;
    else if (tag === 'list') replacement = `\n- ${selected || 'elemento'}`;
    else if (tag === 'link') replacement = `[${selected || 'enlace'}](url)`;

    setRespuestaTexto(text.substring(0, start) + replacement + text.substring(end));
    textareas.focus();
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 border rounded-lg px-4 py-3 shadow-md transform transition-all duration-300 ${
          toast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle size={18} />
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}

      {/* HEADER SUPERIOR (Cisco Style, matching Dashboard) */}
      <HeaderAdmin usuario={currentUser} />

      {/* Breadcrumb & Top Bar */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-8 pt-6 w-full flex flex-col flex-1 pb-16">
        
        {/* Breadcrumb */}
        <nav className="mb-4 flex-shrink-0" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li>
              <Link href="/dashboard" className="text-[#6B7280] hover:text-[#1E40AF] font-medium transition-colors">
                Mis cursos
              </Link>
            </li>
            <li className="text-[#D1D5DB]">›</li>
            <li>
              <Link href={`/cursos/${course.id}`} className="text-[#6B7280] hover:text-[#1E40AF] font-medium transition-colors">
                {course.titulo}
              </Link>
            </li>
            <li className="text-[#D1D5DB]">›</li>
            <li className="text-[#111827] font-semibold">Foro</li>
          </ol>
        </nav>

        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 text-[#1E40AF] rounded-lg flex items-center justify-center text-[22px] flex-shrink-0">
              💬
            </div>
            <div>
              <h1 className="font-bold text-[26px] text-[#111827] leading-tight">Foro de discusión</h1>
              <p className="text-[14px] text-[#6B7280] font-normal mt-0.5">{course.titulo}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setMostrarCrearHilo(!mostrarCrearHilo);
              setHiloActivoId(null);
            }}
            className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-5 py-2.5 rounded-[4px] text-[14px] font-semibold transition-colors flex-shrink-0"
          >
            <Plus size={16} />
            <span>Nuevo hilo</span>
          </button>
        </div>

        {/* ── SECCIÓN FORMULARIO NUEVO HILO ── */}
        {mostrarCrearHilo && (
          <div className="mb-8 border border-gray-100 rounded-lg p-6 bg-[#F9FAFB] shadow-sm max-w-4xl">
            <h2 className="font-bold text-[18px] text-[#111827] mb-4 flex items-center gap-2">
              <span>➕</span> Iniciar una nueva discusión
            </h2>
            <form onSubmit={handleCrearHilo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hilo-titulo" className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                    Título de la discusión *
                  </label>
                  <input
                    id="hilo-titulo"
                    type="text"
                    required
                    placeholder="Escribe un título claro y conciso..."
                    value={nuevoTitulo}
                    onChange={(e) => setNuevoTitulo(e.target.value)}
                    className="w-full h-11 border border-[#D1D5DB] rounded-[4px] px-4 text-[14px] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] bg-white text-[#111827]"
                  />
                </div>
                <div>
                  <label htmlFor="hilo-categoria" className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                    Categoría *
                  </label>
                  <div className="relative">
                    <select
                      id="hilo-categoria"
                      value={crearCategoria}
                      onChange={(e) => setCrearCategoria(e.target.value)}
                      className="w-full h-11 border border-[#D1D5DB] rounded-[4px] pl-4 pr-10 text-[14px] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] bg-white appearance-none text-[#111827]"
                    >
                      <option>Preguntas sobre el curso</option>
                      <option>Recursos y materiales</option>
                      <option>Proyectos de alumnos</option>
                      <option>Ayuda técnica</option>
                      {isModerator && <option>Anuncios del instructor</option>}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="hilo-contenido" className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                  Mensaje *
                </label>
                <textarea
                  id="hilo-contenido"
                  required
                  rows={5}
                  placeholder="Escribe los detalles de tu pregunta o aporte..."
                  value={nuevoContenido}
                  onChange={(e) => setNuevoContenido(e.target.value)}
                  className="w-full border border-[#D1D5DB] rounded-[4px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] bg-white resize-none text-[#111827]"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarCrearHilo(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-[4px] text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoHilo}
                  className="px-6 py-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white rounded-[4px] text-[13px] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creandoHilo ? 'Publicando...' : 'Publicar discusión'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── LAYOUT PRINCIPAL DEL FORO ── */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          
          {/* SIDEBAR IZQUIERDO: CATEGORÍAS & ESTADÍSTICAS */}
          <aside className="w-full lg:w-[240px] flex-shrink-0 flex flex-col gap-6">
            
            {/* Categorías */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">Categorías</h2>
              <nav className="flex flex-col gap-1">
                {[
                  { label: 'Todas las discusiones', count: null },
                  { label: 'Preguntas sobre el curso', count: null },
                  { label: 'Recursos y materiales', count: null },
                  { label: 'Proyectos de alumnos', count: null },
                  { label: 'Anuncios del instructor', badge: '2', count: null },
                  { label: 'Ayuda técnica', count: null }
                ].map((cat) => {
                  const isActive = activeCategory === cat.label;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => selectCategory(cat.label)}
                      className={`w-full flex items-center justify-between text-left px-3 py-2 rounded text-[13px] transition-all font-semibold ${
                        isActive
                          ? 'bg-[#EFF6FF] text-[#1E40AF] border-l-[3px] border-[#1E40AF]'
                          : 'text-[#4B5563] hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{cat.label}</span>
                      {cat.badge && (
                        <span className="bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {cat.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Estadísticas */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280] mb-4">Estadísticas del foro</h2>
              <ul className="space-y-3.5 text-[13px] text-[#4B5563]">
                <li className="flex items-center gap-2.5">
                  <span className="text-[16px]">📝</span>
                  <span><strong>{totalHilosCount}</strong> hilos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[16px]">💬</span>
                  <span><strong>{totalRespuestasCount}</strong> respuestas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[16px]">👥</span>
                  <span><strong>{uniqueParticipants}</strong> participantes</span>
                </li>
              </ul>
            </div>

          </aside>

          {/* CONTENIDO PRINCIPAL: LISTA O DETALLE */}
          <section className="flex-1 w-full min-w-0">
            {activeThread ? (
              
              // ── SCREEN A-DETALLE: HILO ABIERTO ──
              <div className="space-y-6">
                
                {/* Back button */}
                <button
                  onClick={() => setHiloActivoId(null)}
                  className="flex items-center gap-1.5 text-[13px] text-[#1E40AF] font-semibold hover:underline"
                >
                  <ArrowLeft size={15} /> Volver a discusiones
                </button>

                {/* Hilo Principal Card */}
                <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm border-b-2 border-b-[#1E40AF]">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[18px] flex-shrink-0">
                        {activeThread.usuario.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[14px] text-[#111827]">{activeThread.usuario.nombre}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wide border uppercase ${
                            activeThread.usuario.rol === 'instructor' 
                              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' 
                              : 'bg-gray-100 border-gray-200 text-gray-600'
                          }`}>
                            {activeThread.usuario.rol}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                          {new Date(activeThread.creado).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Badge e Icons */}
                    <div className="flex items-center gap-2">
                      {activeThread.fijado && (
                        <span className="bg-[#1E40AF] text-white font-semibold text-[10px] px-2 py-0.5 rounded-[4px] uppercase flex items-center gap-1">
                          <Pin size={10} /> FIJADO
                        </span>
                      )}
                      {activeThread.bloqueado && (
                        <span className="bg-red-500 text-white font-semibold text-[10px] px-2 py-0.5 rounded-[4px] uppercase flex items-center gap-1">
                          <Lock size={10} /> BLOQUEADO
                        </span>
                      )}
                      {activeThread.resuelto && (
                        <span className="bg-[#D1FAE5] text-[#065F46] font-semibold text-[10px] px-2 py-0.5 rounded-[4px] uppercase flex items-center gap-1">
                          <Check size={10} /> RESUELTO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title and Message */}
                  <h2 className="font-bold text-[22px] text-[#111827] mb-3 leading-tight">
                    {activeThread.titulo}
                  </h2>
                  <div className="text-[15px] text-[#374151] leading-relaxed whitespace-pre-line font-normal">
                    {activeThread.contenido}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#F3F4F6]">
                    <button
                      onClick={() => handleLike(activeThread.id)}
                      className={`flex items-center gap-1.5 text-[13px] px-4 py-2 rounded-[4px] font-semibold border transition-all ${
                        activeThread.usuarioReacciono 
                          ? 'bg-[#EFF6FF] border-[#93C5FD] text-[#1E40AF]' 
                          : 'bg-white border-[#D1D5DB] text-[#4B5563] hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsUp size={14} className={activeThread.usuarioReacciono ? 'fill-[#1E40AF]' : ''} />
                      <span>{activeThread.reaccionesCount || 0} Me gusta</span>
                    </button>
                    {!activeThread.bloqueado && (
                      <button
                        onClick={() => {
                          setReplyToId(activeThread.id);
                          setCitaMsg(null);
                          document.getElementById('resp-textarea')?.focus();
                        }}
                        className="flex items-center gap-1.5 text-[13px] px-4 py-2 rounded-[4px] font-semibold bg-white border border-[#D1D5DB] text-[#4B5563] hover:bg-gray-50 transition-colors"
                      >
                        <MessageSquare size={14} />
                        <span>Responder</span>
                      </button>
                    )}

                    {/* Moderator action toggles */}
                    {isModerator && (
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => handleMod(activeThread.id, 'fijado', !activeThread.fijado)}
                          className="p-2 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          title={activeThread.fijado ? 'Desfijar' : 'Fijar'}
                        >
                          <Pin size={14} />
                        </button>
                        <button
                          onClick={() => handleMod(activeThread.id, 'bloqueado', !activeThread.bloqueado)}
                          className="p-2 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
                          title={activeThread.bloqueado ? 'Desbloquear' : 'Bloquear'}
                        >
                          <Lock size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Respuestas list */}
                <div className="space-y-4">
                  <h3 className="font-bold text-[16px] text-[#111827] pl-1">
                    Respuestas ({activeThread.respuestas?.length || 0})
                  </h3>

                  {activeThread.respuestas && activeThread.respuestas.length > 0 ? (
                    <div className="space-y-4">
                      {activeThread.respuestas.map((reply) => {
                        const isInstructorReply = reply.usuario.rol === 'instructor';
                        return (
                          <div key={reply.id} className="space-y-3">
                            
                            {/* LEVEL 1 REPLY */}
                            <div className={`bg-white border border-gray-100 rounded-lg p-5 shadow-sm ${
                              isInstructorReply ? 'border-l-3 border-l-[#1E40AF]' : 'border-l-3 border-l-gray-300'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[13px]">
                                    {reply.usuario.nombre?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-[13px] text-[#111827]">{reply.usuario.nombre}</span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                                        isInstructorReply 
                                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' 
                                          : 'bg-gray-100 border-gray-200 text-gray-600'
                                      }`}>
                                        {reply.usuario.rol}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-[#9CA3AF]">{new Date(reply.creado).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Quote block */}
                              {reply.cita && (
                                <div className="bg-gray-50 border-l-[3px] border-gray-400 p-2.5 rounded-r-[4px] mb-3 text-[12px] text-[#6B7280]">
                                  <strong>{reply.cita.usuarioNombre}</strong> dijo:
                                  <p className="italic mt-0.5 font-normal">"{reply.cita.contenido}"</p>
                                </div>
                              )}

                              <p className="text-[13.5px] text-[#374151] leading-relaxed font-normal whitespace-pre-wrap">
                                {reply.contenido}
                              </p>

                              <div className="flex items-center gap-3 mt-3.5 pt-3.5 border-t border-gray-50">
                                <button
                                  onClick={() => handleLike(reply.id)}
                                  className={`flex items-center gap-1 text-[11px] font-bold ${
                                    reply.usuarioReacciono ? 'text-[#1E40AF]' : 'text-gray-500 hover:text-[#1E40AF]'
                                  }`}
                                >
                                  <ThumbsUp size={11} className={reply.usuarioReacciono ? 'fill-[#1E40AF]' : ''} />
                                  <span>{reply.reaccionesCount || 0} Me gusta</span>
                                </button>
                                {!activeThread.bloqueado && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setReplyToId(reply.id);
                                        setCitaMsg(null);
                                        document.getElementById('resp-textarea')?.focus();
                                      }}
                                      className="text-gray-500 hover:text-[#1E40AF] text-[11px] font-bold flex items-center gap-1"
                                    >
                                      💬 Responder
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyToId(reply.id);
                                        setCitaMsg(reply);
                                        document.getElementById('resp-textarea')?.focus();
                                      }}
                                      className="text-gray-500 hover:text-purple-600 text-[11px] font-bold flex items-center gap-0.5"
                                    >
                                      ” Citar
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* LEVEL 2 REPLY (Anidada) */}
                            {reply.respuestas && reply.respuestas.map((subReply) => (
                              <div key={subReply.id} className="ml-10 bg-[#FAFAFA] border border-gray-100 border-l-[2px] border-l-gray-300 rounded-r-lg p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6.5 h-6.5 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[11px]">
                                      {subReply.usuario.nombre?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-[12px] text-[#111827]">{subReply.usuario.nombre}</span>
                                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                                          subReply.usuario.rol === 'instructor' 
                                            ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' 
                                            : 'bg-gray-100 border-gray-200 text-gray-600'
                                        }`}>
                                          {subReply.usuario.rol}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-[#9CA3AF]">{new Date(subReply.creado).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                </div>

                                {subReply.cita && (
                                  <div className="bg-gray-100 border-l-[2px] border-gray-400 p-2 rounded-r-[4px] mb-3 text-[11.5px] text-[#6B7280]">
                                    <strong>{subReply.cita.usuarioNombre}</strong> dijo:
                                    <p className="italic mt-0.5 font-normal">"{subReply.cita.contenido}"</p>
                                  </div>
                                )}

                                <p className="text-[13px] text-[#4B5563] leading-relaxed font-normal whitespace-pre-wrap">
                                  {subReply.contenido}
                                </p>

                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200/40">
                                  <button
                                    onClick={() => handleLike(subReply.id)}
                                    className={`flex items-center gap-1 text-[11px] font-bold ${
                                      subReply.usuarioReacciono ? 'text-[#1E40AF]' : 'text-gray-500 hover:text-[#1E40AF]'
                                    }`}
                                  >
                                    <ThumbsUp size={11} className={subReply.usuarioReacciono ? 'fill-[#1E40AF]' : ''} />
                                    <span>{subReply.reaccionesCount || 0} Me gusta</span>
                                  </button>
                                </div>
                              </div>
                            ))}

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[#F9FAFB] border border-dashed border-gray-200 rounded-lg p-8 text-center text-[13px] text-gray-500 font-normal">
                      No hay respuestas todavía. ¡Sé el primero en responder!
                    </div>
                  )}
                </div>

                {/* Reply Write Form box */}
                {!activeThread.bloqueado && (
                  <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm mt-8">
                    <form onSubmit={handleEnviarRespuesta} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[16px] flex-shrink-0">
                        {currentUser?.nombre?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-3.5">
                        
                        {/* Quote reply to indicators */}
                        {replyToId && (
                          <div className="flex items-center justify-between bg-blue-50/50 px-3 py-1.5 rounded text-[12px] text-[#1E40AF] font-semibold">
                            <span>
                              {citaMsg ? 'Citando comentario' : 'Respondiendo a comentario'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyToId(null);
                                setCitaMsg(null);
                              }}
                              className="text-red-500 hover:underline"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}

                        <div className="border border-gray-300 rounded-[4px] overflow-hidden focus-within:border-[#1E40AF] transition-colors">
                          {/* Mini Editor Toolbar */}
                          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-200 bg-gray-50/60 select-none">
                            <button
                              type="button"
                              onClick={() => insertFormatting('bold')}
                              className="p-1 hover:bg-gray-200 rounded text-[#4B5563]"
                              title="Negrita"
                            >
                              <Bold size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('italic')}
                              className="p-1 hover:bg-gray-200 rounded text-[#4B5563]"
                              title="Cursiva"
                            >
                              <Italic size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('code')}
                              className="p-1 hover:bg-gray-200 rounded text-[#4B5563]"
                              title="Código"
                            >
                              <Code size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('list')}
                              className="p-1 hover:bg-gray-200 rounded text-[#4B5563]"
                              title="Lista"
                            >
                              <List size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting('link')}
                              className="p-1 hover:bg-gray-200 rounded text-[#4B5563]"
                              title="Enlace"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                          
                          <textarea
                            id="resp-textarea"
                            required
                            rows={3}
                            value={respuestaTexto}
                            onChange={(e) => setRespuestaTexto(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            className="w-full border-none p-3 text-[14px] focus:outline-none focus:ring-0 text-[#111827] placeholder-gray-400"
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <button
                            type="submit"
                            disabled={enviandoRespuesta}
                            className="bg-[#1E40AF] hover:bg-[#1A368F] text-white px-5 py-2.5 rounded-[4px] text-[13px] font-semibold transition-colors disabled:opacity-50"
                          >
                            {enviandoRespuesta ? 'Enviando...' : 'Publicar respuesta'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

              </div>

            ) : (

              // ── SCREEN A-LIST: LISTA DE HILOS ──
              <div className="space-y-5">
                
                {/* Search Bar & Filtering controls */}
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Search input */}
                  <div className="flex-1 flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3.5 h-10">
                    <Search size={16} className="text-[#9CA3AF] mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar en el foro..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent outline-none border-none text-[13.5px] text-[#111827] placeholder-[#9CA3AF]"
                    />
                  </div>

                  {/* Filters selectors */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-10 border border-[#E5E7EB] rounded-lg pl-3.5 pr-8 text-[13px] font-medium text-[#4B5563] bg-[#F9FAFB] hover:bg-gray-50 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="recientes">Ordenar: Más recientes</option>
                        <option value="populares">Ordenar: Populares</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-10 border border-[#E5E7EB] rounded-lg pl-3.5 pr-8 text-[13px] font-medium text-[#4B5563] bg-[#F9FAFB] hover:bg-gray-50 focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="Todos">Estado: Todos</option>
                        <option value="Resueltos">Resueltos</option>
                        <option value="Fijados">Fijados</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
                    </div>

                    {/* Toggle Switch solo sin respuesta */}
                    <button
                      type="button"
                      onClick={() => setSoloSinRespuesta(!soloSinRespuesta)}
                      className={`h-10 border rounded-lg px-3.5 text-[13px] font-semibold flex items-center gap-2 select-none transition-colors border-[#E5E7EB] ${
                        soloSinRespuesta 
                          ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]' 
                          : 'bg-[#F9FAFB] text-[#4B5563] hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center ${
                        soloSinRespuesta 
                          ? 'bg-[#1E40AF] border-[#1E40AF] text-white' 
                          : 'bg-white border-[#CBD5E1]'
                      }`}>
                        {soloSinRespuesta && <Check size={10} />}
                      </span>
                      <span>Solo sin respuesta</span>
                    </button>
                  </div>
                </div>

                {/* Hilos rows list */}
                <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm divide-y divide-[#F3F4F6]">
                  {loading ? (
                    <div className="py-20 text-center text-[14px] text-[#9CA3AF] font-medium">
                      Cargando hilos de discusión...
                    </div>
                  ) : filteredHilos.length === 0 ? (
                    <div className="py-20 text-center max-w-md mx-auto">
                      <HelpCircle size={40} className="mx-auto mb-4 text-[#D1D5DB]" />
                      <p className="font-bold text-[16px] text-[#111827]">Sin discusiones</p>
                      <p className="text-[13px] text-[#6B7280] mt-1 font-normal">
                        No encontramos hilos que coincidan con la búsqueda o la categoría seleccionada en este foro.
                      </p>
                    </div>
                  ) : (
                    filteredHilos.map((h) => {
                      const commentsCount = h.respuestas?.reduce((acc, r) => acc + 1 + (r.respuestas?.length || 0), 0) || 0;
                      return (
                        <div
                          key={h.id}
                          onClick={() => setHiloActivoId(h.id)}
                          className="flex items-start gap-4 p-5 hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                        >
                          {/* Left avatar with green online status indicator */}
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[15px]">
                              {h.usuario.nombre?.charAt(0).toUpperCase()}
                            </div>
                            {/* Online green indicator dot */}
                            <div className="absolute bottom-0 right-0 w-[9px] h-[9px] bg-[#10B981] rounded-full border border-white"></div>
                          </div>

                          {/* Center message information */}
                          <div className="flex-grow min-w-0 pr-4">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {/* Category Badge */}
                              <span className="bg-[#DBEAFE] text-[#1E40AF] font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wide">
                                {h.categoria || 'Curso'}
                              </span>

                              {/* Fijado status badge */}
                              {h.fijado && (
                                <span className="bg-[#1E40AF] text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-0.5">
                                  📌 FIJADO
                                </span>
                              )}

                              {/* Resuelto status badge */}
                              {h.resuelto && (
                                <span className="bg-[#D1FAE5] text-[#065F46] font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-0.5">
                                  ✔ RESUELTO
                                </span>
                              )}
                            </div>

                            {/* Thread Title with Hover */}
                            <h3 className="font-bold text-[15px] text-[#111827] hover:text-[#1E40AF] transition-colors leading-snug line-clamp-1">
                              {h.titulo}
                            </h3>

                            {/* Message author line */}
                            <div className="flex items-center gap-1.5 text-[11.5px] text-[#6B7280] mt-1.5 flex-wrap">
                              <span className="font-semibold text-[#4B5563]">{h.usuario.nombre}</span>
                              <span className="text-[#9CA3AF]">•</span>
                              <span className="font-medium text-[#4B5563] text-capitalize">{h.usuario.rol}</span>
                              <span className="text-[#9CA3AF]">•</span>
                              <span className="text-[#9CA3AF] flex items-center gap-0.5">
                                <Clock size={11} />
                                {new Date(h.creado).toLocaleDateString('es-CO')}
                              </span>
                              <span className="text-[#D1D5DB] hidden sm:inline">|</span>
                              <span className="italic font-normal text-[#6B7280] truncate max-w-sm hidden sm:inline">
                                "{h.contenido?.slice(0, 80)}..."
                              </span>
                            </div>
                          </div>

                          {/* Right side stats */}
                          <div className="flex items-center gap-4 flex-shrink-0 self-center text-right">
                            {/* Comment bubble */}
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1 text-[13.5px] font-bold text-[#374151]">
                                <MessageSquare size={14} className="text-[#4B5563]" />
                                <span>{commentsCount}</span>
                              </div>
                              <span className="text-[10px] text-[#9CA3AF] mt-0.5">{commentsCount === 1 ? 'respuesta' : 'respuestas'}</span>
                            </div>

                            {/* Views */}
                            <div className="hidden sm:flex flex-col text-center">
                              <span className="text-[13px] font-medium text-[#4B5563]">{h.vistas || 0}</span>
                              <span className="text-[10px] text-[#9CA3AF]">vistas</span>
                            </div>

                            {/* Last activity avatar / reply timestamp */}
                            {h.respuestas && h.respuestas.length > 0 && (
                              <div className="hidden md:flex flex-col items-center gap-0.5">
                                <div className="w-5 h-5 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[10px] border border-gray-100">
                                  {h.respuestas[h.respuestas.length - 1].usuario.nombre?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[9px] text-[#9CA3AF]">
                                  hace {Math.floor(Math.random() * 50) + 5} min
                                </span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}
          </section>

        </div>

      </main>

      {/* Footer */}
      <FooterAdmin />
    </div>
  );
}
