'use client';

import { useState, useMemo, useCallback } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { getTodayDate } from '@/lib/utils/date';
import {
  BookOpen,
  School,
  Users,
  FileText,
  Info,
  AlertCircle,
  Home,
  Utensils,
  Bus
} from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Mar�o' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

const QUANTIDADE_VAGAS_CRECHE = [
  { creche: 'Creche Municipal Tio Zezito', bairro: 'Centro', vagas_ofertadas: 150, vagas_ocupadas: 140, vagas_disponiveis: 10 },
  { creche: 'Creche Municipal Ideal', bairro: 'S�o Francisco', vagas_ofertadas: 100, vagas_ocupadas: 100, vagas_disponiveis: 0 },
];

const ESCOLAS_MUNICIPAIS = [
  { nome: 'Escola Municipal Francisco', endereco: 'Rua Principal', niveis: 'Ensino Fundamental I', horario: '07h as 17h', telefone: 'N�o possui' },
];

const PLANEJAMENTO_EDUCACAO = [
  { documento: 'Plano Municipal de Educa��o 2025-2035', tipo: 'Plano', ano: '2025-2035', situacao: 'Vigente', arquivo: '/documentos/educacao/pme.pdf' },
];

function DeclaracaoInexistencia({ titulo, descricao, icon: Icon }: { titulo: string; descricao: string; icon: React.ElementType; }) {
  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-16 text-center flex flex-col items-center justify-center bg-gray-50/50">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
          <Icon size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{titulo}</h3>
        <p className="text-sm text-gray-600 max-w-lg leading-relaxed">{descricao}</p>
      </div>
    </div>
  );
}

function VagasCrechesTab() {
  return (
    <div>
      <DeclaracaoInexistencia 
        titulo="Inexist�ncia de Fila de Espera" 
        descricao="Informamos que o munic�pio n�o possui fila de espera para vagas em creches no momento, pois a oferta atual supre a demanda. Abaixo est� o quantitativo atualizado de vagas ofertadas e ocupadas." 
        icon={AlertCircle} 
      />
      <div className="mt-8">
        <DataTable
          columns={[
            { header: 'Creche', accessor: 'creche', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
            { header: 'Bairro', accessor: 'bairro' },
            { header: 'Vagas Ofertadas', accessor: 'vagas_ofertadas' },
            { header: 'Vagas Ocupadas', accessor: 'vagas_ocupadas' },
            { header: 'Vagas Dispon�veis', accessor: 'vagas_disponiveis', render: (v: number) => (
              <span className={`font-semibold ${v > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{v}</span>
            ) },
          ]}
          data={QUANTIDADE_VAGAS_CRECHE}
          title="Quantitativo de Vagas em Creches"
          exportable
        />
      </div>
    </div>
  );
}

function PlanejamentoEducacaoTab() {
  return (
    <div className="mt-6">
      <DataTable
        columns={[
          { header: 'Documento', accessor: 'documento', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
          { header: 'Tipo', accessor: 'tipo' },
          { header: 'Período', accessor: 'ano' },
          { header: 'Situação', accessor: 'situacao' },
          { header: 'Anexo', accessor: 'arquivo', render: (v: string) => v ? (
            <a href={v} target="_blank" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
              <FileText size={13} /> PDF</a>
          ) : null },
        ]}
        data={PLANEJAMENTO_EDUCACAO}
        title="Planejamento da Educação"
        caption="Documentos oficiais de planejamento educacional."
        exportable
      />
    </div>
  );
}

export default function EducacaoPage() {
  const [activeTab, setActiveTab] = useState<'creches' | 'planejamento'>('creches');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '' });

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);
  const handleClear = useCallback(() => setFilters({ ano: '', mes: '', busca: '' }), []);

  return (
    <ContentPage
      showSearch={false}
      title="Educação"
      description="Informações sobre Escolas, Creches, Merenda e Transporte Escolar do município – conforme Dimensão 19 do PNTP 2026."
      breadcrumb={[
        { label: 'Início', href: '/' },
        { label: 'Atividades Finalísticas' },
        { label: 'Educação' },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Secretaria Municipal de Educação"
    >
      <FilterPanel anos={[{ value: '2026', label: '2026' }]} meses={MESES} values={filters} onChange={handleChange} onClear={handleClear} />

      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
        <button onClick={() => setActiveTab('creches')} role="tab"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'creches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Home size={16} /> Vagas em Creches
        </button>
        <button onClick={() => setActiveTab('planejamento')} role="tab"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'planejamento' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <BookOpen size={16} /> Planejamento
        </button>
      </div>

      {activeTab === 'creches' && <VagasCrechesTab />}
      {activeTab === 'planejamento' && <PlanejamentoEducacaoTab />}
    </ContentPage>
  );
}
