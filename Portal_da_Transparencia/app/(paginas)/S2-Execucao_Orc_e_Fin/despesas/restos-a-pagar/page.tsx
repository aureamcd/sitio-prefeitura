'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { MESES, formatBRL } from '@/lib/despesas/types';
import type { RestosPagarRow } from '@/lib/despesas/types';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { ChevronDown } from 'lucide-react';
import { EMPRESAS } from '@/lib/empresas';

export default function RestosPagarPage() {
  const today = useTodayDate();
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '', entidade: '' });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('restos_pagar', filters.entidade || undefined);

  // Filtros extras
  const [descricaoFilter, setDescricaoFilter] = useState('');
  const [descricoes, setDescricoes] = useState<string[]>([]);

  const [data, setData] = useState<RestosPagarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // ── Buscar opções de filtro ──
  useEffect(() => {
    async function fetchFilterOptions() {
      let q = supabase
        .schema('transparencia')
        .from('restos_pagar')
        .select('descricao')
        .not('descricao', 'is', null)
        .order('descricao', { ascending: true });
      if (filters.ano) q = q.eq('ano', filters.ano);
      const { data: result } = await q;
      if (result) {
        setDescricoes([...new Set(result.map(r => String(r.descricao)))].sort());
      }
    }
    fetchFilterOptions();
  }, [filters.ano, supabase]);

  // ── Buscar dados ──
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      let query = supabase
        .schema('transparencia')
        .from('restos_pagar')
        .select('*');

      if (filters.ano) query = query.eq('ano', filters.ano);
      if (filters.entidade) query = query.eq('empresa', filters.entidade);
      if (filters.busca) {
        query = query.or(
          `descricao.ilike.%${filters.busca}%` +
          `,codigo.ilike.%${filters.busca}%`,
        );
      }
      if (descricaoFilter) query = query.eq('descricao', descricaoFilter);

      const { data: result, error: err } = await query
        .order('codigo', { ascending: true });

      if (cancelled) return;

      if (!err && result) {
        setData(result as RestosPagarRow[]);
      } else {
        console.error("Error fetching restos_pagar:", err);
        setError(err?.message || 'Erro ao carregar restos a pagar.');
        setData([]);
      }
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.ano, filters.entidade, filters.busca, descricaoFilter, supabase]);

  // ── Handlers ──
  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
    setDescricaoFilter('');
  }, []);

  const filterKey = `${filters.ano}-${filters.busca}-${descricaoFilter}-${filters.entidade}`;
  const hasActiveFilters = !!(filters.ano || filters.busca || descricaoFilter);

  const totalEmpenhado = useMemo(
    () => data.reduce((s, r) => s + (Number(r.empenhado) || 0), 0), [data],
  );
  const totalLiquidado = useMemo(
    () => data.reduce((s, r) => s + (Number(r.liquidado) || 0), 0), [data],
  );
  const totalPago = useMemo(
    () => data.reduce((s, r) => s + (Number(r.pago) || 0), 0), [data],
  );

  const pagoPct = totalEmpenhado > 0 ? (totalPago / totalEmpenhado) * 100 : 0;
  const liquidadoPct = totalEmpenhado > 0 ? (totalLiquidado / totalEmpenhado) * 100 : 0;

  // Status badge: processados (liquidados) vs não processados
  function StatusBadge({ row }: { row: RestosPagarRow }) {
    const pago = Number(row.pago) || 0;
    const liquidado = Number(row.liquidado) || 0;

    if (pago > 0) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">Pago</span>;
    }
    if (liquidado > 0) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">Processado</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">Não Processado</span>;
  }

  const columns = [
    {
      header: 'Status',
      accessor: 'pago',
      render: (_val: number, row: RestosPagarRow) => <StatusBadge row={row} />,
    },
    {
      header: 'Entidade',
      accessor: 'empresa_nome',
    },
    {
      header: 'Código',
      accessor: 'codigo',
      render: (val: string) => (
        <span className="font-mono text-xs text-gray-800">{val || '-'}</span>
      ),
    },
    {
      header: 'Descrição',
      accessor: 'descricao',
      render: (val: string) => (
        <span className="block max-w-[350px] text-sm text-gray-700 line-clamp-2" title={val || ''}>
          {val || '-'}
        </span>
      ),
    },
    {
      header: 'Empenhado (R$)',
      accessor: 'empenhado',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-sm text-gray-800">
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: 'Liquidado (R$)',
      accessor: 'liquidado',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-sm text-amber-600">
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: 'Pago (R$)',
      accessor: 'pago',
      render: (val: number) => (
        <span className={`block text-right tabular-nums font-semibold text-sm ${Number(val) > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: '% Pago',
      accessor: 'empenhado',
      render: (val: number, row: RestosPagarRow) => {
        const emp = Number(val) || 0;
        const pct = emp > 0 ? ((Number(row.pago) || 0) / emp) * 100 : 0;
        return (
          <span className={`block text-right tabular-nums text-sm font-semibold ${pct >= 100 ? 'text-emerald-600' : pct > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {pct.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  return (
    <ContentPage showSearch={false}
      title="Restos a Pagar"
      description="Despesas empenhadas em exercícios anteriores que ainda não foram pagas — consulte por período, código ou descrição, conforme PNTP 2026."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Execução Orçamentária e Financeira', href: '/#secao-1' },
        { label: 'Despesas', href: '/#secao-1/despesas' },
        { label: 'Restos a Pagar' },
      ]}
      lastUpdate={today}
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        anosLoading={anosLoading}
        empresas={EMPRESAS}
      >
        {/* Filtro Descrição */}
        <div className="flex flex-col gap-1 sm:w-64">
          <label className="text-xs font-medium text-gray-600">Descrição</label>
          <div className="relative">
            <select
              value={descricaoFilter}
              onChange={e => setDescricaoFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todas as descrições</option>
              {descricoes.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </FilterPanel>

      {/* ── DASHBOARD ── */}
      <div className="mt-4 mb-4 max-w-4xl mx-auto bg-white border border-amber-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-amber-800 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
              Exercício {filters.ano || 'Geral'}
            </span>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Empenhado</p>
              {loading ? (
                <div className="h-7 w-28 bg-gray-100 animate-pulse rounded" />
              ) : (
                <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalEmpenhado)}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Inscrição em restos</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-amber-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-amber-600/70 uppercase tracking-wider mb-1">Total Liquidado</p>
              {loading ? (
                <div className="h-7 w-28 bg-amber-100 animate-pulse rounded" />
              ) : (
                <p className="text-xl sm:text-2xl font-extrabold text-amber-600 tabular-nums">{formatBRL(totalLiquidado)}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Processados</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-emerald-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">Total Pago</p>
              {loading ? (
                <div className="h-7 w-28 bg-emerald-100 animate-pulse rounded" />
              ) : (
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 tabular-nums">{formatBRL(totalPago)}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Baixados</p>
            </div>
          </div>

          {/* Barras de progresso */}
          {!loading && totalEmpenhado > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">Liquidação</span>
                  <span>{liquidadoPct.toFixed(1)}% liquidado</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(liquidadoPct, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">Pagamento</span>
                  <span>{pagoPct.toFixed(1)}% pago</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pagoPct, 100)}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>Emp.: {formatBRL(totalEmpenhado)}</span>
                <span>Liq.: {formatBRL(totalLiquidado)}</span>
                <span>Pago: {formatBRL(totalPago)}</span>
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

      <DataTable
        columns={columns}
        data={data}
        title="Restos a Pagar"
        exportable
        loading={loading}
        error={error}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── CARDS INFORMATIVOS ── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">O que são Restos a Pagar?</p>
          <p className="text-sm text-amber-800/80 leading-relaxed">
            Restos a Pagar são despesas empenhadas (comprometidas) em um exercício financeiro
            mas não pagas até 31 de dezembro. Dividem-se em <strong>Processados</strong> 
            (já liquidados, aguardando pagamento) e <strong>Não Processados</strong>
            (aguardando liquidação). Os prazos para pagamento seguem o art. 36 da Lei 4.320/1964.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">Status dos Registros</p>
          <ul className="text-sm text-blue-800/80 space-y-1.5 mt-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
              <strong>Não Processado</strong> — Empenhado, aguardando liquidação
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
              <strong>Processado</strong> — Liquidado, aguardando pagamento
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
              <strong>Pago</strong> — Baixado
            </li>
          </ul>
        </div>
      </div>

      {/* ── NOTA LEGAL ── */}
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Base Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Art. 36 da Lei nº 4.320/1964, Lei de Responsabilidade Fiscal (LC 101/2000),
          Manual de Contabilidade Aplicada ao Setor Público (MCASP) e PNTP 2026 — TCE-PI.
          Dados exportáveis em formato CSV (dados abertos).
        </p>
      </div>
    </ContentPage>
  );
}
