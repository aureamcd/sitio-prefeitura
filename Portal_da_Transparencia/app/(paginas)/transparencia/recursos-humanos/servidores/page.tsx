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

function getVinculoBadge(vinculo: string) {
  if (!vinculo) return 'bg-gray-50 text-gray-700 border-gray-200';
  const v = vinculo.toLowerCase();
  if (v.includes('efetivo')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (v.includes('comissionado')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (v.includes('temporário') || v.includes('temporario')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ServidoresPage() {
  const today = useTodayDate();
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('servidores');
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '05', busca: '' });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      let query = supabase
        .schema('transparencia')
        .from('servidores')
        .select('*');
        
      if (filters.ano) {
        query = query.eq('ano', parseInt(filters.ano));
      }
      
      if (filters.busca) {
        query = query.or(`nome.ilike.%${filters.busca}%,cargo.ilike.%${filters.busca}%,lotacao.ilike.%${filters.busca}%`);
      }
      
      // Limit to 500 to avoid freezing the browser on huge payrolls
      const { data: result, error } = await query.order('nome', { ascending: true }).limit(500);
      
      if (!error && result) {
        setData(result);
      } else {
        console.error("Error fetching servidores:", error);
        setData([]);
      }
      setLoading(false);
    }
    
    // Add a small debounce for text search
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    
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

  const totalServidores = data.length;
  const totalFolhaBruta = data.reduce((acc, curr) => acc + (Number(curr.rendimentos) || 0), 0);

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
      header: "Lotação / C.H.", 
      accessor: "lotacao",
      render: (val: string, row: any) => (
        <div className="max-w-[200px]">
          <p className="text-xs text-gray-700 line-clamp-2" title={val}>{val || '-'}</p>
          <p className="text-xs font-medium text-gray-500 mt-1">C.H.: {row.carga_horaria || 'N/D'}</p>
        </div>
      )
    },
    { 
      header: "Remuneração Bruta", 
      accessor: "rendimentos", 
      render: (val: number) => (
        <div className="text-right">
          <span className="text-sm text-gray-800 tabular-nums">{formatBRL(Number(val))}</span>
        </div>
      )
    },
    { 
      header: "Descontos (IRRF/Prev)", 
      accessor: "descontos", 
      render: (val: number) => (
        <div className="text-right">
          <span className="text-sm text-red-600 tabular-nums">-{formatBRL(Number(val))}</span>
        </div>
      )
    },
    { 
      header: "Líquido a Receber", 
      accessor: "liquido", 
      render: (val: number) => (
        <div className="text-right">
          <span className="font-semibold text-gray-900 tabular-nums">{formatBRL(Number(val))}</span>
        </div>
      )
    },
    { 
      header: "Ficha", 
      accessor: "acoes", 
      render: () => (
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
          Holerite
        </button>
      )
    },
  ];

  return (
    <ContentPage
      title="Servidores e Folha de Pagamento"
      description="Consulte a relação nominal de todos os servidores ativos, inativos e pensionistas, com seus respectivos cargos, lotações e detalhamento da remuneração."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/" },
        { label: "Recursos Humanos" },
        { label: "Servidores" },
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
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Valor Bruto da Folha (Filtro)</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">{formatBRL(totalFolhaBruta)}</p>
          )}
        </div>
      </div>

      <DataTable 
        title={`Relação de Pessoal - ${filters.ano}`}
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
          As informações sobre servidores e remuneração são publicadas em cumprimento à Lei de Acesso à Informação 
          (Lei nº 12.527/2011) e às diretrizes do Tribunal de Contas do Estado do Piauí – PNTP 2026. A remuneração 
          apresentada engloba subsídios, vencimentos, vantagens pessoais, indenizações e demais acréscimos legais, 
          deduzidos os descontos obrigatórios (Imposto de Renda e Previdência). 
        </p>
      </div>
    </ContentPage>
  );
}
