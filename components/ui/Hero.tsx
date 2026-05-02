export default function DashboardResumo() {
  return (
    <section className="relative overflow-hidden">

      {/* 🖼️ IMAGEM */}
      <img
        src="/padremarcos.png"
        alt="Cidade de Padre Marcos"
        className="absolute inset-0 w-full h-[100px] md:h-[500px] object-cover object-right md:object-center"
      />

      {/* 🔵 OVERLAY (DA DIREITA PRA ESQUERDA, MAIS INSTITUCIONAL) */}
      <div className="absolute inset-0 bg-gradient-to-l from-[#0f2c5c]/95 via-[#173572]/85 to-transparent z-10" />

      {/* 📝 CONTEÚDO (AGORA À DIREITA) */}
      <div className="relative z-20 max-w-7xl mx-auto h-[220px] md:h-[500px] flex items-center justify-end px-6">
        <div className="max-w-xl text-white text-right">

          <h1 className="text-2xl md:text-5xl font-semibold leading-tight tracking-tight">
            Trabalhando{" "}
            <span className="text-[#FFD84D] font-bold">juntos</span>,<br />
            desenvolvendo{" "}
            <span className="text-[#FFD84D] font-bold">mais</span>.
          </h1>

          <p className="mt-3 md:mt-4 text-xs md:text-base text-gray-200 leading-relaxed">
            Construindo uma cidade melhor para todos, com transparência,
            responsabilidade e compromisso com a população.
          </p>

          {/* LINHA DECORATIVA */}
          <div className="mt-3 md:mt-4 flex justify-end gap-2">
            <div className="w-10 h-[3px] bg-[#FFD84D] rounded-full" />
            <div className="w-6 h-[3px] bg-red-500 rounded-full" />
            <div className="w-16 h-[3px] bg-blue-600 rounded-full" />
          </div>

        </div>
      </div>

      {/* 🎯 CÍRCULOS */}
      <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full border border-white/20 z-20" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 w-52 h-52 rounded-full border border-white/20 z-20" />
      <div className="pointer-events-none absolute top-10 left-24 w-32 h-32 rounded-full border border-white/20 z-20" />

      {/* 🌊 ONDA */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180 z-30">
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