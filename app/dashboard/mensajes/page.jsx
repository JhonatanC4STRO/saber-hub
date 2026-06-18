'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Users,
  MessageSquare,
  X,
  ArrowLeft,
  CheckCheck,
  Paperclip,
  Info,
  FileText,
  AlertCircle,
  BookOpen,
  Filter
} from 'lucide-react';
import HeaderAdmin from '../components/HeaderAdmin';

export default function MensajesPage() {
  const [usuario, setUsuario] = useState(null);
  const [conversaciones, setConversaciones] = useState([]);
  const [loadingConversaciones, setLoadingConversaciones] = useState(true);
  const [activeChat, setActiveChat] = useState(null); // holds a conversation object
  const [initializedFromUrl, setInitializedFromUrl] = useState(false);

  // Active chat details
  const [mensajes, setMensajes] = useState([]);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [nuevoAsunto, setNuevoAsunto] = useState('');

  // New Chat Dialog & Contact selection
  const [mostrarNuevoChat, setMostrarNuevoChat] = useState(false);
  const [contactos, setContactos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [loadingContactos, setLoadingContactos] = useState(false);
  const [busquedaContactos, setBusquedaContactos] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('todos');

  // UI states
  const [busquedaConversaciones, setBusquedaConversaciones] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat' | 'info'
  const [showRightPanel, setShowRightPanel] = useState(true); // default true for desktop 3-column

  const messagesEndRef = useRef(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Fetch current user
  const obtenerUsuario = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const u = await res.json();
        setUsuario(u);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  }, []);

  // 2. Fetch conversations list
  const cargarConversaciones = useCallback(async (silently = false) => {
    if (!silently) {
      await Promise.resolve();
      setLoadingConversaciones(true);
    }
    try {
      const res = await fetch('/api/mensajes');
      if (res.ok) {
        const data = await res.json();
        const convList = data.conversaciones || [];
        setConversaciones(convList);
        
        // Auto select first conversation on load if on desktop and none selected
        // Bypass if contactId is in URL to prevent flash override
        const hasUrlContact = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('contactId');
        if (!hasUrlContact && convList.length > 0 && !activeChat && typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActiveChat(convList[0]);
        }
      }
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    } finally {
      if (!silently) setLoadingConversaciones(false);
    }
  }, [activeChat]);

  // Initialize
  useEffect(() => {
    obtenerUsuario();
    cargarConversaciones();
  }, [obtenerUsuario, cargarConversaciones]);

  // Periodic polling for new messages & conversation list update (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      cargarConversaciones(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [cargarConversaciones]);

  // 3. Mark conversation as read
  const marcarComoLeido = async (chat) => {
    try {
      const body = chat.isGroup ? { grupoId: chat.group.id } : { contactId: chat.contact.id };

      await fetch('/api/mensajes/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // Update state locally
      setConversaciones((prev) =>
        prev.map((c) => (c.key === chat.key ? { ...c, unreadCount: 0 } : c))
      );
    } catch (error) {
      console.error('Error al marcar leído:', error);
    }
  };

  // 4. Load messages for the active conversation
  const cargarMensajes = useCallback(async (chat, silently = false) => {
    if (!chat) return;
    if (!silently) {
      await Promise.resolve();
      setLoadingMensajes(true);
    }
    try {
      const queryParam = chat.isGroup ? `grupoId=${chat.group.id}` : `usuarioId=${chat.contact.id}`;

      const res = await fetch(`/api/mensajes/chat?${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setMensajes(data.mensajes || []);

        // Auto mark as read when loading chat
        if (chat.unreadCount > 0) {
          marcarComoLeido(chat);
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes del chat:', error);
    } finally {
      if (!silently) setLoadingMensajes(false);
    }
  }, []);

  // Load active chat messages on selection
  useEffect(() => {
    if (activeChat) {
      cargarMensajes(activeChat);
      setMobileView('chat');
    }
  }, [activeChat, cargarMensajes]);

  // Polling for active chat messages (every 4 seconds)
  useEffect(() => {
    if (!activeChat) return;
    const interval = setInterval(() => {
      cargarMensajes(activeChat, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChat, cargarMensajes]);

  // Auto Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // 5. Send message
  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !activeChat) return;

    const body = activeChat.isGroup
      ? { grupoId: activeChat.group.id, contenido: nuevoMensaje }
      : {
          destinatarioId: activeChat.contact.id,
          asunto: nuevoAsunto.trim() || null,
          contenido: nuevoMensaje,
        };

    try {
      const res = await fetch('/api/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const msg = await res.json();
        setMensajes((prev) => [
          ...prev,
          {
            ...msg,
            remitente: {
              id: usuario.id,
              nombre: usuario.nombre,
              imagen: usuario.imagen,
            },
          },
        ]);
        setNuevoMensaje('');
        setNuevoAsunto('');
        // Refresh conversation list to display last message
        cargarConversaciones(true);
      } else {
        const err = await res.json();
        showToast('Error: ' + err.error, 'error');
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  // 6. Open "New Chat" modal and fetch contact candidates
  const abrirNuevoChat = async () => {
    setMostrarNuevoChat(true);
    setLoadingContactos(true);
    setBusquedaContactos('');
    setFiltroCurso('todos');
    try {
      const res = await fetch('/api/mensajes/contactos');
      if (res.ok) {
        const data = await res.json();
        setContactos(data.contactos || []);
        setGrupos(data.grupos || []);
        setCursosInscritos(data.cursosInscritos || []);
      }
    } catch (error) {
      console.error('Error al cargar contactos para nuevo chat:', error);
    } finally {
      setLoadingContactos(false);
    }
  };

  // 7. Select a contact or group to start conversation
  const iniciarChatCon = useCallback((dest, isGroupChat = false) => {
    setMostrarNuevoChat(false);

    const key = isGroupChat ? `group_${dest.id}` : `user_${dest.id}`;
    const existing = conversaciones.find((c) => c.key === key);

    if (existing) {
      setActiveChat(existing);
    } else {
      // Create a temporary local active conversation
      const tempChat = {
        key,
        isGroup: isGroupChat,
        contact: isGroupChat ? null : {
          ...dest,
          rol: dest.rol || 'alumno'
        },
        group: isGroupChat ? dest : null,
        unreadCount: 0,
        temp: true,
      };
      setActiveChat(tempChat);
      setMensajes([]);
    }
  }, [conversaciones]);

  // Effect to handle ?contactId=XXX in URL and open direct chat on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !loadingConversaciones && !initializedFromUrl) {
      const params = new URLSearchParams(window.location.search);
      const contactId = params.get('contactId');
      if (contactId) {
        Promise.resolve().then(() => setInitializedFromUrl(true));
        const key = `user_${contactId}`;
        const existing = conversaciones.find((c) => c.key === key);
        if (existing) {
          setActiveChat(existing);
        } else {
          const fetchAndStartChat = async () => {
            try {
              const res = await fetch('/api/mensajes/contactos');
              if (res.ok) {
                const data = await res.json();
                const contact = data.contactos?.find((c) => c.id === contactId);
                if (contact) {
                  iniciarChatCon(contact, false);
                }
              }
            } catch (err) {
              console.error('Error fetching contact for direct chat:', err);
            }
          };
          fetchAndStartChat();
        }
      } else {
        Promise.resolve().then(() => setInitializedFromUrl(true));
      }
    }
  }, [loadingConversaciones, conversaciones, initializedFromUrl, iniciarChatCon]);

  // Filter conversations
  const filteredConversaciones = conversaciones.filter((chat) => {
    const search = busquedaConversaciones.toLowerCase();
    if (chat.isGroup) {
      return chat.group.nombre.toLowerCase().includes(search);
    }
    return chat.contact.nombre.toLowerCase().includes(search);
  });

  // Filter contacts inside New Chat dialog — by search text AND by selected course
  const filteredContactos = contactos.filter((c) => {
    const searchMatch =
      c.nombre.toLowerCase().includes(busquedaContactos.toLowerCase()) ||
      c.email.toLowerCase().includes(busquedaContactos.toLowerCase()) ||
      (c.cursosCompartidos && c.cursosCompartidos.some(curso => curso.toLowerCase().includes(busquedaContactos.toLowerCase())));

    const cursoMatch =
      filtroCurso === 'todos' ||
      (c.cursosCompartidos && c.cursosCompartidos.some(curso => {
        const selectedCurso = cursosInscritos.find(ci => ci.id === filtroCurso);
        return selectedCurso && curso === selectedCurso.titulo;
      }));

    return searchMatch && cursoMatch;
  });

  const filteredGrupos = grupos.filter((g) =>
    g.nombre.toLowerCase().includes(busquedaContactos.toLowerCase())
  );

  // Group messages by date helper
  const groupedMessages = useMemo(() => {
    const groups = {};
    mensajes.forEach((msg) => {
      const dateStr = new Date(msg.fechaEnvio).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(msg);
    });
    return groups;
  }, [mensajes]);

  // Right Column profile details are loaded dynamically from activeChat contact

  return (
    <div className="flex flex-col min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[4000] flex items-center gap-2 border rounded-lg px-4 py-3 shadow-md transform transition-all duration-300 ${
          toast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle size={18} />
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Superior */}
      <HeaderAdmin usuario={usuario} />

      {/* Main Container - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        
        {/* COLUMNA 1: LISTA DE CONVERSACIONES (280px) */}
        <div className={`w-full md:w-[280px] bg-white border-r border-[#F3F4F6] flex-shrink-0 flex flex-col h-full ${
          mobileView === 'list' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-[#F3F4F6] flex items-center justify-between">
            <h2 className="font-bold text-[18px] text-[#111827]">Mensajes</h2>
            <button
              onClick={abrirNuevoChat}
              className="text-[#1E40AF] hover:bg-blue-50 border border-[#1E40AF] px-3 py-1 rounded-[4px] text-[12px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              ✏ Nuevo
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-[#F3F4F6]">
            <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 h-9 focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#1E40AF]/15 transition-all">
              <Search size={14} className="text-[#9CA3AF] mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar conversación..."
                value={busquedaConversaciones}
                onChange={(e) => setBusquedaConversaciones(e.target.value)}
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-[12px] text-[#111827] placeholder-[#9CA3AF] focus-none-important"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingConversaciones ? (
              <div className="p-6 text-center text-[12px] text-gray-400 font-medium">
                Cargando conversaciones...
              </div>
            ) : filteredConversaciones.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare size={28} className="mx-auto mb-2 text-gray-200" />
                <p className="font-bold text-[13px] text-gray-700">Sin mensajes</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Inicia un chat presionando el botón &quot;✏ Nuevo&quot; de arriba.
                </p>
              </div>
            ) : (
              filteredConversaciones.map((chat) => {
                const isActive = activeChat?.key === chat.key;
                const isUnread = chat.unreadCount > 0;
                const displayName = chat.isGroup ? chat.group.nombre : chat.contact.nombre;
                const subtext = chat.lastMessage
                  ? chat.lastMessage.contenido
                  : 'Conversación vacía';

                return (
                  <div
                    key={chat.key}
                    onClick={() => {
                      setActiveChat(chat);
                      setMobileView('chat');
                    }}
                    className={`flex items-center gap-3 p-3.5 cursor-pointer hover:bg-[#F9FAFB] transition-colors relative ${
                      isActive ? 'bg-[#EFF6FF] border-l-[3px] border-l-[#1E40AF]' : ''
                    }`}
                  >
                    {/* Circular Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[15px] border border-gray-100 overflow-hidden">
                        {chat.isGroup ? (
                          <Users size={18} />
                        ) : chat.contact.imagen ? (
                          <img src={chat.contact.imagen} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      {/* Unread blue dot indicator */}
                      {isUnread && (
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#1E40AF] rounded-full border border-white"></div>
                      )}
                    </div>

                    {/* Chat details */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={`text-[13px] truncate ${
                          isUnread ? 'font-bold text-[#111827]' : 'font-semibold text-[#374151]'
                        }`}>
                          {displayName}
                        </h4>
                        {chat.lastMessage && (
                          <span className="text-[10px] text-[#9CA3AF] flex-shrink-0">
                            {new Date(chat.lastMessage.fechaEnvio).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <p className={`text-[12px] truncate ${
                        isUnread ? 'font-semibold text-[#111827]' : 'text-[#6B7280]'
                      }`}>
                        {subtext}
                      </p>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA 2: CONVERSACIÓN ACTIVA (FLEX 1) */}
        <div className={`flex-1 bg-white flex flex-col h-full ${
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        }`}>
          {activeChat ? (
            <>
              {/* Header */}
              <div className="h-16 px-4 border-b border-[#F3F4F6] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {/* Back button (Mobile only) */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1 text-gray-500 hover:text-[#1E40AF] cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[14px] border border-gray-100 overflow-hidden">
                    {activeChat.isGroup ? (
                      <Users size={16} />
                    ) : activeChat.contact.imagen ? (
                      <img src={activeChat.contact.imagen} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      activeChat.contact.nombre.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[14.5px] text-[#111827]">
                        {activeChat.isGroup ? activeChat.group.nombre : activeChat.contact.nombre}
                      </h3>
                      {!activeChat.isGroup && (
                        <span className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] font-bold text-[9px] px-1.5 py-0.2 rounded uppercase">
                          {activeChat.contact.rol}
                        </span>
                      )}
                    </div>
                    {/* Status Dot */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                      <span className="text-[10px] text-[#9CA3AF] font-medium">En línea</span>
                    </div>
                  </div>
                </div>

                {/* Right header action triggers */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (mobileView === 'chat') {
                        setMobileView('info');
                      } else {
                        setShowRightPanel(!showRightPanel);
                      }
                    }}
                    className={`p-2 rounded hover:bg-gray-100 text-[#6B7280] hover:text-[#1E40AF] cursor-pointer transition-colors ${
                      (!activeChat.isGroup && showRightPanel) || mobileView === 'info' ? 'text-[#1E40AF] bg-blue-50/55' : ''
                    }`}
                    title="Información del contacto"
                  >
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* Chat messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
                {loadingMensajes ? (
                  <div className="p-8 text-center text-[12px] text-gray-400 font-medium">
                    Cargando mensajes...
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="p-16 text-center max-w-sm mx-auto">
                    <MessageSquare size={36} className="mx-auto mb-3 text-[#D1D5DB]" />
                    <h4 className="font-bold text-[15px] text-slate-800">¡Saluda! 👋</h4>
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                      Envía un mensaje para comenzar la conversación con tu instructor o compañero de curso.
                    </p>
                  </div>
                ) : (
                  Object.keys(groupedMessages).map((date) => (
                    <div key={date} className="space-y-4">
                      {/* Date Separator with side lines */}
                      <div className="flex items-center justify-center my-6 select-none">
                        <div className="flex-grow h-px bg-[#E5E7EB]"></div>
                        <span className="mx-4 text-[11px] font-semibold text-[#9CA3AF] bg-white px-2">
                          {date}
                        </span>
                        <div className="flex-grow h-px bg-[#E5E7EB]"></div>
                      </div>

                      {/* Messages loop */}
                      {groupedMessages[date].map((msg) => {
                        const isMe = msg.remitenteId === usuario?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 max-w-[80%] ${
                              isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                            }`}
                          >
                            {/* Left avatar for received messages */}
                            {!isMe && (
                              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[12px] flex-shrink-0 overflow-hidden border border-gray-100 self-end">
                                {msg.remitente?.imagen ? (
                                  <img src={msg.remitente.imagen} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  msg.remitente?.nombre?.charAt(0).toUpperCase()
                                )}
                              </div>
                            )}

                            {/* Message content bubble wrapper */}
                            <div className="flex flex-col">
                              {/* Subject line (optional) */}
                              {msg.asunto && (
                                <div className="text-[11px] font-bold text-[#1E40AF] mb-1 pl-1">
                                  Asunto: {msg.asunto}
                                </div>
                              )}
                              
                              <div className={`p-3 rounded-lg text-[13px] leading-relaxed font-normal whitespace-pre-wrap ${
                                isMe 
                                  ? 'bg-[#1E40AF] text-white rounded-br-none shadow-sm' 
                                  : 'bg-[#F3F4F6] text-[#374151] rounded-bl-none border border-gray-100'
                              }`}>
                                {msg.contenido}
                              </div>

                              {/* Timestamp and checks */}
                              <div className={`flex items-center gap-1 mt-1 text-[10px] text-[#9CA3AF] ${
                                isMe ? 'justify-end' : 'justify-start pl-1'
                              }`}>
                                <span>
                                  {new Date(msg.fechaEnvio).toLocaleTimeString('es-CO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMe && (
                                  <CheckCheck size={11} className={msg.leido ? 'text-[#38BDF8]' : 'text-[#94A3B8]'} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message inputs box */}
              <div className="p-4 border-t border-[#F3F4F6] flex-shrink-0 bg-white">
                <form onSubmit={enviarMensaje} className="space-y-2">
                  
                  {/* Optional Subject input (1-to-1 only) */}
                  {!activeChat.isGroup && (
                    <input
                      type="text"
                      placeholder="Asunto (opcional)..."
                      value={nuevoAsunto}
                      onChange={(e) => setNuevoAsunto(e.target.value)}
                      className="w-full h-8 px-3 border border-gray-200 rounded-[4px] text-[11px] focus:outline-none focus:border-[#1E40AF] bg-white text-[#374151] placeholder-gray-400 font-medium"
                    />
                  )}

                  <div className="flex items-center gap-3">
                    {/* Attachment icon */}
                    <button
                      type="button"
                      className="p-2 text-[#6B7280] hover:text-[#1E40AF] rounded hover:bg-gray-50 flex-shrink-0 cursor-pointer transition-colors"
                      title="Adjuntar archivo"
                    >
                      <Paperclip size={18} />
                    </button>

                    {/* Text field */}
                    <input
                      type="text"
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-grow h-11 bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-5 text-[13px] text-[#111827] placeholder-gray-400 focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-all"
                    />

                    {/* Send button (Cisco-style) */}
                    <button
                      type="submit"
                      disabled={!nuevoMensaje.trim()}
                      className="w-10 h-10 rounded-full bg-[#1E40AF] hover:bg-[#1A368F] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                      title="Enviar"
                    >
                      <span className="text-[12px] font-bold">►</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            // Placeholder when no chat active
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
              <div className="w-[80px] h-[80px] rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center mb-5 flex-shrink-0 shadow-sm">
                <MessageSquare size={36} />
              </div>
              <h2 className="text-[20px] font-bold text-[#111827]">Bandeja de Mensajería</h2>
              <p className="text-[13.5px] text-[#6B7280] mt-1 max-w-[340px] leading-relaxed">
                Selecciona una conversación existente de la lista o crea una nueva para comunicarte con tus instructores, tutores y compañeros de grupo.
              </p>
              <button
                onClick={abrirNuevoChat}
                className="mt-6 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-5 py-2.5 rounded-[4px] text-[13px] font-semibold cursor-pointer transition-colors"
              >
                Comenzar chat
              </button>
            </div>
          )}
        </div>

        {/* COLUMNA 3: PANEL DE INFORMACIÓN DEL CONTACTO (240px) */}
        {activeChat && !activeChat.isGroup && (showRightPanel || mobileView === 'info') && (
          <div className={`w-full md:w-[240px] bg-[#F9FAFB] border-l border-[#F3F4F6] flex-shrink-0 flex flex-col h-full overflow-y-auto ${
            mobileView === 'info' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Header info (Mobile only) */}
            <div className="p-3 border-b border-[#F3F4F6] flex items-center justify-between md:hidden bg-white">
              <span className="font-bold text-[13px] text-gray-700">Detalles del contacto</span>
              <button
                onClick={() => setMobileView('chat')}
                className="text-gray-500 hover:text-red-500 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile widget */}
            <div className="p-6 flex flex-col items-center text-center border-b border-[#F3F4F6] bg-white">
              <div className="w-18 h-18 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold text-[22px] border border-gray-150 overflow-hidden mb-3.5 shadow-sm">
                {activeChat.contact.imagen ? (
                  <img src={activeChat.contact.imagen} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  activeChat.contact.nombre.charAt(0).toUpperCase()
                )}
              </div>
              <h3 className="font-bold text-[13.5px] text-[#111827] leading-snug">
                {activeChat.contact.nombre}
              </h3>
              
              {/* Role badge */}
              <div className="mt-2">
                {activeChat.contact.rol === 'admin' && (
                  <span className="bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                    Administrador
                  </span>
                )}
                {activeChat.contact.rol === 'instructor' && (
                  <span className="bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                    Instructor
                  </span>
                )}
                {activeChat.contact.rol === 'alumno' && (
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                    Aprendiz
                  </span>
                )}
                {activeChat.contact.rol !== 'admin' && activeChat.contact.rol !== 'instructor' && activeChat.contact.rol !== 'alumno' && (
                  <span className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                    {activeChat.contact.rol || 'Usuario'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                <span className="text-[10.5px] text-[#10B981] font-semibold">En línea</span>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-4 flex-grow space-y-4 font-sans">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] pl-1">
                Información de contacto
              </h4>
              
              <div className="space-y-3 text-[12px] font-medium text-slate-700">
                {/* Email row */}
                <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</span>
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <span className="truncate text-slate-800 font-semibold" title={activeChat.contact.email}>
                      {activeChat.contact.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeChat.contact.email);
                        showToast('Correo copiado al portapapeles');
                      }}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex-shrink-0"
                      title="Copiar correo"
                    >
                      <span className="text-[11px]">📋</span>
                    </button>
                  </div>
                </div>

                {/* Rol row */}
                <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rol de usuario</span>
                  <span className="text-slate-850 font-bold capitalize">
                    {activeChat.contact.rol === 'alumno' ? 'Aprendiz' : activeChat.contact.rol === 'admin' ? 'Administrador' : activeChat.contact.rol}
                  </span>
                </div>

                {/* Document row */}
                <div className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Documento de identidad</span>
                  <span className="text-slate-850 font-bold font-mono">
                    {activeChat.contact.documento || 'No registrado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-white border-t border-[#F3F4F6] space-y-2 flex-shrink-0">
              <a
                href={`mailto:${activeChat.contact.email}`}
                className="w-full py-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white text-[11.5px] font-bold rounded-[4px] cursor-pointer transition-colors flex items-center justify-center gap-1.5 no-underline shadow-sm"
              >
                ✉️ Enviar correo externo
              </a>
              <Link
                href={`/dashboard/usuarios/${activeChat.contact.id}`}
                className="w-full py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11.5px] font-bold rounded-[4px] cursor-pointer transition-colors flex items-center justify-center no-underline"
              >
                Ver perfil completo
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* NEW CHAT MODAL DIALOG */}
      {mostrarNuevoChat && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-[3px] z-[5000] flex items-center justify-center p-4">
          <div className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#F3F4F6] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[16px] text-[#111827]">Nueva conversación</h3>
                <p className="text-[11px] text-[#6B7280] mt-0.5">Selecciona un compañero, instructor o grupo para enviar un mensaje</p>
              </div>
              <button
                onClick={() => setMostrarNuevoChat(false)}
                className="text-[#9CA3AF] hover:text-[#111827] cursor-pointer transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search + Course Filter */}
            <div className="p-4 border-b border-[#F3F4F6] space-y-2.5">
              <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3.5 h-10 focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#1E40AF]/15 transition-all">
                <Search size={15} className="text-[#9CA3AF] mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o curso..."
                  value={busquedaContactos}
                  onChange={(e) => setBusquedaContactos(e.target.value)}
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-[13px] text-[#111827] placeholder-[#9CA3AF] focus-none-important"
                />
              </div>

              {/* Course filter dropdown — only shown for students with enrolled courses */}
              {cursosInscritos.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[#6B7280]">
                    <Filter size={13} />
                    <span className="text-[11px] font-semibold">Filtrar por curso:</span>
                  </div>
                  <select
                    value={filtroCurso}
                    onChange={(e) => setFiltroCurso(e.target.value)}
                    className="flex-1 text-[12px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 h-8 text-[#111827] outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]/20 transition-all cursor-pointer"
                  >
                    <option value="todos">Todos mis cursos</option>
                    {cursosInscritos.map((c) => (
                      <option key={c.id} value={c.id}>{c.titulo}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Scrollable selections list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {loadingContactos ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-[#1E40AF]/30 border-t-[#1E40AF] rounded-full animate-spin mb-3"></div>
                  <p className="text-[12px] text-gray-400 font-medium">Cargando miembros disponibles...</p>
                </div>
              ) : (
                <>
                  {/* Groups list */}
                  {filteredGrupos.length > 0 && filtroCurso === 'todos' && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2.5 flex items-center gap-1.5">
                        <Users size={12} />
                        Grupos de estudio ({filteredGrupos.length})
                      </h4>
                      <div className="space-y-0.5">
                        {filteredGrupos.map((g) => (
                          <div
                            key={g.id}
                            onClick={() => iniciarChatCon(g, true)}
                            className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-[#EFF6FF] transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold flex-shrink-0 group-hover:bg-[#1E40AF] group-hover:text-white transition-colors">
                              <Users size={16} />
                            </div>
                            <div>
                              <h5 className="font-bold text-[12.5px] text-[#111827]">{g.nombre}</h5>
                              <p className="text-[11px] text-[#6B7280]">{g.descripcion || 'Grupo de estudio'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members/Users candidates list */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2.5 flex items-center gap-1.5">
                      <MessageSquare size={12} />
                      {filtroCurso !== 'todos'
                        ? `Compañeros en el curso (${filteredContactos.length})`
                        : `Miembros disponibles (${filteredContactos.length})`
                      }
                    </h4>
                    {filteredContactos.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-[#F3F4F6] mx-auto mb-3 flex items-center justify-center">
                          <AlertCircle size={22} className="text-[#9CA3AF]" />
                        </div>
                        <p className="text-[13px] text-[#6B7280] font-medium mb-1">
                          No se encontraron compañeros
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">
                          {filtroCurso !== 'todos'
                            ? 'No hay compañeros inscritos en este curso. Prueba seleccionando otro curso.'
                            : busquedaContactos
                              ? 'Intenta con otro término de búsqueda.'
                              : 'Aún no tienes compañeros inscritos en tus cursos.'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredContactos.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => iniciarChatCon(c, false)}
                            className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-[#EFF6FF] transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center font-bold flex-shrink-0 overflow-hidden border border-gray-100 font-sans group-hover:border-[#1E40AF]/30 transition-colors">
                              {c.imagen ? (
                                <img src={c.imagen} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                c.nombre?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-[12.5px] text-[#111827] truncate">{c.nombre}</h5>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border flex-shrink-0 ${
                                  c.rol === 'admin' 
                                    ? 'bg-red-50 border-red-200 text-red-700' 
                                    : c.rol === 'instructor' 
                                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>
                                  {c.rol === 'alumno' ? 'aprendiz' : c.rol}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#6B7280] truncate">{c.email}</p>
                              {c.cursosCompartidos && c.cursosCompartidos.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <BookOpen size={10} className="text-[#1E40AF] flex-shrink-0" />
                                  <p className="text-[10px] text-[#1E40AF] truncate font-medium">
                                    {c.cursosCompartidos.join(' · ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
