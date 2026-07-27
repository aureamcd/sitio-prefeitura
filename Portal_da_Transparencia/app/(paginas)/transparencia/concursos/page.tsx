'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { FileSearch, Info, Users } from 'lucide-react';
import DocumentListModal from '@/components/ui/DocumentListModal';
import Link from 'next/link';

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateString;
  }
}

function getSituacaoBadge(situacao: string) {
  const s = (situacao || '').toLowerCase();
  if (s === 'em andamento' || s === 'andamento') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (s === 'homologado') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s === 'encerrado') {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function useConcursosData(filters: FilterValues, statusFiltro: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      let query = supabase
        .schema('transparencia')
        .from('concursos_processos_seletivos')
        .select('*, documentos:concursos_documentos(*)');

      if (filters.ano) query = query.eq('ano', filters.ano);
      if (statusFiltro) query = query.eq('situacao', statusFiltro);
      if (filters.busca) {
        query = query.or(
          `titulo.ilike.%${filters.busca}%,descricao.ilike.%${filters.busca}%,numero.ilike.%${filters.busca}%`
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
  }, [filters.ano, statusFiltro, filters.busca, supabase]);

  return { data, loading };
}

export default function ConcursosPage() {
  const [filters, setFilters] = useState<FilterValues>({
    ano: '',
    mes: '',
    busca: '',
  });
  const [statusFiltro, setStatusFiltro] = useState<string>('');

  const { anos: ANOS, loading: anosLoading } = useAvailableYears('concursos_processos_seletivos');

  const { data, loading } = useConcursosData(filters, statusFiltro);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDocs, setModalDocs] = useState<any[]>([]);

  const handleOpenDocs = useCallback((title: string, docs: any[]) => {
    setModalTitle(title);
    setModalDocs(docs || []);
    setModalOpen(true);
  }, []);

  const handleChange = useCallback(
    (field: keyof FilterValues, value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
    setStatusFiltro('');
  }, []);

  const filterKey = `${filters.ano}-${statusFiltro}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || statusFiltro || filters.busca);

  const columns = useMemo(
    () => [
      {
        header: 'Tipo / Nº / Ano',
        accessor: 'numero',
        render: (val: string, row: any) => (
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 mb-1">
              {row.tipo || 'Concurso'}
            </span>
            <p className="text-sm font-semibold text-gray-900">{val ? `${val}/${row.ano}` : row.ano}</p>
          </div>
        ),
      },
      {
        header: 'Título / Descrição',
        accessor: 'titulo',
        render: (val: string, row: any) => (
          <div className="max-w-[280px]">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={val}>
              {val}
            </p>
            {row.descricao && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2" title={row.descricao}>
                {row.descricao}
              </p>
            )}
          </div>
        ),
      },
      {
        header: 'Período',
        accessor: 'data_inicio',
        render: (val: string, row: any) => {
          if (!val && !row.data_fim) return <span className="text-sm text-gray-400">—</span>;
          return (
            <div className="text-sm text-gray-600 whitespace-nowrap">
              <span>{formatDate(val)}</span>
              <span className="mx-1 text-gray-300">a</span>
              <span>{formatDate(row.data_fim)}</span>
            </div>
          );
        },
      },
      {
        header: 'Situação',
        accessor: 'situacao',
        render: (val: string) => (
          <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getSituacaoBadge(val)}`}>
            {val || '-'}
          </span>
        ),
      },
      {
        header: 'Nomeações',
        accessor: 'documentos',
        render: (allDocs: any[], row: any) => {
          const docs = (allDocs || []).filter((d) => {
            const t = (d.tipo_documento || '').toLowerCase();
            return t.includes('nomea') || t.includes('convoca');
          }).map(d => ({
            id: d.id,
            nome_arquivo: d.titulo,
            caminho_r2: d.arquivo_url,
            tipo_documento: d.tipo_documento,
          }));
          const qtd = docs.length;
          return (
            <button
              onClick={() => handleOpenDocs(`Nomeações - ${row.titulo}`, docs)}
              disabled={qtd === 0}
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                qtd > 0
                  ? 'text-blue-600 hover:text-blue-800'
                  : 'text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <Users size={14} />
              {qtd > 0 ? `Nomeações (${qtd})` : 'Sem registros'}
            </button>
          );
        },
      },
      {
        header: 'Documentos',
        accessor: 'documentos_gerais',
        render: (_val: any, row: any) => {
          const allDocs = row.documentos || [];
          const docs = allDocs.filter((d: any) => {
            const t = (d.tipo_documento || '').toLowerCase();
            return !t.includes('nomea') && !t.includes('convoca');
          }).map((d: any) => ({
            id: d.id,
            nome_arquivo: d.titulo,
            caminho_r2: d.arquivo_url,
            tipo_documento: d.tipo_documento,
          }));
          const qtd = docs.length;
          return (
            <button
              onClick={() => handleOpenDocs(`Documentos - ${row.titulo}`, docs)}
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
      title="Concursos e Processos Seletivos"
      description="Acesse a relação completa de concursos públicos e processos seletivos simplificados, com editais, lista de aprovados e nomeações."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/" },
        { label: "Gestão de Pessoas" },
        { label: "Concursos e Seleções" },
      ]}
    >
      
      {/* Filtros */}
      <FilterPanel
        anos={ANOS}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        anosLoading={anosLoading}
        hideMes={true}
        searchPlaceholder="Pesquisar por título, descrição, número..."
      >
        <div className="flex flex-col gap-1 sm:w-48">
          <label className="text-xs font-medium text-gray-600">
            Situação do Certame
          </label>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all h-[42px]"
          >
            <option value="">Todas as situações</option>
            <option value="andamento">Em Andamento</option>
            <option value="homologado">Homologado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </FilterPanel>

      <div className="mt-8">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
              Transparência Ativa
            </p>
            <p className="text-xs text-blue-700/80 mt-0.5">
              Conforme as diretrizes do Programa Nacional de Transparência Pública (PNTP), divulgamos a íntegra dos editais, resultados finais e a lista de aprovados e nomeações.
            </p>
          </div>
        </div>

        <DataTable
          title="Relação de Certames"
          columns={columns}
          data={data}
          exportable={true}
          loading={loading}
          paginationResetKey={filterKey}
          hasActiveFilters={hasActiveFilters}
          emptyMessage="Não há concursos registrados no período informado."
          emptyFilteredMessage="Nenhum concurso encontrado para os filtros selecionados."
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