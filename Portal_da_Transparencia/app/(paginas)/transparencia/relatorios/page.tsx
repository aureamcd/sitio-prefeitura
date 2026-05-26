'use client';

import { useState, useMemo, useCallback } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { useAvailableYears } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const MOCK_DATA = [
  {
    id: 1,
    ano: "2026",
    tipo: "RGF - Relatório de Gestão Fiscal",
    periodo: "1º Quadrimestre",
    descricao: "Demonstrativo das Despesas com Pessoal, Dívida Consolidada Líquida e Garantias de Valores.",
    publicacao: "20/05/2026",
    mes: "05",
  },
  {
    id: 2,
    ano: "2026",
    tipo: "RREO - Relatório Resumido da Execução Orçamentária",
    periodo: "2º Bimestre",
    descricao: "Balanço Orçamentário e demonstrativos de Receitas e Despesas Primárias e Nominais.",
    publicacao: "20/05/2026",
    mes: "05",
  },
  {
    id: 3,
    ano: "2026",
    tipo: "LOA - Lei Orçamentária Anual",
    periodo: "Anual",
    descricao: "Estima as receitas e fixa as despesas da Administração Municipal para o exercício financeiro de 2026.",
    publicacao: "31/12/2025",
    mes: "12",
  },
  {
    id: 4,
    ano: "2025",
    tipo: "Balanço Geral / Prestação de Contas",
    periodo: "Anual",
    descricao: "Demonstrações Contábeis Consolidadas referentes ao exercício financeiro encerrado (PCG).",
    publicacao: "15/04/2026",
    mes: "04",
  }
];

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
function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getTipoBadge(tipo: string) {
  if (tipo.startsWith('RGF')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (tipo.startsWith('RREO')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (tipo.startsWith('LOA') || tipo.startsWith('LDO') || tipo.startsWith('PPA')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (tipo.startsWith('Balanço')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function RelatoriosPage() {
  const { anos: ANOS } = useAvailableYears('relatorios');
  const today = useTodayDate();
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '' });

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      // Filtros exatos
      if (filters.ano && item.ano !== filters.ano) return false;
      // Para relatórios, o mês às vezes representa a data de publicação ou referência
      if (filters.mes && item.mes !== filters.mes) return false;

      // Filtro textual
      if (filters.busca) {
        const term = normalize(filters.busca);
        return (
          normalize(item.tipo).includes(term) ||
          normalize(item.descricao).includes(term) ||
          normalize(item.periodo).includes(term)
        );
      }
      return true;
    });
  }, [filters]);

  const columns = [
    { 
      header: "Ano / Período", 
      accessor: "periodo",
      render: (val: string, row: typeof MOCK_DATA[0]) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{row.ano}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{val}</p>
        </div>
      )
    },
    { 
      header: "Tipo de Documento", 
      accessor: "tipo",
      render: (val: string) => (
        <span className={`inline-flex px-2 py-1 rounded border text-xs font-semibold tracking-wide ${getTipoBadge(val)}`}>
          {val}
        </span>
      )
    },
    { 
      header: "Descrição do Relatório", 
      accessor: "descricao",
      render: (val: string) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2" title={val}>{val}</p>
        </div>
      )
    },
    { 
      header: "Data de Publicação", 
      accessor: "publicacao", 
      render: (val: string) => (
        <span className="text-sm text-gray-600">{val}</span>
      )
    },
    { 
      header: "Ações", 
      accessor: "acoes", 
      render: () => (
        <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
          Baixar PDF
        </a>
      )
    },
  ];

  return (
    <ContentPage
      title="Planejamento e Prestação de Contas"
      description="Consulte os Relatórios de Gestão Fiscal (RGF), Execução Orçamentária (RREO), Peças de Planejamento (PPA, LDO, LOA) e Balanços Gerais."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/portal" },
        { label: "Planejamento e Contas" },
        { label: "Relatórios" },
      ]}
      lastUpdate={today}
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      />

      {/* Totalizer strip */}
      <div className="mt-4 bg-gray-50 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center border border-gray-100 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Documentos Encontrados</p>
          <p className="text-xl font-semibold text-gray-800 tabular-nums">{filteredData.length}</p>
        </div>
      </div>

      <DataTable 
        title="Documentos de Planejamento e Contas Públicas"
        columns={columns}
        data={filteredData}
        exportable={true}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Legal note */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação destes documentos atende às exigências da Lei de Responsabilidade Fiscal (LC nº 101/2000), 
          garantindo o controle social sobre a gestão das metas fiscais, limites de despesa com pessoal, endividamento 
          e transparência na formulação e execução orçamentária do Município.
        </p>
      </div>
    </ContentPage>
  );
}
