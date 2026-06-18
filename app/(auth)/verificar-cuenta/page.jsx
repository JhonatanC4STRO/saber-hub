'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

function VerificarCuentaContenido() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage('El enlace de verificación es inválido o el token no está presente.');
      return;
    }

    const verificarToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setSuccess(true);
          setMessage(data.message || '¡Tu cuenta ha sido verificada exitosamente!');
        } else {
          setSuccess(false);
          setMessage(data.error || 'Ocurrió un error al verificar tu cuenta.');
        }
      } catch {
        setSuccess(false);
        setMessage('Error de comunicación con el servidor. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    verificarToken();
  }, [token]);

  return (
    <div className="w-full max-w-[450px] rounded-3xl border border-gray-100 bg-white px-8 py-10 shadow-[0_20px_50px_rgba(30,64,175,0.12)] text-center">
      <div className="flex flex-col items-center mb-6">
        <span className="text-[13px] font-bold tracking-wider text-[#1E40AF]">SABERHUB</span>
        <span className="text-[11px] font-medium text-gray-400 mt-0.5">LEARNING PLATFORM</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-16 w-16 animate-spin text-[#1E40AF] mb-6" />
          <h2 className="text-2xl font-bold text-gray-900">Verificando tu cuenta</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed px-4">
            Estamos validando tu dirección de correo electrónico de forma segura...
          </p>
        </div>
      ) : success ? (
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-100/50 scale-125 animate-pulse" />
            <CheckCircle className="relative h-20 w-20 text-[#10B981]" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">¡Verificación Exitosa!</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-600 px-2">{message}</p>
          <p className="mt-2 text-xs text-gray-400">
            Ya tienes acceso completo al catálogo de cursos y certificados.
          </p>

          <Link
            href="/login"
            className="mt-8 flex h-[52px] w-full items-center justify-center rounded-full bg-[#1E40AF] text-base font-bold text-white transition-all hover:bg-[#1E3A8A] hover:shadow-[0_8px_25px_rgba(30,64,175,0.25)] focus:ring-4 focus:ring-blue-100"
          >
            Iniciar sesión ahora
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-red-100/50 scale-125" />
            <XCircle className="relative h-20 w-20 text-[#EF4444]" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Enlace Expirado o Inválido</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-600 px-2">{message}</p>

          <Link
            href="/registro"
            className="mt-8 flex h-[52px] w-full items-center justify-center rounded-full bg-[#1E40AF] text-base font-bold text-white transition-all hover:bg-[#1E3A8A] hover:shadow-[0_8px_25px_rgba(30,64,175,0.25)]"
          >
            Crear una cuenta nueva
          </Link>

          <Link
            href="/login"
            className="mt-5 flex items-center justify-center text-sm font-semibold text-gray-500 transition hover:text-[#1E40AF]"
          >
            <ArrowLeft size={16} className="mr-1.5" /> Volver al inicio de sesión
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerificarCuenta() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#0F172A_0%,#111827_42%,#1E1B4B_74%)] px-6 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-[450px] rounded-3xl border border-gray-100 bg-white p-10 shadow-md text-center flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#1E40AF] mb-4" />
            <p className="text-gray-500 font-medium">Cargando...</p>
          </div>
        }
      >
        <VerificarCuentaContenido />
      </Suspense>
    </main>
  );
}
