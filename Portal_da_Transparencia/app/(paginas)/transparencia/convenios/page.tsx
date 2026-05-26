'use client';

import { useState, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ConveniosPage() {
  const today = useTodayDate();
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('transferencias');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      let query = supabase
        .schema('transparencia')
        .from('transferencias')
        .select('*');

      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }

      if (filters.busca) {
        query = query.or(
          `entidade_pagadora.ilike.%${filters.busca}%,entidade_recebedora.ilike.%${filters.busca}%,cnpj_recebedora.ilike.%${filters.busca}%`
        );
      }

      const { data: result, error } = await query.order('ano', { ascending: false }).limit(500);

      if (!error && result) {
        setData(result);
      } else {
        console.error('Error fetching transferencias:', error);
        setData([]);
      }
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [filters.ano, filters.busca, supabase]);

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => setFilters({ ano: '', mes: '', busca: '' }), []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  const totalRepasse = data.reduce((s, r) => s + (Number(r.repasse) || 0), 0);
  const totalDevolucao = data.reduce((s, r) => s + (Number(r.devolucao) || 0), 0);

  const columns = [
    {
      header: 'Entidade Pagadora',
      accessor: 'entidade_pagadora',
      render: (val: string) => (
        <div className="max-w-[180px]">
          <span className="text-sm font-semibold text-gray-800 line-clamp-2" title={val}>{val || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Entidade Recebedora',
      accessor: 'entidade_recebedora',
      render: (val: string) => (
        <div className="max-w-[180px]">
          <span className="text-sm font-medium text-gray-700 line-clamp-2" title={val}>{val || '-'}</span>
        </div>
      ),
    },
    {
      header: 'CNPJ Pagadora',
      accessor: 'cnpj_pagadora',
      render: (val: string) => (
        <span className="text-xs font-mono text-gray-500">{val || '-'}</span>
      ),
    },
    {
      header: 'CNPJ Recebedora',
      accessor: 'cnpj_recebedora',
      render: (val: string) => (
        <span className="text-xs font-mono text-gray-500">{val || '-'}</span>
      ),
    },
    {
      header: 'Repasse (R$)',
      accessor: 'repasse',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-emerald-600 font-semibold">
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: 'Devolução (R$)',
      accessor: 'devolucao',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-amber-600">
          {formatBRL(Number(val))}
        </span>
      ),
    },
    {
      header: 'Previsto (R$)',
      accessor: 'previsto',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-gray-700">
          {formatBRL(Number(val))}
        </span>
      ),
    },
  ];

  return (
    <ContentPage showSearch={false}
      title="Convênios e Transferências"
      description="Convênios, repasses e transferências voluntárias recebidas da União e do Estado, bem como valores concedidos a entidades parceiras, conforme o PNTP 2026."
      lastUpdate={today}
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        anosLoading={anosLoading}
      />

      {/* Totalizer strip */}
      <div className="bg-gray-50 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center border border-gray-100 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Registros</p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{data.length}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total Repasses (Filtro)</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-emerald-600 tabular-nums">{formatBRL(totalRepasse)}</p>
          )}
        </div>
        {totalDevolucao > 0 && (
          <>
            <div className="w-px h-8 bg-gray-200 hidden sm:block" />
            <div>
              <p className="text-sm font-medium text-gray-500 mb-0.5">Total Devoluções</p>
              <p className="text-xl font-semibold text-amber-600 tabular-nums">{formatBRL(totalDevolucao)}</p>
            </div>
          </>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        title="Convênios e Transferências"
        exportable
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Legal note */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A divulgação dos convênios e instrumentos congêneres atende ao disposto no
          art. 8º, §1º, II e IV da Lei nº 12.527/2011 (LAI) e às exigências do PNTP 2026 – TCE-PI.
          Os dados são obtidos diretamente do sistema de transparência municipal via API e incluem
          transferências recebidas da União e do Estado do Piauí. Prestações de contas detalhadas
          podem ser solicitadas pelo canal e-SIC.
        </p>
      </div>
    </ContentPage>
  );
}

