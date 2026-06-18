import React from 'react';

const YoutubeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);
const FacebookIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.81l.39-4h-4.2V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);
const InstagramIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
const LinkedinIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);
const XIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
  </svg>
);

export default function FooterAdmin({ className = '' }) {
  return (
    <footer className={`w-full bg-[#171717] px-6 md:px-8 py-12 ${className}`}>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row justify-between mb-8 gap-12 lg:gap-0">
          <div className="lg:w-1/4">
            <span className="font-bold text-[16px] text-white">SABERHUB</span>
          </div>

          <div className="flex flex-col md:flex-row gap-12 lg:gap-16 flex-grow">
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[14px] text-white mb-1">Plataforma</span>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                Catálogo de cursos
              </a>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                Instituciones
              </a>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                Cómo funciona
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[14px] text-white mb-1">Para instructores</span>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                Enseña en SABERHUB
              </a>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                Recursos
              </a>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                Comunidad
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[14px] text-white mb-1">Soporte</span>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                Centro de ayuda
              </a>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                Contacto
              </a>
              <a
                href="#"
                className="font-normal text-[13px] text-[#D1D5DB] hover:text-white transition-colors"
              >
                FAQ
              </a>
            </div>
          </div>

          <div className="flex gap-4 lg:w-1/4 justify-start lg:justify-end">
            <div
              className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
              aria-label="YouTube"
            >
              <YoutubeIcon />
            </div>
            <div
              className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </div>
            <div
              className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </div>
            <div
              className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedinIcon />
            </div>
            <div
              className="w-9 h-9 rounded-full bg-[#4B5563] flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
              aria-label="X"
            >
              <XIcon />
            </div>
          </div>
        </div>

        <div className="w-full h-[1px] bg-[#4B5563] mt-8"></div>

        <div className="flex flex-col lg:flex-row justify-between items-center mt-6 gap-4 lg:gap-0">
          <span className="font-normal text-[12px] text-[#9CA3AF] text-center lg:text-left">
            © 2026 SABERHUB. Todos los derechos reservados.
          </span>
          <div className="flex flex-wrap justify-center gap-2 text-[12px] text-[#D1D5DB]">
            <a href="#" className="hover:text-white">
              Términos
            </a>{' '}
            <span className="text-[#4B5563]">|</span>
            <a href="#" className="hover:text-white">
              Privacidad
            </a>{' '}
            <span className="text-[#4B5563]">|</span>
            <a href="#" className="hover:text-white">
              Cookies
            </a>{' '}
            <span className="text-[#4B5563]">|</span>
            <a href="#" className="hover:text-white">
              Protección de datos
            </a>{' '}
            <span className="text-[#4B5563]">|</span>
            <a href="#" className="hover:text-white">
              Marcas
            </a>{' '}
            <span className="text-[#4B5563]">|</span>
            <a href="#" className="hover:text-white">
              Accesibilidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
