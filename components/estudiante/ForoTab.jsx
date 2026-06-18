'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import EmojiIcon from '@/components/common/EmojiIcon';
import {
  MessageSquare,
  Pin,
  Check,
  Search,
  Plus,
  ChevronDown,
  ThumbsUp,
  ArrowLeft,
  Lock,
  Clock,
  Bold,
  Italic,
  Code,
  List,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export default function ForoTab({ cursoId }) {
  const [usuario, setUsuario] = useState(null);
  const [hilos, setHilos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Category / Navigation
  const [activeCategory, setActiveCategory] = useState('Todas las discusiones');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recientes'); // 'recientes' | 'populares'
  const [filterStatus, setFilterStatus] = useState('Todos'); // 'Todos' | 'Resueltos' | 'Fijados'
  const [soloSinRespuesta, setSoloSinRespuesta] = useState(false);

  // Form states
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [crearCategoria, setCrearCategoria] = useState('Preguntas sobre el curso');
  const [creandoHilo, setCreandoHilo] = useState(false);
  const [mostrarCrearHilo, setMostrarCrearHilo] = useState(false);

  // Active Opened Thread Details
  const [hiloActivoId, setHiloActivoId] = useState(null); // Opened thread in detail

  // Reply states
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [replyToId, setReplyToId] = useState(null); // Message ID we are replying to
  const [citaMsg, setCitaMsg] = useState(null); // Quote message object
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Empty mockThreads array
  const mockThreads = useMemo(() => [], []);

  // Fetch current user & forum data
  const cargarDatos = useCallback(async () => {
    try {
      const [resUser, resForo] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/cursos/${cursoId}/foro`),
      ]);
      if (resUser.ok) {
        const u = await resUser.json();
        setUsuario(u);
      }
      if (resForo.ok) {
        const data = await resForo.json();
        const dbHilos = data.hilos || [];
        
        const enriched = dbHilos.map((h) => ({
          ...h,
          categoria: h.categoria || 'Preguntas sobre el curso',
          vistas: h.vistas || 0,
          resuelto: h.resuelto || h.bloqueado || false
        }));

        setHilos(enriched);
      } else {
        setHilos([]);
      }
    } catch (error) {
      console.error('Error al cargar datos del foro:', error);
      setHilos([]);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Handle Like Toggle
  const handleLike = async (msgId) => {
    try {
      const res = await fetch(`/api/cursos/${cursoId}/foro/${msgId}/like`, {
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

  // Handle Moderation (Pin / Lock)
  const handleMod = async (msgId, field, value) => {
    try {
      const res = await fetch(`/api/cursos/${cursoId}/foro/${msgId}/mod`, {
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
      } else {
        const err = await res.json();
        showToast('Error: ' + err.error, 'error');
      }
    } catch (error) {
      console.error('Error al moderar:', error);
    }
  };

  // Handle Create Hilo
  const handleCrearHilo = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) return;
    setCreandoHilo(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}/foro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: nuevoTitulo,
          contenido: nuevoContenido,
        }),
      });
      if (res.ok) {
        const newHilo = await res.json();
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
        showToast('¡Nuevo hilo publicado!');
      } else {
        const localMock = {
          id: `local-visor-${Date.now()}`,
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
            id: usuario?.id || 'me',
            nombre: usuario?.nombre || 'Estudiante',
            rol: usuario?.rol || 'alumno',
            imagen: usuario?.imagen || null
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

  // Handle Send Reply
  const handleEnviarRespuesta = async (e) => {
    e.preventDefault();
    if (!respuestaTexto.trim()) return;
    setEnviandoRespuesta(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}/foro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenido: respuestaTexto,
          padreId: replyToId,
          citaId: citaMsg?.id,
        }),
      });
      
      const userObj = {
        id: usuario?.id || 'me',
        nombre: usuario?.nombre || 'Estudiante',
        rol: usuario?.rol || 'alumno',
        imagen: usuario?.imagen || null
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
        const mockNewReply = {
          id: `local-visor-rep-${Date.now()}`,
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

  const isModerator = usuario?.rol === 'admin' || usuario?.rol === 'instructor';

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

  // Sidebar Category Item click
  const selectCategory = (cat) => {
    setActiveCategory(cat);
    setHiloActivoId(null);
  };

  // Filter and sort computation
  const filteredHilos = useMemo(() => {
    return hilos
      .filter((h) => {
        if (activeCategory !== 'Todas las discusiones' && h.categoria !== activeCategory) return false;
        
        if (searchQuery.trim() !== '') {
          const s = searchQuery.toLowerCase();
          const matchTitle = h.titulo?.toLowerCase().includes(s);
          const matchContent = h.contenido?.toLowerCase().includes(s);
          if (!matchTitle && !matchContent) return false;
        }

        if (filterStatus === 'Resueltos' && !h.resuelto) return false;
        if (filterStatus === 'Fijados' && !h.fijado) return false;
        if (soloSinRespuesta && h.respuestas && h.respuestas.length > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recientes') return new Date(b.creado) - new Date(a.creado);
        if (sortBy === 'populares') return (b.reaccionesCount || 0) + (b.respuestas?.length || 0) * 2 - ((a.reaccionesCount || 0) + (a.respuestas?.length || 0) * 2);
        return 0;
      });
  }, [hilos, activeCategory, searchQuery, sortBy, filterStatus, soloSinRespuesta]);

  const activeThread = hilos.find((h) => h.id === hiloActivoId);

  const insertFormatting = (tag) => {
    const textareas = document.getElementById('visor-resp-textarea');
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

  if (loading) {
    return (
      <div className="py-20 text-center text-[13px] text-gray-400 font-semibold bg-white">
        Cargando foro de discusión...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 font-sans text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Toast alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[5000] flex items-center gap-2 border rounded-lg px-4 py-3 shadow-md transform transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle size={16} />
          <span className="text-[12px] font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Main layout wrapper */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        
        {/* SIDEBAR LEFT */}
        <aside className="w-full xl:w-[220px] flex-shrink-0 flex flex-col sm:flex-row xl:flex-col gap-4">
          {/* Categories */}
          <div className="bg-white border border-gray-100 rounded p-4 flex-1">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Categorías</h4>
            <nav className="flex flex-col gap-0.5">
              {[
                { label: 'Todas las discusiones' },
                { label: 'Preguntas sobre el curso' },
                { label: 'Recursos y materiales' },
                { label: 'Proyectos de alumnos' },
                { label: 'Anuncios del instructor', badge: '2' },
                { label: 'Ayuda técnica' }
              ].map((cat) => {
                const isActive = activeCategory === cat.label;
                return (
                  <button
                    key={cat.label}
                    onClick={() => selectCategory(cat.label)}
                    className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded text-[12px] font-semibold transition-all ${
                      isActive ? 'bg-[#EFF6FF] text-[#1E40AF] border-l-2 border-l-[#1E40AF]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    {cat.badge && (
                      <span className="bg-[#F97316] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                        {cat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Stats */}
          <div className="bg-white border border-gray-100 rounded p-4 w-full xl:w-auto sm:max-w-xs xl:max-w-none">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Estadísticas</h4>
            <div className="flex justify-between sm:flex-col sm:gap-2.5 text-[12.5px] text-[#4B5563]">
              <div className="flex items-center gap-1.5">
                <span>📝</span>
                <span><strong>{totalHilosCount}</strong> hilos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>💬</span>
                <span><strong>{totalRespuestasCount}</strong> respuestas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>👥</span>
                <span><strong>{uniqueParticipants}</strong> participantes</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-grow w-full min-w-0">
          
          {activeThread ? (
            
            // ── DETAILS HILO ABIERTO ──
            <div className="space-y-5">
              <button
                onClick={() => setHiloActivoId(null)}
                className="flex items-center gap-1 text-[12px] text-[#1E40AF] font-bold hover:underline"
              >
                <ArrowLeft size={14} /> Volver a la lista
              </button>

              {/* Main Card */}
              <div className="bg-white border border-gray-100 rounded p-5 border-b-2 border-b-[#1E40AF]">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[14px]">
                      {activeThread.usuario.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[13px] text-slate-800">{activeThread.usuario.nombre}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase border ${
                          activeThread.usuario.rol === 'instructor' 
                            ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' 
                            : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}>
                          {activeThread.usuario.rol}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {new Date(activeThread.creado).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeThread.fijado && (
                      <span className="bg-[#1E40AF] text-white font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Pin size={10} className="stroke-[2.5]" /> FIJADO
                      </span>
                    )}
                    {activeThread.bloqueado && (
                      <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Lock size={10} className="stroke-[2.5]" /> BLOQUEADO
                      </span>
                    )}
                    {activeThread.resuelto && (
                      <span className="bg-[#D1FAE5] text-[#065F46] font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Check size={10} className="stroke-[2.5]" /> RESUELTO
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-[18px] text-slate-900 mb-2 leading-tight">
                  {activeThread.titulo}
                </h3>
                <p className="text-[14px] text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                  {activeThread.contenido}
                </p>

                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleLike(activeThread.id)}
                    className={`flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 border rounded ${
                      activeThread.usuarioReacciono ? 'bg-blue-50 border-blue-200 text-[#1E40AF]' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ThumbsUp size={12} className={activeThread.usuarioReacciono ? 'fill-[#1E40AF]' : ''} />
                    <span>{activeThread.reaccionesCount || 0} Me gusta</span>
                  </button>
                  {!activeThread.bloqueado && (
                    <button
                      onClick={() => {
                        setReplyToId(activeThread.id);
                        setCitaMsg(null);
                        document.getElementById('visor-resp-textarea')?.focus();
                      }}
                      className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded"
                    >
                      <MessageSquare size={12} />
                      <span>Responder</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Comments responses */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[14px] text-slate-800 px-1">Respuestas</h4>
                {activeThread.respuestas && activeThread.respuestas.length > 0 ? (
                  <div className="space-y-3.5">
                    {activeThread.respuestas.map((reply) => {
                      const isInstructorReply = reply.usuario.rol === 'instructor';
                      return (
                        <div key={reply.id} className="space-y-2.5">
                          
                          {/* LVL 1 comment */}
                          <div className={`bg-white border border-gray-100 rounded p-4 shadow-sm ${
                            isInstructorReply ? 'border-l-2 border-l-[#1E40AF]' : 'border-l-2 border-l-gray-300'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[12px]">
                                {reply.usuario.nombre?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-[12.5px] text-slate-800">{reply.usuario.nombre}</span>
                                  <span className={`text-[8px] font-bold px-1 py-0.1 rounded border ${
                                    isInstructorReply ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]' : 'bg-gray-100 border-gray-200 text-gray-500'
                                  }`}>
                                    {reply.usuario.rol}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-400">{new Date(reply.creado).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {reply.cita && (
                              <div className="bg-gray-50 border-l-2 border-gray-400 p-2 rounded-r mb-2 text-[11.5px] text-[#6B7280]">
                                <strong>{reply.cita.usuarioNombre}</strong> dijo:
                                <p className="italic mt-0.5">"{reply.cita.contenido}"</p>
                              </div>
                            )}

                            <p className="text-[13px] text-slate-700 font-normal leading-relaxed whitespace-pre-wrap">
                              {reply.contenido}
                            </p>

                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
                              <button
                                onClick={() => handleLike(reply.id)}
                                className={`flex items-center gap-1 text-[10.5px] font-bold ${
                                  reply.usuarioReacciono ? 'text-[#1E40AF]' : 'text-gray-400 hover:text-[#1E40AF]'
                                }`}
                              >
                                <ThumbsUp size={10} className={reply.usuarioReacciono ? 'fill-[#1E40AF]' : ''} />
                                <span>{reply.reaccionesCount || 0}</span>
                              </button>
                              {!activeThread.bloqueado && (
                                <>
                                  <button
                                    onClick={() => {
                                      setReplyToId(reply.id);
                                      setCitaMsg(null);
                                      document.getElementById('visor-resp-textarea')?.focus();
                                    }}
                                    className="text-gray-400 hover:text-[#1E40AF] text-[10.5px] font-bold"
                                  >
                                    Responder
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyToId(reply.id);
                                      setCitaMsg(reply);
                                      document.getElementById('visor-resp-textarea')?.focus();
                                    }}
                                    className="text-gray-400 hover:text-purple-600 text-[10.5px] font-bold"
                                  >
                                    Citar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* LVL 2 comment */}
                          {reply.respuestas && reply.respuestas.map((sub) => (
                            <div key={sub.id} className="ml-8 bg-gray-50/50 border border-gray-100 rounded-r p-3 shadow-xs">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[10.5px]">
                                  {sub.usuario.nombre?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-[11.5px] text-slate-800">{sub.usuario.nombre}</span>
                                    <span className="bg-gray-100 border border-gray-200 text-gray-500 font-bold text-[7.5px] px-1 rounded uppercase">
                                      {sub.usuario.rol}
                                    </span>
                                  </div>
                                  <span className="text-[9.5px] text-gray-400">{new Date(sub.creado).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {sub.cita && (
                                <div className="bg-white border-l border-gray-400 p-1.5 rounded mb-2 text-[11px] text-[#6B7280]">
                                  <strong>{sub.cita.usuarioNombre}</strong> dijo:
                                  <p className="italic mt-0.5">"{sub.cita.contenido}"</p>
                                </div>
                              )}

                              <p className="text-[12.5px] text-[#4B5563] font-normal leading-relaxed whitespace-pre-wrap">
                                {sub.contenido}
                              </p>

                              <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-200/20">
                                <button
                                  onClick={() => handleLike(sub.id)}
                                  className={`flex items-center gap-1 text-[10.5px] font-bold ${
                                    sub.usuarioReacciono ? 'text-[#1E40AF]' : 'text-gray-400'
                                  }`}
                                >
                                  <ThumbsUp size={10} className={sub.usuarioReacciono ? 'fill-[#1E40AF]' : ''} />
                                  <span>{sub.reaccionesCount || 0}</span>
                                </button>
                              </div>
                            </div>
                          ))}

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded text-center text-[12px] text-gray-400">
                    No hay respuestas todavía. ¡Sé el primero!
                  </div>
                )}
              </div>

              {/* Reply box form */}
              {!activeThread.bloqueado && (
                <div className="bg-white border border-gray-100 rounded p-4 shadow-sm mt-6">
                  <form onSubmit={handleEnviarRespuesta} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[14px]">
                      {usuario?.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow space-y-2.5">
                      {replyToId && (
                        <div className="flex items-center justify-between bg-blue-50/50 px-3 py-1.5 rounded text-[11px] text-[#1E40AF] font-semibold">
                          <span>Citando/Respondiendo</span>
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
                        {/* Toolbar */}
                        <div className="flex items-center gap-1 px-2.5 py-1 border-b border-gray-200 bg-gray-50 select-none">
                          <button type="button" onClick={() => insertFormatting('bold')} className="p-1 hover:bg-gray-200 rounded text-gray-500"><Bold size={12} /></button>
                          <button type="button" onClick={() => insertFormatting('italic')} className="p-1 hover:bg-gray-200 rounded text-gray-500"><Italic size={12} /></button>
                          <button type="button" onClick={() => insertFormatting('code')} className="p-1 hover:bg-gray-200 rounded text-gray-500"><Code size={12} /></button>
                          <button type="button" onClick={() => insertFormatting('list')} className="p-1 hover:bg-gray-200 rounded text-gray-500"><List size={12} /></button>
                          <button type="button" onClick={() => insertFormatting('link')} className="p-1 hover:bg-gray-200 rounded text-gray-500"><ExternalLink size={12} /></button>
                        </div>
                        <textarea
                          id="visor-resp-textarea"
                          rows={3}
                          value={respuestaTexto}
                          onChange={(e) => setRespuestaTexto(e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          required
                          className="w-full border-none p-2.5 text-[13px] focus:outline-none focus:ring-0 text-slate-800 placeholder-gray-400"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={enviandoRespuesta}
                          className="bg-[#1E40AF] hover:bg-[#1A368F] text-white px-4 py-2 rounded-[4px] text-[12px] font-semibold transition-colors disabled:opacity-50"
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

            // ── HILOS LIST ──
            <div className="space-y-4">
              
              {/* Search & Filters */}
              <div className="bg-white border border-gray-100 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-grow flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded px-3 h-9">
                  <Search size={14} className="text-[#9CA3AF] mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar en el foro..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent outline-none border-none text-[12.5px] text-[#111827] placeholder-[#9CA3AF]"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-9 border border-[#E5E7EB] rounded pl-3 pr-7 text-[12px] font-semibold text-gray-600 bg-[#F9FAFB] hover:bg-gray-50 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="recientes">Recientes</option>
                      <option value="populares">Populares</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-9 border border-[#E5E7EB] rounded pl-3 pr-7 text-[12px] font-semibold text-gray-600 bg-[#F9FAFB] hover:bg-gray-50 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="Todos">Todos</option>
                      <option value="Resueltos">Resueltos</option>
                      <option value="Fijados">Fijados</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setSoloSinRespuesta(!soloSinRespuesta)}
                    className={`h-9 border rounded px-3 text-[12px] font-semibold flex items-center gap-1.5 transition-colors border-[#E5E7EB] ${
                      soloSinRespuesta ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]' : 'bg-[#F9FAFB] text-gray-600'
                    }`}
                  >
                    <span>Solo sin respuesta</span>
                  </button>

                  <button
                    onClick={() => setMostrarCrearHilo(!mostrarCrearHilo)}
                    className="h-9 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-3 rounded text-[12px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> Nuevo tema
                  </button>
                </div>
              </div>

              {/* Crear Hilo form inline inside general list if toggled */}
              {mostrarCrearHilo && (
                <div className="border border-gray-100 rounded p-4 bg-[#F9FAFB] space-y-3">
                  <h4 className="font-bold text-[14px] text-slate-800">➕ Iniciar discusión</h4>
                  <form onSubmit={handleCrearHilo} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Título de la discusión..."
                        value={nuevoTitulo}
                        onChange={(e) => setNuevoTitulo(e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded px-3 text-[13px] bg-white text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                      />
                      <div className="relative">
                        <select
                          value={crearCategoria}
                          onChange={(e) => setCrearCategoria(e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded pl-3 pr-8 text-[13px] bg-white text-slate-800 focus:outline-none appearance-none focus:border-[#1E40AF]"
                        >
                          <option>Preguntas sobre el curso</option>
                          <option>Recursos y materiales</option>
                          <option>Proyectos de alumnos</option>
                          <option>Ayuda técnica</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                    <textarea
                      required
                      rows={3}
                      placeholder="Escribe el mensaje..."
                      value={nuevoContenido}
                      onChange={(e) => setNuevoContenido(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2.5 text-[13px] bg-white text-slate-800 focus:outline-none resize-none focus:border-[#1E40AF]"
                    />
                    <div className="flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setMostrarCrearHilo(false)}
                        className="px-3.5 py-1.5 border border-gray-300 text-gray-600 rounded text-[12px] font-semibold hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={creandoHilo}
                        className="px-4 py-1.5 bg-[#1E40AF] text-white rounded text-[12px] font-semibold hover:bg-[#1A368F] disabled:opacity-50"
                      >
                        Publicar tema
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Rows List */}
              <div className="bg-white border border-gray-100 rounded overflow-hidden divide-y divide-gray-50 shadow-sm">
                {filteredHilos.length === 0 ? (
                  <div className="py-12 text-center text-[12.5px] text-gray-400 font-medium bg-[#FAFAFA]">
                    No se encontraron temas en este foro.
                  </div>
                ) : (
                  filteredHilos.map((h) => {
                    const commentsCount = h.respuestas?.reduce((acc, r) => acc + 1 + (r.respuestas?.length || 0), 0) || 0;
                    return (
                      <div
                        key={h.id}
                        onClick={() => setHiloActivoId(h.id)}
                        className="p-4 hover:bg-[#F9FAFB] cursor-pointer flex gap-3 transition-colors items-start"
                      >
                        {/* Avatar left */}
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[13.5px] flex-shrink-0 relative border border-gray-100">
                          {h.usuario.nombre?.charAt(0).toUpperCase()}
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#10B981] rounded-full border border-white"></div>
                        </div>

                        {/* Mid detail content */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1 select-none">
                            <span className="bg-[#DBEAFE] text-[#1E40AF] font-bold text-[8.5px] px-1.5 py-0.2 rounded uppercase">
                              {h.categoria}
                            </span>
                            {h.fijado && (
                              <span className="bg-[#1E40AF] text-white font-bold text-[8.5px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Pin size={9} className="stroke-[2.5]" /> FIJADO
                              </span>
                            )}
                            {h.resuelto && (
                              <span className="bg-[#D1FAE5] text-[#065F46] font-bold text-[8.5px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Check size={9} className="stroke-[2.5]" /> RESUELTO
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-[13.5px] text-slate-800 hover:text-[#1E40AF] transition-colors leading-snug line-clamp-1">
                            {h.titulo}
                          </h4>

                          <div className="flex items-center gap-1 text-[10.5px] text-gray-400 mt-1 flex-wrap font-medium">
                            <span className="font-semibold text-[#4B5563]">{h.usuario.nombre}</span>
                            <span>•</span>
                            <span className="text-gray-400 capitalize">{h.usuario.rol}</span>
                            <span>•</span>
                            <span>{new Date(h.creado).toLocaleDateString()}</span>
                            <span className="hidden sm:inline font-normal italic truncate max-w-xs pl-1">
                              "{h.contenido?.slice(0, 50)}..."
                            </span>
                          </div>
                        </div>

                        {/* Right counts */}
                        <div className="flex items-center gap-3.5 flex-shrink-0 self-center text-right pr-1">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-0.5 text-[12.5px] font-bold text-[#374151]">
                              <MessageSquare size={12} className="text-[#6B7280]" />
                              <span>{commentsCount}</span>
                            </div>
                            <span className="text-[8.5px] text-[#9CA3AF]">respuestas</span>
                          </div>

                          <div className="hidden sm:flex flex-col text-center">
                            <span className="text-[12px] font-semibold text-[#374151]">{h.vistas || 0}</span>
                            <span className="text-[8.5px] text-[#9CA3AF]">vistas</span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
