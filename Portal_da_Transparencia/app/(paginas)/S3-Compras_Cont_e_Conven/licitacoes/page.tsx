"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "ano", label: "Ano", type: "select", options: [{ value: "2026", label: "2026" }] },
  { name: "modalidade", label: "Modalidade", type: "select", options: [{ value: "pregao_eletronico", label: "Pregão Eletrônico" }, { value: "concorrencia", label: "Concorrência Pública" }, { value: "dispensa", label: "Dispensa" }] },
  { name: "situacao", label: "Situação", type: "select", options: [{ value: "aberta", label: "Aberta" }, { value: "homologada", label: "Homologada" }, { value: "fracassada", label: "Fracassada/Deserta" }] },
  { name: "busca", label: "Objeto", type: "search", placeholder: "Buscar objeto da licitação" },
];

const mockData = [
  { id: 1, numero: "001/2026", modalidade: "Pregão Eletrônico", objeto: "Aquisição de medicamentos para UBS", data_abertura: "15/02/2026", valor_estimado: 150000.00, situacao: "Homologada", link_edital: "#" },
  { id: 2, numero: "002/2026", modalidade: "Concorrência Pública", objeto: "Pavimentação asfáltica de vias urbanas", data_abertura: "10/03/2026", valor_estimado: 1200000.00, situacao: "Aberta", link_edital: "#" },
];

const columns = [
  { header: "Número/Ano", accessor: "numero" },
  { header: "Modalidade", accessor: "modalidade" },
  { header: "Objeto", accessor: "objeto" },
  { header: "Abertura", accessor: "data_abertura" },
  { header: "Valor Estimado (R$)", accessor: "valor_estimado", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { header: "Situação", accessor: "situacao", render: (val: string) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
      val === 'Aberta' ? 'bg-blue-100 text-blue-800' :
      val === 'Homologada' ? 'bg-green-100 text-green-800' :
      'bg-red-100 text-red-800'
    }`}>{val}</span>
  )},
  { header: "Edital", accessor: "link_edital", render: (val: string) => <a href={val} className="text-blue-600 hover:underline">Baixar Edital</a> },
];

export default function LicitacoesPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  return (
    <ContentPage
      title="Licitações"
      description="Consulte os processos licitatórios do município, incluindo editais, anexos, dispensas, inexigibilidades e as atas de registro de preços."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Compras, Contratos e Convênios" },
        { label: "Licitações" },
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
          title="Processos Licitatórios"
          columns={columns}
          data={mockData}
          exportable={true}
        />
      </div>
    </ContentPage>
  );
}
