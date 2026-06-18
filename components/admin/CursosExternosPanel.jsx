'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Search, Filter, CheckSquare, Square, CheckCheck, X, ExternalLink,
  RefreshCw, Play, Clock, BookOpen, ChevronDown, ChevronLeft, ChevronRight,
  AlertCircle, Check, Ban
} from 'lucide-react';

const ESTADO_COLORS = {
  pendiente:  { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  label: 'Pendiente'  },
  aprobado:   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: 'Aprobado'   },
  rechazado:  { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    label: 'Rechazado'  },
};

const FUENTE_COLORS = {
  'SENA Betowa': 'bg-[#059669] text-white border border-[#047857]',
  'SENA': 'bg-[#059669] text-white border border-[#047857]',
  'Coursera': 'bg-[#2563EB] text-white border border-[#1D4ED8]',
  'edX': 'bg-[#7C3AED] text-white border border-[#6D28D9]',
  'Udemy': 'bg-[#EC4899] text-white border border-[#BE185D]',
  'Universidad Nacional': 'bg-teal-700 text-white border border-teal-800',
  'Universidad de Antioquia': 'bg-emerald-700 text-white border border-emerald-800',
  'Khan Academy': 'bg-sky-600 text-white border border-sky-700',
  default: 'bg-gray-600 text-white border border-gray-700',
};

function EstadoBadge({ estado }) {
  const c = ESTADO_COLORS[estado] || ESTADO_COLORS.pendiente;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {estado === 'aprobado' && <Check size={10} />}
      {estado === 'rechazado' && <Ban size={10} />}
      {estado === 'pendiente' && <Clock size={10} />}
      {c.label}
    </span>
  );
}

function FuenteBadge({ fuente }) {
  const cls = FUENTE_COLORS[fuente] || FUENTE_COLORS.default;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {fuente}
    </span>
  );
}

