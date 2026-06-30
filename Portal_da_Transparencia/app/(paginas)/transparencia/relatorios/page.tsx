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
  Target,
  BarChart3,
  Building2,
  Receipt,
  FileSpreadsheet,
  BookOpen,
  Gavel,
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
// Hook genérico para buscar documentos da prestação de contas
// ============================================================================
function useDocumentos(filters: FilterValues, tipoFilter: string | string[]) {
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
        .eq('ativo', true)
        .order('exercicio', { ascending: false })
        .order('titulo', { ascending: true });

      if (typeof tipoFilter === 'string') {
        q = q.eq('tipo', tipoFilter);
      } else if (Array.isArray(tipoFilter)) {
        q = q.in('tipo', tipoFilter);
      }

      if (filters.ano) {
        q = q.eq('exercicio', parseInt(filters.ano));
      }

      const { data } = await q;
      if (!cancelled) {
        let result = data || [];
        if (filters.busca) {
          const term = normalize(filters.busca);
          result = result.filter(item => 
            normalize(item.titulo || '').includes(term) ||
            normalize(item.descricao || '').includes(term)
          );
        }
        setDocs(result);
        setLoading(false);
      }
    }
    fetchDocs();
    return () => { cancelled = true; };
  }, [filters.ano, filters.busca, JSON.stringify(tipoFilter)]);

  return { docs, loading };
}

