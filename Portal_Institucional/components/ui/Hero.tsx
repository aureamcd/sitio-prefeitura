"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Vote, Eye, BarChart3, ArrowRight } from "lucide-react";

type Slide = {
  id: string;
  badge?: string;
  title: React.ReactNode;
  description: string;
  buttonText: string;
  buttonHref: string;
  isExternal?: boolean;
  buttonIcon?: React.ReactNode;
};

const slides: Slide[] = [
  {
    id: "orcamento-2027",
    badge: "🚨 CONSULTA PÚBLICA ABERTA",
    title: (
      <>
        Orçamento <span className="text-[#FFD84D]">Participativo</span>,<br />
        exercício <span className="text-[#FFD84D]">2027</span>.
      </>
    ),
    description:
      "Sua opinião faz a diferença! Participe da elaboração do Orçamento Municipal (LOA 2027) e escolha as prioridades para a cidade.",
    buttonText: "Responder Consulta Pública",
    buttonHref: "/orcamento-participativo-2027",
    isExternal: false,
    buttonIcon: <Vote size={18} />,
  },
  {
    id: "institucional",
    badge: "MUNICÍPIO DE PADRE MARCOS - PI",
    title: (
      <>
        Trabalhando <span className="text-[#FFD84D]">juntos</span>,<br />
        desenvolvendo <span className="text-[#FFD84D]">mais</span>.
      </>
    ),
    description:
      "Construindo uma cidade melhor para todos, com transparência, responsabilidade e compromisso com a população.",
    buttonText: "Acessar Portal da Transparência",
    buttonHref: "https://transparencia.padremarcos.pi.gov.br/",
    isExternal: true,
    buttonIcon: <Eye size={18} />,
  },
  {
    id: "pesquisa-satisfacao",
    badge: "📊 PARTICIPAÇÃO CIDADÃ",
    title: (
      <>
        Pesquisa de <span className="text-[#FFD84D]">Satisfação</span>,<br />
        avalie <span className="text-[#FFD84D]">nossos serviços</span>.
      </>
    ),
    description:
      "Avalie os serviços do portal e o atendimento municipal. Sua avaliação nos ajuda a melhorar a gestão pública continuamente.",
    buttonText: "Avaliar Serviços Públicos",
    buttonHref: "https://transparencia.padremarcos.pi.gov.br/transparencia/pesquisa-satisfacao",
    isExternal: true,
    buttonIcon: <BarChart3 size={18} />,
  },
];

export default function DashboardResumo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4000); // troca a cada 4 segundos
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const currentSlide = slides[currentIndex];

  return (
    <section
      className="relative overflow-hidden group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 🖼️ IMAGEM DE FUNDO DA CAPA */}
      <Image
        src="/padremarcoscapa1.PNG"
        alt="Cidade de Padre Marcos"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* 🔵 OVERLAY AZUL ORIGINAL */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-800/90 via-blue-600/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-blue-700/40 md:hidden z-10" />

      {/* 📝 CONTEÚDO (À ESQUERDA - MESMO LAYOUT ORIGINAL) */}
      <div className="relative z-20 max-w-7xl mx-auto h-[280px] sm:h-[350px] md:h-[500px] flex items-center justify-start px-5 sm:px-16">
        <div className="max-w-xl text-white text-left flex flex-col items-start transition-all duration-300">
          
          {/* Badge Chamativo */}
          {currentSlide.badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2 sm:mb-3 border border-yellow-400/30">
              {currentSlide.badge}
            </div>
          )}

          {/* Título Principal no Estilo Original */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-normal drop-shadow-lg">
            {currentSlide.title}
          </h1>

          {/* Descrição no Estilo Original */}
          <p className="mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-gray-50 font-medium leading-relaxed drop-shadow-md max-w-md">
            {currentSlide.description}
          </p>

          {/* BOTÃO E INDICADORES NO ESTILO ORIGINAL */}
          <div className="mt-4 sm:mt-5 md:mt-8 flex flex-col items-start gap-4">
            {currentSlide.isExternal ? (
              <a
                href={currentSlide.buttonHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#FFD84D] hover:bg-[#e6c245] text-blue-900 font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                {currentSlide.buttonIcon}
                {currentSlide.buttonText}
              </a>
            ) : (
              <Link
                href={currentSlide.buttonHref}
                className="inline-flex items-center justify-center gap-2 bg-[#FFD84D] hover:bg-[#e6c245] text-blue-900 font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                {currentSlide.buttonIcon}
                {currentSlide.buttonText}
                <ArrowRight size={18} />
              </Link>
            )}

            {/* LINHA DECORATIVA E INDICADORES DO SLIDER */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex justify-start gap-2">
                <div className="w-10 h-[3px] bg-[#FFD84D] rounded-full" />
                <div className="w-6 h-[3px] bg-red-500 rounded-full" />
                <div className="w-16 h-[3px] bg-white rounded-full" />
              </div>

              {/* Bolinhas dos Slides */}
              <div className="flex items-center gap-2 ml-4">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                        ? "w-8 bg-[#FFD84D]"
                        : "w-2.5 bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={`Ir para slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 🧭 SETAS NAVEGAÇÃO LATERAL (SUAVES) */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all opacity-0 group-hover:opacity-100"
        aria-label="Próximo slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* 🎯 CÍRCULOS DECORATIVOS DA CAPA ORIGINAL */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full border border-white/20 z-20" />
      <div className="pointer-events-none absolute -bottom-12 -right-10 w-52 h-52 rounded-full border border-white/20 z-20" />
      <div className="pointer-events-none absolute top-10 right-24 w-32 h-32 rounded-full border border-white/20 z-20" />

      {/* 🌊 ONDA SUPERIOR DA SEÇÃO (ORIGINAL) */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180 z-30 -mb-[1px]">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-[20px] sm:h-[15px] md:h-[60px] fill-gray-100"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V120c159.27-23.26,243.71-45.42,321.39-63.56Z"></path>
        </svg>
      </div>

    </section>
  );
}