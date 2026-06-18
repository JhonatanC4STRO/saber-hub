'use client';
import React from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  ArrowUp,
  Check,
  Book,
  Building,
  Users,
  Activity,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import HeaderAdmin from './HeaderAdmin';
import FooterAdmin from './FooterAdmin';

function timeAgo(dateInput) {
  if (!dateInput) return 'Hace un momento';
  const date = new Date(dateInput);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval >= 1) return `hace ${Math.floor(interval)} años`;
  interval = seconds / 2592000;
  if (interval >= 1) return `hace ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval >= 1) return `hace ${Math.floor(interval)} días`;
  interval = seconds / 3600;
  if (interval >= 1) return `hace ${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval >= 1) return `hace ${Math.floor(interval)} minutos`;
  return 'hace unos segundos';
}

function getIconForAction(action) {
  if (!action) return Activity;
  const a = action.toLowerCase();
  if (a.includes('login') || a.includes('auth')) return Users;
  if (a.includes('curso')) return Book;
  if (a.includes('usuario')) return Users;
  if (a.includes('institucion')) return Building;
  if (a.includes('solicitud')) return UserPlus;
  if (a.includes('delete') || a.includes('remove')) return ShieldAlert;
  return Check;
}

export default function DashboardAdmin({ usuario, stats = {} }) {
  const {
    usuariosTotales = 0,
    cursosPublicados = 0,
    certificadosEmitidos = 0,
    institucionesActivas = 0,
    solicitudesPendientes = [],
    actividadReciente = [],
    tasaFinalizacionGlobal = 0,
    top10Cursos = [],
  } = stats;

  return (
    <div
      className="min-h-screen bg-[#FFFFFF] font-sans"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <HeaderAdmin usuario={usuario} />

      {/* CUERPO DE LA PÁGINA */}
      <main className="max-w-[1440px] mx-auto px-6 md:px-8 pt-6 flex flex-col md:flex-row gap-8">
        {/* COLUMNA PRINCIPAL */}
        <div className="flex-grow md:w-[calc(100%-360px)]">
          <div className="flex items-center mb-8">
            <BookOpen size={40} className="text-[#1E40AF]" />
            <h1 className="font-bold text-[28px] text-[#111827] ml-3">Panel de Administración</h1>
          </div>

          <h2 className="font-bold text-[16px] text-[#111827] mt-6 mb-4">Resumen general</h2>

          {/* Tarjetas de métricas - Expandida a 5 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Link
              href="/dashboard/usuarios"
              className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 hover:bg-[#F9FAFB] cursor-pointer transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative block no-underline"
            >
              <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
                USUARIOS TOTALES
              </h3>
              <div className="font-bold text-[32px] text-[#111827] mt-2 mb-2">
                {usuariosTotales.toLocaleString()}
              </div>
              <div className="font-medium text-[13px] text-[#1E40AF] flex items-center">
                <ArrowUp size={14} className="mr-1" /> registrados
              </div>
            </Link>

            <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 hover:bg-[#F9FAFB] cursor-pointer transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
                CURSOS PUBLICADOS
              </h3>
              <div className="font-bold text-[32px] text-[#111827] mt-2 mb-2">
                {cursosPublicados.toLocaleString()}
              </div>
              <div className="font-medium text-[13px] text-[#1E40AF] flex items-center">
                <ArrowUp size={14} className="mr-1" /> en catálogo
              </div>
            </div>

            <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#10B981] rounded-[4px] p-5 hover:bg-[#F9FAFB] cursor-pointer transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
                TASA DE FINALIZACIÓN
              </h3>
              <div className="font-bold text-[32px] text-[#10B981] mt-2 mb-2">
                {tasaFinalizacionGlobal}%
              </div>
              <div className="font-medium text-[13px] text-[#10B981] flex items-center">
                <Check size={14} className="mr-1" /> global de egreso
              </div>
            </div>

            <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 hover:bg-[#F9FAFB] cursor-pointer transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
                CERTIFICADOS EMITIDOS
              </h3>
              <div className="font-bold text-[32px] text-[#111827] mt-2 mb-2">
                {certificadosEmitidos.toLocaleString()}
              </div>
              <div className="font-medium text-[13px] text-[#1E40AF] flex items-center">
                <ArrowUp size={14} className="mr-1" /> emitidos
              </div>
            </div>

            <Link
              href="/dashboard/instituciones/solicitudes"
              className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-5 hover:bg-[#F9FAFB] cursor-pointer transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] block"
            >
              <h3 className="font-medium text-[12px] text-[#6B7280] uppercase tracking-wide">
                INSTITUCIONES
              </h3>
              <div className="font-bold text-[32px] text-[#111827] mt-2 mb-2">
                {institucionesActivas.toLocaleString()}
              </div>
              <div className="font-medium text-[13px] text-[#1E40AF] flex items-center hover:underline">
                Ver solicitudes &rarr;
              </div>
            </Link>
          </div>

          {/* Top 10 Cursos con Más Alumnos */}
          <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-[18px] text-[#111827]">
                Top 10 Cursos con Más Alumnos
              </h3>
              <span className="bg-[#10B981] text-white font-semibold text-[11px] px-3 py-1 rounded-[4px] tracking-wide uppercase">
                Tendencia
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {top10Cursos && top10Cursos.length > 0 ? (
                top10Cursos.map((curso, index) => {
                  const maxAlumnos = top10Cursos[0].alumnosCount || 1;
                  const pct = Math.max(
                    5,
                    Math.min(100, Math.round((curso.alumnosCount / maxAlumnos) * 100))
                  );
                  return (
                    <div
                      key={curso.id}
                      className="flex flex-col gap-1.5 pb-3 border-b border-[#F3F4F6] last:border-0 last:pb-0"
                    >
                      <div className="flex justify-between items-center text-[14px]">
                        <div className="flex items-center min-w-0">
                          <span className="font-bold text-[#1E40AF] mr-3 w-5 flex-shrink-0 text-center">
                            {index + 1}.
                          </span>
                          <span
                            className="font-bold text-[#111827] truncate mr-2"
                            title={curso.titulo}
                          >
                            {curso.titulo}
                          </span>
                          <span className="text-[12px] bg-[#E0E7FF] text-[#1E40AF] px-2 py-0.5 rounded-[4px] font-medium hidden sm:inline-block flex-shrink-0">
                            {curso.categoria}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-bold text-[#111827]">
                            {curso.alumnosCount.toLocaleString()}
                          </span>
                          <span className="text-[#6B7280] text-[13px]">alumnos</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1E40AF] to-[#10B981] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-[#6B7280] py-4 text-[14px]">
                  No hay suficientes datos de inscripciones para mostrar tendencias.
                </div>
              )}
            </div>
          </div>

          {/* Solicitudes pendientes */}
          <div className="bg-[#FBFBFB] border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] rounded-[4px] p-6 mb-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[18px] text-[#111827]">Solicitudes pendientes</h3>
              <div className="bg-[#1E40AF] rounded-[4px] px-3 py-1 text-white font-semibold text-[11px]">
                {solicitudesPendientes.length} NUEVAS
              </div>
            </div>

            <div className="flex flex-col mt-4">
              {solicitudesPendientes.length > 0 ? (
                solicitudesPendientes.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer gap-2 sm:gap-0"
                  >
                    <span
                      className={`bg-[#1E40AF] text-white font-semibold text-[11px] px-[10px] py-[4px] rounded-[4px] w-fit sm:w-28 text-center tracking-wider`}
                    >
                      INSTRUCTOR
                    </span>
                    <span className="font-medium text-[14px] text-[#111827] sm:ml-4 flex-grow">
                      {req.usuario?.nombre || 'Usuario Desconocido'}
                    </span>
                    <span className="text-[#6B7280] text-[13px] sm:ml-4">
                      Solicitud {timeAgo(req.fechaSolicitud)}
                    </span>
                    <Link
                      href="/dashboard/solicitudes-instructor"
                      className="text-[#1E40AF] font-semibold text-[14px] sm:ml-8 hover:underline text-left sm:text-right mt-1 sm:mt-0"
                    >
                      Revisar &rarr;
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#6B7280] py-4 text-[14px]">
                  No hay solicitudes pendientes en este momento.
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/dashboard/instituciones/solicitudes"
                className="text-[#1E40AF] font-semibold text-[14px] hover:underline"
              >
                Ver todas las solicitudes &rarr;
              </Link>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="mb-8">
            <h3 className="font-bold text-[18px] text-[#111827] mb-4">Actividad reciente</h3>
            <div className="flex flex-col">
              {actividadReciente.length > 0 ? (
                actividadReciente.map((activity) => {
                  const Icono = getIconForAction(activity.accion);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center py-4 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full border-[2px] border-[#1E40AF] bg-white flex items-center justify-center flex-shrink-0">
                        <Icono size={16} className="text-[#1E40AF]" />
                      </div>
                      <div className="ml-4 flex flex-col justify-center">
                        <span className="font-medium text-[14px] text-[#111827]">
                          {activity.usuario?.nombre ? `${activity.usuario.nombre} - ` : ''}
                          {activity.accion} en {activity.tabla || 'sistema'}
                        </span>
                        <span className="text-[12px] text-[#6B7280] mt-0.5">
                          {timeAgo(activity.fecha)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-[#6B7280] py-4 text-[14px]">
                  No hay actividad reciente registrada.
                </div>
              )}
            </div>
            {actividadReciente.length > 0 && (
              <div className="mt-6 text-center">
                <Link
                  href="/dashboard/auditoria"
                  className="text-[#1E40AF] font-semibold text-[14px] hover:underline"
                >
                  Ver todo el historial &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR DERECHO */}
        <aside className="w-full md:w-[360px] flex-shrink-0 bg-white md:px-0">
          {/* Latest Achievements */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[16px] text-[#111827]">Logros recientes</h3>
              <a href="#" className="font-medium text-[13px] text-[#1E40AF] hover:underline">
                Ver todo
              </a>
            </div>

            <div className="flex flex-col border-t border-[#F3F4F6]">
              {[
                {
                  title: `Plataforma alcanzó ${cursosPublicados} cursos`,
                  sub: `Hito: ${cursosPublicados} Cursos Publicados`,
                },
                {
                  title: `${certificadosEmitidos} certificados emitidos`,
                  sub: `Hito: ${certificadosEmitidos} Certificados`,
                },
                {
                  title: `Top institución: ${institucionesActivas} Activas`,
                  sub: 'Reconocimiento Institucional',
                },
              ].map((ach, i) => (
                <div
                  key={i}
                  className="flex py-5 border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                >
                  <div className="w-[64px] h-[64px] rounded-full border-[4px] border-[#1E40AF] bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <BookOpen size={28} className="text-[#1E40AF]" />
                  </div>
                  <div className="ml-4 flex flex-col justify-center">
                    <span className="font-medium text-[11px] text-[#6B7280] uppercase tracking-wide">
                      LOGRO
                    </span>
                    <span className="font-bold text-[15px] text-[#111827] leading-[1.3] my-1">
                      {ach.title}
                    </span>
                    <div className="flex items-center text-[#6B7280] text-[12px] gap-1">
                      <Book size={14} className="text-[#1E40AF] shrink-0" /> {ach.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximas tareas */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[16px] text-[#111827]">Próximas tareas</h3>
              <a href="#" className="font-medium text-[13px] text-[#1E40AF] hover:underline">
                Ver todo
              </a>
            </div>
            <div className="bg-[#FBFBFB] border border-[#F3F4F6] rounded-[4px] p-8 flex flex-col items-center text-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="w-[100px] h-[100px] mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                <Search size={40} className="text-[#9CA3AF]" />
              </div>
              <h4 className="font-bold text-[16px] text-[#111827]">No hay tareas pendientes</h4>
              <p className="font-normal text-[13px] text-[#6B7280] mt-1">¡Estás al día con todo!</p>
            </div>
          </div>
        </aside>
      </main>

      <FooterAdmin className="mt-16" />
    </div>
  );
}
