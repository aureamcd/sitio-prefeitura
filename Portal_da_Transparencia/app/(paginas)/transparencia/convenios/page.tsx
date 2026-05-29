'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Handshake,
  FileText,
  ExternalLink,
  Info,
} from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

function formatBRL(value: number | null | undefined): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface TransferenciaResumoRow {
  id: string;
  ano: number;
  empresa_codigo: number | null;
  empresa: string | null;
  mes: number | null;
  entidade_pagadora: string | null;
  entidade_recebedora: string | null;
  cnpj_pagadora: string | null;
  cnpj_recebedora: string | null;
  valor_previsto: number | null;
  valor_repasse: number | null;
  valor_devolucao: number | null;
}

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
            Declaração atualizada em {new Date().toLocaleDateString('pt-BR')}.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConveniosPage() {
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'recebidas' | 'realizadas' | 'acordos'>('recebidas');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '' });

  const [data, setData] = useState<TransferenciaResumoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();
  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .schema('transparencia')
          .from('transferencias_resumo')
          .select('*');

        if (filters.ano) query = query.eq('ano', Number(filters.ano));
        if (filters.busca) {
          query = query.or(
            `entidade_pagadora.ilike.%${filters.busca}%` +
            `,entidade_recebedora.ilike.%${filters.busca}%` +
            `,cnpj_pagadora.ilike.%${filters.busca}%` +
            `,cnpj_recebedora.ilike.%${filters.busca}%`
          );
        }

        const { data: result, error } = await query
          .order('ano', { ascending: false })
          .order('mes', { ascending: false });

        if (cancelled) return;

        if (error) {
          console.warn('transferencias_resumo:', error.message);
          setData([]);
        } else {
          setData((result || []) as TransferenciaResumoRow[]);
        }
      } catch (err) {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(fetchData, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters.ano, filters.busca, supabase]);

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
  }, []);

  // Filter data based on active tab
  // Recebidas: A entidade recebedora é a prefeitura (ou fundos)
  const recebidasData = useMemo(() => {
    return data.filter(d => 
      // Recebe da união/estado ou outras entidades externas.
      (d.entidade_recebedora && d.entidade_recebedora.toUpperCase().includes('PADRE MARCOS')) ||
      (d.entidade_pagadora && !d.entidade_pagadora.toUpperCase().includes('PADRE MARCOS'))
    );
  }, [data]);

  // Realizadas: Prefeitura ou Fundo é a entidade pagadora para terceiros
  const realizadasData = useMemo(() => {
    return data.filter(d => 
      (d.entidade_pagadora && d.entidade_pagadora.toUpperCase().includes('PADRE MARCOS')) &&
      (d.entidade_recebedora && !d.entidade_recebedora.toUpperCase().includes('PADRE MARCOS'))
    );
  }, [data]);

  // Acordos sem valor financeiro: valor_previsto = 0 e repasse = 0
  const acordosData = useMemo(() => {
    return data.filter(d => 
      (Number(d.valor_previsto) === 0 && Number(d.valor_repasse) === 0)
    );
  }, [data]);

  // Define Columns
  const recebidasColumns = [
    {
      header: 'Órgão ou Poder repassador (Origem)',
      accessor: 'entidade_pagadora',
      render: (val: string) => <span className="text-sm font-medium text-gray-900">{val || '—'}</span>
    },
    {
      header: 'Número/ano do convênio ou instrumento',
      accessor: 'id',
      render: () => <span className="text-xs text-gray-500">—</span>
    },
    {
      header: 'Objeto do convênio',
      accessor: 'objeto',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Vigência (prazo)',
      accessor: 'vigencia',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Valor total previsto',
      accessor: 'valor_previsto',
      render: (val: number) => <span className="text-sm font-semibold text-blue-700 tabular-nums">{formatBRL(val)}</span>
    },
    {
      header: 'Valores já recebidos',
      accessor: 'valor_repasse',
      render: (val: number) => <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatBRL(val)}</span>
    },
    {
      header: 'Inteiro Teor (PDF)',
      accessor: 'pdf',
      render: () => <span className="text-xs text-gray-400">—</span>
    }
  ];

  const realizadasColumns = [
    {
      header: 'Beneficiário (Entidade Recebedora)',
      accessor: 'entidade_recebedora',
      render: (val: string) => <span className="text-sm font-medium text-gray-900">{val || '—'}</span>
    },
    {
      header: 'Número/ano do convênio ou instrumento',
      accessor: 'id',
      render: () => <span className="text-xs text-gray-500">—</span>
    },
    {
      header: 'Objeto do repasse',
      accessor: 'objeto',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Vigência (prazo)',
      accessor: 'vigencia',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Valor total previsto',
      accessor: 'valor_previsto',
      render: (val: number) => <span className="text-sm font-semibold text-blue-700 tabular-nums">{formatBRL(val)}</span>
    },
    {
      header: 'Valores já concedidos',
      accessor: 'valor_repasse',
      render: (val: number) => <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatBRL(val)}</span>
    },
    {
      header: 'Inteiro Teor (PDF)',
      accessor: 'pdf',
      render: () => <span className="text-xs text-gray-400">—</span>
    }
  ];

  const acordosColumns = [
    {
      header: 'Nome das partes',
      accessor: 'partes',
      render: (val: string, row: any) => (
        <span className="text-sm font-medium text-gray-900">
          {row.entidade_pagadora || '—'} e {row.entidade_recebedora || '—'}
        </span>
      )
    },
    {
      header: 'Número/ano do ajuste',
      accessor: 'id',
      render: () => <span className="text-xs text-gray-500">—</span>
    },
    {
      header: 'Objeto do ajuste',
      accessor: 'objeto',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Vigência',
      accessor: 'vigencia',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Inteiro Teor (PDF)',
      accessor: 'pdf',
      render: () => <span className="text-xs text-gray-400">—</span>
    }
  ];

  const { anos: ANOS } = useAvailableYears('transferencias_resumo');

  return (
    <ContentPage
      showSearch={false}
      title="Convênios e Transferências"
      description="Transferências voluntárias recebidas e concedidas, além de acordos sem repasse financeiro — conforme Critérios 5.1, 5.2 e 5.3 do PNTP 2026."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Compras, Contratos e Convênios', href: '/S3-Compras_Cont_e_Conven' },
        { label: 'Convênios e Transferências' },
      ]}
      lastUpdate={today}
      responsible="Secretaria Municipal de Finanças e Planejamento"
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      />

      {/* Abas */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
        <button
          onClick={() => setActiveTab('recebidas')}
          role="tab"
          aria-selected={activeTab === 'recebidas'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'recebidas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ArrowDownToLine size={16} />
          Transferências Recebidas
        </button>
        <button
          onClick={() => setActiveTab('realizadas')}
          role="tab"
          aria-selected={activeTab === 'realizadas'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'realizadas'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ArrowUpFromLine size={16} />
          Transferências Realizadas
        </button>
        <button
          onClick={() => setActiveTab('acordos')}
          role="tab"
          aria-selected={activeTab === 'acordos'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'acordos'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Handshake size={16} />
          Acordos sem Transferência Financeira
        </button>
      </div>

      {activeTab === 'recebidas' && (
        <div role="tabpanel">
          {recebidasData.length > 0 ? (
            <DataTable
              columns={recebidasColumns}
              data={recebidasData}
              title="Transferências Recebidas"
              caption="Convênios e repasses onde o município atuou como beneficiário."
              exportable
              loading={loading}
              error={error}
              paginationResetKey={filterKey}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <DeclaracaoInexistencia
              titulo="Aviso de Não Ocorrência"
              descricao={`Não foram recebidas transferências voluntárias no período de 01/01${filters.ano ? '/' + filters.ano : ''} a 31/12${filters.ano ? '/' + filters.ano : ''}.`}
              icon={ArrowDownToLine}
              colorClass="bg-blue-100"
            />
          )}
        </div>
      )}

      {activeTab === 'realizadas' && (
        <div role="tabpanel">
          {realizadasData.length > 0 ? (
            <DataTable
              columns={realizadasColumns}
              data={realizadasData}
              title="Transferências Realizadas"
              caption="Recursos que a Prefeitura repassou para terceiros (ONGs, associações, fundações, etc)."
              exportable
              loading={loading}
              error={error}
              paginationResetKey={filterKey}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <DeclaracaoInexistencia
              titulo="Aviso de Não Ocorrência"
              descricao={`Não foram realizados repasses ou transferências voluntárias de recursos no período de 01/01${filters.ano ? '/' + filters.ano : ''} a 31/12${filters.ano ? '/' + filters.ano : ''}.`}
              icon={ArrowUpFromLine}
              colorClass="bg-emerald-100"
            />
          )}
        </div>
      )}

      {activeTab === 'acordos' && (
        <div role="tabpanel">
          {acordosData.length > 0 ? (
            <DataTable
              columns={acordosColumns}
              data={acordosData}
              title="Acordos sem Transferência Financeira"
              caption="Acordos de cooperação técnica, termos de parceria ou ajustes sem envolvimento financeiro."
              exportable
              loading={loading}
              error={error}
              paginationResetKey={filterKey}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <DeclaracaoInexistencia
              titulo="Aviso de Não Ocorrência"
              descricao={`Não houve acordos sem transferência financeira no período de 01/01${filters.ano ? '/' + filters.ano : ''} a 31/12${filters.ano ? '/' + filters.ano : ''}.`}
              icon={Handshake}
              colorClass="bg-purple-100"
            />
          )}
        </div>
      )}
    </ContentPage>
  );
}
