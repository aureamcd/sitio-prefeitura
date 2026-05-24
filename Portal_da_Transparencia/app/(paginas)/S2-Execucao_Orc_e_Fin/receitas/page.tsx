"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "ano", label: "Exercício (Ano)", type: "select", options: [{ value: "2026", label: "2026" }, { value: "2025", label: "2025" }] },
  { name: "mes", label: "Mês", type: "select", options: [{ value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }] },
  { name: "categoria", label: "Categoria Econômica", type: "select", options: [{ value: "corrente", label: "Receitas Correntes" }, { value: "capital", label: "Receitas de Capital" }] },
  { name: "origem", label: "Origem", type: "select", options: [{ value: "tributaria", label: "Receita Tributária" }, { value: "transferencias", label: "Transferências Correntes" }] },
  { name: "busca", label: "Buscar Receita", type: "search", placeholder: "Ex: IPTU, FPM" },
];

const mockData = [
  { id: 1, data: "15/01/2026", categoria: "Receitas Correntes", origem: "Receita Tributária", especie: "Impostos", rubrica: "IPTU", valor_previsto: 500000.00, valor_arrecadado: 150000.00 },
  { id: 2, data: "20/01/2026", categoria: "Receitas Correntes", origem: "Transferências Correntes", especie: "União", rubrica: "FPM", valor_previsto: 1200000.00, valor_arrecadado: 1250000.00 },
  { id: 3, data: "10/02/2026", categoria: "Receitas de Capital", origem: "Alienação de Bens", especie: "Bens Móveis", rubrica: "Venda de Veículos", valor_previsto: 100000.00, valor_arrecadado: 0.00 },
];

const columns = [
  { header: "Data", accessor: "data" },
  { header: "Categoria Econômica", accessor: "categoria" },
  { header: "Origem", accessor: "origem" },
  { header: "Espécie", accessor: "especie" },
  { header: "Rubrica/Descrição", accessor: "rubrica" },
  { header: "Valor Previsto (R$)", accessor: "valor_previsto", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { header: "Valor Arrecadado (R$)", accessor: "valor_arrecadado", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
];

export default function ReceitasPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Simulação de filtragem
  const filteredData = mockData.filter(item => {
    if (filters.categoria && !item.categoria.toLowerCase().includes(filters.categoria.toLowerCase())) return false;
    if (filters.origem && !item.origem.toLowerCase().includes(filters.origem.toLowerCase())) return false;
    if (filters.busca && !item.rubrica.toLowerCase().includes(filters.busca.toLowerCase())) return false;
    return true;
  });

  return (
    <ContentPage
      title="Receitas"
      description="Acompanhe a previsão e a arrecadação das receitas municipais, detalhadas por categoria econômica, origem e espécie, conforme as exigências do PNTP."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Execução Orçamentária e Financeira" },
        { label: "Receitas" },
      ]}
      lastUpdate="24/05/2026"
    >
      <div className="mt-8">
        <FilterPanel 
          filters={filtersConfig}
          values={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        <DataTable 
          title="Lançamentos de Receita"
          caption="Demonstrativo da arrecadação detalhada"
          columns={columns}
          data={filteredData}
          exportable={true}
          onExport={() => alert('Exportando CSV...')}
          updatedAt="24/05/2026"
        />
      </div>
    </ContentPage>
  );
}
