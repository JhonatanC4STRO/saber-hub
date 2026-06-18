'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Mail, Settings, Save, ArrowLeft, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';

export default function PreferenciasNotificacionesPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [preferences, setPreferences] = useState({
    prefEmailInscripcion: true,
    prefInAppInscripcion: true,
    prefEmailEvaluacion: true,
    prefInAppEvaluacion: true,
    prefEmailCertificado: true,
    prefInAppCertificado: true,
    prefEmailForo: true,
    prefInAppForo: true,
    prefEmailMensaje: true,
    prefInAppMensaje: true,
    prefEmailSesion: true,
    prefInAppSesion: true,
    prefEmailSolicitud: true,
    prefInAppSolicitud: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch current user details
  useEffect(() => {
    async function obtenerUsuario() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const u = await res.json();
          setUsuario(u);
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      }
    }
    obtenerUsuario();
  }, []);

  // Fetch initial preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch('/api/notificaciones/preferencias');
        if (!res.ok) {
          throw new Error('No se pudieron cargar las preferencias de notificación.');
        }
        const data = await res.json();
        setPreferences(data);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/notificaciones/preferencias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar los ajustes.');
      }

      setSuccessMsg('Preferencias guardadas exitosamente.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const categorias = [
    {
      titulo: 'Inscripciones a Cursos',
      descripcion:
        'Alertas cuando te matriculas en un curso o cuando un estudiante se inscribe en uno de tus cursos dictados.',
      prefEmail: 'prefEmailInscripcion',
      prefInApp: 'prefInAppInscripcion',
      iconColor: '#3B82F6',
    },
    {
      titulo: 'Evaluaciones y Cuestionarios',
      descripcion: 'Notificaciones sobre nuevas pruebas publicadas o asignadas en tus asignaturas.',
      prefEmail: 'prefEmailEvaluacion',
      prefInApp: 'prefInAppEvaluacion',
      iconColor: '#EF4444',
    },
    {
      titulo: 'Certificados y Diplomas',
      descripcion:
        'Avisos premium cuando completas exitosamente un curso o una ruta de aprendizaje y tu certificado es emitido.',
      prefEmail: 'prefEmailCertificado',
      prefInApp: 'prefInAppCertificado',
      iconColor: '#F59E0B',
    },
    {
      titulo: 'Foros de Discusión',
      descripcion:
        'Notificación cuando otros miembros de la comunidad responden a tus hilos o publicaciones en los foros de cursos.',
      prefEmail: 'prefEmailForo',
      prefInApp: 'prefInAppForo',
      iconColor: '#10B981',
    },
    {
      titulo: 'Mensajes Directos y Grupales',
      descripcion:
        'Alertas instantáneas al recibir correspondencia privada de tutores, instructores o en chats de grupos de trabajo.',
      prefEmail: 'prefEmailMensaje',
      prefInApp: 'prefInAppMensaje',
      iconColor: '#8B5CF6',
    },
    {
      titulo: 'Clases en Vivo y Sesiones',
      descripcion:
        'Recordatorios y enlaces para unirte a las videoconferencias sincronizadas programadas en Google Meet.',
      prefEmail: 'prefEmailSesion',
      prefInApp: 'prefInAppSesion',
      iconColor: '#065F46',
    },
    {
      titulo: 'Postulación a Instructor',
      descripcion:
        'Actualizaciones de estatus referentes a tu trámite de postulación para convertirte en instructor certificado de SABERHUB.',
      prefEmail: 'prefEmailSolicitud',
      prefInApp: 'prefInAppSolicitud',
      iconColor: '#EC4899',
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: '16px',
        }}
      >
        <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: '#1E40AF' }} size={40} />
        <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>
          Cargando tus ajustes...
        </p>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `,
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <HeaderAdmin usuario={usuario} />
      <div
        style={{
          maxWidth: '800px',
          margin: '30px auto',
          padding: '0 20px',
          fontFamily: "'Inter', sans-serif",
          width: '100%',
        }}
      >
        {/* Cabecera / Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            <span>Ajustes</span>
            <span>&gt;</span>
            <span style={{ fontWeight: '600', color: '#1e293b' }}>
              Preferencias de Notificación
            </span>
          </div>
        </div>

        {/* Título Principal */}
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: '0 0 8px 0',
            }}
          >
            Preferencias de Notificación
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
            Personaliza los canales a través de los cuales deseas recibir alertas. Puedes activar o
            desactivar independientemente el envío de correos electrónicos y las notificaciones en
            la plataforma (In-App) para cada categoría.
          </p>
        </div>

        {/* Alertas de Estado */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '16px',
              color: '#b91c1c',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '24px',
            }}
          >
            <ShieldAlert size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '12px',
              padding: '16px',
              color: '#15803d',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '24px',
            }}
          >
            <Check size={20} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Panel Premium de Toggles */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025)',
            overflow: 'hidden',
            marginBottom: '32px',
          }}
        >
          {/* Cabecera del Panel */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '16px 24px',
              fontWeight: '700',
              fontSize: '13px',
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <div style={{ flex: '1' }}>Categoría de Notificación</div>
            <div style={{ width: '120px', textAlign: 'center' }}>In-App</div>
            <div style={{ width: '120px', textAlign: 'center' }}>Por Correo</div>
          </div>

          {/* Listado de Categorías */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categorias.map((cat, idx) => {
              const valInApp = preferences[cat.prefInApp];
              const valEmail = preferences[cat.prefEmail];

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '24px',
                    borderBottom: idx === categorias.length - 1 ? 'none' : '1px solid #f1f5f9',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Info de la Categoría */}
                  <div style={{ flex: '1', paddingRight: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '6px',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: cat.iconColor,
                        }}
                      />
                      <h3
                        style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}
                      >
                        {cat.titulo}
                      </h3>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      {cat.descripcion}
                    </p>
                  </div>

                  {/* Switch In-App */}
                  <div style={{ width: '120px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleToggle(cat.prefInApp)}
                      aria-label={`Toggle In-App notifications for ${cat.titulo}`}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '15px',
                        backgroundColor: valInApp ? '#1e40af' : '#cbd5e1',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.25s ease',
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          position: 'absolute',
                          top: '3px',
                          left: valInApp ? '25px' : '3px',
                          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      />
                    </button>
                  </div>

                  {/* Switch Email */}
                  <div style={{ width: '120px', display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleToggle(cat.prefEmail)}
                      aria-label={`Toggle Email notifications for ${cat.titulo}`}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '15px',
                        backgroundColor: valEmail ? '#10b981' : '#cbd5e1',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.25s ease',
                        padding: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          position: 'absolute',
                          top: '3px',
                          left: valEmail ? '25px' : '3px',
                          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button
            onClick={() => router.back()}
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ffffff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              backgroundColor: '#1e40af',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(30, 64, 175, 0.2)',
              transition: 'all 0.2s',
              opacity: saving ? 0.75 : 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d358f')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e40af')}
          >
            {saving ? (
              <>
                <RefreshCw style={{ animation: 'spin 1s linear infinite' }} size={16} />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
