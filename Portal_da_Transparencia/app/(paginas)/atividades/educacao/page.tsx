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
  ExternalLink,
  Heart,
  Home,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const VAGAS_CREVHE = [
  { protocolo: 'CREC-2026-001', crianca: 'Criança #001', idade: '2 anos', responsavel: 'Responsável #001', bairro: 'Centro', data_inscricao: '10/01/2026', prioridade: 'Prioritário', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-002', crianca: 'Criança #002', idade: '1 ano', responsavel: 'Responsável #002', bairro: 'São Francisco', data_inscricao: '15/01/2026', prioridade: 'Prioritário', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-003', crianca: 'Criança #003', idade: '3 anos', responsavel: 'Responsável #003', bairro: 'Santa Teresinha', data_inscricao: '22/01/2026', prioridade: 'Prioritário', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-004', crianca: 'Criança #004', idade: '2 anos', responsavel: 'Responsável #004', bairro: 'Centro', data_inscricao: '05/02/2026', prioridade: 'Eletivo', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-005', crianca: 'Criança #005', idade: '1 ano', responsavel: 'Responsável #005', bairro: 'São Francisco', data_inscricao: '12/02/2026', prioridade: 'Eletivo', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-006', crianca: 'Criança #006', idade: '3 anos', responsavel: 'Responsável #006', bairro: 'Zona Rural', data_inscricao: '20/02/2026', prioridade: 'Prioritário', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-007', crianca: 'Criança #007', idade: '0-11 meses', responsavel: 'Responsável #007', bairro: 'Centro', data_inscricao: '28/02/2026', prioridade: 'Prioritário', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-008', crianca: 'Criança #008', idade: '2 anos', responsavel: 'Responsável #008', bairro: 'Zona Rural', data_inscricao: '07/03/2026', prioridade: 'Eletivo', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-009', crianca: 'Criança #009', idade: '1 ano', responsavel: 'Responsável #009', bairro: 'Santa Teresinha', data_inscricao: '14/03/2026', prioridade: 'Eletivo', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-010', crianca: 'Criança #010', idade: '3 anos', responsavel: 'Responsável #010', bairro: 'São Francisco', data_inscricao: '21/03/2026', prioridade: 'Prioritário', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-011', crianca: 'Criança #011', idade: '2 anos', responsavel: 'Responsável #011', bairro: 'Centro', data_inscricao: '01/04/2026', prioridade: 'Eletivo', situacao: 'Aguardando' },
  { protocolo: 'CREC-2026-012', crianca: 'Criança #012', idade: '0-11 meses', responsavel: 'Responsável #012', bairro: 'Zona Rural', data_inscricao: '10/04/2026', prioridade: 'Prioritário', situacao: 'Aguardando' },
];

const PLANEJAMENTO_EDUCACAO = [
  { documento: 'Plano Municipal de Educação 2025-2035', tipo: 'Plano', ano: '2025-2035', situacao: 'Vigente' },
  { documento: 'Relatório de Monitoramento do PME 2025', tipo: 'Relatório', ano: '2025', situacao: 'Aprovado' },
  { documento: 'Relatório de Monitoramento do PME 2024', tipo: 'Relatório', ano: '2024', situacao: 'Aprovado' },
  { documento: 'Programação Anual da Educação 2026', tipo: 'Programação', ano: '2026', situacao: 'Em execução' },
  { documento: 'Relatório de Resultados e Metas 2023-2025', tipo: 'Relatório', ano: '2023-2025', situacao: 'Aprovado' },
];

// Removed Conselhos mock data

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function DeclaracaoInexistencia({
  titulo,
  descricao,
  icon: Icon,
}: {
  titulo: string;
  descricao: string;
  icon: React.ElementType;
}) {
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

// ---------------------------------------------------------------------------
// Tab 1: Vagas em Creches (Critério 19.2)
// ---------------------------------------------------------------------------

function VagasCrechesTab({ filters }: { filters: FilterValues }) {
  const vagasFiltradas = useMemo(() => {
    let list = [...VAGAS_CREVHE];
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      list = list.filter(v =>
        v.bairro.toLowerCase().includes(q) ||
        v.prioridade.toLowerCase().includes(q) ||
        v.protocolo.toLowerCase().includes(q) ||
        v.situacao.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filters.busca]);

  const totalAguardando = VAGAS_CREVHE.length;
  const totalPrioritario = VAGAS_CREVHE.filter(v => v.prioridade === 'Prioritário').length;

  return (
    <div>
      {/* Alerta de atualização */}
      <div className="mt-6 mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>Prazo de atualização:</strong> A lista de espera deve ser atualizada a cada 30 dias, no máximo.
            Última atualização: {getTodayDate()}
          </p>
        </div>
      </div>

      {/* Aviso de privacidade */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Em conformidade com a LGPD, os nomes das crianças e responsáveis foram ocultados.
            A identificação é feita exclusivamente pelo número de protocolo.
          </p>
        </div>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total na Fila</p>
          <p className="text-2xl font-extrabold text-amber-700 tabular-nums mt-1">{totalAguardando}</p>
          <p className="text-[11px] text-gray-400 mt-1">crianças aguardando</p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Prioritários</p>
          <p className="text-2xl font-extrabold text-red-700 tabular-nums mt-1">{totalPrioritario}</p>
          <p className="text-[11px] text-gray-400 mt-1">por critério legal</p>
        </div>
        <div className="bg-white border border-blue-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Faixa etária predominante</p>
          <p className="text-lg font-extrabold text-blue-700 mt-1">1 a 2 anos</p>
          <p className="text-[11px] text-gray-400 mt-1">maior demanda</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Critérios de Priorização</p>
          <p className="text-[11px] font-semibold text-emerald-700 mt-1">Renda ≤ ½ salário mínimo · Família monoparental</p>
          <p className="text-[11px] text-gray-400 mt-1">Deficiência · Situação de risco social</p>
        </div>
      </div>

      <DataTable
        columns={[
          { header: 'Protocolo', accessor: 'protocolo', render: (v: string) => <span className="font-mono text-xs font-semibold text-blue-700">{v}</span> },
          { header: 'Criança', accessor: 'crianca', render: (v: string) => <span className="text-sm font-medium text-gray-800">{v}</span> },
          { header: 'Idade', accessor: 'idade' },
          { header: 'Bairro', accessor: 'bairro' },
          { header: 'Data Inscrição', accessor: 'data_inscricao' },
          { header: 'Prioridade', accessor: 'prioridade', render: (v: string) => (
            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              v === 'Prioritário' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
            }`}>{v}</span>
          )},
          { header: 'Situação', accessor: 'situacao', render: (v: string) => (
            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">{v}</span>
          )},
        ]}
        data={vagasFiltradas}
        title="Lista de Espera — Vagas em Creches"
        caption="Relação das crianças aguardando vaga em creche municipal, ordenada por ordem de inscrição, com indicação dos critérios de priorização."
        exportable
        paginationResetKey={filters.busca || 'c'}
        hasActiveFilters={!!filters.busca}
      />

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Critério 19.2 — Vagas em Creches</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Exige lista de espera ordenada para vagas em creches, com critérios de priorização e
          atualização máxima a cada 30 dias. Na ausência de fila de espera ou de creches próprias,
          é obrigatória a declaração expressa de inexistência para não zerar o critério.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Planejamento da Educação (Critério 19.1)
// ---------------------------------------------------------------------------

function PlanejamentoEducacaoTab() {
  return (
    <div className="mt-6">
      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-blue-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Plano Municipal de Educação</p>
          <p className="text-sm font-extrabold text-blue-700 mt-1">2025-2035</p>
          <p className="text-[11px] text-gray-400 mt-1">Decenal — Lei Municipal nº XXX/2025</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Situação</p>
          <p className="text-sm font-extrabold text-emerald-700 mt-1">Vigente</p>
          <p className="text-[11px] text-gray-400 mt-1">Monitoramento anual</p>
        </div>
        <div className="bg-white border border-purple-100 rounded-xl p-4 text-center shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Relatórios Publicados</p>
          <p className="text-2xl font-extrabold text-purple-700 tabular-nums mt-1">2</p>
          <p className="text-[11px] text-gray-400 mt-1">2024 · 2025</p>
        </div>
      </div>

      <DataTable
        columns={[
          { header: 'Documento', accessor: 'documento', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
          { header: 'Tipo', accessor: 'tipo', render: (v: string) => (
            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              v === 'Plano' ? 'bg-blue-100 text-blue-800' : v === 'Programação' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
            }`}>{v}</span>
          )},
          { header: 'Período', accessor: 'ano' },
          { header: 'Situação', accessor: 'situacao', render: (v: string) => (
            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              v === 'Vigente' || v === 'Em execução' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>{v}</span>
          )},
          { header: 'Anexo', accessor: 'documento', render: () => (
            <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
              <FileText size={13} /> PDF
            </button>
          )},
        ]}
        data={PLANEJAMENTO_EDUCACAO}
        title="Planejamento da Educação"
        caption="Documentos oficiais de planejamento educacional: Plano Municipal de Educação (PME), relatórios de monitoramento e programação anual."
        exportable
      />

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Critério 19.1 — Planejamento da Educação</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Exige a disponibilização do Plano Municipal de Educação (PME) e dos relatórios de
          monitoramento/resultados em formato PDF pesquisável (com OCR).
        </p>
      </div>
    </div>
  );
}

// ConselhosTab removido

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function EducacaoPage() {
  const [activeTab, setActiveTab] = useState<'creches' | 'planejamento'>('creches');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '' });

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
  }, []);

  const ANOS = [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
  ];

  return (
    <ContentPage
      showSearch={false}
      title="Educação"
      description="Informações sobre as políticas públicas de educação do município — conforme Dimensão 19 do PNTP 2026."
      breadcrumb={[
        { label: 'Início', href: '/' },
        { label: 'Atividades Finalísticas' },
        { label: 'Educação' },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Secretaria Municipal de Educação"
    >
      {/* Filter Panel */}
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      />

      {/* Abas */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
        <button onClick={() => setActiveTab('creches')} role="tab"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'creches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Home size={16} /> Vagas em Creches
        </button>
        <button onClick={() => setActiveTab('planejamento')} role="tab"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'planejamento' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <BookOpen size={16} /> Planejamento da Educação
        </button>
      </div>

      {/* Conteúdo */}
      {activeTab === 'creches' && <VagasCrechesTab filters={filters} />}
      {activeTab === 'planejamento' && <PlanejamentoEducacaoTab />}

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Fundamentação Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A divulgação das informações de educação atende ao disposto na Lei nº 9.394/1996 (LDB),
          Lei nº 11.494/2007 (Fundeb), Lei nº 12.527/2011 (LAI), LC nº 131/2009 e aos
          Critérios 19.1 e 19.2 do PNTP 2026 (Plano Nacional de Transparência Pública) — TCE-PI.
          A identidade das crianças na fila de espera é preservada em conformidade com a LGPD (Lei nº 13.709/2018).
        </p>
      </div>
    </ContentPage>
  );
}
