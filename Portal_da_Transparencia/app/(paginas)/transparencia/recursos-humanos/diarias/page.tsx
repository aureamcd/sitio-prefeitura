'use client';

import { useState, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { EMPRESAS } from '@/lib/empresas';

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
export default function DiariasPage() {
  const today = useTodayDate();
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '', entidade: '' });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('diarias', filters.entidade || undefined);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      let query = supabase
        .schema('transparencia')
        .from('diarias')
        .select('*');
        
      if (filters.ano) {
        query = query.eq('ano', parseInt(filters.ano));
      }
      
      if (filters.entidade) {
        query = query.eq('empresa', filters.entidade);
      }
      
      // Filtro de mês simulado comparando a string ISO `data` ('YYYY-MM-DD')
      if (filters.mes) {
        // Isso é uma filtragem básica via ilike assumindo o formato YYYY-MM
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.like('data', `${prefix}%`);
      }
      
      if (filters.busca) {
        query = query.or(`favorecido.ilike.%${filters.busca}%,cargo.ilike.%${filters.busca}%,descricao.ilike.%${filters.busca}%`);
      }
      
      const { data: result, error } = await query.order('data', { ascending: false });
      
      if (!error && result) {
        setData(result);
      } else {
        console.error("Error fetching diarias:", error);
        setData([]);
      }
      setLoading(false);
    }
    
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters.ano, filters.mes, filters.busca, filters.entidade, supabase]);

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.entidade);

  const totalDiarias = data.length;
  // Algumas tabelas podem subtrair valor_anulado do valor, mas faremos a soma direta de "valor" 
  const valorTotalDiarias = data.reduce((acc, curr) => acc + (Number(curr.valor) || 0) - (Number(curr.valor_anulado) || 0), 0);

  const columns = [
    {
      header: 'Entidade',
      accessor: 'empresa_nome',
      render: (val: string) => val || '-',
    },
    { 
      header: "Beneficiário", 
      accessor: "favorecido",
      render: (val: string, row: any) => (
        <div className="max-w-[200px]">
          <p className="text-sm font-semibold text-gray-900">{val || '-'}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5 line-clamp-2" title={row.cargo}>{row.cargo || 'Cargo não informado'}</p>
        </div>
      )
    },
    { 
      header: "Órgão / Data", 
      accessor: "orgao_nome",
      render: (val: string, row: any) => (
        <div>
          <p className="text-sm font-medium text-gray-800 line-clamp-1">{val || 'Prefeitura Municipal'}</p>
          <p className="text-xs text-gray-500 mt-1">
            Data: {row.data ? new Date(row.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}
          </p>
        </div>
      )
    },
    { 
      header: "Motivo da Viagem / Descrição", 
      accessor: "descricao",
      render: (val: string) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3" title={val}>{val || '-'}</p>
        </div>
      )
    },
    { 
      header: "Valor Pago", 
      accessor: "valor", 
      render: (val: number, row: any) => {
        const liquido = (Number(val) || 0) - (Number(row.valor_anulado) || 0);
        return (
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatBRL(liquido)}</span>
          </div>
        );
      }
    },
    { 
      header: "Ações", 
      accessor: "acoes", 
      render: () => (
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
          Comprovante
        </button>
      )
    },
  ];

  return (
    <ContentPage
      title="Diárias e Passagens"
      description="Consulte os pagamentos de diárias e passagens concedidas aos servidores e autoridades para custear despesas de viagens a serviço do município."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/" },
        { label: 'Recursos Humanos', href: '/#secao-4' },
        { label: "Diárias e Passagens" },
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
      />

      {/* Totalizer strip */}
      <div className="mt-4 bg-gray-50 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center border border-gray-100 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total de Concessões (Filtro)</p>
          {loading ? (
            <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalDiarias}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Valor Total Pago (Filtro)</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">{formatBRL(valorTotalDiarias)}</p>
          )}
        </div>
      </div>

      <DataTable 
        title="Relação de Diárias e Passagens"
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
          A concessão de diárias e passagens possui caráter indenizatório e destina-se a cobrir despesas 
          com hospedagem, alimentação e locomoção urbana do servidor que, a serviço, afastar-se da sede em caráter eventual ou transitório, 
          conforme legislação municipal pertinente e normativas do Tribunal de Contas do Estado (TCE-PI) e PNTP 2026.
        </p>
      </div>
    </ContentPage>
  );
}
