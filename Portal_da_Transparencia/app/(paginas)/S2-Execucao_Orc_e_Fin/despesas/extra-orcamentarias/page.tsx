'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { MESES, formatBRL, formatDateISO } from '@/lib/despesas/types';
import type { DespesaExtraRow } from '@/lib/despesas/types';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { ChevronDown } from 'lucide-react';
import { EMPRESAS } from '@/lib/empresas';

export default function DespesasExtraPage() {
  const today = useTodayDate();
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '', entidade: '' });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('despesas_extra_orcamentarias', filters.entidade || undefined);

  // Filtros extras
  const [nomenclaturaFilter, setNomenclaturaFilter] = useState('');
  const [nomenclaturas, setNomenclaturas] = useState<string[]>([]);

  const [data, setData] = useState<DespesaExtraRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // ── Buscar opções de nomenclatura ──
  useEffect(() => {
    async function fetchFilterOptions() {
      let q = supabase
        .schema('transparencia')
        .from('despesas_extra_orcamentarias')
        .select('nomenclatura')
        .not('nomenclatura', 'is', null)
        .order('nomenclatura', { ascending: true });
      if (filters.ano) q = q.eq('ano', filters.ano);
      const { data: result } = await q;
      if (result) {
        setNomenclaturas([...new Set(result.map(r => String(r.nomenclatura)))].sort());
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
        .from('despesas_extra_orcamentarias')
        .select('*');

      if (filters.ano) query = query.eq('ano', filters.ano);
      if (filters.entidade) query = query.eq('empresa', filters.entidade);
      if (filters.busca) {
        query = query.or(
          `descricao.ilike.%${filters.busca}%` +
          `,nomenclatura.ilike.%${filters.busca}%` +
          `,historico.ilike.%${filters.busca}%` +
          `,codigo.ilike.%${filters.busca}%` +
          `,numero_guia.ilike.%${filters.busca}%` +
          `,cnpj_inscricao.ilike.%${filters.busca}%`,
        );
      }
      if (nomenclaturaFilter) query = query.eq('nomenclatura', nomenclaturaFilter);

      const { data: result, error: err } = await query
        .order('data', { ascending: false });

      if (cancelled) return;

      if (!err && result) {
        setData(result as DespesaExtraRow[]);
      } else {
        console.error("Error fetching despesas_extra:", err);
        setError(err?.message || 'Erro ao carregar despesas extra-orçamentárias.');
        setData([]);
      }
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.ano, filters.entidade, filters.busca, nomenclaturaFilter, supabase]);

  // ── Handlers ──
  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
    setNomenclaturaFilter('');
  }, []);

  const filterKey = `${filters.ano}-${filters.busca}-${nomenclaturaFilter}-${filters.entidade}`;
  const hasActiveFilters = !!(filters.ano || filters.busca || nomenclaturaFilter);

  const totalPago = useMemo(
    () => data.reduce((s, r) => s + (Number(r.pago) || 0), 0), [data],
  );
  const comGuia = useMemo(
    () => data.filter(r => r.numero_guia).length, [data],
  );

  // Badge de tipo de despesa
  function TipoBadge({ row }: { row: DespesaExtraRow }) {
    const nome = (row.nomenclatura || '').toLowerCase();
    if (nome.includes('consignação') || nome.includes('consignacao')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-semibold">Consignação</span>;
    }
    if (nome.includes('caução') || nome.includes('caucao') || nome.includes('depósito') || nome.includes('deposito')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-semibold">Caução/Depósito</span>;
    }
    if (nome.includes('restituição') || nome.includes('restituicao') || nome.includes('devolução') || nome.includes('devolucao')) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">Restituição</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">Outra</span>;
  }

  const columns = [
    {
      header: 'Tipo',
      accessor: 'nomenclatura',
      render: (_val: string, row: DespesaExtraRow) => <TipoBadge row={row} />,
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
      header: 'Nomenclatura',
      accessor: 'nomenclatura',
      render: (val: string) => (
        <span className="block max-w-[200px] text-sm text-gray-700 line-clamp-2" title={val || ''}>
          {val || '-'}
        </span>
      ),
    },
    {
      header: 'Descrição / Histórico',
      accessor: 'descricao',
      render: (val: string, row: DespesaExtraRow) => (
        <div className="max-w-[260px]">
          <p className="text-sm text-gray-700 line-clamp-2" title={val || ''}>{val || '-'}</p>
          {row.historico && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic" title={row.historico}>{row.historico}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Nº Guia',
      accessor: 'numero_guia',
      render: (val: string) => (
        <span className="font-mono text-xs text-gray-700">{val || '-'}</span>
      ),
    },
    {
      header: 'Data Guia',
      accessor: 'data_guia',
      render: (val: string) => (
        <span className="text-sm text-gray-600">{formatDateISO(val)}</span>
      ),
    },
    {
      header: 'Data Lançamento',
      accessor: 'data',
      render: (val: string) => (
        <span className="text-sm text-gray-600">{formatDateISO(val)}</span>
      ),
    },
    {
      header: 'CNPJ/Inscrição',
      accessor: 'cnpj_inscricao',
      render: (val: string) => (
        <span className="text-xs text-gray-600">{val || '-'}</span>
      ),
    },
    {
      header: 'Valor Pago (R$)',
      accessor: 'pago',
      render: (val: number) => (
        <span className={`block text-right tabular-nums font-semibold ${Number(val) > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
          {formatBRL(Number(val))}
        </span>
      ),
    },
  ];

  return (
    <ContentPage showSearch={false}
      title="Despesas Extra-orçamentárias"
      description="Pagamentos que independem de autorização orçamentária — consignações, cauções, restituições e outros valores transitórios. Consulte por período, nomenclatura ou número de guia."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Execução Orçamentária e Financeira', href: '/#secao-1' },
        { label: 'Despesas', href: '/S2-Execucao_Orc_e_Fin/despesas' },
        { label: 'Despesas Extra-orçamentárias' },
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
        {/* Filtro Nomenclatura */}
        <div className="flex flex-col gap-1 sm:w-64">
          <label className="text-xs font-medium text-gray-600">Nomenclatura</label>
          <div className="relative">
            <select
              value={nomenclaturaFilter}
              onChange={e => setNomenclaturaFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todas as nomenclaturas</option>
              {nomenclaturas.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </FilterPanel>

      {/* ── DASHBOARD ── */}
      <div className="mt-4 mb-4 max-w-4xl mx-auto bg-white border border-purple-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-purple-800 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block animate-pulse" />
              Exercício {filters.ano || 'Geral'}
            </span>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total de Registros</p>
              {loading ? (
                <div className="h-7 w-16 bg-gray-100 animate-pulse rounded" />
              ) : (
                <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{data.length}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Lançamentos extra</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-purple-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-purple-600/70 uppercase tracking-wider mb-1">Com Nº Guia</p>
              {loading ? (
                <div className="h-7 w-16 bg-purple-100 animate-pulse rounded" />
              ) : (
                <p className="text-xl sm:text-2xl font-extrabold text-purple-600 tabular-nums">{comGuia}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Guias emitidas</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-emerald-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">Total Pago</p>
              {loading ? (
                <div className="h-7 w-32 bg-emerald-100 animate-pulse rounded" />
              ) : (
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 tabular-nums">{formatBRL(totalPago)}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">Valor total extra</p>
            </div>
          </div>

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
        title="Despesas Extra-orçamentárias"
        exportable
        loading={loading}
        error={error}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* ── CARDS INFORMATIVOS ── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
          <p className="text-sm font-semibold text-purple-800 mb-1">O que são Despesas Extra-orçamentárias?</p>
          <p className="text-sm text-purple-800/80 leading-relaxed">
            São pagamentos que independem de autorização orçamentária, como devolução de cauções,
            consignações em folha (IRRF, INSS, sindicato), restituições de tributos e outros valores
            transitórios que não afetam o resultado fiscal do município.
          </p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <p className="text-sm font-semibold text-indigo-800 mb-1">Tipos de Nomenclatura</p>
          <ul className="text-sm text-indigo-800/80 space-y-1.5 mt-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block shrink-0" />
              <strong>Consignação</strong> — Retenções na folha (IRRF, INSS, pensão)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
              <strong>Caução/Depósito</strong> — Garantias contratuais
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
              <strong>Restituição</strong> — Devolução de valores recebidos indevidamente
            </li>
          </ul>
        </div>
      </div>

      {/* ── NOTA LEGAL ── */}
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Base Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Lei nº 4.320/1964 (arts. 57 a 67), Manual de Contabilidade Aplicada ao Setor Público (MCASP)
          11ª edição e PNTP 2026 — TCE-PI. Dados exportáveis em formato CSV (dados abertos).
        </p>
      </div>
    </ContentPage>
  );
}
