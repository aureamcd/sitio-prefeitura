"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "ano", label: "Ano", type: "select", options: [{ value: "2026", label: "2026" }] },
  { name: "busca", label: "Contratado", type: "search", placeholder: "Nome ou CNPJ do Contratado" },
];

const mockData = [
  { id: 1, numero: "015/2026", contratado: "Construtora Alfa (98.765.432/0001-10)", objeto: "Reforma de escola municipal", vigencia: "15/02/2026 a 15/12/2026", valor: 120000.00, aditivos: "0", fiscal: "João da Silva", link: "#" },
];

const columns = [
  { header: "Número", accessor: "numero" },
  { header: "Contratado (CNPJ)", accessor: "contratado" },
  { header: "Objeto", accessor: "objeto" },
  { header: "Vigência", accessor: "vigencia" },
  { header: "Valor (R$)", accessor: "valor", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { header: "Aditivos", accessor: "aditivos" },
  { header: "Fiscal do Contrato", accessor: "fiscal" },
  { header: "Íntegra", accessor: "link", render: (val: string) => <a href={val} className="text-blue-600 hover:underline">Ver Contrato</a> },
];

export default function ContratosPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  return (
    <ContentPage
      title="Contratos"
      description="Consulte os contratos firmados pela Prefeitura Municipal, incluindo os respectivos aditivos, valores, prazos de vigência e fiscais designados."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Compras, Contratos e Convênios" },
        { label: "Contratos" },
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
          title="Relação de Contratos"
          columns={columns}
          data={mockData}
          exportable={true}
        />
      </div>
    </ContentPage>
  );
}
