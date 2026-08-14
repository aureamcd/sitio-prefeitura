'use client';

import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

function formatMillions(value: number) {
  if (!value) return "R$ 0,0 mi";
  return `R$ ${(value / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
}

export default function DashboardResumo() {
  const [data, setData] = useState({
    receita: 0,
    despesa: 0,
    servidores: 0,
    contratos: 0
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      const supabase = createBrowserClient();
      const currentYear = new Date().getFullYear();

      try {
        // 1. Receitas (Apenas contas-raiz para evitar duplicar subníveis hierárquicos)
        const { data: recData } = await supabase
          .schema('transparencia')
          .from('receitas')
          .select('arrecadado_total, codigo_contabil, nivel')
          .eq('ano', currentYear);
        
        const totalReceita = (recData || []).reduce((s, r) => {
          const isRoot = r.nivel === 1 || ['1000.00.0.0.00', '2000.00.0.0.00', '7000.00.0.0.00', '9000.00.0.0.00'].includes(r.codigo_contabil);
          if (!isRoot) return s;
          const isDeducao = r.codigo_contabil?.startsWith('9');
          const v = Number(r.arrecadado_total) || 0;
          return s + (isDeducao ? -Math.abs(v) : v);
        }, 0);

        // 2. Despesas
        const { data: despData } = await supabase
          .schema('transparencia')
          .from('despesas')
          .select('pago')
          .eq('ano', currentYear);
        
        const totalDespesa = (despData || []).reduce((acc, curr) => acc + (Number(curr.pago) || 0), 0);

        // 3. Servidores
        const { count: servCount } = await supabase
          .schema('transparencia')
          .from('servidores')
          .select('*', { count: 'exact', head: true })
          .eq('ativo', true);

        // 4. Contratos
        const { count: contCount } = await supabase
          .schema('transparencia')
          .from('contratos')
          .select('*', { count: 'exact', head: true })
          .eq('ano', currentYear);

        if (!cancelled) {
          setData({
            receita: totalReceita,
            despesa: totalDespesa,
            servidores: servCount || 0,
            contratos: contCount || 0
          });
        }
      } catch (e) {
        console.error("Dashboard fetch error", e);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B3D91] via-[#173572] to-[#041E57] py-14 md:py-20 text-center">
      {/* Círculos decorativos premium */}
      <div className="pointer-events-none absolute -top-24 -right-16 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute top-10 left-24 w-40 h-40 rounded-full border border-white/5 shadow-[0_0_50px_rgba(255,255,255,0.05)]" />

      <div className="relative z-10 w-[90%] max-w-4xl mx-auto flex flex-col items-center">

        {/* Exercício em destaque no topo (removido exercicio 2026) */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-[11px] sm:text-xs font-bold tracking-[0.2em] text-white/95 uppercase mb-6 shadow-sm backdrop-blur-sm transition-transform hover:scale-105 cursor-default">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full w-2 h-2 bg-[#ffdf00]"></span>
          </span>
          Transparência Pública
        </span>

        {/* Título */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-5 drop-shadow-md">
          Portal da{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffdf00] to-[#f7b733]">Transparência</span>
        </h2>

        {/* Subtítulo */}
        <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
          Acompanhe receitas, despesas, contratos e demais informações
          do município de forma clara, ágil e segura.
        </p>

        {/* Chips de acesso rápido */}
        <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-4 font-semibold">
          Acesso Rápido
        </p>
        <div className="flex flex-wrap justify-center gap-2.5 mb-14">
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
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs sm:text-sm font-medium text-white/90 hover:bg-white/20 hover:border-white/40 hover:text-white hover:scale-105 hover:shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 backdrop-blur-md"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 w-full divide-x divide-white/10 rounded-2xl border border-white/20 overflow-hidden bg-white/5 backdrop-blur-md shadow-2xl">

          <Link href="/S2-Execucao_Orc_e_Fin/receitas" className="group p-5 bg-transparent hover:bg-white/10 transition-all duration-300 text-center flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs tracking-wider text-white/70 uppercase mb-2 font-semibold">Receita Total</p>
            <p className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-[#ffdf00] transition-colors">{formatMillions(data.receita)}</p>
          </Link>

          <Link href="/S2-Execucao_Orc_e_Fin/despesas" className="group p-5 bg-transparent hover:bg-white/10 transition-all duration-300 text-center flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs tracking-wider text-white/70 uppercase mb-2 font-semibold">Despesa Total</p>
            <p className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-[#ffdf00] transition-colors">{formatMillions(data.despesa)}</p>
          </Link>

          <div className="group p-5 bg-transparent hover:bg-white/10 transition-all duration-300 text-center flex flex-col justify-center cursor-default">
            <p className="text-[10px] sm:text-xs tracking-wider text-white/70 uppercase mb-2 font-semibold">Servidores Ativos</p>
            <p className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-[#ffdf00] transition-colors">{data.servidores}</p>
          </div>

          <div className="group p-5 bg-transparent hover:bg-white/10 transition-all duration-300 text-center flex flex-col justify-center cursor-default">
            <p className="text-[10px] sm:text-xs tracking-wider text-white/70 uppercase mb-2 font-semibold">Contratos Vigentes</p>
            <p className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-[#ffdf00] transition-colors">{data.contratos}</p>
          </div>

        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180 pointer-events-none">
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