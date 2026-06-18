'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Users,
  Download,
  Plus,
  MoreVertical,
  Check,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Activity,
  X,
} from 'lucide-react';
import HeaderAdmin from '../../components/HeaderAdmin';
import FooterAdmin from '../../components/FooterAdmin';

function timeAgo(dateInput) {
  if (!dateInput) return 'Nunca';
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval >= 1) return `Hace ${Math.floor(interval)} años`;
  interval = seconds / 2592000;
  if (interval >= 1) return `Hace ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval >= 1) return `Hace ${Math.floor(interval)} días`;
  interval = seconds / 3600;
  if (interval >= 1) return `Hace ${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval >= 1) return `Hace ${Math.floor(interval)} minutos`;
  return 'Hace unos segundos';
}

function formatDate(dateInput) {
  if (!dateInput) return '';
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

const mapRol = (rolName) => {
  if (!rolName) return 'ALUMNO';
  const r = rolName.toLowerCase();
  if (r === 'admin' || r === 'administrador') return 'ADMINISTRADOR';
  if (r === 'instructor') return 'INSTRUCTOR';
  if (r === 'tutor') return 'TUTOR';
  return 'ALUMNO';
};

export default function UsuariosClient({ usuarios = [], stats = {}, usuarioSession }) {
  const router = useRouter();
  const menuRef = useRef(null);

  // Estados para modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkRoleOpen, setIsBulkRoleOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Estado para notificaciones
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Estados de formularios
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    email: '',
    password: '',
    role: 'estudiante',
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Estados de filtros
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState('Todos');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [verifFilter, setVerifFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Estado del menú desplegable individual
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);

  // Cerrar menú contextual al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuUserId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return usuarios.filter((user) => {
      const matchesSearch =
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.documento && user.documento.includes(searchTerm));

      const mappedRole = mapRol(user.rol?.nombre);
      const matchesRol = rolFilter === 'Todos' || mappedRole === rolFilter;

      const matchesEstado =
        estadoFilter === 'Todos' ||
        (estadoFilter === 'Activos' && user.activo === true) ||
        (estadoFilter === 'Inactivos' && user.activo === false);

      const matchesVerif =
        verifFilter === 'Todos' ||
        (verifFilter === 'Verificados' && user.verificado === true) ||
        (verifFilter === 'Sin verificar' && user.verificado === false);

      return matchesSearch && matchesRol && matchesEstado && matchesVerif;
    });
  }, [usuarios, searchTerm, rolFilter, estadoFilter, verifFilter]);

  // Paginación
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((val) => val !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Lógica del Formulario de Creación / Edición
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = (isEdit = false) => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!formData.documento.trim()) errors.documento = 'El documento es obligatorio';
    if (!formData.email.trim()) {
      errors.email = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Correo electrónico inválido';
    }
    if (!isEdit && !formData.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreateModal = () => {
    setFormData({
      nombre: '',
      documento: '',
      email: '',
      password: '',
      role: 'estudiante',
    });
    setFormErrors({});
    setIsCreateOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    // Identificar rol crudo
    const rawRole = user.rol?.nombre?.toLowerCase() || 'estudiante';
    setFormData({
      nombre: user.nombre,
      documento: user.documento,
      email: user.email,
      password: '', // Contraseña vacía por defecto
      role: rawRole === 'administrador' ? 'admin' : rawRole,
    });
    setFormErrors({});
    setIsEditOpen(true);
    setActiveMenuUserId(null);
  };

  // Llamadas al API
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/crear-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al crear el usuario', 'error');
      } else {
        showToast('¡Usuario creado exitosamente!');
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

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    setLoading(true);
    try {
      const bodyData = {
        nombre: formData.nombre,
        documento: formData.documento,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) {
        bodyData.password = formData.password;
      }

      const response = await fetch(`/api/admin/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al actualizar el usuario', 'error');
      } else {
        showToast('¡Usuario actualizado exitosamente!');
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

  const handleToggleStatus = async (user) => {
    setActiveMenuUserId(null);
    setLoading(true);
    try {
      if (user.activo) {
        // Desactivar usando DELETE
        const response = await fetch(`/api/admin/usuarios/${user.id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) {
          showToast(data.message || 'Error al desactivar el usuario', 'error');
        } else {
          showToast('Usuario desactivado exitosamente');
          router.refresh();
        }
      } else {
        // Activar usando PUT
        const response = await fetch(`/api/admin/usuarios/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activo: true }),
        });
        const data = await response.json();
        if (!response.ok) {
          showToast(data.message || 'Error al activar el usuario', 'error');
        } else {
          showToast('Usuario activado exitosamente');
          router.refresh();
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Acciones en lote
  const handleBulkDeactivate = async () => {
    if (!window.confirm(`¿Estás seguro de desactivar ${selectedIds.length} usuarios?`)) return;

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          try {
            const response = await fetch(`/api/admin/usuarios/${id}`, {
              method: 'DELETE',
            });
            if (response.ok) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }
        })
      );

      showToast(`Desactivados: ${successCount} exitosos, ${failCount} fallidos`);
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      console.error(err);
      showToast('Error ejecutando de manera masiva', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRoleChange = async (selectedRole) => {
    setIsBulkRoleOpen(false);
    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          try {
            const response = await fetch(`/api/admin/usuarios/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: selectedRole }),
            });
            if (response.ok) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }
        })
      );

      showToast(`Roles actualizados: ${successCount} exitosos, ${failCount} fallidos`);
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      console.error(err);
      showToast('Error ejecutando el cambio masivo de roles', 'error');
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
            <Users size={40} className="text-[#1E40AF]" />
            <h1 className="font-bold text-[28px] text-[#111827] ml-3">Gestión de usuarios</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center bg-white border border-[#D1D5DB] px-5 py-[12px] rounded-[4px] font-semibold text-[14px] text-[#111827] hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-[#1E40AF] outline-none cursor-pointer">
              <Download size={16} className="text-[#111827] mr-2" />
              Importar CSV
            </button>
            <Link
              href="/dashboard/usuarios/crear"
              className="flex items-center bg-[#1E40AF] px-6 py-[12px] rounded-[4px] font-semibold text-[14px] text-white hover:bg-[#1E3A8A] transition-colors focus:ring-2 focus:ring-[#1E40AF] outline-none cursor-pointer no-underline"
              style={{ textDecoration: 'none' }}
            >
              <Plus size={16} className="text-white mr-2" />
              Crear usuario
            </Link>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-6">
          <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
              TOTAL
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
              VERIFICADOS
            </h3>
            <div className="font-bold text-[32px] text-[#111827] mt-1">
              {(stats.verificados || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-4 mb-6">
          <div className="w-full lg:w-[320px]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, email o documento"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[40px] pl-10 pr-4 bg-white border border-[#D1D5DB] rounded-[8px] outline-none font-normal text-[14px] text-[#111827] placeholder-[#9CA3AF] focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]"
              />
            </div>
          </div>

          <div className="flex flex-col flex-shrink-0 w-[calc(50%-8px)] lg:w-[180px]">
            <label className="font-medium text-[13px] text-[#4B5563] mb-1.5">Rol</label>
            <div className="relative w-full">
              <select
                value={rolFilter}
                onChange={(e) => {
                  setRolFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[40px] px-4 bg-white border border-[#D1D5DB] rounded-[8px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="TUTOR">Tutor</option>
                <option value="ALUMNO">Alumno</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col flex-shrink-0 w-[calc(50%-8px)] lg:w-[180px]">
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
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex flex-col flex-shrink-0 w-full lg:w-[180px]">
            <label className="font-medium text-[13px] text-[#4B5563] mb-1.5">Verificación</label>
            <div className="relative w-full">
              <select
                value={verifFilter}
                onChange={(e) => {
                  setVerifFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-[40px] px-4 bg-white border border-[#D1D5DB] rounded-[8px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Verificados">Verificados</option>
                <option value="Sin verificar">Sin verificar</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex-grow"></div>

          {/* Toggle de vista */}
          <div className="flex flex-shrink-0 mt-2 lg:mt-0 lg:ml-auto">
            <button className="w-[36px] h-[36px] flex items-center justify-center bg-[#1E40AF] rounded-l-[4px] cursor-pointer">
              <LayoutGrid size={18} className="text-white" />
            </button>
            <button className="w-[36px] h-[36px] flex items-center justify-center bg-white border border-[#D1D5DB] border-l-0 rounded-r-[4px] hover:bg-gray-50 cursor-pointer transition-colors">
              <List size={18} className="text-[#6B7280]" />
            </button>
          </div>
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] overflow-hidden mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#F3F4F6] h-[48px]">
                  <th
                    scope="col"
                    className="px-6 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide w-[48px]"
                  >
                    <label className="flex items-center justify-center h-full cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#1E40AF] rounded border-[#D1D5DB] focus:ring-[#1E40AF] cursor-pointer accent-[#1E40AF]"
                        checked={
                          paginatedUsers.length > 0 && selectedIds.length === paginatedUsers.length
                        }
                        onChange={toggleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </label>
                  </th>
                  <th
                    scope="col"
                    className="px-6 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide"
                  >
                    USUARIO
                  </th>
                  <th
                    scope="col"
                    className="px-6 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide"
                  >
                    EMAIL
                  </th>
                  <th
                    scope="col"
                    className="px-6 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide"
                  >
                    ROL
                  </th>
                  <th
                    scope="col"
                    className="px-6 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide"
                  >
                    ESTADO
                  </th>
                  <th
                    scope="col"
                    className="px-6 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide"
                  >
                    FECHA REGISTRO
                  </th>
                  <th
                    scope="col"
                    className="px-6 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide"
                  >
                    ÚLTIMA ACTIVIDAD
                  </th>
                  <th
                    scope="col"
                    className="px-6 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide text-right"
                  >
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => {
                    const isSelected = selectedIds.includes(user.id);
                    const virtualUsername = user.email.split('@')[0];
                    const isMenuOpen = activeMenuUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors h-[64px] group"
                      >
                        <td className="px-6">
                          <label className="flex items-center justify-center h-full cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#1E40AF] rounded border-[#D1D5DB] focus:ring-[#1E40AF] cursor-pointer accent-[#1E40AF]"
                              checked={isSelected}
                              onChange={() => toggleSelect(user.id)}
                              aria-label={`Seleccionar usuario ${user.nombre}`}
                            />
                          </label>
                        </td>
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-[36px] h-[36px] rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#1E40AF] font-bold text-[13px] flex-shrink-0">
                              {getInitials(user.nombre)}
                            </div>
                            <div className="flex flex-col">
                              <Link
                                href={`/dashboard/usuarios/${user.id}`}
                                className="font-semibold text-[14px] text-[#111827] whitespace-nowrap hover:text-[#1E40AF] transition-colors"
                              >
                                {user.nombre}
                              </Link>
                              <span className="font-normal text-[12px] text-[#6B7280]">
                                {virtualUsername}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 font-normal text-[14px] text-[#4B5563] whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-6">
                          <span
                            className={`inline-flex px-[10px] py-[4px] rounded-[4px] text-[11px] font-semibold text-white uppercase tracking-wider whitespace-nowrap
                            ${
                              mapRol(user.rol?.nombre) === 'ADMINISTRADOR'
                                ? 'bg-[#1E3A8A]'
                                : mapRol(user.rol?.nombre) === 'INSTRUCTOR'
                                  ? 'bg-[#1E40AF]'
                                  : mapRol(user.rol?.nombre) === 'TUTOR'
                                    ? 'bg-[#F59E0B]'
                                    : 'bg-[#6B7280]'
                            }`}
                          >
                            {mapRol(user.rol?.nombre)}
                          </span>
                        </td>
                        <td className="px-6">
                          <span
                            className={`inline-flex items-center px-[10px] py-[4px] rounded-[4px] text-[11px] font-semibold text-white uppercase tracking-wider whitespace-nowrap
                            ${user.activo ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'}`}
                          >
                            {user.activo && <Check size={12} className="mr-1" strokeWidth={3} />}
                            {user.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td className="px-6 font-normal text-[14px] text-[#6B7280] whitespace-nowrap">
                          {formatDate(user.fechaRegistro)}
                        </td>
                        <td className="px-6 whitespace-nowrap">
                          <span
                            className={`font-medium text-[13px] ${user.ultimoLogin ? 'text-[#10B981]' : 'text-[#6B7280]'}`}
                          >
                            {timeAgo(user.ultimoLogin)}
                          </span>
                        </td>
                        <td className="px-6 text-right relative">
                          <button
                            onClick={() => setActiveMenuUserId(isMenuOpen ? null : user.id)}
                            className="text-[#1E40AF] p-2 hover:bg-[#DBEAFE] rounded-full transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#1E40AF]"
                            aria-label="Opciones de usuario"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {/* Menú Desplegable Contextual */}
                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className="absolute right-6 top-10 bg-white border border-[#E5E7EB] rounded-lg shadow-lg w-[160px] py-1 z-[60] flex flex-col text-left overflow-hidden"
                            >
                              <Link
                                href={`/dashboard/usuarios/${user.id}/editar`}
                                className="px-4 py-2 hover:bg-[#F3F4F6] text-[#111827] text-[13px] font-medium w-full text-left cursor-pointer block"
                                style={{ textDecoration: 'none' }}
                                onClick={() => setActiveMenuUserId(null)}
                              >
                                Editar usuario
                              </Link>
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className={`px-4 py-2 hover:bg-[#F3F4F6] text-[13px] font-medium w-full text-left cursor-pointer
                                  ${user.activo ? 'text-[#EF4444]' : 'text-[#10B981]'}`}
                              >
                                {user.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-8 text-[#6B7280] font-normal text-[14px]"
                    >
                      No se encontraron usuarios que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER TABLA (Paginación) */}
          <div className="flex flex-col sm:flex-row items-center justify-between min-h-[56px] px-4 py-3 sm:py-0 border-t border-[#F3F4F6] bg-white gap-4 sm:gap-0">
            <span className="font-normal text-[14px] text-[#6B7280]">
              {totalItems > 0
                ? `Mostrando ${(currentPage - 1) * itemsPerPage + 1} a ${Math.min(currentPage * itemsPerPage, totalItems)} de ${totalItems} usuarios`
                : 'Mostrando 0 a 0 de 0 usuarios'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-[36px] h-[36px] flex items-center justify-center text-[#9CA3AF] hover:text-[#4B5563] disabled:opacity-50 disabled:hover:text-[#9CA3AF] cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-[#1E40AF] rounded-[4px]"
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNumber = i + 1;
                if (
                  totalPages > 5 &&
                  Math.abs(currentPage - pageNumber) > 1 &&
                  pageNumber !== 1 &&
                  pageNumber !== totalPages
                ) {
                  if (pageNumber === 2 || pageNumber === totalPages - 1) {
                    return (
                      <span key={pageNumber} className="text-[#9CA3AF] mx-0.5">
                        .
                      </span>
                    );
                  }
                  return null;
                }
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-[36px] h-[36px] rounded-[4px] flex items-center justify-center font-semibold text-[14px] cursor-pointer outline-none focus:ring-2 focus:ring-[#1E40AF] transition-colors
                      ${currentPage === pageNumber ? 'bg-[#1E40AF]' : 'bg-white text-[#4B5563] hover:bg-[#F9FAFB]'} 
                      ${currentPage === pageNumber ? 'text-white' : ''}`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-[36px] h-[36px] flex items-center justify-center text-[#4B5563] hover:text-[#111827] disabled:opacity-50 disabled:hover:text-[#4B5563] cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-[#1E40AF] rounded-[4px]"
                aria-label="Página siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <FooterAdmin className="mt-8" />

      {/* SELECCIÓN MÚLTIPLE FLOTANTE */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[640px] bg-white rounded-[4px] shadow-[0_10px_25px_rgba(0,0,0,0.1)] px-6 py-4 flex flex-col sm:flex-row items-center justify-between z-50 border border-[#F3F4F6]">
          <span className="font-semibold text-[14px] text-[#111827] mb-3 sm:mb-0">
            {selectedIds.length} usuario{selectedIds.length !== 1 && 's'} seleccionado
            {selectedIds.length !== 1 && 's'}
          </span>
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-center">
            <button
              onClick={() => setIsBulkRoleOpen(true)}
              className="bg-white border border-[#D1D5DB] px-3 py-[8px] rounded-[4px] font-semibold text-[13px] text-[#111827] hover:bg-gray-50 transition-colors whitespace-nowrap outline-none focus:ring-2 focus:ring-[#1E40AF] cursor-pointer"
            >
              Cambiar rol masivo
            </button>
            <button
              onClick={handleBulkDeactivate}
              className="bg-white border border-[#EF4444] px-3 py-[8px] rounded-[4px] font-semibold text-[13px] text-[#EF4444] hover:bg-red-50 transition-colors whitespace-nowrap outline-none focus:ring-2 focus:ring-[#EF4444] cursor-pointer"
            >
              Desactivar
            </button>
            <button className="bg-white border border-[#D1D5DB] px-3 py-[8px] rounded-[4px] font-semibold text-[13px] text-[#111827] hover:bg-gray-50 transition-colors whitespace-nowrap outline-none focus:ring-2 focus:ring-[#1E40AF] cursor-pointer">
              Exportar
            </button>
            <button
              className="text-[#6B7280] hover:text-[#111827] font-medium text-[13px] ml-1 cursor-pointer transition-colors outline-none focus:underline"
              onClick={() => setSelectedIds([])}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CREACIÓN */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-[#000000] bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] border border-[#E5E7EB] overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#FAFAFA]">
              <div className="flex items-center text-[#1E40AF]">
                <Plus size={20} className="mr-2" />
                <h3 className="font-bold text-[16px] text-[#111827]">Crear nuevo usuario</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#6B7280] hover:text-[#111827] cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez"
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
                  Documento de Identidad
                </label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                  placeholder="Ej: 1023456789"
                  className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                    ${formErrors.documento ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
                {formErrors.documento && (
                  <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                    {formErrors.documento}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ej: juan.perez@gmail.com"
                  className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                    ${formErrors.email ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
                {formErrors.email && (
                  <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                    {formErrors.email}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                  className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                    ${formErrors.password ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
                {formErrors.password && (
                  <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                    {formErrors.password}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Rol de Usuario
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full h-[40px] px-4 bg-white border border-[#D1D5DB] rounded-[4px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/30 cursor-pointer"
                  >
                    <option value="estudiante">Alumno</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end mt-4 border-t border-[#E5E7EB] pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-[10px] rounded-[4px] border border-[#D1D5DB] font-semibold text-[13px] text-[#4B5563] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-[10px] rounded-[4px] bg-[#1E40AF] font-semibold text-[13px] text-white hover:bg-[#1E3A8A] transition-colors focus:ring-2 focus:ring-[#1E40AF]/30 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-[#000000] bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] border border-[#E5E7EB] overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#FAFAFA]">
              <div className="flex items-center text-[#1E40AF]">
                <User size={20} className="mr-2" />
                <h3 className="font-bold text-[16px] text-[#111827]">Editar usuario</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-[#6B7280] hover:text-[#111827] cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez"
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
                  Documento de Identidad
                </label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                  placeholder="Ej: 1023456789"
                  className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                    ${formErrors.documento ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
                {formErrors.documento && (
                  <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                    {formErrors.documento}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ej: juan.perez@gmail.com"
                  className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                    ${formErrors.email ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
                {formErrors.email && (
                  <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                    {formErrors.email}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-[13px] text-[#4B5563]">
                    Nueva Contraseña
                  </label>
                  <span className="text-[11px] text-[#9CA3AF]">
                    (Dejar vacío si no deseas cambiarla)
                  </span>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                  className={`h-[40px] px-3 border border-[#D1D5DB] rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]`}
                />
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Rol de Usuario
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full h-[40px] px-4 bg-white border border-[#D1D5DB] rounded-[4px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/30 cursor-pointer"
                  >
                    <option value="estudiante">Alumno</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end mt-4 border-t border-[#E5E7EB] pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-[10px] rounded-[4px] border border-[#D1D5DB] font-semibold text-[13px] text-[#4B5563] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-[10px] rounded-[4px] bg-[#1E40AF] font-semibold text-[13px] text-white hover:bg-[#1E3A8A] transition-colors focus:ring-2 focus:ring-[#1E40AF]/30 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIÁLOGO CAMBIO DE ROL MASIVO */}
      {isBulkRoleOpen && (
        <div className="fixed inset-0 bg-[#000000] bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[400px] border border-[#E5E7EB] overflow-hidden transform transition-all p-6">
            <div className="flex items-center text-[#1E40AF] mb-4">
              <Shield size={20} className="mr-2" />
              <h3 className="font-bold text-[16px] text-[#111827]">Cambiar rol masivo</h3>
            </div>
            <p className="text-[13px] text-[#6B7280] mb-4">
              Selecciona el nuevo rol aplicable a los {selectedIds.length} usuarios seleccionados.
            </p>

            <div className="flex flex-col gap-4">
              <div className="relative">
                <select
                  id="bulkRoleSelect"
                  defaultValue="estudiante"
                  className="w-full h-[40px] px-4 bg-white border border-[#D1D5DB] rounded-[4px] outline-none font-normal text-[14px] text-[#111827] appearance-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/30 cursor-pointer"
                >
                  <option value="estudiante">Alumno</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrador</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none"
                />
              </div>

              <div className="flex items-center gap-3 justify-end mt-4">
                <button
                  onClick={() => setIsBulkRoleOpen(false)}
                  className="px-4 py-[8px] rounded-[4px] border border-[#D1D5DB] font-semibold text-[13px] text-[#4B5563] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const sel = document.getElementById('bulkRoleSelect');
                    handleBulkRoleChange(sel.value);
                  }}
                  disabled={loading}
                  className="px-5 py-[8px] rounded-[4px] bg-[#1E40AF] font-semibold text-[13px] text-white hover:bg-[#1E3A8A] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
