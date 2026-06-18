import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  BookOpen,
  ChevronDown,
  CircleHelp,
  Code2,
  Globe2,
  GraduationCap,
  Grid2X2,
  Heart,
  LayoutGrid,
  Lightbulb,
  AtSign,
  Mail,
  Map,
  Menu,
  MessageCircle,
  Network,
  Search,
  Users,
  Video,
  Zap,
  Shield,
  Wifi,
  Brain,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import HeaderAdmin from '@/app/dashboard/components/HeaderAdmin';
import TabsNavbar from '@/components/TabsNavbar';
import FAQSection from '@/components/FAQSection';

type CoursePreview = {
  id: string;
  titulo: string;
  descripcion: string | null;
  imgPortada: string | null;
  nivel: string | null;
  categoria: { nombre: string } | null;
  instructor: { nombre: string };
  _count: { inscripciones: number; modulos: number };
};

function Logo({ dark = false }: { dark?: boolean }) {
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

function PrimaryButton({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${className}`}
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
  dark = false,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded border px-6 py-3 text-sm font-semibold no-underline transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
        dark
          ? 'border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
          : 'border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#F9FAFB]'
      } ${className}`}
    >
      {children}
    </Link>
  );
}

function CourseCard({ course, index }: { course: CoursePreview; index: number }) {
  const delays = [
    'animate-fade-up-delay-1',
    'animate-fade-up-delay-2',
    'animate-fade-up-delay-3',
    'animate-fade-up-delay-4',
    'animate-fade-up-delay-5',
    'animate-fade-up-delay-6',
    'animate-fade-up-delay-7',
    'animate-fade-up-delay-8',
  ];
  return (
    <article
      className={`group relative overflow-hidden rounded-lg border border-[#F3F4F6] bg-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-100 animate-fade-up ${delays[index % 8]}`}
    >
      <Link
        href={`/cursos/${course.id}`}
        className="absolute inset-0 z-[1] no-underline"
        aria-label={course.titulo}
      />
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E5E7EB]">
        {course.imgPortada ? (
          <img src={course.imgPortada} alt={course.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#dbeafe] to-[#ede9fe]">
            <BookOpen size={40} className="text-[#93C5FD]" />
          </div>
        )}
        <span className="absolute left-3 top-3 z-[2] rounded-full bg-[#2563EB] px-2.5 py-1 text-[11px] font-semibold text-white">
          {course.nivel?.toUpperCase() || 'GENERAL'}
        </span>
        <button
          type="button"
          aria-label="Guardar curso"
          className="absolute right-3 top-3 z-[2] flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#6B7280] backdrop-blur-sm transition hover:text-[#2563EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB]"
        >
          <Heart size={14} />
        </button>
      </div>
      <div className="relative p-4 pb-5">
        <p className="mb-2 text-[11px] font-normal text-[#6B7280]">
          {course.categoria?.nombre ?? 'General'} · {course._count.inscripciones} estudiantes
        </p>
        <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-snug text-[#111827]">
          {course.titulo}
        </h3>
        <p className="mb-3 line-clamp-3 text-[13px] font-normal leading-relaxed text-[#4B5563]">
          {course.descripcion || 'Explora este curso en SABERHUB.'}
        </p>
        <span className="inline-flex rounded-full border border-[#2563EB] px-2 py-1 text-[11px] font-medium text-[#2563EB]">
          Sin cargo
        </span>
      </div>
      {/* Barra inferior animada */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5E7EB]" />
      <div className="course-card-line absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]" />
    </article>
  );
}

function PlatformMockup() {
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <div className="rounded-xl border border-[#BFDBFE] bg-white p-3 shadow-xl shadow-blue-100">
        <div className="rounded-lg border border-[#DBEAFE] bg-[#F8FAFC] p-3">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          </div>
          <div className="grid grid-cols-[88px_1fr] gap-4">
            <div className="space-y-2 rounded-lg bg-white p-2 shadow-sm">
              {['Cursos', 'Labs', 'Notas', 'Foro'].map((item, index) => (
                <div
                  key={item}
                  className={`h-6 rounded px-2 text-[10px] leading-6 ${
                    index === 0 ? 'bg-[#2563EB] text-white' : 'bg-[#EFF6FF] text-[#2563EB]'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-20 rounded-lg bg-gradient-to-br from-[#DBEAFE] to-[#EDE9FE]" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 rounded-lg bg-white shadow-sm" />
                <div className="h-12 rounded-lg bg-white shadow-sm" />
              </div>
              <div className="h-3 w-4/5 rounded-full bg-[#93C5FD]" />
              <div className="h-3 w-2/3 rounded-full bg-[#BFDBFE]" />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border border-[#BFDBFE] bg-white px-4 py-2 text-sm font-bold text-[#111827] shadow-sm">
        <BookOpen size={18} className="text-[#2563EB]" />
        SABERHUB
      </div>
    </div>
  );
}

// Patrón de puntos SVG para el hero
function DotPattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return n.toString();
}

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const usuario = token ? await verifyToken(token) : null;

  const [cursos, totalCursos, totalEstudiantes, totalInstituciones] = await Promise.all([
    prisma.curso.findMany({
      where: {
        estado: 'publicado',
        cursosExternos: { none: {} },
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        imgPortada: true,
        nivel: true,
        categoria: { select: { nombre: true } },
        instructor: { select: { nombre: true } },
        _count: { select: { inscripciones: true, modulos: true } },
      },
      orderBy: { actualizado: 'desc' },
      take: 8,
    }),
    prisma.curso.count({
      where: {
        estado: 'publicado',
        cursosExternos: { none: {} },
      },
    }),
    prisma.inscripcion.count(),
    prisma.institucion.count(),
  ]);

  return (
    <main
      className="min-h-screen bg-white text-[#111827]"
      style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}
    >
      <HeaderAdmin usuario={usuario} />

      {/* ══════════ HERO ══════════ */}
      <section className="hero-gradient relative overflow-hidden px-6 py-12 lg:px-8 min-h-[calc(100vh-80px)] flex items-center">
        <DotPattern />
        {/* Orbs decorativos */}
        <div className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-[#3b82f6]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-[400px] w-[400px] rounded-full bg-[#6366f1]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1180px] w-full items-center gap-10 md:grid-cols-[55fr_45fr]">
          <div className="order-2 md:order-1 md:pr-12">
            {/* Badge */}
            <span className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#93c5fd] backdrop-blur-sm">
              <Zap size={11} className="text-[#fbbf24]" />
              Plataforma gratuita · Colombia
            </span>

            <h1 className="animate-fade-up animate-fade-up-delay-1 text-5xl font-bold leading-[1.1] tracking-[-0.02em] text-white lg:text-6xl">
              SABERHUB
            </h1>
            <p className="animate-fade-up animate-fade-up-delay-2 mt-5 max-w-[580px] text-base font-normal leading-[1.8] text-[#94a3b8]">
              Desarrolla habilidades en programación, ciberseguridad, redes e inteligencia
              artificial con herramientas prácticas en línea. Practica en entornos virtuales sin
              necesidad de hardware y comienza hoy mismo.
            </p>

            {/* Chips de especialidades */}
            <div className="animate-fade-up animate-fade-up-delay-3 mt-5 flex flex-wrap gap-2">
              {[
                { icon: Shield, label: 'Ciberseguridad' },
                { icon: Wifi, label: 'Redes' },
                { icon: Brain, label: 'Inteligencia Artificial' },
                { icon: Code2, label: 'Programación' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-[#cbd5e1]"
                >
                  <Icon size={11} className="text-[#60a5fa]" />
                  {label}
                </span>
              ))}
            </div>

            <div className="animate-fade-up animate-fade-up-delay-4 mt-8 flex flex-wrap gap-4">
              <PrimaryButton href="/catalogo">Ver ejemplos de contenido</PrimaryButton>
              <SecondaryButton href="#ensenar" dark>
                Enseñar con nosotros
              </SecondaryButton>
            </div>
          </div>

          <div className="relative order-1 min-h-[350px] md:order-2">
            <div className="absolute right-8 top-6 h-[200px] w-[200px] rounded-full bg-[#3b82f6]/20 blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=85"
              alt="Joven colombiana estudiando en computador en una sala moderna"
              className="absolute right-0 top-0 h-56 w-[70%] rounded-xl object-cover ring-1 ring-white/10"
            />
            <img
              src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=85"
              alt="Hombre joven con gafas y auriculares trabajando con código"
              className="absolute bottom-0 left-0 h-52 w-[62%] rounded-xl object-cover ring-1 ring-white/10"
            />
            <span className="absolute left-8 top-20 rounded-full bg-[#2563EB] px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/30">
              GRATUITO
            </span>
          </div>
        </div>
      </section>

      {/* ══════════ TABS NAV ══════════ */}
      <TabsNavbar />

      {/* ══════════ CURSOS ══════════ */}
      <section id="aprender" className="bg-white px-6 py-12 lg:px-8 scroll-mt-36">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-[28px] font-bold text-[#111827]">Comenzar a aprender</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3 pb-8">
            <label className="flex h-10 w-full max-w-[320px] items-center rounded-lg border border-[#D1D5DB] bg-white px-3">
              <Search size={16} className="mr-2 text-[#9CA3AF]" />
              <input
                placeholder="Buscar curso, formación"
                className="w-full text-sm outline-none placeholder:text-[#9CA3AF]"
              />
            </label>
            {['Área temática', 'Nivel'].map((label) => (
              <button
                key={label}
                className="flex h-10 min-w-[180px] items-center justify-between rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#374151]"
              >
                {label}
                <ChevronDown size={15} />
              </button>
            ))}
            <div className="ml-auto flex overflow-hidden rounded border border-[#D1D5DB]">
              <button
                aria-label="Vista cuadrícula"
                className="flex h-10 w-10 items-center justify-center bg-[#2563EB] text-white"
              >
                <LayoutGrid size={17} />
              </button>
              <button
                aria-label="Vista lista"
                className="flex h-10 w-10 items-center justify-center bg-white text-[#9CA3AF]"
              >
                <Menu size={17} />
              </button>
            </div>
          </div>

          {cursos.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cursos.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-[#6B7280]">
              No hay cursos publicados aún. Vuelve pronto.
            </p>
          )}

          <div className="mt-8 flex justify-center">
            <SecondaryButton href="/catalogo" className="px-8">
              Ver todos
            </SecondaryButton>
          </div>
        </div>
      </section>

      {/* ══════════ PRÁCTICA ══════════ */}
      <section id="elegir" className="bg-[#EFF6FF] px-6 py-12 lg:px-8 scroll-mt-36">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 md:grid-cols-[55fr_45fr]">
          <div>
            <p className="mb-3 text-sm font-normal text-[#4B5563]">
              Herramientas prácticas para aprender haciendo.
            </p>
            <h2 className="text-2xl font-bold text-[#111827]">Practica con SABERHUB</h2>
            <p className="mt-4 max-w-[620px] text-[15px] font-normal leading-[1.7] text-[#4B5563]">
              SABERHUB te da acceso a simuladores, laboratorios virtuales y entornos de práctica
              para aprender haciendo. Sin costos, sin hardware, solo tus ganas de aprender.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <PrimaryButton href="/catalogo">Ver ejemplos de laboratorio</PrimaryButton>
              <SecondaryButton href="#ensenar">Enseñar con nosotros</SecondaryButton>
            </div>
          </div>
          <PlatformMockup />
        </div>
      </section>

      {/* ══════════ INSTITUCIONES ══════════ */}
      <section className="border-y border-[#E5E7EB] bg-white px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
            <div>
              <span className="mb-4 inline-block rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold text-[#2563EB]">
                PARA INSTITUCIONES
              </span>
              <h2 className="max-w-[560px] text-[28px] font-bold leading-[1.2] text-[#111827]">
                ¿Tu institución quiere ofrecer cursos en SABERHUB?
              </h2>
              <p className="mt-3 max-w-[560px] text-[15px] leading-[1.7] text-[#4B5563]">
                Conecta tu universidad, SENA regional, fundación o entidad pública con miles de
                estudiantes colombianos. Infraestructura, certificación y seguimiento sin costo
                alguno.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
                {[
                  ['🆓', 'Sin costo para la institución'],
                  ['🎓', 'Certificados con tu nombre'],
                  ['📊', 'Panel de seguimiento'],
                  ['👥', 'Miles de estudiantes'],
                ].map(([icon, label]) => (
                  <div key={label as string} className="flex items-center gap-2 text-sm text-[#374151]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] text-sm">
                      {icon}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats card con datos reales */}
            <div className="flex shrink-0 flex-col items-center gap-4 rounded-xl border border-[#F3F4F6] bg-white p-8 text-center shadow-md shadow-blue-50">
              <div className="flex flex-col gap-1 animate-fade-up animate-fade-up-delay-1">
                <span className="text-4xl font-bold text-[#2563EB]">
                  {totalInstituciones > 0 ? formatNumber(totalInstituciones) : '—'}
                </span>
                <span className="text-xs text-[#6B7280]">Instituciones aliadas</span>
              </div>
              <div className="h-px w-full bg-[#F3F4F6]" />
              <div className="flex flex-col gap-1 animate-fade-up animate-fade-up-delay-2">
                <span className="text-4xl font-bold text-[#2563EB]">
                  {totalCursos > 0 ? formatNumber(totalCursos) : '—'}
                </span>
                <span className="text-xs text-[#6B7280]">Cursos publicados</span>
              </div>
              <div className="h-px w-full bg-[#F3F4F6]" />
              <div className="flex flex-col gap-1 animate-fade-up animate-fade-up-delay-3">
                <span className="text-4xl font-bold text-[#2563EB]">
                  {totalEstudiantes > 0 ? formatNumber(totalEstudiantes) : '—'}
                </span>
                <span className="text-xs text-[#6B7280]">Estudiantes activos</span>
              </div>
              <PrimaryButton href="/instituciones/registro" className="mt-2 w-full">
                Registrar mi institución
              </PrimaryButton>
              <p className="text-[11px] text-[#9CA3AF]">Proceso 100% gratuito · 5 días hábiles</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ HERO OSCURO INSTITUCIONES ══════════ */}
      <section className="bg-[#0F172A] px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-[#93C5FD]">
              SABERHUB para instituciones
            </p>
            <h2 className="max-w-[520px] text-4xl font-bold leading-[1.2] text-white">
              Lleva SABERHUB a tu institución
            </h2>
            <p className="mt-4 max-w-[580px] text-base font-normal leading-[1.6] text-[#CBD5E1]">
              Conecta a tus estudiantes con cursos de calidad, herramientas de seguimiento de
              progreso y certificados validados. Sin costos para tu institución.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <PrimaryButton href="/instituciones/registro">Registrar institución</PrimaryButton>
              <SecondaryButton href="/catalogo" dark>
                Conocer más
              </SecondaryButton>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1000&q=85"
              alt="Estudiantes reunidos en una institución educativa"
              className="h-[320px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-[#2563EB]/20" />
          </div>
        </div>
      </section>

      {/* ══════════ ENSEÑAR ══════════ */}
      <section id="ensenar" className="bg-[#F9FAFB] px-6 py-20 lg:px-8 scroll-mt-36">
        <div className="mx-auto max-w-[980px] text-center">
          <h2 className="text-[32px] font-bold text-[#111827]">Enseña con SABERHUB</h2>
          <p className="mt-3 text-base font-normal text-[#6B7280]">
            SABERHUB se basa en tres principios de la ciencia del aprendizaje.
          </p>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {[
              [Network, 'Aprendizaje activo', 'Aprende haciendo con laboratorios virtuales y proyectos reales.'],
              [Users, 'Aprendizaje social', 'Colabora con compañeros y expertos de toda Colombia.'],
              [Map, 'Aprendizaje contextual', 'Contenido relevante para el mercado laboral colombiano.'],
            ].map(([Icon, title, desc]) => {
              const PrincipleIcon = Icon as typeof Network;
              return (
                <div key={title as string} className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] ring-1 ring-[#BFDBFE]">
                    <PrincipleIcon size={32} strokeWidth={1.6} className="text-[#2563EB]" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#111827]">{title as string}</h3>
                  <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{desc as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ SOCIAL PROOF ══════════ */}
      <section className="bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
          <div className="relative mb-8 h-28 w-56">
            <div className="absolute left-8 top-6 h-14 w-14 rotate-12 rounded-xl bg-[#DBEAFE]" />
            <div className="absolute left-24 top-2 flex h-20 w-20 items-center justify-center rounded-2xl border border-[#BFDBFE] bg-white shadow-md">
              <Lightbulb size={34} className="text-[#2563EB]" />
            </div>
            <div className="absolute right-8 top-12 h-10 w-20 rounded-xl bg-[#2563EB]" />
            <div className="absolute bottom-0 left-16 h-3 w-32 rounded-full bg-[#E5E7EB]" />
          </div>
          <h2 className="text-2xl font-bold text-[#111827]">
            Más de <span className="text-[#2563EB]">10,000</span> estudiantes colombianos ya están
            aprendiendo con SABERHUB
          </h2>
          <p className="mt-3 text-base font-normal text-[#6B7280]">
            Únete a la comunidad de aprendizaje más grande de Colombia.
          </p>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="border-t border-[#F3F4F6] bg-white px-6 py-12 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap justify-center gap-4">
          <PrimaryButton href="/catalogo">Ver ejemplos de contenido de laboratorio</PrimaryButton>
          <SecondaryButton href="#ensenar">Enseñar con nosotros</SecondaryButton>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <FAQSection />

      {/* ══════════ INSTITUCIONES ALIADAS ══════════ */}
      <section className="bg-[#F9FAFB] px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-[1180px] text-center">
          <p className="text-xs font-medium uppercase text-[#6B7280]">
            Instituciones que confían en SABERHUB:
          </p>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer id="footer" className="bg-[#171717] px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
            <div className="lg:w-40">
              <Logo dark />
            </div>

            <div className="flex gap-3">
              {[Video, Users, AtSign, Mail, Code2].map((Icon, index) => (
                <Link
                  key={index}
                  href="#footer"
                  aria-label={`Red social ${index + 1}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#374151] text-white transition hover:bg-[#4B5563]"
                >
                  <Icon size={17} />
                </Link>
              ))}
            </div>
          </div>
          <div className="my-6 h-px w-full bg-[#374151]" />
          <div className="flex flex-col gap-4 text-xs md:flex-row md:items-center md:justify-between">
            <p className="text-[#9CA3AF]">© 2026 SABERHUB. Todos los derechos reservados.</p>
            <div className="flex flex-wrap gap-2 text-[#D1D5DB]">
              <Link
                href="/terminos"
                className="hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
              >
                Términos y condiciones
              </Link>
              <span className="text-[#4B5563]">|</span>
              <Link
                href="/privacidad"
                className="hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
              >
                Declaración de privacidad
              </Link>
              <span className="text-[#4B5563]">|</span>
              <Link
                href="/privacidad"
                className="hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
              >
                Protección de datos (Ley 1581)
              </Link>
              <span className="text-[#4B5563]">|</span>
              <Link
                href="#footer"
                className="hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
              >
                Política sobre cookies
              </Link>
              <span className="text-[#4B5563]">|</span>
              <Link
                href="#footer"
                className="hover:text-white focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
              >
                Accesibilidad (WCAG 2.1)
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
