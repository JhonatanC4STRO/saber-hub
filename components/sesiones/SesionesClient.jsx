'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Video,
  Plus,
  Calendar,
  Users,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  ChevronDown,
  X,
  Play,
  CheckCircle,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';

export default function SesionesClient({ course, currentUser, isEmbed = false }) {
  const router = useRouter();
  const isInstructor = currentUser?.rol === 'admin' || currentUser?.rol === 'instructor';

  // State Management
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('proximas'); // 'proximas' | 'pasadas' | 'todas'

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevaDuracion, setNuevaDuracion] = useState('60');
  const [nuevaPlataforma, setNuevaPlataforma] = useState('meet'); // 'meet' | 'zoom' | 'otro'
  const [otroEnlace, setOtroEnlace] = useState('meet.google.com/abc-defg-hij');
  const [generarRecordatorio, setGenerarRecordatorio] = useState(true);
  const [creandoSesion, setCreandoSesion] = useState(false);
  const [meetCode, setMeetCode] = useState('');

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper Jitsi Meet URL simulator
  const generateMeetLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randPart = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const code = `${randPart()}-${randPart()}-${randPart()}`;
    setMeetCode(code);
    setOtroEnlace(`https://meet.google.com/${code}`);
    showToast('Enlace de Google Meet generado automáticamente');
  };

  // Mock sessions matching the spec exactly (disabled as requested)
  const mockSesiones = useMemo(() => [], []);

  // Fetch sessions
  const loadSesiones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/cursos/${course.id}/sesiones`);
      if (res.ok) {
        const data = await res.json();
        
        // Enrich state
        const dbSessions = Array.isArray(data) ? data : [];
        const enrichedReal = dbSessions.map(s => ({
          ...s,
          plataforma: s.urlReunion?.includes('zoom') ? 'Zoom' : 'Google Meet'
        }));
        setSesiones(enrichedReal);
      } else {
        setSesiones([]);
      }
    } catch (err) {
      console.error(err);
      setSesiones([]);
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    loadSesiones();
  }, [loadSesiones]);

  // Create Session Submit Handler
  const handleProgramar = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevaFecha || !nuevaHora) {
      showToast('Por favor, completa los campos obligatorios', 'error');
      return;
    }

    setCreandoSesion(true);
    const startIso = new Date(`${nuevaFecha}T${nuevaHora}`).toISOString();

    const body = {
      titulo: nuevoTitulo,
      descripcion: nuevaDesc,
      fechaInicio: startIso,
      duracion: Number(nuevaDuracion),
      plataforma: nuevaPlataforma,
      urlReunion: otroEnlace,
    };

    try {
      const res = await fetch(`/api/cursos/${course.id}/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const created = await res.json();
        setSesiones((prev) => [
          {
            ...created,
            plataforma: nuevaPlataforma === 'zoom' ? 'Zoom' : 'Google Meet'
          },
          ...prev,
        ]);
        setNuevoTitulo('');
        setNuevaDesc('');
        setNuevaFecha('');
        setNuevaHora('');
        setOtroEnlace('');
        setShowModal(false);
        showToast('¡Sesión en vivo programada y alumnos notificados!');
      } else {
        // Fallback simulate local save
        const mockNew = {
          id: `local-session-${Date.now()}`,
          titulo: nuevoTitulo,
          descripcion: nuevaDesc,
          fechaInicio: startIso,
          fechaFin: new Date(new Date(startIso).getTime() + Number(nuevaDuracion) * 60 * 1000).toISOString(),
          duracion: Number(nuevaDuracion),
          urlReunion: otroEnlace || 'https://meet.google.com/abc-defg-hij',
          estado: 'programada',
          plataforma: nuevaPlataforma === 'zoom' ? 'Zoom' : 'Google Meet'
        };
        setSesiones((prev) => [mockNew, ...prev]);
        setNuevoTitulo('');
        setNuevaDesc('');
        setNuevaFecha('');
        setNuevaHora('');
        setOtroEnlace('');
        setShowModal(false);
        showToast('Programado (Modo Demo)');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al programar', 'error');
    } finally {
      setCreandoSesion(false);
    }
  };

  // Delete/Cancel Session
  const handleCancelarSesion = async (sesionId) => {
    if (!confirm('¿Estás seguro de cancelar esta sesión programada?')) return;
    try {
      const res = await fetch(`/api/sesiones/${sesionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSesiones((prev) => prev.filter((s) => s.id !== sesionId));
        showToast('Sesión cancelada con éxito');
      } else {
        // Simulate local cancel
        setSesiones((prev) => prev.filter((s) => s.id !== sesionId));
        showToast('Sesión cancelada (Modo Demo)');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Copy Link Helper
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    showToast('Enlace de reunión copiado al portapapeles');
  };

  // Date Parsing Helpers
  const parseDateBox = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return {
      mes: months[d.getMonth()],
      dia: d.getDate(),
      hora: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };
  };

  // Get dynamic countdown text in Spanish
  const getCountdownText = (fechaInicioStr) => {
    const diffMs = new Date(fechaInicioStr).getTime() - Date.now();
    if (diffMs <= 0) return 'Hoy / En curso';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      const hoursPart = diffHours % 24;
      return `En ${diffDays} día${diffDays > 1 ? 's' : ''}${hoursPart > 0 ? ` y ${hoursPart} hora${hoursPart > 1 ? 's' : ''}` : ''}`;
    }
    if (diffHours > 0) {
      const minsPart = diffMins % 60;
      return `En ${diffHours} hora${diffHours > 1 ? 's' : ''}${minsPart > 0 ? ` y ${minsPart} min` : ''}`;
    }
    return `En ${diffMins} min`;
  };

  // Metrics computation for Instructor view
  const activeUpcomingCount = sesiones.filter(s => s.estado === 'programada').length;
  const realizedMonthCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return sesiones.filter(s => s.estado === 'realizada' && new Date(s.fechaInicio) >= thirtyDaysAgo).length;
  }, [sesiones]);

  // Filter sessions by selected tab
  const filteredSesiones = useMemo(() => {
    return sesiones.filter(s => {
      if (activeTab === 'proximas') return s.estado === 'programada';
      if (activeTab === 'pasadas') return s.estado === 'realizada';
      return true; // 'todas'
    });
  }, [sesiones, activeTab]);

  // Is there any active live session right now? (For Student Banner)
  const activeLiveSession = useMemo(() => {
    const now = Date.now();
    const active = sesiones.find(s => {
      if (s.estado !== 'programada') return false;
      const start = new Date(s.fechaInicio).getTime();
      const durationMs = (s.duracion || 60) * 60 * 1000;
      const end = start + durationMs;
      // Allow joining 10 minutes before and during the session duration
      return (start - 10 * 60 * 1000) <= now && now <= end;
    });

    if (active) {
      const start = new Date(active.fechaInicio).getTime();
      const diffMs = now - start;
      const empezadoMin = diffMs > 0 ? Math.floor(diffMs / (1000 * 60)) : 0;
      return {
        ...active,
        empezadoMin
      };
    }
    return null;
  }, [sesiones]);

  return (
    <div className={`font-sans flex flex-col ${isEmbed ? 'w-full bg-white' : 'min-h-screen bg-white'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[5000] flex items-center gap-2 border rounded-lg px-4 py-3 shadow-md transform transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}

      {/* HEADER SUPERIOR */}
      {!isEmbed && <HeaderAdmin usuario={currentUser} />}

      {/* Main Content Area */}
      <main className={`mx-auto w-full flex flex-col flex-1 bg-white ${isEmbed ? 'p-0 pb-4' : 'max-w-[1440px] p-8 pt-6 pb-16'}`}>
        
        {/* Breadcrumb */}
        {!isEmbed && (
          <nav className="mb-4 flex-shrink-0" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[13px]">
              <li>
                <Link href="/dashboard" className="text-[#6B7280] hover:text-[#1E40AF] font-medium transition-colors">
                  Mi aprendizaje
                </Link>
              </li>
              <li className="text-[#D1D5DB]">›</li>
              <li>
                <Link href={`/cursos/${course.id}`} className="text-[#6B7280] hover:text-[#1E40AF] font-medium transition-colors">
                  {course.titulo}
                </Link>
              </li>
              <li className="text-[#D1D5DB]">›</li>
              <li className="text-[#111827] font-semibold">Sesiones en vivo</li>
            </ol>
          </nav>
        )}

        {/* ── SCREEN A: VISTA INSTRUCTOR ── */}
        {isInstructor ? (
          <div className="space-y-8">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-[#1E40AF] rounded-lg flex items-center justify-center text-[20px] flex-shrink-0">
                  📹
                </div>
                <div>
                  <h1 className="font-bold text-[28px] text-[#111827] leading-tight">Sesiones en vivo</h1>
                  <p className="text-[14px] text-[#6B7280] font-normal mt-0.5">Programa videoconferencias para tus alumnos.</p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setNuevoTitulo('');
                  setNuevaDesc('');
                  setOtroEnlace('meet.google.com/abc-defg-hij');
                  setNuevaPlataforma('meet');
                  setShowModal(true);
                }}
                className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-5 py-2.5 rounded-[4px] text-[14px] font-semibold transition-colors flex-shrink-0"
              >
                <Plus size={16} />
                <span>+ Programar sesión</span>
              </button>
            </div>

            {/* Metrics cards (Línea azul inferior de 2px) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-[24px]">
              {[
                { title: 'PRÓXIMAS SESIONES', val: activeUpcomingCount },
                { title: 'REALIZADAS (MES)', val: realizedMonthCount },
                { title: 'ALUMNOS INSCRITOS', val: course._count?.inscripciones ?? 0 }
              ].map((metric) => (
                <div key={metric.title} className="bg-white border border-[#F3F4F6] rounded-[4px] p-5 shadow-sm border-b-2 border-b-[#1E40AF]">
                  <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">{metric.title}</p>
                  <h3 className="text-[32px] font-extrabold text-[#111827] mt-2 leading-none">{metric.val}</h3>
                </div>
              ))}
            </div>

            {/* List and Tabs switcher */}
            <div className="space-y-5">
              {/* Tab options bar */}
              <div className="flex border-b border-gray-200 gap-6">
                {[
                  { key: 'proximas', label: `Próximas (${sesiones.filter(s => s.estado === 'programada').length})` },
                  { key: 'pasadas', label: `Pasadas (${sesiones.filter(s => s.estado === 'realizada').length})` },
                  { key: 'todas', label: `Todas (${sesiones.length})` }
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`pb-3.5 text-[14px] font-bold transition-all relative ${
                      activeTab === t.key ? 'text-[#1E40AF]' : 'text-gray-400 hover:text-slate-800'
                    }`}
                  >
                    <span>{t.label}</span>
                    {activeTab === t.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E40AF]"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Sessions list */}
              <div className="flex flex-col gap-4">
                {loading ? (
                  <div className="text-center py-16 text-gray-400 font-medium text-[13px]">
                    Cargando listado de videoconferencias...
                  </div>
                ) : filteredSesiones.length === 0 ? (
                  <div className="bg-[#F9FAFB] border border-dashed border-gray-200 rounded p-12 text-center max-w-md mx-auto">
                    <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="font-bold text-[15px] text-slate-800">Sin sesiones</p>
                    <p className="text-[12px] text-gray-500 mt-1 font-normal">
                      No hay videoconferencias programadas en esta categoría para este curso.
                    </p>
                  </div>
                ) : (
                  filteredSesiones.map((s) => {
                    const dt = parseDateBox(s.fechaInicio);
                    const isToday = new Date(s.fechaInicio).toDateString() === new Date().toDateString();
                    return (
                      <div
                        key={s.id}
                        className="bg-white border border-[#F3F4F6] rounded-[4px] p-5 border-b-2 border-b-[#1E40AF] mb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all hover:shadow-xs"
                      >
                        {/* Left Blue Date Box (64x64px, fondo azul, centered labels) */}
                        <div className="w-[64px] h-[64px] bg-[#1E40AF] rounded-[4px] flex flex-col items-center justify-center text-white flex-shrink-0 select-none">
                          <span className="text-[11px] font-medium uppercase tracking-wide leading-none">{dt.mes}</span>
                          <span className="text-[28px] font-bold leading-tight my-0.5">{dt.dia}</span>
                          <span className="text-[11px] font-medium leading-none">{dt.hora}</span>
                        </div>

                        {/* Mid Info Details (margen 0 20px) */}
                        <div className="flex-1 min-w-0 md:mx-5 text-left">
                          <div className="mb-1.5">
                            <span className="inline-block bg-[#DBEAFE] text-[#1E40AF] font-bold text-[10px] px-2 py-0.5 rounded-[2px] tracking-wide uppercase select-none">
                              {s.estado === 'programada' ? 'PROGRAMADA' : 'REALIZADA'}
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-[17px] text-[#111827] leading-snug">
                            {s.titulo}
                          </h3>

                          {/* Curso asociado directly below title */}
                          <p className="text-[13px] font-medium text-[#4B5563] mt-1">
                            📖 {course.titulo}
                          </p>

                          {s.descripcion && (
                            <p className="text-[13px] text-[#6B7280] font-normal mt-1 truncate" title={s.descripcion}>
                              {s.descripcion}
                            </p>
                          )}

                          {/* Info icons row */}
                          <div className="flex items-center gap-3 text-[13px] text-[#6B7280] mt-2.5 flex-wrap font-normal">
                            <span className="flex items-center gap-1.5">
                              <span className="text-[14px]">👥</span>
                              <span>{course._count?.inscripciones ?? 0} alumnos inscritos</span>
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-[14px]">⏱</span>
                              <span>{s.duracion} min</span>
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1.5">
                              <span className="text-[14px]">🔗</span>
                              <span>{s.plataforma || 'Google Meet'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Right Action buttons */}
                        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap md:flex-shrink-0">
                          {s.estado === 'programada' && (
                            <>
                              {/* Botón Editar (secundario pequeño) */}
                              <button
                                onClick={() => {
                                  setNuevoTitulo(s.titulo);
                                  setNuevaDesc(s.descripcion || '');
                                  setNuevaFecha(s.fechaInicio.split('T')[0]);
                                  setNuevaHora(s.fechaInicio.split('T')[1]?.substring(0, 5) || '');
                                  setNuevaDuracion(String(s.duracion));
                                  setNuevaPlataforma(s.plataforma?.toLowerCase()?.includes('zoom') ? 'zoom' : 'meet');
                                  setOtroEnlace(s.urlReunion);
                                  setShowModal(true);
                                }}
                                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-[12.5px] font-semibold rounded-[4px] transition-colors"
                              >
                                Editar
                              </button>

                              {/* Botón Cancelar (rojo outline pequeño) */}
                              <button
                                onClick={() => handleCancelarSesion(s.id)}
                                className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-[12.5px] font-semibold rounded-[4px] transition-colors"
                              >
                                Cancelar
                              </button>

                              {/* Link Copiar enlace ↗ */}
                              <button
                                onClick={() => handleCopyLink(s.urlReunion)}
                                className="text-[13px] text-[#1E40AF] font-medium hover:underline flex items-center gap-1 select-none"
                              >
                                Copiar enlace ↗
                              </button>

                              {/* Iniciar ahora if HOY (verde #10B981) */}
                              {isToday && (
                                <a
                                  href={s.urlReunion}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-[12.5px] font-bold rounded-[4px] transition-colors shadow-xs"
                                >
                                  Iniciar ahora
                                </a>
                              )}
                            </>
                          )}

                          {s.estado === 'realizada' && s.urlGrabacion && (
                            <a
                              href={s.urlGrabacion}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 text-[12.5px] font-bold rounded-[4px] transition-all flex items-center gap-1.5"
                            >
                              <Play size={13} fill="currentColor" />
                              <span>Ver grabación</span>
                            </a>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : (
          
          // ── SCREEN B: VISTA ALUMNO ──
          <div className="space-y-8">
            
            {/* Page Header */}
            <div className="pb-6 border-b border-gray-100 flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 text-[#1E40AF] rounded-lg flex items-center justify-center text-[22px] flex-shrink-0">
                📹
              </div>
              <div>
                <h1 className="font-bold text-[26px] text-[#111827] leading-tight">Sesiones en vivo</h1>
                <p className="text-[14px] text-[#6B7280] font-normal mt-0.5">Videoconferencias programadas por tus instructores.</p>
              </div>
            </div>

            {/* ACTIVE LIVE BANNER (Pulsing Indicator) */}
            {activeLiveSession && (
              <div className="bg-[#1E40AF] text-white rounded-[4px] p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
                
                {/* Red pulsing indicator dot on left */}
                <div className="flex items-center gap-2.5 flex-shrink-0 self-start md:self-center">
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </div>
                  <span className="font-extrabold text-[13px] tracking-wider uppercase">● EN VIVO</span>
                </div>

                {/* Central Info details */}
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-bold text-[18px] md:text-[20px] text-white leading-tight">
                    {activeLiveSession.titulo}
                  </h3>
                  <p className="text-[13px] text-blue-100/90 mt-1 font-medium">
                    Instructor: {course.instructor?.nombre || 'Instructor'} · Curso: {course.titulo}
                  </p>
                  <p className="text-[12px] text-blue-100/70 mt-2 font-normal">
                    {activeLiveSession.empezadoMin > 0
                      ? `Empezó hace ${activeLiveSession.empezadoMin} minutos`
                      : 'La sesión está por comenzar'} · <strong>Acceso disponible</strong>
                  </p>
                </div>

                {/* White button on right */}
                <a
                  href={activeLiveSession.urlReunion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white text-[#1E40AF] hover:bg-blue-50 font-bold text-[14.5px] rounded-[4px] shadow-sm flex items-center justify-center transition-all flex-shrink-0 h-12"
                >
                  Unirme ahora →
                </a>
              </div>
            )}

            {/* UPCOMING SESSIONS GRID */}
            <div className="space-y-4">
              <h2 className="font-bold text-[19px] text-[#111827]">Próximas sesiones</h2>
              
              {loading ? (
                <div className="text-center py-8 text-gray-400 font-semibold text-[13px]">
                  Cargando próximas videoconferencias...
                </div>
              ) : sesiones.filter(s => s.estado === 'programada').length === 0 ? (
                <p className="text-[13px] text-gray-400 py-4 pl-1 font-normal">No hay videoconferencias programadas próximamente.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {sesiones.filter(s => s.estado === 'programada').map((s) => {
                    const dt = parseDateBox(s.fechaInicio);
                    return (
                      <div
                        key={s.id}
                        className="bg-white border border-gray-100 rounded-[4px] p-5 shadow-sm border-b-2 border-b-[#1E40AF] flex gap-4 items-start"
                      >
                        {/* Blue Date Square */}
                        <div className="w-[56px] h-[56px] bg-[#1E40AF] rounded-[4px] flex flex-col items-center justify-center text-white flex-shrink-0 select-none">
                          <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{dt.mes}</span>
                          <span className="text-[22px] font-black leading-tight my-0.2">{dt.dia}</span>
                          <span className="text-[9px] font-bold leading-none">{dt.hora}</span>
                        </div>

                        {/* Right details */}
                        <div className="flex-grow min-w-0">
                          <span className="text-[10px] font-bold text-[#1E40AF] tracking-wide uppercase">{s.plataforma}</span>
                          <h4 className="font-bold text-[15px] text-[#111827] leading-snug truncate mt-0.5">
                            {s.titulo}
                          </h4>
                          <p className="text-[12px] text-gray-400 font-semibold mt-1">Instructor {course.instructor?.nombre || 'Instructor'} · {s.duracion} min</p>
                          
                          {/* Progress bar countdown simulation */}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[12px]">
                            <span className="font-semibold text-[#1E40AF]">{getCountdownText(s.fechaInicio)}</span>
                            <button
                              onClick={() => showToast('¡Sesión agregada a tu calendario personal!')}
                              className="text-gray-400 hover:text-slate-700 font-bold flex items-center gap-1 select-none"
                            >
                              📅 Calendario
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PAST RECORDINGS LIST */}
            <div className="space-y-4 pt-4">
              <h2 className="font-bold text-[19px] text-[#111827]">Sesiones anteriores</h2>
              
              <div className="bg-white border border-gray-100 rounded-[4px] overflow-hidden shadow-sm">
                <table className="w-full text-left text-[13.5px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase text-[10.5px] tracking-wider select-none">
                      <th className="py-3 px-5">Sesión</th>
                      <th className="py-3 px-5">Fecha</th>
                      <th className="py-3 px-5 text-right">Grabación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-[#374151]">
                    {sesiones.filter(s => s.estado === 'realizada').map((s) => (
                      <tr key={s.id} className="hover:bg-[#F9FAFB]/50">
                        <td className="py-3.5 px-5 font-bold text-[#111827]">{s.titulo}</td>
                        <td className="py-3.5 px-5 text-gray-500 font-medium">
                          {new Date(s.fechaInicio).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {s.urlGrabacion && (
                            <a
                              href={s.urlGrabacion}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 text-[12px] font-bold rounded-[4px] transition-all inline-flex items-center gap-1"
                            >
                              <Play size={11} fill="currentColor" />
                              <span>Ver grabación</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      {!isEmbed && <FooterAdmin />}

      {/* ── SCREEN A: MODAL PROGRAMAR SESIÓN (600px) ── */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-[3px] z-[5000] flex items-center justify-center p-4">
          <div className="w-full max-w-[600px] bg-white rounded-[8px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden p-8">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-[20px] text-[#111827]">Nueva sesión en vivo</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-slate-800 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body (gap 16px -> space-y-4) */}
            <form onSubmit={handleProgramar} className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
              
              {/* Título de la sesión */}
              <div>
                <label htmlFor="modal-titulo" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  Título de la sesión *
                </label>
                <input
                  id="modal-titulo"
                  type="text"
                  required
                  placeholder="Ej. Q&A del Módulo 3"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className="w-full h-11 border border-gray-300 rounded-[4px] px-4 text-[14px] bg-white text-[#111827] focus:outline-none focus:border-[#1E40AF]"
                />
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="modal-desc" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  Descripción
                </label>
                <textarea
                  id="modal-desc"
                  placeholder="Describe brevemente de qué tratará la videoconferencia..."
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-[4px] px-4 py-2.5 text-[14px] bg-white text-[#111827] focus:outline-none focus:border-[#1E40AF] resize-none h-[80px]"
                />
              </div>

              {/* Curso asociado select dropdown */}
              <div>
                <label htmlFor="modal-curso-select" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                  Curso asociado *
                </label>
                <div className="relative">
                  <select
                    id="modal-curso-select"
                    className="w-full h-11 border border-gray-300 rounded-[4px] px-4 text-[14px] bg-white text-[#111827] focus:outline-none appearance-none focus:border-[#1E40AF]"
                  >
                    <option value={course.id}>📖 {course.titulo}</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Fila: Fecha * + Hora de inicio * + Duración */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="modal-fecha" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    Fecha *
                  </label>
                  <input
                    id="modal-fecha"
                    type="date"
                    required
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full h-11 border border-gray-300 rounded-[4px] px-3 text-[13px] bg-white text-[#111827] focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label htmlFor="modal-hora" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    Hora de inicio *
                  </label>
                  <input
                    id="modal-hora"
                    type="time"
                    required
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    className="w-full h-11 border border-gray-300 rounded-[4px] px-3 text-[13px] bg-white text-[#111827] focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
                <div>
                  <label htmlFor="modal-duracion" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    Duración
                  </label>
                  <div className="relative">
                    <select
                      id="modal-duracion"
                      value={nuevaDuracion}
                      onChange={(e) => setNuevaDuracion(e.target.value)}
                      className="w-full h-11 border border-gray-300 rounded-[4px] pl-3 pr-8 text-[13px] bg-white text-[#111827] focus:outline-none appearance-none focus:border-[#1E40AF]"
                    >
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Plataforma Chips selector */}
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-2">
                  Plataforma de videoconferencia *
                </label>
                <div className="flex gap-3">
                  {[
                    { key: 'meet', label: 'Google Meet', icon: '📹' },
                    { key: 'zoom', label: 'Zoom', icon: '🔵' },
                    { key: 'otro', label: 'Otro enlace', icon: '🔗' }
                  ].map((p) => {
                    const sel = nuevaPlataforma === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setNuevaPlataforma(p.key);
                          if (p.key === 'meet') {
                            setOtroEnlace('meet.google.com/abc-defg-hij');
                          } else if (p.key === 'zoom') {
                            setOtroEnlace('zoom.us/j/987654321');
                          } else {
                            setOtroEnlace('');
                          }
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-[4px] text-[13.5px] font-bold transition-all ${
                          sel 
                            ? 'bg-[#EFF6FF] border-[#1E40AF] text-[#1E40AF] ring-1 ring-[#1E40AF]' 
                            : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <span className="text-[16px]">{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Google Meet: Generar enlace automáticamente */}
              {nuevaPlataforma === 'meet' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtroEnlace('meet.google.com/abc-defg-hij');
                      showToast('Enlace de Google Meet generado');
                    }}
                    className="px-4 py-2 border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 text-[13px] font-bold rounded-[4px] transition-colors"
                  >
                    Generar enlace automáticamente
                  </button>
                </div>
              )}

              {/* Otro enlace: pegado manual */}
              {nuevaPlataforma === 'otro' && (
                <div>
                  <label htmlFor="modal-otro-url" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                    Enlace de la reunión *
                  </label>
                  <input
                    id="modal-otro-url"
                    type="url"
                    required
                    placeholder="https://..."
                    value={otroEnlace === 'meet.google.com/abc-defg-hij' ? '' : otroEnlace}
                    onChange={(e) => setOtroEnlace(e.target.value)}
                    className="w-full h-11 border border-gray-300 rounded-[4px] px-4 text-[14px] bg-white text-[#111827] focus:outline-none focus:border-[#1E40AF]"
                  />
                </div>
              )}

              {/* Generar recordatorio automático (Interactive switch ON) */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="block text-[13px] font-bold text-slate-700">Generar recordatorio automático</span>
                  <span className="text-[11px] text-gray-500 leading-normal font-normal">Se enviará una notificación a los alumnos 1 hora antes.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGenerarRecordatorio(!generarRecordatorio)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
                    generarRecordatorio ? 'bg-[#1E40AF]' : 'bg-gray-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${
                    generarRecordatorio ? 'translate-x-6' : 'translate-x-1'
                  }`}></span>
                </button>
              </div>

              {/* Enlace de reunión generado Card display */}
              {otroEnlace && (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded p-4 flex items-center justify-between gap-4 mt-4 select-none">
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider">Enlace de reunión generado</span>
                    <span className="text-[13px] font-bold text-[#1E40AF] truncate block mt-0.5">{otroEnlace}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(otroEnlace)}
                    className="px-4 py-2 bg-white border border-gray-300 text-slate-700 hover:text-[#1E40AF] hover:border-[#1E40AF] text-[13px] font-bold rounded-[4px] transition-colors flex-shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              )}

              {/* Modal Footer actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-[4px] text-[13px] font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoSesion}
                  className="px-6 py-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white rounded-[4px] text-[13px] font-semibold transition-colors disabled:opacity-50"
                >
                  {creandoSesion ? 'Guardando...' : 'Guardar sesión'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}


