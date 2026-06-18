'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  GripVertical,
  Plus,
  X,
  Pencil,
  Copy,
  Check,
  Timer,
  RotateCcw,
  Award,
  HelpCircle,
  Lightbulb,
  FileText,
  MessageSquare,
  List,
  AlignLeft,
  CheckSquare,
  Save,
  Loader2,
  CheckCircle,
  Search,
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import FooterAdmin from '@/app/dashboard/components/FooterAdmin';

/* ────────────────────────────────────────────────────────
   CONSTANTS
──────────────────────────────────────────────────────── */
const QUESTION_TYPES = [
  {
    key: 'opcion_multiple',
    label: 'Opción múltiple',
    short: 'OM',
    desc: '1 o varias correctas',
    icon: List,
    color: 'blue',
  },
  {
    key: 'verdadero_falso',
    label: 'Verdadero/Falso',
    short: 'VF',
    desc: 'Solo 2 opciones',
    icon: CheckSquare,
    color: 'blue',
  },
  {
    key: 'respuesta_corta',
    label: 'Respuesta corta',
    short: 'RC',
    desc: 'Texto libre corto',
    icon: MessageSquare,
    color: 'purple',
  },
  {
    key: 'desarrollo',
    label: 'Desarrollo',
    short: 'DES',
    desc: 'Respuesta larga manual',
    icon: AlignLeft,
    color: 'orange',
  },
];

