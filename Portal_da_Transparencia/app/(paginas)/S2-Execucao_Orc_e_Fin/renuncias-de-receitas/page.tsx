"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "ano", label: "Ano", type: "select", options: [{ value: "2026", label: "2026" }] },
  { name: "tributo", label: "Tributo/Imposto", type: "select", options: [{ value: "IPTU", label: "IPTU" }, { value: "ISS", label: "ISS" }] },
  { name: "beneficiario", label: "Beneficiário", type: "search", placeholder: "Nome do beneficiário" },
];

const mockData = [
  { id: 1, ano: "2026", tributo: "IPTU", lei: "Lei Municipal 1.234/2025", beneficiario: "Associação Comunitária Alfa", valor_renuncia: 15000.00, justificativa: "Isenção para entidades sem fins lucrativos" },
  { id: 2, ano: "2026", tributo: "ISS", lei: "Lei Complementar 05/2024", beneficiario: "Cooperativa de Artesãos", valor_renuncia: 8500.00, justificativa: "Incentivo fiscal ao artesanato local" },
];

const columns = [
  { header: "Ano", accessor: "ano" },
  { header: "Tributo/Imposto", accessor: "tributo" },
  { header: "Ato Concessório (Lei)", accessor: "lei" },
  { header: "Beneficiário", accessor: "beneficiario" },
  { header: "Justificativa/Finalidade", accessor: "justificativa" },
  { header: "Valor da Renúncia (R$)", accessor: "valor_renuncia", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
];

export default function RenunciasReceitaPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  return (
    <ContentPage
      title="Renúncias de Receita"
      description="Transparência sobre as desonerações tributárias, isenções e incentivos fiscais concedidos pelo município, detalhando os beneficiários e o embasamento legal."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Execução Orçamentária e Financeira" },
        { label: "Renúncias de Receita" },
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
          title="Desonerações e Incentivos Fiscais"
          columns={columns}
          data={mockData}
          exportable={true}
        />
      </div>
    </ContentPage>
  );
}
