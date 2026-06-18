'use client';
import EmojiIcon from '@/components/common/EmojiIcon';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  Settings,
  Plus,
  Trash2,
  Download,
  Search,
  Check,
  X,
  ShieldAlert,
  UserPlus,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';
import HeaderAdmin from '../../../components/HeaderAdmin';
import FooterAdmin from '../../../components/FooterAdmin';

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

export default function DetalleGrupoClient({
  grupo,
  estudiantes = [],
  cursos = [],
  usuarioSession,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('alumnos'); // Tab por defecto

  // Estados para alertas flotantes
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // Estados de los formularios de edición de grupo (Pestaña 1)
  const [infoForm, setInfoForm] = useState({
    nombre: grupo.nombre,
    descripcion: grupo.descripcion || '',
    fechaInicio: grupo.fechaInicio ? grupo.fechaInicio.split('T')[0] : '',
    fechaFin: grupo.fechaFin ? grupo.fechaFin.split('T')[0] : '',
    activo: grupo.activo,
  });
  const [infoErrors, setInfoErrors] = useState({});

  // Estados de Asignación Individual de Alumno (Pestaña 2)
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Estados para Importación Masiva CSV
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [importResults, setImportResults] = useState(null);

  // Estados de Asignación de Curso (Pestaña 3)
  const [selectedCursoId, setSelectedCursoId] = useState('');
  const [isAssigningCourse, setIsAssigningCourse] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // Filtrado de alumnos del grupo
  const [searchMemberTerm, setSearchMemberTerm] = useState('');
  const filteredMembers = useMemo(() => {
    return grupo.miembros.filter((m) => {
      if (!m.usuario) return false;
      return (
        m.usuario.nombre.toLowerCase().includes(searchMemberTerm.toLowerCase()) ||
        m.usuario.email.toLowerCase().includes(searchMemberTerm.toLowerCase()) ||
        m.usuario.documento.includes(searchMemberTerm)
      );
    });
  }, [grupo.miembros, searchMemberTerm]);

  // Alumnos del sistema disponibles para agregar (excluyendo a los que ya son miembros)
  const miembrosIds = useMemo(
    () => new Set(grupo.miembros.map((m) => m.usuario?.id)),
    [grupo.miembros]
  );
  const alumnosDisponibles = useMemo(() => {
    return estudiantes.filter((e) => !miembrosIds.has(e.id));
  }, [estudiantes, miembrosIds]);

  // Filtrar lista desplegable de alumnos disponibles en base al término de búsqueda
  const filteredAvailableStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return [];
    return alumnosDisponibles
      .filter(
        (e) =>
          e.nombre.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
          e.email.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
          e.documento.includes(studentSearchTerm)
      )
      .slice(0, 8); // Mostrar max 8 resultados
  }, [alumnosDisponibles, studentSearchTerm]);

  // Cursos del sistema disponibles para agregar (excluyendo los que ya están asignados)
  const cursosAsignadosIds = useMemo(
    () => new Set(grupo.cursos.map((c) => c.curso?.id)),
    [grupo.cursos]
  );
  const cursosDisponibles = useMemo(() => {
    return cursos.filter((c) => !cursosAsignadosIds.has(c.id));
  }, [cursos, cursosAsignadosIds]);

  // Manejo del formulario de Información General
  const handleInfoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInfoForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (infoErrors[name]) {
      setInfoErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateInfoForm = () => {
    const errors = {};
    if (!infoForm.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!infoForm.fechaInicio) errors.fechaInicio = 'La fecha de inicio es obligatoria';
    if (
      infoForm.fechaInicio &&
      infoForm.fechaFin &&
      new Date(infoForm.fechaInicio) > new Date(infoForm.fechaFin)
    ) {
      errors.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio';
    }
    setInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!validateInfoForm()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/grupos/${grupo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(infoForm),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al actualizar la información', 'error');
      } else {
        showToast('¡Información del grupo actualizada con éxito!');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar permanentemente el grupo "${grupo.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/grupos/${grupo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        showToast(data.message || 'Error al eliminar el grupo', 'error');
      } else {
        router.push('/dashboard/grupos');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
      setLoading(false);
    }
  };

  // Agregar Alumno Individual
  const handleAddIndividualStudent = async (student) => {
    setIsAddingStudent(true);
    setStudentSearchTerm('');
    try {
      const response = await fetch(`/api/admin/grupos/${grupo.id}/alumnos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumnosIds: [student.id],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al vincular el alumno', 'error');
      } else {
        showToast(`¡${student.nombre} agregado exitosamente!`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setIsAddingStudent(false);
    }
  };

  // Remover Alumno
  const handleRemoveStudent = async (member) => {
    if (!member.usuario) return;
    if (!window.confirm(`¿Remover a ${member.usuario.nombre} de este grupo?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/grupos/${grupo.id}/alumnos/${member.usuario.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al desvincular el alumno', 'error');
      } else {
        showToast('Estudiante desvinculado con éxito');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Procesar Archivo o Texto CSV
  const handleCsvTextChange = (e) => {
    const text = e.target.value;
    setCsvRawText(text);

    // Generar previsualización de correos / documentos detectados
    const items = text
      .split(/[\n,;]+/)
      .map((i) => i.trim())
      .filter(Boolean);
    const emails = items.filter((i) => /\S+@\S+\.\S+/.test(i));
    const documents = items.filter((i) => /^\d+$/.test(i));

    if (items.length > 0) {
      setCsvPreview({
        total: items.length,
        emails: emails.length,
        documents: documents.length,
      });
    } else {
      setCsvPreview(null);
    }
  };

  const handleCsvFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvRawText(text);

      const items = text
        .split(/[\n,;\r]+/)
        .map((i) => i.trim())
        .filter(Boolean);
      const emails = items.filter((i) => /\S+@\S+\.\S+/.test(i));
      const documents = items.filter((i) => /^\d+$/.test(i));

      setCsvPreview({
        total: items.length,
        emails: emails.length,
        documents: documents.length,
      });
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!csvRawText.trim()) return;

    setLoading(true);
    const items = csvRawText
      .split(/[\n,;\r]+/)
      .map((i) => i.trim())
      .filter(Boolean);
    const emails = items.filter((i) => /\S+@\S+\.\S+/.test(i));
    const documents = items.filter((i) => /^\d+$/.test(i));

    try {
      const response = await fetch(`/api/admin/grupos/${grupo.id}/alumnos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alumnosEmails: emails,
          alumnosDocumentos: documents,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al importar alumnos', 'error');
      } else {
        setImportResults(data);
        showToast('Procesamiento de importación finalizado');
        setCsvRawText('');
        setCsvFile(null);
        setCsvPreview(null);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Asignar Curso
  const handleAssignCourse = async () => {
    if (!selectedCursoId) return;
    const cursoSelected = cursos.find((c) => c.id === selectedCursoId);

    setIsAssigningCourse(true);
    try {
      const response = await fetch(`/api/admin/grupos/${grupo.id}/cursos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoId: selectedCursoId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al asignar el curso', 'error');
      } else {
        showToast(
          `Curso "${cursoSelected?.titulo}" asignado e inscritos ${data.stats?.matriculados} alumnos nuevos.`
        );
        setSelectedCursoId('');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al servidor', 'error');
    } finally {
      setIsAssigningCourse(false);
    }
  };

  // Desasignar Curso
  const handleRemoveCourse = async (assignedCourse) => {
    if (!assignedCourse.curso) return;
    if (
      !window.confirm(
        `¿Remover la asignación del curso "${assignedCourse.curso.titulo}"? Esto no cancelará la matrícula actual de los alumnos, pero desvinculará al grupo.`
      )
    )
      return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/grupos/${grupo.id}/cursos/${assignedCourse.curso.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Error al desvincular el curso', 'error');
      } else {
        showToast('Curso desvinculado con éxito');
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
      {/* Alertas flotantes */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-[100] flex items-center px-4 py-3 rounded shadow-lg border transition-all duration-300 transform translate-y-0
          ${toast.type === 'success' ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46]' : 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]'}`}
        >
          <span className="font-semibold text-[14px]">{toast.message}</span>
        </div>
      )}

      <HeaderAdmin usuario={usuarioSession} />

      <main className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6">
        {/* BOTÓN REGRESAR */}
        <div className="mb-4">
          <Link
            href="/dashboard/grupos"
            className="inline-flex items-center text-[#1E40AF] font-semibold text-[14px] hover:underline no-underline"
          >
            <ArrowLeft size={16} className="mr-2" />
            Volver a Grupos
          </Link>
        </div>

        {/* CABECERA DETALLE */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[#F3F4F6] gap-4 lg:gap-0 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-[10px] py-[3px] rounded-[4px] text-[10px] font-bold tracking-wider text-white
                ${grupo.activo ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'}`}
              >
                {grupo.activo ? 'GRUPO ACTIVO' : 'GRUPO INACTIVO'}
              </span>
              <span className="text-gray-400 text-[12px]">
                Creado por {grupo.creador?.nombre || 'Sistema'}
              </span>
            </div>
            <h1 className="font-bold text-[28px] text-[#111827] mt-2 mb-1">{grupo.nombre}</h1>
            <p className="text-gray-500 text-[14px] font-normal max-w-2xl">
              {grupo.descripcion || 'Sin descripción establecida.'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded border border-[#F3F4F6] self-start lg:self-center text-[13px] text-gray-600">
            <span className="flex items-center font-medium">
              <Calendar size={15} className="mr-1.5 text-[#1E40AF]" /> Inicio:{' '}
              <strong className="ml-1 text-gray-800">{formatDate(grupo.fechaInicio)}</strong>
            </span>
            <span className="h-4 w-[1px] bg-gray-300 mx-2"></span>
            <span className="flex items-center font-medium">
              <Calendar size={15} className="mr-1.5 text-[#1E40AF]" /> Fin:{' '}
              <strong className="ml-1 text-gray-800">{formatDate(grupo.fechaFin)}</strong>
            </span>
          </div>
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto gap-2 sm:gap-6">
          <button
            onClick={() => setActiveTab('alumnos')}
            className={`pb-4 px-2 font-bold text-[14px] border-b-2 transition-colors cursor-pointer bg-transparent border-0 outline-none flex items-center gap-2
              ${activeTab === 'alumnos' ? 'border-b-[#1E40AF] text-[#1E40AF]' : 'border-b-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <Users size={16} />
            Alumnos miembros ({grupo.miembros.length})
          </button>

          <button
            onClick={() => setActiveTab('cursos')}
            className={`pb-4 px-2 font-bold text-[14px] border-b-2 transition-colors cursor-pointer bg-transparent border-0 outline-none flex items-center gap-2
              ${activeTab === 'cursos' ? 'border-b-[#1E40AF] text-[#1E40AF]' : 'border-b-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <BookOpen size={16} />
            Cursos asignados ({grupo.cursos.length})
          </button>

          <button
            onClick={() => setActiveTab('configuracion')}
            className={`pb-4 px-2 font-bold text-[14px] border-b-2 transition-colors cursor-pointer bg-transparent border-0 outline-none flex items-center gap-2
              ${activeTab === 'configuracion' ? 'border-b-[#1E40AF] text-[#1E40AF]' : 'border-b-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <Settings size={16} />
            Información y Configuración
          </button>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}

        {/* PESTAÑA ALUMNOS */}
        {activeTab === 'alumnos' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Listado de Miembros Actuales */}
            <div className="flex-grow lg:w-[calc(100%-380px)]">
              <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="font-bold text-[18px] text-[#111827]">Miembros del Grupo</h3>

                  {/* Buscador de miembros */}
                  <div className="relative w-full sm:w-[240px]">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Filtrar por nombre o email..."
                      value={searchMemberTerm}
                      onChange={(e) => setSearchMemberTerm(e.target.value)}
                      className="w-full h-[36px] pl-9 pr-3 bg-white border border-[#D1D5DB] rounded-[6px] outline-none font-normal text-[13px] text-[#111827] focus:border-[#1E40AF]"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  {filteredMembers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-[#FAFAFA] border-b border-[#F3F4F6] h-[40px]">
                            <th className="px-4 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide">
                              Nombre
                            </th>
                            <th className="px-4 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide">
                              Documento
                            </th>
                            <th className="px-4 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide">
                              Vínculo
                            </th>
                            <th className="px-4 font-semibold text-[11px] text-[#6B7280] uppercase tracking-wide text-right">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMembers.map((member) => (
                            <tr
                              key={member.id}
                              className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] h-[52px]"
                            >
                              <td className="px-4 py-2">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-[13px] text-[#111827]">
                                    {member.usuario?.nombre}
                                  </span>
                                  <span className="text-[11px] text-[#6B7280]">
                                    {member.usuario?.email}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 text-[13px] text-gray-600 font-medium">
                                {member.usuario?.documento || 'N/A'}
                              </td>
                              <td className="px-4 text-[11px] text-gray-500">
                                {formatDate(member.creado)}
                              </td>
                              <td className="px-4 text-right">
                                <button
                                  onClick={() => handleRemoveStudent(member)}
                                  disabled={loading}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
                                  title="Remover alumno del grupo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-[14px]">
                      No hay alumnos inscritos en este grupo que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de Asignaciones (Derecha) */}
            <aside className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-6">
              {/* Asignar Alumno Individual */}
              <div className="bg-white border border-[#F3F4F6] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h3 className="font-bold text-[15px] text-[#111827] mb-2 flex items-center gap-2">
                  <UserPlus size={16} className="text-[#1E40AF]" />
                  Agregar Alumno
                </h3>
                <p className="text-[12px] text-gray-500 mb-4">
                  Busca estudiantes activos registrados en la plataforma para añadirlos a este
                  grupo.
                </p>

                <div className="relative">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Escribe nombre, email o documento..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#D1D5DB] rounded-[6px] outline-none font-normal text-[13px] text-[#111827] focus:border-[#1E40AF]"
                    />
                  </div>

                  {/* Resultados sugeridos del buscador */}
                  {filteredAvailableStudents.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-xl z-20 max-h-[240px] overflow-y-auto divide-y divide-gray-100">
                      {filteredAvailableStudents.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => handleAddIndividualStudent(student)}
                          className="p-3 hover:bg-[#EFF6FF] cursor-pointer flex flex-col transition-colors"
                        >
                          <span className="font-semibold text-[13px] text-[#111827]">
                            {student.nombre}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {student.email} · {student.documento}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {studentSearchTerm.trim() && filteredAvailableStudents.length === 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E5E7EB] p-4 text-center text-[12px] text-gray-500 rounded-lg shadow-md z-20">
                      No se encontraron alumnos disponibles que coincidan.
                    </div>
                  )}
                </div>
              </div>

              {/* Asignación Masiva CSV */}
              <div className="bg-white border border-[#F3F4F6] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h3 className="font-bold text-[15px] text-[#111827] mb-2 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-[#10B981]" />
                  Importación Masiva (CSV)
                </h3>
                <p className="text-[12px] text-gray-500 mb-4">
                  Carga un listado de estudiantes en bloque utilizando un archivo CSV o ingresando
                  correos electrónicos directamente.
                </p>

                <button
                  onClick={() => {
                    setImportResults(null);
                    setIsCsvModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center bg-white hover:bg-gray-50 border border-[#D1D5DB] py-2.5 rounded font-semibold text-[13px] text-gray-700 transition-colors cursor-pointer"
                >
                  <Download size={14} className="mr-2" />
                  Abrir asistente de importación
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* PESTAÑA CURSOS */}
        {activeTab === 'cursos' && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Listado de cursos asignados */}
            <div className="flex-grow lg:w-[calc(100%-380px)]">
              <div className="bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h3 className="font-bold text-[18px] text-[#111827] mb-4">
                  Cursos Vinculados al Grupo
                </h3>

                <div className="flex flex-col gap-4">
                  {grupo.cursos.length > 0 ? (
                    grupo.cursos.map((assigned) => {
                      if (!assigned.curso) return null;
                      return (
                        <div
                          key={assigned.id}
                          className="flex items-center justify-between p-4 border border-[#F3F4F6] hover:border-gray-200 rounded-lg bg-[#FBFBFB] hover:bg-white transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-[#EFF6FF] flex items-center justify-center text-[#1E40AF] flex-shrink-0">
                              <BookOpen size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[14px] text-[#111827]">
                                {assigned.curso.titulo}
                              </span>
                              <span className="text-[11px] text-gray-500">
                                Instructor: {assigned.curso.instructor?.nombre || 'Desconocido'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="bg-[#DBEAFE] text-[#1E40AF] font-semibold text-[10px] px-2 py-0.5 rounded tracking-wide uppercase">
                              {assigned.curso.estado}
                            </span>
                            <button
                              onClick={() => handleRemoveCourse(assigned)}
                              disabled={loading}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer border-0 bg-transparent"
                              title="Remover asignación de curso"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500 text-[14px] bg-gray-50/50 rounded border border-dashed border-gray-200">
                      Esta cohorte no tiene cursos asignados en este momento.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de Asignaciones (Derecha) */}
            <aside className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-6">
              {/* Asignar Grupo a un Curso */}
              <div className="bg-white border border-[#F3F4F6] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <h3 className="font-bold text-[15px] text-[#111827] mb-2 flex items-center gap-2">
                  <BookOpen size={16} className="text-[#1E40AF]" />
                  Asignar a un Curso
                </h3>
                <p className="text-[12px] text-gray-500 mb-4">
                  Vincula el grupo completo a un curso. Todos los alumnos actuales del grupo serán
                  matriculados automáticamente.
                </p>

                <div className="flex flex-col gap-3">
                  <div className="relative w-full">
                    <select
                      value={selectedCursoId}
                      onChange={(e) => setSelectedCursoId(e.target.value)}
                      className="w-full h-[40px] px-3 bg-white border border-[#D1D5DB] rounded-[6px] outline-none font-normal text-[13px] text-[#111827] appearance-none cursor-pointer"
                    >
                      <option value="">-- Selecciona un curso --</option>
                      {cursosDisponibles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.titulo} ({c.estado})
                        </option>
                      ))}
                    </select>
                    <ChevronRight
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none rotate-90"
                    />
                  </div>

                  {/* Warning banner */}
                  {selectedCursoId && (
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded p-3 text-[11px] text-[#1E40AF] leading-relaxed">
                      💡 <strong>Matrícula Automática</strong>: Al presionar &quot;Asignar&quot;, se
                      matriculará a los {grupo.miembros.length} alumnos del grupo en este curso de
                      forma instantánea.
                    </div>
                  )}

                  <button
                    onClick={handleAssignCourse}
                    disabled={isAssigningCourse || !selectedCursoId}
                    className="w-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white py-2.5 rounded font-semibold text-[13px] transition-colors cursor-pointer border-0 disabled:opacity-50"
                  >
                    {isAssigningCourse ? 'Asignando...' : 'Asignar curso al grupo'}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* PESTAÑA CONFIGURACIÓN / INFORMACIÓN */}
        {activeTab === 'configuracion' && (
          <div className="max-w-2xl bg-white border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-[18px] text-[#111827] mb-6 flex items-center gap-2">
              <Settings size={20} className="text-[#1E40AF]" />
              Información de la Cohorte
            </h3>

            <form onSubmit={handleUpdateInfo} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Nombre del grupo / cohorte *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={infoForm.nombre}
                  onChange={handleInfoChange}
                  className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                    ${infoErrors.nombre ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
                {infoErrors.nombre && (
                  <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                    {infoErrors.nombre}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                  Descripción de la cohorte
                </label>
                <textarea
                  name="descripcion"
                  rows={4}
                  value={infoForm.descripcion}
                  onChange={handleInfoChange}
                  className="p-3 border border-[#D1D5DB] rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="font-semibold text-[13px] text-[#4B5563] mb-1.5">
                    Fecha de inicio *
                  </label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={infoForm.fechaInicio}
                    onChange={handleInfoChange}
                    className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                      ${infoErrors.fechaInicio ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                  />
                  {infoErrors.fechaInicio && (
                    <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                      {infoErrors.fechaInicio}
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
                    value={infoForm.fechaFin}
                    onChange={handleInfoChange}
                    className={`h-[40px] px-3 border rounded-[4px] outline-none font-normal text-[14px] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF]
                      ${infoErrors.fechaFin ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                  />
                  {infoErrors.fechaFin && (
                    <span className="text-[#EF4444] text-[11px] mt-1 font-medium">
                      {infoErrors.fechaFin}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={infoForm.activo}
                  onChange={handleInfoChange}
                  className="w-4 h-4 text-[#1E40AF] border-[#D1D5DB] rounded focus:ring-[#1E40AF] cursor-pointer accent-[#1E40AF]"
                />
                <label
                  htmlFor="activo"
                  className="font-semibold text-[13px] text-[#4B5563] cursor-pointer select-none"
                >
                  El grupo está activo y disponible
                </label>
              </div>

              <div className="border-t border-[#F3F4F6] mt-6 pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  disabled={loading}
                  className="flex items-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/60 font-semibold text-[13px] px-4 py-2.5 rounded transition-all cursor-pointer border-0"
                >
                  <Trash2 size={15} className="mr-2" />
                  Eliminar grupo permanentemente
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold text-[13px] rounded transition-all cursor-pointer border-0 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <FooterAdmin className="mt-8" />

      {/* MODAL IMPORTACIÓN CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-[#000000] bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[540px] border border-[#E5E7EB] overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex justify-between items-center bg-[#FAFAFA]">
              <div className="flex items-center text-[#10B981]">
                <FileSpreadsheet size={20} className="mr-2" />
                <h3 className="font-bold text-[16px] text-[#111827]">Importar Alumnos desde CSV</h3>
              </div>
              <button
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setImportResults(null);
                }}
                className="text-[#6B7280] hover:text-[#111827] cursor-pointer border-0 bg-transparent"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {!importResults ? (
                <>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    Sube un archivo `.csv` que contenga correos electrónicos o documentos de
                    identidad de alumnos, o escríbelos directamente separados por comas o saltos de
                    línea.
                  </p>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-[13px] text-[#4B5563]">
                      Cargar archivo (.csv / .txt)
                    </label>
                    <div className="border-2 border-dashed border-[#D1D5DB] rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleCsvFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <FileSpreadsheet size={32} className="text-gray-400 mb-2" />
                      <span className="font-semibold text-[13px] text-gray-700">
                        {csvFile ? csvFile.name : 'Seleccionar archivo de mi equipo'}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-1">
                        Soporta correos y documentos
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-[13px] text-[#4B5563]">
                        O pega el texto aquí
                      </label>
                      {csvPreview && (
                        <span className="bg-[#D1FAE5] text-[#065F46] font-semibold text-[10px] px-2 py-0.5 rounded tracking-wide uppercase">
                          Detectado: {csvPreview.emails} emails, {csvPreview.documents} docs
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={csvRawText}
                      onChange={handleCsvTextChange}
                      placeholder="alumno1@correo.com, 1023456789&#10;alumno2@correo.com"
                      className="p-3 border border-[#D1D5DB] rounded outline-none font-normal text-[13px] text-[#111827] focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] resize-none"
                    />
                  </div>

                  <div className="border-t border-[#F3F4F6] mt-4 pt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setIsCsvModalOpen(false)}
                      className="px-5 py-2.5 border border-[#D1D5DB] rounded font-semibold text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleImportCsv}
                      disabled={loading || !csvRawText.trim()}
                      className="px-6 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white border-0 rounded font-semibold text-[13px] cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Importando...' : 'Iniciar Importación'}
                    </button>
                  </div>
                </>
              ) : (
                // Vista de Resultados de Importación
                <div className="flex flex-col gap-4">
                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-4 flex items-start gap-3">
                    <Check size={20} className="text-[#059669] flex-shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <h4 className="font-bold text-[14px] text-[#065F46]">
                        Procesamiento Completado
                      </h4>
                      <p className="text-[12px] text-[#047857] mt-1 leading-relaxed">
                        Hemos analizado los registros y asignado los alumnos que existen en la
                        plataforma.
                      </p>
                    </div>
                  </div>

                  {/* Stats list */}
                  <div className="grid grid-cols-3 gap-3 text-center my-2">
                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-3 rounded">
                      <span className="block text-[18px] font-bold text-[#1E40AF]">
                        {importResults.stats?.agregadosCount}
                      </span>
                      <span className="text-[10px] text-[#1E40AF] uppercase font-semibold">
                        Agregados
                      </span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded">
                      <span className="block text-[18px] font-bold text-gray-700">
                        {importResults.stats?.yaExistianCount}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">
                        Ya Miembros
                      </span>
                    </div>
                    <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-3 rounded">
                      <span className="block text-[18px] font-bold text-[#EF4444]">
                        {importResults.stats?.noEncontradosCount}
                      </span>
                      <span className="text-[10px] text-[#EF4444] uppercase font-semibold">
                        No Encontrados
                      </span>
                    </div>
                  </div>

                  {/* List of Warnings (Not found) */}
                  {importResults.noEncontrados?.length > 0 && (
                    <div className="flex flex-col">
                      <h4 className="font-semibold text-[13px] text-gray-700 mb-1 flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-red-500" />
                        Estudiantes no encontrados en la plataforma (Advertencia):
                      </h4>
                      <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded p-3 max-h-[140px] overflow-y-auto text-[11px] text-red-600 font-medium font-mono space-y-1">
                        {importResults.noEncontrados.map((item, index) => (
                          <div key={index}><EmojiIcon emoji="⚠️" className="mr-1" /> {item}</div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Los alumnos deben estar registrados previamente en el sistema para
                        vincularlos al grupo.
                      </p>
                    </div>
                  )}

                  {importResults.agregados?.length > 0 && (
                    <div className="flex flex-col">
                      <h4 className="font-semibold text-[13px] text-gray-700 mb-1">
                        Agregados exitosamente:
                      </h4>
                      <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded p-3 max-h-[100px] overflow-y-auto text-[11px] text-green-700 space-y-1">
                        {importResults.agregados.map((name, index) => (
                          <div key={index}>✓ {name}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-[#F3F4F6] mt-4 pt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setIsCsvModalOpen(false);
                        setImportResults(null);
                      }}
                      className="px-6 py-2.5 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white border-0 rounded font-semibold text-[13px] cursor-pointer"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
