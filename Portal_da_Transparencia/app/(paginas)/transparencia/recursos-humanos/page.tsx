"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "mes_ano", label: "Mês/Ano", type: "select", options: [{ value: "05/2026", label: "Maio/2026" }] },
  { name: "vinculo", label: "Vínculo", type: "select", options: [{ value: "efetivo", label: "Efetivo" }, { value: "comissionado", label: "Comissionado" }, { value: "terceirizado", label: "Terceirizado" }] },
  { name: "busca", label: "Servidor", type: "search", placeholder: "Nome do Servidor ou Matrícula" },
];

const mockData = [
  { id: 1, matricula: "1001", nome: "João da Silva", cargo: "Analista Administrativo", lotacao: "Secretaria de Finanças", vinculo: "Efetivo", admissao: "10/01/2015", carga: "40h", remuneracao: 4500.00 },
  { id: 2, matricula: "1002", nome: "Maria de Oliveira", cargo: "Assessora Técnica", lotacao: "Gabinete do Prefeito", vinculo: "Comissionado", admissao: "01/01/2025", carga: "40h", remuneracao: 6000.00 },
];

const columns = [
  { header: "Matrícula", accessor: "matricula" },
  { header: "Nome", accessor: "nome" },
  { header: "Cargo/Função", accessor: "cargo" },
  { header: "Lotação", accessor: "lotacao" },
  { header: "Vínculo", accessor: "vinculo" },
  { header: "Admissão", accessor: "admissao" },
  { header: "Carga Horária", accessor: "carga" },
  { header: "Remuneração Bruta (R$)", accessor: "remuneracao", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
];

export default function RecursosHumanosPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  return (
    <ContentPage
      title="Recursos Humanos e Remunerações"
      description="Consulte a relação nominal de servidores públicos, estagiários e terceirizados, detalhando cargos, lotação, carga horária e remuneração."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Gestão de Pessoas" },
        { label: "Recursos Humanos" },
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
          title="Relação de Servidores"
          columns={columns}
          data={mockData}
          exportable={true}
        />
      </div>
    </ContentPage>
  );
}
