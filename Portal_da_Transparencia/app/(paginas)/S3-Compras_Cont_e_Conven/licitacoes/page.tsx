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

const SITUACAO_BADGE: Record<string, { label: string; className: string }> = {
  aberta: { label: 'Aberta', className: 'bg-blue-100 text-blue-800' },
  homologada: { label: 'Homologada', className: 'bg-green-100 text-green-800' },
  fracassada: { label: 'Fracassada', className: 'bg-red-100 text-red-800' },
  deserta: { label: 'Deserta', className: 'bg-red-100 text-red-800' },
  'em andamento': { label: 'Em andamento', className: 'bg-amber-100 text-amber-800' },
  concluida: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-800' },
  suspensa: { label: 'Suspensa', className: 'bg-orange-100 text-orange-800' },
};

function getSituacaoBadge(val: string) {
  if (!val) return { label: 'Desconhecido', className: 'bg-gray-100 text-gray-700' };
  const lower = val.toLowerCase().trim();
  
  for (const key in SITUACAO_BADGE) {
    if (lower.includes(key)) {
      return SITUACAO_BADGE[key];
    }
  }
  
  return { label: val, className: 'bg-gray-100 text-gray-700' };
}

function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function LicitacoesPage() {
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('licitacoes');
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      let query = supabase
        .schema('transparencia')
        .from('licitacoes')
        .select('*');
        
      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }
      
      if (filters.mes) {
        // Filtragem por data_abertura usando ILIKE (YYYY-MM-%)
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.ilike('data_abertura', `${prefix}%`);
      }
      
      if (filters.busca) {
        query = query.or(`objeto.ilike.%${filters.busca}%,numero.ilike.%${filters.busca}%,tipo_licitacao.ilike.%${filters.busca}%`);
      }
      
      const { data: result, error } = await query.order('data_abertura', { ascending: false }).limit(500);
      
      if (!error && result) {
        setData(result);
      } else {
        console.error("Error fetching licitacoes:", error);
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

  const totalEstimado = data.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  const columns = [
    { 
      header: 'Nº/Ano', 
      accessor: 'numero',
      render: (val: string, row: any) => val || row.nlicitacao || row.numlic || '-'
    },
    { 
      header: 'Modalidade', 
      accessor: 'tipo_licitacao',
      render: (val: string) => val || '-'
    },
    {
      header: 'Objeto',
      accessor: 'objeto',
      render: (val: string) => (
        <span
          className="block max-w-[260px] text-sm text-gray-700"
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
      header: 'Data de Abertura', 
      accessor: 'data_abertura',
      render: (val: string) => val ? new Date(val).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'
    },
    {
      header: 'Valor Estimado',
      accessor: 'valor',
      render: (val: number) => (
        <span className="block text-right tabular-nums text-sm font-semibold text-gray-800">{formatBRL(Number(val))}</span>
      ),
    },
    {
      header: 'Situação',
      accessor: 'situacao',
      render: (val: string) => {
        const badge = getSituacaoBadge(val);
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      header: 'Edital',
      accessor: 'acoes',
      render: () => (
        <a
          href="#"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          onClick={e => e.preventDefault()}
        >
          Ver Detalhes ↗
        </a>
      ),
    },
  ];

  return (
    <ContentPage showSearch={false}
      title="Licitações"
      description="Processos licitatórios realizados pelo município, conforme exigências do PNTP 2026 e da Lei nº 14.133/2021 (Nova Lei de Licitações)."
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
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total de Processos</p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{data.length}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total Estimado</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">{formatBRL(totalEstimado)}</p>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        title="Processos Licitatórios"
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Legal note */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Os processos licitatórios são conduzidos em conformidade com a Lei nº 14.133/2021
          (Nova Lei de Licitações e Contratos Administrativos), o Decreto Municipal regulamentador e as normas do
          Tribunal de Contas do Estado do Piauí – PNTP 2026. Os editais e atas encontram-se disponíveis para download.
        </p>
      </div>
    </ContentPage>
  );
}
