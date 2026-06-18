'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { Video } from 'lucide-react';

// Helper to format Spanish dates nicely
function formatSpanishDateTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Helper to detect platform name from URL
function getPlatformName(url) {
  if (!url) return 'Videollamada';
  if (url.includes('zoom.us')) return 'Zoom';
  if (url.includes('meet.google.com')) return 'Google Meet';
  if (url.includes('meet.jit.si')) return 'Jitsi Meet';
  return 'Videollamada';
}

// Countdown Ticker Component
function CountdownTicker({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference <= 0) {
        setTimeLeft('¡Debería haber comenzado!');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`Faltan ${days} día${days > 1 ? 's' : ''}`);
      } else {
        setTimeLeft(
          `Comienza en ${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#f59e0b',
        fontSize: '13px',
        fontWeight: '600',
      }}
    >
      <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}><EmojiIcon emoji="⏳" size={16} /></span>
      <span>{timeLeft}</span>
    </div>
  );
}

export default function SesionesTab({ cursoId, userRole }) {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('todas'); // 'todas', 'programadas', 'en_curso', 'finalizadas'

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null); // Date object or null

  // Creation modal/form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [duracion, setDuracion] = useState('60');
  const [usarMeetAutomatico, setUsarMeetAutomatico] = useState(true);
  const [urlReunion, setUrlReunion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recording upload state
  const [editingRecordingSessionId, setEditingRecordingSessionId] = useState(null);
  const [urlGrabacion, setUrlGrabacion] = useState('');
  const [savingRecording, setSavingRecording] = useState(false);

  // Load course sessions
  const cargarSesiones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}/sesiones`);
      if (res.ok) {
        const data = await res.json();
        setSesiones(data);
      }
    } catch (error) {
      console.error('Error al cargar las sesiones:', error);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    cargarSesiones();
  }, [cargarSesiones]);

  const isInstructorOrAdmin = userRole === 'instructor' || userRole === 'admin';

  // Handle Action state changes
  const handleUpdateEstado = async (sesionId, nuevoEstado) => {
    try {
      const res = await fetch(`/api/sesiones/${sesionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSesiones((prev) =>
          prev.map((s) =>
            s.id === sesionId ? { ...s, estado: updated.estado, fechaFin: updated.fechaFin } : s
          )
        );
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (error) {
      console.error('Error al actualizar la sesión:', error);
    }
  };

  // Handle Recording Save
  const handleGuardarGrabacion = async (e, sesionId) => {
    e.preventDefault();
    setSavingRecording(true);
    try {
      const res = await fetch(`/api/sesiones/${sesionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlGrabacion: urlGrabacion.trim() !== '' ? urlGrabacion.trim() : null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSesiones((prev) =>
          prev.map((s) => (s.id === sesionId ? { ...s, urlGrabacion: updated.urlGrabacion } : s))
        );
        setEditingRecordingSessionId(null);
        setUrlGrabacion('');
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (error) {
      console.error('Error al guardar la grabación:', error);
    } finally {
      setSavingRecording(false);
    }
  };

  // Handle Delete Session
  const handleEliminarSesion = async (sesionId) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar esta clase en vivo? Esta acción no se puede deshacer y borrará los recordatorios.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/sesiones/${sesionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSesiones((prev) => prev.filter((s) => s.id !== sesionId));
      } else {
        const err = await res.json();
        alert('Error: ' + err.message);
      }
    } catch (error) {
      console.error('Error al eliminar la sesión:', error);
    }
  };

  // Handle Create Session Form Submit
  const handleCrearSesion = async (e) => {
    e.preventDefault();
    if (!titulo || !fechaInicio) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/cursos/${cursoId}/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descripcion,
          fechaInicio,
          duracion: parseInt(duracion) || 60,
          urlReunion: usarMeetAutomatico ? null : urlReunion,
        }),
      });

      if (res.ok) {
        const nueva = await res.json();
        setSesiones((prev) =>
          [...prev, nueva].sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
        );
        setShowCreateModal(false);
        setTitulo('');
        setDescripcion('');
        setFechaInicio('');
        setDuracion('60');
        setUrlReunion('');
        setUsarMeetAutomatico(true);
      } else {
        const err = await res.json();
        alert('Error al programar sesión: ' + err.message);
      }
    } catch (error) {
      console.error('Error al crear la sesión:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar logic helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  // Shift to start week on Monday: (firstDay === 0 ? 6 : firstDay - 1)
  const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

  const nombreMeses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const getSesionesDelDia = (dia) => {
    return sesiones.filter((s) => {
      const f = new Date(s.fechaInicio);
      return f.getDate() === dia && f.getMonth() === month && f.getFullYear() === year;
    });
  };

  // Filter sessions based on Selected tab & Calendar filter
  const sesionesFiltradas = sesiones.filter((s) => {
    // 1. Filter by Tab
    if (selectedTab === 'programadas' && s.estado !== 'programada') return false;
    if (selectedTab === 'en_curso' && s.estado !== 'en_curso') return false;
    if (selectedTab === 'finalizadas' && s.estado !== 'finalizada') return false;

    // 2. Filter by Calendar Day
    if (selectedDay) {
      const fs = new Date(s.fechaInicio);
      const isSameDay =
        fs.getDate() === selectedDay.getDate() &&
        fs.getMonth() === selectedDay.getMonth() &&
        fs.getFullYear() === selectedDay.getFullYear();
      if (!isSameDay) return false;
    }

    return true;
  });

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* ── HEADER & ACCIÓN PRINCIPAL ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={22} style={{ color: '#10b981' }} /> Clases en Vivo & Videoconferencias
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
            Sesiones de aprendizaje interactivo y sincrónico programadas para este curso.
          </p>
        </div>

        {isInstructorOrAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
            }}
          >
            <EmojiIcon emoji="➕" size={16} /> Programar Clase
          </button>
        )}
      </div>

      {/* ── CONTENIDO PRINCIPAL: DOS COLUMNAS (CALENDARIO & LISTA DE CLASES) ── */}
      <div style={{ display: 'flex', gap: '28px', flexDirection: 'row', flexWrap: 'wrap' }}>
        {/* COLUMNA IZQUIERDA: CALENDARIO */}
        <div
          style={{
            flex: '1 1 340px',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Cabecera del Mes */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {nombreMeses[month]} {year}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handlePrevMonth}
                  style={{
                    background: 'none',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  &lt;
                </button>
                <button
                  onClick={handleNextMonth}
                  style={{
                    background: 'none',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '11px',
                color: '#64748b',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              <div>Lu</div>
              <div>Ma</div>
              <div>Mi</div>
              <div>Ju</div>
              <div>Vi</div>
              <div>Sá</div>
              <div>Do</div>
            </div>

            {/* Cuadrícula de días */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {/* Espacios vacíos para desfase */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Días del mes */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dia = i + 1;
                const sesionesDia = getSesionesDelDia(dia);
                const tieneEventos = sesionesDia.length > 0;
                const isSelected =
                  selectedDay &&
                  selectedDay.getDate() === dia &&
                  selectedDay.getMonth() === month &&
                  selectedDay.getFullYear() === year;

                return (
                  <button
                    key={`day-${dia}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDay(null);
                      } else {
                        setSelectedDay(new Date(year, month, dia));
                      }
                    }}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? '#3b82f6' : tieneEventos ? '#1e3a5f' : 'transparent',
                      border: '1px solid',
                      borderColor: isSelected ? '#3b82f6' : tieneEventos ? '#3b82f6' : '#334155',
                      borderRadius: '8px',
                      color: isSelected ? '#fff' : '#cbd5e1',
                      cursor: 'pointer',
                      position: 'relative',
                      fontSize: '13px',
                      fontWeight: tieneEventos ? 'bold' : 'normal',
                      padding: '4px',
                      transition: 'all 0.1s',
                    }}
                  >
                    <span>{dia}</span>
                    {/* Puntitos de estado para las sesiones */}
                    {tieneEventos && (
                      <div
                        style={{ display: 'flex', gap: '3px', position: 'absolute', bottom: '5px' }}
                      >
                        {sesionesDia.map((s, idx) => {
                          let dotColor = '#f59e0b'; // programada
                          if (s.estado === 'en_curso') dotColor = '#10b981';
                          if (s.estado === 'finalizada') dotColor = '#3b82f6';
                          if (s.estado === 'cancelada') dotColor = '#ef4444';

                          return (
                            <span
                              key={`${s.id}-${idx}`}
                              style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: dotColor,
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda del calendario */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #334155',
                fontSize: '11px',
                color: '#94a3b8',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                  }}
                />{' '}
                Programada
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                  }}
                />{' '}
                En Vivo
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                  }}
                />{' '}
                Finalizada
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                  }}
                />{' '}
                Cancelada
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PESTAÑAS DE FILTRO RÁPIDO & LISTA DE SESIONES */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Barra de pestañas (Tab Navigation) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #334155',
              paddingBottom: '2px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'todas', label: 'Todas las clases' },
              { id: 'programadas', label: 'Próximas' },
              { id: 'en_curso', label: '🔴 En Vivo' },
              { id: 'finalizadas', label: 'Grabadas / Finalizadas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: 'none',
                  border: 'none',
                  color: selectedTab === tab.id ? '#60a5fa' : '#94a3b8',
                  borderBottom:
                    selectedTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Indicador de Filtro de Calendario Activo */}
          {selectedDay && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#1d4ed833',
                border: '1px solid #3b82f644',
                borderRadius: '8px',
                padding: '10px 16px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: '500' }}>
                <EmojiIcon emoji="📅" size={13} className="mr-1" /> Filtrando por el día: <strong>{selectedDay.toLocaleDateString('es-CO')}</strong>
              </span>
              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                Limpiar filtro ×
              </button>
            </div>
          )}

          {/* Listado de Sesiones */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              Cargando sesiones de clases...
            </div>
          ) : sesionesFiltradas.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 40px',
                backgroundColor: '#1e293b',
                border: '1px dashed #334155',
                borderRadius: '12px',
                color: '#94a3b8',
              }}
            >
              <span style={{ fontSize: '40px', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><EmojiIcon emoji="📅" size={40} /></span>
              <p
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '15px',
                  color: '#cbd5e1',
                  fontWeight: 'bold',
                }}
              >
                No se encontraron sesiones
              </p>
              <p style={{ margin: 0, fontSize: '13px' }}>
                No hay clases programadas que coincidan con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sesionesFiltradas.map((sesion) => {
                const esDeHoy =
                  new Date(sesion.fechaInicio).toDateString() === new Date().toDateString();
                const esProxima = sesion.estado === 'programada';
                const esEnVivo = sesion.estado === 'en_curso';
                const esFinalizada = sesion.estado === 'finalizada';
                const esCancelada = sesion.estado === 'cancelada';

                return (
                  <div
                    key={sesion.id}
                    style={{
                      backgroundColor: esEnVivo ? '#064e3b44' : '#1e293b',
                      border: esEnVivo ? '2px solid #10b981' : '1px solid #334155',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: esEnVivo
                        ? '0 4px 15px -3px rgba(16, 185, 129, 0.25)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transition: 'border-color 0.2s',
                      position: 'relative',
                    }}
                  >
                    {/* Fila 1: Badges de Estado y Título */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Badge de Estado */}
                          {esProxima && (
                            <span
                              style={{
                                backgroundColor: '#78350f',
                                color: '#f59e0b',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: '1px solid #f59e0b33',
                              }}
                            >
                              Programada
                            </span>
                          )}
                          {esEnVivo && (
                            <span
                              style={{
                                backgroundColor: '#064e3b',
                                color: '#10b981',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: '1px solid #10b98155',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                animation: 'pulse 2s infinite',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#10b981',
                                  display: 'inline-block',
                                }}
                              />{' '}
                              En Vivo
                            </span>
                          )}
                          {esFinalizada && (
                            <span
                              style={{
                                backgroundColor: '#1e3a8a',
                                color: '#93c5fd',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: '1px solid #3b82f633',
                              }}
                            >
                              Finalizada
                            </span>
                          )}
                          {esCancelada && (
                            <span
                              style={{
                                backgroundColor: '#7f1d1d',
                                color: '#fca5a5',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                border: '1px solid #ef444433',
                              }}
                            >
                              Cancelada
                            </span>
                          )}

                          {esDeHoy && !esFinalizada && !esCancelada && (
                            <span
                              style={{
                                backgroundColor: '#1e3a5f',
                                color: '#60a5fa',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '3px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              ¡Hoy!
                            </span>
                          )}
                        </div>
                        <h4
                          style={{
                            margin: '4px 0 0 0',
                            fontSize: '17px',
                            fontWeight: 'bold',
                            color: '#fff',
                          }}
                        >
                          {sesion.titulo}
                        </h4>
                      </div>

                      {/* Duración */}
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#94a3b8',
                          backgroundColor: '#0f172a',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                        }}
                      >
                        ⏱ {sesion.duracion || 60} minutos
                      </span>
                    </div>

                    {/* Descripción */}
                    {sesion.descripcion && (
                      <p
                        style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}
                      >
                        {sesion.descripcion}
                      </p>
                    )}

                    {/* Fila 2: Tiempos y Fechas */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '13px',
                        color: '#94a3b8',
                        backgroundColor: '#0f172a55',
                        padding: '10px 14px',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span><EmojiIcon emoji="📅" size={13} /></span>
                        <span>{formatSpanishDateTime(sesion.fechaInicio)}</span>
                      </div>
                      {/* Countdown Ticker for scheduled session */}
                      {esProxima && <CountdownTicker targetDate={sesion.fechaInicio} />}
                    </div>

                    {/* Fila 3: Acciones o Contenido Interactivos (Grabación de video, etc) */}

                    {/* Inline video player for finished class with recording URL */}
                    {esFinalizada && sesion.urlGrabacion && (
                      <div
                        style={{
                          marginTop: '8px',
                          borderTop: '1px solid #334155',
                          paddingTop: '14px',
                        }}
                      >
                        <h5
                          style={{
                            margin: '0 0 10px 0',
                            fontSize: '13px',
                            color: '#93c5fd',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          <EmojiIcon emoji="🎬" size={13} className="mr-1.5" /> Video de la sesión grabada:
                        </h5>
                        <div
                          style={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                          }}
                        >
                          {(() => {
                            const url = sesion.urlGrabacion;
                            const ytRegex =
                              /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
                            const ytMatch = url.match(ytRegex);
                            if (ytMatch && ytMatch[1]) {
                              return (
                                <iframe
                                  width="100%"
                                  height="280"
                                  src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  style={{ display: 'block' }}
                                ></iframe>
                              );
                            }
                            const vimeoRegex =
                              /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
                            const vimeoMatch = url.match(vimeoRegex);
                            if (vimeoMatch && vimeoMatch[1]) {
                              return (
                                <iframe
                                  src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                                  width="100%"
                                  height="280"
                                  frameBorder="0"
                                  allow="autoplay; fullscreen; picture-in-picture"
                                  allowFullScreen
                                  style={{ display: 'block' }}
                                ></iframe>
                              );
                            }
                            return (
                              <video
                                controls
                                style={{ width: '100%', maxHeight: '300px', display: 'block' }}
                                src={url}
                              >
                                Tu navegador no soporta el elemento de video.
                              </video>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Finalized but NO recording placeholder */}
                    {esFinalizada && !sesion.urlGrabacion && (
                      <div
                        style={{
                          textAlign: 'center',
                          backgroundColor: '#0f172a33',
                          border: '1px dashed #334155',
                          borderRadius: '8px',
                          padding: '16px',
                          fontSize: '13px',
                          color: '#94a3b8',
                        }}
                      >
                        📼 <EmojiIcon emoji="📼" size={13} className="mr-1.5" /> La grabación de esta clase interactiva no ha sido adjuntada todavía.
                      </div>
                    )}

                    {/* Botones de acción principales (Estudiantes / Docentes) */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        borderTop: '1px solid #334155',
                        paddingTop: '14px',
                        marginTop: '6px',
                      }}
                    >
                      {/* ESTUDIANTES / ALL USERS: Botón de Unirse si está EN VIVO */}
                      {esEnVivo && (
                        <a
                          href={sesion.urlReunion}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: '1 1 auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            textAlign: 'center',
                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <EmojiIcon emoji="🟢" size={14} className="mr-1.5" /> UNIRSE A LA SESIÓN ({getPlatformName(sesion.urlReunion)}) &rarr;
                        </a>
                      )}

                      {/* Botón de Enlace para programadas (Solo lectura para alumnos) */}
                      {esProxima && !isInstructorOrAdmin && (
                        <a
                          href={sesion.urlReunion}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#334155',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <EmojiIcon emoji="🔗" size={13} className="mr-1.5" /> Ver enlace de Meet
                        </a>
                      )}

                      {/* ACCIONES DOCENTES (INSTRUCTOR / ADMIN) */}
                      {isInstructorOrAdmin && (
                        <div
                          style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}
                        >
                          {/* Programada -> Iniciar */}
                          {esProxima && (
                            <button
                              onClick={() => handleUpdateEstado(sesion.id, 'en_curso')}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                cursor: 'pointer',
                              }}
                            >
                              <EmojiIcon emoji="🚀" size={13} className="mr-1.5" /> Iniciar Clase
                            </button>
                          )}

                          {/* En Curso -> Finalizar */}
                          {esEnVivo && (
                            <button
                              onClick={() => handleUpdateEstado(sesion.id, 'finalizada')}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                cursor: 'pointer',
                              }}
                            >
                              <EmojiIcon emoji="🛑" size={13} className="mr-1.5" /> Finalizar Clase
                            </button>
                          )}

                          {/* Cancelar (Solo para programadas o en vivo) */}
                          {(esProxima || esEnVivo) && (
                            <button
                              onClick={() => handleUpdateEstado(sesion.id, 'cancelada')}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                              }}
                            >
                              <EmojiIcon emoji="❌" size={13} className="mr-1.5" /> Cancelar Clase
                            </button>
                          )}

                          {/* Subir/Editar Grabación (Solo para finalizadas) */}
                          {esFinalizada && editingRecordingSessionId !== sesion.id && (
                            <button
                              onClick={() => {
                                setEditingRecordingSessionId(sesion.id);
                                setUrlGrabacion(sesion.urlGrabacion || '');
                              }}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#475569',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                              }}
                            >
                              <EmojiIcon emoji="📼" size={13} className="mr-1.5" /> {sesion.urlGrabacion ? 'Editar Grabación' : 'Subir Grabación'}
                            </button>
                          )}

                          {/* Botón Eliminar Físicamente (Siempre visible para administradores/instructores) */}
                          <button
                            onClick={() => handleEliminarSesion(sesion.id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              borderRadius: '8px',
                              fontWeight: '500',
                              fontSize: '13px',
                              cursor: 'pointer',
                              marginLeft: 'auto',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          >
                            <EmojiIcon emoji="🗑️" size={13} className="mr-1.5" /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Formulario Inline para agregar/editar grabación */}
                    {isInstructorOrAdmin && editingRecordingSessionId === sesion.id && (
                      <form
                        onSubmit={(e) => handleGuardarGrabacion(e, sesion.id)}
                        style={{
                          marginTop: '12px',
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          padding: '14px',
                          border: '1px solid #475569',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#93c5fd' }}>
                          Adjuntar Grabación de Clase (YouTube, Vimeo o URL de video):
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="url"
                            placeholder="Ej: https://www.youtube.com/watch?v=..."
                            value={urlGrabacion}
                            onChange={(e) => setUrlGrabacion(e.target.value)}
                            style={{
                              flex: 1,
                              backgroundColor: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              color: '#fff',
                              padding: '8px 12px',
                              outline: 'none',
                              fontSize: '13px',
                            }}
                          />
                          <button
                            type="submit"
                            disabled={savingRecording}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            {savingRecording ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRecordingSessionId(null)}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#475569',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: PROGRAMAR NUEVA SESIÓN DE VIDEOCONFERENCIA ── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '520px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ×
            </button>

            <div>
              <h3
                style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <EmojiIcon emoji="📅" size={18} /> Programar Clase en Vivo
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                Completa los detalles para agendar la sesión. Notificaremos e invitaremos a todos
                los estudiantes inscritos por correo.
              </p>
            </div>

            <form
              onSubmit={handleCrearSesion}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* Título */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
                  Título de la Clase *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Sesión Q&A sobre React Hooks y Prisma"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px 14px',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Descripción */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
                  Descripción / Objetivos
                </label>
                <textarea
                  placeholder="Ej: Repasaremos los conceptos más complejos del módulo y resolveremos dudas del proyecto final."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows="3"
                  style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px 14px',
                    outline: 'none',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Fila: Fecha y Duración */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {/* Fecha */}
                <div
                  style={{
                    flex: '1 1 200px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
                    Fecha y Hora de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    required
                    style={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '10px 14px',
                      outline: 'none',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Duración */}
                <div
                  style={{
                    flex: '1 1 100px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    required
                    style={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '10px 14px',
                      outline: 'none',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {/* Configuración de Enlace Google Meet */}
              <div
                style={{
                  backgroundColor: '#0f172a55',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="toggleMeet"
                    checked={usarMeetAutomatico}
                    onChange={(e) => setUsarMeetAutomatico(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label
                    htmlFor="toggleMeet"
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Generar enlace de clase (Jitsi Meet instantáneo) automáticamente
                  </label>
                </div>

                {!usarMeetAutomatico && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
                      URL de la Reunión Personalizada *
                    </label>
                    <input
                      type="url"
                      placeholder="Ej: https://meet.google.com/xxx-yyyy-zzz"
                      value={urlReunion}
                      onChange={(e) => setUrlReunion(e.target.value)}
                      required={!usarMeetAutomatico}
                      style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '8px 12px',
                        outline: 'none',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Botones de Acción Formulario */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  marginTop: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Programando...' : 'Crear Sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ESTILOS GLOBALES DE ANIMACIONES EN LÍNEA ── */}
      <style jsx global>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
