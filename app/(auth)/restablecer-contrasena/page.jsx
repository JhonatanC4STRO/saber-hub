'use client';

import { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Eye, EyeOff, Globe2, CheckCircle2 } from 'lucide-react';

function AuthArt() {
  return (
    <section className="relative flex min-h-[180px] overflow-hidden bg-[linear-gradient(135deg,#0F172A_0%,#111827_42%,#1E1B4B_74%,#7F1D1D_125%)] px-8 py-8 lg:min-h-screen lg:px-20">
      <div className="absolute right-[14%] top-[11%] h-10 w-10 rotate-[15deg] rounded-lg bg-[#EC4899]" />
      <div className="absolute left-[28%] top-[38%] h-4 w-4 rounded-full bg-[#3B82F6]" />
      <div className="absolute left-[12%] top-[66%] h-5 w-5 rotate-12 rounded bg-[#06B6D4]" />
      <div className="absolute bottom-[10%] left-[9%] h-11 w-11 rotate-12 bg-[#F97316] [clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]" />

      <svg
        className="absolute inset-y-[-8%] right-[10%] h-[116%] w-[46%] opacity-95"
        viewBox="0 0 360 900"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="reset-curve"
            x1="85"
            y1="20"
            x2="280"
            y2="860"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#3B82F6" />
            <stop offset="0.38" stopColor="#2563EB" />
            <stop offset="0.62" stopColor="#06B6D4" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <path
          d="M160 0C250 90 300 165 238 272C185 363 91 383 109 503C126 617 264 618 243 733C229 810 141 845 180 900"
          stroke="url(#reset-curve)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 my-auto max-w-[640px] lg:py-16">
        <Link href="/" className="mb-12 flex w-fit flex-col no-underline">
          <span className="text-[13px] font-bold text-white/80">SABERHUB</span>
          <span className="mt-1 text-[11px] font-normal text-white/60">Learning Platform</span>
        </Link>
        <h1 className="max-w-[620px] text-[28px] font-bold leading-[1.15] text-white lg:text-[52px]">
          Nueva Contraseña
        </h1>
        <p className="mt-6 hidden max-w-[600px] text-[17px] font-normal leading-[1.65] text-white/80 md:block">
          Crea una nueva contraseña segura para proteger tu cuenta. Asegúrate de cumplir con los
          requisitos mínimos de seguridad.
        </p>
      </div>
    </section>
  );
}

function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-[#374151]">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>
      {children}
      {error && <p className="mt-2 text-xs font-normal text-[#EF4444]">{error}</p>}
    </div>
  );
}

function RestablecerContrasenaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const requirements = useMemo(
    () => [
      ['Mínimo 8 caracteres', formData.password.length >= 8],
      ['Una letra mayúscula', /[A-Z]/.test(formData.password)],
      ['Una letra minúscula', /[a-z]/.test(formData.password)],
      ['Un número', /\d/.test(formData.password)],
    ],
    [formData.password]
  );

  const strength = requirements.filter(([, valid]) => valid).length;
  const strengthMeta = [
    { label: 'Débil', color: '#EF4444' },
    { label: 'Débil', color: '#EF4444' },
    { label: 'Media', color: '#F59E0B' },
    { label: 'Buena', color: '#FBBF24' },
    { label: 'Fuerte', color: '#10B981' },
  ][strength];

  const passwordsMismatch =
    formData.passwordConfirm && formData.password !== formData.passwordConfirm;
  const canSubmit =
    token && strength === 4 && formData.password === formData.passwordConfirm && !loading;

  const handleChange = (event) => {
    setError('');
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('El token de restablecimiento no es válido.');
      return;
    }

    if (!canSubmit) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Ocurrió un error al restablecer tu contraseña.');
      }
    } catch {
      setError('Error de comunicación con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] py-8 lg:py-12">
      <Link
        href="/login"
        className="inline-flex items-center text-[15px] font-medium text-[#374151] no-underline transition hover:text-[#1E40AF]"
      >
        <ArrowLeft size={18} className="mr-2" />
        Volver al inicio de sesión
      </Link>

      {success ? (
        <div className="mt-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-[#10B981] mb-6">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-[30px] font-bold text-[#111827] leading-tight">
            ¡Contraseña Restablecida!
          </h2>
          <p className="mt-4 text-base font-normal text-[#4B5563] leading-relaxed">
            Tu contraseña ha sido actualizada con éxito de forma segura. Ya puedes ingresar con tu
            nueva contraseña.
          </p>
          <Link
            href="/login"
            className="mt-8 flex h-[52px] w-full items-center justify-center rounded-full bg-[#1E40AF] text-base font-semibold text-white transition hover:bg-[#1E3A8A] hover:shadow-[0_8px_20px_rgba(30,64,175,0.18)]"
          >
            Iniciar Sesión
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <div>
            <h2 className="text-[30px] font-bold text-[#111827]">Establecer nueva contraseña</h2>
            <p className="mt-1.5 text-base font-normal text-[#4B5563]">
              Crea una contraseña segura para tu cuenta
            </p>
          </div>

          {!token && (
            <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No se detectó un token de restablecimiento válido en la URL. Asegúrate de haber
              ingresado usando el enlace enviado a tu correo.
            </div>
          )}

          <form className="mt-9 space-y-[18px]" onSubmit={handleSubmit}>
            <Field id="password" label="Nueva contraseña" required>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-[52px] w-full rounded-md border border-[#D1D5DB] bg-white px-4 py-3.5 pr-12 text-[15px] text-[#111827] outline-none focus:border-2 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="mt-2.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((bar) => (
                    <span
                      key={bar}
                      className="h-1.5 flex-1 rounded-full transition"
                      style={{
                        backgroundColor:
                          strength >= bar
                            ? ['#EF4444', '#F59E0B', '#FBBF24', '#10B981'][bar - 1]
                            : '#F3F4F6',
                      }}
                    />
                  ))}
                  <span
                    className="ml-2 min-w-[46px] text-xs font-medium"
                    style={{ color: strengthMeta.color }}
                  >
                    {strengthMeta.label}
                  </span>
                </div>
                <div className="mt-2 grid gap-1">
                  {requirements.map(([text, valid]) => (
                    <div
                      key={text}
                      className={`text-xs transition ${valid ? 'text-[#1E40AF]' : 'text-[#4B5563]'}`}
                    >
                      <span className="mr-2">{valid ? '●' : '○'}</span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </Field>

            <Field
              id="passwordConfirm"
              label="Confirmar contraseña"
              required
              error={passwordsMismatch ? 'Las contraseñas no coinciden' : ''}
            >
              <div className="relative">
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className={`h-[52px] w-full rounded-md border bg-white px-4 py-3.5 pr-20 text-[15px] text-[#111827] outline-none focus:border-2 focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 ${passwordsMismatch ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
                {formData.passwordConfirm && !passwordsMismatch && (
                  <Check
                    size={18}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-[#10B981]"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-[52px] w-full rounded-full bg-[#1E40AF] text-base font-semibold text-white transition hover:bg-[#1E3A8A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function RestablecerContrasena() {
  return (
    <main
      className="min-h-screen bg-white font-sans text-[#111827]"
      style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}
    >
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[57fr_43fr]">
        <AuthArt />

        <section className="relative flex min-h-[calc(100vh-180px)] items-start justify-center overflow-y-auto bg-white px-6 py-12 lg:min-h-screen lg:px-20">
          <button className="absolute right-6 top-6 flex h-9 items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 text-sm font-medium text-[#374151]">
            <Globe2 size={16} className="mr-2 text-[#4B5563]" />
            Espa&ntilde;ol
          </button>

          <Suspense
            fallback={
              <div className="py-8 flex flex-col items-center justify-center">
                <span className="text-gray-500 font-medium">Cargando formulario...</span>
              </div>
            }
          >
            <RestablecerContrasenaContenido />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
