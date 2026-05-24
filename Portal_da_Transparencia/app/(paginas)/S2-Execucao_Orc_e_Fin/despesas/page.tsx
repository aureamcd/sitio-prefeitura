"use client";

import { useState } from "react";
import ContentPage from "@/components/layout/ContentPage";
import DataTable from "@/components/ui/DataTable";
import FilterPanel, { FilterConfig } from "@/components/ui/FilterPanel";

const filtersConfig: FilterConfig[] = [
  { name: "ano", label: "Exercício (Ano)", type: "select", options: [{ value: "2026", label: "2026" }, { value: "2025", label: "2025" }] },
  { name: "mes", label: "Mês", type: "select", options: [{ value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }] },
  { name: "fase", label: "Fase da Despesa", type: "select", options: [{ value: "empenho", label: "Empenho" }, { value: "liquidacao", label: "Liquidação" }, { value: "pagamento", label: "Pagamento" }] },
  { name: "orgao", label: "Órgão / Secretaria", type: "select", options: [{ value: "saude", label: "Secretaria de Saúde" }, { value: "educacao", label: "Secretaria de Educação" }] },
  { name: "credor", label: "Credor/Fornecedor", type: "search", placeholder: "Nome ou CNPJ/CPF" },
];

const mockData = [
  { id: 1, data: "10/01/2026", orgao: "Secretaria de Saúde", fase: "Empenho", numero: "2026NE00001", credor: "Farmacêutica LTDA (12.345.678/0001-90)", objeto: "Aquisição de medicamentos básicos", valor: 50000.00 },
  { id: 2, data: "15/01/2026", orgao: "Secretaria de Saúde", fase: "Liquidação", numero: "2026NL00001", credor: "Farmacêutica LTDA (12.345.678/0001-90)", objeto: "Aquisição de medicamentos básicos", valor: 50000.00 },
  { id: 3, data: "20/01/2026", orgao: "Secretaria de Saúde", fase: "Pagamento", numero: "2026OB00001", credor: "Farmacêutica LTDA (12.345.678/0001-90)", objeto: "Aquisição de medicamentos básicos", valor: 50000.00 },
  { id: 4, data: "05/02/2026", orgao: "Secretaria de Educação", fase: "Empenho", numero: "2026NE00045", credor: "Construtora Alfa (98.765.432/0001-10)", objeto: "Reforma de escola municipal", valor: 120000.00 },
];

const columns = [
  { header: "Data", accessor: "data" },
  { header: "Órgão", accessor: "orgao" },
  { header: "Fase", accessor: "fase", render: (val: string) => (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
      val === 'Empenho' ? 'bg-blue-100 text-blue-800' :
      val === 'Liquidação' ? 'bg-yellow-100 text-yellow-800' :
      'bg-green-100 text-green-800'
    }`}>{val}</span>
  )},
  { header: "Número", accessor: "numero" },
  { header: "Credor", accessor: "credor" },
  { header: "Objeto/Histórico", accessor: "objeto" },
  { header: "Valor (R$)", accessor: "valor", render: (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
];

export default function DespesasPage() {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredData = mockData.filter(item => {
    if (filters.fase && item.fase.toLowerCase() !== filters.fase.toLowerCase()) return false;
    if (filters.orgao && !item.orgao.toLowerCase().includes(filters.orgao.toLowerCase())) return false;
    if (filters.credor && !item.credor.toLowerCase().includes(filters.credor.toLowerCase())) return false;
    return true;
  });

  return (
    <ContentPage
      title="Despesas Públicas"
      description="Consulte a execução das despesas públicas do município, detalhando empenhos, liquidações e pagamentos por credor e classificação orçamentária."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Execução Orçamentária e Financeira" },
        { label: "Despesas" },
      ]}
      lastUpdate="24/05/2026"
    >
      <div className="mt-8">
        <FilterPanel 
          filters={filtersConfig}
          values={filters}
          onChange={handleFilterChange}
          onClear={() => setFilters({})}
        />

        <DataTable 
          title="Relação de Despesas"
          caption="Acompanhamento detalhado das fases da despesa."
          columns={columns}
          data={filteredData}
          exportable={true}
        />
      </div>
    </ContentPage>
  );
}
