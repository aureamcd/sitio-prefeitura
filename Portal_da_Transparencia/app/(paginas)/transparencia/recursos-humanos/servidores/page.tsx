'use client';

import { useState, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { deduplicateServidores } from '@/lib/utils/deduplicate';

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
function getVinculoBadge(vinculo: string) {
  if (!vinculo) return 'bg-gray-50 text-gray-700 border-gray-200';
  const v = vinculo.toLowerCase();
  if (v.includes('efetivo')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (v.includes('comissionado')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (v.includes('temporário') || v.includes('temporario')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function formatDate(val: string | null): string {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ServidoresPage() {
  const today = useTodayDate();
  const [filters, setFilters] = useState({
    busca: '',
    status: '',
  });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      let query = supabase
        .schema('transparencia')
        .from('servidores')
        .select('*')
        .limit(100000);
        
      if (filters.status === 'ativo') {
        query = query.eq('ativo', true).is('data_desligamento', null);
      } else if (filters.status === 'desligado') {
        query = query.or('ativo.eq.false,data_desligamento.not.is.null');
      }

      if (filters.busca) {
        query = query.or(`nome.ilike.%${filters.busca}%,cargo.ilike.%${filters.busca}%,lotacao.ilike.%${filters.busca}%`);
      }
      
      const { data: result, error } = await query.order('nome', { ascending: true });
      
      if (!error && result) {
        setData(deduplicateServidores(result));
      } else {
        console.error("Error fetching servidores:", error);
        setData([]);
      }
      setLoading(false);
    }
    
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters.busca, filters.status, supabase]);

  const handleChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ busca: '', status: '' });
  }, []);

  const filterKey = `${filters.busca}-${filters.status}`;
  const hasActiveFilters = !!(filters.busca || filters.status);

  const totalServidores = data.length;

  const columns = [
    { 
      header: "Servidor / Matrícula", 
      accessor: "nome",
      render: (val: string, row: any) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{val}</p>
          <p className="text-xs font-mono text-gray-500 mt-0.5">Mat: {row.matricula || '-'}</p>
        </div>
      )
    },
    { 
      header: "Cargo e Vínculo", 
      accessor: "cargo",
      render: (val: string, row: any) => (
        <div className="flex flex-col gap-1 items-start">
          <p className="text-sm font-medium text-gray-800">{val || '-'}</p>
          <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${getVinculoBadge(row.situacao || row.vinculo || '')}`}>
            {row.situacao || row.vinculo || 'Vínculo N/D'}
          </span>
        </div>
      )
    },
    { 
      header: "Lotação", 
      accessor: "lotacao",
      render: (val: string) => (
        <div className="max-w-[200px]">
          <p className="text-xs text-gray-700 line-clamp-2" title={val || '-'}>{val || '-'}</p>
        </div>
      )
    },
    { 
      header: "Carga Horária", 
      accessor: "carga_horaria",
      render: (val: string) => (
        <div className="text-center">
          <span className="text-sm text-gray-700 tabular-nums">{val ? `${val}h/sem` : 'N/D'}</span>
        </div>
      )
    },
    { 
      header: "Admissão", 
      accessor: "data_admissao",
      render: (val: string) => (
        <span className="text-sm text-gray-600">{formatDate(val)}</span>
      )
    },
    { 
      header: "Desligamento", 
      accessor: "data_desligamento",
      render: (val: string) => (
        <span className="text-sm text-gray-600">{formatDate(val)}</span>
      )
    },
  ];

  return (
    <ContentPage
      title="Servidores e Folha de Pagamento"
      description="Consulte a relação nominal de todos os servidores ativos, inativos and pensionistas, com seus respectivos cargos, lotações e detalhamento da remuneração."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/" },
        { label: 'Gestão de Pessoas e Benefícios', href: '/#secao-4' },
        { label: "Servidores" },
      ]}
      lastUpdate={today}
    >
      <FilterPanel
        values={filters as any}
        onChange={handleChange}
        onClear={handleClear}
        hideAno={true}
        hideMes={true}
        searchPlaceholder="Pesquisar por nome, cargo ou matrícula..."
      >
        <div className="flex flex-col gap-1 sm:w-44">
          <label className="text-xs font-medium text-gray-600">
            Situação
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all h-[42px]"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="desligado">Não Ativos</option>
          </select>
        </div>
      </FilterPanel>

      {/* Totalizer strip */}
      <div className="mt-4 bg-gray-50 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center border border-gray-100 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total de Servidores (Filtro)</p>
          {loading ? (
            <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalServidores}</p>
          )}
        </div>
      </div>

      <DataTable 
        title="Quadro Geral de Servidores"
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
          As informações sobre servidores são publicadas em cumprimento à Lei de Acesso à Informação 
          (Lei nº 12.527/2011) e às diretrizes do Tribunal de Contas do Estado do Piauí – PNTP 2026.
        </p>
      </div>
    </ContentPage>
  );
}
