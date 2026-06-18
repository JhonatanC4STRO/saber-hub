'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SeguimientoGrupal from './SeguimientoGrupal';
import SesionesClient from '@/components/sesiones/SesionesClient';
import CrearEvaluacion from '@/components/evaluaciones/CrearEvaluacion';
import EditarEvaluacion from '@/components/evaluaciones/EditarEvaluacion';
import CalificarManual from '@/components/evaluaciones/CalificarManual';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import {
  X,
  Users,
  TrendingUp,
  UserX,
  UserCheck,
  Search,
  Video,
  BarChart2,
  Calendar,
  Mail,
  FileText,
  FileSpreadsheet,
  User,
  ShieldAlert,
  ChevronRight,
  Activity,
  LayoutGrid,
  HelpCircle,
  Bell,
  Eye,
  Edit,
  MoreVertical,
  Copy,
  Plus,
  ArrowUpRight,
  Settings,
  CheckCircle,
  MessageSquare,
  Lock,
  Download,
  AlertTriangle,
  Star,
  Sparkles,
  ExternalLink,
  BookOpen,
  Link2,
  Trash2,
  Rocket
} from 'lucide-react';

function DetalleAprendizModal({ aprendiz, onCerrar }) {
  if (!aprendiz) return null;
  const ins = aprendiz;
  const u = ins.usuario;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[4px] w-full max-w-md shadow-lg border-b-2 border-b-[#1E40AF] p-6 relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[#1E40AF]">
            <User size={18} className="stroke-[2.5]" />
            <h3 className="font-bold text-[15px] text-[#111827]">Ficha del Aprendiz</h3>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-[4px] mb-4">
          <div className="w-12 h-12 rounded-full bg-[#1E40AF] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            {u?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-[14px] text-slate-800 truncate leading-tight">
              {u?.nombre}
            </h4>
            <div className="flex items-center gap-1.5 text-slate-500 mt-1 text-[12px]">
              <Mail size={12} className="flex-shrink-0 text-slate-400" />
              <span className="truncate">{u?.email}</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'Documento ID', value: u?.documento || 'No registrado' },
            { label: 'Estado del Curso', value: ins.estado === 'activo' ? 'Activo' : ins.estado === 'inactivo' ? 'Inactivo' : ins.estado === 'retirado' ? 'Retirado' : 'Finalizado' },
            { label: 'Progreso', value: `${Number(ins.progreso) || 0}%` },
            { label: 'F. Inscripción', value: new Date(ins.fechaInscripcion).toLocaleDateString('es-CO') },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="p-2.5 bg-white border border-slate-100 rounded-[4px] flex flex-col gap-0.5"
            >
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
              <p className="text-[13px] font-bold text-slate-700 mt-0.5 truncate">{value}</p>
            </div>
          ))}

          {/* Progress bar */}
          <div className="col-span-2 p-3 bg-white border border-slate-100 rounded-[4px] flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Progreso acumulado</span>
              <span className="text-[#1E40AF] font-bold">{Number(ins.progreso) || 0}%</span>
            </div>
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                style={{ width: `${Number(ins.progreso) || 0}%` }}
                className="h-full bg-[#1E40AF] rounded-full transition-all duration-300"
              />
            </div>
          </div>
        </div>

        <button
          onClick={onCerrar}
          className="w-full py-2 bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-[13px] rounded-[4px] shadow-sm transition-colors cursor-pointer"
        >
          Cerrar Ficha
        </button>
      </div>
    </div>
  );
}

