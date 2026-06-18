import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Scale, ShieldCheck, UserCheck, Globe } from 'lucide-react';

export const metadata = {
  title: 'Términos de Servicio | SABERHUB',
  description: 'Términos y condiciones de uso de la plataforma de aprendizaje SABERHUB.',
};

function Logo() {
  return (
    <Link
      href="/"
      className="flex flex-col leading-none no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1E40AF]"
    >
      <span className="text-[13px] font-bold tracking-[0] text-[#111827]">SABERHUB</span>
      <span className="mt-1 text-[10px] font-normal text-[#6B7280]">Learning Platform</span>
    </Link>
  );
}

export default function TerminosPage() {
  return (
    <main
      className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased"
      style={{ fontFamily: 'Inter, Arial, sans-serif' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1E40AF]"
          >
            <ArrowLeft size={16} />
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0F172A_0%,#1E1.5B4B_50%,#1E40AF_100%)] py-16 px-6 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 ring-1 ring-inset ring-blue-500/20">
            Legal & Condiciones
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            T&eacute;rminos de Servicio
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            &Uacute;ltima actualizaci&oacute;n: 22 de mayo de 2026. Por favor lee atentamente las
            condiciones de uso de SABERHUB.
          </p>
        </div>
      </section>

      {/* Content Container */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main Legal Content */}
          <article className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-blue-600">Introducci&oacute;n</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                1. Relaci&oacute;n Contractual
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Bienvenido a **SABERHUB**. Al acceder, registrarse o utilizar nuestra plataforma
                web, cursos, laboratorios o herramientas virtuales, aceptas cumplir y estar sujeto a
                los presentes T&eacute;rminos de Servicio. Si no est&aacute;s de acuerdo con estos
                t&eacute;rminos, te solicitamos abstenerte de utilizar la plataforma.
              </p>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-blue-600">Servicios</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                2. Descripci&oacute;n del Servicio
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                SABERHUB proporciona un entorno educativo gratuito diseñado para fomentar el
                aprendizaje en programaci&oacute;n, redes, ciberseguridad e inteligencia artificial.
                Ofrecemos lecciones, evaluaciones, simuladores virtuales y certificaciones de
                participaci&oacute;n avaladas por las instituciones aliadas correspondientes.
              </p>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Todos los contenidos provistos son estrictamente gratuitos. Est&aacute;
                terminantemente prohibido revender, sublicenciar o lucrarse de cualquier recurso o
                acceso proporcionado en este portal.
              </p>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-blue-600">Usuarios</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                3. Registro de Cuentas y Seguridad
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Para inscribirte en cursos y registrar tu progreso acad&eacute;mico, debes crear una
                cuenta personal suministrando datos precisos y vigentes.
              </p>
              <ul className="mt-4 list-disc pl-5 space-y-2 text-slate-600">
                <li>Es tu responsabilidad mantener la confidencialidad de tu contraseña.</li>
                <li>
                  Las contraseñas se almacenan mediante encriptaci&oacute;n criptogr&aacute;fica
                  segura (bcrypt, m&iacute;nimo 10 rondas).
                </li>
                <li>
                  Est&aacute; prohibido compartir cuentas de usuario o suplantar la identidad de
                  terceros.
                </li>
                <li>
                  Cualquier actividad sospechosa debe ser reportada inmediatamente a
                  soporte@saberhub.co.
                </li>
              </ul>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-blue-600">Conducta</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                4. C&oacute;digo de Conducta del Estudiante
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Como miembro de la comunidad de SABERHUB, te comprometes a usar la plataforma bajo
                principios éticos y respetuosos. No est&aacute; permitido:
              </p>
              <ul className="mt-4 list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  Utilizar los foros de discusi&oacute;n o mensajer&iacute;a para difundir spam,
                  contenidos difamatorios, de odio o discriminatorios.
                </li>
                <li>
                  Intentar inyectar scripts maliciosos (XSS), realizar ataques de denegaci&oacute;n
                  de servicio, o vulnerar el sistema de seguridad.
                </li>
                <li>
                  Hacer trampa en evaluaciones o alterar de cualquier forma los sistemas de
                  asignaci&oacute;n de notas y certificaciones.
                </li>
              </ul>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-blue-600">Propiedad</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                5. Propiedad Intelectual
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Toda la propiedad intelectual de los cursos, textos, logos, marcas comerciales y
                videos de lecciones pertenece a SABERHUB, a sus respectivos autores o a las
                instituciones asociadas. La visualizaci&oacute;n del contenido est&aacute;
                licenciada &uacute;nicamente para fines educativos personales e intransferibles del
                estudiante registrado.
              </p>
            </div>

            <div className="pb-4">
              <p className="text-sm font-medium leading-6 text-blue-600">Rescisi&oacute;n</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                6. Suspensi&oacute;n y Modificaciones
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                SABERHUB se reserva el derecho de suspender o cancelar cuentas que violen estos
                t&eacute;rminos de servicio, as&iacute; como a modificar las funcionalidades de la
                plataforma para mejorar el entorno educativo general. Las actualizaciones
                sustanciales de estos t&eacute;rminos se notificar&aacute;n a trav&eacute;s de los
                canales oficiales.
              </p>
            </div>
          </article>

          {/* Sidebar Widgets */}
          <aside className="space-y-6">
            {/* Quick Cards */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Resumen R&aacute;pido</h3>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">100% Gratis</h4>
                    <p className="text-[11px] text-slate-500">Cursos sin costos ocultos.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Datos Seguros</h4>
                    <p className="text-[11px] text-slate-500">Uso responsable de datos.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Scale size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">C&oacute;digo Ético</h4>
                    <p className="text-[11px] text-slate-500">No trampas ni spam.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance Card */}
            <div className="rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#1E40AF_0%,#1E3A8A_100%)] p-5 text-white shadow-sm">
              <h3 className="text-sm font-bold">¿Tienes dudas?</h3>
              <p className="mt-2 text-xs leading-relaxed text-blue-100">
                Si requieres mayor informaci&oacute;n sobre nuestras condiciones de uso de la
                plataforma, puedes contactarnos en cualquier momento.
              </p>
              <a
                href="mailto:soporte@saberhub.co"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-900 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                soporte@saberhub.co
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p>© 2026 SABERHUB. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-4 text-slate-600">
            <Link
              href="/terminos"
              className="font-semibold text-blue-600 hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#1E40AF]"
            >
              T&eacute;rminos de Servicio
            </Link>
            <span>|</span>
            <Link
              href="/privacidad"
              className="hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#1E40AF]"
            >
              Pol&iacute;tica de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
