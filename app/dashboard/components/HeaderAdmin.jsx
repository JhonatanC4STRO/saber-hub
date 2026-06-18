'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Globe,
  Bell,
  User,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Newspaper,
  MessageSquare,
  X,
  BookOpen,
  Award,
  FileText,
  Video,
  Info,
} from 'lucide-react';

export default function HeaderAdmin({ usuario, searchValue = undefined, onSearchChange = undefined }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
  const lastNotifIdRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(usuario);
  const [uploading, setUploading] = useState(false);
  const drawerFileInputRef = useRef(null);

  const isAdmin = currentUser?.rol === 'admin';
  const isInstructor = currentUser?.rol === 'instructor';
  const isStudent = !isAdmin && !isInstructor;

  useEffect(() => {
    setCurrentUser(usuario);
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.error('Error fetching latest user details:', err);
      }
    };
    fetchUserData();
  }, [usuario]);

  const handleDrawerImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen supera el límite de 10 MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.message || 'Error al subir la imagen');
      }

      const uploadData = await uploadRes.json();
      const newImageUrl = uploadData.url;

      const updateRes = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: newImageUrl }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.error || 'Error al actualizar el perfil');
      }

      setCurrentUser((prev) => ({
        ...prev,
        imagen: newImageUrl,
      }));

      router.refresh();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error al actualizar la foto de perfil');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!usuario) {
      setUnreadTotal(0);
      setUnreadNotifs(0);
      return;
    }
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/mensajes');
        if (res.ok) {
          const data = await res.json();
          const total = data.conversaciones?.reduce((acc, c) => acc + (c.unreadCount || 0), 0) || 0;
          setUnreadTotal(total);
        }
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }

      try {
        const resNotif = await fetch('/api/notificaciones?limit=1');
        if (resNotif.ok) {
          const data = await resNotif.json();
          const currentCount = data.unreadCount || 0;
          setUnreadNotifs(currentCount);

          if (data.notificaciones && data.notificaciones.length > 0) {
            const latestNotif = data.notificaciones[0];
            
            if (lastNotifIdRef.current === null) {
              // Guardar la última sin disparar Toast al montar el componente
              lastNotifIdRef.current = latestNotif.id;
            } else if (latestNotif.id !== lastNotifIdRef.current) {
              lastNotifIdRef.current = latestNotif.id;
              // Solo mostrar si no está leída
              if (!latestNotif.leida) {
                setActiveToast(latestNotif);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [usuario]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleToastClick = async (notif) => {
    try {
      await fetch('/api/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      });
      setUnreadNotifs((prev) => Math.max(0, prev - 1));
      setActiveToast(null);
      if (notif.urlDestino) {
        router.push(notif.urlDestino);
      } else {
        router.push('/dashboard/notificaciones');
      }
    } catch (error) {
      console.error('Error handling toast click:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <header className="sticky top-0 z-50 h-[80px] bg-white border-b border-[#E5E7EB] flex items-center justify-between w-full px-6 lg:px-8">
      {/* Logo & Explore */}
      <div className="flex items-center">
        <Link href="/" className="flex flex-col cursor-pointer no-underline mr-8">
          <span className="font-bold text-[14px] leading-tight text-[#111827]">SABERHUB</span>
          <span className="font-normal text-[11px] text-[#6B7280] leading-tight">
            Learning Platform
          </span>
        </Link>

        <button className="hidden md:flex ml-8 items-center bg-white border border-[#E5E7EB] px-5 py-[12px] rounded-lg h-[48px] hover:bg-gray-50 transition-colors">
          <LayoutGrid size={18} className="text-[#1E40AF]" />
          <span className="font-semibold text-[14px] text-[#111827] ml-3">Explore</span>
          <ChevronDown size={14} className="text-[#4B5563] ml-2" />
        </button>
      </div>

      {/* Búsqueda central */}
      <div className="hidden lg:flex flex-grow max-w-[480px] mx-8 h-[48px] bg-white border border-[#E5E7EB] rounded-lg overflow-hidden focus-within:border-[#1E40AF] focus-within:ring-2 focus-within:ring-[#1E40AF]/15 transition-all">
        <div className="flex items-center pl-4 pr-2">
          <Search size={16} className="text-[#9CA3AF]" />
        </div>
        <input
          type="text"
          placeholder="Buscar cursos, artículos y recursos..."
          className="flex-grow h-full outline-none font-normal text-[14px] text-[#111827] placeholder-[#9CA3AF] focus-none-important"
          value={searchValue ?? undefined}
          onChange={onSearchChange ? (e) => onSearchChange(e.target.value) : undefined}
        />
        {currentUser && (
          <div className="h-full border-l border-[#E5E7EB] flex items-center px-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="font-medium text-[13px] text-[#4B5563] capitalize">
              {isStudent ? 'Aprendiz' : (currentUser.rol || 'Administrator')}
            </span>
            <ChevronDown size={14} className="text-[#4B5563] ml-1" />
          </div>
        )}
      </div>

      {/* Acciones derecha */}
      <div className="flex items-center gap-6 h-full">
        {currentUser ? (
          <>
            <Link
              href="/dashboard/mensajes"
              className="relative cursor-pointer text-[#4B5563] hover:text-[#111827] transition-colors"
            >
              <MessageSquare size={20} />
              {unreadTotal > 0 && (
                <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  {unreadTotal}
                </div>
              )}
            </Link>

            <Link
              href="/dashboard/notificaciones"
              className="relative cursor-pointer text-[#4B5563] hover:text-[#111827] transition-colors"
            >
              <Bell size={20} />
              {unreadNotifs > 0 && (
                <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center border border-white">
                  {unreadNotifs}
                </div>
              )}
            </Link>

            <div
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-[40px] h-[40px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden flex-shrink-0">
                {currentUser.imagen ? (
                  <img src={currentUser.imagen} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-semibold text-[13px] text-[#111827] group-hover:text-[#1E40AF] transition-colors">
                  {currentUser.nombre}
                </span>
                <span className="font-normal text-[11px] text-[#6B7280] capitalize">
                  {isStudent ? 'Aprendiz' : (currentUser.rol || 'Administrator')}
                </span>
              </div>
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="bg-[#1E40AF] hover:bg-[#1A368F] text-white font-semibold text-[14px] px-5 py-[10px] rounded-lg transition-colors no-underline"
          >
            Iniciar sesión
          </Link>
        )}
      </div>

      {/* Backdrop overlay */}
      {currentUser && isProfileOpen && (
        <div
          className="fixed inset-0 bg-[#0f172a]/30 backdrop-blur-[2px] z-[9998] transition-opacity duration-300"
          onClick={() => setIsProfileOpen(false)}
        />
      )}

      {/* Drawer */}
      {currentUser && (
        <div
          className={`fixed top-0 right-0 h-full w-[420px] max-w-full bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col overflow-hidden border-l border-gray-100 ${
            isProfileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
        {/* Top profile banner */}
        <div className="relative pt-8 pb-6 px-6 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50/20 overflow-hidden flex-shrink-0">
          {/* Subtle wavy lines pattern in background */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
            <svg
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <button
            onClick={() => setIsProfileOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              {/* Large Avatar */}
              <div 
                onClick={() => !uploading && drawerFileInputRef.current?.click()}
                className="relative group/avatar cursor-pointer w-[60px] h-[60px] rounded-full bg-[#E5E7EB] border border-gray-200 flex items-center justify-center text-gray-500 overflow-hidden flex-shrink-0"
              >
                {currentUser?.imagen ? (
                  <img src={currentUser.imagen} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={30} className="text-gray-400" />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200">
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={drawerFileInputRef}
                onChange={handleDrawerImageChange}
                accept="image/*"
                className="hidden"
              />
              {/* Name and Role */}
              <div className="flex flex-col">
                <h3 className="font-bold text-[15px] text-[#111827] leading-snug">
                  {currentUser?.nombre || 'Jhonatan Castro Calderón'}
                </h3>
                <span className="text-[12px] text-[#6B7280] font-normal capitalize">
                  {isStudent ? 'Aprendiz' : (currentUser?.rol || 'Instructor')}
                </span>
              </div>
            </div>

            {/* Cerrar Sesión Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-[#1E40AF] hover:bg-[#1A368F] text-white px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 cursor-pointer flex-shrink-0 shadow-sm"
            >
              <LogOut size={15} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4 bg-gray-50/50">
          {/* Categoría: Tablero */}
          <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <LayoutDashboard size={18} className="text-gray-500" />
              <span className="font-bold text-[14px] text-[#111827]">Navegación</span>
            </div>
            {isStudent ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard' ? 'text-[#1E40AF]' : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <span className="text-[13px] font-semibold">Mi aprendizaje</span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>

                <Link
                  href="/dashboard/mensajes"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard/mensajes'
                      ? 'text-[#1E40AF]'
                      : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold">Mensajes</span>
                    {unreadTotal > 0 && (
                      <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full flex items-center justify-center">
                        {unreadTotal}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/dashboard/notificaciones"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard/notificaciones'
                      ? 'text-[#1E40AF]'
                      : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold">Notificaciones</span>
                    {unreadNotifs > 0 && (
                      <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full flex items-center justify-center">
                        {unreadNotifs}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/catalogo"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/catalogo' ? 'text-[#1E40AF]' : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <span className="text-[13px] font-semibold">Catálogo de cursos</span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/dashboard/certificados"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard/certificados'
                      ? 'text-[#1E40AF]'
                      : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <span className="text-[13px] font-semibold">Mis certificados</span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/dashboard/rutas"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard/rutas' ? 'text-[#1E40AF]' : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <span className="text-[13px] font-semibold">Rutas de formación</span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/dashboard/solicitud-instructor"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard/solicitud-instructor'
                      ? 'text-[#1E40AF]'
                      : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <span className="text-[13px] font-semibold">Solicitar ser Instructor</span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard' ? 'text-[#1E40AF]' : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <span className="text-[13px] font-semibold">{isInstructor ? 'Mis cursos' : 'Inicio'}</span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>

                <Link
                  href="/catalogo"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/catalogo' ? 'text-[#1E40AF]' : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <span className="text-[13px] font-semibold">Catálogo de cursos</span>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/dashboard/mensajes"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard/mensajes'
                      ? 'text-[#1E40AF]'
                      : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold">Mensajes</span>
                    {unreadTotal > 0 && (
                      <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full flex items-center justify-center">
                        {unreadTotal}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/dashboard/notificaciones"
                  onClick={() => setIsProfileOpen(false)}
                  className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                    pathname === '/dashboard/notificaciones'
                      ? 'text-[#1E40AF]'
                      : 'text-[#4B5563] hover:text-[#1E40AF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold">Notificaciones</span>
                    {unreadNotifs > 0 && (
                      <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full flex items-center justify-center">
                        {unreadNotifs}
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                  />
                </Link>
                {(isAdmin || isInstructor) && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname === '/dashboard'
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Gestión de cursos</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
                {(isAdmin || isInstructor) && (
                  <Link
                    href="/CrearCursos"
                    onClick={() => {
                      sessionStorage.removeItem('saberhub_curso_id');
                      setIsProfileOpen(false);
                    }}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname?.startsWith('/CrearCursos')
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Crear curso</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/dashboard/usuarios"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname?.includes('/usuarios')
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Usuarios</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
                {(isAdmin || isInstructor) && (
                  <Link
                    href="/dashboard/grupos"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname?.startsWith('/dashboard/grupos')
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Gestión de espacios colaborativos</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
                {(isAdmin || isInstructor) && (
                  <Link
                    href="/dashboard/rutas"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname?.startsWith('/dashboard/rutas')
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Rutas de formación</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/dashboard/instituciones/solicitudes"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname?.startsWith('/dashboard/instituciones')
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Solicitudes instituciones</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/dashboard/solicitudes-instructor"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname?.startsWith('/dashboard/solicitudes-instructor')
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Solicitudes de instructor</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/cursos-externos"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname?.startsWith('/admin/cursos-externos')
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Revisión cursos externos</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
                {(isAdmin || isInstructor) && (
                  <Link
                    href="/dashboard/reportes"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname === '/dashboard/reportes'
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Seguimiento y reportes</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/dashboard/auditoria"
                    onClick={() => setIsProfileOpen(false)}
                    className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                      pathname === '/dashboard/auditoria'
                        ? 'text-[#1E40AF]'
                        : 'text-[#4B5563] hover:text-[#1E40AF]'
                    }`}
                  >
                    <span className="text-[13px] font-semibold">Auditoría</span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Categoría: Perfil */}
          <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <User size={18} className="text-gray-500" />
              <span className="font-bold text-[14px] text-[#111827]">Perfil</span>
            </div>
            <div className="flex flex-col divide-y divide-gray-50">
              <Link
                href={currentUser?.id ? `/dashboard/usuarios/${currentUser.id}/editar` : '#'}
                onClick={() => setIsProfileOpen(false)}
                className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                  pathname === `/dashboard/usuarios/${currentUser?.id}/editar`
                    ? 'text-[#1E40AF]'
                    : 'text-[#4B5563] hover:text-[#1E40AF]'
                }`}
              >
                <span className="text-[13px] font-semibold">Actualizar Perfil</span>
                <ChevronRight
                  size={16}
                  className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                href="/dashboard/notificaciones/preferencias"
                onClick={() => setIsProfileOpen(false)}
                className={`flex items-center justify-between py-3 pl-2 transition-colors group/item ${
                  pathname === '/dashboard/notificaciones/preferencias'
                    ? 'text-[#1E40AF]'
                    : 'text-[#4B5563] hover:text-[#1E40AF]'
                }`}
              >
                <span className="text-[13px] font-semibold">Ajustes de Notificaciones</span>
                <ChevronRight
                  size={16}
                  className="text-gray-400 group-hover/item:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Toast de Notificación en Tiempo Real */}
    {activeToast && (
      <div 
        onClick={() => handleToastClick(activeToast)}
        className="fixed bottom-5 right-5 z-[9999] max-w-[380px] w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] p-4 flex gap-3 cursor-pointer hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 transition-all duration-300 animate-slide-in-right"
        style={{
          borderLeft: `4px solid ${
            activeToast.tipo === 'inscripcion' ? '#2563EB' :
            activeToast.tipo === 'evaluacion' ? '#DC2626' :
            activeToast.tipo === 'certificado' ? '#D97706' :
            activeToast.tipo === 'foro' ? '#059669' :
            activeToast.tipo === 'mensaje' ? '#7C3AED' :
            activeToast.tipo === 'sesion' ? '#0D9488' : '#475569'
          }`
        }}
      >
        <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
          activeToast.tipo === 'inscripcion' ? 'bg-blue-50 border-blue-100 text-blue-600' :
          activeToast.tipo === 'evaluacion' ? 'bg-red-50 border-red-100 text-red-600' :
          activeToast.tipo === 'certificado' ? 'bg-amber-50 border-amber-100 text-amber-600' :
          activeToast.tipo === 'foro' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
          activeToast.tipo === 'mensaje' ? 'bg-purple-50 border-purple-100 text-purple-600' :
          activeToast.tipo === 'sesion' ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-gray-50 border-gray-100 text-gray-600'
        }`}>
          {activeToast.tipo === 'inscripcion' && <BookOpen size={18} />}
          {activeToast.tipo === 'evaluacion' && <FileText size={18} />}
          {activeToast.tipo === 'certificado' && <Award size={18} />}
          {activeToast.tipo === 'foro' && <MessageSquare size={18} />}
          {activeToast.tipo === 'mensaje' && <MessageSquare size={18} />}
          {activeToast.tipo === 'sesion' && <Video size={18} />}
          {activeToast.tipo === 'sistema' && <Info size={18} />}
          {!['inscripcion', 'evaluacion', 'certificado', 'foro', 'mensaje', 'sesion', 'sistema'].includes(activeToast.tipo) && <Bell size={18} />}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {activeToast.tipo === 'inscripcion' ? 'Inscripción' :
               activeToast.tipo === 'evaluacion' ? 'Evaluación' :
               activeToast.tipo === 'certificado' ? 'Certificado' :
               activeToast.tipo === 'foro' ? 'Foro' :
               activeToast.tipo === 'mensaje' ? 'Mensaje' :
               activeToast.tipo === 'sesion' ? 'Sesión' : 'Notificación'}
            </span>
            <span className="text-[10px] text-[#94A3B8] font-medium">• Ahora</span>
          </div>
          <h4 className="text-[13px] font-bold text-[#0F172A] leading-snug truncate">
            {activeToast.titulo}
          </h4>
          {activeToast.contenido && (
            <p className="text-[12px] text-[#64748B] leading-relaxed truncate mt-0.5">
              {activeToast.contenido}
            </p>
          )}
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0 self-start p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    )}

    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes slideInRight {
        from {
          transform: translateX(120%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in-right {
        animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `}} />
    </header>
  );
}
