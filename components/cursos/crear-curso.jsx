'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
  Check,
  X,
  Plus,
  ChevronDown,
  Image as ImageIcon,
  Lightbulb,
  Clock,
  Building2,
  Play,
  Save,
  AlertCircle,
  Loader2,
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

const CATEGORIAS = [
  'Programación',
  'Diseño',
  'Marketing Digital',
  'Negocios',
  'Idiomas',
  'Ciberseguridad',
  'Inteligencia Artificial',
  'Datos',
  'Desarrollo Personal',
];

const SUBCATEGORIAS = {
  Programación: ['Python', 'JavaScript', 'Java', 'C++', 'Web Development'],
  Diseño: ['UI/UX', 'Diseño Gráfico', 'Motion Graphics', 'Ilustración'],
  'Marketing Digital': ['SEO', 'SEM', 'Redes Sociales', 'Email Marketing'],
  Negocios: ['Emprendimiento', 'Finanzas', 'Recursos Humanos', 'Liderazgo'],
  Idiomas: ['Inglés', 'Francés', 'Alemán', 'Portugués', 'Mandarin'],
  Ciberseguridad: ['Ethical Hacking', 'Redes', 'Criptografía', 'Forense Digital'],
  'Inteligencia Artificial': ['Machine Learning', 'Deep Learning', 'NLP', 'Visión Computacional'],
  Datos: ['Análisis de Datos', 'Big Data', 'SQL', 'Tableau'],
  'Desarrollo Personal': ['Productividad', 'Comunicación', 'Mindfulness'],
};


const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];
const NIVEL_STYLES = {
  Principiante: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  Intermedio: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  Avanzado: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
};

/* ─────────── sub-components ─────────── */
function Stepper({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 w-full overflow-x-auto py-2">
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

function TagInput({ tags, setTags }) {
  const [input, setInput] = useState('');
  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) setTags([...tags, input.trim()]);
      setInput('');
    }
  };
  const removeTag = (t) => setTags(tags.filter((x) => x !== t));
  return (
    <div className="min-h-[44px] flex flex-wrap gap-2 items-center border border-[#D1D5DB] rounded px-3 py-2 focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#DBEAFE] transition-all bg-white">
      {tags.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 bg-[#DBEAFE] text-[#1E40AF] text-[12px] font-medium px-2.5 py-1 rounded"
        >
          {t}
          <button type="button" onClick={() => removeTag(t)} className="hover:text-[#1E3A8A]">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? 'Ej. python, programación (presiona Enter)' : ''}
        className="outline-none text-[13px] text-[#111827] flex-1 min-w-[120px] bg-transparent"
      />
    </div>
  );
}

