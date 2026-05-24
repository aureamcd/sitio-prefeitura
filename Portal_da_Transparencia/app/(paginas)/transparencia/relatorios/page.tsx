"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "ano", label: "Ano", type: "select", options: [{ value: "2026", label: "2026" }, { value: "2025", label: "2025" }] },
  { name: "tipo", label: "Tipo de Relatório", type: "select", options: [
    { value: "RREO", label: "RREO - Relatório Resumido da Execução Orçamentária" },
    { value: "RGF", label: "RGF - Relatório de Gestão Fiscal" },
    { value: "PPA", label: "PPA - Plano Plurianual" },
    { value: "LDO", label: "LDO - Lei de Diretrizes Orçamentárias" },
    { value: "LOA", label: "LOA - Lei Orçamentária Anual" },
    { value: "Balanco", label: "Balanço Geral / Prestação de Contas" }
  ]},
];

const mockData = [
  { id: 1, ano: "2026", tipo: "RGF", periodo: "1º Quadrimestre", publicacao: "20/05/2026", descricao: "Relatório de Gestão Fiscal referente ao 1º Quadrimestre de 2026", link: "#" },
  { id: 2, ano: "2026", tipo: "RREO", periodo: "2º Bimestre", publicacao: "20/05/2026", descricao: "Relatório Resumido de Execução Orçamentária referente ao 2º Bimestre de 2026", link: "#" },
  { id: 3, ano: "2026", tipo: "LOA", periodo: "Anual", publicacao: "31/12/2025", descricao: "Lei Orçamentária Anual para o exercício de 2026", link: "#" },
];

const columns = [
  { header: "Ano", accessor: "ano" },
  { header: "Tipo", accessor: "tipo" },
  { header: "Período Referência", accessor: "periodo" },
  { header: "Descrição", accessor: "descricao" },
  { header: "Data Publicação", accessor: "publicacao" },
  { header: "Arquivo", accessor: "link", render: (val: string) => <a href={val} className="text-blue-600 hover:underline">Baixar PDF</a> },
];

export default function RelatoriosContasPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filteredData = mockData.filter(item => {
    if (filters.tipo && item.tipo !== filters.tipo) return false;
    return true;
  });

  return (
    <ContentPage
      title="Planejamento e Prestação de Contas"
      description="Consulte os Relatórios de Gestão Fiscal (RGF), Relatórios Resumidos de Execução Orçamentária (RREO), PPA, LDO, LOA e o Balanço Geral."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Planejamento e Contas" },
        { label: "Relatórios" },
      ]}
      lastUpdate="24/05/2026"
    >
      <div className="mt-8">
        <FilterPanel 
          filters={filtersConfig}
          values={filters}
          onChange={(n, v) => setFilters(p => ({ ...p, [n]: v }))}
          onClear={() => setFilters({})}
        />

        <DataTable 
          title="Documentos de Planejamento e Prestação de Contas"
          columns={columns}
          data={filteredData}
          exportable={true}
        />
      </div>
    </ContentPage>
  );
}
