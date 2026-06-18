import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileLock, UserCheck, ShieldCheck, Mail } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad y Habeas Data | SABERHUB',
  description:
    'Política de Tratamiento de Datos Personales y Habeas Data bajo la Ley 1581 de 2012 de Colombia en SABERHUB.',
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

export default function PrivacidadPage() {
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
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0F172A_0%,#111827_35%,#1E1B4B_70%,#1E40AF_120%)] py-16 px-6 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)]" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
            Cumplimiento Ley 1581 de 2012
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Pol&iacute;tica de Privacidad
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Tratamiento de Datos Personales y Habeas Data - Rep&uacute;blica de Colombia
          </p>
        </div>
      </section>

      {/* Content Container */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          {/* Main Legal Content */}
          <article className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-emerald-600">Compromiso Legal</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                1. Marco Normativo (Ley 1581 de 2012)
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                En **SABERHUB**, estamos firmemente comprometidos con la protecci&oacute;n y uso
                responsable de los datos personales de nuestros usuarios. Dando cumplimiento a lo
                establecido en la **Ley 1581 de 2012** (Ley General de Protecci&oacute;n de Datos
                Personales de Colombia) y su Decreto Reglamentario 1377 de 2013, garantizamos el
                ejercicio del derecho constitucional de **Habeas Data** para conocer, actualizar,
                rectificar y suprimir tu informaci&oacute;n personal en nuestras bases de datos.
              </p>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-emerald-600">Finalidad</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                2. Finalidad del Tratamiento de Datos
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Al registrarte en SABERHUB y autorizar expresamente el tratamiento de tus datos
                personales, recolectamos informaci&oacute;n de identificaci&oacute;n (Nombre
                completo, n&uacute;mero de documento y correo electr&oacute;nico) con las siguientes
                finalidades leg&iacute;timas:
              </p>
              <ul className="mt-4 list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  Gestionar el proceso de inscripci&oacute;n en cursos, programas y lecciones en la
                  plataforma.
                </li>
                <li>
                  Monitorear y almacenar de forma segura tu progreso educativo acad&eacute;mico y de
                  laboratorios.
                </li>
                <li>
                  Emitir y validar certificados de finalizaci&oacute;n con firma digital o
                  c&oacute;digo QR.
                </li>
                <li>
                  Establecer canales de comunicaci&oacute;n sobre soporte t&eacute;cnico,
                  actualizaciones y avisos pedag&oacute;gicos.
                </li>
                <li>
                  Fines estad&iacute;sticos internos no comerciales para mejorar la experiencia de
                  SABERHUB.
                </li>
              </ul>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-emerald-600">Derechos</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                3. Derechos de los Titulares (Tus Derechos)
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Como titular de los datos personales que reposan en SABERHUB, gozas de los
                siguientes derechos en virtud de la Ley 1581 de 2012:
              </p>
              <ul className="mt-4 list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  **Conocer y consultar** qu&eacute; datos personales tenemos tuyos en nuestra base
                  de datos.
                </li>
                <li>
                  **Actualizar o rectificar** tu informaci&oacute;n cuando est&eacute; incompleta,
                  sea inexacta o est&eacute; desactualizada.
                </li>
                <li>
                  **Revocar la autorizaci&oacute;n** o solicitar la **supresi&oacute;n del dato**
                  cuando consideres que no se respetan los principios, derechos y garant&iacute;as
                  constitucionales.
                </li>
                <li>
                  **Solicitar prueba** de la autorizaci&oacute;n otorgada durante tu registro
                  inicial.
                </li>
              </ul>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-emerald-600">Canales</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                4. Canales para Ejercer los Derechos de Habeas Data
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Puedes ejercer cualquiera de tus derechos de consulta, rectificaci&oacute;n,
                actualizaci&oacute;n o supresi&oacute;n enviando una solicitud formal a
                trav&eacute;s de nuestros canales de atenci&oacute;n oficiales:
              </p>
              <div className="mt-4 rounded-xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <p className="text-sm font-bold text-slate-900">
                  Oficial de Protecci&oacute;n de Datos:
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Correo Electr&oacute;nico: **privacidad@saberhub.co**
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Las solicitudes de consulta ser&aacute;n atendidas en un plazo m&aacute;ximo de
                  diez (10) d&iacute;as h&aacute;biles y los reclamos dentro de un plazo
                  m&aacute;ximo de quince (15) d&iacute;as h&aacute;biles, conforme a la
                  legislaci&oacute;n colombiana.
                </p>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-emerald-600">Seguridad</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                5. Medidas de Seguridad de la Informaci&oacute;n
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                En concordancia con el principio de seguridad de la Ley 1581 de 2012, SABERHUB
                implementa rigurosas barreras t&eacute;cnicas, operativas y administrativas para
                evitar la alteraci&oacute;n, p&eacute;rdida, consulta, uso o acceso no autorizado a
                tus datos personales:
              </p>
              <ul className="mt-4 list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  **Encriptaci&oacute;n bcrypt** de m&iacute;nimo 10 rondas para almacenar
                  contraseñas.
                </li>
                <li>
                  **Conexi&oacute;n Encriptada HTTPS** (HSTS de larga vigencia) transversal en toda
                  la plataforma.
                </li>
                <li>
                  **Content Security Policy (CSP)** para mitigar inyecciones de código cruzado
                  (XSS).
                </li>
                <li>
                  **Filtros de control CSRF** y par&aacute;metros preparados en base de datos para
                  mitigar inyecciones SQL.
                </li>
              </ul>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <p className="text-sm font-medium leading-6 text-emerald-600">Galletas</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                6. Pol&iacute;tica de Cookies
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                SABERHUB utiliza &uacute;nicamente cookies t&eacute;cnicas esenciales para el
                funcionamiento seguro de las sesiones (como la cookie encriptada `token` que expira
                por inactividad tras 30 minutos). No compartimos informaci&oacute;n de
                navegaci&oacute;n con terceros ni redes publicitarias.
              </p>
            </div>

            <div className="pb-4">
              <p className="text-sm font-medium leading-6 text-emerald-600">
                Fuentes Externas (RL-03 / RL-04 / RL-05)
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                7. Importaci&oacute;n de Cursos de Fuentes Externas
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                SABERHUB puede mostrar en su cat&aacute;logo cursos provenientes de plataformas
                educativas externas (Coursera, edX, SENA Sof&iacute;a Plus, Khan Academy, entre
                otras). Esta secci&oacute;n describe c&oacute;mo operamos con respecto a ese
                contenido externo.
              </p>

              <h3 className="mt-6 text-base font-bold text-slate-800">
                7.1 Qu&eacute; datos almacenamos de fuentes externas
              </h3>
              <p className="mt-2 text-base leading-7 text-slate-600">
                &Uacute;nicamente almacenamos <strong>metadatos p&uacute;blicos</strong>: t&iacute;tulo,
                descripci&oacute;n, imagen de portada (thumbnail p&uacute;blico) y la URL al curso
                original. <strong>No descargamos, no alojamos ni reproducimos</strong> ning&uacute;n
                material del curso: videos, PDFs, presentaciones ni evaluaciones permanecen
                exclusivamente en la plataforma original.
              </p>

              <h3 className="mt-6 text-base font-bold text-slate-800">
                7.2 Atribuci&oacute;n de fuente
              </h3>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Todo curso importado muestra de forma visible el nombre de la fuente original y un
                enlace directo al curso en dicha plataforma. Al hacer clic en &ldquo;Ver
                curso&rdquo;, el usuario es redirigido a la fuente original. SABERHUB act&uacute;a
                como <strong>directorio de referencia</strong>, no como plataforma de
                reproducci&oacute;n de contenido ajeno.
              </p>

              <h3 className="mt-6 text-base font-bold text-slate-800">
                7.3 Cumplimiento de robots.txt
              </h3>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Antes de recuperar informaci&oacute;n de cualquier sitio externo, el sistema de
                importaci&oacute;n de SABERHUB verifica el archivo{' '}
                <code className="rounded bg-slate-100 px-1 text-sm">robots.txt</code> de cada
                fuente. Los paths bloqueados en dicho archivo <strong>no son accedidos</strong> y el
                evento queda registrado en los logs de auditor&iacute;a.
              </p>

              <h3 className="mt-6 text-base font-bold text-slate-800">
                7.4 Derecho al olvido — solicitud de remoción por instituciones
              </h3>
              <p className="mt-2 text-base leading-7 text-slate-600">
                Cualquier instituci&oacute;n o titular de contenido puede solicitar que sus cursos
                sean removidos del cat&aacute;logo de SABERHUB. El proceso es:
              </p>
              <ol className="mt-3 list-decimal pl-5 space-y-1 text-slate-600">
                <li>
                  Enviar solicitud formal a{' '}
                  <a
                    href="mailto:privacidad@saberhub.co"
                    className="text-emerald-600 underline"
                  >
                    privacidad@saberhub.co
                  </a>{' '}
                  indicando la fuente y los cursos a remover.
                </li>
                <li>
                  El equipo de SABERHUB bloquea la fuente en el sistema en un plazo m&aacute;ximo
                  de <strong>5 d&iacute;as h&aacute;biles</strong>.
                </li>
                <li>
                  Al bloquear la fuente, todos sus cursos dejan de mostrarse{' '}
                  <strong>de inmediato</strong> en el cat&aacute;logo p&uacute;blico.
                </li>
                <li>
                  Se env&iacute;a confirmaci&oacute;n escrita a la instituci&oacute;n solicitante.
                </li>
              </ol>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-bold text-slate-800">
                  Solicitudes de remoción de contenido externo:
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Correo:{' '}
                  <a href="mailto:privacidad@saberhub.co" className="text-emerald-600 underline">
                    privacidad@saberhub.co
                  </a>
                  {' '}· Asunto: &ldquo;Remoción de contenido externo&rdquo;
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tiempo de respuesta: m&aacute;ximo 5 d&iacute;as h&aacute;biles conforme a la
                  normativa colombiana.
                </p>
              </div>
            </div>
          </article>

          {/* Sidebar Widgets */}
          <aside className="space-y-6">
            {/* Habeas Data Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Garant&iacute;a Habeas Data</h3>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Tus datos son tuyos</h4>
                    <p className="text-[11px] text-slate-500">Puedes eliminarlos cuando desees.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FileLock size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">No comercializaci&oacute;n</h4>
                    <p className="text-[11px] text-slate-500">
                      Nunca venderemos tu informaci&oacute;n.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Servidores Seguros</h4>
                    <p className="text-[11px] text-slate-500">Conexiones totalmente encriptadas.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance Card */}
            <div className="rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#065F46_0%,#064E3B_100%)] p-5 text-white shadow-sm">
              <h3 className="text-sm font-bold">Solicitudes de Datos</h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-100">
                ¿Deseas revocar tu autorizaci&oacute;n o solicitar la supresi&oacute;n de tus datos?
                Cont&aacute;ctanos a privacidad@saberhub.co.
              </p>
              <a
                href="mailto:privacidad@saberhub.co"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-emerald-950 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <Mail size={14} />
                privacidad@saberhub.co
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
              className="hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#1E40AF]"
            >
              T&eacute;rminos de Servicio
            </Link>
            <span>|</span>
            <Link
              href="/privacidad"
              className="font-semibold text-emerald-600 hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#1E40AF]"
            >
              Pol&iacute;tica de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
