import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function DashboardResumo() {
  return (
    <section className="relative overflow-hidden bg-[#0B3D91] py-14 md:py-20 text-center">

      <div className="absolute top-0 left-0 right-0 h-[3px] flex">
        <div className="flex-1 bg-[#F7C325]" />
        <div className="flex-1 bg-[#E53935]" />
        <div className="flex-1 bg-[#0052CC]" />
      </div>
     

      {/* Círculos decorativos */}
      <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 w-52 h-52 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute top-10 left-24 w-32 h-32 rounded-full border border-white/10" />

      <div className="relative z-10 w-[90%] max-w-4xl mx-auto">

        {/* Badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-white/90 uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          Transparência Pública
        </span>

        {/* Título */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
          Portal da{" "}
          <span className="text-[#ffdf00]">Transparência</span>
        </h2>

        {/* Subtítulo */}
        <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed mb-10">
          Acompanhe receitas, despesas, contratos e demais informações
          do município de forma clara, ágil e segura.
        </p>

        {/* Chips de acesso rápido */}
        <p className="text-[10px] tracking-[0.15em] text-white/30 uppercase mb-3">
          Acesso Rápido
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { label: "Informações Institucionais", href: "#secao-0" },
            { label: "Execução Orçamentária e Financeira", href: "#secao-1" },
            { label: "Compras, Contratos e Convênios", href: "#secao-2" },
            { label: "Obras e Infraestrutura", href: "#secao-3" },
            { label: "Gestão de Pessoas e Benefícios", href: "#secao-4" },
            { label: "Planejamento e Prestação de Contas", href: "#secao-5" },
            { label: "Serviços ao Cidadão", href: "#secao-6" },
            { label: "Controle Social", href: "#secao-7" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs text-white/70 hover:bg-yellow-400/15 hover:border-yellow-400/40 hover:text-yellow-200 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10 rounded-xl border border-white/10 overflow-hidden bg-white/5">

          <Link href="/S2-Execucao_Orc_e_Fin/receitas" className="group p-4 bg-white/[0.03] hover:bg-white/10 transition-colors text-center">
            <p className="text-[10px] tracking-wide text-white/60 uppercase mb-1">Receita Total (2025)</p>
            <p className="text-xl font-semibold text-white mb-1">R$ 8,1 mi</p>
            <p className="text-[11px] text-emerald-400 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> +12,5% vs mês ant.
            </p>
          </Link>

          <Link href="/S2-Execucao_Orc_e_Fin/despesas" className="group p-4 bg-white/[0.03] hover:bg-white/10 transition-colors text-center">
            <p className="text-[10px] tracking-wide text-white/60 uppercase mb-1">Despesa Total (2025)</p>
            <p className="text-xl font-semibold text-white mb-1">R$ 7,4 mi</p>
            <p className="text-[11px] text-emerald-400 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> +8,2% vs mês ant.
            </p>
          </Link>

          <div className="p-4 bg-white/[0.03] text-center">
            <p className="text-[10px] tracking-wide text-white/60 uppercase mb-1">Servidores Ativos</p>
            <p className="text-xl font-semibold text-white mb-1">342</p>
            <p className="text-[11px] text-emerald-400 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> +5 vs mês ant.
            </p>
          </div>

          <div className="p-4 bg-white/[0.03] text-center">
            <p className="text-[10px] tracking-wide text-white/60 uppercase mb-1">Contratos Vigentes</p>
            <p className="text-xl font-semibold text-white mb-1">47</p>
            <p className="text-[11px] text-red-400 flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" /> -3 vs mês ant.
            </p>
          </div>

        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180">
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