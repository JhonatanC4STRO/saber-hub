'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Check,
  ChevronRight,
  ChevronDown,
  GripVertical,
  MoreVertical,
  Plus,
  Video,
  FileText,
  Paperclip,
  Headphones,
  Layers,
  Settings,
  Play,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Link2,
  Image as ImageIcon,
  Code,
  Table,
  Undo2,
  Redo2,
  Upload,
  X,
  Save,
  Clock,
  Loader2,
  CheckCircle,
  BookOpen,
  Film,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';

/* ─────────── constants ─────────── */
const STEPS = [
  { n: 1, label: 'Información' },
  { n: 2, label: 'Módulos' },
  { n: 3, label: 'Evaluaciones' },
  { n: 4, label: 'Configuración' },
  { n: 5, label: 'Publicar' },
];

const SUBTITLE_LANGS = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'Inglés', flag: '🇺🇸' },
  { code: 'pt', label: 'Portugués', flag: '🇵🇹' },
  { code: 'fr', label: 'Francés', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Alemán', flag: '🇩🇪' },
];


const INITIAL_MODULES = [
  {
    id: 1,
    title: 'Introducción a Python',
    lessons: [
      {
        id: 11,
        type: 'video',
        title: '¿Qué es Python y por qué aprenderlo?',
        duration: '8 min',
        preview: true,
      },
      {
        id: 12,
        type: 'texto',
        title: 'Historia y filosofía de Python',
        duration: '5 min',
        preview: false,
      },
      {
        id: 13,
        type: 'video',
        title: 'Instalación del entorno en Windows',
        duration: '12 min',
        preview: false,
      },
      {
        id: 14,
        type: 'video',
        title: 'Instalación del entorno en Mac/Linux',
        duration: '10 min',
        preview: false,
      },
      {
        id: 15,
        type: 'documento',
        title: 'Guía de instalación PDF',
        duration: null,
        preview: false,
      },
      {
        id: 16,
        type: 'mixto',
        title: "Tu primer 'Hola Mundo'",
        duration: '15 min',
        preview: false,
      },
    ],
    expanded: true,
  },
  {
    id: 2,
    title: 'Variables y Tipos de Datos',
    lessons: [
      {
        id: 21,
        type: 'video',
        title: 'Variables y asignación de memoria',
        duration: '10 min',
        preview: false,
      },
      {
        id: 22,
        type: 'texto',
        title: 'Tipos primitivos (int, float, str, bool)',
        duration: '8 min',
        preview: false,
      },
      {
        id: 23,
        type: 'video',
        title: 'Operadores matemáticos y lógicos',
        duration: '14 min',
        preview: false,
      },
      {
        id: 24,
        type: 'mixto',
        title: 'Listas, Tuplas y Diccionarios',
        duration: '20 min',
        preview: false,
      },
      {
        id: 25,
        type: 'documento',
        title: 'Cheat sheet: Tipos de datos',
        duration: null,
        preview: false,
      },
      {
        id: 26,
        type: 'texto',
        title: 'Ejercicio: Calculadora simple',
        duration: '15 min',
        preview: false,
      },
    ],
    expanded: false,
  },
  {
    id: 3,
    title: 'Estructuras de Control',
    lessons: [
      {
        id: 31,
        type: 'video',
        title: 'Condicionales (if, elif, else)',
        duration: '12 min',
        preview: false,
      },
      {
        id: 32,
        type: 'video',
        title: 'Bucles While: Lógica e iteración',
        duration: '15 min',
        preview: false,
      },
      {
        id: 33,
        type: 'video',
        title: 'Bucles For: Recorriendo colecciones',
        duration: '18 min',
        preview: false,
      },
      {
        id: 34,
        type: 'texto',
        title: 'Control de flujo (break, continue, pass)',
        duration: '7 min',
        preview: false,
      },
    ],
    expanded: false,
  },
  {
    id: 4,
    title: 'Funciones y Modularidad',
    lessons: [
      {
        id: 41,
        type: 'video',
        title: 'Definición y llamado de funciones',
        duration: '14 min',
        preview: false,
      },
      {
        id: 42,
        type: 'texto',
        title: 'Argumentos y valores de retorno',
        duration: '10 min',
        preview: false,
      },
      {
        id: 43,
        type: 'video',
        title: 'Scope y funciones Lambda',
        duration: '16 min',
        preview: false,
      },
      {
        id: 44,
        type: 'documento',
        title: 'Ejercicios: Modularizando código',
        duration: null,
        preview: false,
      },
      {
        id: 45,
        type: 'mixto',
        title: 'Proyecto: Gestor de tareas',
        duration: '30 min',
        preview: false,
      },
    ],
    expanded: false,
  },
  {
    id: 5,
    title: 'Manejo de Errores',
    lessons: [
      {
        id: 51,
        type: 'video',
        title: 'Tipos de errores comunes en Python',
        duration: '9 min',
        preview: false,
      },
      {
        id: 52,
        type: 'video',
        title: 'Bloques try, except, finally',
        duration: '15 min',
        preview: false,
      },
      {
        id: 53,
        type: 'texto',
        title: 'Excepciones personalizadas',
        duration: '8 min',
        preview: false,
      },
    ],
    expanded: false,
  },
];

