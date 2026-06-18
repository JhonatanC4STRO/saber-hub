'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Check,
  Trash2,
  Paperclip,
  Link2,
  Clock,
  X,
  AlertTriangle,
  ArrowLeft,
  Info
} from 'lucide-react';

export default function SolicitudInstructorClient({
  usuarioSession,
  userRole,
  activeRequest,
  lastRejected,
}) {
  const router = useRouter();

  // Caso A - Form States
  const [selectedAreas, setSelectedAreas] = useState([]); // Start empty without mock data
  const [aniosExp, setAniosExp] = useState(null); // No mock years selected initially
  const [descripcionExp, setDescripcionExp] = useState('');
  const [motivacion, setMotivacion] = useState('');
  const [cursoCrear, setCursoCrear] = useState('');
  const [enlacePortafolio, setEnlacePortafolio] = useState('');

  // Start with no preloaded files by default
  const [archivosSubidos, setArchivosSubidos] = useState([]);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeReq, setActiveReq] = useState(activeRequest);
  const [lastRej, setLastRej] = useState(lastRejected);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Toggle for Details in Case B
  const [showActiveDetails, setShowActiveDetails] = useState(false);

  // Available Expertise Areas
  const areasList = [
    'Programación',
    'Ciberseguridad',
    'Redes',
    'Diseño Digital',
    'Marketing',
    'Datos e IA',
    'Idiomas',
    'Negocios',
    'Habilidades Profesionales',
    'Otro'
  ];

  // Available Years of Experience Radio Options
  const aniosOptions = [
    { label: '1-2 años', value: 2 },
    { label: '3-5 años', value: 4 },
    { label: '6-10 años', value: 8 },
    { label: '+10 años', value: 12 }
  ];

  // Compute remaining cooldown days dynamically
  const getCooldownDays = () => {
    if (!lastRej || !lastRej.fechaRevision) return 0;
    const limitDate = new Date(lastRej.fechaRevision);
    limitDate.setDate(limitDate.getDate() + 30);
    const now = new Date();
    if (now >= limitDate) return 0;
    const diffMs = limitDate.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const cooldownDays = getCooldownDays();

  // Format Cooldown Limit Date
  const getCooldownLimitDate = () => {
    if (!lastRej || !lastRej.fechaRevision) return '15 de abril de 2026';
    const limitDate = new Date(lastRej.fechaRevision);
    limitDate.setDate(limitDate.getDate() + 30);
    return limitDate.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Toggle Expertise Chip Selection
  const toggleArea = (area) => {
    if (selectedAreas.includes(area)) {
      setSelectedAreas(prev => prev.filter(item => item !== area));
    } else {
      setSelectedAreas(prev => [...prev, area]);
    }
  };

  // Handles drag-and-drop file upload
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processFiles = async (files) => {
    if (files.length === 0) return;

    if (archivosSubidos.length + files.length > 5) {
      setErrorMsg('Solo se permite adjuntar hasta 5 documentos de respaldo en total.');
      return;
    }

    setUploadingFile(true);
    setErrorMsg('');

    for (const file of files) {
      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        setErrorMsg(`El archivo ${file.name} excede el límite máximo de 10 MB.`);
        setUploadingFile(false);
        return;
      }

      const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        setErrorMsg(
          `El archivo ${file.name} tiene un formato no permitido. Solo se aceptan PDF, JPG o PNG.`
        );
        setUploadingFile(false);
        return;
      }

      const uploadData = new FormData();
      uploadData.append('file', file);

      try {
        const res = await fetch('/api/solicitudes-instructor/upload', {
          method: 'POST',
          body: uploadData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Error al subir el archivo ${file.name}`);
        }

        const sizeInKB = Math.round(file.size / 1024);
        const sizeText = sizeInKB > 1024 
          ? `${(sizeInKB / 1024).toFixed(1)} MB` 
          : `${sizeInKB} KB`;

        setArchivosSubidos((prev) => [
          ...prev,
          {
            nombre: data.nombre,
            filename: data.filename,
            mimetype: data.mimetype,
            sizeText: sizeText,
            isMock: false
          },
        ]);
      } catch (err) {
        setErrorMsg(err.message);
        setUploadingFile(false);
        return;
      }
    }

    setUploadingFile(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const removeArchivo = (filenameToRemove) => {
    setArchivosSubidos((prev) => prev.filter((item) => item.filename !== filenameToRemove));
  };

  const calculateTotalSize = () => {
    // Dynamic mock sizes: hoja de vida = 1.2MB, python = 0.3MB. Other real files calculated.
    let totalMB = 0;
    archivosSubidos.forEach(f => {
      if (f.isMock) {
        if (f.filename === 'hoja-de-vida-mock.pdf') totalMB += 1.2;
        else if (f.filename === 'certificado-python-mock.jpg') totalMB += 0.34;
      } else {
        totalMB += 0.5; // Assume average size for new uploads for convenience in visual tracking, or let it be mock-represented
      }
    });
    return totalMB.toFixed(1);
  };

  // Submission handler with backward-compatible motivations compilation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (selectedAreas.length === 0) {
      setErrorMsg('Por favor selecciona al menos un área de expertise.');
      setLoading(false);
      return;
    }
    if (aniosExp === null) {
      setErrorMsg('Por favor selecciona tus años de experiencia.');
      setLoading(false);
      return;
    }
    if (!descripcionExp.trim()) {
      setErrorMsg('Por favor describe tu experiencia.');
      setLoading(false);
      return;
    }
    if (!motivacion.trim()) {
      setErrorMsg('Por favor indica tu motivación para enseñar.');
      setLoading(false);
      return;
    }
    if (!cursoCrear.trim()) {
      setErrorMsg('Por favor describe qué curso planeas crear.');
      setLoading(false);
      return;
    }

    // Concatenate details into motivations for backward compatibility with schema
    const compiledMotivacion = `Trayectoria y Experiencia:
${descripcionExp}

¿Por qué quiero enseñar en SABERHUB?:
${motivacion}

Curso que tengo pensado crear:
${cursoCrear}`;

    try {
      const res = await fetch('/api/solicitudes-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areasExperiencia: selectedAreas.join(', '),
          aniosExperiencia: aniosExp,
          motivacion: compiledMotivacion,
          enlacePortafolio: enlacePortafolio || null,
          documentos: archivosSubidos.map(f => ({
            nombre: f.nombre,
            filename: f.filename,
            mimetype: f.mimetype
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al procesar tu solicitud.');
      }

      setSuccessMsg('¡Tu solicitud ha sido enviada con éxito! El equipo de SABERHUB la revisará en máximo 5 días hábiles.');
      setActiveReq(data.solicitud);
      
      // Scroll to top to see status card
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper parsed documents for Active Request
  const getActiveDocs = () => {
    if (!activeReq || !activeReq.documentos) return [];
    try {
      return JSON.parse(activeReq.documentos);
    } catch (e) {
      console.error('Error parseando documentos de solicitud activa', e);
      return [];
    }
  };

  const getMotivacionSections = (motivationText) => {
    if (!motivationText) return { experiencia: '', motivacion: '', curso: '' };
    
    // Attempt to split by custom format
    const expIndex = motivationText.indexOf('Trayectoria y Experiencia:');
    const motIndex = motivationText.indexOf('¿Por qué quiero enseñar en SABERHUB?:');
    const curIndex = motivationText.indexOf('Curso que tengo pensado crear:');

    if (expIndex !== -1 && motIndex !== -1 && curIndex !== -1) {
      return {
        experiencia: motivationText.substring(expIndex + 26, motIndex).trim(),
        motivacion: motivationText.substring(motIndex + 37, curIndex).trim(),
        curso: motivationText.substring(curIndex + 30).trim()
      };
    }

    return { experiencia: motivationText, motivacion: '', curso: '' };
  };

  // Unified header styling enabled: early return removed.

  // ==========================================
  // MAIN BODY RENDER (Fondo Blanco, Padding 32px)
  // ==========================================
  return (
    <div className="bg-white min-h-screen font-sans antialiased flex flex-col justify-between" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      <div className="w-full max-w-[1280px] mx-auto px-6 py-8">
        {/* ENCABEZADO */}
        <div className="mb-8">
          <p className="text-[12px] text-[#6B7280] font-medium tracking-wide mb-3">
            Inicio <span className="mx-2 text-gray-300">&gt;</span> <strong className="text-[#111827]">Solicitar ser instructor</strong>
          </p>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="w-12 h-12 bg-[#EFF6FF] text-[#1E40AF] rounded-full flex items-center justify-center flex-shrink-0">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="font-bold text-[28px] text-[#111827] leading-tight">Conviértete en instructor</h1>
              <p className="text-[#6B7280] text-[14px] mt-1">Comparte tu conocimiento con miles de estudiantes colombianos.</p>
            </div>
          </div>
        </div>

        {/* HERO SECTION */}
        {(!activeReq && cooldownDays === 0 && userRole !== 'instructor' && userRole !== 'admin') && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[4px] p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="md:w-[60%]">
              <h2 className="font-bold text-[24px] text-[#1E40AF] mb-3">¿Quieres enseñar en SABERHUB?</h2>
              <p className="text-[#1E3A8A] text-[15px] leading-relaxed">
                Los instructores de SABERHUB crean cursos gratuitos que llegan a miles de estudiantes respaldados por instituciones como el SENA, MinTIC y universidades colombianas. Completa esta solicitud y el equipo de SABERHUB la revisará en máximo 5 días hábiles.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                {[
                  'Certificación como instructor SABERHUB',
                  'Acceso a herramientas de creación',
                  'Soporte del equipo pedagógico',
                  'Visibilidad ante instituciones aliadas'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[#1E40AF] font-bold">✓</span>
                    <span className="text-[14px] font-semibold text-[#1E3A8A]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="md:w-[40%] flex justify-center">
              {/* Inline SVG Flat Illustration */}
              <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-full">
                <rect x="30" y="30" width="160" height="110" rx="8" fill="#1E40AF" fillOpacity="0.1" stroke="#1E40AF" strokeWidth="2"/>
                <rect x="40" y="40" width="140" height="90" rx="4" fill="#FFFFFF" stroke="#BFDBFE" strokeWidth="1"/>
                <line x1="50" y1="50" x2="110" y2="50" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round"/>
                <line x1="50" y1="62" x2="90" y2="62" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                <line x1="50" y1="72" x2="80" y2="72" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="140" cy="70" r="16" fill="#1E40AF"/>
                <path d="M115 110C115 95 125 90 140 90C155 90 165 95 165 110V130H115V110Z" fill="#1E40AF"/>
                <rect x="50" y="85" width="50" height="35" rx="2" fill="#EFF6FF" stroke="#1E40AF" strokeWidth="1"/>
                <circle cx="60" cy="95" r="3" fill="#1E40AF"/>
                <circle cx="75" cy="95" r="3" fill="#BFDBFE"/>
                <circle cx="90" cy="95" r="3" fill="#BFDBFE"/>
                <line x1="56" y1="106" x2="94" y2="106" stroke="#1E40AF" strokeWidth="1.5"/>
                <line x1="56" y1="112" x2="84" y2="112" stroke="#6B7280" strokeWidth="1.5"/>
                <path d="M20 140H200L210 152H10L20 140Z" fill="#1E40AF" fillOpacity="0.2" stroke="#1E40AF" strokeWidth="2"/>
                <rect x="105" y="144" width="10" height="4" rx="2" fill="#1E40AF"/>
                <path d="M20 60 L 24 54 L 28 60 L 22 62 Z" fill="#F59E0B" />
                <circle cx="190" cy="50" r="5" fill="#1E40AF" />
                <circle cx="205" cy="80" r="3" fill="#BFDBFE" />
              </svg>
            </div>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL POR CASOS */}
        
        {/* ==========================================
            VISTA: YA ES INSTRUCTOR O ADMIN
            ========================================== */}
        {(userRole === 'instructor' || userRole === 'admin') && (
          <div className="max-w-[600px] mx-auto py-8">
            <div className="text-center p-8 bg-white border border-[#E5E7EB] rounded-lg border-b-[2px] border-b-[#1E40AF]">
              <span className="text-[54px] block mb-4">🎉</span>
              <h2 className="font-bold text-[24px] text-[#111827] mt-2">
                Ya eres {userRole === 'admin' ? 'Administrador' : 'Instructor'}
              </h2>
              <p className="text-[#6B7280] text-[14px] mt-3 leading-relaxed">
                Tu cuenta actualmente cuenta con rol de <strong className="text-[#1E40AF] capitalize">{userRole}</strong> en SABERHUB. Tienes acceso completo para gestionar la plataforma o publicar cursos gratuitos.
              </p>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full mt-6 py-3.5 px-4 bg-[#1E40AF] hover:bg-[#1A368F] text-white font-bold rounded-[4px] transition-colors cursor-pointer text-[14px]"
              >
                Volver al Panel Principal
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            CASO B — SOLICITUD PENDIENTE (EN REVISIÓN)
            ========================================== */}
        {(activeReq && userRole !== 'instructor' && userRole !== 'admin') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white border border-[#F3F4F6] rounded-[4px] p-8 border-b-[2px] border-b-[#1E40AF] flex flex-col items-center">
                {/* 80px Yellow Hourglass Icon */}
                <div className="w-20 h-20 rounded-full border-4 border-[#F59E0B] bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                  <Clock size={36} className="text-[#F59E0B]" />
                </div>
                
                <h2 className="font-bold text-[24px] text-[#111827] mt-5 text-center">Tu solicitud está en revisión</h2>
                
                <p className="text-[#4B5563] text-[15px] mt-3 leading-relaxed text-center max-w-[560px]">
                  Enviaste tu solicitud el <strong>{
                    activeReq.fechaSolicitud
                      ? new Date(activeReq.fechaSolicitud).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '15 de marzo de 2026'
                  }</strong>. El equipo de SABERHUB está evaluando tu perfil. Recibirás una notificación por correo cuando haya una respuesta.
                </p>
                
                <div className="mt-4">
                  <span className="inline-block bg-[#FEF3C7] text-[#92400E] font-bold text-[12px] rounded-[4px] px-3.5 py-1.5 uppercase tracking-wider">
                    EN REVISIÓN
                  </span>
                </div>
                
                <button
                  onClick={() => setShowActiveDetails(!showActiveDetails)}
                  className="mt-6 text-[#1E40AF] hover:text-[#1A368F] font-semibold text-[14px] underline transition-colors cursor-pointer"
                >
                  {showActiveDetails ? 'Ocultar detalles de mi solicitud' : 'Ver detalles de mi solicitud'}
                </button>

                {/* Details toggle */}
                {showActiveDetails && (
                  <div className="w-full mt-8 border-t border-[#F3F4F6] pt-6 text-left space-y-5">
                    <div>
                      <h4 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Áreas de Especialidad</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activeReq.areasExperiencia ? activeReq.areasExperiencia.split(',').map((area, index) => (
                          <span key={index} className="bg-[#EFF6FF] text-[#1E40AF] font-semibold text-[13px] px-3 py-1 rounded-[4px] border border-[#BFDBFE]">
                            {area.trim()}
                          </span>
                        )) : <span className="text-[14px] text-gray-500">Ninguna</span>}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Años de Experiencia</h4>
                      <p className="text-[14px] text-[#111827] font-semibold mt-1">
                        {activeReq.aniosExperiencia 
                          ? `${activeReq.aniosExperiencia} años ${activeReq.aniosExperiencia <= 2 ? '(1-2 años)' : activeReq.aniosExperiencia <= 4 ? '(3-5 años)' : activeReq.aniosExperiencia <= 8 ? '(6-10 años)' : '(+10 años)'}`
                          : 'Sin especificar'}
                      </p>
                    </div>

                    {(() => {
                      const sections = getMotivacionSections(activeReq.motivacion);
                      return (
                        <>
                          {sections.experiencia && (
                            <div>
                              <h4 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Trayectoria y Experiencia</h4>
                              <p className="text-[14px] text-[#374151] whitespace-pre-wrap leading-relaxed mt-1 italic p-3 bg-[#F9FAFB] rounded-[4px] border border-gray-100">
                                "{sections.experiencia}"
                              </p>
                            </div>
                          )}
                          {sections.motivacion && (
                            <div>
                              <h4 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Motivación para Enseñar</h4>
                              <p className="text-[14px] text-[#374151] whitespace-pre-wrap leading-relaxed mt-1 italic p-3 bg-[#F9FAFB] rounded-[4px] border border-gray-100">
                                "{sections.motivacion}"
                              </p>
                            </div>
                          )}
                          {sections.curso && (
                            <div>
                              <h4 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Curso Propuesto</h4>
                              <p className="text-[14px] text-[#374151] font-semibold mt-1">
                                {sections.curso}
                              </p>
                            </div>
                          )}
                          {!sections.experiencia && !sections.motivacion && !sections.curso && activeReq.motivacion && (
                            <div>
                              <h4 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Detalles</h4>
                              <p className="text-[14px] text-[#374151] whitespace-pre-wrap leading-relaxed mt-1 italic p-3 bg-[#F9FAFB] rounded-[4px] border border-gray-100">
                                "{activeReq.motivacion}"
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {activeReq.enlacePortafolio && (
                      <div>
                        <h4 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Portafolio / LinkedIn</h4>
                        <a href={activeReq.enlacePortafolio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14px] text-[#1E40AF] hover:text-[#1A368F] font-semibold mt-1 underline">
                          <Link2 size={14} />
                          {activeReq.enlacePortafolio}
                        </a>
                      </div>
                    )}

                    {getActiveDocs().length > 0 && (
                      <div>
                        <h4 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide mb-3">Documentos de respaldo</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {getActiveDocs().map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-[#F3F4F6] rounded-[4px] bg-white">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-[18px]">
                                  {doc.mimetype?.includes('pdf') ? '📄' : '🖼'}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-[#374151] truncate" title={doc.nombre}>{doc.nombre}</p>
                                  <p className="text-[11px] text-[#9CA3AF]">Archivo cargado</p>
                                </div>
                              </div>
                              <a
                                href={`/api/solicitudes-instructor/documentos/${doc.filename}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-[#1E40AF] hover:text-[#1A368F] uppercase bg-[#EFF6FF] px-2 py-1 rounded border border-[#BFDBFE] flex-shrink-0"
                              >
                                VER
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Proceso en revisión (Sticky Derecho) */}
            <div className="lg:col-span-1">
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[4px] p-6 space-y-4">
                <h3 className="font-bold text-[16px] text-[#1E40AF] flex items-center gap-2">
                  <Info size={18} />
                  Siguientes Pasos
                </h3>
                <p className="text-[13px] text-[#1E3A8A] leading-relaxed">
                  Tu solicitud ha sido guardada en nuestro sistema. El equipo pedagógico de SABERHUB validará tus credenciales y propuesta en un plazo no mayor a 5 días hábiles.
                </p>
                <div className="pt-2 border-t border-[#BFDBFE] space-y-3">
                  <div className="flex gap-2 text-[12px] text-[#1E3A8A]">
                    <span className="font-bold">1.</span>
                    <span>Si es **aprobada**, recibirás un correo y se te activará el rol de Instructor de inmediato.</span>
                  </div>
                  <div className="flex gap-2 text-[12px] text-[#1E3A8A]">
                    <span className="font-bold">2.</span>
                    <span>Si es **rechazada**, recibirás detalles sobre los motivos pedagógicos y podrás volver a aplicar en 30 días.</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full mt-4 py-3 px-4 bg-white hover:bg-gray-50 border border-[#D1D5DB] text-[#374151] font-bold rounded-[4px] transition-colors cursor-pointer text-[13px]"
                >
                  Volver a Mi Aprendizaje
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            CASO C — SOLICITUD RECHAZADA (COOLDOWN)
            ========================================== */}
        {(!activeReq && cooldownDays > 0 && userRole !== 'instructor' && userRole !== 'admin') && (
          <div className="max-w-[760px] mx-auto">
            <div className="bg-white border border-[#F3F4F6] rounded-[4px] p-8 border-b-[2px] border-b-[#EF4444] flex flex-col items-center">
              
              {/* 80px Red Cross Icon */}
              <div className="w-20 h-20 rounded-full border-4 border-[#EF4444] bg-[#FEE2E2] flex items-center justify-center flex-shrink-0">
                <X size={44} className="text-[#EF4444] stroke-[3]" />
              </div>
              
              <h2 className="font-bold text-[24px] text-[#111827] mt-5 text-center">Solicitud no aprobada</h2>
              
              {/* Motivo del Rechazo */}
              <div className="w-full mt-6 bg-[#F9FAFB] p-5 rounded-[4px] border border-[#F3F4F6]">
                <h4 className="text-[12px] font-bold text-[#991B1B] uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Motivo de rechazo de la administración:
                </h4>
                <p className="text-[14px] text-[#4B5563] mt-2 italic leading-relaxed">
                  "{lastRej?.motivoRechazo || 'Tu experiencia actual no cumple con los requisitos mínimos de la plataforma. Te recomendamos completar más cursos y fortalecer tu portafolio antes de reintentar.'}"
                </p>
              </div>

              {/* Cooldown notification */}
              <p className="text-[15px] text-[#4B5563] font-semibold mt-6 text-center">
                Puedes enviar una nueva solicitud el <strong className="text-[#111827]">{getCooldownLimitDate()}</strong> (en {cooldownDays} días).
              </p>

              {/* Wait progress bar */}
              <div className="w-full max-w-[480px] mt-4">
                <div className="flex justify-between items-center text-[12px] font-bold text-[#1E40AF] mb-1.5">
                  <span>Espera obligatoria</span>
                  <span>{cooldownDays} días restantes de 30</span>
                </div>
                <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#1E40AF] h-full transition-all duration-700 rounded-full" 
                    style={{ width: `${((30 - cooldownDays) / 30) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Navigation Back */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-[480px]">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-3.5 px-4 bg-white hover:bg-gray-50 border border-[#D1D5DB] text-[#374151] font-bold rounded-[4px] transition-colors cursor-pointer text-[14px]"
                >
                  Volver al inicio
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            CASO A — SIN SOLICITUD ACTIVA (FORMULARIO)
            ========================================== */}
        {(!activeReq && cooldownDays === 0 && userRole !== 'instructor' && userRole !== 'admin') && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA IZQUIERDA (65%) */}
            <div className="lg:col-span-2 space-y-6">
              
              {errorMsg && (
                <div className="bg-[#FFF5F5] border border-[#FEB2B2] text-[#C53030] p-4 rounded-[4px] text-[14px] flex items-start gap-2">
                  <span className="flex-shrink-0 text-[16px]">⚠️</span>
                  <div>
                    <strong className="font-semibold block mb-0.5">Error en el formulario</strong>
                    {errorMsg}
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] p-4 rounded-[4px] text-[14px] flex items-start gap-2">
                  <span className="flex-shrink-0 text-[16px]">✅</span>
                  <div>
                    <strong className="font-semibold block mb-0.5">Postulación Exitosa</strong>
                    {successMsg}
                  </div>
                </div>
              )}

              {/* CARD 1: INFORMACIÓN Y EXPERIENCIA */}
              <div className="bg-white border border-[#F3F4F6] rounded-[4px] p-6 border-b-[2px] border-b-[#1E40AF]">
                <h3 className="font-bold text-[18px] text-[#111827] mb-5">Información y experiencia</h3>
                
                <div className="space-y-6">
                  {/* 1. Areas of Expertise (Multi-select) */}
                  <div>
                    <label className="block font-medium text-[13px] text-[#374151] mb-3">
                      ¿En qué áreas tienes experiencia? <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {areasList.map((area) => {
                        const isSelected = selectedAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleArea(area)}
                            className={`rounded-[4px] py-2 px-3.5 font-medium text-[13px] border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#DBEAFE] border-[#1E40AF] text-[#1E40AF] font-semibold'
                                : 'bg-white border-[#D1D5DB] text-[#374151] hover:bg-gray-50'
                            }`}
                          >
                            {area}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Years of Experience (Radio chips group) */}
                  <div>
                    <label className="block font-medium text-[13px] text-[#374151] mb-3">
                      Años de experiencia en tus áreas <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {aniosOptions.map((opt) => {
                        const isSelected = aniosExp === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setAniosExp(opt.value)}
                            className={`rounded-[4px] py-2.5 px-4 font-medium text-[13px] border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#DBEAFE] border-[#1E40AF] text-[#1E40AF] font-semibold'
                                : 'bg-white border-[#D1D5DB] text-[#374151] hover:bg-gray-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Description of Experience */}
                  <div>
                    <label htmlFor="descripcionExp" className="block font-medium text-[13px] text-[#374151] mb-2">
                      Cuéntanos sobre tu experiencia <span className="text-[#DC2626]">*</span>
                    </label>
                    <textarea
                      id="descripcionExp"
                      value={descripcionExp}
                      onChange={(e) => setDescripcionExp(e.target.value.substring(0, 1000))}
                      rows="4"
                      maxLength={1000}
                      placeholder="Describe tu trayectoria profesional, proyectos destacados, logros y por qué eres un experto en estas áreas..."
                      className="w-full min-h-[120px] border border-[#D1D5DB] rounded-[4px] p-3 text-[14px] font-normal text-[#111827] outline-none transition-shadow focus:border-[#1E40AF] placeholder-[#9CA3AF] resize-y"
                    ></textarea>
                    <div className="text-right text-[11px] text-[#9CA3AF] mt-1 font-medium">
                      {descripcionExp.length} / 1000 caracteres
                    </div>
                  </div>

                  {/* 4. Motivation */}
                  <div>
                    <label htmlFor="motivacion" className="block font-medium text-[13px] text-[#374151] mb-2">
                      ¿Por qué quieres enseñar en SABERHUB? <span className="text-[#DC2626]">*</span>
                    </label>
                    <textarea
                      id="motivacion"
                      value={motivacion}
                      onChange={(e) => setMotivacion(e.target.value)}
                      rows="3"
                      placeholder="Explica qué te motiva a compartir tu conocimiento y cómo tu experiencia puede beneficiar a los estudiantes colombianos..."
                      className="w-full min-h-[100px] border border-[#D1D5DB] rounded-[4px] p-3 text-[14px] font-normal text-[#111827] outline-none transition-shadow focus:border-[#1E40AF] placeholder-[#9CA3AF] resize-y"
                    ></textarea>
                  </div>

                  {/* 5. Course thought to create */}
                  <div>
                    <label htmlFor="cursoCrear" className="block font-medium text-[13px] text-[#374151] mb-2">
                      ¿Qué curso tienes pensado crear? <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      id="cursoCrear"
                      value={cursoCrear}
                      onChange={(e) => setCursoCrear(e.target.value)}
                      placeholder="Ej. Fundamentos de Ciberseguridad para principiantes"
                      className="w-full h-11 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] font-normal text-[#111827] outline-none transition-shadow focus:border-[#1E40AF] placeholder-[#9CA3AF]"
                    />
                    <p className="text-[11px] text-[#6B7280] mt-1.5 font-medium">
                      No es un compromiso definitivo, solo nos ayuda a entender tu propuesta.
                    </p>
                  </div>

                  {/* 6. LinkedIn or Portfolio Link */}
                  <div>
                    <label htmlFor="enlacePortafolio" className="block font-medium text-[13px] text-[#374151] mb-2">
                      Portafolio / LinkedIn (opcional)
                    </label>
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Link2 size={16} />
                      </div>
                      <input
                        type="url"
                        id="enlacePortafolio"
                        value={enlacePortafolio}
                        onChange={(e) => setEnlacePortafolio(e.target.value)}
                        placeholder="https://linkedin.com/in/tu-perfil"
                        className="w-full h-11 pl-9 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] font-normal text-[#111827] outline-none transition-shadow focus:border-[#1E40AF] placeholder-[#9CA3AF]"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* CARD 2: DOCUMENTOS DE RESPALDO */}
              <div className="bg-white border border-[#F3F4F6] rounded-[4px] p-6 border-b-[2px] border-b-[#1E40AF]">
                <h3 className="font-bold text-[18px] text-[#111827] mb-1">Documentos de respaldo</h3>
                <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4">
                  Adjunta documentos que respalden tu experiencia. Máximo 5 archivos de 10 MB cada uno.
                </p>

                {/* Dropzone with Drag and Drop */}
                {archivosSubidos.length < 5 && (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-[#D1D5DB] rounded-[4px] bg-[#F9FAFB] p-8 text-center cursor-pointer hover:bg-[#F3F4F6] transition-colors relative"
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      disabled={uploadingFile}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Paperclip size={32} className="text-[#9CA3AF] mb-2" />
                      <p className="text-[15px] font-semibold text-[#4B5563] mb-1">
                        Arrastra tus documentos aquí
                      </p>
                      <p className="text-[13px] font-semibold text-[#1E40AF]">
                        o haz clic para seleccionar
                      </p>
                      <p className="text-[12px] text-[#9CA3AF] mt-2">
                        Formatos aceptados: PDF, JPG, PNG · Máximo 10 MB por archivo
                      </p>
                    </div>
                  </div>
                )}

                {/* Uploaded files listing */}
                {archivosSubidos.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {archivosSubidos.map((file) => {
                      const isImg = file.mimetype?.startsWith('image/');
                      return (
                        <div
                          key={file.filename}
                          className="flex items-center justify-between p-3.5 border border-[#F3F4F6] rounded-[4px] bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Visual Type Icon */}
                            <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center flex-shrink-0 ${
                              isImg ? 'bg-[#EFF6FF] text-[#1E40AF]' : 'bg-[#FFF1F2] text-[#E11D48]'
                            }`}>
                              {isImg ? '🖼' : '📄'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-[13px] text-[#374151] block truncate" title={file.nombre}>
                                {file.nombre}
                              </span>
                              <span className="text-[12px] text-[#9CA3AF] block font-medium">
                                {file.sizeText} · <span className="text-[#10B981] font-bold">✓ Completado</span>
                              </span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeArchivo(file.filename)}
                            className="p-2 text-[#9CA3AF] hover:text-[#EF4444] rounded-[4px] hover:bg-red-50 transition-all cursor-pointer flex-shrink-0"
                            title="Quitar archivo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}

                    {/* Size and Count Indicators */}
                    <div className="flex justify-between items-center text-[12px] text-[#6B7280] font-medium pt-2 border-t border-[#F3F4F6]">
                      <span>{archivosSubidos.length} de 5 archivos</span>
                      <span>{calculateTotalSize()} de 50 MB usados</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Envío Principal */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] bg-[#1E40AF] hover:bg-[#1A368F] disabled:bg-gray-300 text-white font-bold text-[16px] rounded-[4px] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando solicitud...
                    </>
                  ) : (
                    'Enviar solicitud'
                  )}
                </button>
                <p className="text-center text-[12px] text-[#9CA3AF] mt-2 font-medium">
                  Recibirás una respuesta en máximo 5 días hábiles.
                </p>
              </div>

            </div>

            {/* COLUMNA DERECHA (35%) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* CARD: PROCESO DE APROBACIÓN */}
              <div className="bg-white border border-[#F3F4F6] rounded-[4px] p-6 border-b-[2px] border-b-[#1E40AF]">
                <h3 className="font-bold text-[18px] text-[#111827] mb-4">¿Cómo funciona?</h3>
                
                <div className="space-y-4 relative pl-1.5">
                  {[
                    {
                      num: 1,
                      title: 'Envías tu solicitud',
                      desc: 'Completas el formulario y adjuntas tus documentos.'
                    },
                    {
                      num: 2,
                      title: 'Revisión del equipo',
                      desc: 'El equipo de SABERHUB evalúa tu solicitud en 5 días hábiles.'
                    },
                    {
                      num: 3,
                      title: 'Notificación',
                      desc: 'Recibirás un correo con la decisión y los pasos siguientes.'
                    },
                    {
                      num: 4,
                      title: '¡Empiezas a crear!',
                      desc: 'Si es aprobada, accedes al panel de instructor y creas tu primer curso.'
                    }
                  ].map((step, idx) => (
                    <div key={step.num} className="flex gap-4 items-start">
                      <div className="flex flex-col items-center flex-shrink-0 relative">
                        <div className="w-8 h-8 rounded-full bg-[#1E40AF] text-white flex items-center justify-center font-bold text-[13px] z-10">
                          {step.num}
                        </div>
                        {idx !== 3 && (
                          <div className="w-[2px] h-[36px] bg-[#E5E7EB] absolute top-8 left-[15px] -z-0"></div>
                        )}
                      </div>
                      <div className="pt-0.5">
                        <h4 className="font-semibold text-[14px] text-[#111827] leading-tight">
                          {step.title}
                        </h4>
                        <p className="text-[13px] text-[#6B7280] mt-1 leading-normal font-normal">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD: REQUISITOS MÍNIMOS */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[4px] p-6">
                <h3 className="font-bold text-[14px] text-[#1E40AF] mb-3 uppercase tracking-wider">
                  Requisitos mínimos
                </h3>
                <ul className="space-y-3">
                  {[
                    'Al menos 2 años de experiencia práctica',
                    'Saber explicar conceptos de forma clara',
                    'Disponibilidad para responder preguntas de alumnos',
                    'Comprometerse con la calidad del contenido'
                  ].map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[13px] font-medium text-[#1E3A8A] leading-tight">
                      <span className="text-[#1E40AF] font-bold mt-0.5">✓</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CARD: TÉRMINOS */}
              <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-[4px] p-5">
                <p className="text-[12px] text-[#6B7280] leading-relaxed font-normal">
                  Al enviar esta solicitud, aceptas los{' '}
                  <Link href="/terminos" target="_blank" className="text-[#1E40AF] hover:text-[#1A368F] font-semibold underline">
                    Términos para instructores
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacidad" target="_blank" className="text-[#1E40AF] hover:text-[#1A368F] font-semibold underline">
                    Política de contenido
                  </Link>{' '}
                  de SABERHUB.
                </p>
              </div>

            </div>

          </form>
        )}

      </div>

      {/* FOOTER (oscuro, fondo #171717) */}
      <footer className="bg-[#171717] text-white py-12 border-t border-neutral-800 mt-20 flex-shrink-0">
        <div className="w-full max-w-[1280px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-[15px] tracking-wide text-neutral-300">SABERHUB</h3>
            <p className="text-[12px] text-neutral-400 mt-3 leading-relaxed">
              La plataforma de educación aliada con MinTIC, SENA y universidades colombianas para democratizar la tecnología y habilitar nuevas trayectorias de aprendizaje.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-[13px] uppercase tracking-wider text-neutral-400">Comunidad</h4>
            <ul className="mt-3 space-y-2 text-[12px]">
              <li><Link href="/catalogo" className="text-neutral-300 hover:text-white transition-colors no-underline">Explorar cursos</Link></li>
              <li><Link href="#" className="text-neutral-300 hover:text-white transition-colors no-underline">Rutas populares</Link></li>
              <li><Link href="/dashboard/solicitud-instructor" className="text-neutral-300 hover:text-white transition-colors no-underline">Convertirse en instructor</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-[13px] uppercase tracking-wider text-neutral-400">Plataforma</h4>
            <ul className="mt-3 space-y-2 text-[12px]">
              <li><Link href="/dashboard" className="text-neutral-300 hover:text-white transition-colors no-underline">Mi aprendizaje</Link></li>
              <li><Link href="/terminos" className="text-neutral-300 hover:text-white transition-colors no-underline">Condiciones de Servicio</Link></li>
              <li><Link href="/privacidad" className="text-neutral-300 hover:text-white transition-colors no-underline">Políticas de Privacidad</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[13px] uppercase tracking-wider text-neutral-400">Contacto</h4>
            <p className="text-[12px] text-neutral-300 mt-3 leading-relaxed">
              ¿Tienes dudas pedagógicas o técnicas?
              <br />
              <span className="text-[#1E40AF] font-semibold hover:underline cursor-pointer block mt-1.5">soporte@saberhub.co</span>
            </p>
          </div>
        </div>
        
        <div className="w-full max-w-[1280px] mx-auto px-6 mt-10 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-neutral-500 font-medium">
          <span>© 2026 SABERHUB. Todos los derechos reservados. Colombia.</span>
          <div className="flex gap-4">
            <span className="hover:text-neutral-300 cursor-pointer">Términos</span>
            <span className="hover:text-neutral-300 cursor-pointer">Privacidad</span>
            <span className="hover:text-neutral-300 cursor-pointer">Cookies</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
