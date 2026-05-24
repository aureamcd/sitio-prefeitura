"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "ano", label: "Ano", type: "select", options: [{ value: "2026", label: "2026" }] },
  { name: "busca", label: "Convenente/Concedente", type: "search", placeholder: "Nome ou CNPJ" },
];

const mockData = [
  { id: 1, numero: "01/2026", tipo: "Recebido", concedente: "Ministério da Saúde", objeto: "Aquisição de equipamentos hospitalares", vigencia: "01/01/2026 a 31/12/2026", valor_previsto: 250000.00, valor_recebido: 100000.00, link: "#" },
];

const columns = [
  { header: "Número/Ano", accessor: "numero" },
  { header: "Tipo", accessor: "tipo" },
  { header: "Concedente/Convenente", accessor: "concedente" },
  { header: "Objeto", accessor: "objeto" },
  { header: "Vigência", accessor: "vigencia" },
  { header: "Valor Previsto (R$)", accessor: "valor_previsto", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { header: "Valor Repassado (R$)", accessor: "valor_recebido", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { header: "Íntegra", accessor: "link", render: (val: string) => <a href={val} className="text-blue-600 hover:underline">Ver Instrumento</a> },
];

export default function ConveniosPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  return (
    <ContentPage
      title="Convênios e Transferências"
      description="Consulte os convênios, acordos e termos de parceria firmados pela prefeitura, com indicação dos recursos transferidos ou recebidos."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Compras, Contratos e Convênios" },
        { label: "Convênios" },
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
          title="Relação de Convênios"
          columns={columns}
          data={mockData}
          exportable={true}
        />
      </div>
    </ContentPage>
  );
}
