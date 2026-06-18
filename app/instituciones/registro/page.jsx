'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Link2, Upload, CheckCircle, Grid2X2, ChevronDown, Search, Menu, Layers, BarChart2, GraduationCap, Users, Lock } from 'lucide-react';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';

const TIPOS_INSTITUCION = [
  'Universidad',
  'Instituto técnico',
  'SENA Regional',
  'Entidad pública',
  'Fundación',
  'Empresa',
  'Otro',
];

const TIPOS_CURSOS = [
  'Cursos técnicos y profesionales',
  'Programas de certificación',
  'Capacitación corporativa',
  'Formación continua',
  'Bootcamps',
];

const BENEFICIOS = [
  {
    icon: Layers,
    titulo: 'Infraestructura gratuita',
    desc: 'Sin costos de hosting, soporte técnico ni mantenimiento.',
  },
  {
    icon: BarChart2,
    titulo: 'Panel de analíticas',
    desc: 'Seguimiento del progreso de tus alumnos en tiempo real.',
  },
  {
    icon: GraduationCap,
    titulo: 'Certificación conjunta',
    desc: 'Los certificados llevan el nombre de tu institución y SABERHUB.',
  },
  {
    icon: Users,
    titulo: 'Alcance masivo',
    desc: 'Accede a miles de estudiantes en todo el país.',
  },
  {
    icon: Lock,
    titulo: 'Protección de marca',
    desc: 'Tu contenido y propiedad intelectual protegidos.',
  },
];

const FORM_INICIAL = {
  nombreLegal: '',
  nit: '',
  tipoInstitucion: '',
  descripcion: '',
  sitioWeb: '',
  ciudad: '',
  departamento: '',
  nombreRepresentante: '',
  cargo: '',
  correoInstitucional: '',
  telefono: '',
  correoAlternativo: '',
  tiposCursos: [],
  estimadoCursos: '',
  estimadoInstructores: '',
  expectativas: '',
};

const inputCls =
  'w-full rounded border border-[#D1D5DB] px-3 py-2.5 text-sm text-[#111827] outline-none transition focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF]';

function UploadZone({ label, required, hint, accept, file, onFile }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[#374151]">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </p>
      <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 transition hover:border-[#1E40AF] hover:bg-[#EFF6FF]">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <span className="text-center text-xs font-medium text-[#1E40AF]">
            📄 {file.name} · {(file.size / 1024).toFixed(0)} KB ✓
          </span>
        ) : (
          <>
            <Upload size={16} className="mb-1 text-[#9CA3AF]" />
            <span className="text-xs text-[#6B7280]">Arrastra o selecciona</span>
            <span className="text-[10px] text-[#9CA3AF]">{hint}</span>
          </>
        )}
      </label>
    </div>
  );
}

function FormCard({ titulo, subtitulo, children }) {
  return (
    <div className="mb-6 rounded border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] bg-white p-6">
      <h2 className="text-lg font-bold text-[#111827]">{titulo}</h2>
      {subtitulo && <p className="mt-1 text-[13px] text-[#6B7280]">{subtitulo}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#374151]">
          {label} {required && <span className="text-[#EF4444]">*</span>}
        </label>
      )}
      {children}
      {hint && <span className="text-xs text-[#9CA3AF]">{hint}</span>}
    </div>
  );
}

function Logo({ dark = false }) {
  return (
    <Link href="/" className="flex flex-col leading-none no-underline">
      <span
        className={`text-[13px] font-bold tracking-[0] ${dark ? 'text-white' : 'text-[#111827]'}`}
      >
        SABERHUB
      </span>
      <span
        className={`mt-1 text-[10px] font-normal ${dark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'}`}
      >
        Learning Platform
      </span>
    </Link>
  );
}

