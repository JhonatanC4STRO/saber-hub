'use client';

import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const faqs = [
  {
    question: '¿Qué es SABERHUB y para quién está diseñado?',
    answer: 'SABERHUB es una plataforma de aprendizaje interactiva diseñada en Colombia para democratizar la educación en habilidades digitales críticas como programación, ciberseguridad, redes e inteligencia artificial. Está pensada para cualquier persona interesada en aprender de forma práctica y sin barreras de entrada.',
  },
  {
    question: '¿Realmente los cursos y certificados son 100% gratuitos?',
    answer: 'Sí, absolutamente. En SABERHUB creemos en la educación abierta. Todos los cursos, laboratorios virtuales, materiales de estudio y certificados verificados de finalización son completamente gratis, tanto para los estudiantes como para las instituciones afiliadas.',
  },
  {
    question: '¿Qué tipo de laboratorios prácticos ofrece la plataforma?',
    answer: 'Ofrecemos simuladores virtuales interactivos integrados en el navegador. Podrás resolver desafíos de código real, configuraciones de red interactivas, emulaciones de seguridad y despliegues prácticos de modelos de inteligencia artificial directamente en la nube, sin instalar nada localmente.',
  },
  {
    question: '¿Cómo puede mi institución aliarse con SABERHUB?',
    answer: 'El registro es directo y sin costo alguno. Tu universidad, SENA regional, fundación o entidad gubernamental puede registrarse mediante nuestro botón de instituciones, lo que les permitirá publicar contenidos personalizados, emitir certificados conjuntos y acceder a analíticas avanzadas de progreso de sus estudiantes.',
  },
  {
    question: '¿Necesito un computador potente para realizar las prácticas?',
    answer: 'No. Toda la infraestructura pesada, compiladores y simuladores se ejecutan de manera remota en nuestros servidores. Solo requieres un computador con un navegador moderno y una conexión estable a internet para aprender haciendo.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-white px-6 py-20 lg:px-8 scroll-mt-24">
      <div className="mx-auto max-w-[820px]">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] ring-1 ring-[#BFDBFE] mb-4">
            <MessageCircle size={24} className="text-[#2563EB]" />
          </div>
          <h2 className="text-[32px] font-bold text-[#111827]">Preguntas frecuentes</h2>
          <p className="mt-3 text-base text-[#6B7280]">
            Todo lo que necesitas saber sobre nuestra plataforma interactiva.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-[#111827] hover:bg-[#F3F4F6] transition-colors focus:outline-none"
                >
                  <span className="text-[15px] sm:text-base">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#4B5563] transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#2563EB]' : ''
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-[300px] border-t border-[#E5E7EB]' : 'max-h-0'
                  }`}
                >
                  <p className="p-5 text-sm sm:text-[15px] leading-relaxed text-[#4B5563]">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
