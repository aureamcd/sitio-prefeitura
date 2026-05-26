'use client';

import { useState, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function EmendasPage() {
  const today = useTodayDate();
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('emendas');
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      let query = supabase
        .schema('transparencia')
        .from('emendas')
        .select('*');
        
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }
      
      if (filters.busca) {
        query = query.or(`tipo_transferencia.ilike.%${filters.busca}%,receita_transferencia.ilike.%${filters.busca}%,recurso_aplicacao_financeira.ilike.%${filters.busca}%`);
      }
      
      const { data: result, error } = await query.order('ano', { ascending: false }).limit(500);
      
      if (!error && result) {
        setData(result);
      } else {
        console.error("Error fetching emendas:", error);
        setData([]);
      }
      setLoading(false);
    }
    
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [filters.ano, filters.busca, supabase]);

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  const totalEmendas = data.length;
  const valorTotalEmpenhado = data.reduce((acc, curr) => acc + (Number(curr.empenhado) || 0), 0);
  const valorTotalPago = data.reduce((acc, curr) => acc + (Number(curr.pago) || 0), 0);

  const columns = [
    {
      header: "Tipo de Transferência",
      accessor: "tipo_transferencia",
      render: (val: string) => (
        <span className="text-sm font-medium text-gray-800">{val || '-'}</span>
      ),
    },
    {
      header: "Receita / Destinação",
      accessor: "receita_transferencia",
      render: (val: string) => (
        <div className="max-w-[280px]">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2" title={val}>{val || '-'}</p>
        </div>
      ),
    },
    {
      header: "Aplicação Financeira",
      accessor: "recurso_aplicacao_financeira",
      render: (val: string) => (
        <span className="text-sm text-gray-600 line-clamp-2" title={val}>{val || '-'}</span>
      ),
    },
    {
      header: "Valor Empenhado",
      accessor: "empenhado",
      render: (val: number) => (
        <div className="text-right">
          <span className="text-sm text-gray-800 tabular-nums">{formatBRL(Number(val))}</span>
        </div>
      ),
    },
    {
      header: "Valor Liquidado",
      accessor: "liquidado",
      render: (val: number) => (
        <div className="text-right">
          <span className="text-sm text-gray-600 tabular-nums">{formatBRL(Number(val))}</span>
        </div>
      ),
    },
    {
      header: "Valor Pago",
      accessor: "pago",
      render: (val: number) => (
        <div className="text-right">
          <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatBRL(Number(val))}</span>
        </div>
      ),
    },
  ];

  return (
    <ContentPage
      title="Emendas Parlamentares"
      description="Consulte a relação de emendas parlamentares (federais e estaduais) destinadas ao município, com valores empenhados, liquidados e pagos, em cumprimento ao PNTP 2026."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/" },
        { label: "Emendas Parlamentares" },
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
      />

      {/* Totalizer */}
      <div className="mt-4 bg-gray-50 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center border border-gray-100 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total de Emendas</p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalEmendas}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Valor Total Empenhado</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">{formatBRL(valorTotalEmpenhado)}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Valor Total Pago</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-emerald-600 tabular-nums">{formatBRL(valorTotalPago)}</p>
          )}
        </div>
      </div>

      <DataTable
        title="Emendas Recebidas"
        columns={columns}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Legal note */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          As informações sobre emendas parlamentares atendem ao princípio da publicidade (Art. 37 da Constituição Federal)
          e às diretrizes do PNTP 2026 e do Tribunal de Contas da União (TCU). Os dados são obtidos diretamente
          do sistema de transparência municipal via API, refletindo os valores empenhados, liquidados e pagos.
        </p>
      </div>
    </ContentPage>
  );
}
