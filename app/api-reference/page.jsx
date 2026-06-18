'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, ExternalLink, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ApiReferencePage() {
  const router = useRouter();
  const [swaggerReady, setSwaggerReady] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js';
    script.async = true;
    script.onload = () => setSwaggerReady(true);
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (swaggerReady && window.SwaggerUIBundle) {
      window.SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [window.SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
      });
    }
  }, [swaggerReady]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-teal-500/30 selection:text-teal-300">
      <header className="sticky top-0 z-50 h-20 border-b border-white/10 bg-slate-900/70 backdrop-blur-md flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            aria-label="Volver al inicio"
            className="p-2.5 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-teal-500/20 rounded-lg text-teal-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black tracking-tight text-white">
                SABERHUB <span className="text-teal-400 font-medium">Developer API</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Especificación OpenAPI 3.0 / Swagger UI</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition text-xs font-semibold flex items-center gap-1.5 border border-white/10"
          >
            <span>Ver openapi.json</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            Sesión Segura (JWT)
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900/30 via-slate-900 to-indigo-950/20 border border-white/10 p-8 md:p-10 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10" />
          <div>
            <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold rounded-md uppercase tracking-wider">
              Documentación Oficial
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-3 text-white">
              Conecta SABERHUB con tu ecosistema educativo
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
              Consola interactiva de pruebas para explorar el núcleo del LMS. Puedes realizar
              peticiones directas desde el navegador para depurar flujos, gestionar integraciones de
              videoconferencia o suscribirte a nuestros webhooks de eventos clave.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl relative">
          {!swaggerReady ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm animate-pulse">Cargando consola interactiva...</p>
            </div>
          ) : (
            <div id="swagger-ui" className="swagger-dark-theme-overrides" />
          )}
        </div>
      </main>

      <style jsx global>{`
        .swagger-dark-theme-overrides .swagger-ui {
          filter: invert(88%) hue-rotate(180deg);
          font-family: inherit;
        }
        .swagger-dark-theme-overrides .swagger-ui .info { margin: 0 0 20px 0 !important; }
        .swagger-dark-theme-overrides .swagger-ui .info .title { color: #0b1329 !important; }
        .swagger-dark-theme-overrides .swagger-ui .scheme-container {
          background: #ffffff0a !important;
          box-shadow: none !important;
          border: 1px solid #00000010 !important;
          border-radius: 12px !important;
          padding: 15px !important;
          margin-bottom: 20px !important;
        }
        .swagger-dark-theme-overrides .swagger-ui .opblock-tag-section {
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .swagger-dark-theme-overrides .swagger-ui .opblock {
          border-radius: 12px !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          overflow: hidden !important;
        }
        .swagger-dark-theme-overrides .swagger-ui .opblock .opblock-summary {
          padding: 12px 20px !important;
        }
      `}</style>
    </div>
  );
}
