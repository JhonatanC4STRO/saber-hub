'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, Check, Trash2, CheckSquare, ArrowLeft, RefreshCw, MailOpen,
  BookOpen, Award, FileText, MessageSquare, Video, Info, UserCheck, Settings,
  AlertCircle
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';

const NOTIF_CONFIG = {
  inscripcion: {
    bg: 'bg-blue-50 border-blue-100',
    text: 'text-blue-600',
    icon: BookOpen,
    label: 'Inscripción'
  },
  evaluacion: {
    bg: 'bg-red-50 border-red-100',
    text: 'text-red-600',
    icon: FileText,
    label: 'Evaluación'
  },
  certificado: {
    bg: 'bg-amber-50 border-amber-100',
    text: 'text-amber-600',
    icon: Award,
    label: 'Certificado'
  },
  foro: {
    bg: 'bg-emerald-50 border-emerald-100',
    text: 'text-emerald-600',
    icon: MessageSquare,
    label: 'Foro'
  },
  mensaje: {
    bg: 'bg-purple-50 border-purple-100',
    text: 'text-purple-600',
    icon: MessageSquare,
    label: 'Mensaje'
  },
  sistema: {
    bg: 'bg-indigo-50 border-indigo-100',
    text: 'text-indigo-600',
    icon: Info,
    label: 'Sistema'
  },
  solicitud_instructor: {
    bg: 'bg-pink-50 border-pink-100',
    text: 'text-pink-600',
    icon: UserCheck,
    label: 'Solicitud'
  },
  sesion: {
    bg: 'bg-teal-50 border-teal-100',
    text: 'text-teal-600',
    icon: Video,
    label: 'Sesión'
  },
  default: {
    bg: 'bg-gray-50 border-gray-100',
    text: 'text-gray-600',
    icon: Bell,
    label: 'Notificación'
  }
};

function NotificationIcon({ tipo }) {
  const conf = NOTIF_CONFIG[tipo] || NOTIF_CONFIG.default;
  const IconComponent = conf.icon;
  return (
    <div className={`p-2.5 rounded-xl border ${conf.bg} ${conf.text} flex-shrink-0`}>
      <IconComponent size={20} />
    </div>
  );
}

