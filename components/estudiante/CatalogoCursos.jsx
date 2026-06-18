'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import {
  Search,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  BookOpen,
  Play,
  Clock,
  MoreVertical,
  Filter,
  Rocket
} from 'lucide-react';

/* ═══════════════ INLINE SVG ICONS FOR FOOTER ═══════════════ */
const YoutubeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);
const FacebookIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.81l.39-4h-4.2V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);
const InstagramIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
const LinkedinIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);
const TwitterIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

/* ═══════════════ AREAS TEMÁTICAS ═══════════════ */
const AREAS = [
  'Ciberseguridad',
  'Programación',
  'Inteligencia Artificial',
  'Redes',
  'Datos y Analítica',
  'Marketing Digital',
  'Diseño Digital',
  'Habilidades Profesionales',
];

const OBJETIVOS = [
  'Tomar un curso gratuito',
  'Obtener una certificación',
  'Aprender con una institución',
  'Prepararme para el trabajo',
];

const LINKS_UTILES = [
  { label: 'Noticias para Estudiantes', href: '/dashboard' },
  { label: 'Explorar herramientas de simulación', href: '/catalogo' },
  { label: 'Recursos de carrera', href: '/catalogo' },
  { label: 'Historias de éxito', href: '/catalogo' },
  { label: 'Insignias y Certificaciones', href: '/dashboard/certificados' },
  { label: 'Próximos eventos', href: '/catalogo' },
];

