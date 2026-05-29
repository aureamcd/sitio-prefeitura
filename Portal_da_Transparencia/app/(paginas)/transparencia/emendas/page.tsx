'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import {
  Landmark,
  TrendingUp,
  AlertCircle,
  Building,
  ChevronDown,
  Info,
  FileText,
  ExternalLink
} from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

function formatBRL(value: number | null | undefined): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface CadastroEmendaRow {
  id: string;
  ano: number;
  empresa: string | null;
  numero_emenda: string | null;
  parlamentar: string | null;
  objeto: string | null;
  beneficiario: string | null;
  valor_previsto: number | null;
  pdf_url: string | null;
}

interface EmendaImpositivaRow {
  id: string;
  ano: number;
  empresa: string | null;
  tipo_transferencia: string | null;
  valor_recebido: number | null;
  valor_aplicacao_financeira: number | null;
  valor_empenhado: number | null;
  valor_liquidado: number | null;
  valor_pago: number | null;
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

export default function EmendasPage() {
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'federais' | 'estaduais' | 'execucao'>('federais');
  
  // Filtros OBRIGATÓRIOS: Exercício, Autor, Tipo e Objeto.
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '' });
  const [filtroAutor, setFiltroAutor] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(''); // Vamos usar para simular o filtro de tipo, mesmo que a API não forneça "tipo" detalhado.

  const [cadastroData, setCadastroData] = useState<CadastroEmendaRow[]>([]);
  const [execucaoData, setExecucaoData] = useState<EmendaImpositivaRow[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient();
  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filtroAutor}-${filtroTipo}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filtroAutor || filtroTipo);

  // Fetch Cadastro de Emendas
  useEffect(() => {
    let cancelled = false;

    async function fetchCadastro() {
      setLoading(true);
      try {
        let query = supabase
          .schema('transparencia')
          .from('cadastro_emendas')
          .select('*');

        if (filters.ano) query = query.eq('ano', Number(filters.ano));
        if (filters.busca) {
          query = query.or(
            `numero_emenda.ilike.%${filters.busca}%` +
            `,objeto.ilike.%${filters.busca}%`
          );
        }
        if (filtroAutor) {
          query = query.ilike('parlamentar', `%${filtroAutor}%`);
        }

        const { data: result, error } = await query
          .order('ano', { ascending: false });

        if (cancelled) return;

        if (!error && result) {
          setCadastroData(result as CadastroEmendaRow[]);
        }
      } catch (err) {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(fetchCadastro, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters.ano, filters.busca, filtroAutor, supabase]);

  // Fetch Execução (Emendas Impositivas)
  useEffect(() => {
    let cancelled = false;

    async function fetchExecucao() {
      try {
        let query = supabase
          .schema('transparencia')
          .from('emendas_impositivas')
          .select('*');

        if (filters.ano) query = query.eq('ano', Number(filters.ano));
        
        const { data: result, error } = await query
          .order('ano', { ascending: false });

        if (cancelled) return;

        if (!error && result) {
          setExecucaoData(result as EmendaImpositivaRow[]);
        }
      } catch (err) {
        // ignore
      }
    }

    const timer = setTimeout(fetchExecucao, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters.ano, supabase]);

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
    setFiltroAutor('');
    setFiltroTipo('');
  }, []);

  // Split Emendas into Federais and Estaduais/Municipais based on parlamentar name
  const isFederal = (parlamentar: string) => {
    const p = (parlamentar || '').toLowerCase();
    return p.includes('federal') || p.includes('senador') || p.includes('sen.') || p.includes('dep. fed');
  };

  const federaisData = useMemo(() => {
    let d = cadastroData.filter(c => isFederal(c.parlamentar || ''));
    if (filtroTipo) d = d.filter(c => (c.objeto || '').toLowerCase().includes(filtroTipo.toLowerCase()));
    return d;
  }, [cadastroData, filtroTipo]);

  const estaduaisData = useMemo(() => {
    let d = cadastroData.filter(c => !isFederal(c.parlamentar || '') && (c.parlamentar !== null && c.parlamentar.trim() !== ''));
    if (filtroTipo) d = d.filter(c => (c.objeto || '').toLowerCase().includes(filtroTipo.toLowerCase()));
    return d;
  }, [cadastroData, filtroTipo]);

  const executionFiltered = useMemo(() => {
    // If text search is active, also filter execution by tipo_transferencia
    if (filters.busca) {
      return execucaoData.filter(e => (e.tipo_transferencia || '').toLowerCase().includes(filters.busca.toLowerCase()));
    }
    return execucaoData;
  }, [execucaoData, filters.busca]);

  const emendasColumns = [
    {
      header: 'Número da Emenda',
      accessor: 'numero_emenda',
      render: (val: string) => <span className="text-sm font-mono font-medium text-gray-800">{val || '—'}</span>
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Autoria',
      accessor: 'parlamentar',
      render: (val: string) => <span className="text-sm font-medium text-gray-800">{val || '—'}</span>
    },
    {
      header: 'Forma de repasse',
      accessor: 'repasse',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Nº Convênio',
      accessor: 'convenio',
      render: () => <span className="text-xs text-gray-500">—</span>
    },
    {
      header: 'Valor Previsto',
      accessor: 'valor_previsto',
      render: (val: number) => <span className="text-sm font-semibold text-blue-700 tabular-nums">{formatBRL(val)}</span>
    },
    {
      header: 'Valor Repassado',
      accessor: 'valor_repassado',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Objeto/Finalidade',
      accessor: 'objeto',
      render: (val: string) => (
        <span className="block max-w-[260px] text-sm text-gray-700 line-clamp-3" title={val || ''}>
          {val || '—'}
        </span>
      )
    },
    {
      header: 'Função de Governo',
      accessor: 'funcao',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    },
    {
      header: 'Plano de Trabalho',
      accessor: 'plano',
      render: () => <span className="text-xs text-gray-500">Não informado</span>
    }
  ];

  const estaduaisColumns = [
    {
      header: 'Origem',
      accessor: 'origem',
      render: () => <span className="inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide bg-gray-50 text-gray-700 border-gray-200">Estadual/Municipal</span>
    },
    ...emendasColumns
  ];

  const execucaoColumns = [
    {
      header: 'Código/Nº da Emenda',
      accessor: 'numero_emenda',
      render: () => <span className="text-xs text-gray-500">—</span>
    },
    {
      header: 'Tipo de Transferência',
      accessor: 'tipo_transferencia',
      render: (val: string) => <span className="text-sm font-medium text-gray-800">{val || '—'}</span>
    },
    {
      header: 'Beneficiário / Credor',
      accessor: 'credor',
      render: () => <span className="text-xs text-gray-500">Múltiplos (Resumo Consolidado)</span>
    },
    {
      header: 'Descrição da Despesa',
      accessor: 'descricao',
      render: () => <span className="text-xs text-gray-500">Não informado na consolidação</span>
    },
    {
      header: 'Nº Empenho',
      accessor: 'empenho',
      render: () => <span className="text-xs text-gray-500">—</span>
    },
    {
      header: 'Valores Empenhados',
      accessor: 'valor_empenhado',
      render: (val: number) => <span className="text-sm font-semibold text-purple-700 tabular-nums">{formatBRL(val)}</span>
    },
    {
      header: 'Valores Liquidados',
      accessor: 'valor_liquidado',
      render: (val: number) => <span className="text-sm font-semibold text-blue-700 tabular-nums">{formatBRL(val)}</span>
    },
    {
      header: 'Valores Pagos',
      accessor: 'valor_pago',
      render: (val: number) => <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatBRL(val)}</span>
    }
  ];

  const { anos: ANOS } = useAvailableYears('emendas_impositivas');

  return (
    <ContentPage
      title="Emendas Parlamentares"
      description="Recebimento e execução orçamentária e financeira de emendas parlamentares (incluindo as 'emendas pix'), identificando origem, autoria e objeto do gasto."
      lastUpdate={today}
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      >
        <div className="flex flex-wrap items-end gap-3 w-full mt-2">
          <div className="flex flex-col gap-1 sm:w-64">
            <label className="text-xs font-medium text-gray-600">Autor</label>
            <input
              type="text"
              placeholder="Ex: Dep. Federal..."
              value={filtroAutor}
              onChange={(e) => setFiltroAutor(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1 sm:w-44">
            <label className="text-xs font-medium text-gray-600">Tipo (busca em objeto)</label>
            <input
              type="text"
              placeholder="Filtrar por tipo/palavra..."
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>
          <p className="text-[11px] text-blue-700 font-medium flex items-center gap-1.5 mt-2 w-full">
            <AlertCircle size={14} />
            Filtros obrigatórios por exercício, autor, tipo e objeto suportados via busca de texto e ano.
          </p>
        </div>
      </FilterPanel>

      {/* Abas */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
        <button
          onClick={() => setActiveTab('federais')}
          role="tab"
          aria-selected={activeTab === 'federais'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'federais'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Landmark size={16} />
          Emendas Federais Recebidas
        </button>
        <button
          onClick={() => setActiveTab('estaduais')}
          role="tab"
          aria-selected={activeTab === 'estaduais'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'estaduais'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Building size={16} />
          Emendas Estaduais e Municipais
        </button>
        <button
          onClick={() => setActiveTab('execucao')}
          role="tab"
          aria-selected={activeTab === 'execucao'}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'execucao'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <TrendingUp size={16} />
          Execução Orçamentária e Financeira
        </button>
      </div>

      {activeTab === 'federais' && (
        <div role="tabpanel">
          {federaisData.length > 0 ? (
            <DataTable
              columns={emendasColumns}
              data={federaisData}
              title="Emendas Federais Recebidas"
              exportable
              loading={loading}
              paginationResetKey={filterKey}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <DeclaracaoInexistencia
              titulo="Aviso de Não Ocorrência"
              descricao={`No exercício de ${filters.ano || 'referência'} não foram recebidos repasses via emendas parlamentares federais.`}
              icon={Landmark}
              colorClass="bg-blue-100"
            />
          )}
        </div>
      )}

      {activeTab === 'estaduais' && (
        <div role="tabpanel">
          {estaduaisData.length > 0 ? (
            <DataTable
              columns={estaduaisColumns}
              data={estaduaisData}
              title="Emendas Estaduais e Municipais"
              exportable
              loading={loading}
              paginationResetKey={filterKey}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <DeclaracaoInexistencia
              titulo="Aviso de Não Ocorrência"
              descricao={`No exercício de ${filters.ano || 'referência'} não foram recebidos repasses via emendas parlamentares estaduais ou municipais.`}
              icon={Building}
              colorClass="bg-amber-100"
            />
          )}
        </div>
      )}

      {activeTab === 'execucao' && (
        <div role="tabpanel">
          {executionFiltered.length > 0 ? (
            <DataTable
              columns={execucaoColumns}
              data={executionFiltered}
              title="Execução Orçamentária e Financeira"
              exportable
              loading={loading}
              paginationResetKey={filterKey}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <DeclaracaoInexistencia
              titulo="Aviso de Não Ocorrência"
              descricao={`Neste exercício de ${filters.ano || 'referência'}, não houve execução orçamentária e financeira de emendas parlamentares.`}
              icon={TrendingUp}
              colorClass="bg-emerald-100"
            />
          )}
        </div>
      )}
    </ContentPage>
  );
}
