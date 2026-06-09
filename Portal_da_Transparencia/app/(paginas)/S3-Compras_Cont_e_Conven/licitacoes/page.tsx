'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { EMPRESAS } from '@/lib/empresas';
import { FileSearch, Info } from 'lucide-react';
import DocumentListModal from '@/components/ui/DocumentListModal';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

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

// Hook personalizado para buscar licitações
function useLicitacoesData(filters: FilterValues) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      let query = supabase
        .schema('transparencia')
        .from('licitacoes_v2')
        .select('*, documentos:licitacoes_documentos(*)');

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
          `objeto.ilike.%${filters.busca}%,numero.ilike.%${filters.busca}%,modalidade.ilike.%${filters.busca}%`
        );
      }

      const { data: result, error } = await query
        .order('ano', { ascending: false })
        .order('numero', { ascending: false });

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
  }, [filters.ano, filters.mes, filters.busca, filters.entidade, supabase]);

  return { data, loading };
}

export default function LicitacoesPage() {
  const [filters, setFilters] = useState<FilterValues>({
    ano: '2026',
    mes: '',
    busca: '',
    entidade: '',
  });

  const { anos: ANOS, loading: anosLoading } = useAvailableYears('licitacoes_v2', filters.entidade || undefined);
  const { data, loading } = useLicitacoesData(filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDocs, setModalDocs] = useState<any[]>([]);

  const handleOpenDocs = useCallback((title: string, docs: any[]) => {
    setModalTitle(title);
    setModalDocs(docs || []);
    setModalOpen(true);
  }, []);

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
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.entidade);

  const totalEstimado = data.reduce((s, r) => s + (Number(r.valor_estimado) || 0), 0);

  const licitacaoColumns = useMemo(
    () => [
      {
        header: 'Nº / Modalidade',
        accessor: 'numero',
        render: (val: string, row: any) => {
          const num = val || row.proclic || row.nlicitacao || '-';
          const modalidade = row.modalidade || 'Não informado';
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
        accessor: 'valor_estimado',
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
        header: 'Documentos',
        accessor: 'acoes',
        render: (_: any, row: any) => {
          const docs = row.documentos || [];
          const qtd = docs.length;
          return (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenDocs(`Licitação ${row.numero || '-'}`, docs)}
                disabled={qtd === 0}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  qtd > 0
                    ? 'text-blue-600 hover:text-blue-800'
                    : 'text-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                <FileSearch size={14} />
                {qtd > 0 ? `Anexos (${qtd})` : 'Sem anexos'}
              </button>
              
              {row.link_tce && (
                <a 
                  href={row.link_tce} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 transition-colors"
                  title="Abrir detalhes no mural de licitações do TCE"
                >
                  Ver no TCE
                </a>
              )}
            </div>
          );
        },
      },
    ],
    [handleOpenDocs]
  );

  return (
    <ContentPage
      showSearch={false}
      title="Licitações"
      description="Acompanhe os processos licitatórios, editais e resultados da prefeitura em tempo real."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Licitações' },
      ]}
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        anosLoading={anosLoading}
        empresas={EMPRESAS}
      />

      <div className="mt-6">
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

        <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Documentos Anexados
            </p>
            <p className="text-xs text-blue-700/80 mt-0.5">
              Clique em "Ver Anexos" para visualizar e baixar Editais, Avisos, Homologações e Atas de cada processo.
            </p>
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
            disponíveis para consulta e download em PDF.
          </p>
        </div>
      </div>

      <DocumentListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        documentos={modalDocs}
      />
    </ContentPage>
  );
}
