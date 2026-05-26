'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';

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

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
}

export default function ContratosPage() {
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('contratos');
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      let query = supabase
        .schema('transparencia')
        .from('contratos')
        .select('*');
        
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }
      
      if (filters.mes) {
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.ilike('data_assinatura', `${prefix}%`);
      }
      
      if (filters.busca) {
        query = query.or(`fornecedor.ilike.%${filters.busca}%,numero_contrato.ilike.%${filters.busca}%,objeto.ilike.%${filters.busca}%`);
      }
      
      const { data: result, error } = await query.order('data_assinatura', { ascending: false }).limit(500);
      
      if (!error && result) {
        setData(result);
      } else {
        console.error("Error fetching contratos:", error);
        setData([]);
      }
      setLoading(false);
    }
    
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters.ano, filters.mes, filters.busca, supabase]);

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => setFilters({ ano: '', mes: '', busca: '' }), []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  const totalVigentes = data.length;
  const totalValor = data.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  const columns = [
    { 
      header: 'Nº Contrato', 
      accessor: 'numero_contrato',
      render: (val: string) => val || '-' 
    },
    {
      header: 'Contratado',
      accessor: 'fornecedor',
      render: (val: string, row: any) => (
        <div>
          <span className="font-semibold text-gray-900 line-clamp-2" title={val}>{val || '-'}</span>
          <span className="text-xs text-gray-500 mt-1 block">{row.cnpj_inscricao || ''}</span>
        </div>
      ),
    },
    {
      header: 'Objeto',
      accessor: 'objeto',
      render: (val: string) => (
        <span
          className="block max-w-[240px] text-sm text-gray-700"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={val}
        >
          {val || '-'}
        </span>
      ),
    },
    { 
      header: 'Vigência', 
      accessor: 'vigencia_inicio',
      render: (val: string, row: any) => {
        if (!val && !row.vigencia_fim) return '-';
        return `${formatDate(val)} a ${formatDate(row.vigencia_fim)}`;
      }
    },
    {
      header: 'Valor Contratual',
      accessor: 'valor',
      render: (val: number) => (
        <span className="block text-right tabular-nums font-semibold text-gray-800">{formatBRL(Number(val))}</span>
      ),
    },
    {
      header: 'Aditivos',
      accessor: 'aditivos',
      render: (val: number) => (
        <span className={`block text-center ${val > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
          {val || 0}
        </span>
      ),
    },
    { 
      header: 'Fiscal do Contrato', 
      accessor: 'gestor_nome',
      render: (val: string) => <span className="text-sm line-clamp-1">{val || '-'}</span>
    },
    {
      header: 'Íntegra',
      accessor: 'acoes',
      render: () => (
        <a
          href="#"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          onClick={e => e.preventDefault()}
        >
          Ver Contrato ↗
        </a>
      ),
    },
  ];

  return (
    <ContentPage showSearch={false}
      title="Contratos"
      description="Contratos celebrados pela administração municipal, com informações sobre contratados, objetos, vigências e valores, conforme o PNTP 2026."
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
      <div className="mt-4 bg-gray-50 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center border border-gray-100 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Contratos Vigentes (Filtro)</p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalVigentes}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Valor Total Contratado (Filtro)</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">{formatBRL(totalValor)}</p>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        title="Contratos Administrativos"
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Legal note */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação dos contratos administrativos observa o art. 94 da Lei nº 14.133/2021
          e o art. 8º, §1º, IV da Lei de Acesso à Informação (Lei nº 12.527/2011). As íntegras dos contratos, aditivos
          e apostilamentos estão disponíveis para download no Portal de Transparência, em conformidade com o PNTP 2026 – TCE-PI.
        </p>
      </div>
    </ContentPage>
  );
}
