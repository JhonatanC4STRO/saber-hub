'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Award, 
  BookOpen, 
  Download, 
  ExternalLink, 
  Search, 
  Sparkles, 
  Calendar, 
  Hash, 
  ArrowRight,
  CheckCircle,
  Share2
} from 'lucide-react';

export default function CertificadosClient({ usuarioSession, certificaciones = [], certificadosRuta = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos'); // 'todos', 'cursos', 'rutas'

  // Filtrado
  const filteredCerts = certificaciones.filter((c) => {
    return c.cursoTitulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.codigoUnico.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredRutaCerts = certificadosRuta.filter((rc) => {
    return rc.rutaNombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
           rc.codigoUnico.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCerts = certificaciones.length + certificadosRuta.length;

  const handleShare = (cert) => {
    const shareUrl = `${window.location.origin}/certificados/verificar/${cert.codigoUnico}`;
    if (navigator.share) {
      navigator.share({
        title: `Certificado Oficial - ${cert.cursoTitulo || cert.rutaNombre}`,
        text: `¡Completé con éxito el curso/ruta en SABERHUB! Código único: ${cert.codigoUnico}`,
        url: shareUrl,
      }).catch(() => null);
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('¡Enlace de verificación copiado al portapapeles!');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Encabezado Principal */}
      <div className="mb-8">
        <span className="font-semibold text-[11px] text-[#1E40AF] uppercase tracking-wider mb-2 block">
          Logros Académicos
        </span>
        <h1 className="font-bold text-[32px] text-[#111827] leading-tight">
          Mis Certificados y Diplomas
        </h1>
        <p className="text-gray-500 mt-2 text-[15px] max-w-[700px]">
          Aquí puedes administrar y descargar todas tus certificaciones válidas e insignias oficiales obtenidas en la plataforma.
        </p>
      </div>

      {/* Grid de Estadísticas / Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Tarjeta 1: Total */}
        <div className="p-6 bg-gradient-to-br from-[#1E40AF] to-[#2563EB] rounded-2xl text-white shadow-lg border border-[#1E40AF]/20 flex items-center justify-between group overflow-hidden relative">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
            <Award size={140} />
          </div>
          <div>
            <span className="text-[12px] font-medium text-blue-100 uppercase tracking-wider block">Total Obtenidos</span>
            <p className="text-[42px] font-extrabold mt-1 leading-none">{totalCerts}</p>
            <p className="text-[13px] text-blue-200 mt-2 font-medium">¡Sigue acumulando logros!</p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
            <Award size={26} className="text-white" />
          </div>
        </div>

        {/* Tarjeta 2: Cursos */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-5 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
            <BookOpen size={140} className="text-gray-900" />
          </div>
          <div>
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider block">Cursos Individuales</span>
            <p className="text-[42px] font-extrabold mt-1 leading-none text-gray-800">{certificaciones.length}</p>
            <p className="text-[13px] text-gray-500 mt-2 font-medium">Habilidades específicas validadas</p>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-2xl">
            <BookOpen size={26} className="text-[#1E40AF]" />
          </div>
        </div>

        {/* Tarjeta 3: Rutas */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-5 translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-300">
            <Sparkles size={140} className="text-gray-900" />
          </div>
          <div>
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider block">Rutas de Formación</span>
            <p className="text-[42px] font-extrabold mt-1 leading-none text-amber-600">{certificadosRuta.length}</p>
            <p className="text-[13px] text-gray-500 mt-2 font-medium">Especialidades profesionales completas</p>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-2xl">
            <Sparkles size={26} className="text-amber-600" />
          </div>
        </div>

      </div>

      {/* Controles de Filtro y Búsqueda */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        
        {/* Selector de Pestañas */}
        <div className="flex bg-gray-100 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-all duration-200 ${
              activeTab === 'todos'
                ? 'bg-white text-[#1E40AF] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos ({totalCerts})
          </button>
          <button
            onClick={() => setActiveTab('cursos')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-all duration-200 ${
              activeTab === 'cursos'
                ? 'bg-white text-[#1E40AF] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cursos ({certificaciones.length})
          </button>
          <button
            onClick={() => setActiveTab('rutas')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-all duration-200 ${
              activeTab === 'rutas'
                ? 'bg-white text-[#1E40AF] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Rutas ({certificadosRuta.length})
          </button>
        </div>

        {/* Barra de Búsqueda */}
        <div className="relative flex-1 max-w-[380px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título o código..."
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-[13.5px] outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      </div>

      {/* Grid de Resultados */}
      {totalCerts === 0 ? (
        
        /* Estado Vacío Completo */
        <div className="py-20 text-center bg-white border border-gray-150 rounded-2xl shadow-sm px-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 text-[#1E40AF]">
            <Award size={32} />
          </div>
          <h3 className="font-bold text-[18px] text-[#111827] mb-2">Aún no posees certificados</h3>
          <p className="text-gray-400 text-[14px] max-w-[360px] mx-auto mb-6">
            Completa las lecciones, aprueba las evaluaciones al 100% y tus certificados oficiales se generarán aquí automáticamente.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-[#1E40AF] text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-[#1A368F] transition-all"
          >
            <span>Explorar Cursos</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      ) : (

        <div>
          
          {/* Listado de Certificados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Renderizar Certificados de Cursos */}
            {(activeTab === 'todos' || activeTab === 'cursos') && 
              filteredCerts.map((cert) => (
                <div 
                  key={cert.id} 
                  className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="p-6">
                    {/* Fila Superior */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="bg-blue-50 text-[#1E40AF] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Curso Individual
                        </span>
                        <p className="text-[12px] text-gray-400 mt-2 font-medium">
                          {cert.cursoInstitucion}
                        </p>
                      </div>
                      <div className="text-emerald-600 flex items-center gap-1.5 text-[12px] font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle size={14} />
                        <span>Completado</span>
                      </div>
                    </div>

                    {/* Título y Detalles */}
                    <h3 className="font-bold text-[17px] text-[#111827] group-hover:text-[#1E40AF] transition-colors leading-snug mb-3">
                      {cert.cursoTitulo}
                    </h3>
                    <p className="text-[13px] text-gray-500 font-medium">
                      Instructor: <span className="text-gray-800 font-semibold">{cert.cursoInstructor}</span>
                    </p>

                    {/* Meta Info (Fecha y Código) */}
                    <div className="mt-5 border-t border-gray-50 pt-4 grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                          <Calendar size={12} />
                          <span>Emisión</span>
                        </div>
                        <p className="text-[13px] font-semibold text-gray-700">
                          {cert.fechaEmision ? new Date(cert.fechaEmision).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '—'}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                          <Hash size={12} />
                          <span>CÓDIGO ÚNICO</span>
                        </div>
                        <p className="text-[13px] font-mono font-bold text-gray-800 uppercase tracking-wide truncate" title={cert.codigoUnico}>
                          {cert.codigoUnico}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Acciones */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                    <a
                      href={cert.urlPdf}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-[#1E40AF] hover:bg-[#1A368F] text-white font-bold text-[13px] py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download size={14} />
                      <span>Descargar PDF</span>
                    </a>
                    <Link
                      href={`/certificados/verificar/${cert.codigoUnico}`}
                      target="_blank"
                      className="bg-white hover:bg-gray-100 text-gray-700 font-bold text-[13px] py-2.5 px-4 rounded-xl border border-gray-200 text-center flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink size={14} />
                      <span>Verificar</span>
                    </Link>
                    <button
                      onClick={() => handleShare(cert)}
                      className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all"
                      title="Compartir enlace de validación"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            }

            {/* 2. Renderizar Certificados de Rutas de Formación */}
            {(activeTab === 'todos' || activeTab === 'rutas') && 
              filteredRutaCerts.map((cert) => (
                <div 
                  key={cert.id} 
                  className="bg-gradient-to-b from-amber-50/20 to-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="p-6">
                    {/* Fila Superior */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                          <Sparkles size={10} />
                          <span>Ruta de Formación</span>
                        </span>
                        <p className="text-[12px] text-gray-400 mt-2 font-medium">
                          SABERHUB Especialista
                        </p>
                      </div>
                      <div className="text-amber-700 flex items-center gap-1.5 text-[12px] font-semibold bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-full">
                        <Award size={14} />
                        <span>Especialista</span>
                      </div>
                    </div>

                    {/* Título y Detalles */}
                    <h3 className="font-bold text-[17px] text-[#111827] group-hover:text-amber-700 transition-colors leading-snug mb-3">
                      {cert.rutaNombre}
                    </h3>
                    <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
                      {cert.rutaDescripcion}
                    </p>

                    {/* Meta Info (Fecha y Código) */}
                    <div className="mt-5 border-t border-amber-100/50 pt-4 grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                          <Calendar size={12} />
                          <span>Emisión</span>
                        </div>
                        <p className="text-[13px] font-semibold text-gray-700">
                          {cert.fechaEmision ? new Date(cert.fechaEmision).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : '—'}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">
                          <Hash size={12} />
                          <span>CÓDIGO ÚNICO</span>
                        </div>
                        <p className="text-[13px] font-mono font-bold text-gray-800 uppercase tracking-wide truncate" title={cert.codigoUnico}>
                          {cert.codigoUnico}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Acciones */}
                  <div className="px-6 py-4 bg-amber-50/30 border-t border-amber-100/50 flex items-center gap-3">
                    <a
                      href={cert.urlPdf}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] py-2.5 px-4 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Download size={14} />
                      <span>Descargar PDF Especial</span>
                    </a>
                    <Link
                      href={`/certificados/verificar/${cert.codigoUnico}`}
                      target="_blank"
                      className="bg-white hover:bg-gray-100 text-amber-700 font-bold text-[13px] py-2.5 px-4 rounded-xl border border-amber-200 text-center flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink size={14} />
                      <span>Verificar</span>
                    </Link>
                    <button
                      onClick={() => handleShare(cert)}
                      className="p-2.5 rounded-xl border border-amber-200 bg-white hover:bg-gray-100 text-amber-600 hover:text-amber-800 transition-all"
                      title="Compartir enlace de validación"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            }

          </div>

          {/* Si se filtró todo y no hay resultados específicos de búsqueda */}
          {((activeTab === 'cursos' && filteredCerts.length === 0) || 
            (activeTab === 'rutas' && filteredRutaCerts.length === 0) ||
            (activeTab === 'todos' && filteredCerts.length === 0 && filteredRutaCerts.length === 0)) && (
            <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl mt-4">
              <p className="text-gray-400 text-[14px]">No se encontraron certificados que coincidan con tu búsqueda.</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
