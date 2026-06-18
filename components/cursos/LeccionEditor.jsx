'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  X,
  Film,
  FileText,
  Paperclip,
  Layers,
  Play,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Image as ImageIcon,
  Code,
  Table,
  Undo2,
  Redo2,
  Upload,
  Clock,
  Settings,
  Volume2,
  Maximize2,
  Globe,
  Bell,
  ExternalLink,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Indent,
  Outdent,
} from 'lucide-react';
import EmojiIcon from '@/components/common/EmojiIcon';

/* ══════════════════════════════════════════════════════════
   CONSTANTS & INITIAL DATA
   ══════════════════════════════════════════════════════════ */
const LESSON_TYPES = [
  { id: 'video', label: 'Video', icon: Film, color: '#1E40AF', emoji: '🎬' },
  { id: 'texto', label: 'Texto', icon: FileText, color: '#6B7280', emoji: '📄' },
  { id: 'documento', label: 'Documento', icon: Paperclip, color: '#F59E0B', emoji: '📎' },
  { id: 'mixto', label: 'Mixto', icon: Layers, color: '#10B981', emoji: '🧩' },
];

const INITIAL_CHAPTERS = [
  { time: '00:00', title: 'Introducción' },
  { time: '01:30', title: 'Historia de Python' },
  { time: '04:15', title: 'Casos de uso' },
  { time: '06:50', title: 'Conclusión' },
];

const INITIAL_SUBTITLES = [
  { lang: '🇪🇸', name: 'Español (Colombia)', file: 'subtitulos-es.vtt', method: 'Manual' },
  { lang: '🇺🇸', name: 'English', file: 'subtitulos-en.vtt', method: 'Auto' },
];

const INITIAL_MIXED_BLOCKS = [
  { id: 1, type: 'video', icon: '🎬', title: 'Introducción a Python', duration: '8 min' },
  { id: 2, type: 'texto', icon: '📄', title: 'Lectura: Historia de Python', duration: '5 min' },
  { id: 3, type: 'documento', icon: '📎', title: 'Guía PDF descargable', duration: null },
  {
    id: 4,
    type: 'quiz',
    icon: '💡',
    title: 'Verifica tu comprensión (3 preguntas)',
    duration: null,
  },
];

const ADD_BLOCK_OPTIONS = [
  { icon: '🎬', label: 'Video' },
  { icon: '📄', label: 'Texto' },
  { icon: '📎', label: 'Documento' },
  { icon: '🎵', label: 'Audio' },
  { icon: '🖼', label: 'Imagen' },
  { icon: '💡', label: 'Quiz rápido' },
  { icon: '📝', label: 'Tarea/ejercicio' },
];

