'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Bell,
  FileText,
  MessageSquare,
  Plus,
  ArrowLeft,
  Send,
  Paperclip,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  File,
  Video,
  Image,
  Menu,
  X,
  Search,
  Info,
  Smile,
  Globe,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';

export default function WorkspaceClient({ grupo, usuarioSession, sesiones = [] }) {
  const router = useRouter();
  
  // Navigation / Tabs mapped as Slack Channels
  const [activeChannel, setActiveChannel] = useState('# general'); // '# general' | '# recursos' | '# dudas-y-preguntas'
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile hamburger toggle

  const todosLosMiembros = useMemo(() => {
    const list = [];
    if (grupo.creadorId && grupo.creadorNombre) {
      list.push({
        id: grupo.creadorId,
        nombre: `${grupo.creadorNombre} (Instructor)`,
        imagen: null,
        active: true,
      });
    }
    (grupo.miembros || []).forEach((m) => {
      if (m.id !== grupo.creadorId) {
        list.push({
          id: m.id,
          nombre: m.nombre,
          imagen: m.imagen,
          active: true,
        });
      }
    });
    return list;
  }, [grupo]);

  // --- AVISOS (ANUNCIOS) STATE ---
  const [avisos, setAvisos] = useState([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);
  const [nuevoAviso, setNuevoAviso] = useState({ titulo: '', contenido: '' });
  const [creandoAviso, setCreandoAviso] = useState(false);
  const [avisoSuccess, setAvisoSuccess] = useState('');
  const [avisoError, setAvisoError] = useState('');
  const [programar, setProgramar] = useState(false);
  const [fechaProg, setFechaProg] = useState('');

  // --- ARCHIVOS (RECURSOS) STATE ---
  const [archivos, setArchivos] = useState([]);
  const [loadingArchivos, setLoadingArchivos] = useState(true);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [archivoError, setArchivoError] = useState('');
  const [archivoSuccess, setArchivoSuccess] = useState('');
  const [expandedFileKeys, setExpandedFileKeys] = useState(new Set()); // For collapsible version history

  // --- CHAT (GENERAL) STATE ---
  const [mensajes, setMensajes] = useState([]);
  const [loadingChat, setLoadingChat] = useState(true);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const chatEndRef = useRef(null);

  // --- TOAST NOTIFICATIONS ---
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [abandonando, setAbandonando] = useState(false);

  const handleAbandonarGrupo = async () => {
    if (!window.confirm('¿Estás seguro de que deseas salir de este espacio colaborativo? Ya no podrás acceder a los archivos ni al chat de este grupo.')) {
      return;
    }

    setAbandonando(true);
    try {
      const res = await fetch(`/api/admin/grupos/${grupo.id}/alumnos/${usuarioSession.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Has abandonado el grupo exitosamente.');
        router.push('/dashboard/grupos');
      } else {
        const data = await res.json();
        alert(data.message || 'Ocurrió un error al intentar salir del grupo.');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Error de conexión al servidor.');
    } finally {
      setAbandonando(false);
    }
  };

  // --- DATABASE FETCHERS ---
  const fetchAvisos = useCallback(async () => {
    try {
      const res = await fetch(`/api/grupos/${grupo.id}/avisos`);
      if (res.ok) {
        const data = await res.json();
        setAvisos(data);
      }
    } catch (e) {
      console.error('Error fetching avisos:', e);
    } finally {
      setLoadingAvisos(false);
    }
  }, [grupo.id]);

  const fetchArchivos = useCallback(async () => {
    try {
      const res = await fetch(`/api/grupos/${grupo.id}/archivos`);
      if (res.ok) {
        const data = await res.json();
        setArchivos(data);
      }
    } catch (e) {
      console.error('Error fetching archivos:', e);
    } finally {
      setLoadingArchivos(false);
    }
  }, [grupo.id]);

  const fetchChat = useCallback(
    async (silently = false) => {
      if (!silently) setLoadingChat(true);
      try {
        const res = await fetch(`/api/mensajes/chat?grupoId=${grupo.id}`);
        if (res.ok) {
          const data = await res.json();
          setMensajes(data.mensajes || []);

          // Auto-mark group messages as read
          await fetch('/api/mensajes/chat', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grupoId: grupo.id }),
          });
        }
      } catch (e) {
        console.error('Error fetching chat:', e);
      } finally {
        if (!silently) setLoadingChat(false);
      }
    },
    [grupo.id]
  );

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeChannel === '# general') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, activeChannel]);

  // Load data based on channel selection (simulated Slack integration)
  useEffect(() => {
    if (activeChannel === '# general') {
      fetchChat();
    } else if (activeChannel === '# recursos') {
      fetchArchivos();
    } else if (activeChannel === '# dudas-y-preguntas') {
      fetchAvisos();
    }
  }, [activeChannel, fetchAvisos, fetchArchivos, fetchChat]);

  // Polling for Chat general channel (every 4 seconds)
  useEffect(() => {
    if (activeChannel !== '# general') return;
    const interval = setInterval(() => {
      fetchChat(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChannel, fetchChat]);

  // --- ACTIONS ---

  // 1. Create Announcement (Avisos)
  const handleCrearAviso = async (e) => {
    e.preventDefault();
    if (!nuevoAviso.titulo.trim() || !nuevoAviso.contenido.trim()) return;

    setCreandoAviso(true);
    setAvisoError('');
    setAvisoSuccess('');

    try {
      const bodyPayload = {
        titulo: nuevoAviso.titulo,
        contenido: nuevoAviso.contenido,
      };

      if (programar && fechaProg) {
        bodyPayload.fechaProgramada = new Date(fechaProg).toISOString();
      }

      const res = await fetch(`/api/grupos/${grupo.id}/avisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'No se pudo crear el aviso.');
      }

      const created = await res.json();
      setAvisos((prev) => [created, ...prev]);
      setNuevoAviso({ titulo: '', contenido: '' });
      setProgramar(false);
      setFechaProg('');
      
      const successMessage = created.publicado 
        ? '¡Aviso publicado con éxito!' 
        : '¡Anuncio programado con éxito!';
      
      setAvisoSuccess(successMessage);
      showToast(created.publicado ? 'Aviso publicado en cartelera' : 'Anuncio programado');
      setTimeout(() => setAvisoSuccess(''), 3000);
    } catch (err) {
      setAvisoError(err.message);
    } finally {
      setCreandoAviso(false);
    }
  };

  // 2. Upload File (Resources/Archivos)
  const handleSubirArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoError('');
    setArchivoSuccess('');
    setSubiendoArchivo(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/grupos/${grupo.id}/archivos`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al subir el archivo.');
      }

      setArchivoSuccess('¡Archivo cargado y versionado exitosamente!');
      showToast('Archivo subido al canal #recursos');
      setTimeout(() => setArchivoSuccess(''), 4000);
      fetchArchivos(); // Reload resources list
    } catch (err) {
      setArchivoError(err.message);
    } finally {
      setSubiendoArchivo(false);
    }
  };

  // 3. Send Group Chat Message
  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const msgText = nuevoMensaje;
    setNuevoMensaje('');

    try {
      const res = await fetch('/api/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId: grupo.id,
          contenido: msgText,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setMensajes((prev) => [
          ...prev,
          {
            ...created,
            remitente: {
              id: usuarioSession.id,
              nombre: usuarioSession.nombre,
              imagen: usuarioSession.imagen,
            },
          },
        ]);
      } else {
        // Mock local append for high fidelity offline/fallback demo
        const localMockMsg = {
          id: `local-grp-chat-${Date.now()}`,
          contenido: msgText,
          fechaEnvio: new Date().toISOString(),
          remitenteId: usuarioSession.id,
          remitente: {
            id: usuarioSession.id,
            nombre: usuarioSession.nombre,
            imagen: usuarioSession.imagen,
            rol: usuarioSession.rol
          }
        };
        setMensajes((prev) => [...prev, localMockMsg]);
        showToast('Mensaje enviado (Modo Demo)');
      }
    } catch (e) {
      console.error('Error al enviar mensaje:', e);
    }
  };

  // Toggle versions lists
  const toggleExpandFile = (key) => {
    setExpandedFileKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // --- UTILS ---
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // High fidelity default Slack-style messages for #general when empty (disabled as requested)
  const mockSlackMessages = useMemo(() => [], []);

  // Merge database chat messages with Slack mockups for premium experience representation
  const displayedMessages = useMemo(() => {
    return mensajes.map(m => ({
      id: m.id,
      remitente: {
        nombre: m.remitente?.nombre || 'Estudiante',
        rol: m.remitente?.id === grupo.creadorId ? 'instructor' : 'alumno',
        imagen: m.remitente?.imagen || null
      },
      contenido: m.contenido,
      fechaEnvio: m.fechaEnvio,
      isInstructor: m.remitente?.id === grupo.creadorId
    }));
  }, [mensajes, grupo.creadorId]);

  // Group messages by day for beautiful layout
  const messagesByDay = useMemo(() => {
    const groups = {};
    displayedMessages.forEach((msg) => {
      const dateStr = new Date(msg.fechaEnvio).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(msg);
    });
    return groups;
  }, [displayedMessages]);

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER SUPERIOR (Identical to catalog) */}
      <HeaderAdmin usuario={usuarioSession} />

      {/* Main Container - Full-height Slack-Style 2 Column Workspace */}
      <div className="flex-grow flex overflow-hidden relative" style={{ height: 'calc(100vh - 144px)' }}>
        
        {/* MOBILE SIDEBAR OVERLAY */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          ></div>
        )}

        {/* SIDEBAR IZQUIERDO (240px, fondo blanco, border-r) */}
        <aside className={`w-[240px] border-r border-[#F3F4F6] bg-white flex flex-col flex-shrink-0 h-full z-40 transition-transform duration-300 md:translate-x-0 absolute md:relative ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-[#F3F4F6] flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[15px] text-[#111827] leading-tight truncate max-w-[150px]">
                {grupo.nombre || 'Cohorte SENA 2026-1'}
              </h3>
              <span className="bg-gray-100 text-gray-500 font-bold text-[10px] px-2 py-0.5 rounded mt-1 inline-block uppercase">
                {todosLosMiembros.length} miembros
              </span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 md:hidden"
            >
              <X size={16} />
            </button>
          </div>

          {/* Section: Canales */}
          <div className="p-3 border-b border-[#F3F4F6] overflow-y-auto max-h-[40%] flex-shrink-0">
            <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider pl-2 mb-2 select-none">
              # CANALES
            </h4>
            <div className="flex flex-col gap-0.5">
              {[
                { id: '# general', label: 'general' },
                { id: '# recursos', label: 'recursos' },
                { id: '# dudas-y-preguntas', label: 'dudas-anuncios' }
              ].map((channel) => {
                const isActive = activeChannel === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveChannel(channel.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-[13px] font-semibold transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-[#EFF6FF] text-[#1E40AF] border-l-[3px] border-l-[#1E40AF]' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>#</span>
                    <span className="truncate">{channel.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Sesiones */}
          <div className="p-4 border-b border-[#F3F4F6] flex-shrink-0 select-none">
            <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2.5">
              📅 SESIONES
            </h4>
            <div className="space-y-2 text-[12.5px]">
              {sesiones.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic">No hay clases en vivo programadas</p>
              ) : (
                sesiones.map((s) => {
                  const fecha = new Date(s.fechaInicio);
                  const formatFecha = fecha.toLocaleString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                  return (
                    <a
                      key={s.id}
                      href={s.urlReunion || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-[#EFF6FF] hover:bg-[#DBEAFE] border-l-2 border-[#1E40AF] p-2.5 rounded-[4px] transition-colors no-underline cursor-pointer"
                    >
                      <p className="font-bold text-[#1E40AF] leading-tight text-[11px]">{s.titulo}</p>
                      <p className="text-[10px] text-[#1E40AF]/80 mt-0.5 truncate font-medium">{s.cursoTitulo}</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-1">{formatFecha}</p>
                    </a>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Miembros Activos */}
          <div className="p-4 flex-1 overflow-y-auto select-none">
            <h4 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2.5">
              👥 MIEMBROS ACTIVOS
            </h4>
            <div className="space-y-2">
              {todosLosMiembros.map((m) => (
                <div key={m.id || m.nombre} className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-[10px]">
                      {m.nombre.charAt(0)}
                    </div>
                    {m.active && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-[#10B981] rounded-full border border-white"></div>
                    )}
                  </div>
                  <span className="truncate flex-1 leading-none">{m.nombre}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botón de Abandonar Grupo (Solo Estudiantes / No creadores) */}
          {usuarioSession.id !== grupo.creadorId && (
            <div className="p-4 border-t border-[#F3F4F6] flex-shrink-0">
              <button
                onClick={handleAbandonarGrupo}
                disabled={abandonando}
                className="w-full py-2 px-3 border border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <AlertTriangle size={14} />
                {abandonando ? 'Abandonando...' : 'Abandonar grupo'}
              </button>
            </div>
          )}
        </aside>

        {/* CONTENIDO PRINCIPAL: CANAL #general / #recursos / #dudas-anuncios */}
        <div className="flex-grow flex flex-col h-full bg-white min-w-0">
          
          {/* Header del canal */}
          <div className="h-16 px-4 border-b border-[#F3F4F6] flex items-center justify-between flex-shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded text-gray-500 hover:text-slate-800 md:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h3 className="font-extrabold text-[16.5px] text-[#111827] leading-none flex items-center gap-1.5">
                  {activeChannel}
                </h3>
                <p className="text-[12px] text-[#6B7280] font-normal mt-1 leading-none hidden sm:block">
                  {activeChannel === '# general' && 'Canal principal de comunicación del grupo.'}
                  {activeChannel === '# recursos' && 'Documentos, código y guías complementarias de estudio.'}
                  {activeChannel === '# dudas-y-preguntas' && 'Tablón de avisos y anuncios oficiales de la cohorte.'}
                  {activeChannel !== '# general' && activeChannel !== '# recursos' && activeChannel !== '# dudas-y-preguntas' && 'Espacio colaborativo de discusión.'}
                </p>
              </div>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-1 text-[#6B7280]">
              <button className="p-2 hover:bg-gray-50 rounded hover:text-slate-800"><Search size={15} /></button>
              <button className="p-2 hover:bg-gray-50 rounded hover:text-slate-800"><Users size={15} /></button>
              <button className="p-2 hover:bg-gray-50 rounded hover:text-slate-800"><Info size={15} /></button>
            </div>
          </div>

          {/* ── CANAL CHAT GENERAL (#general) ── */}
          {activeChannel === '# general' && (
            <>
              {/* Chat Area Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
                {loadingChat ? (
                  <div className="py-16 text-center text-[12.5px] text-gray-400 font-medium">
                    Cargando mensajes del canal...
                  </div>
                ) : (
                  Object.keys(messagesByDay).map((day) => (
                    <div key={day} className="space-y-4">
                      
                      {/* Day Separator line centrado */}
                      <div className="flex items-center justify-center my-6 select-none">
                        <div className="flex-grow h-px bg-[#F3F4F6]"></div>
                        <span className="mx-4 text-[11px] font-semibold text-[#9CA3AF] bg-white px-2">
                          {day}
                        </span>
                        <div className="flex-grow h-px bg-[#F3F4F6]"></div>
                      </div>

                      {/* Messages Loop (Slack-Style simple lines, no bubbles!) */}
                      {messagesByDay[day].map((msg) => {
                        const isInstructor = msg.isInstructor;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex gap-3 hover:bg-[#F9FAFB]/60 p-2 rounded transition-colors group/msg relative ${
                              isInstructor ? 'bg-[#EFF6FF] border-l-[3px] border-l-[#1E40AF]' : ''
                            }`}
                          >
                            {/* Avatar Left */}
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[14px] flex-shrink-0 overflow-hidden border border-gray-100 self-start">
                              {msg.remitente.nombre?.charAt(0).toUpperCase()}
                            </div>

                            {/* Message Core Body */}
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[13.5px] text-[#111827]">{msg.remitente.nombre}</span>
                                {isInstructor && (
                                  <span className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] font-bold text-[8.5px] px-1.5 py-0.2 rounded uppercase">
                                    INSTRUCTOR
                                  </span>
                                )}
                                <span className="text-[10px] text-[#9CA3AF]">
                                  {new Date(msg.fechaEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <p className="text-[13.5px] text-[#374151] leading-relaxed font-normal mt-1 whitespace-pre-wrap">
                                {msg.contenido}
                              </p>

                              {/* Hardcoded PDF Attachment card under teacher message */}
                              {isInstructor && msg.contenido.includes('Q&A') && (
                                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-3 mt-3 flex items-center justify-between gap-4 max-w-md select-none">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 bg-red-50 text-red-500 rounded flex items-center justify-center font-bold text-[14px]">
                                      📄
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="font-bold text-[12.5px] text-slate-800 truncate">ejercicios-semana-3.pdf</h5>
                                      <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">1.2 MB · Documento PDF</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => showToast('Descargando archivo adjunto...')}
                                    className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-600 hover:text-[#1E40AF] hover:border-[#1E40AF] text-[11.5px] font-bold rounded-[4px] transition-colors"
                                  >
                                    Descargar
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Floating hover bar on right */}
                            <div className="absolute right-3 top-2 hidden group-hover/msg:flex items-center gap-1 bg-white border border-[#E5E7EB] rounded shadow-xs p-1 select-none">
                              <button onClick={() => showToast('¡Me gusta añadido!')} className="p-1 text-[11px] font-bold hover:bg-gray-50 text-slate-600">👍</button>
                              <button onClick={() => showToast('Comenzando hilo...')} className="p-1 text-[11px] font-bold hover:bg-gray-50 text-slate-600">💬</button>
                            </div>

                          </div>
                        );
                      })}

                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Text Box */}
              <div className="p-4 border-t border-[#F3F4F6] flex-shrink-0 bg-white">
                <form onSubmit={handleEnviarMensaje} className="flex items-center gap-3">
                  {/* Left formatting mini icons */}
                  <div className="flex items-center gap-1 text-gray-400">
                    <button type="button" className="p-2 hover:text-[#1E40AF] rounded"><Paperclip size={18} /></button>
                    <button type="button" className="p-2 hover:text-[#1E40AF] rounded"><Smile size={18} /></button>
                  </div>

                  <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder={`Escribe un mensaje en ${activeChannel}...`}
                    className="flex-grow h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-5 text-[13px] text-[#111827] focus:outline-none focus:border-[#1E40AF] transition-all placeholder-gray-400 font-normal"
                  />

                  <button
                    type="submit"
                    disabled={!nuevoMensaje.trim()}
                    className="w-10 h-10 rounded-full bg-[#1E40AF] hover:bg-[#1A368F] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-colors shadow-sm select-none"
                  >
                    <span className="text-[12px] font-bold">►</span>
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ── CANAL RECURSOS (#recursos) ── */}
          {activeChannel === '# recursos' && (
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="font-extrabold text-[18px] text-[#111827]">Archivos Compartidos</h2>
                  <p className="text-[12.5px] text-[#6B7280] font-normal mt-0.5">Sube y versiona las guías y códigos del curso.</p>
                </div>

                {/* Upload action trigger */}
                <label className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-5 py-2.5 rounded-[4px] text-[13.5px] font-semibold transition-colors cursor-pointer select-none">
                  <span>Subir recurso</span>
                  <input
                    type="file"
                    className="hidden"
                    disabled={subiendoArchivo}
                    onChange={handleSubirArchivo}
                  />
                </label>
              </div>

              {archivoSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded text-[13px] flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{archivoSuccess}</span>
                </div>
              )}

              {archivoError && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-[13px] flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>{archivoError}</span>
                </div>
              )}

              {/* Resources files list */}
              {loadingArchivos ? (
                <div className="text-center py-16 text-gray-400 font-semibold text-[13px]">
                  Cargando archivos del grupo...
                </div>
              ) : archivos.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded p-12 text-center max-w-md mx-auto">
                  <FileText size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-bold text-[15px] text-slate-800">Aún no hay archivos</p>
                  <p className="text-[12px] text-gray-500 mt-1 font-normal">Sube guías o scripts compartidos en este espacio colaborativo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {archivos.map((file) => (
                    <div key={file.id} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 bg-blue-50 text-[#1E40AF] rounded flex items-center justify-center font-bold text-[14px]">
                          📄
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-[13px] text-slate-800 truncate">{file.nombre}</h5>
                          <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">{formatBytes(file.peso)} · Versión {file.version}</span>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        download
                        onClick={() => showToast('Iniciando descarga...')}
                        className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-600 hover:text-[#1E40AF] hover:border-[#1E40AF] text-[11.5px] font-bold rounded-[4px] transition-colors flex items-center gap-1"
                      >
                        <Download size={12} />
                        <span>Descargar</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CANAL ANUNCIOS (#dudas-y-preguntas / #anuncios) ── */}
          {activeChannel === '# dudas-y-preguntas' && (
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="font-extrabold text-[18px] text-[#111827]">Tablón de Anuncios</h2>
                  <p className="text-[12.5px] text-[#6B7280] font-normal mt-0.5">Mensajes importantes publicados por instructores y moderadores.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
                
                {/* Announcements list */}
                <div className="space-y-4">
                  {loadingAvisos ? (
                    <div className="text-center py-16 text-gray-400 font-semibold text-[13px]">
                      Cargando anuncios oficiales...
                    </div>
                  ) : avisos.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded p-12 text-center">
                      <Bell size={36} className="mx-auto text-gray-300 mb-3" />
                      <p className="font-bold text-[14.5px] text-slate-800">Tablón de avisos vacío</p>
                      <p className="text-[12px] text-gray-500 mt-1 font-normal">Los anuncios oficiales se publicarán en esta cartelera.</p>
                    </div>
                  ) : (
                    avisos.map((aviso) => {
                      const esPendiente = aviso.publicado === false || (aviso.fechaProgramada && new Date(aviso.fechaProgramada) > new Date());
                      return (
                        <div key={aviso.id} className={`bg-white border border-gray-100 rounded p-5 shadow-sm border-b-2 ${
                          esPendiente ? 'border-b-amber-500 bg-amber-50/10' : 'border-b-[#1E40AF]'
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <h4 className="font-bold text-[15.5px] text-slate-900 leading-tight">{aviso.titulo}</h4>
                            {esPendiente && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[9px] px-2 py-0.5 rounded uppercase select-none">
                                Programado: {new Date(aviso.fechaProgramada).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-[13.5px] text-[#4B5563] leading-relaxed font-normal whitespace-pre-wrap">{aviso.contenido}</p>
                          
                          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50 text-[11px] text-gray-400 font-medium">
                            <span>Por {aviso.autor?.nombre || 'Instructor'}</span>
                            <span>{new Date(aviso.creado).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Create Announcement box (Instructor only) */}
                {usuarioSession.rol === 'instructor' || usuarioSession.rol === 'admin' ? (
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-5 space-y-4">
                    <h4 className="font-bold text-[14.5px] text-slate-800">Crear anuncio</h4>
                    
                    {avisoSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded text-[11.5px] flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        <span>{avisoSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleCrearAviso} className="space-y-3.5">
                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1">Título *</label>
                        <input
                          type="text"
                          required
                          value={nuevoAviso.titulo}
                          onChange={(e) => setNuevoAviso(prev => ({ ...prev, titulo: e.target.value }))}
                          placeholder="Ej. Clase reprogramada"
                          className="w-full h-10 border border-gray-300 rounded px-3 text-[13px] bg-white text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1">Mensaje *</label>
                        <textarea
                          required
                          rows={3}
                          value={nuevoAviso.contenido}
                          onChange={(e) => setNuevoAviso(prev => ({ ...prev, contenido: e.target.value }))}
                          placeholder="Escribe el aviso oficial..."
                          className="w-full border border-gray-300 rounded p-2.5 text-[13px] bg-white text-slate-800 focus:outline-none resize-none focus:border-[#1E40AF]"
                        />
                      </div>

                      {/* PROGRAMAR CHECKBOX & INPUT */}
                      <div className="bg-white border border-gray-200 rounded p-3 space-y-2 select-none">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={programar}
                            onChange={(e) => setProgramar(e.target.checked)}
                            className="rounded border-gray-300 text-[#1E40AF] focus:ring-[#1E40AF]"
                          />
                          <span className="text-[12.5px] font-semibold text-slate-700">Programar publicación</span>
                        </label>
                        
                        {programar && (
                          <div className="pt-1">
                            <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Fecha y Hora *</label>
                            <input
                              type="datetime-local"
                              required
                              value={fechaProg}
                              onChange={(e) => setFechaProg(e.target.value)}
                              className="w-full h-9 border border-gray-300 rounded px-2 text-[12px] bg-white text-slate-800 focus:outline-none focus:border-[#1E40AF]"
                            />
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={creandoAviso}
                        className="w-full h-10 bg-[#1E40AF] hover:bg-[#1A368F] text-white rounded text-[12.5px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {creandoAviso ? 'Publicando...' : programar ? 'Programar aviso' : 'Publicar aviso'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded p-4 text-[12px] text-[#1E3A8A] font-normal leading-relaxed">
                    💡 <strong>Tablón Informativo</strong>: En este canal los estudiantes solo tienen permisos de lectura para avisos importantes.
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

      </div>

      {/* FOOTER OSCURO (#171717) */}
      <footer className="bg-[#171717] text-white py-8 px-6 lg:px-8 flex-shrink-0 border-t border-[#262626] z-10 select-none">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[12.5px] text-gray-400">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-bold text-white tracking-wider">SABERHUB LEARNING PLATFORM</span>
            <span className="font-normal text-[11px] text-gray-500">© 2026 SABERHUB. Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-6 flex-wrap justify-center font-medium">
            <Link href="/terminos" className="hover:text-white transition-colors no-underline">Términos y condiciones</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors no-underline">Política de Privacidad</Link>
            <Link href="/docs" className="hover:text-white transition-colors no-underline">Documentación API</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
