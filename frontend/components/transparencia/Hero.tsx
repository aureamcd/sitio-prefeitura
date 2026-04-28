export default function DashboardResumo() {
  return (
    <section className="relative overflow-hidden">

      {/* IMAGEM DE FUNDO */}
      <img
        src="/hero4.png"
        alt="Cidade de Padre Marcos"
        className="w-full h-auto block"
      />



      {/* CÍRCULOS DECORATIVOS */}
      <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full border border-white/20 z-10" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 w-52 h-52 rounded-full border border-white/20 z-10" />
      <div className="pointer-events-none absolute top-10 left-24 w-32 h-32 rounded-full border border-white/20 z-10" />

      {/* ONDA */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180 z-20">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-[60px] fill-gray-100"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V120c159.27-23.26,243.71-45.42,321.39-63.56Z"></path>
        </svg>
      </div>

    </section>
  );
}