/* ═══════════════ INSTITUTION LOGO ═══════════════ */
function InstitutionLogo({ logoUrl, nombre }) {
  const [error, setError] = useState(false);
  const initials = (nombre || '??').substring(0, 2).toUpperCase();

  return (
    <div className="relative shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-extrabold text-2xl flex items-center justify-center mb-5 select-none shadow overflow-hidden">
      {logoUrl && !error ? (
        <img
          src={logoUrl}
          alt={nombre}
          className="w-full h-full object-contain p-2 bg-white"
          onError={() => setError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/* ═══════════════ COMPONENT ═══════════════ */
export default function CatalogoCursos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inscripciones, setInscripciones] = useState([]);
  const [inscribiendo, setInscribiendo] = useState(null);

  const [usuario, setUsuario] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filterArea, setFilterArea] = useState('Todas');
  const [filterNivel, setFilterNivel] = useState('Todos');
  const [filterInstitucion, setFilterInstitucion] = useState('Todas');
  const [filterTipo, setFilterTipo] = useState('Todos'); // 'Todos' | 'Plataforma' | 'Externos'
  const [activeTab, setActiveTab] = useState('catalogo');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('');

  // Pagination for grid
  const [visibleCount, setVisibleCount] = useState(6);

  // External Institutions State
  const [institucionesAliadas, setInstitucionesAliadas] = useState([]);
  const [loadingInstituciones, setLoadingInstituciones] = useState(true);
  const [enrollModal, setEnrollModal] = useState({
    showConfirm: false,
    showSuccess: false,
    loading: false,
    errorMsg: '',
    cursoId: '',
    titulo: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Reset pagination when filters or searches change
  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, filterArea, filterNivel, filterInstitucion, sidebarFilter, filterTipo]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catalogoRes, externosRes, inscripRes, meRes, instRes] = await Promise.all([
          fetch('/api/cursos/catalogo'),
          fetch('/api/cursos/externos?limit=1000').catch(() => null),
          fetch('/api/inscripciones').catch(() => null),
          fetch('/api/auth/me').catch(() => null),
          fetch('/api/instituciones').catch(() => null),
        ]);
        let localCursos = [];
        let extCursos = [];
        if (catalogoRes.ok) {
          localCursos = (await catalogoRes.json()).map(c => ({ ...c, isExterno: false }));
        }
        if (externosRes?.ok) {
          const data = await externosRes.json();
          extCursos = (data.cursos || []).map(c => ({
            ...c,
            isExterno: true,
            // map category and institution fields for unified filtering
            categoria: { nombre: c.areaConocimiento || 'General' },
            imgPortada: c.imagenUrl,
          }));
        }
        setCursos([...localCursos, ...extCursos]);

        if (inscripRes?.ok) {
          const data = await inscripRes.json();
          setInscripciones(
            (data.inscripciones || []).filter((i) => i.estado !== 'retirado').map((i) => i.cursoId)
          );
        }
        if (meRes?.ok) {
          const data = await meRes.json();
          setUsuario(data.usuario || data);
        }
        if (instRes?.ok) {
          setInstitucionesAliadas(await instRes.json());
        }
      } catch (err) {
        console.error('Error cargando catálogo:', err);
      } finally {
        setLoading(false);
        setLoadingInstituciones(false);
      }
    };
    fetchData();
  }, []);

  const handleInscribirse = async (cursoId, titulo) => {
    if (!usuario) {
      alert('Debes iniciar sesión para inscribirte en este curso.');
      router.push('/login');
      return;
    }
    setEnrollModal({
      showConfirm: true,
      showSuccess: false,
      loading: false,
      errorMsg: '',
      cursoId,
      titulo,
    });
  };

  const confirmInscripcion = async () => {
    const { cursoId, titulo } = enrollModal;
    setEnrollModal(prev => ({ ...prev, loading: true, errorMsg: '' }));
    try {
      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId }),
      });
      if (res.ok || res.status === 201) {
        setInscripciones((prev) => [...prev, cursoId]);
        setEnrollModal({
          showConfirm: false,
          showSuccess: true,
          loading: false,
          errorMsg: '',
          cursoId: '',
          titulo,
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else if (res.status === 401) {
        router.push('/login');
      } else if (res.status === 409) {
        setEnrollModal({
          showConfirm: false,
          showSuccess: true,
          loading: false,
          errorMsg: 'Ya estás inscrito en este curso.',
          cursoId: '',
          titulo,
        });
        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else {
        const data = await res.json().catch(() => ({}));
        setEnrollModal(prev => ({
          ...prev,
          loading: false,
          errorMsg: data.message || 'Error al inscribirse. Intenta nuevamente.',
        }));
      }
    } catch {
      setEnrollModal(prev => ({
        ...prev,
        loading: false,
        errorMsg: 'Error de red. Intenta de nuevo.',
      }));
    }
  };

  /* ─── Derived data ─── */
  const instituciones = [...new Set(cursos.map((c) => c.institucion?.nombre).filter(Boolean))];
  const categorias = [...new Set(cursos.map((c) => c.categoria?.nombre).filter(Boolean))];

  const filteredCursos = cursos.filter((c) => {
    if (
      searchQuery &&
      !c.titulo.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(c.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    if (filterArea !== 'Todas' && c.categoria?.nombre !== filterArea) return false;
    const courseLevel = c.nivel || 'Principiante';
    if (filterNivel !== 'Todos' && courseLevel.toLowerCase() !== filterNivel.toLowerCase()) return false;
    if (filterInstitucion !== 'Todas' && c.institucion?.nombre !== filterInstitucion) return false;
    if (sidebarFilter && c.categoria?.nombre !== sidebarFilter) return false;
    
    // Filtro por tipo/origen del curso
    if (filterTipo === 'Plataforma' && c.isExterno) return false;
    if (filterTipo === 'Externos' && !c.isExterno) return false;

    return true;
  });

  const featuredCursos = filteredCursos.slice(0, 3);

  /* ═══════════════════════════════════════════════ */
  /* ═══════════════ RENDER ═══════════════════════ */
  /* ═══════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen bg-white font-sans flex flex-col"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* ════════════════════ HEADER ════════════════════ */}
      <HeaderAdmin usuario={usuario} searchValue={searchQuery} onSearchChange={setSearchQuery} />

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="bg-[#F9FAFB] py-12 lg:py-16 px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 lg:max-w-[60%]">
            <p className="font-medium text-[11px] text-[#1E40AF] uppercase tracking-wider mb-4">
              SABERHUB · CATÁLOGO DE CURSOS
            </p>
            <h1 className="font-bold text-[32px] lg:text-[40px] text-[#111827] leading-[1.2] mb-4">
              Construye tus habilidades.
              <br />
              Construye tu futuro.
            </h1>
            <p className="font-normal text-[16px] lg:text-[18px] text-[#4B5563] leading-[1.6] mb-8 max-w-[600px]">
              Cursos en línea gratuitos. Aprendizaje con instructores expertos. Certificados
              validados por las mejores instituciones de Colombia.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  document.getElementById('grid-section')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="bg-[#1E40AF] text-white font-semibold text-[16px] px-7 py-3.5 rounded hover:bg-[#1A368F] transition-colors"
              >
                Explorar cursos
              </button>
              <button
                onClick={() => {
                  setActiveTab('instituciones');
                  document.getElementById('grid-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white text-[#111827] font-semibold text-[16px] px-7 py-3.5 rounded border border-[#D1D5DB] hover:bg-[#F9FAFB] transition-colors"
              >
                Ver instituciones
              </button>
            </div>
          </div>
          <div className="flex-1 lg:max-w-[40%] flex justify-center">
            {/* Illustration SVG */}
            <svg
              width="360"
              height="280"
              viewBox="0 0 360 280"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="40" y="60" width="280" height="180" rx="12" fill="#EFF6FF" />
              <rect x="70" y="90" width="100" height="70" rx="6" fill="#DBEAFE" />
              <rect x="190" y="90" width="100" height="70" rx="6" fill="#DBEAFE" />
              <circle cx="120" cy="200" r="20" fill="#1E40AF" opacity="0.2" />
              <circle cx="240" cy="200" r="20" fill="#1E40AF" opacity="0.2" />
              <rect x="105" y="185" width="30" height="30" rx="15" fill="#1E40AF" />
              <path d="M117 195l5 5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <rect x="225" y="185" width="30" height="30" rx="15" fill="#3B82F6" />
              <path d="M237 195l5 5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <rect x="80" y="100" width="60" height="8" rx="4" fill="#93C5FD" />
              <rect x="80" y="114" width="80" height="6" rx="3" fill="#BFDBFE" />
              <rect x="80" y="126" width="50" height="6" rx="3" fill="#BFDBFE" />
              <rect x="200" y="100" width="60" height="8" rx="4" fill="#93C5FD" />
              <rect x="200" y="114" width="80" height="6" rx="3" fill="#BFDBFE" />
              <rect x="200" y="126" width="50" height="6" rx="3" fill="#BFDBFE" />
              <circle cx="60" cy="50" r="6" fill="#1E40AF" opacity="0.15" />
              <circle cx="300" cy="50" r="8" fill="#3B82F6" opacity="0.12" />
              <circle cx="180" cy="40" r="4" fill="#1E40AF" opacity="0.1" />
            </svg>
          </div>
        </div>
      </section>

      {/* ════════════════════ MAIN SECTION ════════════════════ */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ════════ SIDEBAR LEFT ════════ */}
          {/* Mobile toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center gap-2 mb-4 bg-[#EFF6FF] text-[#1E40AF] font-semibold text-[14px] px-4 py-3 rounded-lg"
          >
            <Filter size={18} />
            {sidebarOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>

          <aside
            className={`w-full lg:w-[260px] flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}
          >
            <h2 className="font-bold text-[18px] text-[#111827] mb-6">Catálogo de aprendizaje</h2>


            {/* Áreas Temáticas */}
            <div className="mb-6">
              <p className="font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider mb-2">
                ÁREAS TEMÁTICAS
              </p>
              {AREAS.map((area) => (
                <div
                  key={area}
                  onClick={() => {
                    setSidebarFilter(sidebarFilter === area ? '' : area);
                    setFilterArea(sidebarFilter === area ? 'Todas' : area);
                  }}
                  className={`flex items-center justify-between py-2.5 px-2 cursor-pointer rounded transition-colors group ${sidebarFilter === area ? 'bg-[#EFF6FF] text-[#1E40AF]' : 'text-[#374151] hover:text-[#1E40AF] hover:bg-[#EFF6FF]'}`}
                >
                  <span className="font-medium text-[14px]">{area}</span>
                  <ChevronRight
                    size={14}
                    className={`transition-all group-hover:translate-x-0.5 ${sidebarFilter === area ? 'text-[#1E40AF]' : 'text-[#9CA3AF] group-hover:text-[#1E40AF]'}`}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSidebarFilter('');
                setFilterArea('Todas');
                document.getElementById('grid-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-[#1E40AF] text-white font-semibold text-[14px] py-3 px-4 rounded hover:bg-[#1A368F] transition-colors"
            >
              Explorar catálogo completo
            </button>
          </aside>

          {/* ════════ AREA DE RESULTADOS ════════ */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#F3F4F6] mb-6">
              <button
                onClick={() => setActiveTab('catalogo')}
                className={`pb-3 font-semibold text-[14px] transition-colors relative ${activeTab === 'catalogo' ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#374151]'}`}
              >
                Catálogo de aprendizaje
                {activeTab === 'catalogo' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E40AF] rounded-t" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('instituciones')}
                className={`pb-3 font-medium text-[14px] transition-colors relative flex items-center gap-2 ${activeTab === 'instituciones' ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#374151]'}`}
              >
                Instituciones Aliadas
                <span className="bg-[#EFF6FF] text-[#1E40AF] font-bold text-[10px] px-1.5 py-0.5 rounded">Aliados</span>
                {activeTab === 'instituciones' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1E40AF] rounded-t" />
                )}
              </button>
            </div>

            {activeTab === 'catalogo' && (
              <div className="flex flex-col xl:flex-row gap-8">
                {/* Featured courses + content */}
                <div className="flex-1 min-w-0">
                  {/* Featured section */}
                  <p className="font-semibold text-[11px] text-[#1E40AF] uppercase tracking-wider mb-2">
                    TOMAR UN CURSO GRATUITO
                  </p>
                  <p className="font-normal text-[14px] text-[#4B5563] leading-[1.5] max-w-[720px] mb-6">
                    Aprende temas de programación, ciberseguridad y más a través de cursos
                    respaldados por instituciones líderes en Colombia, y prepárate para
                    certificaciones y habilidades laborales.
                  </p>

                  {/* Featured list (3 courses, Cisco horizontal style) */}
                  {loading ? (
                    <div className="flex flex-col items-center py-16">
                      <div className="w-10 h-10 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-[14px] text-[#6B7280]">Cargando cursos...</p>
                    </div>
                  ) : featuredCursos.length > 0 ? (
                    <div className="mb-6">
                      {featuredCursos.map((curso, idx) => (
                        <div
                          key={curso.id}
                          className={`flex items-start gap-4 py-5 ${idx < featuredCursos.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}
                        >
                          {/* Image */}
                          {curso.isExterno ? (
                            <a
                              href={curso.fuenteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative w-[96px] h-[96px] rounded flex-shrink-0 overflow-hidden bg-[#E5E7EB]"
                            >
                              {curso.imgPortada ? (
                                <img
                                  src={curso.imgPortada}
                                  alt={curso.titulo}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[24px]">
                                  📚
                                </div>
                              )}
                              <span className="absolute top-1 left-1 bg-[#1E40AF] text-white font-semibold text-[9px] px-1.5 py-0.5 rounded">
                                PRINCIPIANTE
                              </span>
                            </a>
                          ) : (
                            <Link
                              href={`/cursos/${curso.id}`}
                              className="relative w-[96px] h-[96px] rounded flex-shrink-0 overflow-hidden bg-[#E5E7EB]"
                            >
                              {curso.imgPortada ? (
                                <img
                                  src={curso.imgPortada}
                                  alt={curso.titulo}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[24px]">
                                  📚
                                </div>
                              )}
                              <span className="absolute top-1 left-1 bg-[#1E40AF] text-white font-semibold text-[9px] px-1.5 py-0.5 rounded">
                                PRINCIPIANTE
                              </span>
                            </Link>
                          )}
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-medium text-[12px] text-[#6B7280]">
                                📖 Course · Self-paced
                                {curso.isExterno ? '' : (curso.institucion?.nombre ? ` · ${curso.institucion.nombre}` : '')}
                              </p>
                              {curso.isExterno && (
                                <span className="inline-flex items-center bg-[#EFF6FF] text-[#1E40AF] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#BFDBFE] uppercase">
                                  Fuente: {curso.fuenteNombre || 'Externo'}
                                </span>
                              )}
                            </div>
                            {curso.isExterno ? (
                              <a
                                href={curso.fuenteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block font-bold text-[16px] text-[#111827] hover:text-[#1E40AF] transition-colors leading-snug mb-1 no-underline"
                              >
                                {curso.titulo}
                              </a>
                            ) : (
                              <Link
                                href={`/cursos/${curso.id}`}
                                className="block font-bold text-[16px] text-[#111827] hover:text-[#1E40AF] transition-colors leading-snug mb-1 no-underline"
                              >
                                {curso.titulo}
                              </Link>
                            )}
                            <p className="font-normal text-[13px] text-[#4B5563] truncate mb-2">
                              {curso.descripcion}
                            </p>
                            <p className="font-medium text-[13px] text-[#6B7280]">
                              👥 {(curso._count?.inscripciones || 0).toLocaleString('es-CO')} ya
                              inscritos
                            </p>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          document
                            .getElementById('grid-section')
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="font-semibold text-[14px] text-[#1E40AF] hover:underline mt-2"
                      >
                        Ver todos los cursos →
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-[#6B7280]">
                      Aún no hay cursos publicados.
                    </div>
                  )}
                </div>

                {/* RIGHT SIDEBAR inside results */}
                <div className="w-full xl:w-[360px] flex-shrink-0">
                  {/* Qué hay de nuevo */}
                  <div className="mb-8">
                    <h3 className="font-bold text-[16px] text-[#111827] mb-4">
                      ¿Qué hay de nuevo?
                    </h3>
                    <div className="border border-[#F3F4F6] rounded-lg overflow-hidden">
                      <div className="h-[140px] bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center">
                        <div className="text-center text-white">
                          <p className="font-bold text-[18px] mb-1 flex items-center justify-center gap-1.5">
                            <Rocket size={18} className="stroke-[2.5]" /> Nuevos Cursos
                          </p>
                          <p className="font-normal text-[13px] text-blue-200">
                            Explora nuestras últimas adiciones
                          </p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-[14px] text-[#111827] mb-1">
                          Cursos actualizados 2026
                        </h4>
                        <p className="font-normal text-[13px] text-[#4B5563] mb-3">
                          Descubre contenido recién creado por instructores expertos en las áreas
                          más demandadas.
                        </p>
                        <button
                          onClick={() =>
                            document
                              .getElementById('grid-section')
                              ?.scrollIntoView({ behavior: 'smooth' })
                          }
                          className="font-semibold text-[14px] text-[#1E40AF] hover:underline"
                        >
                          Empezar gratis →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Links útiles */}
                  <div>
                    <h3 className="font-bold text-[16px] text-[#111827] mb-4">Links útiles</h3>
                    <div className="border border-[#F3F4F6] rounded-lg">
                      {LINKS_UTILES.map((link, idx) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          className={`flex items-center justify-between px-4 py-3 text-[#374151] hover:text-[#1E40AF] transition-colors group no-underline ${idx < LINKS_UTILES.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}
                        >
                          <span className="font-medium text-[14px]">{link.label}</span>
                          <ChevronRight
                            size={14}
                            className="text-[#9CA3AF] group-hover:text-[#1E40AF] group-hover:translate-x-0.5 transition-all"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'instituciones' && (
              <div>
                <div className="mb-6">
                  <p className="font-semibold text-[11px] text-[#1E40AF] uppercase tracking-wider mb-1">
                    NUESTROS ALIADOS ACADÉMICOS
                  </p>
                  <h3 className="font-bold text-[20px] text-[#111827]">
                    Instituciones y Fuentes Aliadas
                  </h3>
                  <p className="text-[14px] text-[#4B5563] mt-1">
                    Explora los perfiles institucionales de nuestros aliados y descubre los cursos oficiales que ofrecen de manera gratuita.
                  </p>
                </div>

                {loadingInstituciones ? (
                  <div className="flex flex-col items-center py-20">
                    <div className="w-12 h-12 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-[14px] text-[#6B7280]">Cargando instituciones...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {institucionesAliadas.map((inst) => (
                      <div
                        key={inst.id}
                        className="bg-white border border-[#E5E7EB] hover:border-indigo-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col p-6 group relative"
                      >
                        {/* Decorative background shape */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-indigo-100/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                        
                        <InstitutionLogo logoUrl={inst.logoUrl} nombre={inst.nombre} />

                        {/* Content */}
                        <h3 className="font-extrabold text-[18px] text-[#111827] mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                          {inst.nombre}
                        </h3>

                        <p className="text-[13px] text-[#4B5563] leading-relaxed line-clamp-3 mb-6">
                          {inst.descripcion || 'Plataforma educativa aliada que ofrece excelentes opciones de formación técnica y profesional.'}
                        </p>

                        {/* Counts and info */}
                        <div className="mt-auto flex items-center justify-between text-xs font-semibold text-[#6B7280] border-t border-[#F3F4F6] pt-4">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-[#E5E7EB]">
                            📚 {((inst._count?.cursos || 0) + (inst._count?.cursosExternos || 0))} cursos
                          </span>

                          <Link
                            href={`/instituciones/${inst.slug || inst.id}`}
                            className="inline-flex items-center gap-1 font-bold text-indigo-600 group-hover:text-indigo-800 transition-colors no-underline"
                          >
                            <span>Ver Perfil</span>
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════ GRID SECTION ════════════════════ */}
      <section
        id="grid-section"
        className="bg-white py-8 lg:py-12 px-6 lg:px-8 border-t border-[#F3F4F6]"
      >
        <div className="max-w-[1440px] mx-auto">
          <h2 className="font-bold text-[22px] text-[#111827] mb-6">
            Todos los cursos disponibles
          </h2>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Area */}
            <div className="relative">
              <select
                value={filterArea}
                onChange={(e) => {
                  setFilterArea(e.target.value);
                  setSidebarFilter(e.target.value === 'Todas' ? '' : e.target.value);
                }}
                className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
              >
                <option value="Todas">Área: Todas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
              />
            </div>

            {/* Nivel */}
            <div className="relative">
              <select
                value={filterNivel}
                onChange={(e) => setFilterNivel(e.target.value)}
                className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
              >
                <option value="Todos">Nivel: Todos</option>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
              />
            </div>

            {/* Institución */}
            {instituciones.length > 0 && (
              <div className="relative">
                <select
                  value={filterInstitucion}
                  onChange={(e) => setFilterInstitucion(e.target.value)}
                  className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer"
                >
                  <option value="Todas">Institución: Todas</option>
                  {instituciones.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
                />
              </div>
            )}

            {/* Tipo de Curso */}
            <div className="relative">
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="border border-[#D1D5DB] rounded h-10 pl-3 pr-8 text-[13px] outline-none appearance-none bg-white font-medium cursor-pointer focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
              >
                <option value="Todos">Origen: Todos</option>
                <option value="Plataforma">Plataforma (SaberHub)</option>
                <option value="Externos">Externos (Aliados)</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
              />
            </div>

            {/* View toggle */}
            <div className="ml-auto flex border border-[#D1D5DB] rounded overflow-hidden flex-shrink-0">
              <button
                className={`w-10 h-10 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-[#1E40AF] text-white' : 'bg-white text-[#4B5563]'}`}
                onClick={() => setViewMode('grid')}
                aria-label="Vista de cuadrícula"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={`w-10 h-10 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-[#1E40AF] text-white' : 'bg-white text-[#4B5563]'}`}
                onClick={() => setViewMode('list')}
                aria-label="Vista de lista"
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>

          {/* Grid / List */}
          {loading ? (
            <div className="flex flex-col items-center py-20">
              <div className="w-12 h-12 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[14px] text-[#6B7280]">Cargando cursos...</p>
            </div>
          ) : filteredCursos.length === 0 ? (
            <div className="bg-white border border-[#F3F4F6] rounded flex flex-col items-center py-16 px-6 text-center">
              <BookOpen size={48} className="text-[#D1D5DB] mb-4" />
              <h3 className="font-bold text-[18px] text-[#111827] mb-2">
                No se encontraron cursos
              </h3>
              <p className="text-[14px] text-[#6B7280]">
                Intenta ajustar los filtros o busca otro término.
              </p>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'flex flex-col gap-4'
                }
              >
                {filteredCursos.slice(0, visibleCount).map((curso) => {
                  const yaInscrito = inscripciones.includes(curso.id);
                  return (
                    <div
                      key={curso.id}
                      className={`bg-white border border-[#F3F4F6] rounded relative overflow-hidden transition-all hover:shadow-md flex ${viewMode === 'grid' ? 'flex-col w-full' : 'flex-row w-full h-[180px]'}`}
                    >
                      {/* Image */}
                      <div
                        className={`relative bg-gray-200 flex-shrink-0 ${viewMode === 'grid' ? 'w-full aspect-video' : 'w-[280px] h-full'}`}
                      >
                        {curso.imgPortada ? (
                          <img
                            src={curso.imgPortada}
                            alt={curso.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#E5E7EB] flex items-center justify-center text-[40px]">
                            📚
                          </div>
                        )}
                        {/* Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-[#1E40AF] text-white font-semibold text-[12px] px-3.5 py-1.5 rounded">
                            {curso.nivel ? curso.nivel.toUpperCase() : 'PRINCIPIANTE'}
                          </span>
                        </div>
                        {/* Play button */}
                        {curso.isExterno ? (
                          <a
                            href={curso.fuenteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[56px] h-[56px] rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                          >
                            <Play size={22} className="text-[#111827] ml-1" fill="#111827" />
                          </a>
                        ) : (
                          <Link
                            href={`/cursos/${curso.id}`}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[56px] h-[56px] rounded-full bg-white/90 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                          >
                            <Play size={22} className="text-[#111827] ml-1" fill="#111827" />
                          </Link>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1 relative bg-white">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px]">🏛</span>
                            <span className="font-medium text-[13px] text-[#374151] truncate">
                              {curso.isExterno ? (curso.fuenteNombre || curso.institucion?.nombre) : (curso.institucion?.nombre || 'SABERHUB')}
                            </span>
                          </div>
                          <button className="text-[#1E40AF] p-1 hover:bg-[#EFF6FF] rounded">
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={14} className="text-[#4B5563]" />
                            <span className="font-medium text-[13px] text-[#4B5563]">
                              Course · {curso.categoria?.nombre || 'General'}
                            </span>
                          </div>
                          {curso.isExterno && (
                            <span className="inline-flex items-center bg-[#EFF6FF] text-[#1E40AF] text-[10px] font-bold px-2 py-0.5 rounded border border-[#BFDBFE] uppercase">
                              Fuente: {curso.fuenteNombre || 'Externo'}
                            </span>
                          )}
                        </div>

                        {curso.isExterno ? (
                          <a href={curso.fuenteUrl} target="_blank" rel="noopener noreferrer" className="no-underline">
                            <h3 className="font-bold text-[16px] text-[#111827] leading-snug line-clamp-2 mb-1 hover:text-[#1E40AF] transition-colors">
                              {curso.titulo}
                            </h3>
                          </a>
                        ) : (
                          <Link href={`/cursos/${curso.id}`} className="no-underline">
                            <h3 className="font-bold text-[16px] text-[#111827] leading-snug line-clamp-2 mb-1 hover:text-[#1E40AF] transition-colors">
                              {curso.titulo}
                            </h3>
                          </Link>
                        )}
                        
                        <p
                          className={`font-normal text-[14px] text-[#4B5563] leading-relaxed mb-3 ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}
                        >
                          {curso.descripcion}
                        </p>

                        {curso.isExterno ? (
                          <div className="mt-auto flex items-center justify-between text-[12px] text-[#6B7280]">
                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                              🟢 Acceso Externo
                            </span>
                            {curso.duracionHoras && (
                              <span>⏱ {curso.duracionHoras}h</span>
                            )}
                          </div>
                        ) : (
                          <div className="mt-auto flex items-center gap-4 text-[12px] text-[#6B7280]">
                            <span className="flex items-center gap-1">
                              📦 {curso._count?.modulos || 0} módulos
                            </span>
                            <span className="flex items-center gap-1">
                              👥 {(curso._count?.inscripciones || 0).toLocaleString('es-CO')}
                            </span>
                          </div>
                        )}

                        {/* Blue bottom border (OBLIGATORY) */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1E40AF]" />
                      </div>
                    </div>
                  );
                })}
              </div>
              {filteredCursos.length > visibleCount && (
                <div className="flex justify-center mt-10 w-full">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="bg-[#1E40AF] hover:bg-[#1A368F] text-white font-bold text-[14px] px-8 py-3.5 rounded-lg shadow hover:shadow-md transition-all cursor-pointer"
                  >
                    Ver más cursos ({filteredCursos.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="bg-[#171717] px-8 py-12 mt-0 w-full">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-12">
            <div className="font-bold text-[16px] text-white flex-shrink-0">SABERHUB</div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-[14px] text-white mb-2">Catálogo de aprendizaje</h4>
                <Link
                  href="/catalogo"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors no-underline"
                >
                  Explorar cursos
                </Link>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Instituciones
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Rutas de formación
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-[14px] text-white mb-2">Enseñar con nosotros</h4>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Cómo funciona
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Recursos para instructores
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Comunidad
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-[14px] text-white mb-2">Soporte</h4>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Centro de ayuda
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Contacto
                </a>
                <a
                  href="#"
                  className="font-normal text-[13px] text-[#9CA3AF] hover:text-white transition-colors"
                >
                  Acerca de SABERHUB
                </a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <YoutubeIcon />
              </button>
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <FacebookIcon />
              </button>
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <InstagramIcon />
              </button>
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <LinkedinIcon />
              </button>
              <button className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center text-white hover:bg-[#6B7280] transition-colors">
                <TwitterIcon />
              </button>
            </div>
          </div>
          <div className="w-full h-px bg-[#4B5563] mb-6" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-normal text-[12px] text-[#9CA3AF]">
              © 2026 SABERHUB. Todos los derechos reservados.
            </span>
            <div className="flex flex-wrap justify-center gap-2 text-[12px] text-[#D1D5DB]">
              <a href="#" className="hover:text-white transition-colors">
                Términos
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Privacidad
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Cookies
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Protección de datos
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Marcas
              </a>
              <span className="text-[#4B5563]">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Accesibilidad
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-lg shadow-lg text-white text-[14px] font-semibold transition-all ${
            toast.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#10B981]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE INSCRIPCIÓN */}
      {enrollModal.showConfirm && (
        <div className="fixed inset-0 bg-[#000000]/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1E40AF] flex items-center justify-center mb-4 flex-shrink-0">
              <BookOpen size={28} />
            </div>
            
            <h3 className="font-bold text-[20px] text-slate-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Confirmar Inscripción
            </h3>
            
            <p className="font-normal text-[14px] text-slate-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas inscribirte en el curso <strong className="text-slate-950">"{enrollModal.titulo}"</strong>? Tendrás acceso completo e inmediato a todo el material de estudio de forma gratuita.
            </p>

            {enrollModal.errorMsg && (
              <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-[13px] font-medium mb-4 text-left">
                ⚠️ {enrollModal.errorMsg}
              </div>
            )}

            <div className="flex gap-3 w-full">
              <button
                type="button"
                disabled={enrollModal.loading}
                onClick={() => setEnrollModal(prev => ({ ...prev, showConfirm: false }))}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-[14px] transition-colors cursor-pointer outline-none disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enrollModal.loading}
                onClick={confirmInscripcion}
                className="flex-1 py-3 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-xl font-semibold text-[14px] transition-colors cursor-pointer outline-none shadow-lg shadow-blue-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enrollModal.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Inscribiendo...</span>
                  </>
                ) : (
                  <span>Sí, inscribirme</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO DE INSCRIPCIÓN */}
      {enrollModal.showSuccess && (
        <div className="fixed inset-0 bg-[#000000]/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 flex-shrink-0 animate-bounce">
              <Check size={28} />
            </div>
            
            <h3 className="font-bold text-[20px] text-slate-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {enrollModal.errorMsg ? 'Ya estás inscrito' : '¡Inscripción Exitosa!'}
            </h3>
            
            <p className="font-normal text-[14px] text-slate-600 mb-6 leading-relaxed">
              {enrollModal.errorMsg 
                ? 'Ya cuentas con acceso a este curso. Te estamos redirigiendo a tu panel de aprendizaje...'
                : `Te has inscrito correctamente en "${enrollModal.titulo}". Te estamos redirigiendo a tu panel de aprendizaje...`
              }
            </p>

            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-[14px] transition-colors cursor-pointer outline-none shadow-lg shadow-emerald-500/10 mb-4 flex items-center justify-center gap-2"
            >
              <span>Ir a mi Dashboard</span>
              <ChevronRight size={16} />
            </button>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all ease-linear animate-enroll-progress" />
            </div>
          </div>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes enrollProgress {
              from { width: 0%; }
              to { width: 100%; }
            }
            .animate-enroll-progress {
              animation: enrollProgress 2.5s linear forwards;
            }
          `}} />
        </div>
      )}
    </div>
  );
}
