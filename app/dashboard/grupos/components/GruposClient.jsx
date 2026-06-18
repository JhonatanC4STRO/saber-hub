'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Users,
  Plus,
  MoreVertical,
  Check,
  Calendar,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  FolderKanban,
  Edit2,
  Trash2,
} from 'lucide-react';
import HeaderAdmin from '../../components/HeaderAdmin';
import FooterAdmin from '../../components/FooterAdmin';

function formatDate(dateInput) {
  if (!dateInput) return 'Sin definir';
  const date = new Date(dateInput);
  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function GruposClient({ grupos = [], stats = {}, usuarioSession, instructores = [] }) {
  const router = useRouter();

  // Estados para modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // Estado para notificaciones
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Estados de formularios
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    activo: true,
    creadorId: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Estado del menú desplegable individual
  const [activeMenuGroupId, setActiveMenuGroupId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Filtrado de grupos
  const filteredGroups = useMemo(() => {
    return grupos.filter((group) => {
      const matchesSearch =
        group.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado =
        estadoFilter === 'Todos' ||
        (estadoFilter === 'Activos' && group.activo === true) ||
        (estadoFilter === 'Inactivos' && group.activo === false);

      return matchesSearch && matchesEstado;
    });
  }, [grupos, searchTerm, estadoFilter]);

  // Paginación
  const totalItems = filteredGroups.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedGroups = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredGroups.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredGroups, currentPage]);

  // Lógica del Formulario de Creación / Edición
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!formData.fechaInicio) errors.fechaInicio = 'La fecha de inicio es obligatoria';
    if (usuarioSession?.rol === 'admin' && !formData.creadorId) {
      errors.creadorId = 'Debe seleccionar un instructor o administrador';
    }
    if (
      formData.fechaInicio &&
      formData.fechaFin &&
      new Date(formData.fechaInicio) > new Date(formData.fechaFin)
    ) {
      errors.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    // Inicializar fecha inicio con el día de hoy en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      nombre: '',
      descripcion: '',
      fechaInicio: today,
      fechaFin: '',
      activo: true,
      creadorId: usuarioSession?.id || '',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);

    // Formatear fechas para input type="date" (YYYY-MM-DD)
    const fmtStart = group.fechaInicio ? group.fechaInicio.split('T')[0] : '';
    const fmtEnd = group.fechaFin ? group.fechaFin.split('T')[0] : '';

    setFormData({
      nombre: group.nombre,
      descripcion: group.descripcion,
      fechaInicio: fmtStart,
      fechaFin: fmtEnd,
      activo: group.activo,
      creadorId: group.creadorId || usuarioSession?.id || '',
    });
    setFormErrors({});
    setIsEditOpen(true);
    setActiveMenuGroupId(null);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al crear el grupo', 'error');
      } else {
        showToast('¡Grupo creado exitosamente!');
        setIsCreateOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/grupos/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al actualizar el grupo', 'error');
      } else {
        showToast('¡Grupo actualizado exitosamente!');
        setIsEditOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    setActiveMenuGroupId(null);
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar el grupo "${group.nombre}"? Esta acción desvinculará a todos los miembros y no se puede deshacer.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/grupos/${group.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al eliminar el grupo', 'error');
      } else {
        showToast('Grupo eliminado con éxito');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] font-sans relative pb-16"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Sistema de Alertas Flotantes */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center px-4 py-3 rounded shadow-lg border transition-all duration-300 transform translate-y-0
          ${toast.type === 'success' ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46]' : 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]'}`}
        >
          <span className="font-semibold text-[14px]">{toast.message}</span>
        </div>
      )}

      <HeaderAdmin usuario={usuarioSession} />

      {/* CUERPO DE LA PÁGINA */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6">
        {/* ENCABEZADO DE PÁGINA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 md:gap-0">
          <div className="flex items-center">
            <FolderKanban size={40} className="text-[#1E40AF]" />
            <h1 className="font-bold text-[28px] text-[#111827] ml-3">Cohortes y Grupos</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="flex items-center bg-[#1E40AF] px-6 py-[12px] rounded-[4px] font-semibold text-[14px] text-white hover:bg-[#1E3A8A] transition-colors focus:ring-2 focus:ring-[#1E40AF] outline-none cursor-pointer border-0"
            >
              <Plus size={16} className="text-white mr-2" />
              Crear cohorte / grupo
            </button>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-6">
          <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
              TOTAL GRUPOS
            </h3>
            <div className="font-bold text-[32px] text-[#111827] mt-1">
              {(stats.total || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
              ACTIVOS
            </h3>
            <div className="font-bold text-[32px] text-[#111827] mt-1">
              {(stats.activos || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
              INACTIVOS
            </h3>
            <div className="font-bold text-[32px] text-[#111827] mt-1">
              {(stats.inactivos || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
              ESTUDIANTES ASIGNADOS
            </h3>
            <div className="font-bold text-[32px] text-[#111827] mt-1">
              {(stats.alumnos || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="w-full sm:w-[320px]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[40px] pl-10 pr-4 bg-white border border-[#D1D5DB] rounded-[8px] outline-none font-normal text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>
          </div>

          <div className="flex flex-col flex-shrink-0 w-full sm:w-[180px]">
            <label className="font-medium text-[13px] text-[#4B5563] mb-1.5">Estado</label>
            <div className="relative w-full">
              <select
                value={estadoFilter}
                onChange={(e) => {
                  setEstadoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[40px] px-4 bg-white border border-[#D1D5DB] rounded-[8px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Activos">Activos</option>
                <option value="Inactivos">Inactivos</option>
              </select>
              <ChevronRight
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none rotate-90"
              />
            </div>
          </div>
        </div>

        {/* LISTADO DE GRUPOS EN GRID DE CARDS PREMIUM */}
        {paginatedGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedGroups.map((group) => {
              const isMenuOpen = activeMenuGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className="bg-white border border-[#F3F4F6] border-b-[3px] border-b-[#1E40AF] rounded-lg p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.01),0_2px_4px_-1px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_20px_-3px_rgba(30,64,175,0.04)] transition-all flex flex-col relative group"
                >
                  {/* Top options */}
                  <div className="absolute right-4 top-4">
                    <button
                      onClick={() => setActiveMenuGroupId(isMenuOpen ? null : group.id)}
                      className="text-gray-400 hover:text-[#1E40AF] p-1.5 hover:bg-[#DBEAFE] rounded-full transition-colors cursor-pointer border-0 outline-none"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Context menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg w-[160px] py-1 z-30 flex flex-col text-left overflow-hidden">
                        <button
                          onClick={() => openEditModal(group)}
                          className="px-4 py-2 hover:bg-[#F3F4F6] text-[#111827] text-[13px] font-medium text-left cursor-pointer flex items-center border-0 bg-transparent"
                        >
                          <Edit2 size={13} className="mr-2 text-gray-400" />
                          Editar cohorte
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group)}
                          className="px-4 py-2 hover:bg-[#F3F4F6] text-red-600 text-[13px] font-medium text-left cursor-pointer flex items-center border-0 bg-transparent"
                        >
                          <Trash2 size={13} className="mr-2 text-red-400" />
                          Eliminar cohorte
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Header content */}
                  <div className="pr-6">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mb-2 text-white
                      ${group.activo ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'}`}
                    >
                      {group.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>

                    <h2 className="font-bold text-[18px] text-[#111827] leading-tight mb-2 group-hover:text-[#1E40AF] transition-colors">
                      <Link
                        href={`/dashboard/grupos/${group.id}`}
                        className="no-underline text-inherit hover:underline"
                      >
                        {group.nombre}
                      </Link>
                    </h2>

                    <p className="text-gray-500 text-[13px] leading-relaxed line-clamp-2 mb-4 h-[38px]">
                      {group.descripcion || 'Sin descripción proporcionada.'}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#F3F4F6] my-4"></div>

                  {/* Info stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1E40AF] flex-shrink-0">
                        <Users size={15} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#6B7280] uppercase font-medium">
                          Alumnos
                        </span>
                        <span className="font-bold text-[14px] text-[#111827]">
                          {group.miembrosCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1E40AF] flex-shrink-0">
                        <BookOpen size={15} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-[#6B7280] uppercase font-medium">
                          Cursos
                        </span>
                        <span className="font-bold text-[14px] text-[#111827]">
                          {group.cursosCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mt-auto flex flex-col gap-1 text-[12px] text-gray-500 bg-[#FAFAFA] p-3 rounded">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Calendar size={13} className="mr-1 text-gray-400" /> Inicio:
                      </span>
                      <span className="font-semibold text-gray-700">
                        {formatDate(group.fechaInicio)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Calendar size={13} className="mr-1 text-gray-400" /> Fin:
                      </span>
                      <span className="font-semibold text-gray-700">
                        {formatDate(group.fechaFin)}
                      </span>
                    </div>
                    {group.creador && (
                      <div className="flex items-center justify-between border-t border-[#E5E7EB] mt-1.5 pt-1.5">
                        <span className="flex items-center">
                          <Users size={13} className="mr-1 text-gray-400" /> Instructor:
                        </span>
                        <span className="font-semibold text-gray-700 truncate max-w-[160px]" title={group.creador.nombre}>
                          {group.creador.nombre}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Manage Button */}
                  <Link
                    href={`/dashboard/grupos/${group.id}`}
                    className="mt-4 flex items-center justify-center bg-gray-50 hover:bg-[#1E40AF] text-gray-700 hover:text-white border border-[#E5E7EB] hover:border-[#1E40AF] py-2 px-4 rounded font-semibold text-[13px] transition-all cursor-pointer no-underline text-center"
                  >
                    Gestionar Cohorte
                    <ArrowRight size={14} className="ml-2" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-lg p-16 flex flex-col items-center justify-center text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="w-[100px] h-[100px] mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <FolderKanban size={40} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-[18px] text-[#111827]">No se encontraron grupos</h3>
            <p className="text-gray-500 text-[14px] mt-1 max-w-sm">
              No existen cohortes creadas en este momento o ninguna coincide con tus filtros de
              búsqueda.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-6 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold text-[13px] px-6 py-2.5 rounded transition-all cursor-pointer border-0"
            >
              Crear mi primer grupo
            </button>
          </div>
        )}

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between min-h-[56px] px-4 py-3 border-t border-[#F3F4F6] bg-white mt-6">
            <span className="font-normal text-[14px] text-[#6B7280]">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} cohortes
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-[36px] h-[36px] flex items-center justify-center text-[#9CA3AF] hover:text-[#4B5563] disabled:opacity-50 cursor-pointer border-0 bg-transparent rounded"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-[36px] h-[36px] rounded border-0 font-semibold text-[14px] cursor-pointer transition-colors
                    ${currentPage === i + 1 ? 'bg-[#1E40AF] text-white' : 'bg-transparent text-[#4B5563] hover:bg-[#F9FAFB]'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-[36px] h-[36px] flex items-center justify-center text-[#4B5563] hover:text-[#111827] disabled:opacity-50 cursor-pointer border-0 bg-transparent rounded"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      <FooterAdmin className="mt-8" />

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-[#000000] bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] border border-[#E5E7EB] overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#FAFAFA]">
              <div className="flex items-center text-[#1E40AF]">
                <Plus size={20} className="mr-2" />
                <h3 className="font-bold text-[16px] text-[#111827]">
                  {isCreateOpen ? 'Crear nueva cohorte / grupo' : 'Editar cohorte / grupo'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                }}
                className="text-[#6B7280] hover:text-[#111827] cursor-pointer border-0 bg-transparent"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={isCreateOpen ? handleCreateGroup : handleEditGroup}
              className="p-6 flex flex-col gap-4"
            >
              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Nombre del grupo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Cohorte A - Análisis y Desarrollo de Software"
                  className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                    ${formErrors.nombre ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
                {formErrors.nombre && (
                  <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                    {formErrors.nombre}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Descripción del grupo
                </label>
                <textarea
                  name="descripcion"
                  rows={3}
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Ej: Grupo de estudiantes de la jornada diurna del SENA..."
                  className="p-3 border border-[#D1D5DB] rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] resize-none"
                />
              </div>

              {usuarioSession?.rol === 'admin' && (
                <div className="flex flex-col">
                  <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                    Instructor / Gestor del espacio *
                  </label>
                  <div className="relative">
                    <select
                      name="creadorId"
                      value={formData.creadorId}
                      onChange={handleInputChange}
                      className={`w-full h-[40px] pl-3 pr-8 bg-white border rounded-[4px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] cursor-pointer
                        ${formErrors.creadorId ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                    >
                      <option value="">Seleccione un instructor</option>
                      {instructores.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.nombre} ({inst.email})
                        </option>
                      ))}
                    </select>
                    <ChevronRight
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none rotate-90"
                    />
                  </div>
                  {formErrors.creadorId && (
                    <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                      {formErrors.creadorId}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                    Fecha de inicio *
                  </label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleInputChange}
                    className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                      ${formErrors.fechaInicio ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                  />
                  {formErrors.fechaInicio && (
                    <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                      {formErrors.fechaInicio}
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                    Fecha de fin (Opcional)
                  </label>
                  <input
                    type="date"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleInputChange}
                    className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                      ${formErrors.fechaFin ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                  />
                  {formErrors.fechaFin && (
                    <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                      {formErrors.fechaFin}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#1E40AF] border-[#D1D5DB] rounded focus:ring-[#1E40AF] cursor-pointer accent-[#1E40AF]"
                />
                <label
                  htmlFor="activo"
                  className="font-semibold text-[13px] text-[#4B5563] cursor-pointer select-none"
                >
                  El grupo está activo y disponible
                </label>
              </div>

              <div className="border-t border-[#F3F4F6] mt-4 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                  }}
                  className="px-5 py-2.5 border border-[#D1D5DB] rounded font-semibold text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white border-0 rounded font-semibold text-[13px] cursor-pointer transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : isCreateOpen ? 'Crear cohorte' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
