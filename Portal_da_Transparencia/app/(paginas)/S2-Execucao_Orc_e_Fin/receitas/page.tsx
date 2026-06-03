'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import {
  Wallet,
  FileWarning,
  RefreshCcw,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { EMPRESAS } from '@/lib/empresas';
import Pagination from '@/components/ui/Pagination';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { usePagination } from '@/lib/hooks/usePagination';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { buildTree, flattenTree, formatDate } from '@/lib/receitas/receitasTree';
import type {
  DividaAtivaRow,
  RawReceita,
  ReceitaExtraRow,
} from '@/lib/receitas/types';
import TreeTable from '@/components/receitas/TreeTable';
import HistoricoTable from '@/components/receitas/HistoricoTable';
import {
  MESES,
  formatBRL,
  PAGE_SIZE,
} from '@/lib/receitas/types';
import DataTable, { ColumnConfig } from '@/components/ui/DataTable';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

interface DashboardSummaryProps {
  ano: string;
  mes: string;
  loading: boolean;
  totalPrevistoInicial: number;
  totalPrevisto: number;
  totalArrecadado: number;
}

function DashboardSummary({ ano, mes, loading, totalPrevistoInicial, totalPrevisto, totalArrecadado }: DashboardSummaryProps) {
  const totalPct = totalPrevisto > 0 ? (totalArrecadado / totalPrevisto) * 100 : 0;
  const mesLabel = MESES.find((m) => m.value === mes)?.label;

  return (
    <div className="mt-4 mb-4 mx-auto bg-white border border-blue-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
      {/* Color splash decorations */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

      <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-[#0B3D91] uppercase mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block animate-pulse" />
        Exercício {ano || 'Geral'}{mes ? ` · ${mesLabel}` : ''}
      </span>

      <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full relative z-10">
        <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prev. Inicial</p>
          {loading ? (
            <div className="h-6 w-24 bg-gray-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalPrevistoInicial)}</p>
          )}
        </div>

        <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent" />

        <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prev. Atualizado</p>
          {loading ? (
            <div className="h-6 w-24 bg-gray-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalPrevisto)}</p>
          )}
        </div>

        <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent" />

        <div className="flex flex-col items-center p-2 rounded-xl hover:bg-blue-50 transition-colors">
          <p className="text-[10px] sm:text-xs font-semibold text-blue-600/70 uppercase tracking-wider mb-1">Total Arrecadado</p>
          {loading ? (
            <div className="h-6 w-24 bg-blue-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-blue-700 tabular-nums">{formatBRL(totalArrecadado)}</p>
          )}
        </div>

        <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-emerald-200 to-transparent" />

        <div className="flex flex-col items-center p-2 rounded-xl hover:bg-emerald-50 transition-colors">
          <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">% Realização</p>
          {loading ? (
            <div className="h-6 w-12 bg-emerald-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 tabular-nums">{totalPct.toFixed(1)}%</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Divida Ativa Table
// ---------------------------------------------------------------------------

function DividaAtivaTable({
  data,
  loading,
  error,
  filterKey,
  today,
}: {
  data: DividaAtivaRow[];
  loading: boolean;
  error: string | null;
  filterKey: string;
  today: string;
}) {
  const pagination = usePagination(data, PAGE_SIZE, filterKey);

  if (error) {
    return (
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-20 text-center" role="alert">
          <div className="flex flex-col items-center gap-3 text-red-400">
            <AlertCircle size={32} />
            <p className="text-sm font-semibold text-red-600">Erro ao carregar dados de Dívida Ativa</p>
            <p className="text-xs text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">

      

      {/* ── Tabela Agregada ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Estoque da Dívida Ativa</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Estoques consolidados por tipo de dívida e exercício, conforme dados disponíveis.
          </p>
        </div>

      {loading ? (
        <div className="p-10 flex justify-center" aria-label="Carregando dados de dívida ativa">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="animate-pulse h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ) : data.length > 0 ? (
        <>
          <div className="overflow-x-auto" role="region" aria-label="Tabela de dívida ativa">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ano</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo de Dívida</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Saldo Anterior</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Inscrito no Ano</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Arrecadado no Ano</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Saldo Atual</th>
                </tr>
              </thead>
              <tbody>
                {pagination.slice.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900">{row.ano}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{row.tipo}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{formatBRL(row.saldo_anterior)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-medium">+{formatBRL(row.inscrito_ano)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">-{formatBRL(row.arrecadado_ano)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900 font-semibold">{formatBRL(row.saldo_atual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 pb-4 pt-4 border-t border-gray-100">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={pagination.setPage}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              total={pagination.total}
            />
          </div>
        </>
      ) : (
        <div className="px-6 py-16 text-center flex flex-col items-center justify-center">
          <div className="max-w-lg">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-5 mx-auto border border-blue-100">
              <FileWarning size={26} className="text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-3">
              Declaração de Inexistência — Dívida Ativa
            </h3>
            <div className="text-sm text-gray-600 leading-relaxed space-y-2">
              <p>
                Informa-se que não há registros de inscritos em Dívida Ativa no município de
                Padre Marcos — PI no período de 2023 a 2026.
              </p>
              <p className="text-xs text-gray-400 font-medium">
                Atualizado em {today}.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receitas Extra Dashboard
// ---------------------------------------------------------------------------

function ExtraDashboard({
  data,
  loading,
  ano,
  mes,
}: {
  data: ReceitaExtraRow[];
  loading: boolean;
  ano: string;
  mes: string;
}) {
  const totalValor = useMemo(
    () => data.reduce((s, r) => s + (Number(r.valor) || 0), 0),
    [data]
  );
  const mediaValor = data.length > 0 ? totalValor / data.length : 0;
  const mesLabel = MESES.find((m) => m.value === mes)?.label;

  return (
    <div className="mt-4 mb-4 max-w-3xl mx-auto bg-white border border-purple-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

      <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-purple-800 uppercase mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block animate-pulse" />
        Exercício {ano || 'Geral'} {mes ? `· ${mesLabel}` : ''}
      </span>

      <div className="flex flex-wrap justify-center gap-4 sm:gap-10 w-full relative z-10">
        <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total de Lançamentos</p>
          {loading ? (
            <div className="h-6 w-16 bg-gray-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{data.length}</p>
          )}
        </div>

        <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-purple-200 to-transparent" />

        <div className="flex flex-col items-center p-2 rounded-xl hover:bg-purple-50 transition-colors">
          <p className="text-[10px] sm:text-xs font-semibold text-purple-600/70 uppercase tracking-wider mb-1">Valor Total</p>
          {loading ? (
            <div className="h-6 w-24 bg-purple-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-purple-700 tabular-nums">{formatBRL(totalValor)}</p>
          )}
        </div>

        <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-amber-200 to-transparent" />

        <div className="flex flex-col items-center p-2 rounded-xl hover:bg-amber-50 transition-colors">
          <p className="text-[10px] sm:text-xs font-semibold text-amber-600/70 uppercase tracking-wider mb-1">Média / Lançamento</p>
          {loading ? (
            <div className="h-6 w-20 bg-amber-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-extrabold text-amber-700 tabular-nums">{formatBRL(mediaValor)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receitas Extra-orçamentárias Table
// ---------------------------------------------------------------------------

function ReceitasExtraTable({
  data,
  loading,
  error,
  filterKey,
  hasActiveFilters,
}: {
  data: ReceitaExtraRow[];
  loading: boolean;
  error: string | null;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const columns: ColumnConfig[] = [
    {
      header: 'Entidade',
      accessor: 'empresa_nome',
      render: (val: string) => val || '-',
    },
    {
      header: 'Data',
      accessor: 'data_lancamento',
      render: (val: string) => {
        const dataStr = formatDate(val);
        return <span className="text-gray-600 whitespace-nowrap">{dataStr}</span>;
      },
    },
    {
      header: 'Descrição',
      accessor: 'descricao',
      render: (val: string) => (
        <span className="line-clamp-2 max-w-[260px]" title={val || ''}>
          {val || '-'}
        </span>
      ),
    },
    {
      header: 'Histórico',
      accessor: 'historico',
      render: (val: string) => (
        <span className="text-sm line-clamp-2 max-w-[300px]" title={val || ''}>
          {val || '-'}
        </span>
      ),
    },
    {
      header: 'Valor (R$)',
      accessor: 'valor',
      render: (val: number) => (
        <span className="tabular-nums text-emerald-600 font-semibold whitespace-nowrap">
          {formatBRL(Number(val) || 0)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      title="Receitas Extra-orçamentárias"
      caption="Operações extra-orçamentárias — valores que transitam pelo caixa sem integrar o orçamento anual, como cauções, depósitos, consignações e restituições."
      exportable
      loading={loading}
      error={error}
      paginationResetKey={filterKey}
      hasActiveFilters={hasActiveFilters}
      emptyMessage="Nenhum registro de receita extra-orçamentária encontrado."
      emptyFilteredMessage="Nenhuma receita extra-orçamentária encontrada para os filtros selecionados."
      pageSize={PAGE_SIZE}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ReceitasPage() {
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'arrecadacao' | 'divida_ativa' | 'receitas_extra'>('arrecadacao');
  const [filters, setFilters] = useState<FilterValues & { categoria_economica?: string }>({ ano: '2026', mes: '', busca: '', entidade: '', categoria_economica: '' });
  const { anos: ANOS, loading: anosLoading } = useAvailableYears('receitas', filters.entidade || undefined);
  const [rawData, setRawData] = useState<RawReceita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dividaAtivaData, setDividaAtivaData] = useState<DividaAtivaRow[]>([]);
  const [dividaAtivaLoading, setDividaAtivaLoading] = useState(false);
  const [dividaAtivaError, setDividaAtivaError] = useState<string | null>(null);
  const [receitasExtraData, setReceitasExtraData] = useState<ReceitaExtraRow[]>([]);
  const [receitasExtraLoading, setReceitasExtraLoading] = useState(false);
  const [receitasExtraError, setReceitasExtraError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const isHistorico = filters.ano === "2023" || filters.ano === "2024" || filters.ano === "2025";

  const supabase = createBrowserClient();
  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.entidade);

  // --- Fetch receitas (arrecadação) — dados agregados para o dashboard ---
  // Apenas para anos não-históricos (2026+). Para 2023-2025, o HistoricoTable faz a própria query.
  useEffect(() => {
    if (isHistorico) {
      setRawData([]);
      setLoading(false);
      setExpanded(new Set());
      return;
    }
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setExpanded(new Set());

      try {
        let query = supabase
          .schema('transparencia')
          .from('receitas')
          .select('*');

        if (filters.entidade) {
          query = query.eq('empresa', filters.entidade);
        }

        if (filters.ano) {
          query = query.eq('ano', Number(filters.ano));
        }

        if (filters.categoria_economica) {
          query = query.like('codigo_limpo', `${filters.categoria_economica}%`);
        }

        const { data: result, error: queryError } = await query
          .order('codigo_contabil', { ascending: true });

        if (cancelled) return;

        if (queryError) {
          setError(queryError.message);
          setRawData([]);
        } else if (result) {
          setRawData(result as any);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar receitas');
          setRawData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(fetchData, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.ano, filters.entidade, filters.categoria_economica, supabase, isHistorico]);

  // --- Fetch dívida ativa ---
  useEffect(() => {
    if (activeTab !== 'divida_ativa') return;
    let cancelled = false;

    async function fetchDividaAtiva() {
      setDividaAtivaLoading(true);
      setDividaAtivaError(null);

      try {
        let query = supabase
          .schema('transparencia')
          .from('divida_ativa')
          .select('*');

        if (filters.entidade) {
          query = query.eq('empresa', filters.entidade);
        }

        if (filters.ano) {
          query = query.eq('ano', Number(filters.ano));
        }

        const { data: result, error: queryError } = await query
          .order('ano', { ascending: false })
          .order('tipo', { ascending: true });

        if (cancelled) return;

        if (queryError) {
          setDividaAtivaError(queryError.message);
          setDividaAtivaData([]);
        } else if (result) {
          setDividaAtivaData(
            result.map((r) => ({
              id: String(r.id),
              ano: Number(r.ano),
              tipo: String(r.tipo),
              saldo_anterior: Number(r.saldo_anterior) || 0,
              inscrito_ano: Number(r.inscrito_ano) || 0,
              arrecadado_ano: Number(r.arrecadado_ano) || 0,
              saldo_atual: Number(r.saldo_atual) || 0,
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setDividaAtivaError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dívida ativa');
          setDividaAtivaData([]);
        }
      } finally {
        if (!cancelled) setDividaAtivaLoading(false);
      }
    }

    const timer = setTimeout(fetchDividaAtiva, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, filters.ano, filters.entidade, supabase]);

  // --- Fetch receitas extra-orçamentárias ---
  useEffect(() => {
    if (activeTab !== 'receitas_extra') return;
    let cancelled = false;

    async function fetchReceitasExtra() {
      setReceitasExtraLoading(true);
      setReceitasExtraError(null);

      try {
        let query = supabase
          .schema('transparencia')
          .from('receitas_extra_orcamentarias')
          .select('*');

        if (filters.entidade) {
          query = query.eq('empresa', filters.entidade);
        }

        if (filters.ano) {
          query = query.eq('ano', Number(filters.ano));
        }

        if (filters.mes) {
          const ano = filters.ano || new Date().getFullYear().toString();
          const startDay = `${ano}-${filters.mes}-01`;
          const endDay = new Date(Number(ano), Number(filters.mes), 0).toISOString().split('T')[0];

          query = query
            .gte('data_lancamento', startDay)
            .lte('data_lancamento', endDay);
        }

        if (filters.busca) {
          query = query.or(`descricao.ilike.%${filters.busca}%,historico.ilike.%${filters.busca}%`);
        }

        const { data: result, error: queryError } = await query
          .order('data_lancamento', { ascending: false });

        if (cancelled) return;

        if (queryError) {
          setReceitasExtraError(queryError.message);
          setReceitasExtraData([]);
        } else if (result) {
          setReceitasExtraData(result as ReceitaExtraRow[]);
        }
      } catch (err) {
        if (!cancelled) {
          setReceitasExtraError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar receitas extra-orçamentárias');
          setReceitasExtraData([]);
        }
      } finally {
        if (!cancelled) setReceitasExtraLoading(false);
      }
    }

    const timer = setTimeout(fetchReceitasExtra, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, filters.ano, filters.mes, filters.busca, filters.entidade, supabase]);

  // --- Build tree ---
  const tree = useMemo(() => buildTree(rawData), [rawData]);

  // --- Auto-expand levels initially ---
  useEffect(() => {
    if (tree.length > 0) {
      const initialExpanded = new Set<string>();
      function traverse(nodes: any[]) {
        for (const node of nodes) {
          // Expandir Categoria (1), Origem (2), Espécie (3), Rubrica (4)
          // Isso fará com que o Nível 5 ou 6 já fique visível.
          if (node.level <= 4) {
            initialExpanded.add(node.codigo);
            if (node.filhos && node.filhos.length > 0) {
              traverse(node.filhos);
            }
          }
        }
      }
      traverse(tree);
      setExpanded(initialExpanded);
    } else {
      setExpanded(new Set());
    }
  }, [tree]);

  // --- Search flattening ---
  const isSearchMode = filters.busca.trim().length > 0;
  const flatList = useMemo(() => {
    if (!isSearchMode) return [];
    return flattenTree(tree).filter((n) => {
      const term = filters.busca.toLowerCase();
      return n.codigo.toLowerCase().includes(term) || n.descricao.toLowerCase().includes(term);
    });
  }, [tree, isSearchMode, filters.busca]);

  // --- Totals (from tree) ---
  const totalPrevistoInicial = tree.reduce((s, n) => {
    const isDeducao = n.codigo.startsWith('9');
    return s + (isDeducao ? -Math.abs(n.previstoInicial) : n.previstoInicial);
  }, 0);
  const totalPrevisto = tree.reduce((s, n) => {
    const isDeducao = n.codigo.startsWith('9');
    return s + (isDeducao ? -Math.abs(n.previsto) : n.previsto);
  }, 0);
  const totalArrecadado = tree.reduce((s, n) => {
    const isDeducao = n.codigo.startsWith('9');
    return s + (isDeducao ? -Math.abs(n.arrecadado) : n.arrecadado);
  }, 0);

  // --- Handlers ---
  const handleChange = useCallback((field: any, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '', categoria_economica: '' });
  }, []);

  const handleToggle = useCallback((codigo: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  }, []);

  return (
    <ContentPage
      showSearch={false}
      title="Receitas"
      description="Demonstrativo da execução orçamentária das receitas do município, com previsão, arrecadação e classificação hierárquica conforme PNTP 2026 / TCE-PI."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Execução Orçamentária e Financeira', href: '/S2-Execucao_Orc_e_Fin' },
        { label: 'Receitas' },
      ]}
      lastUpdate={today}
      responsible="Secretaria Municipal de Finanças e Planejamento"
    >
      {/* Filter Panel */}
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        anosLoading={anosLoading}
        empresas={EMPRESAS}
        hideConsolidado={isHistorico}
      >
        {activeTab === 'arrecadacao' && (
          <div className="flex flex-col gap-1 sm:w-64">
            <label className="text-xs font-medium text-gray-600">Categoria Econômica</label>
            <div className="relative">
              <select
                value={filters.categoria_economica || ''}
                onChange={(e) => handleChange('categoria_economica', e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              >
                <option value="">Todas as Categorias</option>
                <option value="1">1 - Receitas Correntes</option>
                <option value="2">2 - Receitas de Capital</option>
                <option value="7">7 - Receitas Correntes Intra-orçamentárias</option>
                <option value="8">8 - Receitas de Capital Intra-orçamentárias</option>
                <option value="9">9 - Deduções da Receita</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </FilterPanel>

      {/* Abas lado a lado */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist" aria-label="Seções de receitas">
        <button
          onClick={() => setActiveTab('arrecadacao')}
          role="tab"
          aria-selected={activeTab === 'arrecadacao'}
          aria-controls="panel-arrecadacao"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'arrecadacao'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Wallet size={16} aria-hidden="true" />
          Arrecadação de Receitas
        </button>
        <button
          onClick={() => setActiveTab('divida_ativa')}
          role="tab"
          aria-selected={activeTab === 'divida_ativa'}
          aria-controls="panel-divida-ativa"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'divida_ativa'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileWarning size={16} aria-hidden="true" />
          Dívida Ativa
        </button>
        <button
          onClick={() => setActiveTab('receitas_extra')}
          role="tab"
          aria-selected={activeTab === 'receitas_extra'}
          aria-controls="panel-receitas-extra"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'receitas_extra'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <RefreshCcw size={16} aria-hidden="true" />
          Extra-orçamentárias
        </button>
      </div>

      {/* Tab: Arrecadação */}
      {activeTab === 'arrecadacao' && (
        <div id="panel-arrecadacao" role="tabpanel" aria-labelledby="tab-arrecadacao">
          {isHistorico ? (
            <HistoricoTable
              ano={filters.ano}
              entidade={filters.entidade}
            />
          ) : (
            <>
              <DashboardSummary
            ano={filters.ano}
            mes={filters.mes}
            loading={loading}
            totalPrevistoInicial={totalPrevistoInicial}
            totalPrevisto={totalPrevisto}
            totalArrecadado={totalArrecadado}
          />

          <TreeTable
            tree={tree}
            loading={loading}
            error={error}
            expanded={expanded}
            onToggle={handleToggle}
            searchMode={isSearchMode}
            searchResults={flatList}
            searchTerm={filters.busca}
            filterKey={filterKey}
            ano={filters.ano}
          />
            </>
          )}
        </div>
      )}

      {/* Tab: Dívida Ativa */}
      {activeTab === 'divida_ativa' && (
        <div id="panel-divida-ativa" role="tabpanel" aria-labelledby="tab-divida-ativa">
          <DividaAtivaTable
            data={dividaAtivaData}
            loading={dividaAtivaLoading}
            error={dividaAtivaError}
            filterKey={filterKey}
            today={today}
          />
        </div>
      )}

      {/* Tab: Receitas Extra-orçamentárias */}
      {activeTab === 'receitas_extra' && (
        <div id="panel-receitas-extra" role="tabpanel" aria-labelledby="tab-receitas-extra">
          <ExtraDashboard
            data={receitasExtraData}
            loading={receitasExtraLoading}
            ano={filters.ano}
            mes={filters.mes}
          />

          <ReceitasExtraTable
            data={receitasExtraData}
            loading={receitasExtraLoading}
            error={receitasExtraError}
            filterKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Legal Note */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          As informações apresentadas nesta página referem-se à execução orçamentária das receitas da Prefeitura Municipal de Padre Marcos/PI,
          elaboradas conforme as normas da Lei de Responsabilidade Fiscal (LC nº 101/2000), da Lei de Acesso à Informação (Lei nº 12.527/2011)
          e das diretrizes do Plano Nacional de Transparência Pública 2026 (PNTP 2026). Dados atualizados periodicamente pela Secretaria de Finanças.
          Para esclarecimentos, acesse o canal de atendimento ao cidadão ou entre em contato com a Secretaria Municipal de Finanças e Planejamento.
        </p>
      </div>
    </ContentPage>
  );
}