export default function RegistroInstitucion() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    async function checkUser() {
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
    checkUser();
  }, []);

  const [form, setForm] = useState(FORM_INICIAL);
  const [logoFile, setLogoFile] = useState(null);
  const [docFile, setDocFile] = useState(null);
  const [cartaFile, setCartaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleTipoCurso(tipo) {
    const tipos = form.tiposCursos.includes(tipo)
      ? form.tiposCursos.filter((t) => t !== tipo)
      : [...form.tiposCursos, tipo];
    setForm({ ...form, tiposCursos: tipos });
  }

  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Error al subir archivo');
    const data = await res.json();
    return data.url;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let logoUrl = null;
      let documentoUrl = null;
      if (logoFile) logoUrl = await uploadFile(logoFile);
      if (docFile) documentoUrl = await uploadFile(docFile);

      const res = await fetch('/api/instituciones/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, logoUrl, documentoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al enviar la solicitud.');
        return;
      }
      setExito(true);
    } catch {
      setError('Error de conexión. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (exito) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4"
        style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}
      >
        <div className="w-full max-w-md rounded border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] bg-white p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
            <CheckCircle size={32} className="text-[#059669]" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-[#111827]">¡Solicitud enviada!</h2>
          <p className="mb-2 text-sm text-[#6B7280]">
            Hemos recibido la solicitud de <strong>{form.nombreLegal}</strong>.
          </p>
          <p className="mb-6 text-sm text-[#6B7280]">
            Recibirás un correo en <strong>{form.correoInstitucional}</strong> y te notificaremos
            en máximo 5 días hábiles.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded bg-[#1E40AF] px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-[#1A368F]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}
    >
      <HeaderAdmin usuario={usuario} />

      {/* ── HERO ── */}
      <section className="bg-[#1E40AF] px-6 py-16 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 md:grid-cols-[60fr_40fr]">
          <div>
            <span className="mb-4 inline-block rounded bg-white px-3 py-1 text-[11px] font-bold text-[#1E40AF]">
              PARA INSTITUCIONES
            </span>
            <h1 className="max-w-[540px] text-[38px] font-bold leading-[1.2] text-white md:text-[44px]">
              Registra tu institución en SABERHUB
            </h1>
            <p className="mt-4 max-w-[520px] text-[17px] leading-[1.6] text-white/85">
              Conecta tu institución con miles de estudiantes colombianos. SABERHUB te ofrece
              infraestructura, seguimiento y certificación sin costo alguno.
            </p>
            <div className="mt-8 flex flex-wrap gap-10">
              {[
                ['12,847', 'Estudiantes activos'],
                ['18', 'Instituciones aliadas'],
                ['389', 'Cursos publicados'],
              ].map(([num, label]) => (
                <div key={label}>
                  <div className="text-2xl font-bold text-white">{num}</div>
                  <div className="mt-0.5 text-sm text-white/75">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white/10 p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-white/60">
              Instituciones aliadas
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                'SENA',
                'MinTIC',
                'Unal Colombia',
                'ITM Medellín',
                'SENA Bogotá',
                'Fund. Bavaria',
              ].map((inst) => (
                <div
                  key={inst}
                  className="flex h-14 items-center justify-center rounded bg-white/15 text-xs font-semibold text-white"
                >
                  {inst}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FORM SECTION ── */}
      <section className="bg-[#F9FAFB] px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-[#111827]">Solicitar membresía institucional</h2>
            <p className="mt-2 text-[15px] text-[#6B7280]">
              Completa este formulario y el equipo de SABERHUB revisará tu solicitud en máximo 5
              días hábiles.
            </p>
            <span className="mt-3 inline-block rounded bg-[#D1FAE5] px-2.5 py-1 text-[11px] font-bold text-[#065F46]">
              PROCESO GRATUITO
            </span>
          </div>

          {error && (
            <div className="mb-6 rounded border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 lg:grid-cols-[65fr_35fr]">
              {/* ── LEFT ── */}
              <div>
                {/* Card 1 */}
                <FormCard titulo="Información de la institución">
                  <Field label="Nombre legal de la institución" required>
                    <input
                      name="nombreLegal"
                      value={form.nombreLegal}
                      onChange={handleChange}
                      required
                      placeholder="Ej. Universidad Nacional de Colombia"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="NIT" required>
                    <input
                      name="nit"
                      value={form.nit}
                      onChange={handleChange}
                      required
                      placeholder="900.123.456-7"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Tipo de institución" required>
                    <div className="flex flex-wrap gap-2">
                      {TIPOS_INSTITUCION.map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setForm({ ...form, tipoInstitucion: tipo })}
                          className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                            form.tipoInstitucion === tipo
                              ? 'bg-[#1E40AF] text-white'
                              : 'border border-[#D1D5DB] bg-white text-[#374151] hover:border-[#1E40AF] hover:text-[#1E40AF]'
                          }`}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Descripción de la institución" required>
                    <textarea
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Describe brevemente tu institución, su misión y los programas que ofrece..."
                      className={inputCls + ' resize-vertical'}
                    />
                  </Field>

                  <Field label="Sitio web" hint="Opcional">
                    <div className="relative">
                      <Link2
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                      />
                      <input
                        name="sitioWeb"
                        value={form.sitioWeb}
                        onChange={handleChange}
                        placeholder="https://www.tuinstitucion.edu.co"
                        className={inputCls + ' pl-9'}
                      />
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ciudad" required>
                      <input
                        name="ciudad"
                        value={form.ciudad}
                        onChange={handleChange}
                        required
                        placeholder="Bogotá"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Departamento" required>
                      <input
                        name="departamento"
                        value={form.departamento}
                        onChange={handleChange}
                        required
                        placeholder="Cundinamarca"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </FormCard>

                {/* Card 2 */}
                <FormCard titulo="Representante y contacto">
                  <Field label="Nombre del representante" required>
                    <input
                      name="nombreRepresentante"
                      value={form.nombreRepresentante}
                      onChange={handleChange}
                      required
                      placeholder="Juan Carlos Ramírez"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Cargo" required>
                    <input
                      name="cargo"
                      value={form.cargo}
                      onChange={handleChange}
                      required
                      placeholder="Rector / Director de extensión / Coordinador TIC"
                      className={inputCls}
                    />
                  </Field>

                  <Field
                    label="Correo institucional"
                    required
                    hint="Usaremos este correo para todos los comunicados oficiales."
                  >
                    <input
                      name="correoInstitucional"
                      value={form.correoInstitucional}
                      onChange={handleChange}
                      required
                      type="email"
                      placeholder="rector@tuinstitucion.edu.co"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Teléfono" required>
                    <div className="flex gap-2">
                      <span className="flex shrink-0 items-center rounded border border-[#D1D5DB] bg-[#F9FAFB] px-3 text-sm font-medium text-[#374151]">
                        +57
                      </span>
                      <input
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        required
                        type="tel"
                        placeholder="300 123 4567"
                        className={inputCls}
                      />
                    </div>
                  </Field>

                  <Field label="Correo alternativo" hint="Opcional">
                    <input
                      name="correoAlternativo"
                      value={form.correoAlternativo}
                      onChange={handleChange}
                      type="email"
                      placeholder="contacto@tuinstitucion.edu.co"
                      className={inputCls}
                    />
                  </Field>
                </FormCard>

                {/* Card 3 */}
                <FormCard titulo="Propuesta de colaboración">
                  <Field label="¿Qué tipo de cursos ofrecerían?" required>
                    <div className="flex flex-col gap-2.5">
                      {TIPOS_CURSOS.map((tipo) => (
                        <label
                          key={tipo}
                          className="flex cursor-pointer items-center gap-2.5 text-sm text-[#374151]"
                        >
                          <input
                            type="checkbox"
                            checked={form.tiposCursos.includes(tipo)}
                            onChange={() => toggleTipoCurso(tipo)}
                            className="h-4 w-4 rounded border-[#D1D5DB] accent-[#1E40AF]"
                          />
                          {tipo}
                        </label>
                      ))}
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Cursos estimados al año" required>
                      <select
                        name="estimadoCursos"
                        value={form.estimadoCursos}
                        onChange={handleChange}
                        required
                        className={inputCls}
                      >
                        <option value="">Seleccionar</option>
                        <option>1-5</option>
                        <option>6-15</option>
                        <option>16-30</option>
                        <option>Más de 30</option>
                      </select>
                    </Field>

                    <Field label="Instructores estimados" required>
                      <select
                        name="estimadoInstructores"
                        value={form.estimadoInstructores}
                        onChange={handleChange}
                        required
                        className={inputCls}
                      >
                        <option value="">Seleccionar</option>
                        <option>1-3</option>
                        <option>4-10</option>
                        <option>11-25</option>
                        <option>Más de 25</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Expectativas de la alianza" hint="Opcional">
                    <textarea
                      name="expectativas"
                      value={form.expectativas}
                      onChange={handleChange}
                      rows={3}
                      placeholder="¿Qué esperas lograr con esta alianza?"
                      className={inputCls + ' resize-vertical'}
                    />
                  </Field>
                </FormCard>

                {/* Card 4 */}
                <FormCard
                  titulo="Documentos requeridos"
                  subtitulo="Adjunta los documentos que acreditan la existencia legal de tu institución."
                >
                  <UploadZone
                    label="Cámara de comercio o RUT"
                    required
                    hint="PDF, máx 10 MB"
                    accept=".pdf"
                    file={docFile}
                    onFile={setDocFile}
                  />
                  <UploadZone
                    label="Logo de la institución"
                    required
                    hint="PNG o SVG, fondo transparente, máx 2 MB"
                    accept="image/*"
                    file={logoFile}
                    onFile={setLogoFile}
                  />
                  <UploadZone
                    label="Carta de intención"
                    hint="Carta en membrete institucional firmada (opcional)"
                    accept=".pdf"
                    file={cartaFile}
                    onFile={setCartaFile}
                  />
                </FormCard>

                {/* Submit */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-[#1E40AF] py-3.5 text-base font-bold text-white transition hover:bg-[#1A368F] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Enviando solicitud...' : 'Enviar solicitud de registro'}
                  </button>
                  <p className="mt-3 text-center text-[11px] text-[#9CA3AF]">
                    Al enviar aceptas los{' '}
                    <Link href="/terminos" className="text-[#1E40AF] underline">
                      Términos de alianza
                    </Link>{' '}
                    y la{' '}
                    <Link href="/privacidad" className="text-[#1E40AF] underline">
                      Política de privacidad
                    </Link>{' '}
                    de SABERHUB.
                  </p>
                </div>
              </div>

              {/* ── RIGHT (sticky) ── */}
              <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
                {/* Benefits */}
                <div className="rounded border border-[#F3F4F6] border-b-2 border-b-[#1E40AF] bg-white p-6">
                  <h3 className="mb-4 text-lg font-bold text-[#111827]">
                    Beneficios para tu institución
                  </h3>
                  <div className="flex flex-col gap-4">
                    {BENEFICIOS.map((b) => {
                      const IconComponent = b.icon;
                      return (
                        <div key={b.titulo} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#1E40AF] text-[#1E40AF]">
                            <IconComponent size={16} className="stroke-[2.5]" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#111827]">{b.titulo}</div>
                            <div className="text-xs leading-relaxed text-[#6B7280]">{b.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Institutions */}
                <div className="rounded border border-[#F3F4F6] bg-[#F9FAFB] p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]">
                    Ya confían en SABERHUB
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-[#9CA3AF]">
                    {['SENA', 'MinTIC', 'Universidad Nacional', 'ITM Medellín', 'Fundación Bavaria'].join(
                      ' · '
                    )}
                  </div>
                </div>

                {/* Support */}
                <div className="rounded border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                  <p className="mb-2 text-sm font-semibold text-[#1E40AF]">
                    ¿Tienes dudas antes de registrarte?
                  </p>
                  <p className="mb-3 text-xs leading-relaxed text-[#1E3A8A]">
                    Escríbenos a <strong>instituciones@saberhub.co</strong> o agenda una llamada.
                  </p>
                  <a
                    href="mailto:instituciones@saberhub.co"
                    className="inline-flex items-center justify-center rounded border border-[#1E40AF] px-4 py-2 text-xs font-semibold text-[#1E40AF] no-underline transition hover:bg-[#1E40AF] hover:text-white"
                  >
                    Contactar
                  </a>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#171717] px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-5 flex flex-col leading-none">
            <span className="text-[13px] font-bold text-white">SABERHUB</span>
            <span className="mt-0.5 text-[10px] text-[#9CA3AF]">Learning Platform</span>
          </div>
          <div className="mb-5 h-px bg-[#4B5563]" />
          <div className="flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between">
            <p className="text-[#9CA3AF]">© 2026 SABERHUB. Todos los derechos reservados.</p>
            <div className="flex flex-wrap gap-2 text-[#D1D5DB]">
              <Link href="/terminos" className="hover:text-white">
                Términos y condiciones
              </Link>
              <span className="text-[#4B5563]">|</span>
              <Link href="/privacidad" className="hover:text-white">
                Política de privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
