'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { EMPRESAS } from '@/lib/empresas';
import { FileText, FileSearch, Info, CalendarDays } from 'lucide-react';
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    // If already in DD/MM/YYYY format, return as-is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    // ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    const clean = dateStr.split('T')[0];
    const [year, month, day] = clean.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  } catch {
    return dateStr;
  }
}

// Hook: busca contratos_v2 do banco
function useContratosData(filters: FilterValues) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      let query = supabase
        .schema('transparencia')
        .from('contratos_v2')
        .select('*, documentos:contratos_documentos(*)');

      if (filters.ano) query = query.eq('ano', filters.ano);
      if (filters.mes) {
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.ilike('data_assinatura', `${prefix}%`);
      }
      if (filters.busca) {
        const b = filters.busca.trim();
        query = query.or(
          `contratado.ilike.%${b}%,numero.ilike.%${b}%,objeto.ilike.%${b}%,cpf_cnpj.ilike.%${b}%`
        );
      }

      const { data: result, error } = await query
        .order('ano', { ascending: false })
        .order('numero', { ascending: false });

      if (cancelled) return;
      setData(!error && result ? result : []);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters.ano, filters.mes, filters.busca]);

  return { data, loading };
}

export default function ContratosPage() {
  const [activeTab, setActiveTab] = useState<'contratos' | 'ordem_cronologica'>('contratos');

  const [filters, setFilters] = useState<FilterValues>({
    ano: '2026',
    mes: '',
    busca: '',
  });

  // Temporariamente não passa a tabela, apenas deixa a lista estática ou ignora, 
  // já que contratos_v2 não está na view padrão de availableYears se não foi atualizada.
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('contratos_v2');

  const { data, loading } = useContratosData(filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDocs, setModalDocs] = useState<any[]>([]);

  const handleOpenDocs = useCallback((title: string, docs: any[]) => {
    setModalTitle(title);
    setModalDocs(docs || []);
    setModalOpen(true);
  }, []);

  // Ler parâmetros da URL na montagem inicial (ex: vindo da tela de despesas)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const buscaParam = params.get('busca');
      if (buscaParam) {
        setFilters((prev) => ({ ...prev, busca: buscaParam }));
      }
    }
  }, []);

  // Se veio via link com busca, abre o modal de seleção de documentos do contrato automaticamente
  useEffect(() => {
    if (!loading && data.length > 0 && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const buscaParam = params.get('busca');
      const abrirDocParam = params.get('abrirDoc');
      if (buscaParam && (abrirDocParam === 'true' || data.length === 1)) {
        const first = data[0];
        const docs = first.documentos && Array.isArray(first.documentos) && first.documentos.length > 0
          ? first.documentos
          : first.arquivo_url
          ? [{ id: '1', nome_arquivo: `Contrato / Íntegra - ${first.numero || 'Arquivo'}`, url_arquivo: first.arquivo_url, tipo_documento: 'Contrato Principal' }]
          : [];
        if (docs.length > 0) {
          handleOpenDocs(`Contrato ${first.numero || '-'}`, docs);
        }
      }
    }
  }, [loading, data, handleOpenDocs]);

  const handleChange = useCallback(
    (field: 'ano' | 'mes' | 'busca', value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  const totalContratos = data.length;
  const totalValor = data.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const vigentes = data.filter((r) => {
    const s = (r.situacao || '').toLowerCase();
    return s.includes('vigent') || s.includes('ativo') || s === 'a';
  }).length;

  const columns = useMemo(
    () => [
      {
        header: 'Nº Contrato / Processo',
        accessor: 'numero',
        render: (val: string, row: any) => (
          <div>
            <p className="text-sm font-semibold text-gray-900">{val || '-'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{row.processo ? `Processo: ${row.processo}` : `Ano: ${row.ano}`}</p>
          </div>
        ),
      },
      {
        header: 'Contratado',
        accessor: 'contratado',
        render: (val: string, row: any) => (
          <div className="max-w-[200px]">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={val || 'N/I'}>
              {val || 'Não Identificado (Busca em andamento...)'}
            </p>
            {row.cpf_cnpj && (
              <p className="text-xs text-gray-500 mt-0.5">{row.cpf_cnpj}</p>
            )}
          </div>
        ),
      },
      {
        header: 'Fiscal',
        accessor: 'fiscal_nome',
        render: (val: string) => (
          <span className="text-sm text-gray-700">
            {val || (
              <span className="text-xs text-gray-400 italic">Não informado</span>
            )}
          </span>
        ),
      },
      {
        header: 'Objeto',
        accessor: 'objeto',
        render: (val: string) => (
          <span
            className="block max-w-[240px] text-sm text-gray-700"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={val}
          >
            {val || '—'}
          </span>
        ),
      },
      {
        header: 'Vigência',
        accessor: 'data_inicio',
        render: (val: string, row: any) => {
          if (!val && !row.data_fim) return <span className="text-sm text-gray-400">—</span>;
          return (
            <div className="text-sm text-gray-600 whitespace-nowrap">
              <span>{formatDate(val)}</span>
              <span className="mx-1 text-gray-300">→</span>
              <span>{formatDate(row.data_fim)}</span>
            </div>
          );
        },
      },
      {
        header: 'Valor',
        accessor: 'valor',
        render: (val: number) => (
          <span className="block text-right tabular-nums text-sm font-semibold text-gray-800">
            {formatBRL(Number(val))}
          </span>
        ),
      },
      {
        header: 'Documentos',
        accessor: 'documentos',
        render: (docs: any[], row: any) => {
          const qtd = docs?.length || 0;
          return (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenDocs(`Contrato ${row.numero || '-'}`, docs)}
                disabled={qtd === 0}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  qtd > 0
                    ? 'text-blue-600 hover:text-blue-800'
                    : 'text-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                <FileSearch size={14} />
                {qtd > 0 ? `Ver Anexos (${qtd})` : 'Sem anexos'}
              </button>

              {row.link_tce && (
                <a 
                  href={row.link_tce} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 transition-colors"
                  title="Abrir detalhes no mural de contratos do TCE"
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
      title="Contratos"
      description="Contratos celebrados pela administração municipal, com base na Lei nº 14.133/2021."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Contratos' },
      ]}
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        anosLoading={anosLoading}
      />

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist" aria-label="Seções de contratos">
        <button onClick={() => setActiveTab('contratos')} role="tab" aria-selected={activeTab === 'contratos'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'contratos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <FileText size={16} />Contratos e Aditivos
        </button>
        <button onClick={() => setActiveTab('ordem_cronologica')} role="tab" aria-selected={activeTab === 'ordem_cronologica'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'ordem_cronologica' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <CalendarDays size={16} />Ordem Cronológica de Pagamentos
        </button>
      </div>

      {/* Tab: Contratos */}
      {activeTab === 'contratos' && (
      <div className="mt-6">
        <div className="mt-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Total de Contratos
            </p>
            {loading ? (
              <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalContratos}</p>
            )}
          </div>
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
              Valor Total Contratado
            </p>
            {loading ? (
              <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl font-semibold text-gray-900 tabular-nums">{formatBRL(totalValor)}</p>
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
              Clique em "Ver Anexos" para visualizar os Extratos, Contratos Originais e Termos Aditivos vinculados a cada registro.
            </p>
          </div>
        </div>

        <DataTable
          title="Relação de Contratos e Aditivos"
          columns={columns}
          data={data}
          exportable={true}
          loading={loading}
          paginationResetKey={filterKey}
          hasActiveFilters={hasActiveFilters}
          emptyMessage="Não há contratos registrados no período informado."
          emptyFilteredMessage="Nenhum contrato encontrado para os filtros selecionados."
        />
      </div>
      )}

      {/* Tab: Ordem Cronológica de Pagamentos */}
      {activeTab === 'ordem_cronologica' && (
        <OrdemCronologicaTab ano={filters.ano} mes={filters.mes} busca={filters.busca} />
      )}

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Fundamentação Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          Os contratos e a ordem cronológica de pagamentos são publicados em conformidade com a Lei nº 14.133/2021
          (Nova Lei de Licitações e Contratos Administrativos), Lei de Transparência (LC nº 131/2009) e o PNTP 2026.
        </p>
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

// ===================================================================
// COMPONENTE: Ordem Cronológica de Pagamentos
// ===================================================================

function OrdemCronologicaTab({ ano, mes, busca }: { ano: string; mes: string; busca: string }) {
  const supabase = createBrowserClient();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        let query = supabase
          .schema('transparencia')
          .from('ordem_cronologica_pagamentos')
          .select('*');

        if (ano) query = query.eq('ano', ano);
        if (mes) {
          query = query.eq('mes', parseInt(mes));
        }
        if (busca) {
          query = query.or(
            `fornecedor.ilike.%${busca}%,empenho.ilike.%${busca}%,historico.ilike.%${busca}%`
          );
        }

        const { data: result, error } = await query
          .order('data_pagamento', { ascending: false, nullsFirst: false })
          .order('ano', { ascending: false });

        if (cancelled) return;
        if (error) {
          console.error('Erro ao carregar ordem cronológica:', error);
          setData([]);
        } else {
          setData(result || []);
        }
      } catch (err) {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timer = setTimeout(fetchData, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [ano, mes, busca, supabase]);

  const totalPago = useMemo(() => data.reduce((s, r) => s + (Number(r.valor_pago) || 0), 0), [data]);
  const totalPendente = data.filter((r) => !r.data_pagamento).length;

  const ocpColumns = useMemo(
    () => [
      {
        header: 'Fornecedor',
        accessor: 'fornecedor',
        render: (val: string, row: any) => (
          <div className="max-w-[200px]">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={val || ''}>
              {val || '—'}
            </p>
            {row.cpf_cnpj_fornecedor && (
              <p className="text-xs text-gray-500 mt-0.5">{row.cpf_cnpj_fornecedor}</p>
            )}
          </div>
        ),
      },
      {
        header: 'Empenho',
        accessor: 'empenho',
        render: (val: string) => (
          <span className="text-xs font-mono text-gray-700">{val || '—'}</span>
        ),
      },
      {
        header: 'Vencimento',
        accessor: 'data_vencimento',
        render: (val: string, row: any) => {
          const venc = val ? new Date(val) : null;
          const pago = row.data_pagamento ? new Date(row.data_pagamento) : null;
          const atrasado = venc && pago && pago > venc;
          return (
            <div className="text-sm text-gray-600 whitespace-nowrap">
              <span>{formatDate(val)}</span>
              {atrasado && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold">
                  Atrasado
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: 'Data Pagamento',
        accessor: 'data_pagamento',
        render: (val: string) => (
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {val ? formatDate(val) : (
              <span className="text-xs text-amber-600 font-medium">Pendente</span>
            )}
          </span>
        ),
      },
      {
        header: 'Valor Pago',
        accessor: 'valor_pago',
        render: (val: number) => (
          <span className="block text-right tabular-nums text-sm font-semibold text-gray-800">
            {formatBRL(Number(val))}
          </span>
        ),
      },
    ],
    []
  );

  const filterKey = `${ano}-${mes}-${busca}`;
  const hasActiveFilters = !!(ano || mes || busca);

  return (
    <div className="mt-6">
      {/* Stats */}
      <div className="mt-4 bg-white border border-teal-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Total de Pagamentos
          </p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{data.length}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Total Pago
          </p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-teal-700 tabular-nums">{formatBRL(totalPago)}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Pendentes
          </p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className={`text-xl font-semibold tabular-nums ${totalPendente > 0 ? 'text-amber-600' : 'text-gray-800'}`}>{totalPendente}</p>
          )}
        </div>
      </div>

      {/* Info sobre justificativas */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50 px-5 py-3">
        <Info size={16} className="text-teal-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            Ordem Cronológica de Pagamentos — Critério 9.4 do PNTP 2026
          </p>
          <p className="text-xs text-teal-700/80 mt-0.5">
            Os pagamentos são apresentados em ordem cronológica, conforme determina a Lei nº 14.133/2021.
            As justificativas para eventuais alterações na ordem cronológica estão registradas nos detalhes de cada pagamento.
          </p>
        </div>
      </div>

      <DataTable
        title="Ordem Cronológica de Pagamentos"
        columns={ocpColumns}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage="Não há registros de pagamentos na ordem cronológica para o período informado."
        emptyFilteredMessage="Nenhum pagamento encontrado para os filtros selecionados."
      />
    </div>
  );
}
