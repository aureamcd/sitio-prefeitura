'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { EMPRESAS, getEmpresaNome } from '@/lib/empresas';
import { Landmark, MapPin, ArrowRightLeft } from 'lucide-react';

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

export default function TransferenciasPage() {
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'uniao' | 'estado' | 'entidades'>('uniao');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '', entidade: '' });

  const [receitasData, setReceitasData] = useState<any[]>([]);
  const [transferenciasData, setTransferenciasData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();
  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.entidade);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === 'uniao' || activeTab === 'estado') {
          let query = supabase
            .schema('transparencia')
            .from('receitas_transferencias')
            .select('*')
            .eq('tipo', activeTab === 'uniao' ? 'UNIAO' : 'ESTADO');

          if (filters.ano) query = query.eq('exercicio', Number(filters.ano));
          if (filters.busca) {
            query = query.or(
              `codigo.ilike.%${filters.busca}%` +
              `,especificacao.ilike.%${filters.busca}%`
            );
          }

          const { data, error: err } = await query
            .order('exercicio', { ascending: false })
            .order('ordem', { ascending: true });

          if (cancelled) return;
          if (err) throw err;
          setReceitasData(data || []);
        } else {
          // Transferencias Entre Entidades
          let query = supabase
            .schema('transparencia')
            .from('transferencias_entre_entidades')
            .select('*');

          if (filters.ano) query = query.eq('exercicio', Number(filters.ano));
          if (filters.mes) query = query.eq('mes', Number(filters.mes));
          if (filters.entidade) {
            const empNome = getEmpresaNome(filters.entidade);
            query = query.or(
              `entidade_pagadora.ilike.%${empNome}%` +
              `,entidade_recebedora.ilike.%${empNome}%`
            );
          }
          if (filters.busca) {
            query = query.or(
              `entidade_pagadora.ilike.%${filters.busca}%` +
              `,entidade_recebedora.ilike.%${filters.busca}%` +
              `,cnpj_pagadora.ilike.%${filters.busca}%` +
              `,cnpj_recebedora.ilike.%${filters.busca}%`
            );
          }

          const { data, error: err } = await query
            .order('exercicio', { ascending: false })
            .order('mes', { ascending: false });

          if (cancelled) return;
          if (err) throw err;
          setTransferenciasData(data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setError('Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.');
          if (activeTab === 'entidades') setTransferenciasData([]);
          else setReceitasData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(fetchData, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeTab, filters.ano, filters.mes, filters.busca, filters.entidade, supabase]);

  const handleChange = useCallback((field: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
  }, []);

  // Columns: Receitas (Uniao/Estado)
  const receitasColumns = [
    {
      header: 'Código',
      accessor: 'codigo',
      render: (val: string) => <span className="text-sm font-medium text-gray-900">{val || '—'}</span>
    },
    {
      header: 'Especificação',
      accessor: 'especificacao',
      render: (val: string) => <span className="text-sm text-gray-700">{val || '—'}</span>
    },
    {
      header: 'Prev. Inicial',
      accessor: 'previsao_inicial',
      render: (val: number) => <span className="text-sm tabular-nums text-gray-600">{formatBRL(val)}</span>
    },
    {
      header: 'Prev. Atualizada',
      accessor: 'previsao_atualizada',
      render: (val: number) => <span className="text-sm tabular-nums font-medium text-blue-700">{formatBRL(val)}</span>
    },
    {
      header: 'Arrecadado Período',
      accessor: 'arrecadado_periodo',
      render: (val: number) => <span className="text-sm tabular-nums font-semibold text-emerald-600">{formatBRL(val)}</span>
    },
    {
      header: 'Arrecadado Total',
      accessor: 'arrecadado_total',
      render: (val: number) => <span className="text-sm tabular-nums font-bold text-emerald-700">{formatBRL(val)}</span>
    }
  ];

  // Columns: Transferencias Entre Entidades
  const transferenciasColumns = [
    {
      header: 'Mês',
      accessor: 'mes',
      render: (val: number) => <span className="text-sm font-medium text-gray-900">{val ? val.toString().padStart(2, '0') : '—'}</span>
    },
    {
      header: 'Pagadora',
      accessor: 'entidade_pagadora',
      render: (val: string, row: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{val || '—'}</span>
          {row.cnpj_pagadora && <span className="text-xs text-gray-500">CNPJ: {row.cnpj_pagadora}</span>}
        </div>
      )
    },
    {
      header: 'Recebedora',
      accessor: 'entidade_recebedora',
      render: (val: string, row: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{val || '—'}</span>
          {row.cnpj_recebedora && <span className="text-xs text-gray-500">CNPJ: {row.cnpj_recebedora}</span>}
        </div>
      )
    },
    {
      header: 'Concedida (Repasse)',
      accessor: 'repasse',
      render: (val: number) => <span className="text-sm tabular-nums font-semibold text-blue-600">{formatBRL(val)}</span>
    },
    {
      header: 'Recebida (Devolução)',
      accessor: 'devolucao',
      render: (val: number) => <span className="text-sm tabular-nums font-medium text-purple-600">{formatBRL(val)}</span>
    },
    {
      header: 'Previsto',
      accessor: 'previsto',
      render: (val: number) => <span className="text-sm tabular-nums text-gray-500">{formatBRL(val)}</span>
    }
  ];

  const anosTransf = useAvailableYears('transferencias_entre_entidades');
  const anosReceitas = useAvailableYears('receitas_transferencias');
  
  // Combine unique years
  const ANOS = Array.from(new Set([...anosTransf.anos, ...anosReceitas.anos, '2026', '2025', '2024', '2023'])).sort((a, b) => Number(b) - Number(a));

  return (
    <ContentPage
      showSearch={false}
      title="Transferências Constitucionais e Legais"
      description="Consulta às receitas arrecadadas através de transferências da União e Estado, e aos repasses/devoluções entre as próprias entidades municipais."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Transferências' },
      ]}
      lastUpdate={today}
      responsible="Secretaria Municipal de Finanças"
    >
      <FilterPanel
        anos={ANOS}
        meses={activeTab === 'entidades' ? MESES : undefined}
        empresas={activeTab === 'entidades' ? EMPRESAS : undefined}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      />

      {/* Abas */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
        <button
          onClick={() => setActiveTab('uniao')}
          role="tab"
          aria-selected={activeTab === 'uniao'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'uniao'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Landmark size={16} />
          Receitas da União
        </button>
        <button
          onClick={() => setActiveTab('estado')}
          role="tab"
          aria-selected={activeTab === 'estado'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'estado'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <MapPin size={16} />
          Receitas do Estado
        </button>
        <button
          onClick={() => setActiveTab('entidades')}
          role="tab"
          aria-selected={activeTab === 'entidades'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'entidades'
              ? 'border-purple-600 text-purple-600 bg-purple-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ArrowRightLeft size={16} />
          Transferências Entre Entidades
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'uniao' && (
          <DataTable
            columns={receitasColumns}
            data={receitasData}
            title="Receitas da União"
            caption="Transferências da União e de suas entidades (Cotas-parte do FPM, FUNDEB, etc)."
            exportable
            loading={loading}
            error={error}
            paginationResetKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {activeTab === 'estado' && (
          <DataTable
            columns={receitasColumns}
            data={receitasData}
            title="Receitas do Estado"
            caption="Transferências dos Estados e suas entidades (Cota-parte do ICMS, IPVA, etc)."
            exportable
            loading={loading}
            error={error}
            paginationResetKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {activeTab === 'entidades' && (
          <DataTable
            columns={transferenciasColumns}
            data={transferenciasData}
            title="Transferências Entre Entidades"
            caption="Repasses e devoluções financeiras realizadas entre a Prefeitura, Fundos e a Câmara Municipal."
            exportable
            loading={loading}
            error={error}
            paginationResetKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        )}
      </div>
    </ContentPage>
  );
}
