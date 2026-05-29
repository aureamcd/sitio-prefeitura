'use client';

import { useState, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { EMPRESAS } from '@/lib/empresas';
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  ShoppingCart,
  Ban,
  FileSearch,
  Info,
  AlertCircle,
  Scale,
  ClipboardList,
} from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

const MODALIDADES = [
  { value: 'pregao', label: 'Pregão' },
  { value: 'concorrencia', label: 'Concorrência' },
  { value: 'tomada_precos', label: 'Tomada de Preços' },
  { value: 'convite', label: 'Convite' },
  { value: 'concurso', label: 'Concurso' },
  { value: 'leilao', label: 'Leilão' },
];

const SITUACOES = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'homologada', label: 'Homologada' },
  { value: 'fracassada', label: 'Fracassada' },
  { value: 'deserta', label: 'Deserta' },
  { value: 'suspensa', label: 'Suspensa' },
  { value: 'em andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
];

const SITUACAO_BADGE: Record<string, { label: string; className: string }> = {
  aberta: { label: 'Aberta', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  homologada: { label: 'Homologada', className: 'bg-green-100 text-green-800 border-green-200' },
  fracassada: { label: 'Fracassada', className: 'bg-red-100 text-red-800 border-red-200' },
  deserta: { label: 'Deserta', className: 'bg-red-100 text-red-800 border-red-200' },
  'em andamento': { label: 'Em Andamento', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  concluida: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  suspensa: { label: 'Suspensa', className: 'bg-orange-100 text-orange-800 border-orange-200' },
};

function getSituacaoBadge(val: string) {
  if (!val) return { label: 'Desconhecido', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  const lower = val.toLowerCase().trim();
  for (const key in SITUACAO_BADGE) {
    if (lower.includes(key)) return SITUACAO_BADGE[key];
  }
  return { label: val, className: 'bg-gray-100 text-gray-700 border-gray-200' };
}

function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateISO(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Hook personalizado para buscar licitações
// ---------------------------------------------------------------------------
function useLicitacoesData(
  filters: FilterValues,
  extraFilter?: { campo: string; valor: string }
) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      let query = supabase
        .schema('transparencia')
        .from('licitacoes')
        .select('*');

      if (filters.entidade) {
        query = query.eq('empresa', filters.entidade);
      }

      if (filters.ano) {
        query = query.eq('ano', filters.ano);
      }

      if (filters.mes) {
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.ilike('data_abertura', `${prefix}%`);
      }

      if (filters.busca) {
        query = query.or(
          `objeto.ilike.%${filters.busca}%,numero.ilike.%${filters.busca}%,tipo_licitacao.ilike.%${filters.busca}%`
        );
      }

      if (extraFilter) {
        if (extraFilter.campo === 'artigo_inciso') {
          query = query.not('artigo_inciso', 'is', null).not('artigo_inciso', 'eq', '');
        } else if (extraFilter.campo === 'carona') {
          query = query.not('carona', 'is', null).not('carona', 'eq', '');
        }
      }

      const { data: result, error } = await query
        .order('data_abertura', { ascending: false });

      if (cancelled) return;

      if (!error && result) {
        setData(result);
      } else {
        console.error('Error fetching licitacoes:', error);
        setData([]);
      }
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    filters.ano,
    filters.mes,
    filters.busca,
    filters.entidade,
    extraFilter?.campo,
    extraFilter?.valor,
    supabase,
  ]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// Tabela de Licitações (reutilizada nas abas 1, 2 e 3)
// ---------------------------------------------------------------------------
const licitacaoColumns = [
  {
    header: 'Nº / Modalidade',
    accessor: 'numero',
    render: (val: string, row: any) => {
      const num = val || row.nlicitacao || row.numlic || '-';
      const modalidade = row.tipo_licitacao || 'Não informado';
      return (
        <div>
          <p className="text-sm font-semibold text-gray-900">{num}</p>
          <p className="text-xs text-gray-500 mt-0.5">{modalidade}</p>
        </div>
      );
    },
  },
  {
    header: 'Objeto',
    accessor: 'objeto',
    render: (val: string) => (
      <span
        className="block max-w-[260px] text-sm text-gray-700"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
        title={val}
      >
        {val || '-'}
      </span>
    ),
  },
  {
    header: 'Data de Abertura',
    accessor: 'data_abertura',
    render: (val: string) => (
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {formatDateISO(val)}
      </span>
    ),
  },
  {
    header: 'Valor Estimado',
    accessor: 'valor',
    render: (val: number) => (
      <span className="block text-right tabular-nums text-sm font-semibold text-gray-800">
        {formatBRL(Number(val))}
      </span>
    ),
  },
  {
    header: 'Situação',
    accessor: 'situacao',
    render: (val: string) => {
      const badge = getSituacaoBadge(val);
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
        >
          {badge.label}
        </span>
      );
    },
  },
  {
    header: 'Detalhes',
    accessor: 'acoes',
    render: () => (
      <a
        href="#"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        onClick={(e) => e.preventDefault()}
      >
        <FileSearch size={14} />
        Ver Documentos
      </a>
    ),
  },
];

const DISPENSA_COLUMNS = [
  ...licitacaoColumns.slice(0, 5),
  {
    header: 'Fundamento Legal',
    accessor: 'artigo_inciso',
    render: (val: string) => (
      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
        {val || 'N/I'}
      </span>
    ),
  },
  ...licitacaoColumns.slice(5),
];

// ---------------------------------------------------------------------------
// Aba 1: Relação de Licitações
// ---------------------------------------------------------------------------
function RelacaoLicitacoesTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const { data, loading } = useLicitacoesData(filters);
  const totalEstimado = data.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  return (
    <div id="panel-licitacoes" role="tabpanel" aria-labelledby="tab-licitacoes">
      {/* Totalizer */}
      <div className="mt-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Total de Processos
          </p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">
              {data.length}
            </p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Valor Total Estimado
          </p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">
              {formatBRL(totalEstimado)}
            </p>
          )}
        </div>
      </div>

      <DataTable
        title="Processos Licitatórios"
        columns={licitacaoColumns}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Nota Legal — Critérios 8.1, 8.2 e 8.3
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Os processos licitatórios são conduzidos em conformidade com a Lei nº 14.133/2021
          (Nova Lei de Licitações e Contratos Administrativos) e normas do TCE-PI.
          Os editais, termos de referência, atas, pareceres e demais documentos estão
          disponíveis para consulta e download em PDF pesquisável.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 2: Dispensas e Inexigibilidades
// ---------------------------------------------------------------------------
function DispensasInexigibilidadesTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const { data, loading } = useLicitacoesData(filters, {
    campo: 'artigo_inciso',
    valor: '',
  });
  const totalValor = data.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  return (
    <div id="panel-dispensas" role="tabpanel" aria-labelledby="tab-dispensas">
      {/* Descrição */}
      <div className="mt-4 mb-4 rounded-xl border border-amber-100 bg-amber-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">
              Contratações Diretas — Critério 8.4
            </p>
            <p className="text-sm text-amber-700/80 leading-relaxed">
              Processos de dispensa e inexigibilidade de licitação realizados pelo
              município. Para cada processo, estão disponíveis para download: o Termo
              de Referência (ou Projeto Básico), a justificativa da escolha do fornecedor
              e do preço, os pareceres técnicos e jurídicos, e o ato de homologação/ratificação.
            </p>
          </div>
        </div>
      </div>

      <DataTable
        title="Dispensas e Inexigibilidades"
        columns={DISPENSA_COLUMNS}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage="Não há registros de dispensas ou inexigibilidades de licitação no período informado."
        emptyFilteredMessage="Nenhuma contratação direta encontrada para os filtros selecionados."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 3: Atas de Adesão - SRP / "Caronas"
// ---------------------------------------------------------------------------
function AtasAdesaoTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const { data, loading } = useLicitacoesData(filters, {
    campo: 'carona',
    valor: '',
  });
  const totalValor = data.reduce((s, r) => s + (Number(r.valor) || 0), 0);

  const caronaColumns = [
    ...licitacaoColumns.slice(0, 5),
    {
      header: 'Órgão de Origem',
      accessor: 'carona',
      render: (val: string) => (
        <span className="text-xs font-medium text-gray-600">{val || '-'}</span>
      ),
    },
    ...licitacaoColumns.slice(5),
  ];

  return (
    <div id="panel-atas" role="tabpanel" aria-labelledby="tab-atas">
      {/* Descrição */}
      <div className="mt-4 mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Atas de Registro de Preços — Adesões / "Caronas" — Critério 8.5
            </p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Adesões a atas de registro de preços de outros órgãos (Sistema de
              Registro de Preços — SRP). O sistema disponibiliza o link ou arquivo
              para download da íntegra das atas de adesão.
            </p>
          </div>
        </div>
      </div>

      <DataTable
        title="Atas de Adesão — SRP"
        columns={caronaColumns}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage="Não há registros de adesão a atas de registro de preços no período informado."
        emptyFilteredMessage="Nenhuma adesão a ata SRP encontrada para os filtros selecionados."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 4: Plano de Contratações Anual - PAC
// ---------------------------------------------------------------------------
function PacTab() {
  return (
    <div id="panel-pac" role="tabpanel" aria-labelledby="tab-pac">
      {/* Alerta de Reprovação 2025 */}
      <div className="mt-4 mb-6 rounded-xl border-2 border-red-300 bg-red-50 px-6 py-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800 mb-1">
              🚨 Atenção — Critério reprovado na avaliação PNTP 2025
            </h3>
            <p className="text-sm text-red-700/80 leading-relaxed">
              Na avaliação do Plano Nacional de Transparência Pública (PNTP) de 2025,
              este critério foi reprovado. Para pontuar em 2026, é obrigatória a
              elaboração e publicação do Plano de Contratações Anual (PAC) da
              Prefeitura Municipal de Padre Marcos, conforme determina a Lei nº
              14.133/2021 (Nova Lei de Licitações).
            </p>
          </div>
        </div>
      </div>

      {/* Card do PAC */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Plano de Contratações Anual — {new Date().getFullYear()}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Instrumento de planejamento que consolida as contratações previstas
              para o exercício, conforme Art. 12 da Lei nº 14.133/2021.
            </p>
          </div>
        </div>

        <div className="px-6 py-8 text-center">
          <div className="max-w-lg mx-auto">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-5 mx-auto border border-amber-200">
              <FileText size={28} className="text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-3">
              PAC — Plano de Contratações Anual
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              O Plano de Contratações Anual (PAC) do Município de Padre Marcos para
              o exercício de {new Date().getFullYear()} encontra-se disponível para
              consulta e download no formato PDF.
            </p>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173572] text-white rounded-xl text-sm font-bold hover:bg-[#0f2847] transition-all shadow-md"
            >
              <FileText size={16} />
              Baixar PAC {new Date().getFullYear()} (PDF)
            </a>
          </div>
        </div>

        {/* Aviso importante */}
        <div className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50/50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                Exigência PNTP — Não Pontua Sem o Documento
              </p>
              <p className="text-xs text-red-600/80 leading-relaxed">
                Conforme orientação do PNTP 2026, a simples publicação de um aviso
                informando que o PAC não foi elaborado não é suficiente para pontuar
                neste critério (Critério 8.6). É obrigatória a efetiva elaboração e
                publicação do Plano de Contratações Anual no portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nota Legal */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critério 8.6
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          O Plano de Contratações Anual (PAC) é exigido pela Lei nº 14.133/2021
          (Art. 12, inciso VII) e pela Instrução Normativa SEGES/ME nº 58/2022,
          sendo sua disponibilização no Portal da Transparência requisito obrigatório
          do PNTP 2026 para pontuação plena no Critério 8.6.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 5: Empresas Sancionadas
// ---------------------------------------------------------------------------
function EmpresasSancionadasTab() {
  return (
    <div id="panel-sancionadas" role="tabpanel" aria-labelledby="tab-sancionadas">
      {/* Descrição */}
      <div className="mt-4 mb-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Empresas e Licitantes Sancionados — Critério 8.7
            </p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Relação de empresas e/ou licitantes que foram punidos ou sancionados
              administrativamente pela administração municipal, incluindo nome, CNPJ,
              penalidade aplicada e período de vigência da sanção.
            </p>
          </div>
        </div>
      </div>

      {/* Aviso de Não Ocorrência */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
            <Ban size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Relação de Empresas Sancionadas
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Licitantes e contratados punidos administrativamente
            </p>
          </div>
        </div>

        <div className="px-6 py-16 text-center">
          <div className="max-w-lg mx-auto">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 mx-auto border border-emerald-200">
              <ShieldAlert size={28} className="text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-3">
              Declaração de Inexistência — Empresas Sancionadas
            </h3>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              <p>
                A Prefeitura Municipal de Padre Marcos — PI informa que, no período
                de {new Date().getFullYear() - 2} a {new Date().getFullYear()}, não
                houve aplicação de sanções administrativas a licitantes ou contratados
                no âmbito da administração municipal.
              </p>
              <p className="text-xs text-gray-400 font-medium">
                Declaração atualizada em {new Date().toLocaleDateString('pt-BR')}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critério 8.7
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A divulgação da relação de empresas e licitantes sancionados atende ao
          disposto no PNTP 2026 (Critério 8.7) e na Lei nº 14.133/2021. Caso haja
          aplicação de sanções futuras, este espaço será atualizado com a relação
          completa das penalidades aplicadas.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function LicitacoesPage() {
  const [activeTab, setActiveTab] = useState<
    'licitacoes' | 'dispensas' | 'atas' | 'pac' | 'sancionadas'
  >('licitacoes');
  const [filters, setFilters] = useState<FilterValues>({
    ano: '2026',
    mes: '',
    busca: '',
    entidade: '',
  });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears(
    'licitacoes',
    filters.entidade || undefined
  );

  const handleChange = useCallback(
    (field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}`;
  const hasActiveFilters = !!(
    filters.ano ||
    filters.mes ||
    filters.busca ||
    filters.entidade
  );

  const showFilters = activeTab === 'licitacoes' || activeTab === 'dispensas' || activeTab === 'atas';

  return (
    <ContentPage
      showSearch={false}
      title="Licitações"
      description="Processos licitatórios, dispensas, inexigibilidades, atas de registro de preços, Plano de Contratações Anual e relação de empresas sancionadas — em conformidade com a Lei nº 14.133/2021 e PNTP 2026."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Compras, Contratos e Convênios' },
        { label: 'Licitações' },
      ]}
    >
      {/* Filter Panel — apenas nas abas com dados do banco */}
      {showFilters && (
        <FilterPanel
          anos={ANOS}
          meses={MESES}
          values={filters}
          onChange={handleChange}
          onClear={handleClear}
          anosLoading={anosLoading}
          empresas={EMPRESAS}
        />
      )}

      {/* Abas lado a lado */}
      <div
        className="mt-6 flex flex-wrap gap-1 border-b border-gray-200"
        role="tablist"
        aria-label="Seções de licitações"
      >
        <button
          onClick={() => setActiveTab('licitacoes')}
          role="tab"
          aria-selected={activeTab === 'licitacoes'}
          aria-controls="panel-licitacoes"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'licitacoes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileText size={16} aria-hidden="true" />
          1. Licitações
        </button>
        <button
          onClick={() => setActiveTab('dispensas')}
          role="tab"
          aria-selected={activeTab === 'dispensas'}
          aria-controls="panel-dispensas"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'dispensas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Scale size={16} aria-hidden="true" />
          2. Disp./Inexig.
        </button>
        <button
          onClick={() => setActiveTab('atas')}
          role="tab"
          aria-selected={activeTab === 'atas'}
          aria-controls="panel-atas"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'atas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ShoppingCart size={16} aria-hidden="true" />
          3. Atas SRP
        </button>
        <button
          onClick={() => setActiveTab('pac')}
          role="tab"
          aria-selected={activeTab === 'pac'}
          aria-controls="panel-pac"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'pac'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ClipboardList size={16} aria-hidden="true" />
          4. PAC 🚨
        </button>
        <button
          onClick={() => setActiveTab('sancionadas')}
          role="tab"
          aria-selected={activeTab === 'sancionadas'}
          aria-controls="panel-sancionadas"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'sancionadas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Ban size={16} aria-hidden="true" />
          5. Sancionadas
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'licitacoes' && (
        <RelacaoLicitacoesTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'dispensas' && (
        <DispensasInexigibilidadesTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'atas' && (
        <AtasAdesaoTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'pac' && <PacTab />}

      {activeTab === 'sancionadas' && <EmpresasSancionadasTab />}
    </ContentPage>
  );
}