export default function NotificacionesPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Pagination & Filtering
  const [filtro, setFiltro] = useState('todas'); // todas | no-leidas | leidas
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch User Details
  useEffect(() => {
    async function obtenerUsuario() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const u = await res.json();
          setUsuario(u);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      }
    }
    obtenerUsuario();
  }, [router]);

  // Fetch Notifications List
  const fetchNotificaciones = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        filtro
      });
      const res = await fetch(`/api/notificaciones?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data.notificaciones);
        setPages(data.pages);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filtro]);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  // Mark a single notification as read
  const handleMarkAsRead = async (id, urlDestino = null) => {
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        // Optimistic update
        setNotificaciones(prev =>
          prev.map(n => (n.id === id ? { ...n, leida: true } : n))
        );
        // Update unread counter locally
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (urlDestino) {
          router.push(urlDestino);
        } else {
          fetchNotificaciones();
        }
      }
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marcarTodas: true }),
      });
      if (res.ok) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        setUnreadCount(0);
        fetchNotificaciones();
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation(); // Avoid triggering details redirect
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotificaciones(prev => prev.filter(n => n.id !== id));
        fetchNotificaciones();
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (notificaciones.length === 0 || actionLoading) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente todas tus notificaciones?')) return;
    
    setActionLoading(true);
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eliminarTodas: true }),
      });
      if (res.ok) {
        setNotificaciones([]);
        setUnreadCount(0);
        fetchNotificaciones();
      }
    } catch (error) {
      console.error('Error al limpiar notificaciones:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <HeaderAdmin usuario={usuario} />

      <main className="max-w-[800px] w-full mx-auto px-4 md:px-6 py-8 flex-grow">
        {/* Top bar & navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#64748B] hover:text-[#1E293B] font-semibold text-[13px] transition-colors"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          
          <Link
            href="/dashboard/notificaciones/preferencias"
            className="flex items-center gap-2 border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#475569] hover:text-[#1E293B] font-semibold text-[13px] px-4 py-2 rounded-xl transition-all shadow-sm no-underline"
          >
            <Settings size={15} />
            Ajustes de alertas
          </Link>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">
            Centro de notificaciones
          </h1>
          <p className="text-[14px] text-[#64748B] leading-relaxed">
            Mantente al día con el progreso de tus cursos, evaluaciones pendientes, foros, mensajes internos y certificaciones oficiales.
          </p>
        </div>

        {/* Controls block */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'no-leidas', label: `No leídas ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
              { id: 'leidas', label: 'Leídas' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setFiltro(tab.id); setPage(1); }}
                className={`px-4 py-2 rounded-lg font-semibold text-[13px] transition-all cursor-pointer ${filtro === tab.id ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] font-bold text-[12px] px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-60"
              >
                <CheckSquare size={14} />
                Marcar todas
              </button>
            )}
            {notificaciones.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={actionLoading}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold text-[12px] px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-60"
              >
                <Trash2 size={14} />
                Limpiar todo
              </button>
            )}
          </div>
        </div>

        {/* Feed container */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <RefreshCw className="animate-spin text-[#1E40AF]" size={32} />
              <p className="text-[13px] text-[#64748B] font-medium">Buscando notificaciones...</p>
            </div>
          ) : notificaciones.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <Bell size={24} className="text-[#94A3B8]" />
              </div>
              <h3 className="font-bold text-[16px] text-[#0F172A] mb-1">Sin notificaciones</h3>
              <p className="text-[13px] text-[#64748B] max-w-[320px] leading-relaxed">
                {filtro === 'no-leidas' 
                  ? '¡Excelente! Estás al día, no tienes notificaciones sin leer.'
                  : filtro === 'leidas'
                    ? 'No tienes notificaciones marcadas como leídas todavía.'
                    : 'Aquí aparecerán tus notificaciones en tiempo real.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {notificaciones.map((notif) => {
                const conf = NOTIF_CONFIG[notif.tipo] || NOTIF_CONFIG.default;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id, notif.urlDestino)}
                    className={`flex items-start gap-4 p-5 transition-all cursor-pointer relative group ${notif.leida ? 'opacity-75 hover:bg-[#FAFAFA]' : 'bg-blue-50/20 hover:bg-blue-50/40'}`}
                  >
                    {/* Unread indicator vertical strip */}
                    {!notif.leida && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1E40AF]" />
                    )}

                    {/* Icon */}
                    <NotificationIcon tipo={notif.tipo} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {conf.label}
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                          · {new Date(notif.fechaEnvio).toLocaleDateString('es-CO', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <h4 className={`text-[14px] leading-snug mb-1 ${notif.leida ? 'text-[#334155] font-medium' : 'text-[#0F172A] font-bold'}`}>
                        {notif.titulo}
                      </h4>
                      
                      {notif.contenido && (
                        <p className="text-[13px] text-[#64748B] leading-relaxed break-words">
                          {notif.contenido}
                        </p>
                      )}
                    </div>

                    {/* Individual Actions */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.leida && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                          title="Marcar como leída"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#1E40AF] transition-all cursor-pointer"
                        >
                          <Check size={15} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                        title="Eliminar notificación"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-600 transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="flex items-center justify-center border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 w-9 h-9 rounded-xl font-bold transition-all cursor-pointer"
            >
              &lt;
            </button>
            <span className="text-[13px] font-bold text-[#64748B] px-3">
              {page} / {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
              className="flex items-center justify-center border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 w-9 h-9 rounded-xl font-bold transition-all cursor-pointer"
            >
              &gt;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
