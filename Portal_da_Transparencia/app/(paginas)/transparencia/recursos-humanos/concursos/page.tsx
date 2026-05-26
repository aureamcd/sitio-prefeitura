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
    edital: "001/2026",
    tipo: "Concurso Público",
    cargos: "Professor, Médico, Enfermeiro, Assistente Social, Aux. Administrativo",
    vagas: 45,
    situacao: "Em Andamento",
    data_publicacao: "15/02/2026",
  },
  {
    id: 2,
    ano: "2025",
    edital: "002/2025",
    tipo: "Processo Seletivo Simplificado",
    cargos: "Motorista Escolar, Vigia, Merendeira",
    vagas: 20,
    situacao: "Homologado",
    data_publicacao: "10/06/2025",
  },
  {
    id: 3,
    ano: "2024",
    edital: "001/2024",
    tipo: "Concurso Público",
    cargos: "Guarda Civil Municipal",
    vagas: 15,
    situacao: "Concluído",
    data_publicacao: "05/01/2024",
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

function getSituacaoBadge(situacao: string) {
  if (situacao === 'Em Andamento') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (situacao === 'Homologado') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (situacao === 'Inscrições Abertas') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (situacao === 'Concluído') return 'bg-gray-100 text-gray-700 border-gray-300';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ConcursosPage() {
  const { anos: ANOS } = useAvailableYears('concursos');
  const today = useTodayDate();
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '' });

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
      // Filtro de ano
      if (filters.ano && item.ano !== filters.ano) return false;
      
      // Filtro de mês (usando a data de publicação como base)
      if (filters.mes) {
        const itemMes = item.data_publicacao.split('/')[1];
        if (itemMes !== filters.mes) return false;
      }

      // Filtro de busca
      if (filters.busca) {
        const term = normalize(filters.busca);
        return (
          normalize(item.edital).includes(term) ||
          normalize(item.tipo).includes(term) ||
          normalize(item.cargos).includes(term)
        );
      }

      return true;
    });
  }, [filters]);

  const columns = [
    { 
      header: "Edital / Tipo", 
      accessor: "edital",
      render: (val: string, row: typeof MOCK_DATA[0]) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">Edital nº {val}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">{row.tipo}</p>
        </div>
      )
    },
    { 
      header: "Cargos e Vagas", 
      accessor: "cargos",
      render: (val: string, row: typeof MOCK_DATA[0]) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-700 line-clamp-2" title={val}>{val}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">{row.vagas} vagas ofertadas</p>
        </div>
      )
    },
    { 
      header: "Publicação", 
      accessor: "data_publicacao",
      render: (val: string) => (
        <span className="text-sm text-gray-600">{val}</span>
      )
    },
    { 
      header: "Situação", 
      accessor: "situacao", 
      render: (val: string) => (
        <span className={`inline-flex px-2 py-1 rounded border text-xs font-medium ${getSituacaoBadge(val)}`}>
          {val}
        </span>
      )
    },
    { 
      header: "Documentos", 
      accessor: "acoes", 
      render: () => (
        <a href="#" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
          Acessar Editais
        </a>
      )
    },
  ];

  return (
    <ContentPage
      title="Concursos e Processos Seletivos"
      description="Acesse os editais, andamentos, convocações e resultados de concursos públicos e processos seletivos simplificados da administração municipal."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/portal" },
        { label: "Recursos Humanos" },
        { label: "Concursos e Seletivos" },
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
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total de Certames</p>
          <p className="text-xl font-semibold text-gray-800 tabular-nums">{filteredData.length}</p>
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Vagas Ofertadas (Filtro)</p>
          <p className="text-xl font-semibold text-gray-900 tabular-nums">
            {filteredData.reduce((acc, curr) => acc + curr.vagas, 0)}
          </p>
        </div>
      </div>

      <DataTable 
        title="Relação de Concursos e Processos Seletivos"
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
          A publicação das informações referentes a concursos públicos e processos seletivos simplificados atende 
          ao princípio constitucional da publicidade (Art. 37 da Constituição Federal) e obedece às diretrizes do 
          Programa Nacional de Transparência Pública (PNTP). Na aba "Acessar Editais", o cidadão poderá acompanhar 
          as publicações oficiais, erratas, relação de inscritos, resultados parciais/finais e atos de nomeação/convocação.
        </p>
      </div>
    </ContentPage>
  );
}