export default function CursosExternosPanel() {
  const [cursos, setCursos] = useState([]);
  const [stats, setStats] = useState({ pendientes: 0, aprobados: 0, rechazados: 0 });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [estado, setEstado] = useState('pendiente');
  const [fuente, setFuente] = useState('todas');
  const [search, setSearch] = useState('');
  const [instituciones, setInstituciones] = useState([]);
  const [institucionId, setInstitucionId] = useState('todas');
  const [categoria, setCategoria] = useState('todas');
  const [ordenFecha, setOrdenFecha] = useState('desc');

  useEffect(() => {
    fetch('/api/instituciones')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInstituciones(data))
      .catch(() => {});
  }, []);

  // Selection
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Rejection modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Scraper
  const [scraperStatus, setScraperStatus] = useState('idle');
  const [scraperSource, setScraperSource] = useState('sena');
  const [triggeredAt, setTriggeredAt] = useState(null);
  const [runningStats, setRunningStats] = useState(null);
  const pollRef = useRef(null);

  const fetchCursos = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      estado,
      fuente,
      search,
      institucionId,
      categoria,
      ordenFecha
    });
    try {
      const res = await fetch(`/api/admin/cursos-externos?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCursos(data.cursos);
      setTotal(data.total);
      setPages(data.pages);
      setStats(data.stats);
    } catch {}
    finally { setLoading(false); }
  }, [page, estado, fuente, search, institucionId, categoria, ordenFecha]);

  useEffect(() => { fetchCursos(); }, [fetchCursos]);

  // Scraper status polling
  useEffect(() => {
    if (scraperStatus !== 'running' || !triggeredAt) return;
    pollRef.current = setInterval(async () => {
      const displayFuenteMap = {
        sena: 'SENA Betowa',
        coursera: 'Coursera',
        unal: 'Universidad Nacional',
        udea: 'Universidad de Antioquia',
        edx: 'edX',
        khanacademy: 'Khan Academy'
      };
      const displayFuente = displayFuenteMap[scraperSource] || scraperSource;
      const res = await fetch(`/api/admin/scrapers/status?fuente=${encodeURIComponent(displayFuente)}&triggeredAt=${encodeURIComponent(triggeredAt)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.ultimoLog) {
        setRunningStats(data.ultimoLog);
      }
      if (data.status === 'completed') {
        setScraperStatus('completed');
        clearInterval(pollRef.current);
        fetchCursos();
      }
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [scraperStatus, triggeredAt, scraperSource, fetchCursos]);

  const handleApprove = async (id) => {
    const res = await fetch(`/api/admin/cursos-externos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'aprobar' }),
    });
    if (res.ok) fetchCursos();
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectMotivo.trim()) return;
    setRejectLoading(true);
    const res = await fetch(`/api/admin/cursos-externos/${rejectTarget}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'rechazar', motivoRechazo: rejectMotivo }),
    });
    setRejectLoading(false);
    if (res.ok) { setRejectTarget(null); setRejectMotivo(''); fetchCursos(); }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const res = await fetch('/api/admin/cursos-externos/bulk-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setBulkLoading(false);
    if (res.ok) { setSelected(new Set()); fetchCursos(); }
  };

  const handleRunScraper = async () => {
    setScraperStatus('running');
    setRunningStats(null);
    const res = await fetch('/api/admin/scrapers/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fuente: scraperSource }),
    });
    if (res.ok) {
      const data = await res.json();
      setTriggeredAt(data.triggeredAt);
    } else {
      setScraperStatus('idle');
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const pendientesIds = cursos.filter((c) => c.estado === 'pendiente').map((c) => c.id);
    if (pendientesIds.every((id) => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendientesIds));
    }
  };

  const pendientesEnPagina = cursos.filter((c) => c.estado === 'pendiente');
  const todosSeleccionados = pendientesEnPagina.length > 0 && pendientesEnPagina.every((c) => selected.has(c.id));

  return (
    <div className="space-y-6">
      {/* Real-time scraper progress card */}
      {scraperStatus === 'running' && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-sm">
          <div className="flex items-center gap-3">
            <RefreshCw className="animate-spin text-[#1E40AF]" size={20} />
            <div>
              <h4 className="font-bold text-[14px] text-[#1E3A8A]">Ejecutando scraper ({({ sena: 'SENA Betowa', coursera: 'Coursera', unal: 'Universidad Nacional', udea: 'Universidad de Antioquia', edx: 'edX', khanacademy: 'Khan Academy' }[scraperSource] || scraperSource)})</h4>
              <p className="text-[12px] text-[#2563EB]">Extrayendo y deduplicando cursos de forma automática...</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-center">
            {[
              { label: 'Encontrados', value: runningStats?.cursosEncontrados || 0, color: 'text-blue-700' },
              { label: 'Nuevos', value: runningStats?.cursosNuevos || 0, color: 'text-green-700' },
              { label: 'Actualizados', value: runningStats?.cursosActualizados || 0, color: 'text-indigo-700' },
              { label: 'Errores', value: runningStats?.errores || 0, color: 'text-red-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white px-3 py-1.5 rounded border border-[#DBEAFE] min-w-[90px]">
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">{label}</p>
                <p className={`text-[16px] font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {scraperStatus === 'completed' && (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-green-600" size={20} />
            <div>
              <h4 className="font-bold text-[14px] text-[#14532D]">Scraper finalizado con éxito ({({ sena: 'SENA Betowa', coursera: 'Coursera', unal: 'Universidad Nacional', udea: 'Universidad de Antioquia', edx: 'edX', khanacademy: 'Khan Academy' }[scraperSource] || scraperSource)})</h4>
              <p className="text-[12px] text-[#16A34A]">La base de datos de cursos externos se ha actualizado.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-center">
            {[
              { label: 'Encontrados', value: runningStats?.cursosEncontrados || 0, color: 'text-blue-700' },
              { label: 'Nuevos', value: runningStats?.cursosNuevos || 0, color: 'text-green-700' },
              { label: 'Actualizados', value: runningStats?.cursosActualizados || 0, color: 'text-indigo-700' },
              { label: 'Errores', value: runningStats?.errores || 0, color: 'text-red-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white px-3 py-1.5 rounded border border-[#DCFCE7] min-w-[90px]">
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">{label}</p>
                <p className={`text-[16px] font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setScraperStatus('idle')}
            className="text-[12px] font-semibold text-[#16A34A] hover:underline"
          >
            Cerrar aviso
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendientes', value: stats.pendientes, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', estado: 'pendiente' },
          { label: 'Aprobados', value: stats.aprobados, color: 'text-green-600', bg: 'bg-green-50 border-green-200', estado: 'aprobado' },
          { label: 'Rechazados', value: stats.rechazados, color: 'text-red-600', bg: 'bg-red-50 border-red-200', estado: 'rechazado' },
        ].map(({ label, value, color, bg, estado: e }) => (
          <button
            key={e}
            onClick={() => { setEstado(e); setPage(1); }}
            className={`border rounded-lg p-4 text-left hover:shadow-sm transition-shadow ${bg} ${estado === e ? 'ring-2 ring-[#1E40AF]' : ''}`}
          >
            <p className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-[28px] font-bold ${color}`}>{value.toLocaleString('es-CO')}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center border border-[#D1D5DB] rounded h-10 px-3 bg-white focus-within:border-[#1E40AF] focus-within:ring-1 focus-within:ring-[#1E40AF] flex-1 min-w-[200px] max-w-[360px]">
          <Search size={15} className="text-[#9CA3AF] mr-2" />
          <input
            type="text"
            placeholder="Buscar por título..."
            className="outline-none text-[13px] w-full"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Estado filter */}
        <div className="relative">
          <select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPage(1); }}
            className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
          >
            <option value="todos">Estado: Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
        </div>

        {/* Fuente filter */}
        <div className="relative">
          <select
            value={fuente}
            onChange={(e) => { setFuente(e.target.value); setPage(1); }}
            className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
          >
            <option value="todas">Fuente: Todas</option>
            <option value="SENA">SENA</option>
            <option value="Coursera">Coursera</option>
            <option value="edX">edX</option>
            <option value="Universidad Nacional">Universidad Nacional</option>
            <option value="Universidad de Antioquia">Universidad de Antioquia</option>
            <option value="Khan Academy">Khan Academy</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
        </div>

        {/* Categoría filter */}
        <div className="relative">
          <select
            value={categoria}
            onChange={(e) => { setCategoria(e.target.value); setPage(1); }}
            className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
          >
            <option value="todas">Categoría: Todas</option>
            <option value="Programación">Programación</option>
            <option value="Ciberseguridad">Ciberseguridad</option>
            <option value="Inteligencia Artificial">Inteligencia Artificial</option>
            <option value="Redes">Redes</option>
            <option value="Datos y Analítica">Datos y Analítica</option>
            <option value="Diseño">Diseño</option>
            <option value="Tecnología">Tecnología</option>
            <option value="Sistemas">Sistemas</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
        </div>

        {/* Institución filter */}
        <div className="relative">
          <select
            value={institucionId}
            onChange={(e) => { setInstitucionId(e.target.value); setPage(1); }}
            className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
          >
            <option value="todas">Institución: Todas</option>
            {instituciones.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.nombre}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
        </div>

        {/* Orden Fecha filter */}
        <div className="relative">
          <select
            value={ordenFecha}
            onChange={(e) => { setOrdenFecha(e.target.value); setPage(1); }}
            className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
          >
            <option value="desc">Fecha: Más reciente</option>
            <option value="asc">Fecha: Más antiguo</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
        </div>

        {/* Bulk approve */}
        {selected.size > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-[13px] px-4 py-2 rounded transition-colors disabled:opacity-60"
          >
            <CheckCheck size={16} />
            {bulkLoading ? 'Aprobando...' : `Aprobar ${selected.size} seleccionados`}
          </button>
        )}

        {/* Run scraper selector and button */}
        <div className="flex items-center gap-2 border border-[#D1D5DB] rounded h-10 px-2 bg-white ml-auto">
          <span className="text-[12px] text-[#6B7280] font-semibold pl-1">Scraper:</span>
          <select
            value={scraperSource}
            onChange={(e) => setScraperSource(e.target.value)}
            disabled={scraperStatus === 'running'}
            className="outline-none text-[13px] bg-transparent font-medium cursor-pointer"
          >
            <option value="sena">SENA Betowa</option>
            <option value="coursera">Coursera</option>
            <option value="unal">Universidad Nacional</option>
            <option value="udea">Universidad de Antioquia</option>
            <option value="edx">edX</option>
            <option value="khanacademy">Khan Academy</option>
          </select>
          <button
            onClick={handleRunScraper}
            disabled={scraperStatus === 'running'}
            className="flex items-center gap-1.5 bg-[#1E40AF] hover:bg-[#1A368F] text-white text-[12px] font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-60 cursor-pointer"
          >
            {scraperStatus === 'running' ? (
              <><RefreshCw size={12} className="animate-spin" /> Corriendo...</>
            ) : (
              <><Play size={12} /> Ejecutar</>
            )}
          </button>
        </div>

        <Link
          href="/admin/cursos-externos/logs"
          className="flex items-center gap-2 border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] text-[#374151] font-semibold text-[13px] px-4 py-2 rounded transition-colors no-underline"
        >
          <Clock size={15} />
          Historial
        </Link>
      </div>

      {/* Table */}
      <div className="border border-[#F3F4F6] rounded overflow-hidden">
        {/* Header */}
        <div className="bg-[#F9FAFB] border-b border-[#F3F4F6] px-4 py-3 flex items-center gap-3">
          <button onClick={toggleAll} className="text-[#6B7280] hover:text-[#1E40AF]">
            {todosSeleccionados ? <CheckSquare size={18} className="text-[#1E40AF]" /> : <Square size={18} />}
          </button>
          <span className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide flex-1">
            {total.toLocaleString('es-CO')} cursos
            {selected.size > 0 && <span className="ml-2 text-[#1E40AF]">· {selected.size} seleccionados</span>}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-10 h-10 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[14px] text-[#6B7280]">Cargando...</p>
          </div>
        ) : cursos.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center px-6">
            <AlertCircle size={40} className="text-[#D1D5DB] mb-3" />
            <p className="font-semibold text-[15px] text-[#374151]">Sin cursos</p>
            <p className="text-[13px] text-[#6B7280]">No hay cursos con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {cursos.map((curso) => (
              <div key={curso.id} className="flex items-start gap-3 px-4 py-4 hover:bg-[#FAFAFA] transition-colors">
                {/* Checkbox — solo pendientes */}
                <div className="flex-shrink-0 pt-0.5">
                  {curso.estado === 'pendiente' ? (
                    <button onClick={() => toggleSelect(curso.id)} className="text-[#6B7280] hover:text-[#1E40AF]">
                      {selected.has(curso.id)
                        ? <CheckSquare size={18} className="text-[#1E40AF]" />
                        : <Square size={18} />}
                    </button>
                  ) : <div className="w-[18px]" />}
                </div>

                {/* Thumbnail */}
                <div className="w-[72px] h-[54px] rounded bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {curso.imagenUrl
                    ? <img src={curso.imagenUrl} alt={curso.titulo} className="w-full h-full object-cover" />
                    : <span className="text-white text-[18px]">🎓</span>}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <FuenteBadge fuente={curso.fuenteNombre} />
                    <EstadoBadge estado={curso.estado} />
                    {curso.areaConocimiento && (
                      <span className="text-[11px] text-[#6B7280] truncate max-w-[200px]">{curso.areaConocimiento}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[14px] text-[#111827] leading-snug truncate">{curso.titulo}</h3>
                  {curso.descripcion && (
                    <p className="text-[12px] text-[#6B7280] truncate mt-0.5">{curso.descripcion}</p>
                  )}
                  {curso.estado === 'rechazado' && curso.motivoRechazo && (
                    <p className="text-[11px] text-red-600 mt-0.5">Motivo: {curso.motivoRechazo}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9CA3AF]">
                    {curso.duracionHoras && <span>{curso.duracionHoras}h</span>}
                    {curso.nivel && <span>· {curso.nivel}</span>}
                    <span>· {new Date(curso.creadoEn).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/admin/cursos-externos/${curso.id}`}
                    className="text-[12px] font-semibold text-[#1E40AF] hover:underline no-underline"
                  >
                    Detalle
                  </Link>
                  <a
                    href={curso.fuenteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#6B7280] hover:text-[#1E40AF]"
                  >
                    <ExternalLink size={14} />
                  </a>
                  {curso.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleApprove(curso.id)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-[12px] font-semibold px-3 py-1.5 rounded transition-colors"
                      >
                        <Check size={12} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => { setRejectTarget(curso.id); setRejectMotivo(''); }}
                        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-[12px] font-semibold px-3 py-1.5 rounded border border-red-200 transition-colors"
                      >
                        <X size={12} />
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-3 py-2 rounded border border-[#D1D5DB] text-[13px] font-medium disabled:opacity-40 hover:bg-[#F9FAFB]"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-[13px] text-[#6B7280] px-3">{page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-3 py-2 rounded border border-[#D1D5DB] text-[13px] font-medium disabled:opacity-40 hover:bg-[#F9FAFB]"
          >
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[16px] text-[#111827] mb-2">Rechazar curso</h3>
            <p className="text-[13px] text-[#6B7280] mb-4">Indica el motivo del rechazo. Este curso no volverá a aparecer como pendiente.</p>
            <textarea
              className="w-full border border-[#D1D5DB] rounded-lg p-3 text-[13px] outline-none focus:border-[#1E40AF] resize-none"
              rows={3}
              placeholder="Motivo del rechazo..."
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={!rejectMotivo.trim() || rejectLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-[14px] py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {rejectLoading ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
              <button
                onClick={() => setRejectTarget(null)}
                className="flex-1 border border-[#D1D5DB] bg-white hover:bg-[#F9FAFB] text-[#374151] font-semibold text-[14px] py-2.5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
