"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "ano", label: "Ano", type: "select", options: [{ value: "2026", label: "2026" }] },
  { name: "situacao", label: "Situação", type: "select", options: [{ value: "em_andamento", label: "Em andamento" }, { value: "concluida", label: "Concluída" }, { value: "paralisada", label: "Paralisada" }] },
];

const mockData = [
  { id: 1, objeto: "Construção de Praça Pública", contratada: "Engenharia Beta", situacao: "Em andamento", data_inicio: "10/01/2026", data_fim: "10/08/2026", percentual: "45%", valor_total: 350000.00, valor_pago: 150000.00 },
];

const columns = [
  { header: "Objeto", accessor: "objeto" },
  { header: "Contratada", accessor: "contratada" },
  { header: "Início", accessor: "data_inicio" },
  { header: "Previsão Fim", accessor: "data_fim" },
  { header: "Situação", accessor: "situacao", render: (val: string) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
      val === 'Em andamento' ? 'bg-blue-100 text-blue-800' :
      val === 'Concluída' ? 'bg-green-100 text-green-800' :
      'bg-red-100 text-red-800'
    }`}>{val}</span>
  )},
  { header: "Evolução", accessor: "percentual" },
  { header: "Valor Total (R$)", accessor: "valor_total", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { header: "Valor Pago (R$)", accessor: "valor_pago", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
];

export default function ObrasPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  return (
    <ContentPage
      title="Obras Públicas"
      description="Acompanhe o andamento das obras públicas municipais, com informações sobre a execução física e financeira, prazos e empresas contratadas."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Compras, Contratos e Convênios" },
        { label: "Obras" },
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
          title="Relação de Obras"
          columns={columns}
          data={mockData}
          exportable={true}
        />
      </div>
    </ContentPage>
  );
}
