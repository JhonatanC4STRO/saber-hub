'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Globe2 } from 'lucide-react';

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

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const errorParam = searchParams.get('error');
  const [step, setStep] = useState('email');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [errorParam]);

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

    if (step === 'email') {
      if (!formData.email.trim()) {
        setError('Ingresa tu correo electronico.');
        return;
      }
      setStep('password');
      return;
    }

    if (!formData.password) {
      setError('Ingresa tu contrasena.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(redirect || '/dashboard');
        router.refresh();
        return;
      }

      setError(data.error || 'No pudimos iniciar sesion.');
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
                id="login-curve"
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
              stroke="url(#login-curve)"
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
              Desarrolla tus habilidades con SABERHUB
            </h1>
            <p className="mt-6 hidden max-w-[600px] text-[17px] font-normal leading-[1.65] text-white/80 md:block">
              Sigue trayectorias profesionales reales a traves de cursos impartidos por expertos y
              aprende con cursos en linea gratuitos respaldados por las mejores instituciones de
              Colombia.
            </p>
          </div>
        </section>

        <section className="relative flex min-h-[calc(100vh-180px)] items-center justify-center bg-white px-6 py-12 lg:min-h-screen lg:px-20">
          <button className="absolute right-6 top-6 flex h-9 items-center rounded-full border border-[#E5E7EB] bg-white px-3.5 text-sm font-medium text-[#374151]">
            <Globe2 size={16} className="mr-2 text-[#4B5563]" />
            Espa&ntilde;ol
          </button>

          <div className="w-full max-w-[420px]">
            <Link
              href="/"
              className="inline-flex items-center text-[15px] font-medium text-[#374151] no-underline transition hover:text-[#1E40AF]"
            >
              <ArrowLeft size={18} className="mr-2" />
              Volver
            </Link>

            <div className="mt-10">
              <h2 className="text-[30px] font-bold text-[#111827]">&iexcl;Bienvenido de nuevo!</h2>
              <p className="mt-1.5 text-base font-normal text-[#4B5563]">
                Inicia sesi&oacute;n en tu cuenta
              </p>
            </div>

            <form className="mt-9" onSubmit={handleSubmit}>
              {step === 'email' ? (
                <>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#374151]">
                    Correo electr&oacute;nico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    className="h-[52px] w-full rounded-md border-2 border-[#1E40AF] bg-white px-4 py-3.5 text-base text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]/20"
                  />
                </>
              ) : (
                <>
                  <div className="mb-5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
                    <p className="text-xs font-medium text-[#4B5563]">Correo electr&oacute;nico</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {formData.email}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('email');
                          setFormData((prev) => ({ ...prev, password: '' }));
                          setError('');
                        }}
                        className="text-sm font-medium text-[#1E40AF] hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-[#374151]"
                  >
                    Contrase&ntilde;a
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={formData.password}
                    onChange={handleChange}
                    className="h-[52px] w-full rounded-md border-2 border-[#1E40AF] bg-white px-4 py-3.5 text-base text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-[#1E40AF]/20"
                  />
                </>
              )}

              <div className="mt-3 flex justify-end">
                <Link
                  href="/recuperar-contrasena"
                  className="text-sm font-medium text-[#1E40AF] no-underline hover:underline"
                >
                  Configurar o restablecer la contrase&ntilde;a
                </Link>
              </div>

              {error && (
                <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-7 h-[52px] w-[220px] rounded-full bg-[#1E40AF] text-base font-semibold text-white transition hover:bg-[#1E3A8A] hover:shadow-[0_8px_20px_rgba(30,64,175,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Ingresando...' : step === 'email' ? 'Continuar' : 'Iniciar Sesion'}
              </button>
            </form>

            <div className="mt-9 flex items-center">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="bg-white px-3 text-sm font-normal text-[#4B5563]">
                O contin&uacute;a con
              </span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            <button
              onClick={() => router.push('/api/auth/google')}
              type="button"
              className="mt-5 flex h-[52px] w-[220px] items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[15px] font-semibold text-[#374151] transition hover:border-[#D1D5DB] hover:bg-[#F9FAFB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E40AF]"
            >
              <GoogleLogo />
              <span className="ml-2.5">Google</span>
            </button>

            <div className="mt-12 rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] px-6 py-5 text-[15px] text-[#374151]">
              &iquest;No tienes cuenta?{' '}
              <Link
                href="/registro"
                className="font-bold text-[#1E40AF] no-underline hover:underline"
              >
                Reg&iacute;strate
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
