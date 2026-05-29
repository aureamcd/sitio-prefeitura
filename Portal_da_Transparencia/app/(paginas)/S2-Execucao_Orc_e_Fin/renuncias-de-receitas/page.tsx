'use client';

import { useState, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { useAvailableYears } from '@/lib/supabase/client';
import {
  BadgePercent,
  Palette,
  AlertCircle,
} from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

// ============================================================================
// Helpers
// ============================================================================
function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getEspecieBadge(especie: string) {
  const e = especie.toLowerCase();
  if (e.includes('isenção') || e.includes('isencao')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (e.includes('anistia')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (e.includes('remissão') || e.includes('remissao')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (e.includes('subsídio') || e.includes('subsidio')) return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

// ============================================================================
// Mock Data: Aba 1 — Desonerações e Benefícios Fiscais
// ============================================================================
interface Desoneracao {
  especie: string;
  fundamentacao_legal: string;
  beneficiario: string;
  cpf_cnpj: string;
  valor_previsto: number;
  valor_realizado: number;
  exercicio: string;
}

const MOCK_DESONERACOES: Desoneracao[] = [
  {
    especie: 'Isenção',
    fundamentacao_legal: 'Lei Municipal nº 1.247/2024, de 12/01/2024',
    beneficiario: 'Associação de Moradores do Bairro Jardim Esperança',
    cpf_cnpj: '11.223.344/0001-55',
    valor_previsto: 4500.00,
    valor_realizado: 4200.00,
    exercicio: '2026',
  },
  {
    especie: 'Isenção',
    fundamentacao_legal: 'Lei Municipal nº 1.290/2024, de 30/10/2024',
    beneficiario: 'Igreja Evangélica Assembleia de Deus – Congregação Central',
    cpf_cnpj: '33.445.566/0001-77',
    valor_previsto: 3500.00,
    valor_realizado: 3150.00,
    exercicio: '2026',
  },
  {
    especie: 'Anistia',
    fundamentacao_legal: 'Lei Municipal nº 1.312/2025, de 05/03/2025',
    beneficiario: 'Cooperativa de Trabalho dos Profissionais de Saúde do Piauí – COOPSA',
    cpf_cnpj: '22.334.455/0001-66',
    valor_previsto: 12000.00,
    valor_realizado: 9800.00,
    exercicio: '2026',
  },
  {
    especie: 'Subsídio',
    fundamentacao_legal: 'Lei Municipal nº 1.275/2024, de 15/06/2024',
    beneficiario: 'Empresa de Transporte Urbano Padre Marcos Ltda.',
    cpf_cnpj: '44.556.677/0001-88',
    valor_previsto: 28000.00,
    valor_realizado: 26150.00,
    exercicio: '2026',
  },
  {
    especie: 'Remissão',
    fundamentacao_legal: 'Decreto Municipal nº 892/2025, de 20/06/2025',
    beneficiario: 'Maria José Alves da Silva',
    cpf_cnpj: '123.456.789-00',
    valor_previsto: 1540.00,
    valor_realizado: 1540.00,
    exercicio: '2025',
  },
  {
    especie: 'Isenção',
    fundamentacao_legal: 'Lei Municipal nº 1.335/2025, de 10/02/2025',
    beneficiario: 'Instituto Cultural Nossa Terra',
    cpf_cnpj: '55.667.788/0001-99',
    valor_previsto: 8900.00,
    valor_realizado: 7120.00,
    exercicio: '2025',
  },
  {
    especie: 'Anistia',
    fundamentacao_legal: 'Lei Municipal nº 1.290/2024, de 30/10/2024',
    beneficiario: 'Auto Posto Padre Marcos Ltda.',
    cpf_cnpj: '66.778.899/0001-11',
    valor_previsto: 6200.00,
    valor_realizado: 4950.00,
    exercicio: '2025',
  },
  {
    especie: 'Subsídio',
    fundamentacao_legal: 'Lei Municipal nº 1.348/2025, de 12/08/2025',
    beneficiario: 'Feira do Produtor Rural de Padre Marcos',
    cpf_cnpj: '77.889.900/0001-22',
    valor_previsto: 15000.00,
    valor_realizado: 14300.00,
    exercicio: '2025',
  },
  {
    especie: 'Isenção',
    fundamentacao_legal: 'Lei Municipal nº 1.247/2024, de 12/01/2024',
    beneficiario: 'Lar do Idoso São Francisco de Assis',
    cpf_cnpj: '88.990.011/0001-33',
    valor_previsto: 5600.00,
    valor_realizado: 5600.00,
    exercicio: '2024',
  },
];

// ============================================================================
// Mock Data: Aba 2 — Projetos de Incentivo à Cultura e Esporte
// ============================================================================
interface Incentivo {
  beneficiario: string;
  descricao_objeto: string;
  valor_aprovado: number;
  exercicio: string;
}

const MOCK_INCENTIVOS: Incentivo[] = [
  {
    beneficiario: 'Associação Cultural e Artística de Padre Marcos',
    descricao_objeto: 'Realização da Festa do Padroeiro São Marcos — programação cultural com shows, teatro e exposições',
    valor_aprovado: 35000.00,
    exercicio: '2026',
  },
  {
    beneficiario: 'Liga Desportiva Padre-Marquense',
    descricao_objeto: 'Campeonato Municipal de Futebol Amador 2026 — organização, arbitragem e premiação',
    valor_aprovado: 18500.00,
    exercicio: '2026',
  },
  {
    beneficiario: 'Banda Filarmônica Municipal',
    descricao_objeto: 'Aquisição de instrumentos musicais e uniformes para apresentações cívicas e culturais',
    valor_aprovado: 12000.00,
    exercicio: '2026',
  },
  {
    beneficiario: 'Grupo de Capoeira Raízes do Sertão',
    descricao_objeto: 'Oficinas de capoeira e dança afro-brasileira para crianças e adolescentes',
    valor_aprovado: 8000.00,
    exercicio: '2026',
  },
  {
    beneficiario: 'Produtor Cultural João Batista de Oliveira',
    descricao_objeto: 'Publicação do livro "História e Memória de Padre Marcos" — edição ilustrada',
    valor_aprovado: 15000.00,
    exercicio: '2025',
  },
  {
    beneficiario: 'Escola de Futebol Meninos do Amanhã',
    descricao_objeto: 'Reforma de quadra poliesportiva no bairro Novo Horizonte',
    valor_aprovado: 22000.00,
    exercicio: '2025',
  },
  {
    beneficiario: 'Associação dos Artesãos de Padre Marcos',
    descricao_objeto: 'Feira de Artesanato e Gastronomia Regional — espaço de exposição e venda',
    valor_aprovado: 9500.00,
    exercicio: '2025',
  },
];

// ============================================================================
// Tab: Desonerações e Benefícios Fiscais (Aba 1)
// ============================================================================
function DesoneracoesTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const filteredData = useMemo(() => {
    const term = filters.busca.toLowerCase().trim();
    let items = MOCK_DESONERACOES;

    if (filters.ano) {
      items = items.filter(r => r.exercicio === filters.ano);
    }
    if (term) {
      items = items.filter(r =>
        r.beneficiario.toLowerCase().includes(term) ||
        r.cpf_cnpj.includes(term) ||
        r.especie.toLowerCase().includes(term)
      );
    }
    return items;
  }, [filters.ano, filters.busca]);

  const totalPrevisto = filteredData.reduce((s, r) => s + r.valor_previsto, 0);
  const totalRealizado = filteredData.reduce((s, r) => s + r.valor_realizado, 0);
  const percentualRealizado = totalPrevisto > 0 ? (totalRealizado / totalPrevisto) * 100 : 0;

  const columns = [
    {
      header: 'Espécie / Tipo',
      accessor: 'especie',
      render: (val: string) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wide ${getEspecieBadge(val)}`}>
          {val}
        </span>
      ),
    },
    {
      header: 'Fundamentação Legal',
      accessor: 'fundamentacao_legal',
      render: (val: string) => (
        <div className="max-w-[220px]">
          <span className="text-sm text-gray-600 leading-snug" title={val}>{val}</span>
        </div>
      ),
    },
    {
      header: 'Beneficiário',
      accessor: 'beneficiario',
      render: (val: string, row: Desoneracao) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{val}</p>
          <p className="text-xs font-mono text-gray-500 mt-0.5">{row.cpf_cnpj}</p>
        </div>
      ),
    },
    {
      header: 'Valor Previsto',
      accessor: 'valor_previsto',
      render: (val: number) => (
        <span className="block text-right text-sm font-medium text-gray-700 tabular-nums">
          {formatBRL(val)}
        </span>
      ),
    },
    {
      header: 'Valor Realizado',
      accessor: 'valor_realizado',
      render: (val: number, row: Desoneracao) => {
        const diff = row.valor_previsto - val;
        const percent = row.valor_previsto > 0 ? (val / row.valor_previsto) * 100 : 0;
        return (
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900 tabular-nums">
              {formatBRL(val)}
            </span>
            <span className="text-[10px] text-gray-400">
              {percent.toFixed(0)}% · Dif: {formatBRL(diff)}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Dashboard summary */}
      <div className="mt-4 mb-4 mx-auto bg-white border border-amber-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-amber-800 uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
          Exercício {filters.ano || 'Geral'}
        </span>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full relative z-10">
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Valor Previsto</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalPrevisto)}</p>
          </div>
          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-red-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-red-600/70 uppercase tracking-wider mb-1">Valor Realizado</p>
            <p className="text-xl sm:text-2xl font-extrabold text-red-600 tabular-nums">{formatBRL(totalRealizado)}</p>
          </div>
          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-amber-200 to-transparent" />
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-emerald-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">% Realizado</p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 tabular-nums">
              {percentualRealizado.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 w-full flex justify-center">
          <span className="text-xs text-gray-400">
            {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''} — Diferença total: {formatBRL(totalPrevisto - totalRealizado)}
          </span>
        </div>
      </div>

      <DataTable
        title={`Desonerações e Benefícios Fiscais — ${filters.ano || 'Todos os exercícios'}`}
        columns={columns}
        data={filteredData}
        exportable={true}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        caption="Isenções, anistias, remissões e subsídios concedidos pelo município nos termos dos critérios 16.1, 16.2 e 16.3 do PNTP 2026."
      />
    </div>
  );
}

// ============================================================================
// Tab: Projetos de Incentivo à Cultura e Esporte (Aba 2)
// ============================================================================
function IncentivosTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const filteredData = useMemo(() => {
    const term = filters.busca.toLowerCase().trim();
    let items = MOCK_INCENTIVOS;

    if (filters.ano) {
      items = items.filter(r => r.exercicio === filters.ano);
    }
    if (term) {
      items = items.filter(r =>
        r.beneficiario.toLowerCase().includes(term) ||
        r.descricao_objeto.toLowerCase().includes(term)
      );
    }
    return items;
  }, [filters.ano, filters.busca]);

  const totalAprovado = filteredData.reduce((s, r) => s + r.valor_aprovado, 0);

  const columns = [
    {
      header: 'Beneficiário',
      accessor: 'beneficiario',
      render: (val: string) => (
        <span className="text-sm font-semibold text-gray-900">{val}</span>
      ),
    },
    {
      header: 'Descrição do Objeto Aprovado',
      accessor: 'descricao_objeto',
      render: (val: string) => (
        <div className="max-w-[350px]">
          <span
            className="text-sm text-gray-600 leading-snug block"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={val}
          >
            {val}
          </span>
        </div>
      ),
    },
    {
      header: 'Valor Aprovado',
      accessor: 'valor_aprovado',
      render: (val: number) => (
        <span className="block text-right text-sm font-bold text-purple-700 tabular-nums">
          {formatBRL(val)}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Mini dashboard */}
      <div className="mt-4 mb-4 mx-auto bg-white border border-purple-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-purple-800 uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block animate-pulse" />
          Exercício {filters.ano || 'Geral'}
        </span>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-10 w-full relative z-10">
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-purple-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-purple-600/70 uppercase tracking-wider mb-1">Total Aprovado</p>
            <p className="text-xl sm:text-2xl font-extrabold text-purple-700 tabular-nums">{formatBRL(totalAprovado)}</p>
          </div>
          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-purple-200 to-transparent" />
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Projetos</p>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{filteredData.length}</p>
          </div>
        </div>
      </div>

      <DataTable
        title={`Projetos de Incentivo à Cultura e Esporte — ${filters.ano || 'Todos os exercícios'}`}
        columns={columns}
        data={filteredData}
        exportable={true}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        caption="Projetos culturais e esportivos incentivados pelo município nos termos do critério 16.4 do PNTP 2026."
      />
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function RenunciasDeReceitasPage() {
  const { anos: ANOS } = useAvailableYears('renuncias');
  const [activeTab, setActiveTab] = useState<'desoneracoes' | 'incentivos'>('desoneracoes');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '', entidade: '' });

  const handleChange = (field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => setFilters({ ano: '', mes: '', busca: '', entidade: '' });

  const filterKey = `${filters.ano}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.busca);

  return (
    <ContentPage
      title="Renúncias de Receita"
      description="Isenções, anistias, remissões e subsídios tributários concedidos pelo município, incluindo projetos de incentivo à cultura e ao esporte, publicados em conformidade com o PNTP 2026 e a Lei de Responsabilidade Fiscal."
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      >
        <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
          <AlertCircle size={14} />
          Filtro por ano e beneficiário obrigatórios conforme critérios 16.1–16.4
        </p>
      </FilterPanel>

      {/* ═══════ ABAS ═══════ */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist" aria-label="Seções de renúncias de receita">
        <button
          onClick={() => setActiveTab('desoneracoes')}
          role="tab"
          aria-selected={activeTab === 'desoneracoes'}
          aria-controls="panel-desoneracoes"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'desoneracoes'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BadgePercent size={16} aria-hidden="true" />
          Desonerações e Benefícios Fiscais
        </button>
        <button
          onClick={() => setActiveTab('incentivos')}
          role="tab"
          aria-selected={activeTab === 'incentivos'}
          aria-controls="panel-incentivos"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'incentivos'
              ? 'border-purple-500 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Palette size={16} aria-hidden="true" />
          Incentivo à Cultura e Esporte
        </button>
      </div>

      {/* Aba 1: Desonerações e Benefícios Fiscais */}
      {activeTab === 'desoneracoes' && (
        <div id="panel-desoneracoes" role="tabpanel" aria-labelledby="tab-desoneracoes">
          <DesoneracoesTab
            filters={filters}
            filterKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Aba 2: Incentivo à Cultura e Esporte */}
      {activeTab === 'incentivos' && (
        <div id="panel-incentivos" role="tabpanel" aria-labelledby="tab-incentivos">
          <IncentivosTab
            filters={filters}
            filterKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Legal note */}
      <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <strong>Nota Legal:</strong> A divulgação das renúncias de receita obedece ao art. 14 da Lei Complementar
        nº 101/2000 (LRF), que exige a estimativa do impacto orçamentário-financeiro, a demonstração de que a
        renúncia foi considerada na Lei de Diretrizes Orçamentárias e a adoção de medidas compensatórias.
        Os projetos de incentivo à cultura e ao esporte seguem os critérios do PNTP 2026 – TCE-PI (item 16.4).
        Informações atualizadas conforme dados fornecidos pela Secretaria Municipal de Finanças.
      </div>
    </ContentPage>
  );
}
