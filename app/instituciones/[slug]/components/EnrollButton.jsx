'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, ArrowRight } from 'lucide-react';

export default function EnrollButton({ courseId, initiallyEnrolled, loggedIn, slug, id }) {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(initiallyEnrolled);
  const [loading, setLoading] = useState(false);

  const handleEnroll = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!loggedIn) {
      // Redirigir al registro público con la ruta de retorno
      const redirectUrl = `/registro?redirect=/instituciones/${slug}`;
      router.push(redirectUrl);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId }),
      });

      if (res.ok) {
        setEnrolled(true);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.message || 'Error al inscribirse en el curso');
      }
    } catch (err) {
      console.error('Error al realizar inscripción:', err);
      alert('Error de red. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (enrolled) {
    return (
      <button
        id={id}
        onClick={() => router.push(`/cursos/${courseId}`)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-emerald-500/20"
        aria-label="Ir al curso en el que estás inscrito"
      >
        <Check size={16} />
        <span>Ir al Curso</span>
        <ArrowRight size={14} className="ml-1 opacity-80" />
      </button>
    );
  }

  return (
    <button
      id={id}
      onClick={handleEnroll}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md ${
        loading
          ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20 dark:bg-indigo-500 dark:hover:bg-indigo-600'
      }`}
      aria-label="Inscribirme gratis en este curso"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Inscribiendo...</span>
        </>
      ) : (
        <span>Inscribirme Gratis</span>
      )}
    </button>
  );
}