const INITIAL_ATTACHED_RESOURCES = [
  { id: 1, icon: '📄', name: 'ejercicios-leccion-1.pdf', size: '1.2 MB', type: 'pdf' },
  {
    id: 2,
    icon: '🔗',
    name: 'Repositorio en GitHub',
    size: 'https://github.com/...',
    type: 'link',
  },
  { id: 3, icon: '🖼', name: 'diagrama-python.png', size: '340 KB', type: 'image' },
];

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function LeccionEditor({ usuario }) {
  // --- STATE FOR SPECIAL SIMULATIONS ---
  const [simulationOpen, setSimulationOpen] = useState(true);
  const [simError, setSimError] = useState(false);
  const [simNoContent, setSimNoContent] = useState(false);
  const [changesSaved, setChangesSaved] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // --- GENERAL LESSON SETTINGS ---
  const [title, setTitle] = useState('¿Qué es Python y por qué aprenderlo?');
  const [lessonType, setLessonType] = useState('video');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [duration, setDuration] = useState('8 min');
  const [durationEditing, setDurationEditing] = useState(false);

  // --- HEADER STATES ---
  const [exploreOpen, setExploreOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [activeSearchRole, setActiveSearchRole] = useState('Instructor');
  const [profileOpen, setProfileOpen] = useState(false);

  // --- VARIANTE A (VIDEO) STATES ---
  const [videoTab, setVideoTab] = useState('subir');
  const [hasVideo, setHasVideo] = useState(true);
  const [chapters, setChapters] = useState(INITIAL_CHAPTERS);
  const [newChapterTime, setNewChapterTime] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [subtitles, setSubtitles] = useState(INITIAL_SUBTITLES);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [thumbnailSelected, setThumbnailSelected] = useState(1);

  // --- VARIANTE B (TEXTO) STATES ---
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const textEditorRef = useRef(null);

  // --- VARIANTE C (DOCUMENTO) STATES ---
  const [hasDocument, setHasDocument] = useState(true);
  const [watermarkOn, setWatermarkOn] = useState(false);
  const [watermarkText, setWatermarkText] = useState('SABERHUB - {nombre_alumno}');
  const [complementaryDocs, setComplementaryDocs] = useState([
    { id: 1, icon: '📄', name: 'resumen-python.pdf', size: '890 KB' },
    { id: 2, icon: '📊', name: 'ejercicios-practicos.xlsx', size: '1.1 MB' },
  ]);

  // --- VARIANTE D (MIXTO) STATES ---
  const [mixedBlocks, setMixedBlocks] = useState(INITIAL_MIXED_BLOCKS);
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);

  // --- SECONDARY CONFIG STATES ---
  const [attachedResources, setAttachedResources] = useState(INITIAL_ATTACHED_RESOURCES);
  const [instructorNotes, setInstructorNotes] = useState(
    'Recordar mencionar la comunidad de Python Colombia. Incluir referencia al PEP 8.'
  );
  const [lessonDesc, setLessonDesc] = useState(
    'En esta lección explorarás qué es Python, su historia y las razones por las que se ha convertido en uno de los lenguajes más populares del mundo.'
  );

  // --- ADVANCED CONFIG STATES ---
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advDuration, setAdvDuration] = useState(8);
  const [advUnit, setAdvUnit] = useState('minutos');
  const [advPoints, setAdvPoints] = useState(10);
  const [allowComments, setAllowComments] = useState(true);
  const [notifyInstructor, setNotifyInstructor] = useState(false);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [tags, setTags] = useState(['python', 'introducción', 'fundamentos']);
  const [newTag, setNewTag] = useState('');

  // --- TITLE VALIDATION ---
  const isTitleEmpty = title.trim() === '';

  // Set changesSaved = false whenever relevant edits are made
  const trackEdit = () => {
    setChangesSaved(false);
  };

  // Trigger auto-save simulation
  useEffect(() => {
    if (!changesSaved && !simError) {
      const timer = setTimeout(() => {
        // Auto-save finishes after 1.5 seconds
        setChangesSaved(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [changesSaved, simError]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    trackEdit();
  };

  // --- ACTION HANDLERS ---
  const addChapter = () => {
    if (newChapterTime && newChapterTitle) {
      setChapters([...chapters, { time: newChapterTime, title: newChapterTitle }]);
      setNewChapterTime('');
      setNewChapterTitle('');
      setShowChapterForm(false);
      trackEdit();
    }
  };

  const deleteChapter = (index) => {
    setChapters(chapters.filter((_, i) => i !== index));
    trackEdit();
  };

  const addSubtitle = (lang, name, file, method) => {
    setSubtitles([...subtitles, { lang, name, file, method }]);
    setShowSubDropdown(false);
    trackEdit();
  };

  const deleteSubtitle = (index) => {
    setSubtitles(subtitles.filter((_, i) => i !== index));
    trackEdit();
  };

  const deleteCompDoc = (id) => {
    setComplementaryDocs(complementaryDocs.filter((d) => d.id !== id));
    trackEdit();
  };

  const addCompDoc = () => {
    const newDoc = {
      id: Date.now(),
      icon: '📎',
      name: `documento-extra-${complementaryDocs.length + 1}.pdf`,
      size: '1.4 MB',
    };
    setComplementaryDocs([...complementaryDocs, newDoc]);
    trackEdit();
  };

  const moveMixedBlock = (index, direction) => {
    const newBlocks = [...mixedBlocks];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newBlocks.length) {
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[targetIndex];
      newBlocks[targetIndex] = temp;
      setMixedBlocks(newBlocks);
      trackEdit();
    }
  };

  const deleteMixedBlock = (id) => {
    setMixedBlocks(mixedBlocks.filter((b) => b.id !== id));
    trackEdit();
  };

  const addMixedBlock = (typeOption) => {
    const emojiMap = {
      Video: '🎬',
      Texto: '📄',
      Documento: '📎',
      Audio: '🎵',
      Imagen: '🖼',
      'Quiz rápido': '💡',
      'Tarea/ejercicio': '📝',
    };
    const typeMap = {
      Video: 'video',
      Texto: 'texto',
      Documento: 'documento',
      Audio: 'audio',
      Imagen: 'imagen',
      'Quiz rápido': 'quiz',
      'Tarea/ejercicio': 'tarea',
    };
    const newB = {
      id: Date.now(),
      type: typeMap[typeOption.label] || 'texto',
      icon: typeOption.icon || '📄',
      title: `${typeOption.label} adicional`,
      duration:
        typeOption.label === 'Video' ? '5 min' : typeOption.label === 'Texto' ? '3 min' : null,
    };
    setMixedBlocks([...mixedBlocks, newB]);
    setShowAddBlockMenu(false);
    trackEdit();
  };

  const deleteAttachedResource = (id) => {
    setAttachedResources(attachedResources.filter((r) => r.id !== id));
    trackEdit();
  };

  const addAttachedFile = () => {
    const newRes = {
      id: Date.now(),
      icon: '📄',
      name: `guia-adicional-l${attachedResources.length + 1}.pdf`,
      size: '1.8 MB',
      type: 'pdf',
    };
    setAttachedResources([...attachedResources, newRes]);
    trackEdit();
  };

  const addAttachedLink = () => {
    const newRes = {
      id: Date.now(),
      icon: '🔗',
      name: 'Enlace web de apoyo externo',
      size: 'https://saberhub.co/recursos',
      type: 'link',
    };
    setAttachedResources([...attachedResources, newRes]);
    trackEdit();
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && newTag.trim() !== '') {
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
        setNewTag('');
        trackEdit();
      }
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
    trackEdit();
  };

  // --- TEXT WRITING INTERACTIVE MOCKUP (NOTION SLASHER) ---
  const handleTextKeyDown = (e) => {
    if (e.key === '/') {
      setSlashMenuOpen(true);
      setSlashQuery('');
    } else if (e.key === 'Escape') {
      setSlashMenuOpen(false);
    }
  };

  const insertBlock = (type) => {
    setSlashMenuOpen(false);
    alert(`Ejemplo de simulación: Bloque tipo [${type}] insertado en el editor Notion-Style.`);
  };

  // --- EXIT CONTEXT ---
  const triggerExitRequest = (e) => {
    if (e) e.preventDefault();
    if (!changesSaved) {
      setShowExitConfirm(true);
    } else {
      window.location.href = '/CrearCursos/modulos';
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F9FAFB] flex flex-col antialiased select-none"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* =========================================================================
          STATE SIMULATOR FLOATING BAR
          ========================================================================= */}
      {simulationOpen && (
        <div className="bg-[#1E293B] text-white py-2 px-6 flex items-center justify-between text-[12px] z-50 border-b border-slate-700 select-none">
          <div className="flex items-center gap-3">
            <span className="bg-[#1E40AF] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white">
              SIMULADOR DE ESTADOS
            </span>
            <span className="text-slate-400">
              Prueba los estados especiales requeridos en el prompt:
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={simError}
                onChange={(e) => {
                  setSimError(e.target.checked);
                  if (e.target.checked) setChangesSaved(false);
                }}
                className="rounded text-[#1E40AF] focus:ring-0"
              />
              <span className={`flex items-center gap-1.5 ${simError ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                <EmojiIcon emoji="🔴" size={10} /> Error de Conexión
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={simNoContent}
                onChange={(e) => setSimNoContent(e.target.checked)}
                className="rounded text-[#1E40AF] focus:ring-0"
              />
              <span className={simNoContent ? 'text-yellow-400 font-semibold' : 'text-slate-300'}>
                🟡 Sin Contenido
              </span>
            </label>

            <button
              onClick={() => {
                setTitle('');
                trackEdit();
              }}
              className="bg-red-900/50 border border-red-700/50 text-red-200 px-2 py-0.5 rounded hover:bg-red-950 transition-colors"
            >
              Vaciar Título (Validar)
            </button>

            <button
              onClick={() => setSimulationOpen(false)}
              className="text-slate-400 hover:text-white ml-2 text-[14px]"
              title="Ocultar Simulador"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Button to reopen simulation if closed */}
      {!simulationOpen && (
        <button
          onClick={() => setSimulationOpen(true)}
          className="fixed top-24 right-4 z-50 bg-[#1E293B] text-white border border-slate-700 p-2 rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center"
          title="Abrir Simulador de Estados"
        >
          <RefreshCw size={14} className="text-[#38BDF8]" />
        </button>
      )}

      {/* =========================================================================
          HEADER SUPERIOR (Idéntico a Cisco / SABERHUB)
          ========================================================================= */}
      <header className="sticky top-0 z-40 h-[80px] bg-white border-b border-[#E5E7EB] flex items-center justify-between w-full px-6 lg:px-8 flex-shrink-0">
        {/* Left Section: Logo & Explore */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex flex-col cursor-pointer no-underline group select-none"
          >
            <span className="font-bold text-[16px] leading-tight text-[#111827] tracking-tight group-hover:text-[#1E40AF] transition-colors">
              SABERHUB
            </span>
            <span className="font-normal text-[11px] leading-tight text-[#6B7280]">
              Learning Platform
            </span>
          </Link>

          <div className="relative">
            <button
              onClick={() => {
                setExploreOpen(!exploreOpen);
                setProfileOpen(false);
                setShowSearchDropdown(false);
              }}
              className="hidden md:flex items-center bg-white border border-[#E5E7EB] px-4 py-[10px] rounded-[4px] h-[44px] hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <span className="text-[#1E40AF] font-semibold text-[16px] mr-2">⊞</span>
              <span className="font-semibold text-[13px] text-[#111827]">Explore</span>
              <ChevronDown size={14} className="text-[#4B5563] ml-1.5" />
            </button>
            {exploreOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-[#E5E7EB] rounded-[4px] shadow-lg py-1.5 z-50">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-blue-50 transition-colors"
                >
                  <Layers size={13} className="text-[#1E40AF]" />
                  <span>Mi Aprendizaje</span>
                </Link>
                <Link
                  href="/CrearCursos"
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-blue-50 transition-colors"
                >
                  <Plus size={13} className="text-[#1E40AF]" />
                  <span>Crear Curso</span>
                </Link>
                <Link
                  href="/catalogo"
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#374151] hover:bg-blue-50 transition-colors"
                >
                  <FolderOpen size={13} className="text-[#1E40AF]" />
                  <span>Catálogo de Cursos</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Búsqueda central con selector */}
        <div className="hidden lg:flex flex-grow max-w-[480px] mx-8 h-[44px] bg-white border border-[#E5E7EB] rounded-[4px] overflow-hidden items-center focus-within:border-[#1E40AF] transition-colors">
          <div className="flex items-center pl-4 pr-2">
            <Search size={16} className="text-[#9CA3AF]" />
          </div>
          <input
            type="text"
            placeholder="Buscar lecciones, recursos, cursos..."
            className="flex-grow h-full outline-none font-normal text-[13px] text-[#111827] placeholder-[#9CA3AF] bg-transparent"
          />
          <div className="relative h-full">
            <button
              onClick={() => {
                setShowSearchDropdown(!showSearchDropdown);
                setExploreOpen(false);
                setProfileOpen(false);
              }}
              className="h-full border-l border-[#E5E7EB] flex items-center px-4 cursor-pointer hover:bg-gray-50 transition-colors gap-1 text-[12px] font-semibold text-[#4B5563]"
            >
              <span>{activeSearchRole}</span>
              <ChevronDown size={12} />
            </button>
            {showSearchDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-[#E5E7EB] rounded-[4px] shadow-lg py-1 z-50">
                {['Instructor', 'Estudiante', 'Admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setActiveSearchRole(role);
                      setShowSearchDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[12px] font-medium transition-colors ${
                      activeSearchRole === role
                        ? 'bg-[#EFF6FF] text-[#1E40AF]'
                        : 'text-[#374151] hover:bg-gray-50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Acciones derecha */}
        <div className="flex items-center gap-5 h-full">
          {/* My Learning con línea azul inferior (activo) */}
          <Link
            href="/dashboard"
            className="hidden md:flex items-center h-[80px] relative px-1 font-semibold text-[13px] text-[#1E40AF] no-underline group"
          >
            <span>My Learning</span>
            <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-[#1E40AF] rounded-t" />
          </Link>

          <div className="hidden md:flex items-center cursor-pointer text-[#4B5563] hover:text-[#111827] transition-colors gap-1">
            <Globe size={16} />
            <span className="font-semibold text-[12px]">ES</span>
          </div>

          <div className="hidden md:flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-[#4B5563] text-[#4B5563] cursor-pointer hover:text-[#111827] hover:border-[#111827] transition-colors">
            <span className="text-[10px] font-bold">?</span>
          </div>

          <div className="relative cursor-pointer hover:text-[#111827] transition-colors">
            <Bell size={18} className="text-[#4B5563]" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#1E40AF] rounded-full border border-white"></div>
          </div>

          {/* Avatar + Jhonatan / Instructor */}
          <div
            onClick={() => {
              setProfileOpen(!profileOpen);
              setExploreOpen(false);
              setShowSearchDropdown(false);
            }}
            className="flex items-center gap-2 cursor-pointer group relative"
          >
            <div className="w-[36px] h-[36px] rounded-full bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#1E40AF] font-bold text-[14px] overflow-hidden flex-shrink-0">
              J
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-semibold text-[12px] text-[#111827] group-hover:text-[#1E40AF] transition-colors">
                Jhonatan
              </span>
              <span className="font-normal text-[10px] text-[#6B7280] leading-none">
                Instructor
              </span>
            </div>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E5E7EB] rounded-[4px] shadow-lg py-1.5 z-50">
                <div className="px-4 py-2 border-b border-gray-100 flex flex-col">
                  <span className="font-bold text-[12px] text-[#111827]">Jhonatan Castro</span>
                  <span className="text-[10px] text-[#6B7280]">jhonatan@saberhub.co</span>
                </div>
                <button
                  onClick={triggerExitRequest}
                  className="w-full text-left px-4 py-2.5 text-[12px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                >
                  <span>Volver al curso</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          HEADER STICKY DE LA LECCIÓN (Fondo blanco, padding 16px 32px, borde #F3F4F6)
          ========================================================================= */}
      <div className="sticky top-[80px] z-30 bg-white border-b border-[#F3F4F6] px-8 py-4 flex items-center justify-between flex-shrink-0 select-none shadow-sm">
        {/* Left Side */}
        <div className="w-1/4 flex justify-start">
          <button
            onClick={triggerExitRequest}
            className="flex items-center gap-1.5 text-[14px] text-[#6B7280] hover:text-[#111827] font-medium transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver al curso</span>
          </button>
        </div>

        {/* Center: Navigation */}
        <div className="w-2/4 flex items-center justify-center gap-4">
          <button
            className="flex items-center gap-1.5 text-[13px] text-[#9CA3AF] font-medium cursor-not-allowed"
            disabled
          >
            <ArrowLeft size={13} />
            <span>Lección anterior</span>
          </button>

          <span
            className="text-[14px] font-semibold text-[#111827] max-w-[280px] truncate text-center"
            title={title}
          >
            {isTitleEmpty ? <span className="text-red-400 italic">Sin título</span> : title}
          </span>

          <button
            className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] font-medium transition-colors"
            onClick={() => alert('Simulación: Navegando a la lección siguiente.')}
          >
            <span>Lección siguiente</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Right Side: Primary/Secondary Buttons */}
        <div className="w-1/4 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={() => alert('Simulación: Abriendo vista previa en modo alumno.')}
            className="flex items-center gap-2 border border-[#D1D5DB] bg-white px-[16px] py-[10px] rounded-[4px] text-[13px] font-semibold text-[#374151] hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Eye size={14} className="text-[#6B7280]" />
            <span>Vista previa como alumno</span>
          </button>

          <button
            onClick={() => {
              setChangesSaved(true);
              alert('Borrador guardado exitosamente.');
            }}
            className="border border-[#D1D5DB] bg-white px-4 py-[10px] rounded-[4px] text-[13px] font-semibold text-[#374151] hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            Guardar borrador
          </button>

          <button
            onClick={() => {
              if (isTitleEmpty) {
                alert('Error: El título es obligatorio para publicar.');
                return;
              }
              setChangesSaved(true);
              alert('¡Cambios publicados exitosamente en SABERHUB!');
            }}
            className="bg-[#1E40AF] hover:bg-[#152e80] text-white px-5 py-[10px] rounded-[4px] text-[13px] font-bold transition-colors"
          >
            Publicar cambios
          </button>
        </div>
      </div>

      {/* =========================================================================
          ERROR / WARNING BANNERS (Simulated States)
          ========================================================================= */}
      {simError && (
        <div className="bg-red-50 border-b border-red-200 px-8 py-3 flex items-center justify-between text-red-800 z-20">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            <span className="text-[13px] font-medium">
              No se pudieron guardar los cambios. Verifica tu conexión.
            </span>
          </div>
          <button
            onClick={() => {
              setSimError(false);
              setChangesSaved(true);
            }}
            className="bg-white border border-red-300 hover:bg-red-100 text-red-800 font-semibold px-3 py-1 rounded-[4px] text-[11px] transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {simNoContent && (
        <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 flex items-center gap-2.5 text-amber-800 z-20">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <span className="text-[13px] font-medium">
            Esta lección no tiene contenido aún. Los alumnos no podrán acceder hasta agregarlo.
          </span>
        </div>
      )}

      {/* =========================================================================
          CUERPO DE LA PÁGINA (Fondo #F9FAFB, padding 32px)
          ========================================================================= */}
      <main className="flex-grow max-w-[960px] w-full mx-auto px-6 py-8 flex flex-col gap-8">
        {/* ─────────────────────────────────────────────────────────────────────────
            ZONA 1: Encabezado de la lección
            ───────────────────────────────────────────────────────────────────────── */}
        <section
          className="bg-white border border-[#E5E7EB] rounded-[4px] p-6 shadow-sm flex flex-col gap-4 select-none relative"
          style={{ borderBottom: '2px solid #1E40AF' }}
        >
          <div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
              MÓDULO 1: INTRODUCCIÓN A PYTHON · LECCIÓN 1.1
            </p>

            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Título de la lección"
                className={`w-full text-[32px] font-bold text-[#111827] bg-transparent outline-none pb-1.5 transition-all border-b-2 ${
                  isTitleEmpty
                    ? 'border-red-500 hover:border-red-600 focus:border-red-600'
                    : 'border-transparent hover:border-gray-200 focus:border-[#1E40AF]'
                }`}
              />
              {isTitleEmpty && (
                <div className="text-red-500 text-[12px] font-semibold mt-1.5 flex items-center gap-1 animate-pulse">
                  <AlertCircle size={13} />
                  <span>El título es obligatorio</span>
                </div>
              )}
            </div>

            {/* Chips y Toggles Fila */}
            <div className="flex items-center gap-5 mt-5 flex-wrap">


              {/* Toggle: Marcar como preview */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div
                  onClick={() => {
                    setIsPreview(!isPreview);
                    trackEdit();
                  }}
                  className={`relative w-10 h-[22px] rounded-full transition-all flex-shrink-0 ${
                    isPreview ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                      isPreview ? 'left-[21px]' : 'left-[3px]'
                    }`}
                  />
                </div>
                <span className="text-[13px] font-semibold text-[#4B5563] group-hover:text-[#111827] transition-colors">
                  {isPreview ? 'Vista previa gratuita' : 'Marcar como preview'}
                </span>
              </label>

              {/* Toggle: Obligatoria para continuar */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div
                  onClick={() => {
                    setIsRequired(!isRequired);
                    trackEdit();
                  }}
                  className={`relative w-10 h-[22px] rounded-full transition-all flex-shrink-0 ${
                    isRequired ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                      isRequired ? 'left-[21px]' : 'left-[3px]'
                    }`}
                  />
                </div>
                <span className="text-[13px] font-semibold text-[#4B5563] group-hover:text-[#111827] transition-colors">
                  Obligatoria para continuar
                </span>
              </label>

              {/* Badge de Duración editable */}
              <div className="flex items-center">
                {durationEditing ? (
                  <input
                    type="text"
                    value={duration}
                    autoFocus
                    onChange={(e) => setDuration(e.target.value)}
                    onBlur={() => setDurationEditing(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setDurationEditing(false);
                      trackEdit();
                    }}
                    className="border border-[#1E40AF] px-2 py-0.5 rounded-[4px] text-[12px] font-semibold text-[#4B5563] w-24 outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setDurationEditing(true)}
                    className="bg-[#F3F4F6] text-[#4B5563] font-semibold text-[12px] px-3 py-1 rounded-[4px] hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                    title="Haz clic para editar la duración"
                  >
                    <Clock size={12} />
                    <span>Duración: {duration}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────────
            ZONA 2: Contenido de la Lección (Video y Texto)
            ───────────────────────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-10">
          {/* Sección de Video */}
          <div
            id="seccion-video"
            className="bg-white border border-[#E5E7EB] rounded-[4px] p-8 relative flex flex-col gap-6"
            style={{ borderBottom: '2px solid #1E40AF' }}
          >
            <h3 className="font-bold text-[18px] text-[#111827] flex items-center gap-2 select-none">
              <EmojiIcon emoji="🎬" size={18} /> Video de la lección (Opcional)
            </h3>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#F3F4F6]">
              {[
                { id: 'subir', label: 'Subir archivo' },
                { id: 'url', label: 'URL externa (YouTube/Vimeo)' },
                { id: 'live', label: 'Grabación en vivo' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVideoTab(tab.id)}
                  className={`pb-3 text-[14px] font-semibold transition-all relative ${
                    videoTab === tab.id ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {videoTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1E40AF] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Subir archivo */}
            {videoTab === 'subir' && (
              <div className="flex flex-col gap-6">
                {hasVideo ? (
                  <div className="flex flex-col gap-4">
                    {/* Fake Reproductor */}
                    <div className="w-full aspect-video bg-[#111827] rounded-[4px] relative overflow-hidden group">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer shadow-lg transform hover:scale-105">
                          <Play size={24} className="text-white ml-1" fill="white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2">
                        <div className="h-1 bg-white/25 rounded-full cursor-pointer relative group/timeline">
                          <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-[#1E40AF] rounded-full relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/timeline:scale-100 transition-all" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-white text-[12px] select-none">
                          <div className="flex items-center gap-3">
                            <Play size={13} fill="white" className="cursor-pointer" />
                            <span className="font-medium text-[11px]">04:23 / 08:23</span>
                            <Volume2 size={13} className="cursor-pointer" />
                          </div>
                          <div className="flex items-center gap-3 font-semibold">
                            <span className="cursor-pointer hover:text-blue-300">1x</span>
                            <span className="cursor-pointer hover:text-blue-300">1080p</span>
                            <Maximize2 size={13} className="cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <Film size={18} className="text-[#1E40AF]" />
                        <div>
                          <p className="text-[13px] font-bold text-[#111827]">intro-python.mp4</p>
                          <p className="text-[11.5px] text-[#6B7280]">8.2 MB · MP4 · 1080p</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert('Simulación: Seleccionar otro video')}
                          className="px-3.5 h-8 bg-white border border-[#D1D5DB] rounded-[4px] text-[12px] font-bold text-[#374151] hover:bg-gray-50 transition-colors"
                        >
                          Cambiar video
                        </button>
                        <button
                          onClick={() => {
                            setHasVideo(false);
                            trackEdit();
                          }}
                          className="px-3.5 h-8 bg-red-50 border border-red-200 rounded-[4px] text-[12px] font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setHasVideo(true);
                      trackEdit();
                    }}
                    className="w-full aspect-video bg-[#F9FAFB] border-2 border-dashed border-[#D1D5DB] rounded-[4px] flex flex-col items-center justify-center gap-3 hover:border-[#1E40AF] hover:bg-[#EFF6FF] transition-all cursor-pointer select-none"
                  >
                    <Film size={48} className="text-[#9CA3AF]" />
                    <div className="text-center">
                      <p className="font-semibold text-[14.5px] text-[#4B5563]">
                        Arrastra un archivo de video aquí
                      </p>
                      <p className="text-[13px] text-[#1E40AF] font-bold mt-1 hover:underline">
                        o haz clic para buscar en tu equipo
                      </p>
                    </div>
                    <p className="text-[12px] text-[#9CA3AF]">
                      MP4, WEBM, MOV · Hasta 500 MB · Recomendado 16:9
                    </p>
                  </button>
                )}
              </div>
            )}

            {/* TAB CONTENT: URL Externa */}
            {videoTab === 'url' && (
              <div className="text-left flex flex-col gap-2">
                <label className="block text-[13px] font-bold text-[#4B5563]">URL del video</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  onChange={trackEdit}
                  className="w-full h-11 px-4 border border-[#D1D5DB] rounded-[4px] text-[13.5px] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all"
                />
                <p className="text-[12px] text-[#6B7280]">
                  Compatible con YouTube, Vimeo, o cualquier enlace directo a archivo .mp4 / .webm.
                </p>
              </div>
            )}

            {/* TAB CONTENT: Grabación en vivo */}
            {videoTab === 'live' && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                  <Film size={20} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[14px] text-[#374151]">
                    Grabación en vivo próximamente
                  </p>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">
                    Estamos integrando la grabación nativa de cámara y pantalla directamente en el navegador.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sección de Texto */}
          <div
            id="seccion-texto"
            className="bg-white border border-[#E5E7EB] rounded-[4px] overflow-hidden relative flex flex-col"
            style={{ borderBottom: '2px solid #1E40AF' }}
          >
            <div className="p-8 pb-3 text-left select-none">
              <h3 className="font-bold text-[18px] text-[#111827] flex items-center gap-2">
                <EmojiIcon emoji="📄" size={18} /> Contenido de la lección
              </h3>
            </div>

            {/* Notion/Medium Style Sticky Rich Text Toolbar */}
            <div className="flex items-center gap-0.5 px-4 py-2 bg-[#FAFAFA] border-b border-[#F3F4F6] flex-wrap min-h-[48px] sticky top-[138px] z-10 select-none">
              <div className="flex items-center">
                <select
                  className="h-7 w-24 px-1.5 text-[12px] font-semibold text-[#374151] border border-[#E5E7EB] rounded-[4px] bg-white outline-none focus:border-[#1E40AF] cursor-pointer"
                  onChange={(e) => {
                    alert(`Simulación: Bloque cambiado a ${e.target.value}`);
                    trackEdit();
                  }}
                >
                  <option>Texto</option>
                  <option>H1</option>
                  <option>H2</option>
                  <option>H3</option>
                  <option>Lista</option>
                  <option>Cita</option>
                  <option>Código</option>
                  <option>Separador</option>
                </select>
              </div>

              <div className="w-px h-5 bg-[#E5E7EB] mx-2 flex-shrink-0" />

              <div className="flex items-center">
                {[
                  { icon: Bold, label: 'Negrita' },
                  { icon: Italic, label: 'Cursiva' },
                  { icon: Underline, label: 'Subrayado' },
                  { icon: Strikethrough, label: 'Tachado' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => alert(`Simulación: Aplicar ${item.label}`)}
                      title={item.label}
                      className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-[#E5E7EB] mx-2 flex-shrink-0" />

              <div className="flex items-center">
                {[
                  { icon: List, label: 'Lista con viñetas' },
                  { icon: ListOrdered, label: 'Lista numerada' },
                  { icon: ListChecks, label: 'Lista de verificación' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => alert(`Simulación: Aplicar ${item.label}`)}
                      title={item.label}
                      className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-[#E5E7EB] mx-2 flex-shrink-0" />

              <div className="flex items-center">
                {[
                  { icon: Indent, label: 'Aumentar indentación' },
                  { icon: Outdent, label: 'Disminuir indentación' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => alert(`Simulación: ${item.label}`)}
                      title={item.label}
                      className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-[#E5E7EB] mx-2 flex-shrink-0" />

              <div className="flex items-center">
                {[
                  { icon: AlignLeft, label: 'Alinear a la izquierda' },
                  { icon: AlignCenter, label: 'Centrar' },
                  { icon: AlignRight, label: 'Alinear a la derecha' },
                  { icon: AlignJustify, label: 'Justificar' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => alert(`Simulación: ${item.label}`)}
                      title={item.label}
                      className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-[#E5E7EB] mx-2 flex-shrink-0" />

              <div className="flex items-center">
                {[
                  { icon: Link2, label: 'Insertar enlace' },
                  { icon: ImageIcon, label: 'Insertar imagen' },
                  { icon: Film, label: 'Insertar video' },
                  { icon: Table, label: 'Insertar tabla' },
                  { icon: Code, label: 'Insertar bloque de código' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => alert(`Simulación: ${item.label}`)}
                      title={item.label}
                      className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-5 bg-[#E5E7EB] mx-2 flex-shrink-0" />

              <div className="flex items-center">
                <button
                  type="button"
                  title="Deshacer"
                  className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
                >
                  <Undo2 size={14} />
                </button>
                <button
                  type="button"
                  title="Rehacer"
                  className="w-8 h-8 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
                >
                  <Redo2 size={14} />
                </button>
              </div>
            </div>

            {/* Editing Body Area */}
            <div className="p-8 bg-white relative">
              <div className="max-w-[720px] mx-auto text-left relative">
                <div
                  ref={textEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={handleTextKeyDown}
                  onInput={trackEdit}
                  className="outline-none min-h-[300px]"
                >
                  <h1 className="text-[28px] font-bold text-[#111827] mb-4 leading-tight">
                    Bienvenido al mundo de Python
                  </h1>

                  <p className="text-[16px] text-[#1F2937] leading-[1.7] mb-5">
                    Python es uno de los lenguajes de programación más populares y versátiles del
                    mundo. Creado por Guido van Rossum en 1991, Python ha crecido hasta convertirse
                    en la herramienta preferida para desarrollo web, ciencia de datos, inteligencia
                    artificial y automatización de procesos.
                  </p>

                  <h2 className="text-[22px] font-bold text-[#111827] mb-3 mt-6 leading-tight">
                    ¿Por qué aprender Python?
                  </h2>

                  <ul className="mb-5 flex flex-col gap-1.5 list-disc pl-5 text-[#1F2937] text-[16px] leading-[1.7]">
                    <li>Sintaxis limpia y extremadamente legible, ideal para principiantes.</li>
                    <li>Soporte de múltiples paradigmas (orientado a objetos, funcional, imperativo).</li>
                    <li>Ecosistema masivo con miles de librerías avanzadas como TensorFlow, Django y Pandas.</li>
                    <li>Alta demanda laboral en empresas líderes como Google, Netflix y la NASA.</li>
                  </ul>

                  {/* Bloque de código */}
                  <div
                    contentEditable={false}
                    className="bg-[#1E293B] text-white p-4 rounded-[4px] font-mono text-[14px] leading-relaxed mb-5 shadow-inner"
                  >
                    <div className="flex justify-between items-center text-slate-500 text-[10px] mb-2 uppercase font-bold tracking-wider">
                      <span>python</span>
                      <span>código de ejemplo</span>
                    </div>
                    <code>
                      <span className="text-[#818CF8]">print</span>
                      <span className="text-white">(</span>
                      <span className="text-[#34D399]">"¡Hola, SABERHUB!"</span>
                      <span className="text-white">)</span>
                    </code>
                  </div>
                </div>

                {/* Floating slash commands list mockup */}
                {slashMenuOpen && (
                  <div className="absolute top-1/2 left-10 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-[4px] shadow-xl py-1.5 z-40 text-left">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider border-b border-gray-50">
                      Insertar Bloque
                    </div>
                    {[
                      { emoji: '📄', label: 'Texto normal', desc: 'Comienza a escribir texto' },
                      { emoji: ' H1', label: 'Título 1', desc: 'Encabezado de sección grande' },
                      { emoji: ' H2', label: 'Título 2', desc: 'Subtítulo de sección' },
                      {
                        emoji: '💻',
                        label: 'Código',
                        desc: 'Bloque de código con syntax-highlighting',
                      },
                      { emoji: '💬', label: 'Cita', desc: 'Bloque de cita destacada estilo Cisco' },
                      { emoji: '📎', label: 'Archivo', desc: 'Descarga de archivo complementario' },
                    ].map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => insertBlock(opt.label)}
                        className="w-full px-3 py-2 hover:bg-[#EFF6FF] text-[#374151] hover:text-[#1E40AF] flex items-center gap-3 transition-colors text-left"
                      >
                        <span className="text-[15px] font-bold w-6 text-center flex items-center justify-center"><EmojiIcon emoji={opt.emoji} size={15} /></span>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold">{opt.label}</span>
                          <span className="text-[10px] text-[#6B7280]">{opt.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Word Counter */}
            <div className="px-8 py-3.5 border-t border-[#F3F4F6] text-[12px] text-[#6B7280] font-semibold select-none text-left">
              1,247 palabras · 8 min de lectura estimada
            </div>
          </div>

          {/* ──────────────────────────────────────────────────
              VARIANTE C — Lección tipo DOCUMENTO
              ────────────────────────────────────────────────── */}
          <div
            id="variante-documento"
            className="bg-white border border-[#F3F4F6] rounded-[4px] p-8 relative flex flex-col gap-6"
            style={{ borderBottom: '2px solid #1E40AF' }}
          >
            {/* Ribbon tag */}
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-[#1E40AF] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Variante C: Documento
            </div>

            <h3 className="font-bold text-[18px] text-[#111827] flex items-center gap-2 select-none">
              <EmojiIcon emoji="📎" size={18} /> Documento descargable
            </h3>

            {/* Documento principal */}
            {hasDocument ? (
              <div className="flex items-center gap-4 p-4 bg-[#F9FAFB] rounded-[4px] border border-[#F3F4F6] text-left">
                {/* Page miniature simulation (4:5 Ratio) */}
                <div className="w-16 h-20 bg-white border border-[#E5E7EB] rounded-[4px] flex-shrink-0 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
                  <div className="w-full h-2 bg-[#1E40AF] absolute top-0" />
                  <FileText size={20} className="text-red-500 mb-1" />
                  <span className="text-[7.5px] text-[#9CA3AF] font-bold uppercase tracking-wider">
                    PDF
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] text-[#111827] truncate">
                    guia-python-completa.pdf
                  </p>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">
                    45 páginas · 4.2 MB · Documento Principal
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => alert('Simulación: Ventana de búsqueda de archivos abierta.')}
                    className="px-3 py-1.5 border border-[#D1D5DB] rounded-[4px] text-[12px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors"
                  >
                    Reemplazar
                  </button>
                  <button
                    onClick={() => {
                      setHasDocument(false);
                      trackEdit();
                    }}
                    className="px-3 py-1.5 border border-red-200 text-red-600 rounded-[4px] text-[12px] font-semibold hover:bg-red-50 transition-colors"
                  >
                    × Quitar
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone vertical mimicking page (4:5) */
              <div className="flex justify-center select-none">
                <div
                  onClick={() => {
                    setHasDocument(true);
                    trackEdit();
                  }}
                  className="w-full max-w-[280px] aspect-[4/5] bg-[#F9FAFB] border-3 border-dashed border-[#D1D5DB] rounded-[4px] flex flex-col items-center justify-center gap-3 p-6 hover:border-[#1E40AF] hover:bg-[#EFF6FF] transition-all cursor-pointer"
                >
                  <Paperclip size={40} className="text-[#9CA3AF]" />
                  <div className="text-center">
                    <p className="font-bold text-[14px] text-[#4B5563]">Arrastra tu guía PDF</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">Máximo 50 MB</p>
                  </div>
                  <button className="bg-[#1E40AF] text-white px-3 py-1.5 rounded-[4px] text-[11px] font-bold transition-colors">
                    Examinar
                  </button>
                </div>
              </div>
            )}

            {/* Descripción textarea */}
            <div className="text-left flex flex-col gap-1.5">
              <label className="block text-[13px] font-bold text-[#4B5563]">
                Descripción del documento
              </label>
              <textarea
                placeholder="Describe el contenido del documento, qué encontrarán y cómo usarlo."
                defaultValue="Guía completa de Python para principiantes con ejercicios prácticos, ejemplos de código y recursos adicionales para complementar las lecciones del módulo."
                onChange={trackEdit}
                className="w-full h-24 px-4 py-3 border border-[#D1D5DB] rounded-[4px] text-[13.5px] text-[#111827] outline-none resize-y focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all"
              />
            </div>

            {/* Config toggles */}
            <div className="flex flex-col gap-4 pt-6 border-t border-[#F3F4F6] text-left select-none">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={trackEdit}
                  className="relative w-10 h-[22px] rounded-full transition-all bg-[#10B981] flex-shrink-0"
                >
                  <div className="absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all left-[21px]" />
                </div>
                <span className="text-[13px] font-semibold text-[#4B5563] group-hover:text-[#111827]">
                  Permitir descarga directa
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={trackEdit}
                  className="relative w-10 h-[22px] rounded-full transition-all bg-[#D1D5DB] flex-shrink-0"
                >
                  <div className="absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all left-[3px]" />
                </div>
                <span className="text-[13px] font-semibold text-[#4B5563] group-hover:text-[#111827]">
                  Mostrar visor incrustado en lugar de descarga
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => {
                    setWatermarkOn(!watermarkOn);
                    trackEdit();
                  }}
                  className={`relative w-10 h-[22px] rounded-full transition-all flex-shrink-0 ${
                    watermarkOn ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                      watermarkOn ? 'left-[21px]' : 'left-[3px]'
                    }`}
                  />
                </div>
                <span className="text-[13px] font-semibold text-[#4B5563] group-hover:text-[#111827]">
                  Marca de agua personalizada
                </span>
              </label>

              {watermarkOn && (
                <div className="pl-12">
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => {
                      setWatermarkText(e.target.value);
                      trackEdit();
                    }}
                    className="w-full max-w-[320px] h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] outline-none focus:border-[#1E40AF]"
                  />
                </div>
              )}
            </div>

            {/* Documentos complementarios */}
            <div className="pt-6 border-t border-[#F3F4F6] text-left">
              <span className="text-[14px] font-bold text-[#111827] block mb-3">
                Documentos complementarios
              </span>
              <div className="flex flex-col gap-2 mb-3">
                {complementaryDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-[#F9FAFB] rounded-[4px] border border-[#F3F4F6]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px]">{doc.icon}</span>
                      <span className="text-[13px] font-semibold text-[#374151]">{doc.name}</span>
                      <span className="text-[11px] text-[#6B7280]">({doc.size})</span>
                    </div>
                    <button
                      onClick={() => deleteCompDoc(doc.id)}
                      className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addCompDoc}
                className="w-full h-10 border border-dashed border-[#D1D5DB] rounded-[4px] text-[13px] text-[#1E40AF] font-bold hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all flex items-center justify-center gap-1.5 bg-white"
              >
                <Plus size={13} />
                <span>Agregar documento</span>
              </button>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────
              VARIANTE D — Lección tipo MIXTO
              ────────────────────────────────────────────────── */}
          <div
            id="variante-mixto"
            className="bg-white border border-[#F3F4F6] rounded-[4px] p-8 relative flex flex-col gap-4"
            style={{ borderBottom: '2px solid #1E40AF' }}
          >
            {/* Ribbon tag */}
            <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-[#1E40AF] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Variante D: Mixto
            </div>

            <div className="text-left select-none">
              <h3 className="font-bold text-[18px] text-[#111827] flex items-center gap-2">
                <EmojiIcon emoji="🧩" size={18} /> Lección mixta
              </h3>
              <p className="text-[13.5px] text-[#6B7280] mt-1">
                Combina diferentes tipos de contenido en una sola lección.
              </p>
            </div>

            {/* Constructor de bloques arrastrables */}
            <div className="flex flex-col gap-2.5 mt-2">
              {mixedBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white border border-[#F3F4F6] rounded-[4px] hover:border-gray-300 transition-colors group text-left"
                >
                  {/* Grab handle with simulation */}
                  <div className="flex flex-col text-slate-300 group-hover:text-slate-400 cursor-grab flex-shrink-0 gap-0.5">
                    <GripVertical size={14} />
                  </div>

                  <span className="text-[17px] flex-shrink-0 select-none flex items-center justify-center"><EmojiIcon emoji={block.icon} size={17} /></span>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-[#374151] truncate">
                      {block.title}
                    </span>
                    {block.duration && (
                      <span className="text-[11px] font-semibold text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded-full select-none">
                        {block.duration}
                      </span>
                    )}
                  </div>

                  {/* Ordering arrows simulation */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveMixedBlock(index, -1)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Subir bloque"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveMixedBlock(index, 1)}
                      disabled={index === mixedBlocks.length - 1}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Bajar bloque"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => alert(`Simulación: Editar bloque [${block.title}]`)}
                      className="px-2.5 py-1 border border-[#D1D5DB] rounded-[4px] text-[11px] font-semibold text-[#374151] hover:bg-gray-50 transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                      <Pencil size={10} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => deleteMixedBlock(block.id)}
                      className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Agregar bloque button with dropdown */}
            <div className="relative mt-2 select-none">
              <button
                onClick={() => setShowAddBlockMenu(!showAddBlockMenu)}
                className="w-full h-11 border-2 border-dashed border-[#D1D5DB] rounded-[4px] flex items-center justify-center gap-2 text-[13px] font-bold text-[#4B5563] hover:text-[#1E40AF] hover:border-[#1E40AF] hover:bg-[#EFF6FF] transition-all bg-white"
              >
                <Plus size={14} />
                <span>Agregar bloque</span>
              </button>

              {showAddBlockMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E5E7EB] rounded-[4px] shadow-lg z-20 py-1.5 text-left grid grid-cols-2 gap-1 px-2">
                  <div className="col-span-2 px-3 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider border-b border-gray-50">
                    Selecciona tipo de contenido
                  </div>
                  {ADD_BLOCK_OPTIONS.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => addMixedBlock(opt)}
                      className="px-3 py-2 hover:bg-[#EFF6FF] text-[#374151] hover:text-[#1E40AF] transition-colors flex items-center gap-2.5 rounded-[4px] text-left"
                    >
                      <span className="text-[15px]">{opt.icon}</span>
                      <span className="text-[12.5px] font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────────
            ZONA 3: Configuración secundaria (Grid de 2 columnas)
            ───────────────────────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
          {/* Card 1: Descripción y notas */}
          <div
            className="bg-white border border-[#F3F4F6] rounded-[4px] p-6 text-left flex flex-col gap-5"
            style={{ borderBottom: '2px solid #1E40AF' }}
          >
            <div>
              <h3 className="font-bold text-[16px] text-[#111827] mb-3">
                Descripción de la lección
              </h3>
              <div className="border border-[#D1D5DB] rounded-[4px] overflow-hidden focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#DBEAFE] transition-all bg-white">
                {/* Simple rich text toolbar */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  {[Bold, Italic, List, Link2].map((Icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => alert('Simulación: Formato de descripción')}
                      className="w-7 h-7 flex items-center justify-center rounded-[4px] text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
                    >
                      <Icon size={13} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={lessonDesc}
                  onChange={(e) => {
                    setLessonDesc(e.target.value);
                    trackEdit();
                  }}
                  placeholder="Resumen breve que aparece en el listado del curso."
                  className="w-full min-h-[100px] p-3.5 text-[13.5px] text-[#111827] outline-none resize-y bg-transparent"
                />
              </div>
            </div>

            {/* Notas del instructor */}
            <div className="border-t border-[#F3F4F6] pt-4">
              <p className="text-[13px] font-bold text-[#374151]">
                Notas del instructor (privadas)
              </p>
              <p className="text-[11.5px] text-[#6B7280] mt-0.5 mb-3">
                Solo tú puedes ver estas notas. No se muestran al alumno.
              </p>
              <textarea
                value={instructorNotes}
                onChange={(e) => {
                  setInstructorNotes(e.target.value);
                  trackEdit();
                }}
                placeholder="Notas internas privadas..."
                className="w-full h-20 px-3.5 py-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-[4px] text-[13px] text-[#92400E] outline-none resize-none focus:border-[#F59E0B] transition-all font-medium"
              />
            </div>
          </div>

          {/* Card 2: Recursos adjuntos */}
          <div
            className="bg-white border border-[#F3F4F6] rounded-[4px] p-6 text-left flex flex-col justify-between gap-5"
            style={{ borderBottom: '2px solid #1E40AF' }}
          >
            <div>
              <h3 className="font-bold text-[16px] text-[#111827] mb-3">Recursos adjuntos</h3>
              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                {attachedResources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-[#F9FAFB] rounded-[4px] border border-[#F3F4F6]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[15px] flex-shrink-0 flex items-center justify-center"><EmojiIcon emoji={res.icon} size={14} /></span>
                      <span
                        className="text-[13px] font-semibold text-[#374151] truncate"
                        title={res.name}
                      >
                        {res.name}
                      </span>
                      <span className="text-[11px] text-[#6B7280] font-mono flex-shrink-0">
                        ({res.size})
                      </span>
                    </div>

                    <button
                      onClick={() => deleteAttachedResource(res.id)}
                      className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#F3F4F6]">
              <button
                onClick={addAttachedFile}
                className="flex-1 h-10 border border-dashed border-[#D1D5DB] rounded-[4px] text-[13px] text-[#1E40AF] font-bold hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all flex items-center justify-center gap-1.5 bg-white"
              >
                <Upload size={13} />
                <span>Subir archivo</span>
              </button>

              <button
                onClick={addAttachedLink}
                className="flex-1 h-10 border border-dashed border-[#D1D5DB] rounded-[4px] text-[13px] text-[#1E40AF] font-bold hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all flex items-center justify-center gap-1.5 bg-white"
              >
                <ExternalLink size={13} />
                <span>Agregar enlace</span>
              </button>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────────────────
            ZONA 4: Configuración avanzada (Acordeón colapsable)
            ───────────────────────────────────────────────────────────────────────── */}
        <section className="bg-white border border-[#E5E7EB] rounded-[4px] overflow-hidden shadow-sm select-none">
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-6 py-4 text-[14px] font-bold text-[#374151] hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={15} className="text-[#6B7280]" />
              <span>Configuración avanzada</span>
            </div>
            {advancedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {advancedOpen && (
            <div className="px-6 pb-6 pt-3 border-t border-[#F3F4F6] grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 text-left">
              {/* Duración avanzada */}
              <div className="flex flex-col gap-1.5">
                <label className="block text-[13px] font-bold text-[#4B5563]">
                  Duración estimada
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={advDuration}
                    onChange={(e) => {
                      setAdvDuration(Number(e.target.value));
                      trackEdit();
                    }}
                    className="w-20 h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] text-center outline-none focus:border-[#1E40AF]"
                  />
                  <select
                    value={advUnit}
                    onChange={(e) => {
                      setAdvUnit(e.target.value);
                      trackEdit();
                    }}
                    className="h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] text-[#374151] outline-none bg-white focus:border-[#1E40AF]"
                  >
                    <option value="minutos">minutos</option>
                    <option value="horas">horas</option>
                  </select>
                </div>
              </div>

              {/* Puntos de Progreso */}
              <div className="flex flex-col gap-1.5">
                <label className="block text-[13px] font-bold text-[#4B5563]">
                  Puntos de progreso
                </label>
                <input
                  type="number"
                  value={advPoints}
                  onChange={(e) => {
                    setAdvPoints(Number(e.target.value));
                    trackEdit();
                  }}
                  className="w-20 h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] text-center outline-none focus:border-[#1E40AF]"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between md:pr-4 py-2 border-b border-[#F3F4F6] md:border-b-0">
                <span className="text-[13px] font-bold text-[#374151]">Permitir comentarios</span>
                <div
                  onClick={() => {
                    setAllowComments(!allowComments);
                    trackEdit();
                  }}
                  className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${
                    allowComments ? 'bg-[#1E40AF]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`absolute top-[2px] w-4 h-4 bg-white rounded-full transition-all ${
                      allowComments ? 'left-[22px]' : 'left-[2px]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between md:pr-4 py-2 border-b border-[#F3F4F6] md:border-b-0">
                <span className="text-[13px] font-bold text-[#374151]">
                  Notificar al instructor
                </span>
                <div
                  onClick={() => {
                    setNotifyInstructor(!notifyInstructor);
                    trackEdit();
                  }}
                  className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${
                    notifyInstructor ? 'bg-[#1E40AF]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <div
                    className={`absolute top-[2px] w-4 h-4 bg-white rounded-full transition-all ${
                      notifyInstructor ? 'left-[22px]' : 'left-[2px]'
                    }`}
                  />
                </div>
              </div>

              {/* Fechas de disponibilidad */}
              <div className="flex flex-col gap-1.5">
                <label className="block text-[13px] font-bold text-[#4B5563]">
                  Disponible desde
                </label>
                <input
                  type="date"
                  value={availableFrom}
                  onChange={(e) => {
                    setAvailableFrom(e.target.value);
                    trackEdit();
                  }}
                  className="w-full h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] text-[#374151] outline-none focus:border-[#1E40AF] bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="block text-[13px] font-bold text-[#4B5563]">
                  Disponible hasta
                </label>
                <input
                  type="date"
                  value={availableTo}
                  onChange={(e) => {
                    setAvailableTo(e.target.value);
                    trackEdit();
                  }}
                  className="w-full h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] text-[#374151] outline-none focus:border-[#1E40AF] bg-white"
                />
              </div>

              {/* Etiquetas / Tags */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="block text-[13px] font-bold text-[#4B5563]">
                  Etiquetas búsqueda interna
                </label>
                <div className="flex items-center gap-2 flex-wrap min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[4px] focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#DBEAFE] transition-all bg-white">
                  {tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 bg-[#DBEAFE] text-[#1E40AF] text-[11px] font-bold px-2 py-1 rounded-[4px] select-none"
                    >
                      <span>{t}</span>
                      <X
                        size={10}
                        onClick={() => removeTag(idx)}
                        className="cursor-pointer hover:bg-blue-200 p-0.5 rounded-full"
                      />
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Escribe y presiona Enter..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="flex-grow min-w-[120px] outline-none text-[13px] bg-transparent text-[#111827]"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* =========================================================================
          FOOTER FLOTANTE (Sticky Bottom, Fondo blanco, borde #F3F4F6)
          ========================================================================= */}
      <div className="sticky bottom-0 z-30 bg-white border-t border-[#F3F4F6] px-8 py-3.5 flex items-center justify-between flex-shrink-0 select-none shadow-lg">
        {/* Left Side: Auto-save status */}
        <div className="flex items-center gap-2">
          {changesSaved ? (
            <div className="flex items-center gap-2 text-[#10B981]">
              <Check size={16} />
              <span className="text-[13px] font-semibold">
                Guardado automáticamente hace 3 seg
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-[13px] font-semibold">Guardando cambios...</span>
            </div>
          )}
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={triggerExitRequest}
            className="text-[13px] text-[#6B7280] font-semibold hover:text-[#111827] px-4 py-2 transition-colors"
          >
            Cancelar cambios
          </button>

          <button
            onClick={() => {
              setChangesSaved(true);
              alert('Borrador guardado exitosamente.');
            }}
            className="border border-[#D1D5DB] bg-white px-4 py-2 rounded-[4px] text-[13px] font-semibold text-[#374151] hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            Guardar borrador
          </button>

          <button
            onClick={() => {
              if (isTitleEmpty) {
                alert('Error: El título es obligatorio para publicar.');
                return;
              }
              setChangesSaved(true);
              alert('¡Cambios publicados exitosamente en SABERHUB!');
            }}
            className="bg-[#1E40AF] hover:bg-[#152e80] text-white px-5 py-2 rounded-[4px] text-[13px] font-bold transition-colors"
          >
            Publicar cambios
          </button>
        </div>
      </div>

      {/* =========================================================================
          EXIT CONFIRMATION DIALOG MODAL
          ========================================================================= */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-fade-in select-none">
          <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-amber-500 flex-shrink-0" />
              <div className="flex flex-col gap-1">
                <h4 className="font-bold text-[16px] text-[#111827]">Cambios sin guardar</h4>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">
                  Tienes ediciones pendientes en esta lección que no se han guardado o publicado en
                  SABERHUB. ¿Estás seguro de que deseas salir?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#F3F4F6] pt-4">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 border border-[#D1D5DB] rounded-[4px] text-[13px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors"
              >
                Permanecer aquí
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  window.location.href = '/CrearCursos/modulos';
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[4px] text-[13px] font-bold transition-colors"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
