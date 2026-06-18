'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, RefreshCw } from 'lucide-react';

export default function ScormPlayerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leccionId = searchParams.get('leccionId');
  const scormUrl = searchParams.get('url');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cmiStore, setCmiStore] = useState({});
  const [successNotif, setSuccessNotif] = useState(false);
  const cmiStoreRef = useRef({});

  // Cargar progreso previo del estudiante
  useEffect(() => {
    if (!leccionId || !scormUrl) {
      setError('Faltan parámetros necesarios para reproducir esta lección.');
      setLoading(false);
      return;
    }

    async function loadProgress() {
      try {
        const res = await fetch(`/api/progreso/scorm?leccionId=${leccionId}`);
        if (!res.ok) throw new Error('Error al cargar progreso previo');
        const data = await res.json();

        setCmiStore(data.cmiData || {});
        cmiStoreRef.current = data.cmiData || {};

        setupScormApis(data.cmiData || {});
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('No se pudo conectar con el servidor de progreso.');
        setLoading(false);
      }
    }

    loadProgress();

    // Cleanup APIs on unmount
    return () => {
      delete window.API;
      delete window.API_1484_11;
    };
  }, [leccionId, scormUrl]);

  // Sincronizar el progreso con el backend
  const saveScormProgress = async (cmiData) => {
    try {
      const res = await fetch('/api/progreso/scorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leccionId, cmiData }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.leccionCompletada) {
          setSuccessNotif(true);
          setTimeout(() => setSuccessNotif(false), 5000);
        }
      }
    } catch (err) {
      console.error('[SCORM Sync Error]:', err);
    }
  };

  // Configurar las APIs de los estándares en el objeto global window
  const setupScormApis = (initialCmi) => {
    // ----------------------------------------------------
    // SCORM 1.2 API
    // ----------------------------------------------------
    window.API = {
      LMSInitialize: function (param) {
        console.log('[SCORM 1.2] LMSInitialize');
        return 'true';
      },
      LMSFinish: function (param) {
        console.log('[SCORM 1.2] LMSFinish');
        this.LMSCommit('');
        return 'true';
      },
      LMSGetValue: function (element) {
        const val = cmiStoreRef.current[element] || '';
        console.log(`[SCORM 1.2] LMSGetValue "${element}" => "${val}"`);
        return val;
      },
      LMSSetValue: function (element, value) {
        console.log(`[SCORM 1.2] LMSSetValue "${element}" = "${value}"`);
        cmiStoreRef.current = {
          ...cmiStoreRef.current,
          [element]: String(value),
          'cmi.core.lesson_status':
            element === 'cmi.core.lesson_status'
              ? String(value)
              : cmiStoreRef.current['cmi.core.lesson_status'] || 'incomplete',
        };
        // Refrescar el estado de React
        setCmiStore({ ...cmiStoreRef.current });
        return 'true';
      },
      LMSCommit: function (param) {
        console.log('[SCORM 1.2] LMSCommit');
        saveScormProgress(cmiStoreRef.current);
        return 'true';
      },
      LMSGetLastError: () => '0',
      LMSGetErrorString: (code) => 'No error',
      LMSGetDiagnostic: (code) => 'No diagnostic info',
    };

    // ----------------------------------------------------
    // SCORM 2004 API (API_1484_11)
    // ----------------------------------------------------
    window.API_1484_11 = {
      Initialize: function (param) {
        console.log('[SCORM 2004] Initialize');
        return 'true';
      },
      Terminate: function (param) {
        console.log('[SCORM 2004] Terminate');
        this.Commit('');
        return 'true';
      },
      GetValue: function (element) {
        const val = cmiStoreRef.current[element] || '';
        console.log(`[SCORM 2004] GetValue "${element}" => "${val}"`);
        return val;
      },
      SetValue: function (element, value) {
        console.log(`[SCORM 2004] SetValue "${element}" = "${value}"`);
        cmiStoreRef.current = {
          ...cmiStoreRef.current,
          [element]: String(value),
          'cmi.completion_status':
            element === 'cmi.completion_status'
              ? String(value)
              : cmiStoreRef.current['cmi.completion_status'] || 'incomplete',
          'cmi.success_status':
            element === 'cmi.success_status'
              ? String(value)
              : cmiStoreRef.current['cmi.success_status'] || 'unknown',
        };
        // Refrescar el estado de React
        setCmiStore({ ...cmiStoreRef.current });
        return 'true';
      },
      Commit: function (param) {
        console.log('[SCORM 2004] Commit');
        saveScormProgress(cmiStoreRef.current);
        return 'true';
      },
      GetLastError: () => '0',
      GetErrorString: (code) => 'No error',
      GetDiagnostic: (code) => 'No diagnostic info',
    };
  };

  const handleManualCommit = () => {
    saveScormProgress(cmiStoreRef.current);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white font-sans">
        <RefreshCw className="animate-spin text-teal-400 w-12 h-12 mb-4" />
        <p className="text-slate-400 animate-pulse">Cargando estándar y emuladores SCORM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-white font-sans p-6">
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-8 max-width-md text-center backdrop-blur-md">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Error de Carga</h1>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-red-800 hover:bg-red-700 transition rounded-lg font-semibold text-sm shadow-lg shadow-red-900/30"
          >
            Volver al Aula Virtual
          </button>
        </div>
      </div>
    );
  }

  // Detectar estado de lección actual para mostrar badge premium
  const status12 = cmiStore['cmi.core.lesson_status'] || 'incomplete';
  const status2004 = cmiStore['cmi.completion_status'] || 'incomplete';
  const isCompleted =
    status12 === 'completed' || status12 === 'passed' || status2004 === 'completed';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans overflow-hidden select-none">
      {/* Premium Glassmorphic Header */}
      <header className="h-16 border-b border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Volver al curso"
            className="p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <h1 className="text-white font-bold text-base truncate max-w-xs sm:max-w-md md:max-w-lg">
              Contenido Interactivo SCORM
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <span
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-300 ${
              isCompleted
                ? 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            {isCompleted ? 'Completado' : 'En Curso'}
          </span>

          {/* Sync indicator button */}
          <button
            onClick={handleManualCommit}
            className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 active:scale-95 transition text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronizar
          </button>
        </div>
      </header>

      {/* Embedded Iframe Container */}
      <main className="flex-1 bg-slate-900 relative">
        <iframe
          src={scormUrl}
          title="Visor de Contenido SCORM"
          className="w-full h-full border-0 absolute inset-0 bg-white"
          allow="autoplay; fullscreen; encrypted-media"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />

        {/* Floating Beautiful Success Micro-Animation */}
        {successNotif && (
          <div className="absolute bottom-6 right-6 bg-slate-900/90 border border-teal-500/40 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce backdrop-blur-md max-w-sm border-l-4 border-l-teal-500">
            <CheckCircle className="w-6 h-6 text-teal-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-teal-400">¡Lección Completada!</p>
              <p className="text-slate-300 text-xs mt-0.5">
                El progreso interactivo se ha reportado con éxito al aula virtual.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
