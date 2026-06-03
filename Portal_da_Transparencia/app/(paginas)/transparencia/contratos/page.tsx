'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { EMPRESAS } from '@/lib/empresas';
import { FileText, FileSearch, Info } from 'lucide-react';
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

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateString;
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
        query = query.or(
          `contratado.ilike.%${filters.busca}%,numero.ilike.%${filters.busca}%,objeto.ilike.%${filters.busca}%`
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

      <DocumentListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        documentos={modalDocs}
      />
    </ContentPage>
  );
}
