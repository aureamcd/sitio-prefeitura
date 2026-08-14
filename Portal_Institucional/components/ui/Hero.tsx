import Image from "next/image";

export default function DashboardResumo() {
  return (
    <section className="relative overflow-hidden">

      {/* 🖼️ IMAGEM */}
      <Image
        src="/padremarcoscapa1.PNG"
        alt="Cidade de Padre Marcos"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
        
      />

      {/* 🔵 OVERLAY (AZUL À ESQUERDA) */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-800/90 via-blue-600/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-blue-700/40 md:hidden z-10" />

      {/* 📝 CONTEÚDO (À ESQUERDA) */}
      <div className="relative z-20 max-w-7xl mx-auto h-[280px] sm:h-[350px] md:h-[500px] flex items-center justify-start px-5 sm:px-16">
        <div className="max-w-xl text-white text-left flex flex-col items-start">

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-normal drop-shadow-lg">
            Trabalhando{" "}
            <span className="text-[#FFD84D]">juntos</span>,<br />
            desenvolvendo{" "}
            <span className="text-[#FFD84D]">mais</span>.
          </h1>

          <p className="mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-gray-50 font-medium leading-relaxed drop-shadow-md max-w-md">
            Construindo uma cidade melhor para todos, com transparência,
            responsabilidade e compromisso com a população.
          </p>

          {/* BOTÃO E LINHA DECORATIVA */}
          <div className="mt-5 md:mt-8 flex flex-col items-start gap-5">
            <a 
              href="https://transparencia.padremarcos.pi.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#FFD84D] hover:bg-[#e6c245] text-blue-900 font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
            >
             Acessar Portal da Transparência
            </a>

            {/* LINHA DECORATIVA */}
            <div className="flex justify-start gap-2">
              <div className="w-10 h-[3px] bg-[#FFD84D] rounded-full" />
              <div className="w-6 h-[3px] bg-red-500 rounded-full" />
              <div className="w-16 h-[3px] bg-white rounded-full" />
            </div>
          </div>

        </div>
      </div>

      {/* 🎯 CÍRCULOS */}
      <div className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full border border-white/20 z-20" />
      <div className="pointer-events-none absolute -bottom-12 -right-10 w-52 h-52 rounded-full border border-white/20 z-20" />
      <div className="pointer-events-none absolute top-10 right-24 w-32 h-32 rounded-full border border-white/20 z-20" />

      {/* 🌊 ONDA */}
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