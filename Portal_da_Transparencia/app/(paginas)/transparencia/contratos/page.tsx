'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { EMPRESAS } from '@/lib/empresas';
import {
  FileText,
  Users,
  DollarSign,
  FileSearch,
  Info,
  AlertTriangle,
} from 'lucide-react';

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

function getStatusBadge(situacao: string | null) {
  if (!situacao) return { label: 'Sem informação', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  const s = situacao.toLowerCase().trim();
  if (s.includes('vigent') || s.includes('ativo') || s.includes('corrente') || s === 'a')
    return { label: 'Vigente', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (s.includes('encerr') || s.includes('fina') || s.includes('conclu') || s === 'f')
    return { label: 'Encerrado', className: 'bg-gray-100 text-gray-700 border-gray-300' };
  if (s.includes('susp') || s.includes('cancel'))
    return { label: 'Suspenso/Cancelado', className: 'bg-red-100 text-red-700 border-red-200' };
  return { label: situacao, className: 'bg-blue-100 text-blue-700 border-blue-200' };
}

// ---------------------------------------------------------------------------
// Hook: busca contratos do banco
// ---------------------------------------------------------------------------
function useContratosData(filters: FilterValues) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      let query = supabase.schema('transparencia').from('contratos').select('*');

      if (filters.entidade) query = query.eq('empresa', filters.entidade);
      if (filters.ano) query = query.eq('ano', filters.ano);
      if (filters.mes) {
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.ilike('data_assinatura', `${prefix}%`);
      }
      if (filters.busca) {
        query = query.or(
          `fornecedor.ilike.%${filters.busca}%,numero_contrato.ilike.%${filters.busca}%,objeto.ilike.%${filters.busca}%,entidade.ilike.%${filters.busca}%`
        );
      }

      const { data: result, error } = await query
        .order('data_assinatura', { ascending: false });

      if (cancelled) return;
      setData(!error && result ? result : []);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters.ano, filters.mes, filters.busca, filters.entidade]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// Hook: busca despesas para ordem cronológica de pagamentos
// ---------------------------------------------------------------------------
function usePagamentosData(filters: { ano: string; mes: string; entidade?: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      let query = supabase
        .schema('transparencia')
        .from('despesas')
        .select('pkemp, ano, numero_empenho, fornecedor_nome, fornecedor_cpf_cnpj, objeto, valor_pago, pago_ate_data, data_empenho')
        .gt('valor_pago', 0);

      if (filters.entidade) query = query.eq('empresa', filters.entidade);
      if (filters.ano) query = query.eq('ano', Number(filters.ano));
      if (filters.mes) {
        const prefix = `${filters.ano || '2026'}-${filters.mes}`;
        query = query.ilike('pago_ate_data', `${prefix}%`);
      }

      const { data: result, error } = await query
        .order('pago_ate_data', { ascending: true });

      if (cancelled) return;
      const resultWithOrdem = (!error && result)
        ? result.map((item: any, idx: number) => ({ ...item, ordem: idx + 1 }))
        : [];
      setData(resultWithOrdem);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filters.ano, filters.mes, filters.entidade]);

  return { data, loading };
}

