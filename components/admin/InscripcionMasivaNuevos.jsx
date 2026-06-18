'use client';
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// Columnas requeridas en el Excel (en este orden)
const COLUMNAS = ['nombre', 'email', 'documento'];
const LABELS = {
  nombre: 'Nombre Completo',
  email: 'Correo Electrónico',
  documento: 'Número de Documento',
};

export default function InscripcionMasivaNuevos({ curso, onCerrar }) {
  const [filas, setFilas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState('');
  const fileRef = useRef(null);

  // ── Descargar plantilla Excel ──────────────────────────────────────────────
  const descargarPlantilla = () => {
    const datos = [
      ['Nombre Completo', 'Correo Electrónico', 'Número de Documento'],
      ['Juan Pérez López', 'juan@correo.com', '1024803421'],
      ['María García Torres', 'maria@correo.com', '987654321'],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);

    // Ancho de columnas
    ws['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, `plantilla_inscripcion_${curso.titulo.replace(/\s+/g, '_')}.xlsx`);
  };

  // ── Leer archivo Excel ─────────────────────────────────────────────────────
  const handleArchivo = (e) => {
    const file = e.target.files[0];
    setErrorArchivo('');
    setResultado(null);
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx'].includes(ext)) {
      setErrorArchivo('Solo se aceptan archivos .xls o .xlsx');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (raw.length < 2) {
          setErrorArchivo('El archivo no tiene datos (solo el encabezado o está vacío).');
          return;
        }

        // Normalizar encabezados: quitar tildes, espacios, mayúsculas
        const normalizar = (s) =>
          String(s)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
        const encabezados = raw[0].map(normalizar);

        // Mapear columnas esperadas a índices del Excel
        const mapaColumnas = {
          nombre: encabezados.findIndex((h) => h.includes('nombre')),
          email: encabezados.findIndex(
            (h) => h.includes('correo') || h.includes('email') || h.includes('mail')
          ),
          documento: encabezados.findIndex(
            (h) => h.includes('documento') || h.includes('cedula') || h.includes('id')
          ),
        };

        const faltantes = COLUMNAS.filter((c) => mapaColumnas[c] === -1);
        if (faltantes.length > 0) {
          setErrorArchivo(
            `Columnas no encontradas en el Excel: ${faltantes.map((f) => LABELS[f]).join(', ')}.\nDescarga la plantilla para ver el formato correcto.`
          );
          return;
        }

        const parsed = raw
          .slice(1)
          .filter((fila) => fila.some((c) => String(c).trim() !== '')) // ignorar filas vacías
          .map((fila) => ({
            nombre: String(fila[mapaColumnas.nombre] ?? '').trim(),
            email: String(fila[mapaColumnas.email] ?? '')
              .trim()
              .toLowerCase(),
            documento: String(fila[mapaColumnas.documento] ?? '').trim(),
          }))
          .filter((r) => r.nombre || r.email || r.documento);

        if (parsed.length === 0) {
          setErrorArchivo('No se encontraron filas con datos válidos.');
          return;
        }

        setFilas(parsed);
      } catch (err) {
        setErrorArchivo('Error al leer el archivo: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Enviar al servidor ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (filas.length === 0) {
      alert('Primero carga un archivo Excel.');
      return;
    }

    const incompletas = filas.filter((f) => !f.nombre || !f.email || !f.documento);
    if (incompletas.length > 0) {
      alert(`${incompletas.length} fila(s) tienen campos incompletos. Revisa el archivo.`);
      return;
    }

    if (
      !confirm(
        `¿Inscribir ${filas.length} persona(s) al curso "${curso.titulo}"?\n\n⚠️ La contraseña de cada cuenta nueva será su número de documento.`
      )
    )
      return;

    setEnviando(true);
    setResultado(null);

    try {
      const res = await fetch('/api/inscripciones/masiva-nuevos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId: curso.id, usuarios: filas }),
      });
      const data = await res.json();
      setResultado(data);
    } catch {
      alert('Error de red. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const limpiar = () => {
    setFilas([]);
    setResultado(null);
    setErrorArchivo('');
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        zIndex: 2000,
        overflowY: 'auto',
        padding: '40px 16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '860px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          padding: '32px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#202124' }}>📊 Inscripción Masiva desde Excel</h2>
            <p style={{ margin: '6px 0 0 0', color: '#5f6368', fontSize: '14px' }}>
              Curso: <strong>{curso.titulo}</strong>
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#80868b', fontSize: '13px' }}>
              Las cuentas nuevas se crean con contraseña igual al número de documento.
            </p>
          </div>
          <button
            onClick={onCerrar}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#5f6368',
            }}
          >
            ✖
          </button>
        </div>

        {/* Paso 1: Descargar plantilla */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #e0e0e0',
          }}
        >
          <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#202124' }}>
            Paso 1 — Descarga la plantilla
          </p>
          <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#5f6368' }}>
            El archivo debe tener estas columnas (en cualquier orden):
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {COLUMNAS.map((c) => (
              <span
                key={c}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#e8f0fe',
                  color: '#1a73e8',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {LABELS[c]}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={descargarPlantilla}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#137333',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            ⬇️ Descargar Plantilla .xlsx
          </button>
        </div>

        {/* Paso 2: Cargar archivo */}
        <div
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #e0e0e0',
          }}
        >
          <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#202124' }}>
            Paso 2 — Carga el archivo completado
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xls,.xlsx"
            onChange={handleArchivo}
            style={{ display: 'block', marginBottom: '8px' }}
          />
          <p style={{ margin: 0, fontSize: '12px', color: '#80868b' }}>
            Formatos aceptados: .xls, .xlsx
          </p>
          {errorArchivo && (
            <div
              style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#fce8e6',
                borderRadius: '6px',
                border: '1px solid #f5c6c6',
                color: '#c5221f',
                fontSize: '13px',
                whiteSpace: 'pre-wrap',
              }}
            >
              ❌ {errorArchivo}
            </div>
          )}
        </div>

        {/* Tabla de vista previa */}
        {filas.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <p style={{ margin: 0, fontWeight: 'bold', color: '#202124' }}>
                Paso 3 — Vista previa ({filas.length} registro{filas.length !== 1 ? 's' : ''})
              </p>
              <button
                type="button"
                onClick={limpiar}
                style={{
                  padding: '5px 12px',
                  backgroundColor: 'transparent',
                  color: '#c5221f',
                  border: '1px solid #c5221f',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                🗑️ Limpiar
              </button>
            </div>

            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ backgroundColor: '#f1f3f4' }}>
                    <th
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        color: '#5f6368',
                        borderBottom: '1px solid #e0e0e0',
                        width: '32px',
                      }}
                    >
                      #
                    </th>
                    {COLUMNAS.map((c) => (
                      <th
                        key={c}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          color: '#5f6368',
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        {LABELS[c]}
                      </th>
                    ))}
                    <th
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        color: '#5f6368',
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      Contraseña inicial
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => {
                    const incompleto = !f.nombre || !f.email || !f.documento;
                    return (
                      <tr
                        key={i}
                        style={{
                          backgroundColor: incompleto
                            ? '#fff8e1'
                            : i % 2 === 0
                              ? '#fff'
                              : '#fafafa',
                          borderBottom: '1px solid #f1f3f4',
                        }}
                      >
                        <td style={{ padding: '8px 12px', color: '#80868b' }}>{i + 1}</td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: incompleto && !f.nombre ? '#c5221f' : '#202124',
                          }}
                        >
                          {f.nombre || '⚠️ vacío'}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: incompleto && !f.email ? '#c5221f' : '#202124',
                          }}
                        >
                          {f.email || '⚠️ vacío'}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: incompleto && !f.documento ? '#c5221f' : '#202124',
                          }}
                        >
                          {f.documento || '⚠️ vacío'}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: '#137333',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                          }}
                        >
                          {f.documento || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filas.some((f) => !f.nombre || !f.email || !f.documento) && (
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#f9ab00' }}>
                ⚠️ Filas en amarillo tienen campos incompletos. Corrígelas en el Excel y vuelve a
                cargar el archivo.
              </p>
            )}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div
            style={{
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          >
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#202124' }}>
              ✅ Resultado de la operación:
            </p>
            <p style={{ margin: '4px 0', color: '#137333' }}>
              ✅ Usuarios nuevos creados e inscritos:{' '}
              <strong>{resultado.resultados?.creados?.length || 0}</strong>
            </p>
            <p style={{ margin: '4px 0', color: '#1a73e8' }}>
              🔄 Ya tenían cuenta, solo inscritos:{' '}
              <strong>{resultado.resultados?.yaExistian?.length || 0}</strong>
            </p>
            <p style={{ margin: '4px 0', color: '#f9ab00' }}>
              ⚠️ Ya estaban inscritos:{' '}
              <strong>{resultado.resultados?.duplicados?.length || 0}</strong>
            </p>
            {resultado.resultados?.errores?.length > 0 && (
              <>
                <p style={{ margin: '4px 0', color: '#c5221f' }}>
                  ❌ Errores: <strong>{resultado.resultados.errores.length}</strong>
                </p>
                <ul style={{ margin: '6px 0 0 20px', fontSize: '12px', color: '#c5221f' }}>
                  {resultado.resultados.errores.map((e, i) => (
                    <li key={i}>
                      {e.email} — {e.razon}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Acciones */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onCerrar}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#5f6368',
              border: '1px solid #dadce0',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
          {filas.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={enviando || filas.some((f) => !f.nombre || !f.email || !f.documento)}
              style={{
                padding: '10px 28px',
                backgroundColor: enviando ? '#ccc' : '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor:
                  enviando || filas.some((f) => !f.nombre || !f.email || !f.documento)
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: 'bold',
                fontSize: '15px',
              }}
            >
              {enviando ? '⏳ Procesando...' : `🎓 Crear e Inscribir ${filas.length} alumno(s)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
