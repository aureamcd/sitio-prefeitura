'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { useAvailableYears } from '@/lib/supabase/client';
import {
  FileText,
  FileWarning,
  AlertTriangle,
  Info,
  Scale,
  Download,
  Eye,
  FilterX,
} from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

// ============================================================================
// Helper: Declaração de inexistência
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
        <p className="text-sm text-gray-600 max-w-lg leading-relaxed">{descricao}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <Info size={14} className="text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700 font-medium">Declaração atualizada em {today}.</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper
// ============================================================================
function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ============================================================================
// Aba 1: Peças de Planejamento Orçamentário (com dados reais do Supabase)
// ============================================================================
function PlanejamentoTab({
  filters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const [activeSubTab, setActiveSubTab] = useState<'PPA' | 'LDO' | 'LOA'>('PPA');
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchDocs() {
      setLoading(true);
      const { createBrowserClient } = await import('@/lib/supabase/client');
      const supabase = createBrowserClient();
      let q = supabase
        .schema('transparencia')
        .from('planejamento_documentos')
        .select('*')
        .eq('categoria', 'PLANEJAMENTO_ORCAMENTARIO')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .order('data_publicacao', { ascending: false });

      if (filters.ano) {
        q = q.eq('exercicio', parseInt(filters.ano));
      }

      const { data } = await q;
      if (!cancelled) {
        setDocs(data || []);
        setLoading(false);
      }
    }
    fetchDocs();
    return () => { cancelled = true; };
  }, [filters.ano]);

  const filteredData = useMemo(() => {
    return docs.filter(item => {
      if (!item.tipo?.startsWith(activeSubTab)) return false;
      if (filters.busca) {
        const term = normalize(filters.busca);
        return (
          normalize(item.titulo).includes(term) ||
          (item.descricao && normalize(item.descricao).includes(term))
        );
      }
      return true;
    });
  }, [docs, activeSubTab, filters.busca]);

  const principal = filteredData.length > 0 ? filteredData[0] : null;
  const anexos = filteredData.length > 1 ? filteredData.slice(1) : [];

  return (
    <div id="panel-planejamento" role="tabpanel">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Peças de Planejamento Orçamentário</h2>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['PPA', 'LDO', 'LOA'] as const).map((subTab) => (
            <button
              key={subTab}
              onClick={() => setActiveSubTab(subTab)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                activeSubTab === subTab
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {subTab === 'PPA' ? 'PPA - Plano Plurianual' : subTab === 'LDO' ? 'LDO - Lei de Diretrizes Orçamentárias' : 'LOA - Lei Orçamentária Anual'}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-900">Carregando documentos...</h3>
            </div>
          ) : !principal ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <FilterX size={32} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-sm font-bold text-gray-900">Nenhum documento encontrado</h3>
              <p className="text-xs text-gray-500">Tente ajustar seus filtros ou busca.</p>
            </div>
          ) : (
            <>
              {/* Arquivo Principal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white p-3 rounded-xl shrink-0 shadow-md shadow-blue-200">
                    <FileText size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {principal.titulo} {principal.exercicio ? `- ${principal.exercicio}` : ''}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {principal.data_publicacao && (
                        <p className="text-sm text-gray-500">
                          Publicado em {new Date(principal.data_publicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </p>
                      )}
                      {principal.descricao && (
                        <span className="text-sm text-gray-500 hidden sm:inline">• {principal.descricao}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={principal.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-600 font-bold text-xs uppercase rounded-xl hover:bg-gray-100 transition"
                    aria-label={`Visualizar: ${principal.titulo}`}
                  >
                    <Eye size={15} />
                    Ver
                  </a>
                  <a
                    href={`/api/download?url=${encodeURIComponent(principal.arquivo_url)}&filename=${encodeURIComponent(principal.arquivo_nome || 'documento.pdf')}`}
                    download={principal.arquivo_nome || 'documento.pdf'}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-blue-700 shadow-md shadow-blue-100 transition"
                    aria-label={`Baixar: ${principal.titulo}`}
                  >
                    <Download size={15} />
                    Baixar PDF
                  </a>
                </div>
              </div>

              {/* Anexos */}
              {anexos.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Anexos</h3>
                  <div className="space-y-3">
                    {anexos.map((anexo: any) => (
                      <div key={anexo.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50/50 hover:border-blue-100 transition-all duration-200 ml-0 sm:ml-4">
                        <div className="flex items-center gap-3">
                          <div className="text-gray-400 shrink-0">
                            <FileText size={18} strokeWidth={1.5} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800 leading-snug">{anexo.titulo}</h4>
                            {anexo.descricao && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{anexo.descricao}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a href={anexo.arquivo_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 font-bold text-[10px] uppercase rounded-lg hover:bg-gray-100 transition"
                            aria-label={`Visualizar: ${anexo.titulo}`}>
                            <Eye size={14} /> Ver
                          </a>
                          <a href={`/api/download?url=${encodeURIComponent(anexo.arquivo_url)}&filename=${encodeURIComponent(anexo.arquivo_nome || 'anexo.pdf')}`}
                            download={anexo.arquivo_nome || 'anexo.pdf'}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-blue-700 transition shadow-sm"
                            aria-label={`Baixar: ${anexo.titulo}`}>
                            <Download size={14} /> Baixar
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Base Legal — Critérios 11.7, 11.8, 11.9 e 11.10</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação do PPA, LDO, LOA e Plano Estratégico Institucional atende ao disposto
          na Constituição Federal (Arts. 165 a 169), na Lei de Responsabilidade Fiscal
          (LC nº 101/2000) e na Lei de Transparência (LC nº 131/2009). Os documentos devem
          estar disponíveis em formato PDF pesquisável, com seus respectivos anexos legais.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Aba 2: Relatórios da LRF — Declaração de Inexistência
// ============================================================================
function LrfTab() {
  return (
    <div id="panel-lrf" role="tabpanel">
      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Relatórios da LRF — Critérios 11.5 e 11.6</p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              O RGF (Relatório de Gestão Fiscal) e o RREO (Relatório Resumido da Execução Orçamentária)
              serão publicados nesta seção conforme forem disponibilizados pela Secretaria Municipal de Finanças,
              respeitando as periodicidades quadrimestral (RGF) e bimestral (RREO) exigidas pela LRF.
            </p>
          </div>
        </div>
      </div>

      <DeclaracaoInexistencia
        titulo="Aviso de Não Ocorrência — Relatórios da LRF"
        descricao="Não há relatórios da Lei de Responsabilidade Fiscal (RGF e RREO) registrados no banco de dados do portal. Os relatórios serão publicados assim que forem encaminhados pela Secretaria Municipal de Finanças, dentro dos prazos legais."
        icon={FileWarning}
        colorClass="bg-amber-100"
      />

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Base Legal — Critérios 11.5 e 11.6</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação do RGF e RREO atende às exigências da Lei de Responsabilidade Fiscal
          (LC nº 101/2000, Arts. 52 a 55), com periodicidade quadrimestral (RGF) e bimestral
          (RREO), garantindo o controle social sobre a gestão fiscal e a execução orçamentária
          do Município.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Aba 3: Prestação de Contas — Declaração de Inexistência
// ============================================================================
function PrestacaoContasTab() {
  return (
    <div id="panel-prestacao" role="tabpanel">
      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Prestação de Contas Anual e Relatório de Gestão — Critérios 11.1 e 11.2</p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              O Balanço Geral do exercício anterior e o Relatório de Gestão/Atividades elaborado
              pelo Prefeito serão publicados nesta seção assim que forem encaminhados pela
              Secretaria Municipal de Finanças e aprovados pelos órgãos competentes.
            </p>
          </div>
        </div>
      </div>

      <DeclaracaoInexistencia
        titulo="Aviso de Não Ocorrência — Prestação de Contas"
        descricao="Não há documentos de prestação de contas anual ou relatório de gestão registrados no banco de dados do portal. Os balanços e relatórios serão publicados assim que forem disponibilizados."
        icon={AlertTriangle}
        colorClass="bg-rose-100"
      />

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Base Legal — Critérios 11.1 e 11.2</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A prestação de contas anual atende ao Art. 84 da Lei nº 4.320/1964, ao Art. 48 da
          LC nº 101/2000 (LRF) e à Instrução Normativa do TCE-PI.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Aba 4: Julgamento das Contas — Declaração de Inexistência
// ============================================================================
function JulgamentoContasTab() {
  return (
    <div id="panel-julgamento" role="tabpanel">
      <div className="mt-4 mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Scale size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Julgamento das Contas — Critérios 11.3 e 11.4</p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              O Parecer Prévio do TCE-PI sobre as contas anuais do Prefeito e o ato de julgamento
              pela Câmara Municipal serão publicados nesta seção tão logo sejam disponibilizados
              pelos órgãos competentes.
            </p>
          </div>
        </div>
      </div>

      <DeclaracaoInexistencia
        titulo="Aviso de Não Ocorrência — Julgamento das Contas"
        descricao="Não há pareceres do TCE-PI ou atos de julgamento pela Câmara Municipal registrados no banco de dados do portal. Os documentos serão publicados assim que forem disponibilizados."
        icon={Scale}
        colorClass="bg-sky-100"
      />

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Base Legal — Critérios 11.3 e 11.4</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          O Parecer Prévio do TCE-PI sobre as contas anuais do Prefeito e o julgamento pela
          Câmara Municipal são exigidos pelo Art. 31, §1º e §2º da Constituição Federal e
          pelo Art. 49 da Lei de Responsabilidade Fiscal (LC nº 101/2000).
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function RelatoriosPage() {
  const { anos: ANOS } = useAvailableYears('relatorios');
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'planejamento' | 'lrf' | 'prestacao' | 'julgamento'>('planejamento');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '', entidade: '' });

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  return (
    <ContentPage
      title="Planejamento e Prestação de Contas"
      description="Consulte as peças de planejamento orçamentário (PPA, LDO, LOA), relatórios da LRF (RGF, RREO), prestação de contas anual e julgamento das contas municipais pelo TCE-PI e Câmara."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Planejamento e Prestação de Contas' },
      ]}
      lastUpdate={today}
    >
      {/* Abas lado a lado */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist" aria-label="Seções de planejamento e contas">
        <button onClick={() => setActiveTab('planejamento')} role="tab" aria-selected={activeTab === 'planejamento'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'planejamento' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}>
          <FileText size={16} /> Planejamento Orçamentário
        </button>
        <button onClick={() => setActiveTab('lrf')} role="tab" aria-selected={activeTab === 'lrf'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'lrf' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}>
          <FileWarning size={16} /> Relatórios LRF
        </button>
        <button onClick={() => setActiveTab('prestacao')} role="tab" aria-selected={activeTab === 'prestacao'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'prestacao' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}>
          <AlertTriangle size={16} /> Prestação de Contas
        </button>
        <button onClick={() => setActiveTab('julgamento')} role="tab" aria-selected={activeTab === 'julgamento'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'julgamento' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}>
          <Scale size={16} /> Julgamento das Contas
        </button>
      </div>

      {activeTab === 'planejamento' && (
        <PlanejamentoTab filters={filters} filterKey={filterKey} hasActiveFilters={hasActiveFilters} />
      )}
      {activeTab === 'lrf' && <LrfTab />}
      {activeTab === 'prestacao' && <PrestacaoContasTab />}
      {activeTab === 'julgamento' && <JulgamentoContasTab />}
    </ContentPage>
  );
}
