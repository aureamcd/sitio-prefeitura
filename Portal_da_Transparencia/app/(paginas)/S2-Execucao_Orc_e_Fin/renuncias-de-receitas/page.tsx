'use client';

import { useState, useCallback } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import { useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import {
  BadgePercent,
  Palette,
  AlertCircle,
  Info,
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
// Componente de inexistência padronizado
// ============================================================================
function DeclaracaoInexistencia({
  titulo,
  descricao,
  icon: Icon,
  colorClass,
}: {
  titulo: string;
  descricao: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  const today = new Date().toLocaleDateString('pt-BR');
  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-16 text-center flex flex-col items-center justify-center bg-gray-50/50">
        <div className={`w-16 h-16 ${colorClass} rounded-full flex items-center justify-center mb-4 border border-gray-200`}>
          <Icon size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{titulo}</h3>
        <p className="text-sm text-gray-600 max-w-lg leading-relaxed">
          {descricao}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <Info size={14} className="text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            Declaração atualizada em {today}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function RenunciasDeReceitasPage() {
  const today = useTodayDate();
  const { anos: ANOS } = useAvailableYears('renuncias');
  const [activeTab, setActiveTab] = useState<'desoneracoes' | 'incentivos'>('desoneracoes');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '', entidade: '' });

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => setFilters({ ano: '', mes: '', busca: '', entidade: '' }), []);

  return (
    <ContentPage
      title="Renúncias de Receita"
      description="Isenções, anistias, remissões e subsídios tributários concedidos pelo município, incluindo projetos de incentivo à cultura e ao esporte, publicados em conformidade com o PNTP 2026 e a Lei de Responsabilidade Fiscal."
      lastUpdate={today}
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

      {/* Aba 1: Desonerações */}
      {activeTab === 'desoneracoes' && (
        <div id="panel-desoneracoes" role="tabpanel">
          <DeclaracaoInexistencia
            titulo="Aviso de Não Ocorrência — Desonerações e Benefícios Fiscais"
            descricao={`No exercício de ${filters.ano || 'referência'}, não foram registradas renúncias de receita decorrentes de isenções, anistias, remissões ou subsídios tributários concedidos pelo município. Os dados serão publicados assim que disponibilizados pela Secretaria Municipal de Finanças.`}
            icon={BadgePercent}
            colorClass="bg-amber-100"
          />
        </div>
      )}

      {/* Aba 2: Incentivos */}
      {activeTab === 'incentivos' && (
        <div id="panel-incentivos" role="tabpanel">
          <DeclaracaoInexistencia
            titulo="Aviso de Não Ocorrência — Incentivo à Cultura e Esporte"
            descricao={`No exercício de ${filters.ano || 'referência'}, não foram registrados projetos de incentivo à cultura e ao esporte com renúncia de receita. Os dados serão publicados assim que disponibilizados pela Secretaria Municipal de Finanças.`}
            icon={Palette}
            colorClass="bg-purple-100"
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