function EnviarMensajeMasivoModal({ cursoId, cursoTitulo, onCerrar, inscripciones }) {
  const [asunto, setAsunto] = useState('');
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  // Vías de envío
  const [sendEmail, setSendEmail] = useState(true);
  const [sendChat, setSendChat] = useState(true);

  // Adjuntos
  const [archivoUrl, setArchivoUrl] = useState(null);
  const [archivoNombre, setArchivoNombre] = useState(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const fileInputRef = React.useRef(null);

  // Filtrado de destinatarios (activos e inactivos)
  const alumnosActivos = useMemo(() => {
    return (inscripciones || []).filter(ins => ins.estado === 'activo' || ins.estado === 'inactivo');
  }, [inscripciones]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroRapido, setFiltroRapido] = useState('todos');

  // Inicializar seleccionados con todos los alumnos activos del curso
  useEffect(() => {
    setSelectedIds(alumnosActivos.map(a => a.usuario?.id).filter(Boolean));
  }, [alumnosActivos]);

  const applyQuickSelection = (criterion) => {
    const threshold7 = new Date();
    threshold7.setDate(threshold7.getDate() - 7);
    const threshold14 = new Date();
    threshold14.setDate(threshold14.getDate() - 14);

    let targetIds = [];
    if (criterion === 'todos') {
      targetIds = alumnosActivos.map(a => a.usuario?.id).filter(Boolean);
    } else if (criterion === 'ninguno') {
      targetIds = [];
    } else {
      targetIds = alumnosActivos.filter(ins => {
        const progress = Number(ins.progreso) || 0;
        const lastAccess = ins.ultimoAcceso ? new Date(ins.ultimoAcceso) : new Date(ins.fechaInscripcion);
        
        switch (criterion) {
          case 'inactivos_7d':
            return lastAccess <= threshold7;
          case 'inactivos_14d':
            return lastAccess <= threshold14;
          case 'activos_recientes':
            return lastAccess > threshold7;
          case 'progreso_cero':
            return progress === 0;
          case 'progreso_bajo':
            return progress < 30;
          case 'progreso_medio':
            return progress >= 30 && progress < 80;
          case 'progreso_alto':
            return progress >= 80;
          case 'completado':
            return progress === 100;
          default:
            return false;
        }
      }).map(a => a.usuario?.id).filter(Boolean);
    }

    setSelectedIds(targetIds);
  };

  const alumnosVisibles = useMemo(() => {
    let result = alumnosActivos;

    // Apply quick filters
    if (filtroRapido !== 'todos') {
      const threshold7 = new Date();
      threshold7.setDate(threshold7.getDate() - 7);
      const threshold14 = new Date();
      threshold14.setDate(threshold14.getDate() - 14);

      result = result.filter(ins => {
        const progress = Number(ins.progreso) || 0;
        const lastAccess = ins.ultimoAcceso ? new Date(ins.ultimoAcceso) : new Date(ins.fechaInscripcion);
        
        switch (filtroRapido) {
          case 'inactivos_7d':
            return lastAccess <= threshold7;
          case 'inactivos_14d':
            return lastAccess <= threshold14;
          case 'activos_recientes':
            return lastAccess > threshold7;
          case 'progreso_cero':
            return progress === 0;
          case 'progreso_bajo':
            return progress < 30;
          case 'progreso_medio':
            return progress >= 30 && progress < 80;
          case 'progreso_alto':
            return progress >= 80;
          case 'completado':
            return progress === 100;
          default:
            return true;
        }
      });
    }

    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.usuario?.nombre?.toLowerCase().includes(q) ||
        a.usuario?.email?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [alumnosActivos, filtroRapido, searchQuery]);

  const handleToggleStudent = (userId) => {
    if (selectedIds.includes(userId)) {
      setSelectedIds(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedIds(prev => [...prev, userId]);
    }
  };

  const handleToggleSelectAll = () => {
    const visibleIds = alumnosVisibles.map(a => a.usuario?.id).filter(Boolean);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Límite de tamaño 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo excede el límite permitido de 10 MB.');
      return;
    }

    setSubiendoArchivo(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setArchivoUrl(data.url);
        setArchivoNombre(file.name);
      } else {
        setError(data.message || 'Error al subir el archivo.');
      }
    } catch (err) {
      setError('Error de conexión al cargar el archivo.');
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const handleRemoveFile = () => {
    setArchivoUrl(null);
    setArchivoNombre(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!contenido.trim()) {
      setError('El contenido del mensaje es obligatorio.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Debes seleccionar al menos un alumno destinatario.');
      return;
    }
    if (!sendEmail && !sendChat) {
      setError('Debes seleccionar al menos un canal de envío (Chat o Correo).');
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/cursos/${cursoId}/mensajes-masivos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          asunto, 
          contenido,
          destinatariosIds: selectedIds,
          sendEmail,
          sendChat,
          archivoUrl,
          archivoNombre
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setExito(true);
        setTimeout(() => {
          onCerrar();
        }, 2000);
      } else {
        setError(data.error || 'Error al enviar el mensaje masivo.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const visibleIds = alumnosVisibles.map(a => a.usuario?.id).filter(Boolean);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[4px] w-full max-w-2xl shadow-lg border-b-2 border-b-[#1E40AF] p-6 relative flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-[#1E40AF]">
            <Mail size={18} className="stroke-[2.5]" />
            <h3 className="font-bold text-[15px] text-[#111827]">Enviar Mensaje Masivo</h3>
          </div>
          <button
            onClick={onCerrar}
            disabled={enviando}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {exito ? (
          <div className="py-8 text-center flex flex-col items-center gap-3 flex-grow justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              ✓
            </div>
            <h4 className="font-bold text-[15px] text-slate-800">¡Mensaje enviado con éxito!</h4>
            <p className="text-[13px] text-slate-500">
              Se ha enviado el mensaje a los {selectedIds.length} alumnos seleccionados.
            </p>
          </div>
        ) : (
          <form onSubmit={handleEnviar} className="flex flex-col gap-4 overflow-y-auto pr-1 flex-grow">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-[4px] text-[12.5px] text-red-650 font-bold flex-shrink-0">
                ⚠️ {error}
              </div>
            )}

            {/* Configuración de canales de envío */}
            <div className="bg-slate-50 border border-slate-200 rounded-[4px] p-3 flex flex-wrap gap-6 items-center flex-shrink-0">
              <span className="text-[11.5px] font-bold text-slate-500 uppercase tracking-wide">
                Canales de envío:
              </span>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendChat}
                  onChange={(e) => setSendChat(e.target.checked)}
                  disabled={enviando}
                  className="w-4 h-4 text-[#1E40AF] rounded border-slate-300 focus:ring-[#1E40AF] cursor-pointer"
                />
                💬 Chat Interno (Bandeja)
              </label>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  disabled={enviando}
                  className="w-4 h-4 text-[#1E40AF] rounded border-slate-300 focus:ring-[#1E40AF] cursor-pointer"
                />
                ✉️ Correo Electrónico
              </label>
            </div>

            {/* Grid Layout: Left (Form) & Right (Recipients Filter) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-0 flex-grow">
              
              {/* Left Column (Inputs) - col-span-7 */}
              <div className="md:col-span-7 flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Asunto del Mensaje (Opcional)
                  </label>
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder={`Anuncio de ${cursoTitulo}`}
                    disabled={enviando}
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-[4px] text-[13px] text-slate-850 focus:outline-none focus:border-[#1E40AF] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1 flex-grow min-h-0">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Mensaje *
                  </label>
                  <textarea
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    placeholder="Escribe el contenido del mensaje aquí..."
                    disabled={enviando}
                    required
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-[4px] text-[13px] text-slate-850 focus:outline-none focus:border-[#1E40AF] transition-all resize-none flex-grow min-h-[140px]"
                  />
                </div>

                {/* Adjunto de archivo */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Archivo adjunto (PDF, Img, Doc - Máx. 10MB)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={enviando || subiendoArchivo}
                  />
                  {archivoUrl ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-150 rounded-[4px] text-[12.5px] text-emerald-800">
                      <span className="font-semibold truncate max-w-[280px]">
                        📎 {archivoNombre}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        disabled={enviando}
                        className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={enviando || subiendoArchivo}
                      className={`w-full py-2 border border-dashed rounded-[4px] text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        subiendoArchivo
                          ? 'bg-slate-50 border-slate-300 text-slate-400'
                          : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {subiendoArchivo ? (
                        <span>⏳ Subiendo archivo...</span>
                      ) : (
                        <>
                          <span>➕</span> Adjuntar archivo
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column (Recipients list) - col-span-5 */}
              <div className="md:col-span-5 flex flex-col gap-2 min-h-[200px] md:min-h-0">
                <div className="flex justify-between items-center flex-shrink-0">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Destinatarios ({selectedIds.length}/{alumnosActivos.length})
                  </label>
                </div>

                {/* Filtro por estado/progreso */}
                <div className="flex flex-col gap-1 flex-shrink-0 font-sans">
                  <select
                    value={filtroRapido}
                    onChange={(e) => setFiltroRapido(e.target.value)}
                    disabled={enviando}
                    className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-[4px] text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-[#1E40AF] transition-all cursor-pointer"
                  >
                    <option value="todos">Mostrar todos los alumnos</option>
                    <option value="inactivos_7d">Inactivos (&gt; 7 días)</option>
                    <option value="inactivos_14d">Inactivos (&gt; 14 días)</option>
                    <option value="activos_recientes">Activos recientemente</option>
                    <option value="progreso_cero">Sin iniciar (0% de avance)</option>
                    <option value="progreso_bajo">Progreso bajo (&lt; 30%)</option>
                    <option value="progreso_medio">Progreso medio (30% - 79%)</option>
                    <option value="progreso_alto">Progreso alto (&gt;= 80%)</option>
                    <option value="completado">Completado (100% progreso)</option>
                  </select>
                </div>

                <div className="relative flex-shrink-0">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por nombre o email..."
                    disabled={enviando}
                    className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-[4px] text-[12px] text-slate-800 focus:outline-none focus:border-[#1E40AF] transition-all"
                  />
                </div>

                {/* Selección Rápida */}
                <div className="flex flex-col gap-0.5 bg-slate-50 border border-slate-200/60 p-2 rounded-[4px] flex-shrink-0 font-sans">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Selección Rápida (Reemplazar selección):
                  </span>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[#1E40AF] font-bold">
                    <button type="button" onClick={() => applyQuickSelection('todos')} disabled={enviando} className="hover:underline cursor-pointer bg-transparent border-0 p-0 font-bold text-[#1E40AF]">Todos</button>
                    <span className="text-slate-300">·</span>
                    <button type="button" onClick={() => applyQuickSelection('ninguno')} disabled={enviando} className="hover:underline cursor-pointer bg-transparent border-0 p-0 font-bold text-[#1E40AF]">Ninguno</button>
                    <span className="text-slate-300">·</span>
                    <button type="button" onClick={() => applyQuickSelection('inactivos_7d')} disabled={enviando} className="hover:underline cursor-pointer bg-transparent border-0 p-0 font-bold text-[#1E40AF]">Inactivos</button>
                    <span className="text-slate-300">·</span>
                    <button type="button" onClick={() => applyQuickSelection('progreso_bajo')} disabled={enviando} className="hover:underline cursor-pointer bg-transparent border-0 p-0 font-bold text-[#1E40AF]">Bajo Prog.</button>
                    <span className="text-slate-300">·</span>
                    <button type="button" onClick={() => applyQuickSelection('progreso_alto')} disabled={enviando} className="hover:underline cursor-pointer bg-transparent border-0 p-0 font-bold text-[#1E40AF]">Alto Prog.</button>
                    <span className="text-slate-300">·</span>
                    <button type="button" onClick={() => applyQuickSelection('progreso_cero')} disabled={enviando} className="hover:underline cursor-pointer bg-transparent border-0 p-0 font-bold text-[#1E40AF]">Sin iniciar</button>
                  </div>
                </div>

                <div className="border border-slate-150 rounded-[4px] flex-grow overflow-y-auto max-h-[180px] md:max-h-none bg-slate-50/50 p-2">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-[11px] font-semibold text-slate-400 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      disabled={enviando || alumnosVisibles.length === 0}
                      className="text-[#1E40AF] hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      {isAllVisibleSelected ? 'Deseleccionar visibles' : 'Seleccionar visibles'}
                    </button>
                  </div>

                  {alumnosVisibles.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-[12px] italic">
                      No hay alumnos destinatarios que coincidan.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {alumnosVisibles.map(ins => {
                        const isChecked = selectedIds.includes(ins.usuario?.id);
                        return (
                          <label
                            key={ins.id}
                            className={`flex items-start gap-2.5 p-2 rounded border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-blue-50/40 border-blue-150 text-slate-800'
                                : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStudent(ins.usuario?.id)}
                              disabled={enviando}
                              className="mt-0.5 w-3.5 h-3.5 text-[#1E40AF] rounded border-slate-350 focus:ring-[#1E40AF] cursor-pointer"
                            />
                            <div className="min-w-0 leading-tight">
                              <p className="font-bold text-[12.5px] truncate">{ins.usuario?.nombre}</p>
                              <p className="font-normal text-[10px] text-slate-400 truncate mt-0.5">{ins.usuario?.email}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100 font-sans flex-shrink-0">
              <button
                type="button"
                onClick={onCerrar}
                disabled={enviando}
                className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-[13px] rounded-[4px] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || subiendoArchivo}
                className="flex-1 py-2 bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-[13px] rounded-[4px] shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {enviando ? 'Enviando...' : (
                  <>
                    <Mail size={14} /> Enviar a {selectedIds.length} alumno(s)
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function DetalleCurso({ curso, onCerrar, onEstadoCambiado, userRole = 'instructor' }) {
  const router = useRouter();

  // Core data states
  const [cursoCompleto, setCursoCompleto] = useState(curso);
  const [usuarioSession, setUsuarioSession] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & UI states
  const [vistaActiva, setVistaActiva] = useState('resumen'); // 'resumen' | 'aprendices' | 'evaluaciones' | 'sesiones' | 'foro' | 'configuracion'
  const [showMassMessageModal, setShowMassMessageModal] = useState(false);
  const [aprendizSeleccionado, setAprendizSeleccionado] = useState(null);
  const [dandoBaja, setDandoBaja] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showDespublicarModal, setShowDespublicarModal] = useState(false);
  const [filtroProgreso, setFiltroProgreso] = useState('total'); // 'semana' | 'mes' | 'total'
  const [customModal, setCustomModal] = useState(null);

  const showConfirm = (title, message, onConfirm, type = 'warning', confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type,
      isConfirm: true,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      type,
      isConfirm: false,
      onConfirm,
      confirmText: 'Aceptar',
      cancelText: ''
    });
  };

  // Dynamic counts loaded from endpoints
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [foroHilos, setForoHilos] = useState([]);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
  const [subVistaEvaluacion, setSubVistaEvaluacion] = useState('lista'); // 'lista' | 'detalle' | 'editar' | 'calificar' | 'crear'

  // Fetch Full Course + Session
  useEffect(() => {
    const fetchFullData = async () => {
      try {
        const [resCurso, resUser] = await Promise.all([
          fetch(`/api/cursos/${curso.id}`),
          fetch('/api/auth/me')
        ]);
        if (resCurso.ok) {
          const data = await resCurso.json();
          setCursoCompleto(data);
        }
        if (resUser.ok) {
          const u = await resUser.json();
          setUsuarioSession(u);
        }
      } catch (err) {
        console.error('Error fetching full course details:', err);
      }
    };
    fetchFullData();
  }, [curso.id]);

  // Fetch Student Enrollments
  const fetchInscripciones = useCallback(async () => {
    try {
      const res = await fetch(`/api/inscripciones?cursoId=${curso.id}`);
      if (res.ok) {
        const data = await res.json();
        setInscripciones(data.inscripciones || []);
      }
    } catch (err) {
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  }, [curso.id]);

  // Fetch Metadata counts (evaluations, live sessions, forum threads)
  const fetchMetadata = useCallback(async () => {
    try {
      const [resEval, resSes, resForo] = await Promise.all([
        fetch(`/api/evaluaciones?cursoId=${curso.id}`),
        fetch(`/api/cursos/${curso.id}/sesiones`),
        fetch(`/api/cursos/${curso.id}/foro`),
      ]);

      if (resEval.ok) {
        const evals = await resEval.json();
        setEvaluaciones(evals || []);
      }
      if (resSes.ok) {
        const sess = await resSes.json();
        setSesiones(sess.sesiones || sess || []);
      }
      if (resForo.ok) {
        const forum = await resForo.json();
        setForoHilos(forum.hilos || []);
      }
    } catch (err) {
      console.error('Error fetching metadata counts:', err);
    }
  }, [curso.id]);

  useEffect(() => {
    fetchInscripciones();
    fetchMetadata();
  }, [fetchInscripciones, fetchMetadata]);

  // Actions
  const handleDarDeBaja = async (ins, bypassConfirm = false) => {
    if (!bypassConfirm) {
      showConfirm(
        '¿Dar de baja a alumno?',
        `¿Estás seguro de que deseas dar de baja a "${ins.usuario?.nombre}" del curso? Su progreso quedará guardado.`,
        () => handleDarDeBaja(ins, true),
        'warning',
        'Sí, dar de baja'
      );
      return;
    }
    setDandoBaja(ins.id);
    try {
      const res = await fetch(`/api/inscripciones/${ins.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'retirado' }),
      });
      if (res.ok) {
        fetchInscripciones();
      } else {
        const data = await res.json();
        showAlert('Error', 'Error: ' + data.message, 'error');
      }
    } catch {
      showAlert('Error', 'Error de red', 'error');
    } finally {
      setDandoBaja(null);
    }
  };

  const handleReactivar = async (ins, bypassConfirm = false) => {
    if (!bypassConfirm) {
      showConfirm(
        '¿Reactivar alumno?',
        `¿Reactivar la inscripción de "${ins.usuario?.nombre}"?`,
        () => handleReactivar(ins, true),
        'info',
        'Sí, reactivar'
      );
      return;
    }
    setDandoBaja(ins.id);
    try {
      const res = await fetch(`/api/inscripciones/${ins.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'activo' }),
      });
      if (res.ok) {
        fetchInscripciones();
      }
    } catch {
      showAlert('Error', 'Error de red', 'error');
    } finally {
      setDandoBaja(null);
    }
  };

  const handleDesactivar = async (ins, bypassConfirm = false) => {
    if (!bypassConfirm) {
      showConfirm(
        '¿Desactivar alumno?',
        `¿Desactivar la inscripción de "${ins.usuario?.nombre}"? Quedará en estado Inactivo.`,
        () => handleDesactivar(ins, true),
        'warning',
        'Sí, desactivar'
      );
      return;
    }
    setDandoBaja(ins.id);
    try {
      const res = await fetch(`/api/inscripciones/${ins.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'inactivo' }),
      });
      if (res.ok) {
        fetchInscripciones();
      } else {
        const data = await res.json();
        showAlert('Error', 'Error: ' + data.message, 'error');
      }
    } catch {
      showAlert('Error', 'Error de red', 'error');
    } finally {
      setDandoBaja(null);
    }
  };

  const handleToggleEstado = async (bypassConfirm = false) => {
    const nuevoEstado = cursoCompleto.estado === 'publicado' ? 'borrador' : 'publicado';
    
    if (cursoCompleto.estado === 'publicado' && !bypassConfirm) {
      setShowDespublicarModal(true);
      setShowMoreDropdown(false);
      return;
    }
    
    if (cursoCompleto.estado !== 'publicado' && !bypassConfirm) {
      showConfirm(
        '¿Publicar curso?',
        '¿Deseas cambiar el estado del curso a Publicado? Estará visible para todos los estudiantes en el catálogo.',
        () => handleToggleEstado(true),
        'success',
        'Sí, publicar'
      );
      return;
    }

    try {
      const res = await fetch(`/api/cursos/${curso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        setCursoCompleto(prev => ({ ...prev, estado: nuevoEstado }));
        if (onEstadoCambiado) onEstadoCambiado(nuevoEstado);
        showAlert(
          nuevoEstado === 'publicado' ? 'Curso publicado' : 'Curso guardado',
          `El curso ha sido ${nuevoEstado === 'publicado' ? 'publicado' : 'guardado como borrador'} exitosamente.`,
          'success'
        );
      } else {
        let errorMsg = 'Error al cambiar estado.';
        try {
          const err = await res.json();
          errorMsg = err.message || errorMsg;
        } catch {
          try {
            const txt = await res.text();
            errorMsg = txt.substring(0, 150) || errorMsg;
          } catch {}
        }
        showAlert('Error', errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      showAlert('Error', `Error al conectar con el servidor: ${err.message || err}`, 'error');
    }
    setShowMoreDropdown(false);
    setShowDespublicarModal(false);
  };

  const handleDuplicarCurso = async (bypassConfirm = false) => {
    if (!bypassConfirm) {
      showConfirm(
        '¿Duplicar curso?',
        `¿Estás seguro de que deseas duplicar este curso?\nSe creará una copia en borrador con el título: "Copia de ${cursoCompleto.titulo}".`,
        () => handleDuplicarCurso(true),
        'info',
        'Sí, duplicar'
      );
      return;
    }
    try {
      const res = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: `Copia de ${cursoCompleto.titulo}`,
          descripcion: cursoCompleto.descripcion || 'Sin descripción',
          categoria: cursoCompleto.categoria?.nombre || 'General',
          instructorId: cursoCompleto.instructorId || usuarioSession?.id,
          imgPortada: cursoCompleto.imgPortada || null,
          institucionId: cursoCompleto.institucionId || null,
          nivel: cursoCompleto.nivel || 'Principiante',
        }),
      });

      if (res.ok) {
        showAlert(
          'Curso duplicado',
          'Curso duplicado exitosamente. Se recargará la lista de gestión.',
          'success',
          () => {
            onCerrar();
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        );
      } else {
        let errorMsg = 'Error al duplicar el curso.';
        try {
          const err = await res.json();
          errorMsg = err.message || errorMsg;
        } catch {
          try {
            const txt = await res.text();
            errorMsg = txt.substring(0, 150) || errorMsg;
          } catch {}
        }
        showAlert('Error', errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error al duplicar curso:', err);
      showAlert('Error', `Error de red al duplicar el curso: ${err.message || err}`, 'error');
    }
    setShowMoreDropdown(false);
  };

  const handleEliminarCurso = async (bypassConfirm = false) => {
    if (inscripciones.length > 0) {
      showAlert(
        'Acción no permitida',
        'No se puede eliminar un curso que tiene alumnos inscritos.',
        'warning'
      );
      return;
    }
    if (!bypassConfirm) {
      showConfirm(
        '¿Archivar curso?',
        `¿Estás seguro de eliminar permanentemente el curso "${cursoCompleto.titulo}"? Esta acción no se puede deshacer.`,
        () => handleEliminarCurso(true),
        'danger',
        'Sí, archivar'
      );
      return;
    }
    try {
      const res = await fetch(`/api/cursos/${curso.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showAlert(
          'Curso eliminado',
          'Curso eliminado (archivado) exitosamente.',
          'success',
          () => {
            onCerrar();
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        );
      } else {
        let errorMsg = 'Error al eliminar el curso.';
        try {
          const err = await res.json();
          errorMsg = err.message || errorMsg;
        } catch {
          try {
            const txt = await res.text();
            errorMsg = txt.substring(0, 150) || errorMsg;
          } catch {}
        }
        showAlert('Error', errorMsg, 'error');
      }
    } catch (err) {
      console.error('Error al eliminar curso:', err);
      showAlert('Error', `Error al conectar con el servidor: ${err.message || err}`, 'error');
    }
    setShowMoreDropdown(false);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/cursos/${curso.id}`);
      showAlert(
        'Enlace copiado',
        '¡Enlace del curso copiado al portapapeles!',
        'success'
      );
      setShowMoreDropdown(false);
    }
  };

  const handleEditarCurso = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('saberhub_curso_id', curso.id);
      router.push('/CrearCursos');
    }
  };

  const handleVerComoAlumno = () => {
    router.push(`/cursos/${curso.id}`);
  };

  // Exporters
  const exportAlumnosExcel = () => {
    if (inscripciones.length === 0) {
      showAlert('Exportar alumnos', 'No hay alumnos inscritos para exportar.', 'info');
      return;
    }
    
    const rowsHtml = inscripciones.map((ins, index) => {
      const isEven = index % 2 === 0;
      const rowClass = isEven ? 'even' : 'odd';
      
      const progreso = `${Number(ins.progreso) || 0}%`;
      const estado = ins.estado || 'activo';
      const fecha = ins.fechaInscripcion 
        ? new Date(ins.fechaInscripcion).toLocaleDateString('es-CO')
        : 'N/A';
        
      let estadoStyle = '';
      if (estado === 'activo') {
        estadoStyle = 'background-color: #DEF7EC; color: #03543F; border: 1px solid #BCF0DA;';
      } else if (estado === 'finalizado') {
        estadoStyle = 'background-color: #E1EFFE; color: #1E429F; border: 1px solid #C3DDFD;';
      } else if (estado === 'retirado') {
        estadoStyle = 'background-color: #FDE8E8; color: #9B1C1C; border: 1px solid #FBD5D5;';
      } else {
        estadoStyle = 'background-color: #F3F4F6; color: #374151; border: 1px solid #E5E7EB;';
      }

      return `
        <tr class="${rowClass}">
          <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1F2937; mso-number-format:'\\@';">${ins.usuario?.nombre || 'N/A'}</td>
          <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563; mso-number-format:'\\@';">${ins.usuario?.email || 'N/A'}</td>
          <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563; text-align: center; mso-number-format:'\\@';">${ins.usuario?.documento || 'N/A'}</td>
          <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1F2937; text-align: center; font-weight: bold; mso-number-format:'0%';">${progreso}</td>
          <td style="border: 1px solid #E5E7EB; padding: 8px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; text-align: center; font-weight: bold; ${estadoStyle}">${estado.toUpperCase()}</td>
          <td style="border: 1px solid #E5E7EB; padding: 10px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563; text-align: center; mso-number-format:'yyyy\\-mm\\-dd';">${fecha}</td>
        </tr>
      `;
    }).join('');

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Listado de Aprendices</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          .odd { background-color: #F9FAFB; }
          .even { background-color: #FFFFFF; }
        </style>
      </head>
      <body>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td colspan="6" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: bold; color: #1E40AF; padding: 12px 0 6px 0;">SaberHub - Listado de Aprendices</td>
          </tr>
          <tr>
            <td colspan="6" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563;"><strong>Curso:</strong> ${cursoCompleto?.titulo || ''}</td>
          </tr>
          <tr>
            <td colspan="6" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #4B5563;"><strong>Instructor:</strong> ${cursoCompleto?.instructor?.nombre || 'N/A'}</td>
          </tr>
          <tr>
            <td colspan="6" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #6B7280; padding-bottom: 20px;"><strong>Fecha de Reporte:</strong> ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}</td>
          </tr>
          <tr>
            <td colspan="6" style="height: 12px;"></td>
          </tr>
          <thead>
            <tr>
              <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: left;">Nombre</th>
              <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: left;">Email</th>
              <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Documento</th>
              <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Progreso</th>
              <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Estado</th>
              <th style="background-color: #1E40AF; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; border: 1px solid #1E40AF; padding: 12px; text-align: center;">Fecha Inscripción</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Alumnos_${cursoCompleto.titulo.replace(/\s+/g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportReportePDF = () => {
    window.print();
  };

  // Filters & Metrics Calculations
  const filtradas = useMemo(() => {
    return inscripciones.filter((ins) => {
      const matchBusqueda =
        !busqueda ||
        ins.usuario?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        ins.usuario?.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
        ins.usuario?.documento?.includes(busqueda);
      const matchEstado = filtroEstado === 'todos' || ins.estado === filtroEstado;
      return matchBusqueda && matchEstado;
    });
  }, [inscripciones, busqueda, filtroEstado]);

  const contadores = useMemo(() => {
    return {
      total: inscripciones.length,
      activos: inscripciones.filter((i) => i.estado === 'activo').length,
      inactivos: inscripciones.filter((i) => i.estado === 'inactivo').length,
      retirados: inscripciones.filter((i) => i.estado === 'retirado').length,
      finalizados: inscripciones.filter((i) => i.estado === 'finalizado').length,
    };
  }, [inscripciones]);

  const promedioProgreso = useMemo(() => {
    if (inscripciones.length === 0) return 0;
    return Math.round(
      inscripciones.reduce((acc, i) => acc + (Number(i.progreso) || 0), 0) /
        inscripciones.length
    );
  }, [inscripciones]);

  const esteMesCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return inscripciones.filter(ins => new Date(ins.fechaInscripcion) >= thirtyDaysAgo).length;
  }, [inscripciones]);

  const tasaFinalizacion = useMemo(() => {
    if (inscripciones.length === 0) return 0;
    return Math.round((contadores.finalizados / inscripciones.length) * 100);
  }, [inscripciones, contadores.finalizados]);

  // Alumnos con alertas (Inactivos por más de 7 días o progreso < 30% tras 7 días de matrícula)
  const alumnosAlertas = useMemo(() => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 7);

    return inscripciones.filter(ins => {
      if (ins.estado !== 'activo') return false;
      const progress = Number(ins.progreso) || 0;
      if (progress >= 100) return false;

      // Alertas basadas en inactividad o progreso estancado
      if (!ins.ultimoAcceso) {
        return new Date(ins.fechaInscripcion) <= thresholdDate;
      }
      return new Date(ins.ultimoAcceso) <= thresholdDate || (progress < 30 && new Date(ins.fechaInscripcion) <= thresholdDate);
    }).map(ins => {
      let diasInactivo = 0;
      const baseDate = ins.ultimoAcceso ? new Date(ins.ultimoAcceso) : new Date(ins.fechaInscripcion);
      const diffTime = Math.abs(new Date() - baseDate);
      diasInactivo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const progresoVal = Number(ins.progreso) || 0;
      return {
        ...ins,
        diasInactivo,
        progresoVal
      };
    }).sort((a, b) => b.diasInactivo - a.diasInactivo);
  }, [inscripciones]);

  // Real course activity timeline aggregation
  const actividadesRecientes = useMemo(() => {
    const items = [];
    
    // Enrollments
    inscripciones.forEach(ins => {
      items.push({
        id: `enroll-${ins.id}`,
        tipo: 'matricula',
        titulo: `${ins.usuario?.nombre || 'Un estudiante'} se inscribió al curso`,
        fecha: new Date(ins.fechaInscripcion),
        subtext: ins.usuario?.email
      });
      
      if (Number(ins.progreso) >= 100) {
        items.push({
          id: `done-${ins.id}`,
          tipo: 'completado',
          titulo: `${ins.usuario?.nombre || 'Un estudiante'} completó el curso 🎉`,
          fecha: ins.ultimoAcceso ? new Date(ins.ultimoAcceso) : new Date(ins.fechaInscripcion),
          subtext: 'Certificación generada'
        });
      }
    });

    // Forum posts
    foroHilos.forEach(hilo => {
      items.push({
        id: `forum-${hilo.id}`,
        tipo: 'foro',
        titulo: `Nueva pregunta en el foro: "${hilo.titulo}"`,
        fecha: new Date(hilo.creado),
        subtext: `Por: ${hilo.usuario?.nombre}`
      });
    });

    // Sort by date desc
    return items.sort((a, b) => b.fecha - a.fecha).slice(0, 5);
  }, [inscripciones, foroHilos]);

  // Modules completion rates calculations
  const modulosCompletoData = useMemo(() => {
    if (!cursoCompleto.modulos || cursoCompleto.modulos.length === 0) return [];
    const totalModulos = cursoCompleto.modulos.length;
    
    return cursoCompleto.modulos.map((modulo, idx) => {
      if (inscripciones.length === 0) return { ...modulo, rate: 0 };
      // Estimación del progreso mínimo para haber completado este módulo
      const threshold = ((idx + 1) / totalModulos) * 100;
      const completedCount = inscripciones.filter(ins => (Number(ins.progreso) || 0) >= threshold).length;
      const rate = Math.round((completedCount / inscripciones.length) * 100);
      return {
        ...modulo,
        rate
      };
    });
  }, [cursoCompleto.modulos, inscripciones]);

  // Configurations Submit Form
  const [configCriterioLecciones, setConfigCriterioLecciones] = useState(cursoCompleto.criterioLeccionesMin || 80);
  const [configCriterioEval, setConfigCriterioEval] = useState(cursoCompleto.criterioEvalAprobadas || 100);
  const [configCriterioNota, setConfigCriterioNota] = useState(cursoCompleto.criterioNotaGlobal || 70);
  const [configOtorgaCertificado, setConfigOtorgaCertificado] = useState(cursoCompleto.otorgaCertificado || false);
  const [configGuardando, setConfigGuardando] = useState(false);

  useEffect(() => {
    setConfigCriterioLecciones(cursoCompleto.criterioLeccionesMin || 80);
    setConfigCriterioEval(cursoCompleto.criterioEvalAprobadas || 100);
    setConfigCriterioNota(cursoCompleto.criterioNotaGlobal || 70);
    setConfigOtorgaCertificado(cursoCompleto.otorgaCertificado || false);
  }, [cursoCompleto]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigGuardando(true);
    try {
      const res = await fetch(`/api/cursos/${curso.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otorgaCertificado: configOtorgaCertificado,
          criterioLeccionesMin: Number(configCriterioLecciones),
          criterioEvalAprobadas: Number(configCriterioEval),
          criterioNotaGlobal: Number(configCriterioNota),
        }),
      });

      if (res.ok) {
        showAlert('Configuración guardada', 'Criterios de acreditación actualizados correctamente.', 'success');
        const updated = await res.json();
        if (updated.curso) {
          setCursoCompleto(prev => ({ ...prev, ...updated.curso }));
        }
      } else {
        showAlert('Error', 'Error al guardar la configuración.', 'error');
      }
    } catch {
      showAlert('Error', 'Error de red', 'error');
    } finally {
      setConfigGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F9FAFB] z-[2000] overflow-y-auto flex flex-col font-sans select-none animate-in fade-in duration-200" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      <HeaderAdmin usuario={usuarioSession} />

      {/* 2. HEADER STICKY DEL CURSO (fondo blanco, padding 16px 32px, borde inferior 1px #F3F4F6) */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#F3F4F6] px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
          <button
            onClick={onCerrar}
            className="font-medium text-[14px] text-[#6B7280] hover:text-[#1E40AF] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>←</span> Mis cursos
          </button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <h2 className="font-bold text-[18px] text-[#111827]">
            {cursoCompleto.titulo}
          </h2>
          <span className={`font-bold text-[11px] px-2.5 py-0.8 rounded-[4px] border ${
            cursoCompleto.estado === 'publicado'
              ? 'bg-[#E6F4EA] border-[#B7E1CD] text-[#137333]'
              : 'bg-[#FEF7E0] border-[#FCE8B2] text-[#B06000]'
          }`}>
            {cursoCompleto.estado === 'publicado' ? 'PUBLICADO' : 'BORRADOR'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleVerComoAlumno}
            className="flex items-center gap-1.5 border border-[#D1D5DB] bg-white hover:bg-slate-50 px-4 py-2 rounded font-semibold text-[13px] text-[#374151] transition-colors cursor-pointer"
          >
            <Eye size={15} />
            Ver como alumno ↗
          </button>
          <button
            onClick={handleEditarCurso}
            className="flex items-center gap-1.5 border border-[#1E40AF] bg-white hover:bg-blue-50/40 px-4 py-2 rounded font-semibold text-[13px] text-[#1E40AF] transition-colors cursor-pointer"
          >
            <Edit size={15} />
            Editar curso
          </button>
          
          {/* Options Dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
              className="p-2 border border-[#D1D5DB] rounded hover:bg-slate-50 text-[#1E40AF] cursor-pointer flex items-center justify-center h-[38px] w-[38px]"
              title="Más opciones"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMoreDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMoreDropdown(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={handleDuplicarCurso}
                    className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Copy size={14} /> Duplicar curso
                  </button>
                  <button
                    onClick={() => {
                      showAlert('Módulo en desarrollo', 'Ver analíticas completas - Módulo en desarrollo', 'info');
                      setShowMoreDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <BarChart2 size={14} /> Ver analíticas completas
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Link2 size={14} /> Copiar enlace del curso
                  </button>
                  <button
                    onClick={() => {
                      setShowMassMessageModal(true);
                      setShowMoreDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Mail size={14} /> Enviar mensaje masivo
                  </button>
                  <button
                    onClick={() => {
                      showAlert('Exportar contenido', 'Iniciando descarga de contenidos del curso...', 'success');
                      setShowMoreDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Download size={14} /> Exportar contenido
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={handleToggleEstado}
                    className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold cursor-pointer"
                  >
                    <ShieldAlert size={14} /> {cursoCompleto.estado === 'publicado' ? 'Despublicar curso' : 'Publicar curso'}
                  </button>
                  <button
                    onClick={handleEliminarCurso}
                    disabled={inscripciones.length > 0}
                    className="w-full text-left px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold disabled:opacity-40 cursor-pointer"
                  >
                    <X size={14} /> Eliminar curso
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABS DE NAVEGACIÓN (padding 0 32px, borde inferior 1px #F3F4F6) */}
      <div className="bg-white border-b border-[#F3F4F6] px-8 flex-shrink-0">
        <div className="flex gap-8 overflow-x-auto no-scrollbar h-12 items-center">
          {[
            { key: 'resumen', label: 'Resumen' },
            { key: 'aprendices', label: 'Alumnos', badge: inscripciones.length },
            { key: 'evaluaciones', label: 'Evaluaciones', badge: evaluaciones.length },
            { key: 'sesiones', label: 'Sesiones en vivo', badge: sesiones.length },
            { key: 'foro', label: 'Foro', badge: `${foroHilos.length} hilos` },
            { key: 'configuracion', label: 'Configuración' },
          ].map((tab) => {
            const isActive = vistaActiva === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setVistaActiva(tab.key)}
                className={`relative h-full flex items-center gap-1.5 font-semibold text-[13.5px] transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-[#EFF6FF] text-[#1E40AF]' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E40AF]"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CUERPO PRINCIPAL (fondo #F9FAFB, padding 32px) */}
      <main className="flex-grow bg-[#F9FAFB] p-6 lg:p-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA PRINCIPAL (68% / col-span-8) */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            
            {/* VIEW: RESUMEN (DASHBOARD) */}
            {vistaActiva === 'resumen' && (
              <>
                {/* Sección 1 — Métricas del curso */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Alumnos Inscritos',
                      value: contadores.total,
                      sub: esteMesCount > 0 ? `↑ ${esteMesCount} este mes` : 'Sin altas este mes',
                      subColor: 'text-[#1E40AF]'
                    },
                    {
                      label: 'Tasa de Finalización',
                      value: `${tasaFinalizacion}%`,
                      sub: contadores.finalizados > 0 ? `↑ ${contadores.finalizados} completados` : '0 graduados',
                      subColor: 'text-[#1E40AF]'
                    },
                    {
                      label: 'Calificación Promedio',
                      value: '4.8 ★',
                      sub: '(247 calificaciones)',
                      subColor: 'text-[#6B7280]'
                    },
                    {
                      label: 'Ingresos Generados',
                      value: 'Gratuito',
                      sub: '0 COP',
                      subColor: 'text-[#6B7280]'
                    }
                  ].map(({ label, value, sub, subColor }, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 flex flex-col gap-1 shadow-sm"
                    >
                      <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{label}</span>
                      <p className="text-2xl md:text-3xl font-bold text-[#111827] mt-1">{value}</p>
                      <span className={`text-[12px] font-semibold mt-1.5 ${subColor}`}>{sub}</span>
                    </div>
                  ))}
                </div>

                {/* Sección 2 — Progreso de los alumnos */}
                <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-[17px] text-[#111827]"> </h3>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-[4px] p-0.5 gap-1">
                      {[
                        { key: 'semana', label: 'Esta semana' },
                        { key: 'mes', label: 'Este mes' },
                        { key: 'total', label: 'Total' }
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setFiltroProgreso(t.key)}
                          className={`px-3 py-1 rounded-[3px] text-[11px] font-bold transition-all cursor-pointer ${
                            filtroProgreso === t.key 
                              ? 'bg-[#DBEAFE] text-[#1E40AF]' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {modulosCompletoData.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-[13px] font-medium">
                      El curso no tiene módulos de contenido configurados todavía.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {modulosCompletoData.map((modulo, idx) => (
                        <div key={modulo.id} className="flex items-center gap-4">
                          <span className="text-[12px] font-bold text-[#4B5563] w-[120px] truncate">
                            Módulo {idx + 1}: {modulo.titulo}
                          </span>
                          <div className="flex-1 h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${modulo.rate}%` }}
                              className="h-full bg-[#1E40AF] rounded-full transition-all duration-300"
                            />
                          </div>
                          <span className="text-[13px] font-bold text-[#1E40AF] w-12 text-right">
                            {modulo.rate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sección 3 — Alumnos con alertas */}
                <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[17px] text-[#111827]">⚠ Alumnos que necesitan atención</h3>
                      <span className="bg-[#FEF3C7] text-[#92400E] font-bold text-[10px] px-2 py-0.5 rounded-[4px]">
                        {alumnosAlertas.length} ALERTAS
                      </span>
                    </div>
                    {alumnosAlertas.length > 0 && (
                      <button
                        onClick={() => setVistaActiva('aprendices')}
                        className="text-[#1E40AF] hover:underline font-semibold text-[13px] cursor-pointer"
                      >
                        Ver todos →
                      </button>
                    )}
                  </div>

                  {alumnosAlertas.length === 0 ? (
                    <div className="py-8 text-center text-emerald-600 font-semibold text-[13px] flex flex-col items-center justify-center gap-1">
                      <CheckCircle size={28} className="text-emerald-500 mb-1" />
                      <span>No hay alumnos que requieran atención en este momento. ¡Excelente desempeño!</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[13px]">
                        <thead>
                          <tr className="border-b border-[#F3F4F6] text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                            <th className="pb-3">Alumno</th>
                            <th className="pb-3">Progreso</th>
                            <th className="pb-3">Días Inactivo</th>
                            <th className="pb-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F3F4F6]">
                          {alumnosAlertas.slice(0, 5).map(ins => (
                            <tr key={ins.id} className="hover:bg-slate-50/40">
                              <td className="py-2.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 text-[#1E40AF] flex items-center justify-center font-bold text-[13px] flex-shrink-0">
                                    {ins.usuario?.nombre?.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 truncate">{ins.usuario?.nombre}</p>
                                    <p className="font-normal text-[11px] text-slate-400 truncate">{ins.usuario?.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-[60px] h-[6px] bg-[#F3F4F6] rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${ins.progresoVal}%` }}
                                      className={`h-full rounded-full ${
                                        ins.progresoVal < 15 ? 'bg-red-500' : ins.progresoVal < 30 ? 'bg-orange-500' : 'bg-[#1E40AF]'
                                      }`}
                                    />
                                  </div>
                                  <span className={`text-[11px] font-bold ${
                                    ins.progresoVal < 15 ? 'text-red-600' : ins.progresoVal < 30 ? 'text-orange-600' : 'text-slate-600'
                                  }`}>
                                    {ins.progresoVal}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5">
                                <span className={`text-[12px] font-bold ${
                                  ins.diasInactivo >= 10 ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                  {ins.diasInactivo} días inactivo
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => router.push(`/dashboard/mensajes?contactId=${ins.usuarioId}`)}
                                  className="px-3 py-1 bg-white hover:bg-blue-50/40 border border-[#1E40AF] text-[#1E40AF] font-bold text-[11.5px] rounded-[4px] transition-colors cursor-pointer"
                                >
                                  Contactar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Sección 4 — Actividad reciente del curso */}
                <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-sm">
                  <h3 className="font-bold text-[17px] text-[#111827] mb-6 pb-2 border-b border-slate-100">Actividad reciente</h3>
                  
                  {actividadesRecientes.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-[13px] font-medium">
                      No se registran actividades recientes en el curso.
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6">
                      {actividadesRecientes.map((act) => {
                        let IconComponent = User;
                        if (act.tipo === 'completado') IconComponent = CheckCircle;
                        else if (act.tipo === 'foro') IconComponent = MessageSquare;

                        return (
                          <div key={act.id} className="relative">
                            {/* Circle marker */}
                            <div className="absolute -left-[37px] top-0.5 w-8 h-8 rounded-full bg-white border-2 border-[#1E40AF] flex items-center justify-center shadow-sm select-none">
                              <IconComponent size={14} className="text-[#1E40AF] stroke-[2.5]" />
                            </div>
                            
                            <div>
                              <p className="font-semibold text-[13.5px] text-slate-800">
                                {act.titulo}
                              </p>
                              {act.subtext && (
                                <p className="text-[11.5px] text-slate-400 mt-0.5">{act.subtext}</p>
                              )}
                              <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                                {act.fecha.toLocaleDateString('es-CO')} a las {act.fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sección 5 — Reseñas recientes */}
                <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-[17px] text-[#111827]">Opiniones de los alumnos</h3>
                      <span className="text-[#1E40AF] font-extrabold text-[15px]">4.8 ★</span>
                      <span className="text-slate-400 text-[12px] font-semibold">(247 reseñas)</span>
                    </div>
                  </div>

                  <div className="py-6 text-center text-slate-400 text-[13px] font-medium">
                    No se registran opiniones o comentarios de este curso en la plataforma todavía.
                  </div>
                </div>
              </>
            )}

            {/* VIEW: ALUMNOS LIST (Search + Table) */}
            {vistaActiva === 'aprendices' && (
              <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] overflow-hidden shadow-sm">
                <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, email o documento..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 rounded-[4px] text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF] transition-all"
                      />
                    </div>

                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="bg-white border border-slate-200 px-4 py-2 rounded-[4px] text-[13px] text-slate-600 focus:outline-none focus:border-[#1E40AF] transition-all cursor-pointer font-medium"
                    >
                      <option value="todos">Todos los estados</option>
                      <option value="activo">Activos</option>
                      <option value="inactivo">Inactivos</option>
                      <option value="retirado">Retirados</option>
                      <option value="finalizado">Finalizados</option>
                    </select>

                    <button
                      onClick={() => setShowMassMessageModal(true)}
                      className="flex items-center gap-1.5 bg-[#1E40AF] hover:bg-blue-800 text-white font-bold text-[13px] h-[38px] px-4 rounded-[4px] transition-colors cursor-pointer shadow-sm ml-auto sm:ml-0"
                    >
                      <Mail size={14} /> Enviar mensaje masivo
                    </button>
                  </div>

                  <div className="text-[11px] font-bold text-slate-400 tracking-wider">
                    MOSTRANDO <span className="text-slate-700">{filtradas.length}</span> DE <span className="text-slate-700">{inscripciones.length}</span>
                  </div>
                </div>

                <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-200 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Activos: <strong className="text-slate-700">{contadores.activos}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Inactivos: <strong className="text-slate-700">{contadores.inactivos}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Finalizados: <strong className="text-slate-700">{contadores.finalizados}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Retirados: <strong className="text-slate-700">{contadores.retirados}</strong></span>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                  {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-3 border-slate-100 border-t-[#1E40AF] animate-spin"></div>
                      <p className="text-[13px] font-semibold text-slate-400 mt-2">Cargando lista de alumnos...</p>
                    </div>
                  ) : filtradas.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                      <Users size={28} className="text-slate-300 mb-3" />
                      <h4 className="font-bold text-[14px] text-slate-800">
                        {inscripciones.length === 0 ? 'Sin alumnos inscritos' : 'Búsqueda sin resultados'}
                      </h4>
                      <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                        {inscripciones.length === 0 
                          ? 'Actualmente no hay ningún alumno matriculado en este curso.'
                          : 'Ajusta los filtros o remueve el texto de búsqueda.'}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-150 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Alumno</th>
                          <th className="py-3.5 px-4">Documento</th>
                          <th className="py-3.5 px-4">Progreso</th>
                          <th className="py-3.5 px-4 text-center">Estado</th>
                          <th className="py-3.5 px-4">F. Matrícula</th>
                          <th className="py-3.5 px-6 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filtradas.map((ins, i) => (
                          <tr key={ins.id} className="hover:bg-slate-50/40">
                            <td className="py-3 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 text-[#1E40AF] flex items-center justify-center font-bold text-[14px] flex-shrink-0">
                                  {ins.usuario?.nombre?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-800 truncate leading-snug">{ins.usuario?.nombre}</p>
                                  <p className="font-normal text-[11px] text-slate-400 truncate mt-0.5">{ins.usuario?.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500 font-normal">
                              {ins.usuario?.documento || 'No registrado'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 max-w-[120px]">
                                <div className="h-2 bg-slate-100 rounded-full flex-grow overflow-hidden">
                                  <div
                                    style={{ width: `${Number(ins.progreso) || 0}%` }}
                                    className="h-full bg-[#1E40AF] rounded-full"
                                  />
                                </div>
                                <span className="text-[12px] font-bold text-slate-600 flex-shrink-0">
                                  {Number(ins.progreso) || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border ${
                                ins.estado === 'activo'
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                  : ins.estado === 'retirado'
                                    ? 'bg-rose-50 border-rose-100 text-rose-700'
                                    : ins.estado === 'inactivo'
                                      ? 'bg-amber-50 border-amber-100 text-amber-700'
                                      : 'bg-blue-50 border-blue-100 text-blue-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  ins.estado === 'activo'
                                    ? 'bg-emerald-500'
                                    : ins.estado === 'retirado'
                                      ? 'bg-rose-500'
                                      : ins.estado === 'inactivo'
                                        ? 'bg-amber-500'
                                        : 'bg-blue-500'
                                }`}></span>
                                {ins.estado}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-normal">
                              {new Date(ins.fechaInscripcion).toLocaleDateString('es-CO')}
                            </td>
                            <td className="py-3 px-6 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setAprendizSeleccionado(ins)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-[4px] text-[12px] font-bold cursor-pointer"
                                >
                                  Ficha
                                </button>
                                {ins.estado === 'activo' && (
                                  <button
                                    onClick={() => handleDarDeBaja(ins)}
                                    disabled={dandoBaja === ins.id}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-[4px] text-[12px] font-bold disabled:opacity-50 cursor-pointer"
                                  >
                                    {dandoBaja === ins.id ? '...' : 'Dar de baja'}
                                  </button>
                                )}
                                {ins.estado === 'inactivo' && (
                                  <>
                                    <button
                                      onClick={() => handleReactivar(ins)}
                                      disabled={dandoBaja === ins.id}
                                      className="px-2.5 py-1 bg-[#E6F4EA] hover:bg-[#D8F0E0] text-[#137333] border border-[#B7E1CD] rounded-[4px] text-[12px] font-bold disabled:opacity-50 cursor-pointer"
                                    >
                                      {dandoBaja === ins.id ? '...' : 'Reactivar'}
                                    </button>
                                    <button
                                      onClick={() => handleDarDeBaja(ins)}
                                      disabled={dandoBaja === ins.id}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-[4px] text-[12px] font-bold disabled:opacity-50 cursor-pointer"
                                    >
                                      {dandoBaja === ins.id ? '...' : 'Dar de baja'}
                                    </button>
                                  </>
                                )}
                                {ins.estado === 'retirado' && (
                                  <button
                                    onClick={() => handleReactivar(ins)}
                                    disabled={dandoBaja === ins.id}
                                    className="px-2.5 py-1 bg-[#E6F4EA] hover:bg-[#D8F0E0] text-[#137333] border border-[#B7E1CD] rounded-[4px] text-[12px] font-bold disabled:opacity-50 cursor-pointer"
                                  >
                                    {dandoBaja === ins.id ? '...' : 'Reactivar'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* VIEW: EVALUACIONES */}
            {vistaActiva === 'evaluaciones' && (
              <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-sm">
                
                {subVistaEvaluacion === 'lista' && (
                  <>
                    <h3 className="font-bold text-[17px] text-[#111827] mb-6 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Evaluaciones del Curso</span>
                      <button
                        onClick={() => setSubVistaEvaluacion('crear')}
                        className="flex items-center gap-1 bg-[#1E40AF] text-white font-bold text-[12px] px-3.5 py-1.5 rounded-[4px] hover:bg-blue-800 transition-colors cursor-pointer"
                      >
                        <Plus size={13} /> Agregar Evaluación
                      </button>
                    </h3>

                    {evaluaciones.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-[13px] font-medium flex flex-col items-center gap-2">
                        <FileText size={32} className="text-slate-300" />
                        <span>No hay evaluaciones asignadas a este curso de formación.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {evaluaciones.map((evalu) => (
                          <div 
                            key={evalu.id} 
                            onClick={() => {
                              setEvaluacionSeleccionada(evalu);
                              setSubVistaEvaluacion('detalle');
                            }}
                            className="p-4 border border-slate-150 rounded-[4px] hover:border-[#1E40AF] hover:shadow-md transition-all relative flex flex-col justify-between cursor-pointer group bg-white"
                          >
                            <div>
                              <span className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                                {evalu.modulo?.titulo || 'Examen General'}
                              </span>
                              <h4 className="font-bold text-[15px] text-slate-800 mt-2 leading-snug group-hover:text-[#1E40AF] transition-colors">
                                {evalu.titulo}
                              </h4>
                              <p className="text-[12.5px] text-slate-500 mt-1 line-clamp-2">
                                {evalu.descripcion || 'Evaluación del módulo del curso.'}
                              </p>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3 text-[11.5px] text-slate-400 font-semibold uppercase tracking-wider">
                              <span>{evalu.preguntas?.length || 0} Preguntas</span>
                              <span>Nota Mín: {evalu.puntajeMinimo || 60}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {subVistaEvaluacion === 'detalle' && evaluacionSeleccionada && (
                  <div>
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                      <button 
                        onClick={() => {
                          setSubVistaEvaluacion('lista');
                          setEvaluacionSeleccionada(null);
                        }}
                        className="text-[12.5px] font-bold text-[#1E40AF] hover:underline cursor-pointer flex items-center gap-1 bg-transparent border-0"
                      >
                        ← Volver a Evaluaciones
                      </button>
                      <span className="bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] font-bold text-[10px] px-3 py-1 rounded-full uppercase">
                        Detalle de Evaluación
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-[4px] p-5 mb-6">
                      <h3 className="font-extrabold text-[20px] text-slate-900 leading-snug">{evaluacionSeleccionada.titulo}</h3>
                      <p className="text-[13.5px] text-slate-650 mt-2 leading-relaxed whitespace-pre-line">
                        {evaluacionSeleccionada.descripcion || 'Sin descripción o instrucciones especificadas.'}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-200 text-[13px]">
                        <div>
                          <span className="block text-slate-400 font-semibold uppercase text-[10px]">Ubicación</span>
                          <span className="font-bold text-slate-800">{evaluacionSeleccionada.modulo?.titulo || 'Examen General de Curso'}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold uppercase text-[10px]">Preguntas</span>
                          <span className="font-bold text-slate-800">{evaluacionSeleccionada.preguntas?.length || 0} preguntas</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold uppercase text-[10px]">Aprobación Mínima</span>
                          <span className="font-bold text-[#1E40AF]">{evaluacionSeleccionada.puntajeMinimo || 60}%</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold uppercase text-[10px]">Parámetros</span>
                          <span className="font-bold text-slate-800">
                            {evaluacionSeleccionada.duracionMinutos ? `${evaluacionSeleccionada.duracionMinutos} min` : 'Sin límite tiempo'} 
                            {` · ${evaluacionSeleccionada.intentosMaximos || 1} intento(s)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => setSubVistaEvaluacion('editar')}
                        className="bg-white border border-[#D1D5DB] hover:bg-slate-50 text-slate-850 px-4 py-2 rounded-[4px] font-bold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit size={14} className="stroke-[2.5]" /> Editar Evaluación
                      </button>
                      <button
                        onClick={() => setSubVistaEvaluacion('calificar')}
                        className="bg-white border border-[#D1D5DB] hover:bg-slate-50 text-slate-850 px-4 py-2 rounded-[4px] font-bold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <FileText size={14} className="stroke-[2.5]" /> Calificar Intentos
                      </button>
                      <button
                        onClick={() => {
                          showConfirm(
                            '¿Eliminar evaluación?',
                            '¿Estás seguro de que deseas eliminar permanentemente esta evaluación? Esta acción borrará también todos los intentos de los alumnos y no se puede deshacer.',
                            async () => {
                              try {
                                const res = await fetch(`/api/evaluaciones/${evaluacionSeleccionada.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  showAlert('Evaluación eliminada', 'Evaluación eliminada correctamente.', 'success');
                                  // Recargar evaluaciones del curso
                                  const valRes = await fetch(`/api/evaluaciones?cursoId=${curso.id}`);
                                  const valData = await valRes.json();
                                  setEvaluaciones(valData || []);
                                  setSubVistaEvaluacion('lista');
                                  setEvaluacionSeleccionada(null);
                                } else {
                                  const data = await res.json();
                                  showAlert('Error', `Error al eliminar: ${data.message || 'Error desconocido'}`, 'error');
                                }
                              } catch {
                                showAlert('Error', 'Error de conexión al intentar eliminar la evaluación.', 'error');
                              }
                            },
                            'danger',
                            'Sí, eliminar'
                          );
                        }}
                        className="bg-white border border-[#EF4444] hover:bg-red-50 text-[#EF4444] px-4 py-2 rounded-[4px] font-bold text-[13px] flex items-center gap-1.5 cursor-pointer transition-colors sm:ml-auto"
                      >
                        <Trash2 size={14} className="stroke-[2.5]" /> Eliminar
                      </button>
                    </div>
                  </div>
                )}

                {subVistaEvaluacion === 'editar' && evaluacionSeleccionada && (
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <button 
                        onClick={() => setSubVistaEvaluacion('detalle')}
                        className="text-[12.5px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1 bg-transparent border-0"
                      >
                        ← Volver a Detalle
                      </button>
                      <span className="font-bold text-[13px] text-slate-700">Modificar Evaluación</span>
                    </div>
                    <EditarEvaluacion 
                      evaluacionId={evaluacionSeleccionada.id}
                      cursos={[cursoCompleto]}
                      onGuardado={async () => {
                        // Recargar evaluaciones del curso
                        const valRes = await fetch(`/api/evaluaciones?cursoId=${curso.id}`);
                        const valData = await valRes.json();
                        setEvaluaciones(valData || []);
                        setSubVistaEvaluacion('lista');
                        setEvaluacionSeleccionada(null);
                      }}
                    />
                  </div>
                )}

                {subVistaEvaluacion === 'calificar' && evaluacionSeleccionada && (
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <button 
                        onClick={() => setSubVistaEvaluacion('detalle')}
                        className="text-[12.5px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1 bg-transparent border-0"
                      >
                        ← Volver a Detalle
                      </button>
                      <span className="font-bold text-[13px] text-slate-700">Panel de Calificación Manual</span>
                    </div>
                    <CalificarManual evaluacionId={evaluacionSeleccionada.id} />
                  </div>
                )}

                {subVistaEvaluacion === 'crear' && (
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <button 
                        onClick={() => setSubVistaEvaluacion('lista')}
                        className="text-[12.5px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1 bg-transparent border-0"
                      >
                        ← Volver a Lista
                      </button>
                      <span className="font-bold text-[13px] text-slate-700">Nueva Evaluación</span>
                    </div>
                    <CrearEvaluacion 
                      usuario={usuarioSession}
                      cursos={[cursoCompleto]}
                      onCreado={async () => {
                        // Recargar evaluaciones del curso
                        const valRes = await fetch(`/api/evaluaciones?cursoId=${curso.id}`);
                        const valData = await valRes.json();
                        setEvaluaciones(valData || []);
                        setSubVistaEvaluacion('lista');
                      }}
                    />
                  </div>
                )}

              </div>
            )}

            {/* VIEW: SESIONES EN VIVO */}
            {vistaActiva === 'sesiones' && (
              <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-sm">
                <h3 className="font-bold text-[17px] text-[#111827] mb-6 pb-2 border-b border-slate-100">
                  Videoconferencias y Sesiones Sincrónicas
                </h3>
                <div className="bg-white rounded-lg">
                  <SesionesClient course={cursoCompleto} currentUser={usuarioSession || { id: 'embed-user', rol: userRole }} isEmbed={true} />
                </div>
              </div>
            )}

            {/* VIEW: FORO */}
            {vistaActiva === 'foro' && (
              <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-sm">
                <h3 className="font-bold text-[17px] text-[#111827] mb-6 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Foro oficial de discusión</span>
                  <button
                    onClick={() => router.push(`/cursos/${curso.id}/foro`)}
                    className="flex items-center gap-1.5 border border-[#1E40AF] text-[#1E40AF] font-bold text-[12px] px-3.5 py-1.5 rounded-[4px] hover:bg-blue-50/50 transition-all cursor-pointer"
                  >
                    Ir al Foro Completo <ArrowUpRight size={13} />
                  </button>
                </h3>

                {foroHilos.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-[13px] font-medium flex flex-col items-center gap-2">
                    <MessageSquare size={32} className="text-slate-300" />
                    <span>No hay hilos o discusiones abiertas en este foro todavía.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {foroHilos.map((hilo) => (
                      <div key={hilo.id} className="py-3.5 hover:bg-slate-50/40 transition-colors rounded px-2 flex justify-between items-center gap-4">
                        <div className="min-w-0">
                          <h4 className="font-bold text-[14px] text-[#111827] hover:text-[#1E40AF] cursor-pointer truncate">
                            {hilo.titulo}
                          </h4>
                          <div className="flex items-center gap-2 text-[11.5px] text-slate-400 mt-1">
                            <span className="font-bold text-[#1E40AF] uppercase tracking-wider">{hilo.categoria || 'PREGUNTAS'}</span>
                            <span>·</span>
                            <span>Por {hilo.usuario?.nombre}</span>
                            <span>·</span>
                            <span>{new Date(hilo.creado).toLocaleDateString('es-CO')}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right text-[12px] text-slate-400">
                          <p className="font-bold text-slate-700">{hilo.respuestas?.length || 0}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wide">Respuestas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW: CONFIGURACIÓN CRITERIOS */}
            {vistaActiva === 'configuracion' && (
              <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 shadow-sm">
                <h3 className="font-bold text-[17px] text-[#111827] mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Settings size={18} className="text-[#1E40AF]" />
                  <span>Configuración de Acreditación y Criterios</span>
                </h3>

                <form onSubmit={handleSaveConfig} className="space-y-5">
                  <div className="flex items-center gap-3 p-4 bg-blue-50/45 border border-[#BFDBFE] rounded-[4px]">
                    <input
                      type="checkbox"
                      id="otorgaCertificado"
                      checked={configOtorgaCertificado}
                      onChange={(e) => setConfigOtorgaCertificado(e.target.checked)}
                      className="w-4 h-4 text-[#1E40AF] rounded focus:ring-[#1E40AF] border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="otorgaCertificado" className="font-bold text-[13.5px] text-slate-700 cursor-pointer select-none">
                      Habilitar emisión automática de Certificado Verificado al finalizar
                    </label>
                  </div>

                  {configOtorgaCertificado && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-slate-150 rounded-[4px] bg-slate-50/50">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Mínimo de Lecciones Leídas (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={configCriterioLecciones}
                          onChange={(e) => setConfigCriterioLecciones(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-[4px] text-[13px] font-bold focus:outline-none focus:border-[#1E40AF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Mínimo de Evaluaciones Aprobadas (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={configCriterioEval}
                          onChange={(e) => setConfigCriterioEval(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-[4px] text-[13px] font-bold focus:outline-none focus:border-[#1E40AF]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Nota Global Mínima Exigida (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={configCriterioNota}
                          onChange={(e) => setConfigCriterioNota(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-[4px] text-[13px] font-bold focus:outline-none focus:border-[#1E40AF]"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={configGuardando}
                    className="px-5 py-2.5 bg-[#1E40AF] hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-[13px] rounded-[4px] transition-colors cursor-pointer"
                  >
                    {configGuardando ? 'Guardando...' : 'Guardar Criterios'}
                  </button>
                </form>
              </div>
            )}
            
          </div>

          {/* COLUMNA SIDEBAR DERECHO (32% / col-span-4) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-[160px]">
            
            {/* Card 1: Info del curso */}
            <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] overflow-hidden shadow-sm">
              <div className="relative aspect-video bg-slate-900">
                {cursoCompleto.imgPortada ? (
                  <img
                    src={cursoCompleto.imgPortada}
                    alt={cursoCompleto.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-[#1E40AF] text-[48px]">
                    📚
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-[#10B981] text-white font-bold text-[10px] px-2.5 py-1 rounded-[4px] shadow-sm tracking-wider uppercase">
                  {cursoCompleto.estado === 'publicado' ? 'PUBLICADO' : 'BORRADOR'}
                </span>
              </div>

              <div className="p-5">
                <div className="divide-y divide-[#F3F4F6] text-[13px]">
                  {[
                    { label: 'ESTADO', val: <span className="font-bold text-[#1E40AF]">{cursoCompleto.estado?.toUpperCase()}</span> },
                    { label: 'CATEGORÍA', val: cursoCompleto.categoria?.nombre || 'General' },
                    { label: 'NIVEL', val: cursoCompleto.nivel || 'Principiante' },
                    { label: 'DURACIÓN', val: `${cursoCompleto.modulos?.length || 0} módulos` },
                    { label: 'MODALIDAD', val: 'Self-paced' },
                    { label: 'INSTITUCIÓN', val: cursoCompleto.institucion?.nombre || 'SABERHUB' },
                    { label: 'FECHA PUBLICACIÓN', val: new Date(cursoCompleto.creado).toLocaleDateString('es-CO') },
                    { label: 'ÚLTIMA ACTUALIZACIÓN', val: new Date(cursoCompleto.actualizado).toLocaleDateString('es-CO') },
                    { label: 'VISIBILIDAD', val: 'Pública' }
                  ].map((info, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2">
                      <span className="font-semibold text-[#6B7280] tracking-wide uppercase text-[10px]">
                        {info.label}
                      </span>
                      <span className="font-bold text-[#111827] text-right truncate max-w-[150px]">{info.val}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <button
                    onClick={handleEditarCurso}
                    className="w-full py-2.5 bg-[#1E40AF] hover:bg-blue-800 text-white font-bold text-[13px] rounded-[4px] transition-colors cursor-pointer"
                  >
                    Editar curso
                  </button>
                  <button
                    onClick={handleVerComoAlumno}
                    className="w-full py-2.5 bg-white border border-[#D1D5DB] hover:bg-slate-50 text-[#374151] font-bold text-[13px] rounded-[4px] transition-colors cursor-pointer"
                  >
                    Vista previa alumno ↗
                  </button>
                  <button
                    onClick={handleDuplicarCurso}
                    className="w-full py-2 text-[#1E40AF] hover:bg-blue-50/50 font-bold text-[13px] rounded-[4px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy size={14} /> Duplicar curso
                  </button>
                </div>

                {/* Zona de Riesgo */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[#EF4444] tracking-wider uppercase block mb-1">
                    ZONA DE RIESGO
                  </span>
                  
                  {cursoCompleto.estado === 'publicado' ? (
                    <button
                      onClick={() => handleToggleEstado()}
                      className="w-full py-2.5 bg-white border border-[#FCA5A5] text-[#DC2626] font-bold text-[13px] hover:bg-red-50/60 rounded-[4px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ShieldAlert size={14} /> Despublicar curso
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleEstado()}
                      className="w-full py-2.5 bg-[#DC2626] hover:bg-red-700 text-white font-bold text-[13px] rounded-[4px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Rocket size={14} /> Publicar curso
                    </button>
                  )}
                  
                  <button
                    onClick={handleEliminarCurso}
                    disabled={inscripciones.length > 0}
                    className="w-full py-2.5 border border-slate-300 text-slate-700 font-bold text-[13px] hover:bg-slate-50 rounded-[4px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    title={inscripciones.length > 0 ? "No puedes archivar un curso con estudiantes inscritos" : "Archivar curso"}
                  >
                    <Trash2 size={14} /> Archivar curso
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Programar sesión en vivo */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[4px] p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[#1E40AF] border-b border-blue-100 pb-2">
                <Video size={18} className="text-[#1E40AF] stroke-[2.5]" />
                <h4 className="font-bold text-[13.5px]">Próximas sesiones</h4>
              </div>

              {sesiones.length === 0 ? (
                <p className="text-[12px] text-slate-500 italic py-2 text-center">
                  No hay sesiones sincrónicas programadas.
                </p>
              ) : (
                <div className="space-y-3">
                  {sesiones.slice(0, 2).map((ses) => (
                    <div key={ses.id} className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-[#1E40AF] rounded text-white flex items-center justify-center flex-shrink-0">
                        <Calendar size={18} className="stroke-[2.5]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[12.5px] text-slate-800 truncate leading-snug">{ses.titulo}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(ses.fechaInicio).toLocaleDateString('es-CO')} · {new Date(ses.fechaInicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setVistaActiva('sesiones')}
                className="w-full h-9 bg-[#1E40AF] hover:bg-blue-800 text-white font-bold text-[12px] rounded-[4px] transition-colors cursor-pointer mt-2"
              >
                + Programar sesión
              </button>
            </div>

            {/* Card 3: Exportar datos */}
            <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 shadow-sm flex flex-col gap-3">
              <h4 className="font-bold text-[13.5px] text-[#111827] border-b border-slate-100 pb-2">Exportar</h4>
              
              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={exportAlumnosExcel}
                  className="flex items-center justify-center gap-1.5 border border-[#D1D5DB] hover:bg-slate-50 p-2 rounded text-[12.5px] font-bold text-slate-700 cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" />
                  Lista de alumnos (Excel)
                </button>
                <button
                  onClick={exportReportePDF}
                  className="flex items-center justify-center gap-1.5 border border-[#D1D5DB] hover:bg-slate-50 p-2 rounded text-[12.5px] font-bold text-slate-700 cursor-pointer"
                >
                  <FileText size={15} className="text-red-600 stroke-[2.5]" />
                  Reporte del curso (PDF)
                </button>
              </div>
            </div>
            
          </div>

        </div>
      </main>

      {/* 5. FOOTER (oscuro, fondo #171717) */}
      <footer className="bg-[#171717] text-white/75 py-8 px-8 border-t border-slate-800 flex-shrink-0">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-extrabold text-[13px] text-white tracking-wider">SABERHUB</span>
            <span className="text-[11px] text-white/50 mt-1">© 2026 SABERHUB. Todos los derechos reservados.</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-[12px] font-medium">
            <span className="hover:text-white cursor-pointer transition-colors">Términos</span>
            <span className="hover:text-white cursor-pointer transition-colors">Privacidad</span>
            <span className="hover:text-white cursor-pointer transition-colors">Cookies</span>
            <span className="hover:text-white cursor-pointer transition-colors">Protección de datos</span>
            <span className="hover:text-white cursor-pointer transition-colors">Accesibilidad</span>
          </div>
        </div>
      </footer>

      {/* Modal detalle aprendiz */}
      {aprendizSeleccionado && (
        <DetalleAprendizModal
          aprendiz={aprendizSeleccionado}
          onCerrar={() => setAprendizSeleccionado(null)}
        />
      )}

      {/* Modal enviar mensaje masivo */}
      {showMassMessageModal && (
        <EnviarMensajeMasivoModal
          cursoId={cursoCompleto.id}
          cursoTitulo={cursoCompleto.titulo}
          inscripciones={inscripciones}
          onCerrar={() => setShowMassMessageModal(false)}
        />
      )}

      {/* Modal confirmación despublicar */}
      {showDespublicarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[4px] w-full max-w-md shadow-2xl border-b-4 border-b-[#DC2626] p-6 relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-2.5 text-[#DC2626] mb-4 pb-3 border-b border-slate-100">
              <ShieldAlert size={22} className="stroke-[2.5]" />
              <h3 className="font-bold text-[16px] text-[#111827]">¿Despublicar curso?</h3>
            </div>
            
            {/* Content */}
            <div className="text-[13.5px] text-slate-600 space-y-3.5 mb-6 leading-relaxed">
              <p>
                Estás a punto de cambiar el estado del curso a <strong>Borrador</strong>. Esto tendrá el siguiente impacto:
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 text-[12.5px] space-y-2">
                <p className="flex items-start gap-2">
                  <Lock size={14} className="mt-0.5 text-amber-700 flex-shrink-0 stroke-[2.5]" />
                  <span><strong>Nuevos alumnos:</strong> El curso se ocultará del catálogo y nadie más podrá inscribirse.</span>
                </p>
                <p className="flex items-start gap-2">
                  <Users size={14} className="mt-0.5 text-amber-700 flex-shrink-0 stroke-[2.5]" />
                  <span><strong>Alumnos ya inscritos:</strong> Los aprendices actuales <strong>no perderán su acceso</strong> y podrán seguir estudiando y viendo las lecciones normalmente.</span>
                </p>
              </div>
              <p>¿Deseas continuar con la despublicación del curso?</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDespublicarModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-[4px] text-[13px] text-slate-700 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleToggleEstado(true)}
                className="px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white rounded-[4px] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                Sí, despublicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal personalizado unificado (Alert / Confirm) */}
      {customModal && customModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[4px] w-full max-w-md shadow-2xl border-b-4 p-6 relative flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
               style={{
                 borderBottomColor: 
                   customModal.type === 'danger' ? '#DC2626' :
                   customModal.type === 'error' ? '#EF4444' :
                   customModal.type === 'success' ? '#10B981' :
                   customModal.type === 'warning' ? '#F59E0B' : '#1E40AF'
               }}>
            
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              {customModal.type === 'danger' && <Trash2 size={22} className="text-[#DC2626] stroke-[2.5]" />}
              {customModal.type === 'error' && <AlertTriangle size={22} className="text-[#EF4444] stroke-[2.5]" />}
              {customModal.type === 'success' && <CheckCircle size={22} className="text-[#10B981] stroke-[2.5]" />}
              {customModal.type === 'warning' && <AlertTriangle size={22} className="text-[#F59E0B] stroke-[2.5]" />}
              {(customModal.type === 'info' || !customModal.type) && <Sparkles size={22} className="text-[#1E40AF] stroke-[2.5]" />}
              
              <h3 className="font-bold text-[16px] text-[#111827]">
                {customModal.title}
              </h3>
            </div>
            
            {/* Content */}
            <div className="text-[13.5px] text-slate-600 mb-6 leading-relaxed whitespace-pre-wrap">
              {customModal.message}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {customModal.isConfirm && (
                <button
                  onClick={() => {
                    setCustomModal(null);
                    if (customModal.onCancel) customModal.onCancel();
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-[4px] text-[13px] text-slate-700 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
                >
                  {customModal.cancelText || 'Cancelar'}
                </button>
              )}
              <button
                onClick={() => {
                  setCustomModal(null);
                  if (customModal.onConfirm) customModal.onConfirm();
                }}
                className={`px-4 py-2 text-white rounded-[4px] text-[13px] font-semibold transition-colors cursor-pointer ${
                  customModal.type === 'danger' ? 'bg-[#DC2626] hover:bg-red-700' :
                  customModal.type === 'error' ? 'bg-[#EF4444] hover:bg-red-700' :
                  customModal.type === 'success' ? 'bg-[#10B981] hover:bg-emerald-700' :
                  customModal.type === 'warning' ? 'bg-[#F59E0B] hover:bg-amber-700' :
                  'bg-[#1E40AF] hover:bg-blue-700'
                }`}
              >
                {customModal.confirmText || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
