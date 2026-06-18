'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Eye, EyeOff, Globe2 } from 'lucide-react';

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

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
            id="register-curve"
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
          stroke="url(#register-curve)"
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
          Crea tu cuenta hoy
        </h1>
        <p className="mt-6 hidden max-w-[600px] text-[17px] font-normal leading-[1.65] text-white/80 md:block">
          Unete a miles de colombianos que ya estan aprendiendo con cursos gratuitos respaldados por
          el SENA, MinTIC, universidades y mas.
        </p>
        <div className="mt-8 hidden flex-col gap-4 md:flex">
          {[
            '100% gratuito, sin tarjeta de credito',
            'Certificados validados por instituciones',
            'Aprende a tu ritmo, cuando quieras',
          ].map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-3 text-[15px] font-medium text-white/80"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E40AF] text-white">
                <Check size={15} />
              </span>
              {benefit}
            </div>
          ))}
        </div>
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

export default function Registro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const loginUrl = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    documento: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);

  const requirements = useMemo(
    () => [
      ['Minimo 8 caracteres', formData.password.length >= 8],
      ['Una letra mayuscula', /[A-Z]/.test(formData.password)],
      ['Una letra minuscula', /[a-z]/.test(formData.password)],
      ['Un numero', /\d/.test(formData.password)],
    ],
    [formData.password]
  );

  const strength = requirements.filter(([, valid]) => valid).length;
  const strengthMeta = [
    { label: 'Debil', color: '#EF4444' },
    { label: 'Debil', color: '#EF4444' },
    { label: 'Media', color: '#F59E0B' },
    { label: 'Buena', color: '#FBBF24' },
    { label: 'Fuerte', color: '#10B981' },
  ][strength];

  const passwordsMismatch =
    formData.passwordConfirm && formData.password !== formData.passwordConfirm;
  const canSubmit =
    formData.nombreCompleto.trim() &&
    formData.documento.trim() &&
    formData.email.trim() &&
    strength === 4 &&
    formData.password === formData.passwordConfirm &&
    acceptedTerms &&
    !loading;

  const handleChange = (event) => {
    setError('');
    setEmailExists(false);
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setEmailExists(false);

    if (!canSubmit) {
      setError('Completa todos los campos obligatorios y acepta los terminos.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto: formData.nombreCompleto,
          documento: formData.documento,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(loginUrl);
        return;
      }

      if (res.status === 409) {
        setEmailExists(true);
      }
      setError(data.error || 'No pudimos crear tu cuenta.');
    } catch {
      setError('Error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

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

          <div className="w-full max-w-[440px] py-8 lg:py-12">
            <Link
              href={loginUrl}
              className="inline-flex items-center text-[15px] font-medium text-[#374151] no-underline transition hover:text-[#1E40AF]"
            >
              <ArrowLeft size={18} className="mr-2" />
              Volver al inicio de sesi&oacute;n
            </Link>

            <div className="mt-10">
              <h2 className="text-[30px] font-bold text-[#111827]">Crea tu cuenta</h2>
              <p className="mt-1.5 text-base font-normal text-[#4B5563]">
                Es gratis y solo te toma un minuto
              </p>
            </div>

            <button className="mt-7 flex h-[52px] w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[15px] font-semibold text-[#374151] transition hover:border-[#D1D5DB] hover:bg-[#F9FAFB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E40AF]">
              <GoogleLogo />
              <span className="ml-2.5">Continuar con Google</span>
            </button>

            <div className="my-6 flex items-center">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="bg-white px-3 text-sm font-normal text-[#4B5563]">
                O reg&iacute;strate con tu correo
              </span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            <form className="space-y-[18px]" onSubmit={handleSubmit}>
              <Field id="nombreCompleto" label="Nombre completo" required>
                <input
                  id="nombreCompleto"
                  name="nombreCompleto"
                  type="text"
                  placeholder="Juan Perez Garcia"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  className="h-[52px] w-full rounded-md border border-[#D1D5DB] bg-white px-4 py-3.5 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-2 focus:border-[#1E40AF]"
                />
              </Field>

              <Field id="documento" label="Documento" required>
                <input
                  id="documento"
                  name="documento"
                  type="text"
                  placeholder="Numero de documento"
                  value={formData.documento}
                  onChange={handleChange}
                  className="h-[52px] w-full rounded-md border border-[#D1D5DB] bg-white px-4 py-3.5 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-2 focus:border-[#1E40AF]"
                />
              </Field>

              <Field
                id="email"
                label="Correo electronico"
                required
                error={emailExists ? 'Este correo ya esta registrado. Quieres iniciar sesion?' : ''}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`h-[52px] w-full rounded-md border bg-white px-4 py-3.5 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-2 focus:border-[#1E40AF] ${emailExists ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                />
              </Field>

              <Field id="password" label="Contrasena" required>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimo 8 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-[52px] w-full rounded-md border border-[#D1D5DB] bg-white px-4 py-3.5 pr-12 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-2 focus:border-[#1E40AF]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
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
                label="Confirmar contrasena"
                required
                error={passwordsMismatch ? 'Las contrasenas no coinciden' : ''}
              >
                <div className="relative">
                  <input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repite tu contrasena"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    className={`h-[52px] w-full rounded-md border bg-white px-4 py-3.5 pr-20 text-[15px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-2 focus:border-[#1E40AF] ${passwordsMismatch ? 'border-[#EF4444]' : 'border-[#D1D5DB]'}`}
                  />
                  {formData.passwordConfirm && !passwordsMismatch && (
                    <Check
                      size={18}
                      className="absolute right-12 top-1/2 -translate-y-1/2 text-[#10B981]"
                    />
                  )}
                  <button
                    type="button"
                    aria-label={showConfirm ? 'Ocultar confirmacion' : 'Mostrar confirmacion'}
                    onClick={() => setShowConfirm((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>

              <label className="flex items-start gap-3 pt-1 text-sm font-normal text-[#374151]">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border border-[#D1D5DB] accent-[#1E40AF]"
                />
                <span>
                  Acepto los{' '}
                  <Link href="/terminos" className="font-medium text-[#1E40AF] hover:underline">
                    T&eacute;rminos de servicio
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacidad" className="font-medium text-[#1E40AF] hover:underline">
                    Pol&iacute;tica de privacidad
                  </Link>
                  , y autorizo expresamente el tratamiento de mis datos personales de acuerdo con la{' '}
                  <strong className="font-semibold text-[#111827]">Ley 1581 de 2012</strong> (Habeas
                  Data) de Colombia.
                </span>
              </label>

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
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <div className="mt-8 rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] px-6 py-5 text-[15px] text-[#374151]">
              &iquest;Ya tienes cuenta?{' '}
              <Link
                href={loginUrl}
                className="font-bold text-[#1E40AF] no-underline hover:underline"
              >
                Inicia sesi&oacute;n
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