// ---------------------------------------------------------------------------
// Aba 1: Relação de Contratos e Aditivos
// ---------------------------------------------------------------------------
function RelacaoContratosTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const { data, loading } = useContratosData(filters);

  const totalContratos = data.length;
  const totalValor = data.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const vigentes = data.filter((r) => {
    const s = (r.situacao || '').toLowerCase();
    return s.includes('vigent') || s.includes('ativo') || s === 'a';
  }).length;

  const columns = useMemo(
    () => [
      {
        header: 'Nº Contrato / Ano',
        accessor: 'numero_contrato',
        render: (val: string, row: any) => (
          <div>
            <p className="text-sm font-semibold text-gray-900">{val || '-'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{row.ano || ''}</p>
          </div>
        ),
      },
      {
        header: 'Contratado',
        accessor: 'fornecedor',
        render: (val: string, row: any) => (
          <div className="max-w-[200px]">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={val}>
              {val || '-'}
            </p>
            {row.cnpj_inscricao && (
              <p className="text-xs text-gray-500 mt-0.5">{row.cnpj_inscricao}</p>
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
            {val || '-'}
          </span>
        ),
      },
      {
        header: 'Vigência',
        accessor: 'vigencia_inicio',
        render: (val: string, row: any) => {
          if (!val && !row.vigencia_fim) return <span className="text-sm text-gray-400">—</span>;
          return (
            <div className="text-sm text-gray-600 whitespace-nowrap">
              <span>{formatDate(val)}</span>
              <span className="mx-1 text-gray-300">→</span>
              <span>{formatDate(row.vigencia_fim)}</span>
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
        header: 'Fiscal',
        accessor: 'gestor_nome',
        render: (val: string) => (
          <span className="text-sm text-gray-600 line-clamp-1" title={val}>
            {val || '—'}
          </span>
        ),
      },
      {
        header: 'Íntegra',
        accessor: 'acoes',
        render: (_: any, row: any) => {
          const temArquivo = !!(row.arquivo_url || row.arquivo_r2_url);
          return (
            <a
              href={temArquivo ? (row.arquivo_r2_url || row.arquivo_url) : '#'}
              target={temArquivo ? '_blank' : undefined}
              rel={temArquivo ? 'noopener noreferrer' : undefined}
              onClick={temArquivo ? undefined : (e) => e.preventDefault()}
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                temArquivo
                  ? 'text-blue-600 hover:text-blue-800'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <FileSearch size={14} />
              {temArquivo ? 'Visualizar' : 'Indisponível'}
            </a>
          );
        },
      },
    ],
    []
  );

  return (
    <div id="panel-contratos" role="tabpanel" aria-labelledby="tab-contratos">
      {/* Totalizer */}
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
            Vigentes
          </p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-emerald-600 tabular-nums">{vigentes}</p>
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

      {/* Aviso sobre aditivos */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
            Aditivos Contratuais
          </p>
          <p className="text-xs text-blue-700/80 mt-0.5">
            Os termos aditivos, apostilamentos, reequilíbrios e prorrogações
            vinculados a cada contrato estão disponíveis para consulta e download
            no botão "Visualizar" ao lado de cada registro.
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

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Nota Legal — Critérios 9.1 e 9.2
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação dos contratos administrativos e seus aditivos observa o
          Art. 94 da Lei nº 14.133/2021 (Nova Lei de Licitações e Contratos
          Administrativos) e o Art. 8º, §1º, IV da Lei de Acesso à Informação
          (Lei nº 12.527/2011). As íntegras dos contratos originais e de todos
          os termos aditivos vinculados estão disponíveis para consulta e
          download neste portal.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 2: Fiscais de Contratos (Critério 9.3)
// ---------------------------------------------------------------------------
function FiscaisContratosTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const { data: contratos, loading } = useContratosData(filters);

  // Agrupa fiscais com seus contratos
  const fiscais = useMemo(() => {
    const map = new Map<string, { nome: string; contratos: any[] }>();
    for (const c of contratos) {
      const nome = c.gestor_nome || 'Não informado';
      if (!map.has(nome)) map.set(nome, { nome, contratos: [] });
      map.get(nome)!.contratos.push(c);
    }
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contratos]);

  const totalFiscais = fiscais.length;
  const totalContratosVinculados = contratos.length;

  const fiscaisColumns = useMemo(
    () => [
      {
        header: 'Fiscal do Contrato',
        accessor: 'nome',
        render: (val: string) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
              {val === 'Não informado' ? '?' : val.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-gray-900">{val}</span>
          </div>
        ),
      },
      {
        header: 'Qtd. Contratos',
        accessor: 'contratos',
        render: (val: any[]) => (
          <span className="block text-center text-sm font-semibold text-gray-800 tabular-nums">
            {val.length}
          </span>
        ),
      },
      {
        header: 'Contratos Vinculados',
        accessor: 'contratos',
        render: (val: any[]) => (
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {val.slice(0, 5).map((c, i) => {
              const badge = getStatusBadge(c.situacao);
              return (
                <span
                  key={i}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}
                  title={`${c.numero_contrato || '-'} — ${badge.label}`}
                >
                  {c.numero_contrato || 'N/I'}
                </span>
              );
            })}
            {val.length > 5 && (
              <span className="text-[10px] text-gray-400 font-medium px-1">
                +{val.length - 5}
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'Status',
        accessor: 'contratos',
        render: (val: any[]) => {
          const vigentes = val.filter((c) => {
            const s = (c.situacao || '').toLowerCase();
            return s.includes('vigent') || s.includes('ativo') || s === 'a';
          }).length;
          const encerrados = val.length - vigentes;
          return (
            <div className="text-xs space-y-1">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {vigentes} vigente{vigentes !== 1 ? 's' : ''}
              </span>
              {encerrados > 0 && (
                <br />
              )}
              {encerrados > 0 && (
                <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  {encerrados} encerrado{encerrados !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div id="panel-fiscais" role="tabpanel" aria-labelledby="tab-fiscais">
      {/* Descrição */}
      <div className="mt-4 mb-4 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">
              Fiscais de Contratos — Critério 9.3
            </p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Lista consolidada dos fiscais de contratos da administração municipal,
              com a relação dos contratos sob sua responsabilidade e o status de
              cada um (vigente ou encerrado), conforme exigência do PNTP 2026.
            </p>
          </div>
        </div>
      </div>

      {/* Totalizer */}
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Fiscais Designados
          </p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalFiscais}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Contratos Vinculados
          </p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalContratosVinculados}</p>
          )}
        </div>
      </div>

      <DataTable
        title="Relação de Fiscais de Contratos"
        columns={fiscaisColumns}
        data={fiscais}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage="Não há fiscais de contratos designados no período informado."
        emptyFilteredMessage="Nenhum fiscal encontrado para os filtros selecionados."
      />

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critério 9.3
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A designação de fiscais de contratos é exigida pelo Art. 67 da Lei nº
          8.666/1993 e pelo Art. 117 da Lei nº 14.133/2021. A lista consolidada
          de fiscais atende ao requisito de transparência do PNTP 2026, não sendo
          suficiente a mera menção do nome nos detalhes individuais dos contratos.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba 3: Ordem Cronológica de Pagamentos (Critério 9.4)
// ---------------------------------------------------------------------------
function OrdemCronologicaTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const { data, loading } = usePagamentosData({
    ano: filters.ano,
    mes: filters.mes,
    entidade: filters.entidade,
  });

  const totalPagamentos = data.length;
  const totalPago = data.reduce((s, r) => s + (Number(r.valor_pago) || 0), 0);

  const pagamentoColumns = useMemo(
    () => [
      {
        header: 'Ordem',
        accessor: 'ordem',
        render: (val: number) => (
          <span className="block text-center text-sm font-semibold text-gray-400 tabular-nums">
            {val}º
          </span>
        ),
      },
      {
        header: 'Fornecedor',
        accessor: 'fornecedor_nome',
        render: (val: string) => (
          <div className="max-w-[200px]">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2" title={val}>
              {val || '-'}
            </p>
          </div>
        ),
      },
      {
        header: 'Empenho',
        accessor: 'numero_empenho',
        render: (val: string) => (
          <span className="text-sm text-gray-600">{val || '-'}</span>
        ),
      },
      {
        header: 'Objeto',
        accessor: 'objeto',
        render: (val: string) => (
          <span
            className="block max-w-[200px] text-sm text-gray-700"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
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
        header: 'Data do Pagamento',
        accessor: 'pago_ate_data',
        render: (val: string) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {formatDate(val)}
          </span>
        ),
      },
      {
        header: 'Valor Pago',
        accessor: 'valor_pago',
        render: (val: number) => (
          <span className="block text-right tabular-nums text-sm font-semibold text-gray-900">
            {formatBRL(Number(val))}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div id="panel-ordem" role="tabpanel" aria-labelledby="tab-ordem">
      {/* Descrição */}
      <div className="mt-4 mb-4 rounded-xl border border-amber-100 bg-amber-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">
              Ordem Cronológica de Pagamentos — Critério 9.4
            </p>
            <p className="text-sm text-amber-700/80 leading-relaxed">
              Relação dos pagamentos a serem efetuados pela administração municipal,
              organizados em ordem cronológica conforme exigência da Lei nº
              14.133/2021 (Art. 5º). A lista respeita a ordem de apresentação dos
              créditos para pagamento.
            </p>
          </div>
        </div>
      </div>

      {/* Totalizer */}
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center shadow-sm mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Total de Pagamentos
          </p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalPagamentos}</p>
          )}
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
            Valor Total Pago
          </p>
          {loading ? (
            <div className="h-7 w-32 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-900 tabular-nums">{formatBRL(totalPago)}</p>
          )}
        </div>
      </div>

      <DataTable
        title="Ordem Cronológica de Pagamentos"
        columns={pagamentoColumns}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage="Não há pagamentos registrados no período informado."
        emptyFilteredMessage="Nenhum pagamento encontrado para os filtros selecionados."
      />

      {/* ⚠️ Seção de Justificativa para Quebra de Ordem */}
      <div className="mt-6 rounded-xl border-2 border-amber-200 bg-amber-50/50 px-6 py-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800 mb-2">
              Justificativa para Alteração da Ordem Cronológica
            </h3>
            <p className="text-sm text-amber-700/80 leading-relaxed">
              A Administração Municipal informa que, até o momento, não houve
              necessidade de alteração (quebra) da ordem cronológica de pagamentos.
              Caso, por razão legal, seja necessária a alteração da ordem
              estabelecida, a justificativa que fundamentou essa decisão será
              publicada e vinculada ao respectivo pagamento nesta mesma tela,
              em conformidade com o Art. 5º da Lei nº 14.133/2021 e o Critério
              9.4 do PNTP 2026.
            </p>
          </div>
        </div>
      </div>

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">
          Base Legal — Critério 9.4
        </p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A observância da ordem cronológica de pagamentos é exigência do Art. 5º
          da Lei nº 14.133/2021 (Nova Lei de Licitações e Contratos
          Administrativos). Qualquer exceção a essa ordem deve ser justificada
          por escrito e publicada no portal, conforme determinação do TCE-PI e
          do PNTP 2026.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ContratosPage() {
  const [activeTab, setActiveTab] = useState<'contratos' | 'fiscais' | 'ordem'>('contratos');
  const [filters, setFilters] = useState<FilterValues>({
    ano: '2026',
    mes: '',
    busca: '',
    entidade: '',
  });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears(
    'contratos',
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
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.entidade);

  const showFilters = activeTab === 'contratos' || activeTab === 'fiscais';

  return (
    <ContentPage
      showSearch={false}
      title="Contratos"
      description="Contratos celebrados pela administração municipal, relação de fiscais designados e ordem cronológica de pagamentos — em conformidade com a Lei nº 14.133/2021 e PNTP 2026."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Contratos' },
      ]}
    >
      {/* Filter Panel — apenas nas abas que precisam */}
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
        aria-label="Seções de contratos"
      >
        <button
          onClick={() => setActiveTab('contratos')}
          role="tab"
          aria-selected={activeTab === 'contratos'}
          aria-controls="panel-contratos"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'contratos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileText size={16} aria-hidden="true" />
          Contratos e Aditivos
        </button>
        <button
          onClick={() => setActiveTab('fiscais')}
          role="tab"
          aria-selected={activeTab === 'fiscais'}
          aria-controls="panel-fiscais"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'fiscais'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users size={16} aria-hidden="true" />
          Fiscais de Contratos
        </button>
        <button
          onClick={() => setActiveTab('ordem')}
          role="tab"
          aria-selected={activeTab === 'ordem'}
          aria-controls="panel-ordem"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
            activeTab === 'ordem'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <DollarSign size={16} aria-hidden="true" />
          Ordem Cronológica
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'contratos' && (
        <RelacaoContratosTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'fiscais' && (
        <FiscaisContratosTab
          filters={filters}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {activeTab === 'ordem' && (
        <OrdemCronologicaTab
          filters={{ ...filters, busca: '' } as FilterValues}
          filterKey={filterKey}
          hasActiveFilters={hasActiveFilters}
        />
      )}
    </ContentPage>
  );
}
