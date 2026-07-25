'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { EMPRESAS } from '@/lib/empresas';
import {
  Construction,
  Info,
  FileText,
  ChevronDown,
  ChevronUp,
  BarChart3,
  DollarSign,
  Calendar,
  MapPin,
  Building2,
  Search,
  PauseCircle,
} from 'lucide-react';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

const SITUACOES = [
  { value: 'andamento', label: 'Em Andamento' },
  { value: 'conclu', label: 'Concluída' },
  { value: 'paralis', label: 'Paralisada' },
  { value: 'projet', label: 'Em Planejamento' },
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

function getSituacaoBadge(situacao: string | null): { label: string; className: string } {
  if (!situacao) return { label: 'Sem informação', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  const s = situacao.toLowerCase().trim();
  if (s.includes('conclu') || s.includes('finaliz') || s === 'c')
    return { label: 'Concluída', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (s.includes('paralis') || s.includes('parada') || s.includes('suspens') || s === 'p')
    return { label: 'Paralisada', className: 'bg-red-100 text-red-700 border-red-200' };
  if (s.includes('andament') || s.includes('execu') || s.includes('ativo') || s === 'a')
    return { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (s.includes('projet') || s.includes('planej') || s === 'r')
    return { label: 'Em Planejamento', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  return { label: situacao, className: 'bg-gray-100 text-gray-700 border-gray-200' };
}

function getPercentualColor(pct: number | null): string {
  if (pct === null || pct === undefined) return 'bg-gray-200';
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 75) return 'bg-blue-500';
  if (pct >= 50) return 'bg-amber-500';
  if (pct >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

// ---------------------------------------------------------------------------
// Hook: busca obras do banco
// ---------------------------------------------------------------------------
function useObrasData(filters: FilterValues & { situacao?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      let query = supabase.schema('transparencia').from('obras').select('*');

      if (filters.entidade) query = query.eq('empresa', filters.entidade);
      if (filters.ano) query = query.eq('ano', Number(filters.ano));
      if (filters.situacao) query = query.ilike('situacao', `%${filters.situacao}%`);
      if (filters.mes) {
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.or(`data_inicio.ilike.${prefix}%,data_previsao_fim.ilike.${prefix}%`);
      }
      if (filters.busca) {
        query = query.or(
          `objeto.ilike.%${filters.busca}%,empresa_responsavel.ilike.%${filters.busca}%,localizacao.ilike.%${filters.busca}%,contrato_numero.ilike.%${filters.busca}%,situacao.ilike.%${filters.busca}%`
        );
      }

      const { data: result, error } = await query
        .order('data_inicio', { ascending: false });

      if (cancelled) return;
      
      let finalData = !error && result ? result : [];
      // Deduplicar obras pelo objeto + contrato para evitar repetições na tela
      const seen = new Set();
      finalData = finalData.filter((obra) => {
        const key = `${obra.objeto}-${obra.contrato_numero}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setData(finalData);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters.ano, filters.mes, filters.busca, filters.entidade, filters.situacao]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// Componente: Detalhamento da Obra (expansível)
// ---------------------------------------------------------------------------
function DetalhamentoObra({ obra }: { obra: any }) {
  return (
    <div className="bg-gray-50/50 p-6 space-y-6">
      {/* Informações Gerais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Calendar size={14} className="text-gray-400" />
                Datas
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Início:</span>{' '}
                {formatDate(obra.data_inicio)}
              </p>
              <p className="text-sm text-gray-700 mt-0.5">
                <span className="font-medium">Previsão Término:</span>{' '}
                {formatDate(obra.data_previsao_fim)}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <Building2 size={14} className="text-gray-400" />
                Contratada
              </div>
              <p className="text-sm font-semibold text-gray-800">
                {obra.empresa_responsavel || 'Execução Direta'}
              </p>
              {obra.cnpj_empresa && (
                <p className="text-xs text-gray-500 mt-0.5">{obra.cnpj_empresa}</p>
              )}
              {!obra.empresa_responsavel && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  Obra executada diretamente pela administração municipal
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <MapPin size={14} className="text-gray-400" />
                Localização
              </div>
              <p className="text-sm text-gray-700">
                {obra.localizacao || 'Não informada'}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                <BarChart3 size={14} className="text-gray-400" />
                Percentual Executado
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getPercentualColor(obra.percentual_executado)}`}
                    style={{ width: `${Math.min(obra.percentual_executado || 0, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-800 tabular-nums">
                  {obra.percentual_executado != null ? `${obra.percentual_executado}%` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Orçamento / Contratado */}
          <div className="bg-white rounded-xl border border-blue-100 p-4">
            <h4 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign size={14} />
              Contratado (Orçamento) — Critério 10.2
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Valor Total Contratado</p>
                <p className="text-lg font-bold text-gray-900 tabular-nums">
                  {obra.valor_total ? formatBRL(Number(obra.valor_total)) : '—'}
                </p>
              </div>
              {obra.contrato_numero && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Nº do Contrato</p>
                  <p className="text-sm font-semibold text-gray-800">{obra.contrato_numero}</p>
                </div>
              )}
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Os quantitativos detalhados (itens, preços unitários, planilha orçamentária)
                  serão disponibilizados nesta seção conforme forem encaminhados pelo setor
                  responsável, em até 25 dias úteis após a assinatura do contrato, conforme
                  exigência do PNTP 2026.
                </p>
              </div>
            </div>
          </div>

          {/* Executado / Efetivamente Pago */}
          <div className="bg-white rounded-xl border border-emerald-100 p-4">
            <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 size={14} />
              Executado (Efetivamente Pago) — Critério 10.3
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">% Executado</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getPercentualColor(obra.percentual_executado)}`}
                      style={{ width: `${Math.min(obra.percentual_executado || 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-800 tabular-nums">
                    {obra.percentual_executado != null ? `${obra.percentual_executado}%` : '—'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Valor Executado</p>
                <p className="text-lg font-bold text-gray-900 tabular-nums">
                  {obra.valor_executado ? formatBRL(Number(obra.valor_executado)) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Saldo a Executar</p>
                <p className="text-lg font-bold text-gray-900 tabular-nums">
                  {obra.valor_total && obra.valor_executado
                    ? formatBRL(Number(obra.valor_total) - Number(obra.valor_executado))
                    : '—'}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Os quantitativos executados (itens medidos, preços unitários pagos, medições
                  parciais) serão detalhados nesta seção conforme as medições forem aprovadas
                  pela fiscalização. O prazo de atualização é de até 25 dias úteis após cada
                  medição.
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 1: Painel Geral de Obras (Critérios 10.1, 10.2, 10.3)
// ---------------------------------------------------------------------------
function PainelGeralObrasTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const { data, loading } = useObrasData(filters);
  const [obraAberta, setObraAberta] = useState<string | null>(null);

  const totalObras = data.length;
  const totalValor = data.reduce((s, r) => s + (Number(r.valor_total) || 0), 0);
  const totalExecutado = data.reduce((s, r) => s + (Number(r.valor_executado) || 0), 0);
  const obrasAndamento = data.filter((r) => {
    const s = (r.situacao || '').toLowerCase();
    return s.includes('andament') || s.includes('execu') || s === 'a';
  }).length;
  const obrasConcluidas = data.filter((r) => {
    const s = (r.situacao || '').toLowerCase();
    return s.includes('conclu') || s.includes('finaliz') || s === 'c';
  }).length;
  const obrasParalisadas = data.filter((r) => {
    const s = (r.situacao || '').toLowerCase();
    return s.includes('paralis') || s.includes('parada') || s.includes('suspens') || s === 'p';
  }).length;

  const columns = useMemo(
    () => [
      {
        header: 'Objeto',
        accessor: 'objeto',
        render: (val: string, row: any) => (
          <div className="max-w-[280px]">
            <p
              className="text-sm font-semibold text-gray-900"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
              title={val}
            >
              {val || '—'}
            </p>
            {row.localizacao && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="shrink-0" />
                {row.localizacao}
              </p>
            )}
          </div>
        ),
      },
      {
        header: 'Situação',
        accessor: 'situacao',
        render: (val: string) => {
          const badge = getSituacaoBadge(val);
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.className}`}>
              {badge.label}
            </span>
          );
        },
      },
      {
        header: 'Data Início',
        accessor: 'data_inicio',
        render: (val: string) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(val)}</span>
        ),
      },
      {
        header: 'Previsão Término',
        accessor: 'data_previsao_fim',
        render: (val: string) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">{formatDate(val)}</span>
        ),
      },
      {
        header: 'Contratada',
        accessor: 'empresa_responsavel',
        render: (val: string, row: any) => (
          <div className="max-w-[180px]">
            <p className="text-sm font-semibold text-gray-800 line-clamp-2" title={val || 'Execução Direta'}>
              {val || 'Execução Direta'}
            </p>
            {row.cnpj_empresa && (
              <p className="text-xs text-gray-500 mt-0.5">{row.cnpj_empresa}</p>
            )}
          </div>
        ),
      },
      {
        header: '% Executado',
        accessor: 'percentual_executado',
        render: (val: number | null, row: any) => (
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getPercentualColor(val)}`}
                style={{ width: `${Math.min(val || 0, 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-700 tabular-nums w-10 text-right">
              {val != null ? `${val}%` : '—'}
            </span>
          </div>
        ),
      },
      {
        header: 'Detalhes',
        accessor: 'id',
        render: (val: string, row: any) => (
          <button
            onClick={() => setObraAberta(obraAberta === val ? null : val)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            {obraAberta === val ? (
              <>Ocultar <ChevronUp size={14} /></>
            ) : (
              <>Custos e Execução <ChevronDown size={14} /></>
            )}
          </button>
        ),
      },
    ],
    [obraAberta]
  );

  return (
    <div id="panel-geral" role="tabpanel" aria-labelledby="tab-geral">
      {/* Totalizers */}
      <div className="mt-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Total de Obras</p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalObras}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Em Andamento</p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-blue-600 tabular-nums">{obrasAndamento}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Concluídas</p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-emerald-600 tabular-nums">{obrasConcluidas}</p>
          )}
        </div>
        {obrasParalisadas > 0 && (
          <>
            <div className="w-px h-8 bg-gray-200 hidden sm:block" />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Paralisadas</p>
              <p className="text-xl font-semibold text-red-500 tabular-nums">{obrasParalisadas}</p>
            </div>
          </>
        )}
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Valor Total Contratado</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">{formatBRL(totalValor)}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Valor Executado</p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-emerald-700 tabular-nums">{formatBRL(totalExecutado)}</p>
          )}
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        title="Painel Geral de Obras"
        columns={columns}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage="Não há obras públicas registradas no período informado."
        emptyFilteredMessage="Nenhuma obra encontrada para os filtros selecionados."
        renderExpandedRow={(row) => <DetalhamentoObra obra={row} />}
        isRowExpanded={(row) => row.id === obraAberta}
      />

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Nota Legal — Critérios 10.1, 10.2 e 10.3
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          As informações de obras públicas e serviços de engenharia são publicadas em conformidade
          com a Lei de Licitações (Lei nº 14.133/2021), a Lei de Transparência (LC nº 131/2009) e
          as normas do Tribunal de Contas do Estado do Piauí — PNTP 2026. O detalhamento dos
          quantitativos contratados e executados, previstos nos Critérios 10.2 e 10.3, será
          atualizado tão logo sejam disponibilizados pelo setor competente, respeitando o prazo
          máximo de 25 dias úteis após a assinatura do contrato.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 2: Obras Paralisadas (Critério 10.4)
// ---------------------------------------------------------------------------
function ObrasParalisadasTab({ filters }: { filters: FilterValues }) {
  const { data: todasObras, loading } = useObrasData(filters);

  // Filtra apenas obras paralisadas
  const obrasParalisadas = useMemo(() => {
    return todasObras.filter((r) => {
      const s = (r.situacao || '').toLowerCase();
      return s.includes('paralis') || s.includes('parada') || s.includes('suspens') || s === 'p';
    });
  }, [todasObras]);

  const columns = useMemo(
    () => [
      {
        header: 'Identificação da Obra',
        accessor: 'objeto',
        render: (val: string, row: any) => (
          <div className="max-w-[260px]">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={val}>
              {val || '—'}
            </p>
            {row.contrato_numero && (
              <p className="text-xs text-gray-500 mt-0.5">Contrato: {row.contrato_numero}</p>
            )}
            {row.localizacao && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="shrink-0" />
                {row.localizacao}
              </p>
            )}
          </div>
        ),
      },
      {
        header: 'Motivo da Interrupção',
        accessor: 'situacao',
        render: (val: string) => (
          <div className="max-w-[200px]">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getSituacaoBadge(val).className}`}>
              {getSituacaoBadge(val).label}
            </span>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {val || 'Motivo não especificado nos registros. Consulte o setor de obras para mais informações.'}
            </p>
          </div>
        ),
      },
      {
        header: 'Responsável',
        accessor: 'empresa_responsavel',
        render: (val: string) => (
          <span className="text-sm text-gray-700 line-clamp-2" title={val || 'Execução Direta'}>
            {val || 'Execução Direta (Administração Municipal)'}
          </span>
        ),
      },
      {
        header: 'Data Prevista Reinício',
        accessor: 'data_previsao_fim',
        render: (val: string, row: any) => (
          <div>
            <p className="text-sm text-gray-600 whitespace-nowrap">
              <span className="font-medium">Previsão inicial:</span>{' '}
              {formatDate(val)}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Data de reinício a ser definida pelo setor responsável.
            </p>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div id="panel-paralisadas" role="tabpanel" aria-labelledby="tab-paralisadas">

      {/* Descrição */}
      <div className="mt-4 mb-4 rounded-xl border border-red-100 bg-red-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <PauseCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 mb-1">
              Obras Paralisadas — Critério 10.4
            </p>
            <p className="text-sm text-red-700/80 leading-relaxed">
              Relação das obras públicas municipais que se encontram com execução interrompida,
              contendo a identificação, motivo da paralisação, responsável e previsão de reinício,
              em conformidade com o PNTP 2026 e a Lei de Licitações (Lei nº 14.133/2021).
            </p>
          </div>
        </div>
      </div>

      {/* Aviso se não houver obras paralisadas OU se houver */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : obrasParalisadas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
            <Construction size={30} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-emerald-800 mb-2">
            Nenhuma Obra Paralisada
          </h3>
          <p className="text-sm text-gray-600 max-w-md leading-relaxed">
            A Administração Municipal informa que não há obras públicas com execução paralisada
            no período consultado. Todas as obras em andamento estão dentro do cronograma previsto.
          </p>
        </div>
      ) : (
        <>
          {/* Totalizer */}
          <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                Obras Paralisadas
              </p>
              <p className="text-xl font-semibold text-red-500 tabular-nums">{obrasParalisadas.length}</p>
            </div>
          </div>

          <DataTable
            title="Relação de Obras Paralisadas"
            columns={columns}
            data={obrasParalisadas}
            exportable={true}
            loading={false}
            paginationResetKey="paralisadas"
            emptyMessage="Nenhuma obra paralisada encontrada."
          />
        </>
      )}

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critério 10.4
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A divulgação da relação de obras paralisadas, com os respectivos motivos e
          responsáveis, atende ao Art. 8º, §1º, IV da Lei de Acesso à Informação (Lei nº
          12.527/2011) e às determinações do Tribunal de Contas do Estado do Piauí (TCE-PI)
          e do PNTP 2026. Em caso de paralisação por decisão judicial, o número do processo
          será informado.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ObrasPage() {
  const [activeTab, setActiveTab] = useState<'geral' | 'paralisadas'>('geral');
  const [filters, setFilters] = useState<FilterValues & { situacao?: string }>({
    ano: '',
    mes: '',
    busca: '',
    entidade: '',
    situacao: '',
  });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears(
    'obras',
    filters.entidade || undefined
  );

  const handleChange = useCallback(
    (field: string, value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '', situacao: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}-${filters.situacao}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.entidade || filters.situacao);

  return (
    <ContentPage
      showSearch={false}
      title="Obras Públicas"
      description="Acompanhamento da execução física e financeira de obras e serviços de engenharia, incluindo a relação de obras paralisadas — em conformidade com a Lei nº 14.133/2021 e PNTP 2026."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Obras Públicas' },
      ]}
    >
      {/* Filter Panel */}
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        anosLoading={anosLoading}
      >
        {/* Filtro de Situação */}
        <div className="flex flex-col gap-1 sm:w-44">
          <label className="text-xs font-medium text-gray-600">Situação</label>
          <div className="relative">
            <select
              value={filters.situacao || ''}
              onChange={(e) => handleChange('situacao', e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            >
              <option value="">Todas</option>
              {SITUACOES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </FilterPanel>

      {/* Abas lado a lado */}
      <div
        className="mt-6 flex flex-wrap gap-1 border-b border-gray-200"
        role="tablist"
        aria-label="Seções de obras públicas"
      >
        <button
          onClick={() => setActiveTab('geral')}
          role="tab"
          aria-selected={activeTab === 'geral'}
          aria-controls="panel-geral"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'geral'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Construction size={16} aria-hidden="true" />
          Painel Geral de Obras
        </button>
        <button
          onClick={() => setActiveTab('paralisadas')}
          role="tab"
          aria-selected={activeTab === 'paralisadas'}
          aria-controls="panel-paralisadas"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'paralisadas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <PauseCircle size={16} aria-hidden="true" />
          Obras Paralisadas
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'geral' && (
        <PainelGeralObrasTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'paralisadas' && (
        <ObrasParalisadasTab filters={filters} />
      )}
    </ContentPage>
  );
}
