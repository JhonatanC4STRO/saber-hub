'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Landmark,
  KeyRound,
  User,
  CreditCard,
  Eye,
  EyeOff,
} from 'lucide-react';

function RegisterInstructorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [validating, setValidating] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [validationError, setValidationError] = useState('');

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    documento: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  // 1. Validar el token de invitación al cargar la página
  useEffect(() => {
    if (!token) {
      setValidationError('No se ha proporcionado un token de invitación válido.');
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/auth/register-instructor?token=${token}`);
        const data = await res.json();

        if (res.ok && data.valido) {
          setTokenInfo(data);
        } else {
          setValidationError(data.error || 'El token es inválido o ha expirado.');
        }
      } catch (error) {
        console.error('Error al validar el token:', error);
        setValidationError('Error de conexión. Intente nuevamente.');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const { nombreCompleto, documento, password, confirmPassword } = formData;

    if (!nombreCompleto.trim() || !documento.trim() || !password || !confirmPassword) {
      setFormError('Todos los campos son obligatorios.');
      return;
    }

    if (password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nombreCompleto,
          documento,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
        return;
      }

      setFormError(data.error || 'No se pudo completar el registro.');
    } catch (error) {
      console.error('Error al registrar instructor:', error);
      setFormError('Error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERS ---

  if (validating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
        <Loader2 className="h-10 w-10 animate-spin text-[#1E40AF]" />
        <p className="mt-4 text-base font-medium text-[#4B5563]">
          Validando invitación institucional...
        </p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6 text-center font-sans">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-[#111827]">Invitación Inválida</h2>
          <p className="mt-3 text-base text-[#6B7280]">{validationError}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-full bg-[#1E40AF] font-semibold text-white transition hover:bg-[#1E3A8A]"
            >
              Ir a Iniciar Sesión
            </Link>
            <Link
              href="/"
              className="flex h-12 w-full items-center justify-center rounded-full border border-[#E5E7EB] bg-white font-semibold text-[#374151] transition hover:bg-[#F9FAFB]"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[57fr_43fr] bg-white font-sans text-[#111827]">
      {/* Columna Izquierda: Branding e Institución */}
      <section className="relative flex min-h-[220px] overflow-hidden bg-[linear-gradient(135deg,#0F172A_0%,#111827_42%,#1E1B4B_74%,#7F1D1D_125%)] px-8 py-8 lg:min-h-screen lg:px-20 items-center">
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

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white mb-6 text-sm font-semibold">
            <Landmark className="h-4 w-4 text-[#3B82F6]" />
            <span>Invitación Oficial de {tokenInfo?.institucion?.nombre}</span>
          </div>

          <h1 className="max-w-[620px] text-[28px] font-bold leading-[1.15] text-white lg:text-[52px]">
            &iexcl;Únete como instructor a SABERHUB!
          </h1>
          <p className="mt-6 hidden max-w-[600px] text-[17px] font-normal leading-[1.65] text-white/80 md:block">
            Completa tu perfil para empezar a publicar cursos gratuitos respaldados por{' '}
            <strong>{tokenInfo?.institucion?.nombre}</strong>. Inspira y transforma la educación
            digital de tu país.
          </p>
        </div>
      </section>

      {/* Columna Derecha: Formulario */}
      <section className="relative flex min-h-[calc(100vh-220px)] items-center justify-center bg-white px-6 py-12 lg:min-h-screen lg:px-20">
        <div className="w-full max-w-[440px]">
          <Link
            href="/login"
            className="inline-flex items-center text-[15px] font-medium text-[#374151] no-underline transition hover:text-[#1E40AF]"
          >
            <ArrowLeft size={18} className="mr-2" />
            Volver al login
          </Link>

          <div className="mt-8">
            <h2 className="text-[30px] font-bold text-[#111827]">Registro de Instructor</h2>
            <p className="mt-1.5 text-base font-normal text-[#6B7280]">
              Completa los datos de tu cuenta institucional
            </p>
          </div>

          {success ? (
            <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-6 text-center shadow-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-green-800">¡Registro Exitoso!</h3>
              <p className="mt-2 text-sm text-green-700">
                Tu cuenta de instructor ha sido creada exitosamente. Serás redirigido al portal de
                inicio de sesión en unos momentos.
              </p>
            </div>
          ) : (
            <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
              {/* Email (Readonly) */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#374151]">
                  Correo Electrónico
                </label>
                <div className="flex h-[52px] w-full items-center rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base font-medium text-[#6B7280]">
                  {tokenInfo?.correo}
                </div>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Este correo electrónico está asociado a tu invitación institucional.
                </p>
              </div>

              {/* Nombre Completo */}
              <div>
                <label
                  htmlFor="nombreCompleto"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="nombreCompleto"
                    name="nombreCompleto"
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={formData.nombreCompleto}
                    onChange={handleChange}
                    className="h-[52px] w-full rounded-md border border-[#D1D5DB] bg-white pl-12 pr-4 text-base text-[#111827] outline-none transition focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
                  />
                </div>
              </div>

              {/* Documento */}
              <div>
                <label
                  htmlFor="documento"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  Documento de Identidad (Cédula/NIT/Pasaporte)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="documento"
                    name="documento"
                    type="text"
                    required
                    placeholder="Ej. 1023456789"
                    value={formData.documento}
                    onChange={handleChange}
                    className="h-[52px] w-full rounded-md border border-[#D1D5DB] bg-white pl-12 pr-4 text-base text-[#111827] outline-none transition focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  Contraseña (Mínimo 8 caracteres)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-[52px] w-full rounded-md border border-[#D1D5DB] bg-white pl-12 pr-12 text-base text-[#111827] outline-none transition focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-[#374151]"
                >
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-[52px] w-full rounded-md border border-[#D1D5DB] bg-white pl-12 pr-12 text-base text-[#111827] outline-none transition focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {formError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 flex h-[52px] w-full items-center justify-center rounded-full bg-[#1E40AF] text-base font-semibold text-white transition hover:bg-[#1E3A8A] hover:shadow-[0_8px_20px_rgba(30,64,175,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Registrarse como Instructor'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] px-6 py-5 text-[15px] text-[#374151] text-center">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-bold text-[#1E40AF] no-underline hover:underline">
              Inicia Sesión
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function RegisterInstructorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
          <Loader2 className="h-10 w-10 animate-spin text-[#1E40AF]" />
          <p className="mt-4 text-base font-medium text-[#4B5563]">Cargando...</p>
        </div>
      }
    >
      <RegisterInstructorContent />
    </Suspense>
  );
}
