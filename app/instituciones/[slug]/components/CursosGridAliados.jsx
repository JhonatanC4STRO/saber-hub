'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import EnrollButton from './EnrollButton';
import { BookOpen, Clock, Users, ExternalLink } from 'lucide-react';

export default function CursosGridAliados({
  todosLosCursos,
  loggedIn,
  slug,
  institucionNombre,
}) {
  const [visibleCount, setVisibleCount] = useState(6); // Iniciamos con 6 cursos para que llene perfectamente 2 filas en pantallas de 3 columnas
  const visibleCursos = todosLosCursos.slice(0, visibleCount);

  if (todosLosCursos.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white/40 dark:bg-zinc-900/30 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-800/40 rounded-2xl max-w-lg mx-auto">
        <BookOpen size={48} className="mx-auto text-slate-400 dark:text-zinc-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">
          Sin cursos publicados
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Esta institución no cuenta con cursos publicados en este momento. Te sugerimos
          revisar más tarde o explorar cursos de otras instituciones.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-md"
          >
            Explorar Catálogo General
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {visibleCursos.map((curso) => (
          <article
            key={curso.id}
            id={`course-card-${curso.id}`}
            className="group flex flex-col justify-between overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/75 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-indigo-500"
          >
            {/* Portada del curso con zoom y badge de nivel */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-zinc-850 shrink-0 select-none">
              {curso.isExterno ? (
                curso.imagenUrl ? (
                  <img
                    src={curso.imagenUrl}
                    alt={`Portada de ${curso.titulo}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-indigo-950/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <BookOpen size={48} className="text-slate-400/80 dark:text-zinc-650" />
                  </div>
                )
              ) : (
                curso.imgPortada ? (
                  <img
                    src={curso.imgPortada}
                    alt={`Portada de ${curso.titulo}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-indigo-100 dark:from-zinc-900 dark:to-indigo-950/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <BookOpen size={48} className="text-slate-400/80 dark:text-zinc-600/70" />
                  </div>
                )
              )}

              {/* Tag de Categoría */}
              {curso.isExterno ? (
                curso.areaConocimiento && (
                  <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-emerald-600/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow">
                    {curso.areaConocimiento}
                  </span>
                )
              ) : (
                curso.categoria && (
                  <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-indigo-600/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow">
                    {curso.categoria.nombre}
                  </span>
                )
              )}

              {/* Tag de Nivel */}
              {curso.nivel && (
                <span className="absolute top-4 right-4 z-10 px-2 py-0.5 bg-slate-900/85 backdrop-blur-sm text-zinc-100 text-[10px] font-medium capitalize rounded-md shadow border border-white/10">
                  {curso.nivel}
                </span>
              )}
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                {/* Título del curso */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {curso.isExterno ? (
                    <a
                      href={curso.fuenteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline focus:outline-none"
                      aria-label={`Ver curso ${curso.titulo}`}
                    >
                      {curso.titulo}
                    </a>
                  ) : (
                    <Link
                      href={`/cursos/${curso.id}`}
                      className="hover:underline focus:outline-none"
                      aria-label={`Ver curso ${curso.titulo}`}
                    >
                      {curso.titulo}
                    </Link>
                  )}
                </h3>

                {/* Instructor / Origen */}
                {curso.isExterno ? (
                  <div className="mt-3.5 flex items-center text-sm">
                    <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden bg-indigo-55 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                      🎓
                    </div>
                    <span className="ml-2 font-semibold text-slate-600 dark:text-zinc-300 line-clamp-1">
                      {curso.fuenteNombre || institucionNombre}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3.5 flex items-center text-sm">
                    <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                      {curso.instructor.imagen ? (
                        <img
                          src={curso.instructor.imagen}
                          alt={`Instructor ${curso.instructor.nombre}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-300 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center">
                          {curso.instructor.nombre.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="ml-2 font-medium text-slate-600 dark:text-zinc-350 line-clamp-1">
                      {curso.instructor.nombre}
                    </span>
                  </div>
                )}

                {/* Breve descripción */}
                {curso.descripcion && (
                  <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {curso.descripcion}
                  </p>
                )}
              </div>

              {/* Fila inferior de especificaciones e inscripciones */}
              <div className="mt-5 border-t border-slate-100 dark:border-zinc-800 pt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-4">
                  <div
                    className="flex items-center gap-1.5"
                    aria-label={`Duración del curso: ${curso.duracionCalculada}`}
                  >
                    <Clock size={15} className="text-slate-400 dark:text-zinc-500" />
                    <span>{curso.duracionCalculada}</span>
                  </div>

                  {curso.isExterno ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-450">
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold rounded border border-emerald-100 dark:border-emerald-900/50">
                        Acceso Externo
                      </span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1.5"
                      aria-label={`Número de estudiantes inscritos: ${curso._count.inscripciones}`}
                    >
                      <Users size={15} className="text-slate-400 dark:text-zinc-500" />
                      <span>{curso._count.inscripciones} inscritos</span>
                    </div>
                  )}
                </div>

                {/* Botón de acciones */}
                {curso.isExterno ? (
                  <div className="mt-1">
                    <a
                      href={curso.fuenteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer no-underline"
                    >
                      <span>Ir al curso oficial</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <Link
                      id={`course-detail-btn-${curso.id}`}
                      href={`/cursos/${curso.id}`}
                      className="flex items-center justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-slate-200/30 dark:border-zinc-700/50"
                    >
                      Ver detalle
                    </Link>

                    <EnrollButton
                      id={`enroll-btn-${curso.id}`}
                      courseId={curso.id}
                      initiallyEnrolled={curso.yaInscrito}
                      loggedIn={loggedIn}
                      slug={slug}
                    />
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Botón premium de ver más */}
      {todosLosCursos.length > visibleCount && (
        <div className="flex justify-center mt-12 w-full">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-8 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/85 text-[#1E40AF] dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 font-semibold text-sm rounded-xl shadow-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2 hover:shadow-indigo-500/5"
          >
            <span>Ver más cursos</span>
            <span className="text-[11px] px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-md font-medium">
              +{todosLosCursos.length - visibleCount}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
