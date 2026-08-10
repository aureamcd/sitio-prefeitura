'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { EMPRESAS, getEmpresaNome } from '@/lib/empresas';
import { Landmark, MapPin, ArrowRightLeft } from 'lucide-react';
import { buildTree, flattenTree, normalizeCodigo, prepareConsolidatedTreeItems } from '@/lib/receitas/receitasTree';
import TreeTable from '@/components/receitas/TreeTable';
import EntidadesTreeTable, { TransferenciaEntidadeRow } from '@/components/transferencias/EntidadesTreeTable';

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

function DashboardSummary({
  ano,
  mes,
  loading,
  totalPrevistoInicial,
  totalPrevisto,
  totalArrecadado,
}: {
  ano?: string;
  mes?: string;
  loading: boolean;
  totalPrevistoInicial: number;
  totalPrevisto: number;
  totalArrecadado: number;
}) {
  const totalPct = totalPrevisto > 0 ? (totalArrecadado / totalPrevisto) * 100 : 0;
  const mesLabel = MESES.find((m) => m.value === mes)?.label;

  return (
    <div className="mt-2 mb-6 mx-auto bg-white border border-blue-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
      {/* Color splash decorations */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

      <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-[#0B3D91] uppercase mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block animate-pulse" />
        Exercício {ano || '2026'}{mes ? ` · ${mesLabel}` : ''}
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
          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prev. Atualizada</p>
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

export default function TransferenciasPage() {
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'uniao' | 'estado' | 'entidades'>('uniao');
  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '', entidade: '' });
  const [consolidado, setConsolidado] = useState(true);

  const [receitasData, setReceitasData] = useState<any[]>([]);
  const [transferenciasData, setTransferenciasData] = useState<TransferenciaEntidadeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Árvore expansível de receitas (União / Estado)
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const supabase = createBrowserClient();
  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.entidade}-${consolidado}`;
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
            .from('receitas')
            .select('*');

          if (filters.entidade) {
            query = query.eq('empresa', filters.entidade);
          } else {
            query = query.neq('empresa', '2');
          }

          if (filters.ano) {
            query = query.eq('ano', Number(filters.ano));
          } else {
            query = query.eq('ano', 2026);
          }

          if (activeTab === 'uniao') {
            query = query.or('codigo_contabil.ilike.171%,codigo_contabil.ilike.241%');
          } else {
            query = query.or('codigo_contabil.ilike.172%,codigo_contabil.ilike.242%');
          }

          if (filters.busca && filters.busca.trim().length > 0) {
            query = query.or(
              `codigo_contabil.ilike.%${filters.busca}%` +
              `,descricao.ilike.%${filters.busca}%`
            );
          }

          const { data, error: err } = await query
            .order('codigo_contabil', { ascending: true });

          if (cancelled) return;
          if (err) throw err;
          setReceitasData(data || []);
        } else {
          // Transferencias Entre Entidades
          let query = supabase
            .schema('transparencia')
            .from('transferencias_entre_entidades')
            .select('*');

          if (filters.ano) {
            query = query.eq('exercicio', Number(filters.ano));
          } else {
            query = query.eq('exercicio', 2026);
          }
          if (filters.mes) query = query.eq('mes', Number(filters.mes));
          
          if (filters.entidade) {
            const empNome = getEmpresaNome(filters.entidade).replace(/\s+/g, '%');
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
  }, [activeTab, filters.ano, filters.mes, filters.busca, filters.entidade, consolidado, supabase]);

  const handleChange = useCallback((field: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    if (field === 'entidade') {
      setConsolidado(value === '');
    }
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '2026', mes: '', busca: '', entidade: '' });
    setConsolidado(true);
  }, []);

  const handleToggleTree = useCallback((codigo: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  }, []);

  // --- Mapeamento para buildTree ---
  const rawTreeItems = useMemo(() => {
    const rootPrefixes = activeTab === 'uniao' ? ['1710.00.0.0.00', '2410.00.0.0.00'] : ['1720.00.0.0.00', '2420.00.0.0.00'];
    return prepareConsolidatedTreeItems(receitasData, consolidado, rootPrefixes);
  }, [receitasData, consolidado, activeTab]);

  const tree = useMemo(() => buildTree(rawTreeItems), [rawTreeItems]);

  const uniaoEstadoTotals = useMemo(() => {
    let prevInicial = 0;
    let prevAtualizado = 0;
    let arrPeriodo = 0;
    let arrTotal = 0;
    const roots = activeTab === 'uniao' ? ['1710.00.0.0.00', '2410.00.0.0.00'] : ['1720.00.0.0.00', '2420.00.0.0.00'];
    const rootItems = rawTreeItems.filter(item => roots.includes(item.codigo_contabil));
    
    if (rootItems.length > 0) {
      for (const r of rootItems) {
        prevInicial += Number(r.previsto_inicial) || 0;
        prevAtualizado += Number(r.previsto_atualizado) || 0;
        arrPeriodo += Number(r.arrecadado_periodo) || 0;
        arrTotal += Number(r.arrecadado_total) || 0;
      }
    } else {
      for (const root of tree) {
        prevInicial += root.previstoInicial || 0;
        prevAtualizado += root.previsto || 0;
        arrPeriodo += root.arrecadadoPeriodo || 0;
        arrTotal += root.arrecadado || 0;
      }
    }
    return { prevInicial, prevAtualizado, arrPeriodo, arrTotal };
  }, [rawTreeItems, tree, activeTab]);

  // Auto expand initially
  useEffect(() => {
    if (tree.length > 0) {
      const initialExpanded = new Set<string>();
      function traverse(nodes: any[]) {
        for (const node of nodes) {
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

  const isSearchMode = filters.busca.trim().length > 0;
  const flatList = useMemo(() => {
    if (!isSearchMode) return [];
    return flattenTree(tree).filter((n) => {
      const term = filters.busca.toLowerCase();
      return n.codigo.toLowerCase().includes(term) || n.descricao.toLowerCase().includes(term);
    });
  }, [tree, isSearchMode, filters.busca]);

  const anosTransf = useAvailableYears('transferencias_entre_entidades');
  const anosReceitas = useAvailableYears('receitas_transferencias');
  
  // Combine unique years
  const ANOS = Array.from(new Set([...anosTransf.anos, ...anosReceitas.anos, '2026', '2025', '2024', '2023'])).sort((a, b) => Number(b) - Number(a));

  const dbUpdateDate = useMemo(() => {
    if (!transferenciasData || transferenciasData.length === 0) return "";
    return transferenciasData.reduce((max: string, r: any) => (r.data_transferencia && r.data_transferencia > max) ? r.data_transferencia : max, "");
  }, [transferenciasData]);

  return (
    <ContentPage
      showSearch={false}
      title="Transferências Constitucionais, Legais e entre Entidades"
      description="Consulta interativa às receitas arrecadadas através de transferências da União (FPM, FUNDEB, SUS) e Estado (ICMS, IPVA), além do detalhamento completo de repasses e devoluções entre as próprias entidades municipais."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Transferências' },
      ]}
      lastUpdate={dbUpdateDate || today}
      responsible="Secretaria Municipal de Finanças"
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        empresas={activeTab === 'entidades' ? EMPRESAS : EMPRESAS.filter(e => e.codigo !== '2')}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
        searchPlaceholder="Pesquisar por código, descrição ou entidade..."
        hideMes={activeTab !== 'entidades'}
        hideTodosAno={true}
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
        {(activeTab === 'uniao' || activeTab === 'estado') && (
          <>
            {!loading && !error && tree.length > 0 && (
              <DashboardSummary
                ano={filters.ano}
                mes={filters.mes}
                loading={loading}
                totalPrevistoInicial={uniaoEstadoTotals.prevInicial}
                totalPrevisto={uniaoEstadoTotals.prevAtualizado}
                totalArrecadado={uniaoEstadoTotals.arrTotal}
              />
            )}
            <TreeTable
              tree={tree}
              loading={loading}
              error={error}
              expanded={expanded}
              onToggle={handleToggleTree}
              searchMode={isSearchMode}
              searchResults={flatList}
              searchTerm={filters.busca}
              filterKey={filterKey}
              ano={filters.ano}
            />
          </>
        )}

        {activeTab === 'entidades' && (
          <EntidadesTreeTable
            data={transferenciasData}
            loading={loading}
            error={error}
            filterKey={filterKey}
            ano={filters.ano}
            consolidado={consolidado}
            onConsolidadoChange={setConsolidado}
          />
        )}
      </div>
    </ContentPage>
  );
}