/* ─────────── Stepper ─────────── */
function Stepper({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full overflow-x-auto py-2">
      {STEPS.map((step, idx) => {
        const isActive = step.n === current;
        const isDone = step.n < current;
        return (
          <React.Fragment key={step.n}>
            <div className="flex flex-col items-center min-w-[90px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all ${
                  isActive
                    ? 'bg-[#1E40AF] text-white'
                    : isDone
                      ? 'bg-[#1E40AF] text-white'
                      : 'bg-white border-2 border-[#D1D5DB] text-[#9CA3AF]'
                }`}
              >
                {isDone ? <Check size={14} /> : step.n}
              </div>
              <span
                className={`text-[11px] mt-1 text-center leading-tight ${
                  isActive ? 'font-semibold text-[#1E40AF]' : 'font-medium text-[#6B7280]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-1 mt-[-18px] min-w-[24px] ${
                  step.n < current ? 'bg-[#1E40AF]' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─────────── Lesson icon ─────────── */
function LessonIcon({ size = 14 }) {
  return <FileText size={size} className="text-[#1E40AF] flex-shrink-0" />;
}

/* ─────────── Module row ─────────── */
function ModuleRow({
  mod,
  index,
  selectedLesson,
  onSelectLesson,
  onToggle,
  editingModule,
  setEditingModule,
  onDeleteModule,
  onAddLesson,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const lessonCount = mod.expanded
    ? mod.lessons.filter(Boolean).length
    : mod.lessonsCount || mod.lessons.filter(Boolean).length;

  return (
    <div
      className={`border border-[#F3F4F6] rounded bg-white mb-3 ${mod.expanded ? 'shadow-sm' : ''}`}
    >
      {/* Module header */}
      <div
        className={`flex items-center gap-2 px-3 py-3 cursor-pointer select-none transition-colors ${
          mod.expanded ? 'bg-[#F9FAFB] border-b border-[#F3F4F6]' : 'hover:bg-gray-50'
        }`}
        onClick={() => onToggle(mod.id)}
      >
        <GripVertical
          size={14}
          className="text-[#9CA3AF] cursor-grab flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
        {mod.expanded ? (
          <ChevronDown size={14} className="text-[#6B7280] flex-shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-[#6B7280] flex-shrink-0" />
        )}
        <div className="w-6 h-6 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
          <span className="text-[#1E40AF] text-[11px] font-bold">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          {editingModule === mod.id ? (
            <input
              autoFocus
              className="font-semibold text-[14px] text-[#111827] outline-none border-b-2 border-[#1E40AF] bg-transparent w-full"
              defaultValue={mod.title}
              onBlur={() => setEditingModule(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingModule(null)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="font-semibold text-[14px] text-[#111827] truncate block"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingModule(mod.id);
              }}
            >
              {mod.title}
            </span>
          )}
          <span className="text-[11px] text-[#6B7280] font-normal">
            {lessonCount} lecciones · {mod.duration || '45 min'}
          </span>
        </div>
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 rounded hover:bg-[#EFF6FF] transition-colors text-[#1E40AF]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded shadow-lg z-20 w-40 py-1">
              {['Editar', 'Duplicar', 'Ocultar', 'Eliminar'].map((action) => (
                <button
                  key={action}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 transition-colors ${
                    action === 'Eliminar' ? 'text-[#EF4444]' : 'text-[#374151]'
                  }`}
                  onClick={() => {
                    setMenuOpen(false);
                    if (action === 'Editar') setEditingModule(mod.id);
                    if (action === 'Eliminar' && onDeleteModule) onDeleteModule(mod.id);
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lessons list */}
      {mod.expanded && (
        <div className="px-2 py-2">
          {mod.lessons.filter(Boolean).map((lesson, li) => {
            const isSelected = selectedLesson?.id === lesson.id;
            return (
              <div
                key={lesson.id}
                onClick={() => onSelectLesson(lesson, mod)}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all mb-0.5 ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-l-[3px] border-[#1E40AF]'
                    : 'hover:bg-[#F9FAFB] border-l-[3px] border-transparent'
                }`}
              >
                <GripVertical size={12} className="text-[#D1D5DB] cursor-grab flex-shrink-0" />
                <LessonIcon type={lesson.type} size={14} />
                <span
                  className={`flex-1 text-[13px] font-medium truncate ${isSelected ? 'text-[#1E40AF]' : 'text-[#374151]'}`}
                >
                  {index + 1}.{li + 1} {lesson.title}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {lesson.duration && (
                    <span className="text-[11px] text-[#6B7280] font-medium">
                      {lesson.duration} min
                    </span>
                  )}
                  {lesson.preview && (
                    <span className="bg-[#DBEAFE] text-[#1E40AF] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Preview
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  title="Editar lección"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLesson(lesson, mod);
                  }}
                  className="p-1 rounded hover:bg-[#EFF6FF] text-[#9CA3AF] hover:text-[#1E40AF] transition-colors flex-shrink-0"
                >
                  <Pencil size={12} />
                </button>
                <MoreVertical
                  size={13}
                  className="text-[#9CA3AF] hover:text-[#1E40AF] transition-colors flex-shrink-0"
                />
              </div>
            );
          })}

          {/* Add lesson */}
          {addingLesson ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <input
                autoFocus
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                placeholder="Título de la nueva lección..."
                className="flex-1 h-8 px-2 border border-[#D1D5DB] rounded text-[13px] outline-none focus:border-[#1E40AF]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (newLessonTitle.trim() && onAddLesson) {
                      onAddLesson(mod.id, newLessonTitle.trim());
                    }
                    setAddingLesson(false);
                    setNewLessonTitle('');
                  } else if (e.key === 'Escape') {
                    setAddingLesson(false);
                    setNewLessonTitle('');
                  }
                }}
              />
              <button
                onClick={() => {
                  setAddingLesson(false);
                  setNewLessonTitle('');
                }}
                className="text-[#9CA3AF] hover:text-[#EF4444]"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAddingLesson(true);
              }}
              className="w-full mt-1 h-9 flex items-center justify-center gap-1.5 border border-dashed border-[#D1D5DB] rounded text-[#1E40AF] text-[12px] font-medium hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all"
            >
              <Plus size={13} /> Agregar lección
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────── Rich Text Toolbar ─────────── */
function RichToolbar() {
  const groups = [
    [
      { icon: Bold, label: 'Negrita' },
      { icon: Italic, label: 'Cursiva' },
      { icon: Underline, label: 'Subrayado' },
    ],
    [
      { icon: List, label: 'Lista' },
      { icon: ListOrdered, label: 'Numerada' },
    ],
    [
      { icon: AlignLeft, label: 'Izquierda' },
      { icon: AlignCenter, label: 'Centro' },
    ],
    [
      { icon: Link2, label: 'Enlace' },
      { icon: ImageIcon, label: 'Imagen' },
      { icon: Code, label: 'Código' },
      { icon: Table, label: 'Tabla' },
    ],
    [
      { icon: Undo2, label: 'Deshacer' },
      { icon: Redo2, label: 'Rehacer' },
    ],
  ];
  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB] flex-wrap">
      {groups.map((group, gi) => (
        <React.Fragment key={gi}>
          {group.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                title={item.label}
                className="w-7 h-7 flex items-center justify-center rounded text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
              >
                <Icon size={13} />
              </button>
            );
          })}
          {gi < groups.length - 1 && <div className="w-px h-5 bg-[#E5E7EB] mx-1" />}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─────────── Empty state ─────────── */
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-8">
      <div className="w-28 h-28 mb-6 opacity-60">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect
            x="20"
            y="15"
            width="80"
            height="90"
            rx="6"
            fill="#F3F4F6"
            stroke="#D1D5DB"
            strokeWidth="2"
          />
          <rect x="32" y="30" width="56" height="6" rx="3" fill="#D1D5DB" />
          <rect x="32" y="44" width="40" height="6" rx="3" fill="#D1D5DB" />
          <rect x="32" y="58" width="50" height="6" rx="3" fill="#D1D5DB" />
          <circle cx="88" cy="88" r="20" fill="#DBEAFE" stroke="#1E40AF" strokeWidth="2" />
          <path
            d="M81 88l5 5 11-11"
            stroke="#1E40AF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="font-bold text-[20px] text-[#111827] mb-2">Selecciona una lección</h3>
      <p className="text-[14px] text-[#6B7280] text-center max-w-xs leading-relaxed">
        Elige una lección del panel izquierdo para empezar a editar, o crea una nueva.
      </p>
    </div>
  );
}

/* ─────────── Lesson Editor ─────────── */
function LessonEditor({ lesson, module: mod, onUpdateLesson, onSave, onCancel, saving, savedAt }) {
  const [videoTab, setVideoTab] = useState('subir');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [urlVideo, setUrlVideo] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [duration, setDuration] = useState(8);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [videoError, setVideoError] = useState(null);

  const [selectedSubtitleLang, setSelectedSubtitleLang] = useState('es');
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const [subtitles, setSubtitles] = useState([]);
  const subtitleInputRef = useRef(null);

  React.useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || '');
      setUrlVideo(lesson.urlVideo || '');
      setIsPreview(lesson.preview || false);
      setHasVideo(!!lesson.urlVideo || false);
      setDescription(lesson.description || '');
      setFiles(lesson.recursos || []);
      setDuration(lesson.duration || 8);
      setVideoError(null);
      try {
        setSubtitles(lesson.subtitulos ? JSON.parse(lesson.subtitulos) : []);
      } catch {
        setSubtitles([]);
      }
    }
  }, [lesson?.id]);

  const handlePreviewToggle = () => {
    const newVal = !isPreview;
    setIsPreview(newVal);
    if (onUpdateLesson) onUpdateLesson(mod.id, lesson.id, { preview: newVal });
  };

  const handleSubtitleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'vtt' && ext !== 'srt') {
      setVideoError('Los subtítulos deben estar en formato .vtt o .srt');
      return;
    }

    setUploadingSubtitle(true);
    setVideoError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        const langInfo = SUBTITLE_LANGS.find(l => l.code === selectedSubtitleLang) || { label: 'Español', flag: '🇪🇸' };
        
        const newSub = {
          id: Date.now().toString(),
          lang: selectedSubtitleLang,
          label: `${langInfo.flag} ${langInfo.label}`,
          name: file.name,
          url: data.url,
        };

        const updatedSubs = [...subtitles, newSub];
        setSubtitles(updatedSubs);
        if (onUpdateLesson) {
          onUpdateLesson(mod.id, lesson.id, { subtitulos: JSON.stringify(updatedSubs) });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setVideoError(data.message || 'Error al subir los subtítulos.');
      }
    } catch (err) {
      setVideoError('Error de red al subir los subtítulos.');
    } finally {
      setUploadingSubtitle(false);
      if (subtitleInputRef.current) subtitleInputRef.current.value = '';
    }
  };

  const handleDeleteSubtitle = (subId) => {
    const updatedSubs = subtitles.filter(s => s.id !== subId);
    setSubtitles(updatedSubs);
    if (onUpdateLesson) {
      onUpdateLesson(mod.id, lesson.id, { subtitulos: JSON.stringify(updatedSubs) });
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoError(null);

    // Límite de 100 MB
    const maxSizeVideo = 100 * 1024 * 1024;
    if (file.size > maxSizeVideo) {
      const currentSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setVideoError(`El video debe pesar menos de 100 MB. El peso actual es de ${currentSizeMB} MB.`);
      return;
    }

    setUploadingVideo(true);
    try {
      // 1. Intentar obtener la firma de subida para subir directo
      try {
        const signRes = await fetch('/api/upload');
        if (signRes.ok) {
          const signData = await signRes.json();
          const { signature, timestamp, folder, apiKey, cloudName } = signData;

          const fd = new FormData();
          fd.append('file', file);
          fd.append('api_key', apiKey);
          fd.append('timestamp', timestamp.toString());
          fd.append('signature', signature);
          fd.append('folder', folder);

          const resourceType = (file.type && file.type.startsWith('video/')) ? 'video' : 'auto';
          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

          const res = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: fd,
            credentials: 'omit',
          });

          if (res.ok) {
            const data = await res.json();
            setUrlVideo(data.secure_url);
            setHasVideo(true);
            if (onUpdateLesson) {
              onUpdateLesson(mod.id, lesson.id, { urlVideo: data.secure_url });
            }
            setUploadingVideo(false);
            return;
          }
        }
      } catch (directUploadErr) {
        console.warn("Direct upload failed or was blocked. Falling back to server-side upload:", directUploadErr);
      }

      // Fallback a subida normal del backend
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setUrlVideo(data.url);
        setHasVideo(true);
        if (onUpdateLesson) {
          onUpdateLesson(mod.id, lesson.id, { urlVideo: data.url });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setVideoError(data.message || 'Error al subir el video.');
      }
    } catch (err) {
      setVideoError('Error de red al subir el video.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Límite de 50 MB
    const maxSizeDoc = 50 * 1024 * 1024;
    if (file.size > maxSizeDoc) {
      alert('El archivo adjunto es demasiado pesado. El límite máximo permitido es de 50 MB.');
      return;
    }

    setUploadingAttachment(true);
    try {
      // 1. Intentar obtener la firma de subida para subir directo
      try {
        const signRes = await fetch('/api/upload');
        if (signRes.ok) {
          const signData = await signRes.json();
          const { signature, timestamp, folder, apiKey, cloudName } = signData;

          const fd = new FormData();
          fd.append('file', file);
          fd.append('api_key', apiKey);
          fd.append('timestamp', timestamp.toString());
          fd.append('signature', signature);
          fd.append('folder', folder);

          const resourceType = 'auto';
          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

          const res = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: fd,
            credentials: 'omit',
          });

          if (res.ok) {
            const data = await res.json();
            const newResource = {
              titulo: file.name,
              tipo: data.format === 'pdf' ? 'pdf' : 'otro',
              urlDocumento: data.secure_url,
            };
            const updatedRecursos = [...files, newResource];
            setFiles(updatedRecursos);
            if (onUpdateLesson) {
              onUpdateLesson(mod.id, lesson.id, { recursos: updatedRecursos });
            }
            setUploadingAttachment(false);
            return;
          }
        }
      } catch (directUploadErr) {
        console.warn("Direct upload failed or was blocked. Falling back to server-side upload:", directUploadErr);
      }

      // Fallback a subida normal del backend
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        const newResource = {
          titulo: file.name,
          tipo: data.format === 'pdf' ? 'pdf' : 'otro',
          urlDocumento: data.url,
        };
        const updatedRecursos = [...files, newResource];
        setFiles(updatedRecursos);
        if (onUpdateLesson) {
          onUpdateLesson(mod.id, lesson.id, { recursos: updatedRecursos });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Error al subir el archivo.');
      }
    } catch (err) {
      alert('Error de red al subir el archivo.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteResource = (urlDoc) => {
    const updated = files.filter((f) => f.urlDocumento !== urlDoc);
    setFiles(updated);
    if (onUpdateLesson) {
      onUpdateLesson(mod.id, lesson.id, { recursos: updated });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="px-8 pt-6 pb-4 border-b border-[#F3F4F6] bg-white flex-shrink-0">
        <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-widest mb-2">
          Módulo {mod?.id || 1}: {mod?.title || 'Módulo'} › Lección{' '}
          {lesson?.id?.toString().slice(-1) || 1}
        </p>
        <div className="flex items-start justify-between gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (onUpdateLesson) onUpdateLesson(mod.id, lesson.id, { title: e.target.value });
            }}
            className="font-bold text-[22px] text-[#111827] leading-tight flex-1 bg-transparent border-b border-dashed border-transparent hover:border-[#1E40AF] focus:border-[#1E40AF] focus:ring-0 outline-none p-0.5"
            placeholder="Título de la lección"
          />
          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <span className="text-[13px] text-[#4B5563] font-medium whitespace-nowrap">
              Marcar como preview
            </span>
            <div
              className={`relative w-10 h-5 rounded-full transition-all ${isPreview ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`}
              onClick={handlePreviewToggle}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isPreview ? 'left-5' : 'left-0.5'}`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
            {/* Video section */}
            <div
              className="bg-white border border-[#F3F4F6] rounded"
              style={{ borderBottomWidth: 2, borderBottomColor: '#1E40AF' }}
            >
              <div className="p-6 pb-0">
                <h3 className="font-bold text-[16px] text-[#111827] mb-4">Video de la lección (Opcional)</h3>
                <div className="flex gap-4 border-b border-[#F3F4F6] mb-5">
                  {['subir', 'url'].map((vt) => (
                    <button
                      key={vt}
                      onClick={() => setVideoTab(vt)}
                      className={`relative pb-3 text-[13px] font-medium capitalize transition-colors ${
                        videoTab === vt ? 'text-[#1E40AF] font-semibold' : 'text-[#6B7280]'
                      }`}
                    >
                      {vt === 'subir' ? 'Subir archivo' : 'URL externa'}
                      {videoTab === vt && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1E40AF]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6">
                {videoTab === 'subir' && (
                  <>
                    {videoError && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-red-800">
                            Error en el video
                          </p>
                          <p className="text-[12px] text-red-600 mt-0.5">
                            {videoError}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVideoError(null)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {uploadingVideo ? (
                      <div className="w-full aspect-video bg-[#F9FAFB] border-2 border-dashed border-[#1E40AF] rounded flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E40AF]" />
                        <p className="text-[14px] text-[#1E40AF] font-medium animate-pulse">Subiendo video a Cloudinary...</p>
                      </div>
                    ) : hasVideo && urlVideo ? (
                      <div>
                        <video
                          src={urlVideo}
                          controls
                          className="w-full aspect-video rounded bg-black mb-4"
                        />
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Film size={14} className="text-[#1E40AF]" />
                            <span className="text-[13px] font-medium text-[#111827] truncate max-w-xs">
                              {urlVideo.split('/').pop() || 'Video de la lección'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 border border-[#D1D5DB] rounded text-[12px] font-medium text-[#374151] hover:bg-gray-50 transition-colors"
                            >
                              Cambiar video
                            </button>
                            <button
                              className="px-3 py-1.5 border border-[#FCA5A5] rounded text-[12px] font-medium text-[#EF4444] hover:bg-red-50 transition-colors"
                              onClick={() => {
                                setHasVideo(false);
                                setUrlVideo('');
                                if (onUpdateLesson) onUpdateLesson(mod.id, lesson.id, { urlVideo: '' });
                              }}
                            >
                              × Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-video bg-[#F9FAFB] border-2 border-dashed border-[#D1D5DB] rounded flex flex-col items-center justify-center gap-3 hover:border-[#1E40AF] hover:bg-[#EFF6FF] transition-all cursor-pointer mb-4"
                      >
                        <Film size={48} className="text-[#9CA3AF]" />
                        <div className="text-center">
                          <p className="font-semibold text-[15px] text-[#4B5563]">
                            Arrastra tu video aquí
                          </p>
                          <span className="text-[#1E40AF] font-medium text-[14px] hover:underline">
                            o haz clic para seleccionar
                          </span>
                        </div>
                        <p className="text-[12px] text-[#6B7280]">
                          MP4, MOV, WebM · Máximo 100 MB · 1080p recomendado
                        </p>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />

                    {/* Subtítulos */}
                    <div className="pt-4 border-t border-[#F3F4F6]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] font-semibold text-[#111827]">
                          Subtítulos (.vtt, .srt)
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedSubtitleLang}
                            onChange={(e) => setSelectedSubtitleLang(e.target.value)}
                            className="text-[11.5px] bg-white border border-[#D1D5DB] rounded px-2 py-1 font-medium text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
                          >
                            {SUBTITLE_LANGS.map(lang => (
                              <option key={lang.code} value={lang.code}>
                                {lang.flag} {lang.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => subtitleInputRef.current?.click()}
                            disabled={uploadingSubtitle}
                            className="text-[12px] text-[#1E40AF] font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                          >
                            {uploadingSubtitle ? (
                              <>
                                <Loader2 size={12} className="animate-spin" /> Subiendo...
                              </>
                            ) : (
                              <>
                                <Plus size={12} /> Agregar
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <input
                        ref={subtitleInputRef}
                        type="file"
                        accept=".vtt,.srt"
                        className="hidden"
                        onChange={handleSubtitleUpload}
                      />

                      {subtitles.length > 0 ? (
                        <div className="space-y-2">
                          {subtitles.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded animate-fade-in"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-[12px] font-semibold text-[#374151] flex-shrink-0">
                                  {sub.label}
                                </span>
                                <span className="text-[12px] text-[#6B7280] truncate">
                                  ({sub.name})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubtitle(sub.id)}
                                className="text-[11px] text-[#EF4444] hover:underline font-semibold"
                              >
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-[#9CA3AF]">Sin subtítulos adjuntos aún.</p>
                      )}
                    </div>
                  </>
                )}
                {videoTab === 'url' && (
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">
                      URL del video
                    </label>
                    <input
                      type="url"
                      value={urlVideo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUrlVideo(val);
                        setHasVideo(!!val);
                        if (onUpdateLesson) onUpdateLesson(mod.id, lesson.id, { urlVideo: val });
                      }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full h-11 px-4 border border-[#D1D5DB] rounded text-[14px] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all"
                    />
                    <p className="text-[12px] text-[#6B7280] mt-1">
                      Compatible con YouTube, Vimeo, o cualquier URL directa MP4.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            <div
              className="bg-white border border-[#F3F4F6] rounded"
              style={{ borderBottomWidth: 2, borderBottomColor: '#1E40AF' }}
            >
              <div className="p-6 pb-0">
                <h3 className="font-bold text-[16px] text-[#111827] mb-4">Descripción</h3>
              </div>
              <div className="border border-[#D1D5DB] rounded mx-6 mb-6 overflow-hidden focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#DBEAFE] transition-all">
                <RichToolbar />
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (onUpdateLesson) onUpdateLesson(mod.id, lesson.id, { description: e.target.value });
                  }}
                  placeholder="Describe el contenido de esta lección..."
                  className="w-full min-h-[200px] p-4 text-[14px] text-[#111827] outline-none resize-y bg-white leading-relaxed"
                />
              </div>
            </div>

            {/* Materiales complementarios */}
            <div
              className="bg-white border border-[#F3F4F6] rounded"
              style={{ borderBottomWidth: 2, borderBottomColor: '#1E40AF' }}
            >
              <div className="p-6">
                <h3 className="font-bold text-[16px] text-[#111827] mb-1">
                  Materiales complementarios
                </h3>
                <p className="text-[13px] text-[#6B7280] mb-4">
                  Adjunta archivos PDF, imágenes o presentaciones.
                </p>
                {/* Files list */}
                <div className="flex flex-col gap-2 mb-4">
                  {files.map((file) => (
                    <div
                      key={file.urlDocumento}
                      className="flex items-center justify-between px-3 py-2 bg-[#F9FAFB] rounded border border-[#F3F4F6]"
                    >
                      <FileText size={15} className="text-[#EF4444] flex-shrink-0" />
                      <span className="text-[13px] text-[#374151] font-medium flex-1 truncate">
                        {file.titulo}
                      </span>
                      <button
                        onClick={() => handleDeleteResource(file.urlDocumento)}
                        className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                {uploadingAttachment ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-[#EFF6FF] rounded border border-dashed border-[#1E40AF]">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1E40AF]" />
                    <span className="text-[12px] text-[#1E40AF] font-medium animate-pulse">Subiendo recurso...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => attachmentInputRef.current?.click()}
                    className="w-full h-10 border border-dashed border-[#D1D5DB] rounded text-[13px] text-[#1E40AF] font-medium hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={13} /> Agregar material
                  </button>
                )}
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachmentUpload}
                />
              </div>
            </div>

            {/* Configuración avanzada (accordion) */}
            <div className="bg-white border border-[#F3F4F6] rounded">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-[14px] font-semibold text-[#374151] hover:bg-gray-50 transition-colors"
                onClick={() => setAdvancedOpen(!advancedOpen)}
              >
                <div className="flex items-center gap-2">
                  <Settings size={15} className="text-[#6B7280]" />
                  Configuración avanzada
                </div>
                {advancedOpen ? (
                  <ChevronDown size={15} className="text-[#6B7280]" />
                ) : (
                  <ChevronRight size={15} className="text-[#6B7280]" />
                )}
              </button>
              {advancedOpen && (
                <div className="px-5 pb-5 border-t border-[#F3F4F6] pt-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[#374151]">Duración estimada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={duration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setDuration(val);
                          if (onUpdateLesson) onUpdateLesson(mod.id, lesson.id, { duration: val });
                        }}
                        className="w-16 h-8 px-2 border border-[#D1D5DB] rounded text-[13px] text-center outline-none focus:border-[#1E40AF]"
                      />
                      <span className="text-[13px] text-[#6B7280]">minutos</span>
                    </div>
                  </div>
                  {[
                    { label: 'Requiere completar para continuar', id: 'require' },
                    { label: 'Permitir descarga del video', id: 'download' },
                  ].map((toggle) => (
                    <div key={toggle.id} className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-[#374151]">{toggle.label}</span>
                      <div className="relative w-10 h-5 bg-[#D1D5DB] rounded-full cursor-pointer hover:bg-[#9CA3AF] transition-colors">
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  ))}
                  <div>
                    <p className="text-[13px] font-medium text-[#374151] mb-1.5">
                      Notas del instructor (privadas)
                    </p>
                    <textarea
                      placeholder="Notas internas visibles solo para ti..."
                      className="w-full h-20 px-3 py-2 bg-[#FEF3C7] border border-[#FDE68A] rounded text-[13px] text-[#92400E] outline-none resize-none focus:border-[#F59E0B] transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
      </div>

      {/* Sticky footer */}
      <div className="border-t border-[#F3F4F6] bg-white px-8 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-[#10B981]">
          {savedAt ? (
            <>
              <Check size={14} className="text-[#10B981]" />
              <span className="text-[13px] font-medium text-[#10B981]">
                Guardado a las {savedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </>
          ) : (
            <span className="text-[13px] text-[#9CA3AF] font-normal">Cambios sin guardar en servidor</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-[#6B7280] font-medium hover:text-[#111827] transition-colors px-4 py-2"
          >
            Cerrar editor
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-[#1E40AF] hover:bg-[#1A368F] text-white px-5 py-2 rounded text-[13px] font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── MAIN COMPONENT ─────────── */
export default function ModulosEditor({ usuario }) {
  const router = useRouter();
  const [cursoId, setCursoId] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  /* ── Cargar cursoId y módulos existentes ── */
  useEffect(() => {
    const id = sessionStorage.getItem('saberhub_curso_id');
    if (id) {
      setCursoId(id);
      fetch(`/api/cursos/${id}/contenido`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((mod) => ({
              id: mod.id,
              title: mod.titulo,
              duration: mod.duration || '0 min',
              expanded: true,
              lessons: (mod.lecciones || []).map((lec) => ({
                id: lec.id,
                type: lec.urlVideo ? 'video' : 'texto',
                title: lec.titulo,
                duration: lec.duracion || 8,
                preview: lec.esPreview || false,
                description: lec.contenidoTexto || '',
                urlVideo: lec.urlVideo || '',
                recursos: (lec.recursos || []).map((r) => ({
                  id: r.id,
                  titulo: r.titulo,
                  tipo: r.tipo,
                  urlDocumento: r.urlDocumento,
                })),
              })),
            }));
            setModules(mapped);
          }
        })
        .catch(() => {})
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, []);

  /* ── Guardar módulos en BD ── */
  const saveModules = useCallback(async () => {
    if (!cursoId) {
      setSaveError('No hay un curso activo. Ve al paso 1 primero.');
      return false;
    }
    if (modules.length === 0) {
      setSaveError('Agrega al menos un módulo con una lección antes de continuar.');
      return false;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = modules.map((mod) => ({
        id: typeof mod.id === 'number' ? `temp-${mod.id}` : mod.id,
        titulo: mod.title,
        descripcion: '',
        lecciones: (mod.lessons || []).map((lec) => ({
          id: typeof lec.id === 'number' ? `temp-${lec.id}` : lec.id,
          titulo: lec.title,
          contenidoTexto: lec.description || '',
          urlVideo: lec.urlVideo || '',
          esPreview: lec.preview || false,
          duracion: lec.duration ? parseInt(lec.duration, 10) : null,
          subtitulos: lec.subtitulos || '[]',
          recursos: (lec.recursos || []).map((r) => ({
            titulo: r.titulo,
            tipo: r.tipo,
            urlDocumento: r.urlDocumento,
          })),
        })),
      }));
      const res = await fetch(`/api/cursos/${cursoId}/contenido`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.message || 'Error al guardar módulos');
        return false;
      }
      setSavedAt(new Date());
      return true;
    } catch {
      setSaveError('Error de conexión. Intenta de nuevo.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [cursoId, modules]);

  const handleContinue = useCallback(async () => {
    const ok = await saveModules();
    if (ok) router.push('/CrearCursos/evaluaciones');
  }, [saveModules, router]);

  const handleSaveAndExit = useCallback(async () => {
    const ok = await saveModules();
    if (ok) {
      sessionStorage.removeItem('saberhub_curso_id');
      router.push('/dashboard');
    }
  }, [saveModules, router]);

  const toggleModule = useCallback((id) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, expanded: !m.expanded } : m)));
  }, []);

  const deleteModule = useCallback(
    (id) => {
      setModules((prev) => prev.filter((m) => m.id !== id));
      if (selectedModule?.id === id) {
        setSelectedModule(null);
        setSelectedLesson(null);
      }
    },
    [selectedModule]
  );

  const updateLesson = useCallback(
    (moduleId, lessonId, updates) => {
      setModules((prev) =>
        prev.map((m) => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
            };
          }
          return m;
        })
      );
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson((prev) => ({ ...prev, ...updates }));
      }
    },
    [selectedLesson]
  );

  const addLesson = useCallback((moduleId, lessonTitle) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.id === moduleId) {
          const newLesson = {
            id: Date.now(),
            type: 'video',
            title: lessonTitle,
            duration: 8,
            preview: false,
            description: '',
            urlVideo: '',
            recursos: [],
          };
          return { ...m, lessons: [...m.lessons, newLesson] };
        }
        return m;
      })
    );
  }, []);

  const handleSelectLesson = useCallback((lesson, mod) => {
    setSelectedLesson(lesson);
    setSelectedModule(mod);
  }, []);

  return (
    <div
      className="min-h-screen bg-white font-sans flex flex-col"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Top header */}
      <HeaderAdmin usuario={usuario} />

      {/* Main container wrapper */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-8 pt-6 w-full flex flex-col flex-1 overflow-hidden">
        {/* Breadcrumb */}
        <nav className="mb-4 flex-shrink-0" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li>
              <Link
                href="/dashboard"
                className="text-[#6B7280] hover:text-[#111827] font-medium transition-colors"
              >
                Mi aprendizaje
              </Link>
            </li>
            <li className="text-[#D1D5DB]">›</li>
            <li>
              <Link
                href="/dashboard"
                className="text-[#6B7280] hover:text-[#111827] font-medium transition-colors"
              >
                Mis cursos
              </Link>
            </li>
            <li className="text-[#D1D5DB]">›</li>
            <li className="text-[#111827] font-semibold">Crear curso</li>
          </ol>
        </nav>

        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 flex-shrink-0">
          <div>
            <Link
              href="/CrearCursos"
              className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] font-medium mb-2 transition-colors w-fit"
            >
              <ArrowLeft size={14} /> Volver a información
            </Link>
            <h1 className="font-bold text-[28px] text-[#111827] leading-tight">
              Módulos del curso
            </h1>
            <p className="text-[14px] text-[#6B7280] font-normal mt-1">
              Estructura el contenido de tu curso añadiendo módulos y lecciones.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {saveError && (
              <span className="text-[13px] text-[#EF4444] font-medium max-w-[260px] text-right">
                {saveError}
              </span>
            )}
            <button
              onClick={saveModules}
              disabled={saving}
              className="flex items-center gap-2 bg-white border border-[#D1D5DB] px-5 py-3 rounded text-[14px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
              como borrador
            </button>
            <button
              onClick={handleSaveAndExit}
              disabled={saving}
              className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-3 rounded text-[14px] font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}{' '}
              Guardar y salir
            </button>
            <button
              onClick={handleContinue}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-6 py-3 rounded text-[14px] font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              Continuar → Evaluaciones
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex-shrink-0">
          <Stepper current={2} />
        </div>

        {/* Two-column main area */}
        <div className="flex flex-1 overflow-hidden bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] mb-8 shadow-sm">
          {/* ══════ LEFT: Course structure ══════ */}
          <div className="w-full lg:w-[40%] border-r border-[#F3F4F6] flex flex-col overflow-hidden flex-shrink-0">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Column header */}
              <div className="mb-5">
                <h2 className="font-bold text-[18px] text-[#111827] mb-1">Estructura del curso</h2>
                {!cursoId && (
                  <div className="flex items-center gap-2 bg-[#FEF3C7] border border-[#F59E0B] rounded px-3 py-2 mb-3">
                    <span className="text-[12px] text-[#92400E] font-medium">
                      ⚠ Ve al paso 1 para crear o seleccionar un curso primero.
                    </span>
                  </div>
                )}
                {initialLoading ? (
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-[13px]">Cargando módulos...</span>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#6B7280]">
                    {modules.length} módulos ·{' '}
                    {modules.reduce(
                      (acc, m) => acc + (m.lessons?.filter(Boolean).length || m.lessonsCount || 0),
                      0
                    )}{' '}
                    lecciones
                  </p>
                )}
              </div>

              {/* Add module button */}
              {addingModule ? (
                <div className="flex items-center gap-2 mb-4 p-3 border-2 border-[#1E40AF] bg-[#EFF6FF] rounded">
                  <input
                    autoFocus
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    placeholder="Nombre del módulo..."
                    className="flex-1 bg-transparent outline-none text-[14px] font-medium text-[#111827]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (newModuleTitle.trim()) {
                          setModules((prev) => [
                            ...prev,
                            {
                              id: Date.now(),
                              title: newModuleTitle,
                              lessons: [],
                              expanded: true,
                              duration: '0 min',
                            },
                          ]);
                          setNewModuleTitle('');
                        }
                        setAddingModule(false);
                      }
                      if (e.key === 'Escape') {
                        setAddingModule(false);
                        setNewModuleTitle('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setAddingModule(false);
                      setNewModuleTitle('');
                    }}
                    className="text-[#6B7280] hover:text-[#EF4444]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingModule(true)}
                  className="w-full h-12 border-2 border-dashed border-[#D1D5DB] rounded bg-white flex items-center justify-center gap-2 text-[14px] font-semibold text-[#4B5563] hover:text-[#1E40AF] hover:border-[#1E40AF] hover:bg-[#EFF6FF] transition-all mb-5"
                >
                  <Plus size={15} /> Agregar módulo
                </button>
              )}

              {/* Modules list */}
              {modules.map((mod, idx) => (
                <ModuleRow
                  key={mod.id}
                  mod={mod}
                  index={idx}
                  selectedLesson={selectedLesson}
                  onSelectLesson={handleSelectLesson}
                  onToggle={toggleModule}
                  editingModule={editingModule}
                  setEditingModule={setEditingModule}
                  onDeleteModule={deleteModule}
                  onAddLesson={addLesson}
                />
              ))}
            </div>
          </div>

          {/* ══════ RIGHT: Lesson editor ══════ */}
          <div className="flex-1 bg-[#F9FAFB] flex flex-col overflow-hidden">
            {selectedLesson ? (
              <LessonEditor
                lesson={selectedLesson}
                module={selectedModule}
                onUpdateLesson={updateLesson}
                onSave={saveModules}
                onCancel={() => setSelectedLesson(null)}
                saving={saving}
                savedAt={savedAt}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>

      {/* Save indicator */}
      {savedAt && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-[#F3F4F6] rounded px-4 py-2 shadow-sm">
          <CheckCircle size={13} className="text-[#10B981]" />
          <span className="text-[12px] text-[#6B7280] font-normal">
            Guardado a las{' '}
            {savedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
}
