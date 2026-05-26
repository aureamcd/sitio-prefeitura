'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { MESES, TIPOS_EMPENHO, formatBRL, formatDateISO } from '@/lib/despesas/types';
import type { DespesaRow } from '@/lib/despesas/types';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { Search, ChevronDown } from 'lucide-react';

// -------------------------------------------------------------------
// Helper: badge de fase da despesa
// -------------------------------------------------------------------
function FaseBadge({ row }: { row: DespesaRow }) {
  const pago = Number(row.valor_pago) || 0;
  const liquidado = Number(row.valor_liquidado) || 0;
  const empenhado = Number(row.valor_empenhado) || 0;

  if (pago > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">Pago</span>;
  if (liquidado > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">Liquidado</span>;
  if (empenhado > 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">Empenhado</span>;
  return <span className="text-[11px] text-gray-400">—</span>;
}

// -------------------------------------------------------------------
// Helper: badge de tipo de empenho
// -------------------------------------------------------------------
function TipoEmpenhoBadge({ tipo }: { tipo: string | null }) {
  const colors: Record<string, string> = {
    Ordinário: 'bg-purple-100 text-purple-800',
    Estimativo: 'bg-indigo-100 text-indigo-800',
    Global: 'bg-cyan-100 text-cyan-800',
  };
  const cls = colors[tipo ?? ''] || 'bg-gray-100 text-gray-600';
  if (!tipo) return <span className="text-[11px] text-gray-400">—</span>;
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{tipo}</span>;
}

// -------------------------------------------------------------------
// Página principal
// -------------------------------------------------------------------
export default function DespesasPage() {
  const today = useTodayDate();
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('despesas');

  // ── Filtros base ──
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '' });

  // ── Filtros extras ──
  // ── Filtros extras ──
  const [orgaoFilter, setOrgaoFilter] = useState('');
  const [naturezaFilter, setNaturezaFilter] = useState('');
  const [credorFilter, setCredorFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [funcaoFilter, setFuncaoFilter] = useState('');
  const [programaFilter, setProgramaFilter] = useState('');
  const [fonteFilter, setFonteFilter] = useState('');

  // ── Opções para dropdowns ──
  const [orgaos, setOrgaos] = useState<string[]>([]);
  const [naturezas, setNaturezas] = useState<string[]>([]);
  const [funcoes, setFuncoes] = useState<string[]>([]);
  const [programas, setProgramas] = useState<string[]>([]);
  const [fontes, setFontes] = useState<string[]>([]);

  // ── Dados ──
  const [data, setData] = useState<DespesaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // ── Buscar opções de filtro ──
  useEffect(() => {
    async function fetchFilterOptions() {
      const buildQuery = (field: string) => {
        let q = supabase
          .schema('transparencia')
          .from('despesas')
          .select(field)
          .not(field, 'is', null)
          .order(field, { ascending: true });
        if (filters.ano) q = q.eq('ano', filters.ano);
        return q as any;
      };

      const [orgRes, natRes, funRes, proRes, fonRes] = await Promise.all([
        buildQuery('orgao_nome'),
        buildQuery('natureza_nome'),
        buildQuery('funcao_nome'),
        buildQuery('programa_nome'),
        buildQuery('fonte_nome'),
      ]);

      if (!orgRes.error && orgRes.data) setOrgaos(Array.from(new Set((orgRes.data as any[]).map(r => String(r.orgao_nome)))).sort());
      if (!natRes.error && natRes.data) setNaturezas(Array.from(new Set((natRes.data as any[]).map(r => String(r.natureza_nome)))).sort());
      if (!funRes.error && funRes.data) setFuncoes(Array.from(new Set((funRes.data as any[]).map(r => String(r.funcao_nome)))).sort());
      if (!proRes.error && proRes.data) setProgramas(Array.from(new Set((proRes.data as any[]).map(r => String(r.programa_nome)))).sort());
      if (!fonRes.error && fonRes.data) setFontes(Array.from(new Set((fonRes.data as any[]).map(r => String(r.fonte_nome)))).sort());
    }
    fetchFilterOptions();
  }, [filters.ano, supabase]);

  // ── Buscar dados ──
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      let query = supabase.schema('transparencia').from('despesas').select('*');

      // Filtros base
      if (filters.ano) query = query.eq('ano', filters.ano);
      if (filters.mes) {
        query = query.ilike('data_empenho', `${filters.ano || '2026'}-${filters.mes}%`);
      }
      if (filters.busca) {
        query = query.or(
          `fornecedor_nome.ilike.%${filters.busca}%` +
          `,numero_empenho.ilike.%${filters.busca}%` +
          `,natureza_nome.ilike.%${filters.busca}%` +
          `,processo.ilike.%${filters.busca}%` +
          `,pkemp.ilike.%${filters.busca}%` +
          `,codigo.ilike.%${filters.busca}%` +
          `,programa_nome.ilike.%${filters.busca}%` +
          `,orgao_nome.ilike.%${filters.busca}%` +
          `,funcao_nome.ilike.%${filters.busca}%`,
        );
      }

      // Filtros extras
      if (orgaoFilter) query = query.eq('orgao_nome', orgaoFilter);
      if (naturezaFilter) query = query.eq('natureza_nome', naturezaFilter);
      if (credorFilter) {
        query = query.or(
          `fornecedor_nome.ilike.%${credorFilter}%,fornecedor_cpf_cnpj.ilike.%${credorFilter}%`,
        );
      }
      if (tipoFilter) query = query.eq('tipo_empenho', tipoFilter);
      if (funcaoFilter) query = query.eq('funcao_nome', funcaoFilter);
      if (programaFilter) query = query.eq('programa_nome', programaFilter);
      if (fonteFilter) query = query.eq('fonte_nome', fonteFilter);

      const { data: result, error: err } = await query
        .order('data_empenho', { ascending: false })
        .limit(1000);

      if (cancelled) return;

      if (!err && result) {
        setData(result as DespesaRow[]);
      } else {
        console.error('Erro ao buscar despesas:', err);
        setError(err?.message || 'Erro ao carregar despesas.');
        setData([]);
      }
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.ano, filters.mes, filters.busca, credorFilter, tipoFilter, funcaoFilter, programaFilter, fonteFilter, supabase]);

  // ── Handlers ──
  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
    setOrgaoFilter('');
    setNaturezaFilter('');
    setCredorFilter('');
    setTipoFilter('');
    setFuncaoFilter('');
    setProgramaFilter('');
    setFonteFilter('');
  }, []);

  // ── Derived state ──
  const hasActiveFilters = !!(
    filters.ano || filters.mes || filters.busca ||
    orgaoFilter || naturezaFilter || credorFilter ||
    tipoFilter || funcaoFilter || programaFilter || fonteFilter
  );
  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${orgaoFilter}-${naturezaFilter}-${credorFilter}-${tipoFilter}-${funcaoFilter}-${programaFilter}-${fonteFilter}`;

  const totalDotacaoAtualizada = useMemo(
    () => data.reduce((s, r) => s + (Number(r.dotacao_atualizada) || 0), 0), [data],
  );
  const totalEmpenhado = useMemo(
    () => data.reduce((s, r) => s + (Number(r.valor_empenhado) || 0), 0), [data],
  );
  const totalLiquidado = useMemo(
    () => data.reduce((s, r) => s + (Number(r.valor_liquidado) || 0), 0), [data],
  );
  const totalPago = useMemo(
    () => data.reduce((s, r) => s + (Number(r.valor_pago) || 0), 0), [data],
  );

  // Totais por órgão
  const totaisPorOrgao = useMemo(() => {
    const map = new Map<string, { dotacao: number; empenhado: number; liquidado: number; pago: number }>();
    data.forEach(r => {
      const orgao = r.orgao_nome || 'Sem órgão';
      const curr = map.get(orgao) || { dotacao: 0, empenhado: 0, liquidado: 0, pago: 0 };
      curr.dotacao += Number(r.dotacao_atualizada) || 0;
      curr.empenhado += Number(r.valor_empenhado) || 0;
      curr.liquidado += Number(r.valor_liquidado) || 0;
      curr.pago += Number(r.valor_pago) || 0;
      map.set(orgao, curr);
    });
    return Array.from(map.entries())
      .map(([orgao, vals]) => ({ orgao, ...vals }))
      .sort((a, b) => b.empenhado - a.empenhado);
  }, [data]);

  // ── Colunas da tabela ──
  const columns = [
    {
      header: 'Fase',
      accessor: 'valor_pago',
      render: (_val: number, row: DespesaRow) => <FaseBadge row={row} />,
    },
    {
      header: 'Tipo Emp.',
      accessor: 'tipo_empenho',
      render: (val: string) => <TipoEmpenhoBadge tipo={val} />,
    },
    {
      header: 'Nº Empenho',
      accessor: 'numero_empenho',
      render: (val: string) => (
        <span className="font-mono text-xs text-gray-800">{val || '-'}</span>
      ),
    },
    {
      header: 'Data',
      accessor: 'data_empenho',
      render: (val: string) => (
        <span className="text-sm text-gray-600">{formatDateISO(val)}</span>
      ),
    },
    {
      header: 'Credor',
      accessor: 'fornecedor_nome',
      render: (val: string, row: DespesaRow) => (
        <div className="min-w-[180px]">
          <span className="block font-semibold text-gray-900 line-clamp-2" title={val || ''}>
            {val || '-'}
          </span>
          <span className="block text-xs text-gray-500 mt-0.5 font-mono">
            {row.fornecedor_cpf_cnpj || ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Órgão',
      accessor: 'orgao_nome',
      render: (val: string) => (
        <span className="block max-w-[160px] text-sm text-gray-700 line-clamp-2" title={val || ''}>
          {val || '-'}
        </span>
      ),
    },
    {
      header: 'Função',
      accessor: 'funcao_nome',
      render: (val: string) => (
        <span className="block max-w-[140px] text-sm text-gray-600 line-clamp-2" title={val || ''}>
          {val || '-'}
        </span>
      ),
    },
    {
      header: 'Programa',
      accessor: 'programa_nome',
      render: (val: string) => (
        <span className="block max-w-[180px] text-sm text-gray-600 line-clamp-2" title={val || ''}>
          {val || '-'}
        </span>
      ),
    },
    {
      header: 'Natureza',
      accessor: 'natureza_nome',
      render: (val: string) => (
        <span className="block max-w-[180px] text-sm text-gray-700 line-clamp-2" title={val || ''}>
          {val || '-'}
        </span>
      ),
    },
    {
      header: 'Dotação (R$)',
      accessor: 'dotacao_atualizada',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-sm text-gray-800">
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: 'Empenhado (R$)',
      accessor: 'valor_empenhado',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-sm text-gray-800">
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: 'Liquidado (R$)',
      accessor: 'valor_liquidado',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-sm text-gray-800">
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: 'Pago (R$)',
      accessor: 'valor_pago',
      render: (val: number) => (
        <span className={`block text-right tabular-nums font-semibold text-sm ${Number(val) > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: 'Processo',
      accessor: 'processo',
      render: (val: string) => (
        <span className="font-mono text-xs text-gray-500">{val || '-'}</span>
      ),
    },
  ];

  const execPct = totalDotacaoAtualizada > 0 ? (totalEmpenhado / totalDotacaoAtualizada) * 100 : 0;
  const pagoPct = totalEmpenhado > 0 ? (totalPago / totalEmpenhado) * 100 : 0;

  return (
    <ContentPage
      showSearch={false}
      title="Despesas"
      description="Empenhos, liquidações e pagamentos realizados pelo município — consulte por período, credor, órgão, função, programa, fonte de recursos ou natureza da despesa, conforme o PNTP 2026."
      breadcrumb={[
        { label: 'Início', href: '/' },
        { label: 'Execução Orçamentária e Financeira', href: '/S2-Execucao_Orc_e_Fin' },
        { label: 'Despesas' },
      ]}
      lastUpdate={today}
      responsible="Secretaria Municipal de Finanças e Planejamento"
    >
      {/* ── FILTROS ── */}
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClearFilters}
        anosLoading={anosLoading}
      >
        {/* Filtro Órgão */}
        <div className="flex flex-col gap-1 sm:w-56">
          <label className="text-xs font-medium text-gray-600">Órgão / Secretaria</label>
          <div className="relative">
            <select
              value={orgaoFilter}
              onChange={e => setOrgaoFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todos os órgãos</option>
              {orgaos.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Filtro Natureza */}
        <div className="flex flex-col gap-1 sm:w-56">
          <label className="text-xs font-medium text-gray-600">Natureza da Despesa</label>
          <div className="relative">
            <select
              value={naturezaFilter}
              onChange={e => setNaturezaFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todas as naturezas</option>
              {naturezas.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Filtro Credor */}
        <div className="flex flex-col gap-1 flex-1 sm:min-w-[180px]">
          <label className="text-xs font-medium text-gray-600">Credor (nome ou CPF/CNPJ)</label>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={credorFilter}
              onChange={e => setCredorFilter(e.target.value)}
              placeholder="Filtrar por credor..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>
        </div>

        {/* Filtro Tipo de Empenho */}
        <div className="flex flex-col gap-1 sm:w-40">
          <label className="text-xs font-medium text-gray-600">Tipo Empenho</label>
          <div className="relative">
            <select
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todos</option>
              {TIPOS_EMPENHO.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Filtro Função */}
        <div className="flex flex-col gap-1 sm:w-48">
          <label className="text-xs font-medium text-gray-600">Função</label>
          <div className="relative">
            <select
              value={funcaoFilter}
              onChange={e => setFuncaoFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todas</option>
              {funcoes.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Filtro Programa */}
        <div className="flex flex-col gap-1 sm:w-56">
          <label className="text-xs font-medium text-gray-600">Programa</label>
          <div className="relative">
            <select
              value={programaFilter}
              onChange={e => setProgramaFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todos</option>
              {programas.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Filtro Fonte */}
        <div className="flex flex-col gap-1 sm:w-48">
          <label className="text-xs font-medium text-gray-600">Fonte de Recursos</label>
          <div className="relative">
            <select
              value={fonteFilter}
              onChange={e => setFonteFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todas</option>
              {fontes.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </FilterPanel>

      {/* ── DASHBOARD DE INDICADORES ── */}
      <div className="mt-4 mb-4 max-w-4xl mx-auto bg-white border border-rose-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-rose-800 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
              Exercício {filters.ano || 'Geral'}
              {filters.mes ? ` · ${MESES.find(m => m.value === filters.mes)?.label}` : ''}
            </span>
          </div>

          {/* Métricas principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col items-center p-2.5 rounded-xl hover:bg-blue-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-blue-600/70 uppercase tracking-wider mb-1">Dotação Atualizada</p>
              {loading ? <div className="h-7 w-24 bg-gray-100 animate-pulse rounded" /> : (
                <p className="text-lg sm:text-xl font-extrabold text-blue-700 tabular-nums">{formatBRL(totalDotacaoAtualizada)}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Orçamento autorizado</p>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Empenhado</p>
              {loading ? <div className="h-7 w-24 bg-gray-100 animate-pulse rounded" /> : (
                <p className="text-lg sm:text-xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalEmpenhado)}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Reserva orçamentária</p>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl hover:bg-amber-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-amber-600/70 uppercase tracking-wider mb-1">Total Liquidado</p>
              {loading ? <div className="h-7 w-24 bg-amber-100 animate-pulse rounded" /> : (
                <p className="text-lg sm:text-xl font-extrabold text-amber-600 tabular-nums">{formatBRL(totalLiquidado)}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Serviço verificado</p>
            </div>
            <div className="flex flex-col items-center p-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">Total Pago</p>
              {loading ? <div className="h-7 w-24 bg-emerald-100 animate-pulse rounded" /> : (
                <p className="text-lg sm:text-xl font-extrabold text-emerald-600 tabular-nums">{formatBRL(totalPago)}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Efetivamente pago</p>
            </div>
          </div>

          {/* Barra de execução orçamentária */}
          {!loading && totalDotacaoAtualizada > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {/* Execução vs Dotação */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">Execução vs Dotação</span>
                  <span>{execPct.toFixed(1)}% empenhado da dotação</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(execPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>Dotação: {formatBRL(totalDotacaoAtualizada)}</span>
                  <span>Empenhado: {formatBRL(totalEmpenhado)}</span>
                </div>
              </div>

              {/* Fases do gasto */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">Estágios da Despesa</span>
                  <span>{pagoPct.toFixed(1)}% pago do empenhado</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pagoPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>Emp.: {formatBRL(totalEmpenhado)}</span>
                  <span>Liq.: {formatBRL(totalLiquidado)}</span>
                  <span>Pago: {formatBRL(totalPago)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
            <span className="text-xs text-gray-400">
              {data.length} registro{data.length !== 1 ? 's' : ''} encontrado{data.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── TABELA PRINCIPAL ── */}
      <DataTable
        columns={columns}
        data={data}
        title="Empenhos"
        exportable={true}
        loading={loading}
        error={error}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── RESUMO POR ÓRGÃO ── */}
      {!loading && !error && totaisPorOrgao.length > 1 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Despesas por Órgão</h2>
          <p className="text-sm text-gray-500 mb-4">
            Distribuição dos gastos por secretaria, com dotação atualizada e execução orçamentária.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Órgão / Unidade</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Dotação</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Empenhado</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Liquidado</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Pago</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">% Execução</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">% Pago</th>
                </tr>
              </thead>
              <tbody>
                {totaisPorOrgao.map((item, i) => {
                  const execPctItem = item.dotacao > 0 ? (item.empenhado / item.dotacao) * 100 : 0;
                  const pagoPctItem = item.empenhado > 0 ? (item.pago / item.empenhado) * 100 : 0;
                  return (
                    <tr key={item.orgao} className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${i === 0 ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.orgao}
                        {i === 0 && <span className="ml-2 text-[10px] text-blue-600 font-semibold uppercase">Maior</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-blue-700">{formatBRL(item.dotacao)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-800">{formatBRL(item.empenhado)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-600">{formatBRL(item.liquidado)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-semibold">{formatBRL(item.pago)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${execPctItem > 80 ? 'text-indigo-600' : execPctItem > 40 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {execPctItem.toFixed(1)}%
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden inline-block">
                            <div className={`h-full rounded-full ${execPctItem > 80 ? 'bg-indigo-500' : execPctItem > 40 ? 'bg-amber-400' : 'bg-gray-300'}`} style={{ width: `${Math.min(execPctItem, 100)}%` }} />
                          </div>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${pagoPctItem > 80 ? 'text-emerald-600' : pagoPctItem > 40 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {pagoPctItem.toFixed(1)}%
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden inline-block">
                            <div className={`h-full rounded-full ${pagoPctItem > 80 ? 'bg-emerald-500' : pagoPctItem > 40 ? 'bg-amber-400' : 'bg-gray-300'}`} style={{ width: `${Math.min(pagoPctItem, 100)}%` }} />
                          </div>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── NOTA LEGAL ── */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Fundamentação Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          As despesas são publicadas em conformidade com a Lei de Responsabilidade Fiscal (LC nº 101/2000),
          a Lei de Transparência (LC nº 131/2009) e o PNTP 2026 (Programa Nacional de Transparência Pública).
          Os dados incluem dotação orçamentária, classificação funcional, programa, fonte de recursos, natureza da despesa
          e os estágios da execução (empenho, liquidação e pagamento). Podem ser exportados em formato CSV (dados abertos).
        </p>
      </div>
    </ContentPage>
  );
}