/* ────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────── */
function typeBadge(tipo) {
  const t = QUESTION_TYPES.find((q) => q.key === tipo);
  if (!t) return null;
  const colors = {
    blue: 'bg-[#DBEAFE] text-[#1E40AF]',
    purple: 'bg-[#EDE9FE] text-[#6B21A8]',
    orange: 'bg-[#FEF3C7] text-[#92400E]',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] font-semibold text-[11px] uppercase tracking-wide ${colors[t.color]}`}
    >
      {t.short}
    </span>
  );
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:ring-offset-1 flex-shrink-0 ${
        checked ? 'bg-[#1E40AF]' : 'bg-[#D1D5DB]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function Card({ children, className = '', noBlue = false }) {
  return (
    <div
      className={`bg-white border border-[#F3F4F6] rounded-[4px] ${
        !noBlue ? 'border-b-2 border-b-[#1E40AF]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   DONUT CHART
──────────────────────────────────────────────────────── */
function DonutChart({ assigned, total }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(assigned / total, 1) : 0;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[100px] h-[100px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="14" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#1E40AF"
            strokeWidth="14"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-[16px] text-[#111827]">
            {assigned}/{total}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 mt-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 rounded-[2px] bg-[#1E40AF] flex-shrink-0" />
          <span className="font-medium text-[12px] text-[#374151]">Asignados: {assigned} pts</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 rounded-[2px] bg-[#F3F4F6] border border-[#D1D5DB] flex-shrink-0" />
          <span className="font-medium text-[12px] text-[#374151]">
            Restantes: {total - assigned} pts
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   STEPPER (idéntico al de ModulosEditor)
──────────────────────────────────────────────────────── */
const STEPS_LIST = [
  { n: 1, label: 'Información' },
  { n: 2, label: 'Módulos' },
  { n: 3, label: 'Evaluaciones' },
  { n: 4, label: 'Configuración' },
  { n: 5, label: 'Publicar' },
];

function StepperModulos({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full overflow-x-auto py-2">
      {STEPS_LIST.map((step, idx) => {
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
            {idx < STEPS_LIST.length - 1 && (
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

/* ────────────────────────────────────────────────────────
   QUESTION MODAL
──────────────────────────────────────────────────────── */
function QuestionModal({ open, onClose, onSave, editQuestion }) {
  const [tipo, setTipo] = useState(editQuestion?.tipo || 'opcion_multiple');
  const [enunciado, setEnunciado] = useState(editQuestion?.enunciado || '');
  const [puntos, setPuntos] = useState(editQuestion?.puntos || 2);
  const [opciones, setOpciones] = useState(
    editQuestion?.opciones?.length
      ? editQuestion.opciones
      : [
          { id: 'o1', texto: '', correcta: false },
          { id: 'o2', texto: '', correcta: false },
          { id: 'o3', texto: '', correcta: false },
          { id: 'o4', texto: '', correcta: false },
        ]
  );
  const [guardarBanco, setGuardarBanco] = useState(true);
  const [etiquetas, setEtiquetas] = useState('');
  const modalRef = useRef(null);



  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // When type changes, update opciones
  useEffect(() => {
    if (tipo === 'verdadero_falso') {
      setOpciones([
        { id: 'o1', texto: 'Verdadero', correcta: false },
        { id: 'o2', texto: 'Falso', correcta: false },
      ]);
    } else if (tipo === 'opcion_multiple' && opciones.length < 2) {
      setOpciones([
        { id: 'o1', texto: '', correcta: false },
        { id: 'o2', texto: '', correcta: false },
        { id: 'o3', texto: '', correcta: false },
        { id: 'o4', texto: '', correcta: false },
      ]);
    }
  }, [tipo]);

  function toggleCorrect(id) {
    setOpciones((prev) =>
      prev.map((o) => ({ ...o, correcta: o.id === id ? !o.correcta : o.correcta }))
    );
  }

  function updateOpcion(id, value) {
    setOpciones((prev) => prev.map((o) => (o.id === id ? { ...o, texto: value } : o)));
  }

  function removeOpcion(id) {
    setOpciones((prev) => prev.filter((o) => o.id !== id));
  }

  function addOpcion() {
    setOpciones((prev) => [...prev, { id: `o${Date.now()}`, texto: '', correcta: false }]);
  }

  function handleSave(addAnother = false) {
    if (!enunciado.trim()) return;
    const q = {
      id: editQuestion?.id || `q${Date.now()}`,
      tipo,
      enunciado,
      puntos: Number(puntos),
      opciones: tipo === 'opcion_multiple' || tipo === 'verdadero_falso' ? opciones : [],
      manual: tipo === 'desarrollo',
      guardarBanco,
    };
    onSave(q, addAnother);
    if (!addAnother) onClose();
    else {
      setEnunciado('');
      setOpciones([
        { id: 'o1', texto: '', correcta: false },
        { id: 'o2', texto: '', correcta: false },
        { id: 'o3', texto: '', correcta: false },
        { id: 'o4', texto: '', correcta: false },
      ]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-[8px] w-full max-w-[680px] max-h-[90vh] overflow-y-auto outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-[#F3F4F6]">
          <h2 id="modal-title" className="font-bold text-[20px] text-[#111827]">
            {editQuestion ? 'Editar pregunta' : 'Nueva pregunta'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-[#6B7280] hover:text-[#111827] p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          {/* 1. Tipo */}
          <div>
            <label className="font-medium text-[13px] text-[#374151] block mb-3">
              Tipo de pregunta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {QUESTION_TYPES.map((qt) => {
                const Icon = qt.icon;
                const sel = tipo === qt.key;
                return (
                  <button
                    key={qt.key}
                    onClick={() => setTipo(qt.key)}
                    className={`flex flex-col items-center gap-1.5 p-3.5 rounded-[4px] border-2 cursor-pointer transition-all text-center ${
                      sel
                        ? 'border-[#1E40AF] bg-[#EFF6FF]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#93C5FD]'
                    }`}
                  >
                    <Icon size={22} className={sel ? 'text-[#1E40AF]' : 'text-[#6B7280]'} />
                    <span
                      className={`font-semibold text-[13px] ${
                        sel ? 'text-[#1E40AF]' : 'text-[#374151]'
                      }`}
                    >
                      {qt.label}
                    </span>
                    <span className="font-normal text-[11px] text-[#9CA3AF]">{qt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Enunciado */}
          <div>
            <label
              htmlFor="modal-enunciado"
              className="font-medium text-[13px] text-[#374151] block mb-1.5"
            >
              Enunciado de la pregunta *
            </label>
            <textarea
              id="modal-enunciado"
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Escribe aquí la pregunta..."
              className="w-full border border-[#D1D5DB] rounded-[4px] px-4 py-3 text-[14px] text-[#111827] placeholder-[#9CA3AF] resize-none focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
            />
            <p className="text-[11px] text-[#9CA3AF] text-right mt-1">
              {enunciado.length} / 500 caracteres
            </p>
          </div>

          {/* 3. Opciones (OM o VF) */}
          {(tipo === 'opcion_multiple' || tipo === 'verdadero_falso') && (
            <div>
              <label className="font-medium text-[13px] text-[#374151] block mb-0.5">
                Opciones de respuesta *
              </label>
              <p className="text-[12px] text-[#6B7280] mb-3">
                Marca la casilla de la opción o las opciones correctas.
              </p>
              <div className="flex flex-col gap-2.5">
                {opciones.map((op, idx) => (
                  <div key={op.id} className="flex items-center gap-2.5">
                    <GripVertical size={14} className="text-[#9CA3AF] flex-shrink-0 cursor-grab" />
                    <button
                      onClick={() => toggleCorrect(op.id)}
                      aria-label={`Marcar opción ${idx + 1} como correcta`}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        op.correcta ? 'bg-[#1E40AF] border-[#1E40AF]' : 'bg-white border-[#D1D5DB]'
                      }`}
                    >
                      {op.correcta && <Check size={11} className="text-white" strokeWidth={3} />}
                    </button>
                    <input
                      type="text"
                      value={op.texto}
                      onChange={(e) => updateOpcion(op.id, e.target.value)}
                      disabled={tipo === 'verdadero_falso'}
                      placeholder={`Escribe la opción ${idx + 1}...`}
                      className="flex-1 border border-[#D1D5DB] rounded-[4px] px-3 h-10 text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors disabled:bg-[#F9FAFB] disabled:text-[#6B7280]"
                    />
                    {tipo === 'opcion_multiple' && opciones.length > 2 && (
                      <button
                        onClick={() => removeOpcion(op.id)}
                        aria-label="Eliminar opción"
                        className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors flex-shrink-0"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {tipo === 'opcion_multiple' && (
                <button
                  onClick={addOpcion}
                  className="mt-3 w-full h-9 border border-dashed border-[#93C5FD] text-[#1E40AF] rounded-[4px] font-semibold text-[13px] hover:bg-[#EFF6FF] transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  Agregar opción
                </button>
              )}
            </div>
          )}

          {/* 4. Config */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F3F4F6]">
            <div>
              <label
                htmlFor="modal-puntos"
                className="font-medium text-[13px] text-[#374151] block mb-1.5"
              >
                Puntos
              </label>
              <input
                id="modal-puntos"
                type="number"
                min={1}
                max={100}
                value={puntos}
                onChange={(e) => setPuntos(e.target.value)}
                className="w-full h-10 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
              />
            </div>
            <div>
              <label className="font-medium text-[13px] text-[#374151] block mb-1.5">
                Guardar en banco
              </label>
              <div className="flex items-center gap-2 h-10">
                <Toggle id="modal-banco" checked={guardarBanco} onChange={setGuardarBanco} />
                <span className="font-medium text-[13px] text-[#111827]">
                  {guardarBanco ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <label
                htmlFor="modal-etiquetas"
                className="font-medium text-[13px] text-[#374151] block mb-1.5"
              >
                Etiquetas (Enter para agregar)
              </label>
              <input
                id="modal-etiquetas"
                type="text"
                value={etiquetas}
                onChange={(e) => setEtiquetas(e.target.value)}
                placeholder="Ej. python, variables, fundamentos"
                className="w-full h-10 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-8 pb-8 pt-4 border-t border-[#F3F4F6]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-[#D1D5DB] rounded-[4px] font-semibold text-[14px] text-[#111827] hover:bg-[#F9FAFB] transition-colors"
          >
            Cancelar
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave(true)}
              disabled={!enunciado.trim()}
              className="px-4 py-2.5 border border-[#1E40AF] rounded-[4px] font-semibold text-[14px] text-[#1E40AF] hover:bg-[#EFF6FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar y agregar otra →
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={!enunciado.trim()}
              className="px-5 py-2.5 bg-[#1E40AF] hover:bg-[#1A368F] text-white rounded-[4px] font-semibold text-[14px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Guardar pregunta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   QUESTION ROW
──────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────
   BANCO DE PREGUNTAS MODAL
──────────────────────────────────────────────────────── */
function BancoPreguntasModal({ open, onClose, onAddQuestions }) {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch('/api/banco').then((r) => r.json()),
        fetch('/api/banco/categorias').then((r) => r.json()),
      ])
        .then(([qData, cData]) => {
          if (Array.isArray(qData)) setQuestions(qData);
          if (Array.isArray(cData)) setCategories(cData);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.pregunta.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || q.categoriaId === selectedCategory;
    const matchesType = !selectedType || q.tipo === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  }

  function handleAdd() {
    const toAdd = questions.filter((q) => selectedIds.has(q.id));
    onAddQuestions(toAdd);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-[8px] w-full max-w-[800px] max-h-[85vh] flex flex-col outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="banco-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
          <div>
            <h2 id="banco-modal-title" className="font-bold text-[18px] text-[#111827]">
              Banco de preguntas
            </h2>
            <p className="text-[12px] text-[#6B7280]">
              Selecciona las preguntas que deseas añadir a la evaluación.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-[#6B7280] hover:text-[#111827] p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Buscar preguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-[#D1D5DB] rounded-[4px] text-[14px] text-[#111827] focus:outline-none focus:border-[#1E40AF] transition-colors"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] text-[#374151] focus:outline-none focus:border-[#1E40AF]"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c._count?.preguntas || 0})
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] text-[#374151] focus:outline-none focus:border-[#1E40AF]"
          >
            <option value="">Todos los tipos</option>
            {QUESTION_TYPES.map((qt) => (
              <option key={qt.key} value={qt.key}>
                {qt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#1E40AF] mb-2" size={32} />
              <span className="text-[13px] text-[#6B7280]">Cargando banco de preguntas...</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle size={36} className="mx-auto mb-3 text-[#D1D5DB]" />
              <p className="font-medium text-[14px] text-[#6B7280]">
                No se encontraron preguntas en el banco.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleSelect(q.id)}
                    className={`p-4 border rounded-[4px] cursor-pointer transition-colors flex items-start gap-3 select-none ${
                      isSelected
                        ? 'border-[#1E40AF] bg-[#EFF6FF]'
                        : 'border-[#E5E7EB] hover:border-[#BFDBFE]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="mt-1 w-4 h-4 text-[#1E40AF] border-[#D1D5DB] rounded focus:ring-[#1E40AF]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="bg-[#E5E7EB] text-[#374151] font-semibold text-[10px] px-2 py-0.5 rounded-[4px] uppercase">
                          {QUESTION_TYPES.find((qt) => qt.key === q.tipo)?.label || q.tipo}
                        </span>
                        {q.categoria && (
                          <span className="bg-[#EFF6FF] text-[#1E40AF] font-semibold text-[10px] px-2 py-0.5 rounded-[4px]">
                            {q.categoria.nombre}
                          </span>
                        )}
                        <span className="text-[11px] text-[#6B7280]">
                          {q.puntos} pt{q.puntos !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="font-semibold text-[14px] text-[#111827] mb-2">
                        {q.pregunta}
                      </p>
                      {q.opciones && q.opciones.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 pl-4 border-l-2 border-[#E5E7EB]">
                          {q.opciones.map((o) => (
                            <div key={o.id} className="flex items-center gap-1.5 text-[12px]">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  o.esCorrecta ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'
                                }`}
                              />
                              <span className={o.esCorrecta ? 'font-semibold text-[#10B981]' : 'text-[#4B5563]'}>
                                {o.textoOpcion}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F3F4F6]">
          <button
            onClick={toggleSelectAll}
            disabled={filteredQuestions.length === 0}
            className="text-[13px] text-[#1E40AF] hover:underline font-semibold disabled:opacity-40 disabled:no-underline"
          >
            {selectedIds.size === filteredQuestions.length
              ? 'Deseleccionar todas'
              : 'Seleccionar todas las filtradas'}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#D1D5DB] rounded-[4px] font-semibold text-[13px] text-[#374151] hover:bg-[#F9FAFB] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 bg-[#1E40AF] hover:bg-[#1A368F] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed text-white rounded-[4px] font-semibold text-[13px] transition-colors"
            >
              Agregar seleccionadas ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionRow({ q, idx, onEdit, onDuplicate, onDelete, dragProps }) {
  return (
    <div
      className="flex items-center gap-3 bg-white border border-[#F3F4F6] rounded-[4px] p-4 group hover:border-[#BFDBFE] transition-colors"
      {...dragProps}
    >
      <GripVertical
        size={16}
        className="text-[#9CA3AF] cursor-grab flex-shrink-0"
        aria-hidden="true"
      />
      <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
        <span className="font-bold text-[13px] text-[#1E40AF]">{idx + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {typeBadge(q.tipo)}
          <span className="font-medium text-[12px] text-[#6B7280]">
            {q.puntos} pt{q.puntos !== 1 ? 's' : ''}
          </span>
          {q.manual && (
            <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-semibold px-2 py-0.5 rounded-[4px] uppercase">
              Manual
            </span>
          )}
        </div>
        <p className="font-medium text-[14px] text-[#111827] truncate mt-0.5">{q.enunciado}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(q)}
          aria-label="Editar pregunta"
          className="flex items-center gap-1 px-2.5 py-1.5 border border-[#1E40AF] text-[#1E40AF] rounded-[4px] text-[12px] font-semibold hover:bg-[#EFF6FF] transition-colors"
        >
          <Pencil size={12} />
          Editar
        </button>
        <button
          onClick={() => onDuplicate(q)}
          aria-label="Duplicar pregunta"
          className="p-1.5 border border-[#D1D5DB] text-[#6B7280] rounded-[4px] hover:bg-[#F9FAFB] transition-colors"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={() => onDelete(q.id)}
          aria-label="Eliminar pregunta"
          className="p-1.5 border border-[#FCA5A5] text-[#DC2626] rounded-[4px] hover:bg-[#FEF2F2] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────── */
export default function EvaluacionEditor({ usuario }) {
  const router = useRouter();
  const [cursoId, setCursoId] = useState(null);
  const [existingEvalId, setExistingEvalId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [totalRequerido, setTotalRequerido] = useState(50);
  const [autoAdjust, setAutoAdjust] = useState(false);
  const [bancoOpen, setBancoOpen] = useState(false);
  const [evaluacionesList, setEvaluacionesList] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Config state
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modulos, setModulos] = useState([]);
  const [selectedModuloId, setSelectedModuloId] = useState('');
  const [tipoEval, setTipoEval] = useState('modulo');
  const [tiempoLimite, setTiempoLimite] = useState(30);
  const [sinLimite, setSinLimite] = useState(false);
  const [intentos, setIntentos] = useState(3);
  const [intentosIlimitados, setIntentosIlimitados] = useState(false);
  const [notaMinima, setNotaMinima] = useState(70);
  const [esperaIntentos, setEsperaIntentos] = useState(24);
  const [sinEspera, setSinEspera] = useState(false);

  const [opts, setOpts] = useState({
    aleatorio: true,
    mostrarRespuestas: true,
    unaPorUna: false,
    volverAtras: false,
  });

  const [dragOver, setDragOver] = useState(null);
  const dragIdx = useRef(null);

  /* ── Cargar cursoId y datos reales desde la BD ── */
  useEffect(() => {
    const id = sessionStorage.getItem('saberhub_curso_id');
    if (id) {
      setCursoId(id);

      // Cargar módulos reales del curso
      fetch(`/api/cursos/${id}/contenido`)
        .then((r) => r.json())
        .then((mods) => {
          if (Array.isArray(mods)) {
            setModulos(mods);
            if (mods.length > 0) {
              setSelectedModuloId(mods[0].id);
            }
          }
        })
        .catch(() => {});

      // Cargar evaluaciones existentes del curso
      fetch(`/api/evaluaciones?cursoId=${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setEvaluacionesList(data);
            if (data.length > 0) {
              const eval1 = data[0];
              setExistingEvalId(eval1.id);
              setTitulo(eval1.titulo || '');
              setDescripcion(eval1.descripcion || '');
              setNotaMinima(eval1.puntajeMinimo || 70);
              setTiempoLimite(eval1.duracionMinutos || 30);
              setSinLimite(!eval1.duracionMinutos);
              setIntentos(eval1.intentosMaximos || 3);
              setTipoEval(eval1.moduloId ? 'modulo' : 'final');
              if (eval1.moduloId) {
                setSelectedModuloId(eval1.moduloId);
              }
              setOpts({
                aleatorio: eval1.ordenAleatorio || false,
                mostrarRespuestas: eval1.mostrarRespuestas || false,
                unaPorUna: false,
                volverAtras: false,
              });
              // Mapear preguntas
              if (eval1.preguntas && eval1.preguntas.length > 0) {
                const mapped = eval1.preguntas.map((p) => ({
                  id: p.id,
                  tipo: p.tipo,
                  enunciado: p.pregunta,
                  puntos: p.puntos,
                  opciones: (p.opciones || []).map((o) => ({
                    id: o.id,
                    texto: o.textoOpcion,
                    correcta: o.esCorrecta,
                  })),
                  manual: p.tipo === 'desarrollo',
                }));
                setQuestions(mapped);
                const sum = mapped.reduce((s, q) => s + q.puntos, 0);
                if (sum > 0) {
                  setTotalRequerido(sum);
                }
              }
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  /* ── Guardar evaluación en BD ── */
  const saveEvaluacion = useCallback(async () => {
    if (!cursoId) {
      setSaveError('No hay un curso activo. Ve al paso 1 primero.');
      return false;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const body = {
        cursoId,
        moduloId: tipoEval === 'modulo' ? selectedModuloId || null : null,
        titulo: titulo || 'Evaluación del curso',
        descripcion,
        puntajeMinimo: Number(notaMinima),
        duracionMinutos: sinLimite ? null : Number(tiempoLimite),
        intentosMaximos: intentosIlimitados ? 999 : Number(intentos),
        ordenAleatorio: opts.aleatorio,
        mostrarRespuestas: opts.mostrarRespuestas,
        creadorId: usuario?.id,
        preguntas: questions.map((q, i) => ({
          id: typeof q.id === 'string' && q.id.startsWith('q') ? undefined : q.id,
          pregunta: q.enunciado,
          tipo: q.tipo,
          puntos: q.puntos,
          orden: i + 1,
          opciones: (q.opciones || []).map((o) => ({
            id: typeof o.id === 'string' && o.id.startsWith('o') ? undefined : o.id,
            textoOpcion: o.texto,
            esCorrecta: o.correcta,
          })),
        })),
      };

      let res;
      let newId = null;
      if (existingEvalId) {
        res = await fetch(`/api/evaluaciones/${existingEvalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/evaluaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const d = await res.json();
          if (d.evaluacion?.id) {
            newId = d.evaluacion.id;
            setExistingEvalId(newId);
          }
        }
      }

      if (!res.ok) {
        const d = await res.json();
        setSaveError(d.message || 'Error al guardar la evaluación');
        return false;
      }

      // Refresh evaluations list
      const r2 = await fetch(`/api/evaluaciones?cursoId=${cursoId}`);
      const data = await r2.json();
      if (Array.isArray(data)) {
        setEvaluacionesList(data);
      }
      setSavedAt(new Date());
      return true;
    } catch {
      setSaveError('Error de conexión. Intenta de nuevo.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    cursoId,
    existingEvalId,
    titulo,
    descripcion,
    notaMinima,
    tiempoLimite,
    sinLimite,
    intentos,
    intentosIlimitados,
    opts,
    questions,
    usuario,
    tipoEval,
    selectedModuloId,
  ]);

  const handleContinue = useCallback(async () => {
    const ok = await saveEvaluacion();
    if (ok) router.push('/CrearCursos/configuracion');
  }, [saveEvaluacion, router]);

  const handleSaveAndExit = useCallback(async () => {
    const ok = await saveEvaluacion();
    if (ok) {
      sessionStorage.removeItem('saberhub_curso_id');
      router.push('/dashboard');
    }
  }, [saveEvaluacion, router]);

  const selectEvaluacion = useCallback((ev) => {
    if (!ev) {
      setExistingEvalId(null);
      setTitulo('');
      setDescripcion('');
      setNotaMinima(70);
      setTiempoLimite(30);
      setSinLimite(false);
      setIntentos(3);
      setIntentosIlimitados(false);
      setTipoEval('modulo');
      if (modulos.length > 0) {
        setSelectedModuloId(modulos[0].id);
      } else {
        setSelectedModuloId('');
      }
      setQuestions([]);
      setTotalRequerido(50);
      return;
    }

    setExistingEvalId(ev.id);
    setTitulo(ev.titulo || '');
    setDescripcion(ev.descripcion || '');
    setNotaMinima(ev.puntajeMinimo || 70);
    setTiempoLimite(ev.duracionMinutos || 30);
    setSinLimite(!ev.duracionMinutos);
    setIntentos(ev.intentosMaximos || 3);
    setTipoEval(ev.moduloId ? 'modulo' : 'final');
    if (ev.moduloId) {
      setSelectedModuloId(ev.moduloId);
    }
    setOpts({
      aleatorio: ev.ordenAleatorio || false,
      mostrarRespuestas: ev.mostrarRespuestas || false,
      unaPorUna: false,
      volverAtras: false,
    });

    if (ev.preguntas && ev.preguntas.length > 0) {
      const mapped = ev.preguntas.map((p) => ({
        id: p.id,
        tipo: p.tipo,
        enunciado: p.pregunta,
        puntos: p.puntos,
        opciones: (p.opciones || []).map((o) => ({
          id: o.id,
          texto: o.textoOpcion,
          correcta: o.esCorrecta,
        })),
        manual: p.tipo === 'desarrollo',
      }));
      setQuestions(mapped);
      const sum = mapped.reduce((s, q) => s + q.puntos, 0);
      if (sum > 0) {
        setTotalRequerido(sum);
      }
    } else {
      setQuestions([]);
      setTotalRequerido(50);
    }
  }, [modulos]);

  const handleDeleteEvalClick = useCallback(async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      const res = await fetch(`/api/evaluaciones/${existingEvalId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmDelete(false);
        const r2 = await fetch(`/api/evaluaciones?cursoId=${cursoId}`);
        const data = await r2.json();
        if (Array.isArray(data)) {
          setEvaluacionesList(data);
          if (data.length > 0) {
            selectEvaluacion(data[0]);
          } else {
            selectEvaluacion(null);
          }
        }
      } else {
        const d = await res.json();
        setSaveError(d.message || 'Error al eliminar la evaluación');
        setConfirmDelete(false);
      }
    } catch {
      setSaveError('Error al eliminar la evaluación.');
      setConfirmDelete(false);
    }
  }, [existingEvalId, confirmDelete, cursoId, selectEvaluacion]);

  const totalPuntos = questions.reduce((s, q) => s + q.puntos, 0);

  const autoDistributePoints = useCallback(() => {
    if (questions.length === 0) return;
    const target = Number(totalRequerido) || 0;
    if (target <= 0) return;

    const count = questions.length;
    const basePoints = Math.max(1, Math.floor(target / count));
    const remainder = target % count;

    setQuestions((prev) =>
      prev.map((q, idx) => {
        const extra = idx < remainder ? 1 : 0;
        return {
          ...q,
          puntos: basePoints + extra,
        };
      })
    );
  }, [questions, totalRequerido]);

  const handleTotalRequeridoChange = useCallback((newVal) => {
    const val = Math.max(1, newVal);
    setTotalRequerido(val);
    if (autoAdjust && questions.length > 0) {
      const count = questions.length;
      const basePoints = Math.max(1, Math.floor(val / count));
      const remainder = val % count;
      setQuestions((prev) =>
        prev.map((q, idx) => ({
          ...q,
          puntos: basePoints + (idx < remainder ? 1 : 0),
        }))
      );
    }
  }, [autoAdjust, questions]);

  const handleToggleAutoAdjust = useCallback((checked) => {
    setAutoAdjust(checked);
    if (checked && questions.length > 0) {
      const target = Number(totalRequerido) || 0;
      if (target <= 0) return;
      const count = questions.length;
      const basePoints = Math.max(1, Math.floor(target / count));
      const remainder = target % count;
      setQuestions((prev) =>
        prev.map((q, idx) => ({
          ...q,
          puntos: basePoints + (idx < remainder ? 1 : 0),
        }))
      );
    }
  }, [questions, totalRequerido]);

  const typeCounts = QUESTION_TYPES.map((qt) => {
    const qs = questions.filter((q) => q.tipo === qt.key);
    return {
      ...qt,
      count: qs.length,
      pts: qs.reduce((s, q) => s + q.puntos, 0),
    };
  }).filter((t) => t.count > 0);

  function openModal(q = null) {
    setEditQuestion(q);
    setModalOpen(true);
  }

  function handleSave(q, addAnother) {
    setQuestions((prev) => {
      const idx = prev.findIndex((x) => x.id === q.id);
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = q;
      } else {
        next = [...prev, q];
      }

      if (autoAdjust && next.length > 0) {
        const target = Number(totalRequerido) || 0;
        if (target > 0) {
          const count = next.length;
          const basePoints = Math.max(1, Math.floor(target / count));
          const remainder = target % count;
          next = next.map((item, idx2) => ({
            ...item,
            puntos: basePoints + (idx2 < remainder ? 1 : 0),
          }));
        }
      }
      return next;
    });

    if (q.guardarBanco) {
      fetch('/api/banco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: q.enunciado,
          tipo: q.tipo,
          puntos: q.puntos,
          opciones: q.opciones.map((o) => ({
            textoOpcion: o.texto,
            esCorrecta: o.correcta,
          })),
        }),
      }).catch((err) => console.error('Error saving question to bank:', err));
    }

    if (!addAnother) setEditQuestion(null);
  }

  function handleDuplicate(q) {
    setQuestions((prev) => {
      let next = [
        ...prev,
        { ...q, id: `q${Date.now()}`, enunciado: `${q.enunciado} (copia)` },
      ];

      if (autoAdjust && next.length > 0) {
        const target = Number(totalRequerido) || 0;
        if (target > 0) {
          const count = next.length;
          const basePoints = Math.max(1, Math.floor(target / count));
          const remainder = target % count;
          next = next.map((item, idx) => ({
            ...item,
            puntos: basePoints + (idx < remainder ? 1 : 0),
          }));
        }
      }
      return next;
    });
  }

  function handleDelete(id) {
    setQuestions((prev) => {
      let next = prev.filter((q) => q.id !== id);

      if (autoAdjust && next.length > 0) {
        const target = Number(totalRequerido) || 0;
        if (target > 0) {
          const count = next.length;
          const basePoints = Math.max(1, Math.floor(target / count));
          const remainder = target % count;
          next = next.map((item, idx) => ({
            ...item,
            puntos: basePoints + (idx < remainder ? 1 : 0),
          }));
        }
      }
      return next;
    });
  }

  const handleAddQuestionsFromBank = useCallback((selectedQuestions) => {
    const mapped = selectedQuestions.map((q) => ({
      id: `q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tipo: q.tipo,
      enunciado: q.pregunta,
      puntos: q.puntos,
      opciones: (q.opciones || []).map((o) => ({
        id: `o${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        texto: o.textoOpcion,
        correcta: o.esCorrecta,
      })),
      manual: q.tipo === 'desarrollo',
    }));

    setQuestions((prev) => {
      let next = [...prev, ...mapped];

      if (autoAdjust && next.length > 0) {
        const target = Number(totalRequerido) || 0;
        if (target > 0) {
          const count = next.length;
          const basePoints = Math.max(1, Math.floor(target / count));
          const remainder = target % count;
          next = next.map((item, idx) => ({
            ...item,
            puntos: basePoints + (idx < remainder ? 1 : 0),
          }));
        }
      }
      return next;
    });
  }, [autoAdjust, totalRequerido]);

  // Drag reorder
  function handleDragStart(e, idx) {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e, idx) {
    e.preventDefault();
    setDragOver(idx);
  }
  function handleDrop(e, idx) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) {
      setDragOver(null);
      return;
    }
    setQuestions((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIdx.current, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    dragIdx.current = null;
    setDragOver(null);
  }

  return (
    <div
      className="min-h-screen bg-white font-sans flex flex-col"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <HeaderAdmin usuario={usuario} />

      {/* Modal */}
      {modalOpen && (
        <QuestionModal
          key={editQuestion?.id || 'new'}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditQuestion(null);
          }}
          onSave={handleSave}
          editQuestion={editQuestion}
        />
      )}

      {/* Modal Banco */}
      {bancoOpen && (
        <BancoPreguntasModal
          open={bancoOpen}
          onClose={() => setBancoOpen(false)}
          onAddQuestions={handleAddQuestionsFromBank}
        />
      )}

      <main className="max-w-[1440px] mx-auto px-6 lg:px-8 pt-6 w-full flex flex-col flex-1">
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
              href="/CrearCursos/modulos"
              className="flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827] font-medium mb-2 transition-colors w-fit"
            >
              <ArrowLeft size={14} /> Volver a módulos
            </Link>
            <h1 className="font-bold text-[28px] text-[#111827] leading-tight">Nueva evaluación</h1>
            <p className="text-[14px] text-[#6B7280] font-normal mt-1">
              Configura los parámetros y agrega las preguntas para este examen.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {saveError && (
              <span className="text-[13px] text-[#EF4444] font-medium max-w-[260px] text-right">
                {saveError}
              </span>
            )}
            {existingEvalId && (
              <div className="flex items-center gap-1.5 mr-2">
                {confirmDelete ? (
                  <>
                    <button
                      onClick={handleDeleteEvalClick}
                      className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-4 py-3 rounded text-[13px] font-semibold transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="bg-white border border-[#D1D5DB] text-[#374151] hover:bg-gray-50 px-4 py-3 rounded text-[13px] font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleDeleteEvalClick}
                    className="bg-white border border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] px-4 py-3 rounded text-[13px] font-semibold transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
            <button
              id="btn-guardar-borrador-eval"
              onClick={saveEvaluacion}
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
              id="btn-continuar-config"
              onClick={handleContinue}
              disabled={saving}
              className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-6 py-3 rounded text-[14px] font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              Continuar → Configuración
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex-shrink-0">
          <StepperModulos current={3} />
        </div>

        {/* Content area */}
        <div className="bg-[#F9FAFB] -mx-6 lg:-mx-8 px-6 lg:px-8 pb-12 pt-4">
          
          {/* Selector de evaluación */}
          <div className="mb-6 bg-white border border-[#E5E7EB] rounded-[4px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[14px] text-[#374151]">
                Evaluación activa:
              </span>
              <select
                value={existingEvalId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) {
                    selectEvaluacion(null);
                  } else {
                    const ev = evaluacionesList.find((x) => x.id === selectedId);
                    selectEvaluacion(ev);
                  }
                }}
                className="h-10 px-3 border border-[#D1D5DB] rounded-[4px] text-[13px] font-semibold text-[#1E40AF] bg-white focus:outline-none focus:border-[#1E40AF]"
              >
                {evaluacionesList.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titulo || 'Sin título'} ({ev.moduloId ? 'Módulo' : 'Examen Final'})
                  </option>
                ))}
                <option value="">+ Crear nueva evaluación</option>
              </select>
            </div>
            
            <button
              onClick={() => selectEvaluacion(null)}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] rounded-[4px] font-semibold text-[13px] transition-colors w-fit"
            >
              <Plus size={14} /> Nueva evaluación
            </button>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.65fr] gap-8">
            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-6">
              {/* Card 1: Información básica */}
              <Card className="p-6">
                <h2 className="font-bold text-[18px] text-[#111827] mb-5">Información básica</h2>
                <div className="flex flex-col gap-5">
                  {/* Título */}
                  <div>
                    <label
                      htmlFor="eval-titulo"
                      className="block font-medium text-[13px] text-[#374151] mb-1.5"
                    >
                      Título *
                    </label>
                    <input
                      id="eval-titulo"
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej. Examen Módulo 1: Fundamentos de Python"
                      className="w-full h-11 border border-[#D1D5DB] rounded-[4px] px-4 text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                    />
                  </div>
                  {/* Descripción */}
                  <div>
                    <label
                      htmlFor="eval-desc"
                      className="block font-medium text-[13px] text-[#374151] mb-1.5"
                    >
                      Descripción (opcional)
                    </label>
                    <textarea
                      id="eval-desc"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      rows={3}
                      placeholder="Describe brevemente qué evalúa este examen..."
                      className="w-full border border-[#D1D5DB] rounded-[4px] px-4 py-3 text-[14px] text-[#111827] placeholder-[#9CA3AF] resize-none focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                    />
                  </div>
                  {/* Asociar a */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="eval-modulo"
                        className="block font-medium text-[13px] text-[#374151] mb-1.5"
                      >
                        Módulo
                      </label>
                      <div className="relative">
                        <select
                          id="eval-modulo"
                          value={tipoEval === 'final' ? '' : selectedModuloId}
                          onChange={(e) => setSelectedModuloId(e.target.value)}
                          disabled={tipoEval === 'final' || modulos.length === 0}
                          className="w-full h-11 border border-[#D1D5DB] rounded-[4px] pl-4 pr-10 text-[14px] text-[#111827] appearance-none focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors bg-white disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed"
                        >
                          {tipoEval === 'final' ? (
                            <option value="">No aplica (Examen Final)</option>
                          ) : modulos.length === 0 ? (
                            <option value="">No hay módulos creados (ve al Paso 2)</option>
                          ) : (
                            modulos.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.titulo}
                              </option>
                            ))
                          )}
                        </select>
                        <ChevronDown
                          size={15}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E40AF] pointer-events-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-medium text-[13px] text-[#374151] mb-1.5">
                        Tipo
                      </label>
                      <div className="flex gap-2 h-11">
                        {[
                          { key: 'modulo', label: '📝 Módulo' },
                          { key: 'final', label: '📋 Examen final' },
                        ].map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setTipoEval(t.key)}
                            className={`flex-1 h-full border rounded-[4px] font-semibold text-[13px] transition-all ${
                              tipoEval === t.key
                                ? 'bg-[#DBEAFE] border-[#1E40AF] text-[#1E40AF]'
                                : 'bg-white border-[#D1D5DB] text-[#374151] hover:border-[#93C5FD]'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Card 2: Configuración */}
              <Card className="p-6">
                <h2 className="font-bold text-[18px] text-[#111827] mb-5">Configuración</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Tiempo límite */}
                  <div>
                    <label
                      htmlFor="eval-tiempo"
                      className="block font-medium text-[13px] text-[#374151] mb-1.5"
                    >
                      Tiempo límite
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="eval-tiempo"
                        type="number"
                        min={1}
                        value={sinLimite ? '' : tiempoLimite}
                        onChange={(e) => setTiempoLimite(e.target.value)}
                        disabled={sinLimite}
                        className="w-24 h-11 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                      />
                      <span className="text-[14px] text-[#6B7280]">minutos</span>
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <Toggle id="toggle-sin-limite" checked={sinLimite} onChange={setSinLimite} />
                      <span className="text-[12px] text-[#6B7280]">Sin límite de tiempo</span>
                    </label>
                  </div>

                  {/* Intentos */}
                  <div>
                    <label
                      htmlFor="eval-intentos"
                      className="block font-medium text-[13px] text-[#374151] mb-1.5"
                    >
                      Intentos permitidos
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="eval-intentos"
                        type="number"
                        min={1}
                        value={intentosIlimitados ? '' : intentos}
                        onChange={(e) => setIntentos(e.target.value)}
                        disabled={intentosIlimitados}
                        className="w-24 h-11 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                      />
                      <span className="text-[14px] text-[#6B7280]">intentos</span>
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <Toggle
                        id="toggle-intentos-ilimitados"
                        checked={intentosIlimitados}
                        onChange={setIntentosIlimitados}
                      />
                      <span className="text-[12px] text-[#6B7280]">Intentos ilimitados</span>
                    </label>
                  </div>

                  {/* Nota mínima */}
                  <div>
                    <label
                      htmlFor="eval-nota"
                      className="block font-medium text-[13px] text-[#374151] mb-1.5"
                    >
                      Nota mínima *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="eval-nota"
                        type="number"
                        min={0}
                        max={100}
                        value={notaMinima}
                        onChange={(e) => setNotaMinima(e.target.value)}
                        className="w-24 h-11 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                      />
                      <span className="text-[14px] text-[#6B7280]">puntos sobre 100</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-1.5">
                      El alumno debe superar esta nota para completar el módulo.
                    </p>
                  </div>

                  {/* Espera entre intentos */}
                  <div>
                    <label
                      htmlFor="eval-espera"
                      className="block font-medium text-[13px] text-[#374151] mb-1.5"
                    >
                      Espera entre intentos
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="eval-espera"
                        type="number"
                        min={0}
                        value={sinEspera ? '' : esperaIntentos}
                        onChange={(e) => setEsperaIntentos(e.target.value)}
                        disabled={sinEspera}
                        className="w-24 h-11 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                      />
                      <span className="text-[14px] text-[#6B7280]">horas</span>
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <Toggle id="toggle-sin-espera" checked={sinEspera} onChange={setSinEspera} />
                      <span className="text-[12px] text-[#6B7280]">Sin espera</span>
                    </label>
                  </div>
                </div>

                {/* Opciones adicionales */}
                <div className="mt-5 pt-5 border-t border-[#F3F4F6] flex flex-col gap-3">
                  {[
                    {
                      key: 'aleatorio',
                      label: 'Orden aleatorio de preguntas',
                      desc: 'Las preguntas aparecen en distinto orden cada intento.',
                    },
                    {
                      key: 'mostrarRespuestas',
                      label: 'Mostrar respuestas al finalizar',
                      desc: 'El alumno ve las respuestas correctas al terminar.',
                    },
                    {
                      key: 'unaPorUna',
                      label: 'Mostrar una pregunta a la vez',
                      desc: 'El alumno solo ve una pregunta en pantalla.',
                    },
                    {
                      key: 'volverAtras',
                      label: 'Permitir volver a preguntas anteriores',
                      desc: 'El alumno puede navegar hacia atrás durante el examen.',
                    },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-start gap-3 cursor-pointer">
                      <Toggle
                        id={`toggle-${opt.key}`}
                        checked={opts[opt.key]}
                        onChange={(v) => setOpts((prev) => ({ ...prev, [opt.key]: v }))}
                      />
                      <div>
                        <p className="font-medium text-[13px] text-[#111827]">{opt.label}</p>
                        <p className="font-normal text-[12px] text-[#6B7280]">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>

              {/* Card 3: Preguntas */}
              <Card className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[18px] text-[#111827]">Preguntas</h2>
                  <span className="bg-[#F3F4F6] text-[#4B5563] font-semibold text-[12px] px-2.5 py-1 rounded-[4px]">
                    {questions.length} pregunta{questions.length !== 1 ? 's' : ''} · {totalPuntos}{' '}
                    puntos total
                  </span>
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-3 flex-wrap mb-5">
                  <button
                    id="btn-nueva-pregunta"
                    onClick={() => openModal()}
                    className="flex items-center gap-2 h-9 px-4 bg-[#1E40AF] hover:bg-[#1A368F] text-white rounded-[4px] font-semibold text-[13px] transition-colors"
                  >
                    <Plus size={14} />
                    Nueva pregunta
                  </button>
                  <button
                    id="btn-agregar-banco"
                    onClick={() => setBancoOpen(true)}
                    className="flex items-center gap-2 h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-[4px] font-semibold text-[13px] hover:bg-[#F9FAFB] transition-colors"
                  >
                    <FileText size={13} />
                    Agregar desde banco
                  </button>
                  <button
                    id="btn-importar-csv"
                    className="flex items-center gap-2 h-9 px-3 text-[#1E40AF] rounded-[4px] font-medium text-[13px] hover:bg-[#EFF6FF] transition-colors"
                  >
                    Importar CSV
                  </button>
                </div>

                {/* Question list */}
                {questions.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-[#E5E7EB] rounded-[4px]">
                    <HelpCircle size={36} className="mx-auto mb-3 text-[#D1D5DB]" />
                    <p className="font-medium text-[14px] text-[#6B7280]">
                      Aún no hay preguntas. Haz clic en &quot;+ Nueva pregunta&quot; para comenzar.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {questions.map((q, idx) => (
                      <QuestionRow
                        key={q.id}
                        q={q}
                        idx={idx}
                        onEdit={openModal}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                        dragProps={{
                          draggable: true,
                          onDragStart: (e) => handleDragStart(e, idx),
                          onDragOver: (e) => handleDragOver(e, idx),
                          onDrop: (e) => handleDrop(e, idx),
                          onDragLeave: () => setDragOver(null),
                          style: dragOver === idx ? { opacity: 0.5 } : {},
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Footer total */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F3F4F6]">
                  <p
                    className={`font-semibold text-[14px] ${
                      totalPuntos >= totalRequerido ? 'text-[#10B981]' : 'text-[#F59E0B]'
                    }`}
                  >
                    Puntuación total: <strong>{totalPuntos} pts</strong> de {totalRequerido}{' '}
                    requeridos
                  </p>
                  {totalPuntos < totalRequerido && (
                    <span className="text-[12px] text-[#F59E0B] font-medium">
                      Faltan {totalRequerido - totalPuntos} pts
                    </span>
                  )}
                </div>
              </Card>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-[140px] lg:self-start">
              {/* Card 1: Vista previa del alumno */}
              <Card className="p-6">
                <p className="font-medium text-[11px] text-[#6B7280] uppercase tracking-wider mb-4">
                  Vista previa del alumno
                </p>
                <div className="bg-[#F9FAFB] rounded-[4px] p-4">
                  {tipoEval === 'modulo' && (
                    <span className="bg-[#1E40AF] text-white font-semibold text-[11px] px-2.5 py-1 rounded-[4px] uppercase">
                      {modulos.find((m) => m.id === selectedModuloId)?.titulo || 'Módulo'}
                    </span>
                  )}
                  {tipoEval === 'final' && (
                    <span className="bg-[#DC2626] text-white font-semibold text-[11px] px-2.5 py-1 rounded-[4px] uppercase">
                      Examen Final
                    </span>
                  )}
                  <h3 className="font-bold text-[16px] text-[#111827] mt-2">
                    {titulo || <span className="text-[#9CA3AF] font-normal">Sin título</span>}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {[
                      { icon: Timer, label: `${sinLimite ? 'Sin límite' : `${tiempoLimite} min`}` },
                      { icon: HelpCircle, label: `${questions.length} preguntas` },
                      {
                        icon: RotateCcw,
                        label: `${intentosIlimitados ? '∞ intentos' : `${intentos} intentos`}`,
                      },
                      { icon: Award, label: `${notaMinima} pts mín.` },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <Icon size={13} className="text-[#6B7280] flex-shrink-0" />
                        <span className="font-semibold text-[12px] text-[#111827]">{label}</span>
                      </div>
                    ))}
                  </div>
                  {descripcion && <p className="text-[11px] text-[#6B7280] mt-3">{descripcion}</p>}
                  <div className="mt-4 flex justify-center">
                    <button className="bg-[#1E40AF] text-white font-semibold text-[13px] px-6 py-2 rounded-full hover:bg-[#1A368F] transition-colors">
                      Iniciar evaluación
                    </button>
                  </div>
                </div>
              </Card>

              {/* Card 2: Resumen de puntuación */}
              <Card className="p-6">
                <h2 className="font-bold text-[18px] text-[#111827] mb-4">Resumen de puntos</h2>
                <DonutChart assigned={totalPuntos} total={totalRequerido} />
                {totalPuntos < totalRequerido && (
                  <div className="mt-4 bg-[#FEF3C7] border-l-[3px] border-[#F59E0B] px-3 py-2.5 rounded-r-[4px]">
                    <p className="font-medium text-[12px] text-[#92400E]">
                      Faltan {totalRequerido - totalPuntos} pts para completar la evaluación.
                    </p>
                  </div>
                )}
                {totalPuntos >= totalRequerido && (
                  <div className="mt-4 bg-[#D1FAE5] border-l-[3px] border-[#10B981] px-3 py-2.5 rounded-r-[4px]">
                    <p className="font-medium text-[12px] text-[#065F46]">
                      ¡Evaluación completa con {totalPuntos} pts!
                    </p>
                  </div>
                )}

                {/* Ajustes de puntuación */}
                <div className="mt-6 pt-6 border-t border-[#F3F4F6]">
                  <h3 className="font-semibold text-[13px] text-[#374151] mb-3">
                    Configuración de puntaje
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    <div>
                      <label htmlFor="total-requerido" className="block text-[12px] text-[#6B7280] mb-1">
                        Puntos totales requeridos:
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="total-requerido"
                          type="number"
                          min="1"
                          value={totalRequerido}
                          onChange={(e) => handleTotalRequeridoChange(Number(e.target.value))}
                          className="w-full h-10 border border-[#D1D5DB] rounded-[4px] px-3 text-[14px] text-[#111827] focus:outline-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] transition-colors"
                        />
                        <button
                          onClick={autoDistributePoints}
                          disabled={questions.length === 0}
                          title="Distribuye equitativamente el puntaje total entre todas las preguntas"
                          className="bg-[#1E40AF] hover:bg-[#1A368F] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed text-white text-[13px] font-semibold px-4 rounded-[4px] transition-colors flex-shrink-0"
                        >
                          Distribuir
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoAdjust}
                        onChange={(e) => handleToggleAutoAdjust(e.target.checked)}
                        className="w-4 h-4 text-[#1E40AF] border-[#D1D5DB] rounded focus:ring-[#1E40AF]"
                      />
                      <span className="text-[12px] text-[#374151]">
                        Ajustar automáticamente al cambiar preguntas
                      </span>
                    </label>
                  </div>

                  {questions.length > 0 && (
                    <p className="text-[11px] text-[#6B7280] mt-2.5 leading-relaxed">
                      Cada pregunta recibirá <strong className="text-[#1E40AF]">{Math.floor(totalRequerido / questions.length)} pts</strong>
                      {totalRequerido % questions.length > 0 && (
                        <span> (y {totalRequerido % questions.length} {totalRequerido % questions.length === 1 ? 'pregunta recibirá' : 'preguntas recibirán'} 1 pt adicional para sumar {totalRequerido} pts exactos)</span>
                      )}
                      .
                    </p>
                  )}
                </div>
              </Card>

              {/* Card 3: Distribución por tipo */}
              <Card className="p-6">
                <h2 className="font-bold text-[16px] text-[#111827] mb-4">Tipos de pregunta</h2>
                {typeCounts.length === 0 ? (
                  <p className="text-[13px] text-[#9CA3AF] text-center py-4">Sin preguntas aún</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {typeCounts.map((t) => (
                      <div key={t.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {typeBadge(t.key)}
                          <span className="font-medium text-[13px] text-[#111827]">{t.label}</span>
                        </div>
                        <span className="font-medium text-[12px] text-[#6B7280]">
                          {t.count} {t.count === 1 ? 'pregunta' : 'preguntas'} · {t.pts} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {typeCounts.some((t) => t.key === 'desarrollo') && (
                  <p className="flex items-center gap-1.5 mt-4 text-[11px] text-[#F59E0B] font-medium">
                    <Timer size={13} />
                    {typeCounts.find((t) => t.key === 'desarrollo')?.count} pregunta
                    {typeCounts.find((t) => t.key === 'desarrollo')?.count !== 1
                      ? 's requieren'
                      : ' requiere'}{' '}
                    calificación manual (DES).
                  </p>
                )}
              </Card>

              {/* Card 4: Tips */}
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[4px] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={18} className="text-[#1E40AF]" />
                  <h3 className="font-semibold text-[14px] text-[#1E40AF]">
                    Tips para una buena evaluación
                  </h3>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'Incluye al menos 5 preguntas por módulo.',
                    'Varía los tipos: OM, VF y al menos 1 DES.',
                    'Define una nota mínima acorde al nivel del curso.',
                    'El orden aleatorio evita que alumnos copien respuestas.',
                  ].map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2 font-normal text-[12px] text-[#1E3A8A] leading-relaxed"
                    >
                      <span className="text-[#1E40AF] mt-0.5 flex-shrink-0">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterAdmin />

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
