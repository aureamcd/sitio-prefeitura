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
    id: "orcamento-2027",
    badge: "🚨 CONSULTA PÚBLICA ABERTA",
    title: (
      <>
        Orçamento <span className="text-[#FFD84D]">Participativo 2027</span>
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
    id: "pesquisa-satisfacao",
    badge: "📊 PARTICIPAÇÃO CIDADÃ",
    title: (
      <>
        Pesquisa de <span className="text-[#FFD84D]">Satisfação</span>
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
      {/* 🖼️ IMAGEM DE FUNDO */}
      <Image
        src="/padremarcoscapa1.PNG"
        alt="Cidade de Padre Marcos"
        fill
        priority
        className="object-cover object-center transition-transform duration-1000 transform scale-105"
        sizes="100vw"
      />

      {/* 🔵 OVERLAY COM GRADIENTE */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/85 to-blue-800/40 z-10" />
      <div className="absolute inset-0 bg-blue-900/60 md:hidden z-10" />

      {/* 📝 CONTEÚDO DO SLIDE */}
      <div className="relative z-20 max-w-7xl mx-auto h-[320px] sm:h-[380px] md:h-[500px] flex items-center justify-start px-5 sm:px-16">
        <div className="max-w-xl text-white text-left flex flex-col items-start transition-all duration-500 ease-in-out">
          
          {/* Badge Chamativo */}
          {currentSlide.badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-black uppercase tracking-wider mb-3 border border-yellow-400/30 backdrop-blur-xs">
              {currentSlide.badge}
            </div>
          )}

          {/* Título Principal */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-normal drop-shadow-lg min-h-[70px] sm:min-h-[90px] md:min-h-[120px] flex items-center">
            {currentSlide.title}
          </h1>

          {/* Descrição */}
          <p className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-base md:text-lg text-gray-100 font-medium leading-relaxed drop-shadow-md max-w-md min-h-[48px] sm:min-h-[60px]">
            {currentSlide.description}
          </p>

          {/* BOTÃO E LINHA DECORATIVA */}
          <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col items-start gap-4 sm:gap-5">
            {currentSlide.isExternal ? (
              <a
                href={currentSlide.buttonHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-[#FFD84D] hover:bg-[#e6c245] text-blue-950 font-extrabold py-2.5 sm:py-3.5 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl text-xs sm:text-base border-2 border-yellow-300"
              >
                {currentSlide.buttonIcon}
                {currentSlide.buttonText}
              </a>
            ) : (
              <Link
                href={currentSlide.buttonHref}
                className="inline-flex items-center justify-center gap-2.5 bg-[#FFD84D] hover:bg-[#e6c245] text-blue-950 font-extrabold py-2.5 sm:py-3.5 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl text-xs sm:text-base border-2 border-yellow-300"
              >
                {currentSlide.buttonIcon}
                {currentSlide.buttonText}
                <ArrowRight size={18} />
              </Link>
            )}

            {/* BARRA DE INDICADORES (DOTS) */}
            <div className="flex items-center gap-2.5 mt-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx
                      ? "w-10 bg-[#FFD84D]"
                      : "w-2.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 🧭 BOTÕES ANTERIOR E PRÓXIMO */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/20 hover:bg-black/50 text-white transition-all backdrop-blur-xs opacity-70 hover:opacity-100"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/20 hover:bg-black/50 text-white transition-all backdrop-blur-xs opacity-70 hover:opacity-100"
        aria-label="Próximo slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* 🎯 CÍRCULOS DECORATIVOS */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full border border-white/10 z-20" />
      <div className="pointer-events-none absolute -bottom-12 -right-10 w-52 h-52 rounded-full border border-white/10 z-20" />
      <div className="pointer-events-none absolute top-10 right-24 w-32 h-32 rounded-full border border-white/10 z-20" />

      {/* 🌊 ONDA INFERIOR */}
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