function DynamicList({ items, setItems, placeholder = 'Agrega un punto...', icon = 'check' }) {
  const addItem = () => setItems([...items, '']);
  const updateItem = (i, val) => {
    const n = [...items];
    n[i] = val;
    setItems(n);
  };
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#DBEAFE] flex items-center justify-center">
            {icon === 'check' ? (
              <Check size={11} className="text-[#1E40AF]" />
            ) : (
              <span className="text-[#1E40AF] text-[12px] font-bold">•</span>
            )}
          </div>
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 h-10 px-3 border border-[#D1D5DB] rounded text-[13px] text-[#111827] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all"
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 text-[#1E40AF] text-[13px] font-medium hover:text-[#1E3A8A] transition-colors w-fit mt-1"
      >
        <Plus size={14} /> Agregar punto
      </button>
    </div>
  );
}

function RichToolbar({ onAction }) {
  const tools = [
    { icon: <Bold size={13} />, label: 'Negrita', action: 'bold' },
    { icon: <Italic size={13} />, label: 'Cursiva', action: 'italic' },
    { icon: <List size={13} />, label: 'Lista', action: 'list' },
    { icon: <ListOrdered size={13} />, label: 'Numerada', action: 'list-ordered' },
    { icon: <Link2 size={13} />, label: 'Enlace', action: 'link' },
    { icon: <Undo2 size={13} />, label: 'Deshacer', action: 'undo' },
    { icon: <Redo2 size={13} />, label: 'Rehacer', action: 'redo' },
  ];
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
      {tools.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onAction && onAction(t.action)}
          title={t.label}
          className="w-7 h-7 flex items-center justify-center rounded text-[#6B7280] hover:text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors"
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}

/* ─────────── MAIN COMPONENT ─────────── */
export default function CrearCurso({ usuario }) {
  const router = useRouter();

  const [cursoId, setCursoId] = useState(null);
  const [form, setForm] = useState({
    titulo: '',
    subtitulo: '',
    descripcion: '',
    categoria: '',
    subcategoria: '',
    nivel: '',
    idioma: 'Español',
    duracion: '',
    duracionUnidad: 'horas',
  });
  const [objetivos, setObjetivos] = useState([
    'Comprender los fundamentos del tema',
    'Resolver problemas con habilidades adquiridas',
    '',
    '',
  ]);
  const [requisitos, setRequisitos] = useState(['']);
  const [tags, setTags] = useState(['programación', 'principiantes']);
  const [imagen, setImagen] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [estadoActual, setEstadoActual] = useState('borrador');

  const [instructores, setInstructores] = useState([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleToolbarAction = (action) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        replacement = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'heading':
        replacement = `### ${selectedText}`;
        cursorOffset = 4;
        break;
      case 'list':
        replacement = `\n- ${selectedText}`;
        cursorOffset = 3;
        break;
      case 'link':
        replacement = `[${selectedText || 'enlace'}](url)`;
        cursorOffset = 1;
        break;
      default:
        break;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    update('descripcion', newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selectedText.length);
    }, 0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImagen(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagen(file);
    setImagenPreview(URL.createObjectURL(file));
  };

  /* ── Cargar instructores si es admin ── */
  useEffect(() => {
    if (usuario?.rol === 'admin') {
      fetch('/api/admin/instructores')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setInstructores(data);
        })
        .catch(() => {});
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario && !selectedInstructorId && !cursoId) {
      setSelectedInstructorId(usuario.id);
    }
  }, [usuario, selectedInstructorId, cursoId]);

  /* ── Al montar: verificar si hay un cursoId guardado y cargarlo ── */
  useEffect(() => {
    const id = sessionStorage.getItem('saberhub_curso_id');
    if (id) {
      setCursoId(id);
      fetch(`/api/cursos/${id}`)
        .then((r) => r.json())
        .then((curso) => {
          if (curso && curso.titulo) {
            setForm((p) => ({
              ...p,
              titulo: curso.titulo || '',
              subtitulo: curso.subtitulo || '',
              descripcion: curso.descripcion || '',
              categoria: curso.categoria?.nombre || '',
              subcategoria: curso.subcategoria || '',
              nivel: curso.nivel || '',
              idioma: curso.idioma || 'Español',
              duracion: curso.duracion || '',
              duracionUnidad: curso.duracionUnidad || 'horas',
            }));
            if (Array.isArray(curso.objetivos)) {
              setObjetivos(curso.objetivos.length > 0 ? curso.objetivos : ['', '']);
            }
            if (Array.isArray(curso.requisitos)) {
              setRequisitos(curso.requisitos.length > 0 ? curso.requisitos : ['']);
            }
            if (Array.isArray(curso.tags)) {
              setTags(curso.tags);
            }
            if (curso.imgPortada && !curso.imgPortada.startsWith('placeholder')) {
              setImagenPreview(curso.imgPortada);
            }
            if (curso.instructorId) {
              setSelectedInstructorId(curso.instructorId);
            }
            if (curso.estado) {
              setEstadoActual(curso.estado);
            }
          }
        })
        .catch(() => {})
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, []);

  const update = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };



  const validate = () => {
    const errs = {};
    if (!form.titulo.trim()) errs.titulo = 'El título es obligatorio';
    else if (form.titulo.trim().length < 10)
      errs.titulo = 'El título es muy corto, recomendamos al menos 30 caracteres';
    if (!form.descripcion.trim()) errs.descripcion = 'La descripción es obligatoria';
    if (!form.categoria) errs.categoria = 'Selecciona una categoría';
    if (!form.nivel) errs.nivel = 'Selecciona el nivel del curso';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const guardarCurso = async (asBorrador = false) => {
    setLoading(true);
    try {
      /* 1. Subir imagen si hay una nueva */
      let imgUrl =
        imagenPreview && !imagenPreview.startsWith('blob:')
          ? imagenPreview
          : 'placeholder://pending';
      if (imagen) {
        const fd = new FormData();
        fd.append('file', imagen);
        const up = await fetch('/api/upload', { method: 'POST', body: fd });
        if (up.ok) {
          const d = await up.json();
          imgUrl = d.url;
        }
      }

      const body = {
        titulo: form.titulo,
        subtitulo: form.subtitulo,
        descripcion: form.descripcion,
        categoria: form.categoria,
        subcategoria: form.subcategoria,
        nivel: form.nivel,
        idioma: form.idioma,
        duracion: form.duracion ? parseInt(form.duracion, 10) : null,
        duracionUnidad: form.duracionUnidad,
        objetivos: objetivos.filter(Boolean),
        requisitos: requisitos.filter(Boolean),
        tags: tags.filter(Boolean),
        estado: estadoActual || 'borrador',
        imgPortada: imgUrl,
        instructorId: usuario?.rol === 'admin' ? selectedInstructorId || usuario?.id : usuario?.id,
        institucionId: null,
      };

      let res;
      let data;

      if (cursoId) {
        /* Actualizar curso existente */
        res = await fetch(`/api/cursos/${cursoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        data = await res.json();
      } else {
        /* Crear nuevo curso */
        res = await fetch('/api/cursos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        data = await res.json();
        if (res.ok && data.curso?.id) {
          const id = data.curso.id;
          setCursoId(id);
          sessionStorage.setItem('saberhub_curso_id', id);
        }
      }

      if (!res.ok) {
        setErrors({ global: data.message || 'Error al guardar el curso' });
        return false;
      }

      setSavedAt(new Date());
      return true;
    } catch (err) {
      setErrors({ global: 'Error de conexión. Intenta de nuevo.' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    await guardarCurso(true);
  };

  const handleSaveAndExit = async () => {
    if (!validate()) return;
    const ok = await guardarCurso(true);
    if (ok) {
      sessionStorage.removeItem('saberhub_curso_id');
      router.push('/dashboard');
    }
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const ok = await guardarCurso(false);
    if (ok) router.push('/CrearCursos/modulos');
  };

  /* ─── Derived ─── */
  const subcats = SUBCATEGORIAS[form.categoria] || [];
  const tituloLen = form.titulo.length;
  const descLen = form.descripcion.length;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="text-[#1E40AF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      <HeaderAdmin usuario={usuario} />

      <main className="max-w-[1440px] mx-auto px-6 lg:px-8 pt-6 pb-24">
        {/* Breadcrumb */}
        <nav className="mb-4" aria-label="Breadcrumb">
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] font-medium mb-2 transition-colors w-fit"
            >
              <ArrowLeft size={14} /> Volver a mis cursos
            </Link>
            <h1 className="font-bold text-[28px] text-[#111827] leading-tight">
              {cursoId ? 'Editar información del curso' : 'Crear nuevo curso'}
            </h1>
            <p className="text-[14px] text-[#6B7280] font-normal mt-1">
              Completa la información básica para empezar a estructurar tu curso.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex items-center gap-2 bg-white border border-[#D1D5DB] px-4 py-3 rounded text-[14px] font-semibold text-[#111827] hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Guardar como borrador
            </button>
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={loading}
              className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-3 rounded text-[14px] font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Guardar y salir
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-5 py-3 rounded text-[14px] font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              Continuar → Módulos
            </button>
          </div>
        </div>

        {/* Stepper */}
        <Stepper current={1} />

        {/* Global error */}
        {errors.global && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#EF4444] rounded px-4 py-3 mb-6 text-[#991B1B] text-[13px] font-medium">
            <AlertCircle size={15} /> {errors.global}
          </div>
        )}

        {/* Two-column layout */}
        <form id="crear-curso-form" onSubmit={handleContinue}>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* ══════════════ LEFT COLUMN ══════════════ */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {/* Card 1: Información esencial */}
              <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-8">
                <h2 className="font-bold text-[18px] text-[#111827] mb-6">Información esencial</h2>

                <div className="flex flex-col gap-6">
                  {/* Título */}
                  <div>
                    <label
                      htmlFor="titulo"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Título del curso <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      id="titulo"
                      type="text"
                      value={form.titulo}
                      onChange={(e) => update('titulo', e.target.value)}
                      maxLength={100}
                      placeholder="Ej. Fundamentos de Python para Principiantes"
                      className={`w-full h-12 px-4 border rounded text-[14px] text-[#111827] outline-none transition-all focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] ${
                        errors.titulo ? 'border-[#EF4444]' : 'border-[#D1D5DB]'
                      }`}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[12px] text-[#6B7280]">
                        Un buen título es claro, específico y atractivo.
                      </span>
                      <span
                        className={`text-[12px] ${tituloLen > 80 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}
                      >
                        {tituloLen}/100
                      </span>
                    </div>
                    {errors.titulo && (
                      <p className="text-[12px] text-[#92400E] bg-[#FEF3C7] border border-[#F59E0B] rounded px-2 py-1 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.titulo}
                      </p>
                    )}
                  </div>

                  {/* Subtítulo */}
                  <div>
                    <label
                      htmlFor="subtitulo"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Subtítulo (opcional)
                    </label>
                    <input
                      id="subtitulo"
                      type="text"
                      value={form.subtitulo}
                      onChange={(e) => update('subtitulo', e.target.value)}
                      placeholder="Ej. Aprende a programar desde cero en 8 semanas"
                      className="w-full h-11 px-4 border border-[#D1D5DB] rounded text-[14px] text-[#111827] outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all"
                    />
                    <p className="text-[12px] text-[#6B7280] mt-1">
                      Aparecerá debajo del título en el listado de cursos.
                    </p>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label
                      htmlFor="descripcion"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Descripción completa <span className="text-[#EF4444]">*</span>
                    </label>
                    <div
                      className={`border rounded overflow-hidden transition-all focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#DBEAFE] ${errors.descripcion ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                    >
                      <RichToolbar onAction={handleToolbarAction} />
                      <textarea
                        ref={textareaRef}
                        id="descripcion"
                        value={form.descripcion}
                        onChange={(e) => update('descripcion', e.target.value)}
                        maxLength={2000}
                        placeholder="Describe qué aprenderán los estudiantes, para quién es el curso y qué lo hace especial..."
                        className="w-full min-h-[200px] p-4 text-[14px] text-[#111827] outline-none resize-y bg-white"
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      {errors.descripcion ? (
                        <p className="text-[12px] text-[#991B1B]">{errors.descripcion}</p>
                      ) : (
                        <span className="text-[12px] text-[#6B7280]"> </span>
                      )}
                      <span
                        className={`text-[12px] ${descLen > 1800 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}
                      >
                        {descLen}/2000
                      </span>
                    </div>
                  </div>

                  {/* Objetivos */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1">
                      Lo que aprenderán <span className="text-[#EF4444]">*</span>
                    </label>
                    <p className="text-[12px] text-[#6B7280] mb-3">
                      Lista de habilidades. Recomendamos entre 4 y 8 puntos.
                    </p>
                    <DynamicList
                      items={objetivos}
                      setItems={setObjetivos}
                      placeholder="Comprender los conceptos clave..."
                      icon="check"
                    />
                  </div>

                  {/* Requisitos */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1">
                      Requisitos previos (opcional)
                    </label>
                    <p className="text-[12px] text-[#6B7280] mb-3">
                      ¿Qué deben saber o tener antes de tomar el curso?
                    </p>
                    <DynamicList
                      items={requisitos}
                      setItems={setRequisitos}
                      placeholder="Ej. Computador con acceso a internet"
                      icon="bullet"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Categorización */}
              <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-8">
                <h2 className="font-bold text-[18px] text-[#111827] mb-6">Categorización</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Categoría */}
                  <div>
                    <label
                      htmlFor="categoria"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Categoría principal <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="categoria"
                        value={form.categoria}
                        onChange={(e) => {
                          update('categoria', e.target.value);
                          update('subcategoria', '');
                        }}
                        className={`w-full h-11 pl-4 pr-10 border rounded text-[13px] text-[#111827] outline-none appearance-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all cursor-pointer ${errors.categoria ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                      >
                        <option value="">Selecciona una categoría</option>
                        {CATEGORIAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E40AF] pointer-events-none"
                      />
                    </div>
                    {errors.categoria && (
                      <p className="text-[12px] text-[#991B1B] mt-1">{errors.categoria}</p>
                    )}
                  </div>

                  {/* Subcategoría */}
                  <div>
                    <label
                      htmlFor="subcategoria"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Subcategoría (opcional)
                    </label>
                    <div className="relative">
                      <select
                        id="subcategoria"
                        value={form.subcategoria}
                        onChange={(e) => update('subcategoria', e.target.value)}
                        disabled={!form.categoria}
                        className="w-full h-11 pl-4 pr-10 border border-[#D1D5DB] rounded text-[13px] text-[#111827] outline-none appearance-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Selecciona una subcategoría</option>
                        {subcats.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E40AF] pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Instructor asignado (solo visible para admin) */}
                  {usuario?.rol === 'admin' && (
                    <div className="md:col-span-2">
                      <label
                        htmlFor="instructor"
                        className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                      >
                        Instructor asignado <span className="text-[#EF4444]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="instructor"
                          value={selectedInstructorId}
                          onChange={(e) => setSelectedInstructorId(e.target.value)}
                          className="w-full h-11 pl-4 pr-10 border border-[#D1D5DB] rounded text-[13px] text-[#111827] outline-none appearance-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all cursor-pointer"
                        >
                          <option value="">Selecciona un instructor</option>
                          {instructores.map((ins) => (
                            <option key={ins.id} value={ins.id}>
                              {ins.nombre} ({ins.email})
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E40AF] pointer-events-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Nivel */}
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">
                      Nivel <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="flex gap-3">
                      {NIVELES.map((n) => {
                        const sel = form.nivel === n;
                        const s = NIVEL_STYLES[n];
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => update('nivel', n)}
                            className="flex-1 h-11 rounded border-2 text-[14px] font-semibold transition-all"
                            style={
                              sel
                                ? { background: s.bg, borderColor: s.border, color: s.text }
                                : { background: '#fff', borderColor: '#D1D5DB', color: '#111827' }
                            }
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                    {errors.nivel && (
                      <p className="text-[12px] text-[#991B1B] mt-1">{errors.nivel}</p>
                    )}
                  </div>

                  {/* Idioma */}
                  <div>
                    <label
                      htmlFor="idioma"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Idioma del curso <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="idioma"
                        value={form.idioma}
                        onChange={(e) => update('idioma', e.target.value)}
                        className="w-full h-11 pl-4 pr-10 border border-[#D1D5DB] rounded text-[13px] text-[#111827] outline-none appearance-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#DBEAFE] transition-all"
                      >
                        <option>Español</option>
                        <option>Inglés</option>
                        <option>Francés</option>
                        <option>Portugués</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E40AF] pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Duración */}
                  <div>
                    <label
                      htmlFor="duracion"
                      className="block text-[13px] font-medium text-[#4B5563] mb-1.5"
                    >
                      Duración estimada (opcional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="duracion"
                        type="number"
                        min={1}
                        value={form.duracion}
                        onChange={(e) => update('duracion', e.target.value)}
                        placeholder="8"
                        className="w-24 h-11 px-3 border border-[#D1D5DB] rounded text-[13px] text-[#111827] outline-none focus:border-[#1E40AF] transition-all"
                      />
                      <div className="flex rounded border border-[#D1D5DB] overflow-hidden">
                        {['horas', 'semanas'].map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => update('duracionUnidad', u)}
                            className={`px-4 h-11 text-[13px] font-medium transition-colors capitalize ${
                              form.duracionUnidad === u
                                ? 'bg-[#1E40AF] text-white'
                                : 'bg-white text-[#4B5563] hover:bg-gray-50'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Detalles adicionales */}
              <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-8">
                <h2 className="font-bold text-[18px] text-[#111827] mb-6">Detalles adicionales</h2>
                <div className="flex flex-col gap-6">
                  {/* Tags */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">
                      Etiquetas
                    </label>
                    <TagInput tags={tags} setTags={setTags} />
                    <p className="text-[12px] text-[#6B7280] mt-1">
                      Ayudan a los estudiantes a encontrar tu curso. Presiona Enter para agregar.
                    </p>
                  </div>


                </div>
              </div>
            </div>

            {/* ══════════════ RIGHT SIDEBAR ══════════════ */}
            <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-5 lg:sticky lg:top-24">
              {/* Card: Imagen de portada */}
              <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-6">
                <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-4">
                  Imagen de portada
                </p>
                {imagenPreview && !imagenPreview.startsWith('placeholder') ? (
                  <div className="relative">
                    <div className="w-full aspect-video rounded overflow-hidden">
                      <img
                        src={imagenPreview}
                        alt="Preview portada"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagen(null);
                        setImagenPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-white border border-[#D1D5DB] rounded-full flex items-center justify-center text-[#6B7280] hover:text-[#EF4444] transition-colors shadow-sm"
                    >
                      <X size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-[13px] text-[#1E40AF] font-medium hover:text-[#1E3A8A] transition-colors"
                    >
                      Cambiar imagen
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="w-full aspect-video bg-[#F9FAFB] border-2 border-dashed border-[#D1D5DB] rounded flex flex-col items-center justify-center gap-2 hover:border-[#1E40AF] hover:bg-[#EFF6FF] transition-all cursor-pointer"
                  >
                    <ImageIcon size={32} className="text-[#9CA3AF]" />
                    <span className="font-semibold text-[13px] text-[#4B5563] text-center px-4">
                      Arrastra una imagen o haz clic para subir
                    </span>
                    <span className="text-[11px] text-[#6B7280] text-center px-4">
                      Recomendado: 1280×720 px, máx 2MB. JPG, PNG, WebP.
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />
              </div>

              {/* Card: Vista previa */}
              <div className="bg-white border border-[#F3F4F6] rounded border-b-2 border-b-[#1E40AF] p-6">
                <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-4">
                  Vista previa
                </p>
                <div
                  className="border border-[#F3F4F6] rounded overflow-hidden"
                  style={{ borderBottomWidth: 2, borderBottomColor: '#1E40AF' }}
                >
                  <div className="relative w-full aspect-video bg-[#F3F4F6] flex items-center justify-center overflow-hidden">
                    {imagenPreview && !imagenPreview.startsWith('placeholder') ? (
                      <img
                        src={imagenPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={28} className="text-[#D1D5DB]" />
                    )}
                    <div className="absolute top-2 left-2 bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      BORRADOR
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <Play size={16} className="text-[#111827] ml-0.5" fill="#111827" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 size={11} className="text-[#4B5563] flex-shrink-0" />
                      <span className="text-[11px] text-[#4B5563] font-medium truncate">
                        SaberHub
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BookOpen size={11} className="text-[#4B5563] flex-shrink-0" />
                      <span className="text-[11px] text-[#4B5563] font-medium">
                        Course | Self-paced
                      </span>
                    </div>
                    <p className="font-bold text-[13px] text-[#111827] leading-tight line-clamp-2 mb-0.5">
                      {form.titulo || 'Título del curso'}
                    </p>
                    <p className="text-[11px] text-[#6B7280] truncate mb-1.5">
                      {form.subtitulo || 'Subtítulo del curso'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-[#6B7280]" />
                      <span className="text-[10px] text-[#6B7280]">
                        {form.duracion
                          ? `${form.duracion} ${form.duracionUnidad}`
                          : 'Sin fecha definida'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Tips */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb size={16} className="text-[#1E40AF] flex-shrink-0 mt-0.5" />
                  <span className="font-semibold text-[13px] text-[#1E40AF]">
                    Tips para destacar
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5 pl-1">
                  {[
                    'Usa un título descriptivo y específico',
                    'La descripción debe responder ¿qué aprenderé?',
                    "Incluye al menos 5 puntos en 'Lo que aprenderán'",
                    'Una imagen llamativa aumenta las inscripciones 3x',
                  ].map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[12px] text-[#1E3A8A] leading-relaxed"
                    >
                      <span className="text-[#1E40AF] mt-0.5 flex-shrink-0">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Save indicator */}
      {savedAt && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-[#F3F4F6] rounded px-4 py-2 shadow-sm">
          <Check size={13} className="text-[#10B981]" />
          <span className="text-[12px] text-[#6B7280] font-normal">
            Guardado a las{' '}
            {savedAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}

      <FooterAdmin />
    </div>
  );
}