// ============================================================================
// Componente reutilizável de listagem de documentos
// ============================================================================
function DocumentCard({ doc, compact = false }: { doc: any; compact?: boolean }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-200 transition-all duration-200 ${compact ? '' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl shrink-0 shadow-sm">
          <FileText size={20} strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-800 leading-snug truncate">{doc.titulo}</h4>
          <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-2">
            <span>Exercício {doc.exercicio}</span>
            {doc.data_publicacao && <span>• Publicado em {new Date(doc.data_publicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>}
          </p>
          {doc.descricao && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{doc.descricao}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={doc.arquivo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-gray-50 text-gray-700 font-bold text-xs uppercase rounded-xl hover:bg-gray-100 transition"
        >
          <Eye size={14} />
          Ver
        </a>
        <a
          href={`/api/download?url=${encodeURIComponent(doc.arquivo_url)}&filename=${encodeURIComponent(doc.arquivo_nome || 'documento.pdf')}`}
          download={doc.arquivo_nome || 'documento.pdf'}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-100"
        >
          <Download size={14} />
          Baixar PDF
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// Componente: seção de documentos agrupados por ano
// ============================================================================
function AnoSection({ ano, docs, icon: Icon }: { ano: number; docs: any[]; icon: React.ElementType }) {
  if (docs.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-600 text-white p-2.5 rounded-xl shrink-0 shadow-md shadow-blue-200">
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Exercício {ano}</h3>
          <p className="text-xs font-semibold text-gray-500">{docs.length} documento{docs.length !== 1 ? 's' : ''} registrado{docs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="space-y-3">
        {docs.map((doc: any) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Aba 2: Relatórios da LRF — Critérios 11.5 e 11.6
// ============================================================================
function LrfTab({ filters }: { filters: FilterValues }) {
  const { docs, loading } = useDocumentos(filters, ['RGF', 'RREO']);

  const grouped = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const doc of docs) {
      const ano = doc.exercicio || 0;
      if (!map.has(ano)) map.set(ano, []);
      map.get(ano)!.push(doc);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b - a);
  }, [docs]);

  const totalDocs = docs.length;

  return (
    <div id="panel-lrf" role="tabpanel">
      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">Relatórios da LRF — Critérios 11.5 e 11.6</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              O RGF (Relatório de Gestão Fiscal) e o RREO (Relatório Resumido da Execução Orçamentária)
              são publicados conforme disponibilizados pela Secretaria Municipal de Finanças,
              respeitando as periodicidades quadrimestral (RGF) e bimestral (RREO) exigidas pela LRF.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900">Carregando relatórios fiscais...</h3>
        </div>
      ) : totalDocs > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {totalDocs} relatório{totalDocs !== 1 ? 's' : ''} encontrado{totalDocs !== 1 ? 's' : ''} {filters.ano ? `no exercício ${filters.ano}` : ''}
            </div>
          </div>
          {grouped.map(([ano, docsAno]) => (
            <AnoSection key={ano} ano={ano} docs={docsAno} icon={FileWarning} />
          ))}
        </div>
      ) : (
        <DeclaracaoInexistencia
          titulo={`Aviso de Não Ocorrência — Relatórios da LRF (${filters.ano || 'Todos os anos'})`}
          descricao="Não há relatórios da Lei de Responsabilidade Fiscal (RGF e RREO) publicados para o período/filtro selecionado no banco de dados do portal. Os relatórios são disponibilizados dentro dos prazos legais logo após a consolidação contábil."
          icon={FileWarning}
          colorClass="bg-amber-100"
        />
      )}

      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Base Legal — Critérios 11.5 e 11.6</p>
        <p className="text-xs text-gray-600 leading-relaxed">
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
// Aba 3: Prestação de Contas — Critérios 11.1 e 11.2
// ============================================================================
function PrestacaoContasTab({ filters }: { filters: FilterValues }) {
  const { docs, loading } = useDocumentos(filters, ['BALANCO_GERAL', 'RELATORIO_GESTAO']);

  const grouped = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const doc of docs) {
      const ano = doc.exercicio || 0;
      if (!map.has(ano)) map.set(ano, []);
      map.get(ano)!.push(doc);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b - a);
  }, [docs]);

  const totalDocs = docs.length;

  return (
    <div id="panel-prestacao" role="tabpanel">
      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">Prestação de Contas Anual e Balanços — Critérios 11.1 e 11.2</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Consulta ao Balanço Geral do exercício, relatórios de gestão e demais demonstrativos contábeis exigidos pela
              Lei nº 4.320/1964 e pela Lei de Responsabilidade Fiscal (LC nº 101/2000).
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900">Carregando balanços e prestações...</h3>
        </div>
      ) : totalDocs > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {totalDocs} documento{totalDocs !== 1 ? 's' : ''} disponíve{totalDocs !== 1 ? 'is' : 'l'} {filters.ano ? `para o exercício de ${filters.ano}` : ''}
            </div>
          </div>
          {grouped.map(([ano, docsAno]) => (
            <AnoSection key={ano} ano={ano} docs={docsAno} icon={AlertTriangle} />
          ))}
        </div>
      ) : (
        <DeclaracaoInexistencia
          titulo={`Aviso de Não Ocorrência — Prestação de Contas (${filters.ano || 'Todos os anos'})`}
          descricao="Não há documentos de prestação de contas ou balanços publicados para o exercício/filtro selecionado até o momento. Os documentos serão disponibilizados tão logo sejam consolidados pela contabilidade municipal."
          icon={AlertTriangle}
          colorClass="bg-rose-100"
        />
      )}

      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Base Legal — Critérios 11.1 e 11.2</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          A prestação de contas anual atende ao Art. 84 da Lei nº 4.320/1964, ao Art. 48 da
          LC nº 101/2000 (LRF) e à Instrução Normativa do TCE-PI.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Aba 4: Julgamento das Contas — Critérios 11.3 e 11.4
// ============================================================================
function JulgamentoContasTab({ filters }: { filters: FilterValues }) {
  const { docs, loading } = useDocumentos(filters, 'PARECER_TCE');

  const grouped = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const doc of docs) {
      const ano = doc.exercicio || 0;
      if (!map.has(ano)) map.set(ano, []);
      map.get(ano)!.push(doc);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b - a);
  }, [docs]);

  const totalDocs = docs.length;

  return (
    <div id="panel-julgamento" role="tabpanel">
      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Scale size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-900 mb-1">Julgamento das Contas — Critérios 11.3 e 11.4</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              O Parecer Prévio do TCE-PI sobre as contas anuais do Prefeito e o ato de julgamento
              pela Câmara Municipal são publicados nesta seção.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900">Carregando pareceres...</h3>
        </div>
      ) : totalDocs > 0 ? (
        <div className="space-y-4">
          {grouped.map(([ano, docsAno]) => (
            <AnoSection key={ano} ano={ano} docs={docsAno} icon={Scale} />
          ))}
        </div>
      ) : (
        <DeclaracaoInexistencia
          titulo={`Aviso de Não Ocorrência — Julgamento das Contas (${filters.ano || 'Todos os anos'})`}
          descricao="Não há pareceres do TCE-PI ou atos de julgamento pela Câmara Municipal disponibilizados para o exercício selecionado. O trâmite de julgamento de contas segue os prazos regimentais do Tribunal e do Legislativo."
          icon={Scale}
          colorClass="bg-sky-100"
        />
      )}

      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Base Legal — Critérios 11.3 e 11.4</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          O Parecer Prévio do TCE-PI sobre as contas anuais do Prefeito e o julgamento pela
          Câmara Municipal são exigidos pelo Art. 31, §1º e §2º da Constituição Federal e
          pelo Art. 49 da Lei de Responsabilidade Fiscal (LC nº 101/2000).
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Aba 5: Outros Relatórios e Demonstrações (Consolidada)
// ============================================================================
function OutrosRelatoriosTab() {
  const [subTab, setSubTab] = useState<'estrategico' | 'trimestrais' | 'consorcio' | 'contabeis' | 'gerais'>('estrategico');

  return (
    <div id="panel-outros" role="tabpanel">
      <div className="mb-6 flex flex-wrap gap-2 bg-gray-100 p-1.5 rounded-2xl">
        <button
          onClick={() => setSubTab('estrategico')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'estrategico' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Plano Estratégico (11.7)
        </button>
        <button
          onClick={() => setSubTab('trimestrais')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'trimestrais' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dem. Trimestrais (11.12)
        </button>
        <button
          onClick={() => setSubTab('consorcio')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'consorcio' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Consórcios (11.11)
        </button>
        <button
          onClick={() => setSubTab('contabeis')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'contabeis' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dem. com Pareceres (11.13)
        </button>
        <button
          onClick={() => setSubTab('gerais')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'gerais' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Outras Demonstrações (11.14 a 11.19)
        </button>
      </div>

      {subTab === 'estrategico' && (
        <div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <Target size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Plano Estratégico Institucional — Critério 11.7</p>
                <p className="text-sm text-blue-800/80 leading-relaxed">
                  O Plano Estratégico Institucional define a missão, visão, valores, objetivos estratégicos
                  e metas da administração municipal.
                </p>
              </div>
            </div>
          </div>
          <DeclaracaoInexistencia
            titulo="Aviso de Não Ocorrência — Plano Estratégico Institucional"
            descricao="Não há Plano Estratégico Institucional registrado no banco de dados do portal. O documento será publicado assim que for elaborado e aprovado pela administração municipal."
            icon={Target}
            colorClass="bg-violet-100"
          />
        </div>
      )}

      {subTab === 'trimestrais' && (
        <div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <BarChart3 size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Demonstrações Financeiras Trimestrais — Critério 11.12</p>
                <p className="text-sm text-blue-800/80 leading-relaxed">
                  As Demonstrações Financeiras Trimestrais apresentam os balancetes contábeis do Município a cada trimestre.
                </p>
              </div>
            </div>
          </div>
          <DeclaracaoInexistencia
            titulo="Aviso de Não Ocorrência — Demonstrações Financeiras Trimestrais"
            descricao="Não há demonstrações financeiras trimestrais registradas no banco de dados do portal até o momento."
            icon={BarChart3}
            colorClass="bg-teal-100"
          />
        </div>
      )}

      {subTab === 'consorcio' && (
        <div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <Building2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Orçamento do Consórcio Público — Critério 11.11</p>
                <p className="text-sm text-blue-800/80 leading-relaxed">
                  Estimativa da receita e fixação da despesa para o exercício atual dos consórcios dos quais o Município participa.
                </p>
              </div>
            </div>
          </div>
          <DeclaracaoInexistencia
            titulo="Aviso de Não Ocorrência — Orçamento do Consórcio Público"
            descricao="Não há orçamento de consórcio público registrado no banco de dados do portal. Caso o Município integre algum consórcio público, o respectivo orçamento será publicado nesta seção."
            icon={Building2}
            colorClass="bg-orange-100"
          />
        </div>
      )}

      {subTab === 'contabeis' && (
        <div>
          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <Receipt size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Demonstrações Financeiras Contábeis — Critério 11.13</p>
                <p className="text-sm text-blue-800/80 leading-relaxed">
                  As demonstrações financeiras devem ser acompanhadas dos pareceres do Conselho Fiscal e da auditoria independente, quando aplicável.
                </p>
              </div>
            </div>
          </div>
          <DeclaracaoInexistencia
            titulo="Aviso de Não Ocorrência — Demonstrações Financeiras com Pareceres"
            descricao="Não há demonstrações financeiras contábeis acompanhadas de pareceres registradas no portal até o momento."
            icon={Receipt}
            colorClass="bg-indigo-100"
          />
        </div>
      )}

      {subTab === 'gerais' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Outras Demonstrações — Critérios 11.14 a 11.19</p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Reúne os demais relatórios exigidos pela matriz de transparência, incluindo orçamento de investimentos, demonstrações editáveis e relatórios de comitês.
            </p>
          </div>
          <DeclaracaoInexistencia
            titulo="Aviso de Não Ocorrência — Demais Relatórios e Demonstrações"
            descricao="Não há registros adicionais para os critérios 11.14 (Investimentos), 11.15 a 11.17 (Formatos editáveis/notas) e 11.18 a 11.19 (Comitês e Sustentabilidade). Os documentos são publicados conforme elaborados pelos setores competentes."
            icon={FileSpreadsheet}
            colorClass="bg-cyan-100"
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function RelatoriosPage() {
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('planejamento_documentos', undefined, 'exercicio');
  const today = useTodayDate();
  const currentYear = new Date().getFullYear().toString();
  const [activeTab, setActiveTab] = useState<'planejamento' | 'lrf' | 'prestacao' | 'julgamento' | 'outros'>('planejamento');
  const [filters, setFilters] = useState<FilterValues>({ ano: currentYear, mes: '', busca: '', entidade: '' });

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
      description="Consulte as peças de planejamento orçamentário (PPA, LDO, LOA), relatórios fiscais da LRF (RGF, RREO), balanços anuais, prestação de contas e pareceres do Tribunal de Contas."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Planejamento e Prestação de Contas' },
      ]}
      lastUpdate={today}
    >
      {/* Filtro Principal por Ano e Busca */}
      <div className="mt-6 mb-8">
        <FilterPanel
          anos={ANOS.length > 0 ? ANOS : [currentYear, '2025', '2024', '2023']}
          anosLoading={anosLoading}
          values={filters}
          onChange={handleChange}
          onClear={handleClear}
          hideMes
          searchPlaceholder="Pesquisar por título, ano ou descrição no portal..."
        />
      </div>

      {/* Abas Consolidadas em 5 Pilares */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3" role="tablist" aria-label="Seções de planejamento e contas">
        <button onClick={() => setActiveTab('planejamento')} role="tab" aria-selected={activeTab === 'planejamento'}
          className={`flex items-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'planejamento' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}>
          <FileText size={18} /> Planejamento (PPA/LDO/LOA)
        </button>
        <button onClick={() => setActiveTab('lrf')} role="tab" aria-selected={activeTab === 'lrf'}
          className={`flex items-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'lrf' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}>
          <FileWarning size={18} /> Relatórios LRF (RREO/RGF)
        </button>
        <button onClick={() => setActiveTab('prestacao')} role="tab" aria-selected={activeTab === 'prestacao'}
          className={`flex items-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'prestacao' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}>
          <AlertTriangle size={18} /> Balanços e Contas Anuais
        </button>
        <button onClick={() => setActiveTab('julgamento')} role="tab" aria-selected={activeTab === 'julgamento'}
          className={`flex items-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'julgamento' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}>
          <Scale size={18} /> Pareceres e Julgamento
        </button>
        <button onClick={() => setActiveTab('outros')} role="tab" aria-selected={activeTab === 'outros'}
          className={`flex items-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
            activeTab === 'outros' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}>
          <FileSpreadsheet size={18} /> Demais Demonstrações
        </button>
      </div>

      <div className="mt-8">
        {activeTab === 'planejamento' && (
          <PlanejamentoTab filters={filters} filterKey={filterKey} hasActiveFilters={hasActiveFilters} />
        )}
        {activeTab === 'lrf' && <LrfTab filters={filters} />}
        {activeTab === 'prestacao' && <PrestacaoContasTab filters={filters} />}
        {activeTab === 'julgamento' && <JulgamentoContasTab filters={filters} />}
        {activeTab === 'outros' && <OutrosRelatoriosTab />}
      </div>
    </ContentPage>
  );
}
