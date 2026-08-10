'use client';

import { useState, useEffect, useCallback } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import { useAvailableYears, createBrowserClient } from '@/lib/supabase/client';
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

type Incentivo = {
  id: string;
  projeto: string;
  area: 'cultura' | 'esporte';
  beneficiario: string;
  tipo_incentivo: string;
  valor_beneficio: number;
  fundamento_legal: string;
  ano: number;
  arquivo?: string;
};

const TIPO_INCENTIVO_LABEL: Record<string, string> = {
  isencao_iss: 'Isenção de ISS',
  patrocinio_abatimento: 'Patrocínio com Abatimento Fiscal',
  isencao_taxa: 'Isenção de Taxa',
  outro: 'Outro',
};

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
// Tabela de Incentivos
// ============================================================================
function TabelaIncentivos({ itens }: { itens: Incentivo[] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Projeto</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Área</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Beneficiário</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Incentivo</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700">Valor</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Fundamento Legal</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700">Documento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {itens.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-900">{item.projeto}</td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  item.area === 'cultura'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {item.area === 'cultura' ? 'Cultura' : 'Esporte'}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600">{item.beneficiario}</td>
              <td className="py-3 px-4 text-gray-600">{TIPO_INCENTIVO_LABEL[item.tipo_incentivo] || item.tipo_incentivo}</td>
              <td className="py-3 px-4 text-right font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_beneficio)}
              </td>
              <td className="py-3 px-4 text-xs text-gray-500">{item.fundamento_legal}</td>
              <td className="py-3 px-4 text-center">
                {item.arquivo ? (
                  <a href={item.arquivo} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Visualizar Documento">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function RenunciasDeReceitasPage() {
  const today = useTodayDate();
  const { anos: dbAnos } = useAvailableYears('renuncias');
  
  // Combina os anos do banco com a série histórica necessária (2020-2026)
  const ALL_YEARS = Array.from(new Set([...dbAnos, '2026', '2025', '2024', '2023', '2022', '2021', '2020'])).sort().reverse();

  const [activeTab, setActiveTab] = useState<'desoneracoes' | 'incentivos'>('desoneracoes');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '', entidade: '' });

  // Estado para os incentivos
  const [incentivos, setIncentivos] = useState<Incentivo[] | null>(null);
  const [loadingIncentivos, setLoadingIncentivos] = useState(false);

  // Carregar incentivos do banco
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingIncentivos(true);
      const supabase = createBrowserClient();
      let query = supabase
        .schema('transparencia')
        .from('incentivos_cultura_esporte')
        .select('*')
        .order('ano', { ascending: false })
        .limit(100);

      if (filters.ano) {
        query = query.eq('ano', parseInt(filters.ano, 10));
      }

      const { data, error } = await query;
      if (!cancelled) {
        const STATIC_INCENTIVOS: Incentivo[] = [
          {
            id: 'static-1',
            projeto: 'Edital de Chamamento Público 001/2026',
            area: 'cultura',
            beneficiario: 'Agentes Culturais (Em fase de seleção)',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 30400.00,
            fundamento_legal: 'Lei 14.399/2022 (PNAB)',
            ano: 2026,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_5536_440_Padre_Marcos_Edital_Chamamento_Publico_001-26_pag_307.pdf'
          },
          {
            id: 'static-2',
            projeto: 'Edital de Chamamento Público 002/2026 (Pontos de Cultura)',
            area: 'cultura',
            beneficiario: 'Pontos e Pontões de Cultura',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 5400.00,
            fundamento_legal: 'Lei 14.399/2022 (PNAB)',
            ano: 2026,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_5558_469_Padre_Marcos_Edital_Chamamento_Publico_002-26_PNAB_pag_67.pdf'
          },
          {
            id: 'static-3',
            projeto: 'Edital de Chamamento Público 001/2023',
            area: 'cultura',
            beneficiario: 'Agentes Culturais',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 21300.00,
            fundamento_legal: 'Lei Complementar 195/2022',
            ano: 2023,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_4916_241_Padre_Marcos_Edital_Chamamento_Publico_001-23_SEMCULT_pag_188.pdf'
          },
          {
            id: 'whatsapp-DM_4089_312_Padre_Marcos_Chamamento_Publico_Simplificado_Edital_001-20_pag_29-32',
            projeto: 'Edital de Chamamento Público Simplificado Nº 01/2020 (Saúde - Covid19)',
            area: 'cultura',
            beneficiario: 'Profissionais de Saúde',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 0,
            fundamento_legal: 'Enfrentamento Covid-19',
            ano: 2020,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_4089_312_Padre_Marcos_Chamamento_Publico_Simplificado_Edital_001-20_pag_29-32.pdf'
          },
          {
            id: 'whatsapp-DM_4132_250_Padre_Marcos_Edital_de_Mapeamento_Cultural_001-20_pag_218-221',
            projeto: 'Edital de Mapeamento Cultural 001/2020',
            area: 'cultura',
            beneficiario: 'Agentes e Espaços Culturais',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 0,
            fundamento_legal: 'Mapeamento Cultural',
            ano: 2020,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_4132_250_Padre_Marcos_Edital_de_Mapeamento_Cultural_001-20_pag_218-221.pdf'
          },
          {
            id: 'whatsapp-DM_4178_205_Padre_Marcos_Edital_02-20_Emergencia_Cultural_pag_14-19',
            projeto: 'Edital Nº 02/2020 Lei Aldir Blanc de Emergência Cultural',
            area: 'cultura',
            beneficiario: 'Agentes Culturais, Grupos e Coletivos',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 23000,
            fundamento_legal: 'Lei Aldir Blanc',
            ano: 2020,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_4178_205_Padre_Marcos_Edital_02-20_Emergencia_Cultural_pag_14-19.pdf'
          },
          {
            id: 'whatsapp-DM_4178_206_Padre_Marcos_Edital_03-20_pag_16-19',
            projeto: 'Edital Nº 003/2020 Lei Aldir Blanc de Emergência Cultural',
            area: 'cultura',
            beneficiario: 'Grupos, Coletivos e Espaços Culturais',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 0,
            fundamento_legal: 'Lei Aldir Blanc',
            ano: 2020,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_4178_206_Padre_Marcos_Edital_03-20_pag_16-19.pdf'
          },
          {
            id: 'whatsapp-DM_4638_390_Padre_Marcos_Edital_001-22_pag_307',
            projeto: 'Edital de Mapeamento Cultural 001/2022',
            area: 'cultura',
            beneficiario: 'Agentes e Espaços Culturais',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 0,
            fundamento_legal: 'Mapeamento Cultural',
            ano: 2022,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_4638_390_Padre_Marcos_Edital_001-22_pag_307.pdf'
          },
          {
            id: 'whatsapp-DM_5382_261_Padre_Marcos_Edital_de_Mapeamento_Cultural_001-25_pag_179',
            projeto: 'Edital de Mapeamento Cultural 001/2025',
            area: 'cultura',
            beneficiario: 'Agentes e Espaços Culturais',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 0,
            fundamento_legal: 'Mapeamento Cultural',
            ano: 2025,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_5382_261_Padre_Marcos_Edital_de_Mapeamento_Cultural_001-25_pag_179.pdf'
          },
          {
            id: 'static-4',
            projeto: 'Edital de Chamamento Público 002/2023',
            area: 'cultura',
            beneficiario: 'Agentes Culturais e Cineastas',
            tipo_incentivo: 'patrocinio_abatimento',
            valor_beneficio: 21300.00,
            fundamento_legal: 'Lei Complementar 195/2022',
            ano: 2023,
            arquivo: 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev/renuncias/DM_4915_278_Padre_Marcos_Edital_Chamamento_Publico_002-23_SEMCULT_pag_73.pdf'
          },
          {
            id: 'static-5',
            projeto: 'Edital de Mapeamento Cultural 001/2024',
            area: 'cultura',
            beneficiario: 'Fazedores de Cultura do Município',
            tipo_incentivo: 'outro',
            valor_beneficio: 0.00,
            fundamento_legal: 'Políticas Municipais de Cultura',
            ano: 2024
          }
        ];

        let finalData = (error || !data) ? STATIC_INCENTIVOS : [...STATIC_INCENTIVOS, ...(data as Incentivo[])];

        if (filters.ano) {
          finalData = finalData.filter(item => item.ano.toString() === filters.ano);
        }

        setIncentivos(finalData);
        setLoadingIncentivos(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [filters.ano]);

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
        anos={ALL_YEARS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      >
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
          {loadingIncentivos ? (
            <div className="mt-6 flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
            </div>
          ) : incentivos && incentivos.length > 0 ? (
            <div>
              <p className="mt-6 text-sm text-gray-500">
                {incentivos.length} projeto{incentivos.length !== 1 ? 's' : ''} encontrado{incentivos.length !== 1 ? 's' : ''}
                {filters.ano ? ` em ${filters.ano}` : ''}.
              </p>
              <TabelaIncentivos itens={incentivos} />
            </div>
          ) : (
            <DeclaracaoInexistencia
              titulo="Aviso de Não Ocorrência — Incentivo à Cultura e Esporte"
              descricao={`No exercício de ${filters.ano || 'referência'}, não foram registrados projetos de incentivo à cultura e ao esporte com renúncia de receita. Os dados serão publicados assim que disponibilizados pela Secretaria Municipal de Finanças.`}
              icon={Palette}
              colorClass="bg-purple-100"
            />
          )}
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
