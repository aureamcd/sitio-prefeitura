/**
 * ========================================================
 * COMPONENTE: DashboardStats
 * ========================================================
 *
 * Dashboard estatístico reutilizável com:
 * - Filtro de período (de / até)
 * - Cards de métricas
 * - Gráfico de barras horizontal (CSS puro)
 * - Exportação CSV e PDF
 * - Auto-refresh a cada 60 segundos
 * - Loading skeleton
 *
 * @module components/institucional/DashboardStats
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, RefreshCw, AlertCircle, Filter, Download, FileText } from "lucide-react";

interface DashboardStatsProps {
  apiUrl: string;
  title: string;
  canal: "esic" | "ouvidoria";
}

interface StatsData {
  total: number;
  recebidos: number;
  em_analise: number;
  respondidos: number;
  indeferidos: number;
  prorrogados: number;
  tempo_medio_resposta_dias: number;
  pf?: number;
  pj?: number;
}

const STAT_CARDS = [
  { key: "total", label: "Total", color: "bg-gray-100 text-gray-800", border: "border-gray-200" },
  { key: "recebidos", label: "Recebidos", color: "bg-blue-50 text-blue-700", border: "border-blue-200" },
  { key: "em_analise", label: "Em Análise", color: "bg-amber-50 text-amber-700", border: "border-amber-200" },
  { key: "respondidos", label: "Respondidos", color: "bg-green-50 text-green-700", border: "border-green-200" },
  { key: "indeferidos", label: "Indeferidos", color: "bg-red-50 text-red-700", border: "border-red-200" },
  { key: "prorrogados", label: "Prorrogados", color: "bg-purple-50 text-purple-700", border: "border-purple-200" },
];

const BAR_COLORS: Record<string, string> = {
  recebidos: "bg-blue-500",
  em_analise: "bg-amber-500",
  respondidos: "bg-green-500",
  indeferidos: "bg-red-500",
  prorrogados: "bg-purple-500",
};

function toDateInput(iso: string) {
  return iso.split("T")[0];
}

function fmtDateBR(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export default function DashboardStats({ apiUrl, title, canal }: DashboardStatsProps) {
  const hoje = toDateInput(new Date().toISOString());
  const inicioAno = `${new Date().getFullYear()}-01-01`;

  const [de, setDe] = useState(inicioAno);
  const [ate, setAte] = useState(hoje);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const buildUrl = useCallback((dataInicio: string, dataFim: string) => {
    const url = new URL(apiUrl, window.location.origin);
    if (dataInicio) url.searchParams.set("de", dataInicio);
    if (dataFim) url.searchParams.set("ate", dataFim);
    return url.toString();
  }, [apiUrl]);

  const fetchStats = useCallback(async (dataInicio = de, dataFim = ate) => {
    setLoading(true);
    try {
      const res = await fetch(buildUrl(dataInicio, dataFim));
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStats(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [buildUrl, de, ate]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiltrar() {
    fetchStats(de, ate);
  }

  function handleExportCSV() {
    if (!stats) return;
    const periodo = `${fmtDateBR(de)} a ${fmtDateBR(ate)}`;
    const rows = [
      ["Métrica", "Valor"],
      ["Período", periodo],
      ["Total de Solicitações", stats.total],
      ["Recebidos", stats.recebidos],
      ["Em Análise", stats.em_analise],
      ["Respondidos", stats.respondidos],
      ["Indeferidos", stats.indeferidos],
      ["Prorrogados", stats.prorrogados],
      ["Tempo Médio de Resposta (dias)", stats.tempo_medio_resposta_dias],
      ...(stats.pf !== undefined ? [["Pessoa Física", stats.pf], ["Pessoa Jurídica", stats.pj ?? 0]] : []),
    ];
    const csv = "\uFEFF" + rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${canal}-stats-${de}-${ate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportPDF() {
    window.print();
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-100 rounded-xl w-full mb-2" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertCircle size={32} className="mx-auto mb-2" />
        <p className="text-sm font-medium">Falha ao carregar estatísticas</p>
        <button
          onClick={() => fetchStats()}
          className="mt-2 text-xs text-[#173572] font-bold hover:underline flex items-center gap-1 mx-auto"
        >
          <RefreshCw size={12} />
          Tentar novamente
        </button>
      </div>
    );
  }

  const maxValue = Math.max(
    stats.recebidos,
    stats.em_analise,
    stats.respondidos,
    stats.indeferidos,
    stats.prorrogados,
    1
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#173572]" />
          <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        </div>
        <button
          onClick={() => fetchStats()}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition"
          title="Atualizar"
        >
          <RefreshCw size={14} className="text-gray-400" />
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5 print:hidden">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">
          Filtrar por Período
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">De</label>
            <input
              type="date"
              value={de}
              onChange={e => setDe(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#173572]/20 focus:border-[#173572] transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Até</label>
            <input
              type="date"
              value={ate}
              onChange={e => setAte(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#173572]/20 focus:border-[#173572] transition"
            />
          </div>
          <button
            onClick={handleFiltrar}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#173572] text-white text-sm font-bold rounded-lg hover:bg-[#0f2847] transition"
          >
            <Filter size={14} />
            Filtrar
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-[#173572] hover:text-[#173572] transition"
            >
              <Download size={13} />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-[#173572] hover:text-[#173572] transition"
            >
              <FileText size={13} />
              PDF
            </button>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Exibindo dados de <strong className="text-gray-600">{fmtDateBR(de)}</strong> a <strong className="text-gray-600">{fmtDateBR(ate)}</strong>
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`${card.color} border ${card.border} rounded-xl p-3 text-center`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
              {card.label}
            </p>
            <p className="text-xl font-black">
              {stats[card.key as keyof StatsData]}
            </p>
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-1 ${stats.pf !== undefined ? "lg:grid-cols-4 md:grid-cols-2" : "md:grid-cols-3"} gap-4`}>
        <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Distribuição por Status
          </p>
          <div className="space-y-2.5">
            {["recebidos", "em_analise", "respondidos", "indeferidos", "prorrogados"].map(
              (key) => {
                const value = stats[key as keyof StatsData] as number;
                const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
                const label = STAT_CARDS.find((c) => c.key === key)?.label || key;

                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-500 w-24 text-right shrink-0">
                      {label}
                    </span>
                    <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${BAR_COLORS[key]} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-gray-600 w-8">
                      {value}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {stats.pf !== undefined && stats.pj !== undefined && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col justify-center text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              Perfil do Solicitante
            </p>
            <div className="flex items-center justify-center gap-8 mb-4">
              <div>
                <p className="text-3xl font-black text-blue-600">{stats.pf}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Física</p>
              </div>
              <div>
                <p className="text-3xl font-black text-purple-600">{stats.pj}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Jurídica</p>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full flex overflow-hidden mt-auto">
              <div
                className="h-full bg-blue-500 transition-all duration-700"
                style={{ width: `${(stats.pf / (stats.pf + stats.pj || 1)) * 100}%` }}
                title="Pessoa Física"
              />
              <div
                className="h-full bg-purple-500 transition-all duration-700"
                style={{ width: `${(stats.pj / (stats.pf + stats.pj || 1)) * 100}%` }}
                title="Pessoa Jurídica"
              />
            </div>
          </div>
        )}

        <div className="bg-[#173572] text-white rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-2">
            Tempo Médio
          </p>
          <p className="text-4xl font-black mb-1">
            {stats.tempo_medio_resposta_dias}
          </p>
          <p className="text-blue-200 text-xs font-medium">
            {stats.tempo_medio_resposta_dias === 1 ? "dia" : "dias"}
          </p>
          <p className="text-blue-300/70 text-[10px] mt-2">
            {canal === "esic" ? "Prazo legal: 20 dias" : "Prazo legal: 30 dias"}
          </p>
        </div>
      </div>
    </div>
  );
}
