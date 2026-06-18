'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  FileText,
  Bell,
  ChevronRight,
  MessageSquare,
  BookOpen,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';

export default function WorkspaceListadoPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchUsuario() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUsuario(data);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    fetchUsuario();
  }, []);

  useEffect(() => {
    if (usuario && usuario.rol === 'admin') {
      router.push('/dashboard/grupos');
    }
  }, [usuario, router]);

  useEffect(() => {
    async function fetchGrupos() {
      try {
        const res = await fetch('/api/grupos/miembros');
        if (!res.ok) {
          throw new Error('Error al cargar tus espacios colaborativos.');
        }
        const data = await res.json();
        setGrupos(data);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchGrupos();
  }, []);

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
          Cargando tus grupos...
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
      <div style={{ padding: '24px 32px', minHeight: 'calc(100vh - 80px)', background: '#F9FAFB' }}>
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '0 20px',
            fontFamily: "'Inter', sans-serif",
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
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#64748b',
                fontSize: '13px',
                margin: 0,
              }}
            >
              <span>Inicio</span>
              <span>&gt;</span>
              <span style={{ fontWeight: '600', color: '#1e293b' }}>Espacios Colaborativos</span>
            </h2>
          </div>

          {/* Titulo y Descripción */}
          <div style={{ marginBottom: '36px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '800',
                color: '#0f172a',
                letterSpacing: '-0.025em',
                margin: '0 0 10px 0',
              }}
            >
              Espacios Colaborativos por Grupo
            </h1>
            <p
              style={{
                fontSize: '16px',
                color: '#64748b',
                margin: 0,
                lineHeight: '1.6',
                maxWidth: '800px',
              }}
            >
              Bienvenido a tu centro de colaboración por cohortes. Aquí encontrarás tus equipos de
              trabajo y grupos de estudio activos. Comparte avisos en el tablón, intercambia
              archivos con control de versiones y chatea en tiempo real.
            </p>
          </div>

          {/* Alerta de Error */}
          {errorMsg && (
            <div
              style={{
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
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Listado de Espacios */}
          {grupos.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                border: '2px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '60px 40px',
                textAlign: 'center',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <Users size={40} />
              </div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: '0 0 8px 0',
                }}
              >
                Aún no perteneces a ningún grupo
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0,
                  maxWidth: '420px',
                  lineHeight: '1.5',
                }}
              >
                Los espacios colaborativos se crean y asignan automáticamente al formar parte de
                cohortes o grupos específicos en tus cursos matriculados.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {grupos.map((grupo) => (
                <div
                  key={grupo.id}
                  onClick={() => router.push(`/dashboard/grupos/workspace/${grupo.id}`)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '24px',
                    cursor: 'pointer',
                    boxShadow:
                      '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '220px',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow =
                      '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow =
                      '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  {/* Información Superior */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Users size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          backgroundColor: grupo.activo ? '#ecfdf5' : '#f1f5f9',
                          color: grupo.activo ? '#047857' : '#475569',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {grupo.activo ? 'Activo' : 'Cerrado'}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#0f172a',
                        margin: '0 0 6px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {grupo.nombre}
                    </h3>

                    <p
                      style={{
                        fontSize: '13px',
                        color: '#64748b',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.5',
                        height: '40px',
                      }}
                    >
                      {grupo.descripcion ||
                        'Sin descripción provista para este espacio colaborativo.'}
                    </p>
                  </div>

                  {/* Contadores y Footer de la Tarjeta */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '14px',
                      marginTop: '10px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        color: '#94a3b8',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                        }}
                        title="Miembros"
                      >
                        <Users size={14} />
                        <strong style={{ color: '#64748b' }}>{grupo._count.miembros}</strong>
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                        }}
                        title="Archivos Compartidos"
                      >
                        <FileText size={14} />
                        <strong style={{ color: '#64748b' }}>{grupo._count.archivos}</strong>
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                        }}
                        title="Avisos del Tablón"
                      >
                        <Bell size={14} />
                        <strong style={{ color: '#64748b' }}>{grupo._count.avisos}</strong>
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#1e40af',
                        fontSize: '12px',
                        fontWeight: '700',
                        gap: '2px',
                      }}
                    >
                      Entrar
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
