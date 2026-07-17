'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { EMPRESAS, getEmpresaNome } from '@/lib/empresas';
import { Landmark, MapPin, ArrowRightLeft } from 'lucide-react';
import { buildTree, flattenTree } from '@/lib/receitas/receitasTree';
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

export default function TransferenciasPage() {
  const today = useTodayDate();
  const [activeTab, setActiveTab] = useState<'uniao' | 'estado' | 'entidades'>('uniao');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '', entidade: '' });
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
            .from('receitas_transferencias')
            .select('*')
            .in('tipo', activeTab === 'uniao' ? ['UNIAO', 'uniao'] : ['ESTADO', 'estado']);

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
          
          if (!consolidado && filters.entidade) {
            const empNome = getEmpresaNome(filters.entidade);
            query = query.or(
              `entidade_pagadora.ilike.%${empNome}%` +
              `,entidade_recebedora.ilike.%${empNome}%`
            );
          } else if (filters.entidade) {
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
  }, [activeTab, filters.ano, filters.mes, filters.busca, filters.entidade, consolidado, supabase]);

  const handleChange = useCallback((field: keyof FilterValues, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
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
    return receitasData.map((r: any) => ({
      id: r.id || String(Math.random()),
      codigo_contabil: r.codigo || '',
      descricao: r.especificacao || '',
      previsto_inicial: Number(r.previsao_inicial) || 0,
      previsto_atualizado: Number(r.previsao_atualizada) || Number(r.previsao_inicial) || 0,
      arrecadado_periodo: Number(r.arrecadado_periodo) || 0,
      arrecadado_total: Number(r.arrecadado_total) || 0,
      fonte_recurso: null,
      nivel: r.nivel,
      tipo_nivel: r.tipo_nivel,
      codigo_pai: r.codigo_pai,
    }));
  }, [receitasData]);

  const tree = useMemo(() => buildTree(rawTreeItems), [rawTreeItems]);

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

  return (
    <ContentPage
      showSearch={false}
      title="Transferências Constitucionais, Legais e entre Entidades"
      description="Consulta interativa às receitas arrecadadas através de transferências da União (FPM, FUNDEB, SUS) e Estado (ICMS, IPVA), além do detalhamento completo de repasses e devoluções entre as próprias entidades municipais."
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
        {(activeTab === 'uniao' || activeTab === 'estado') && (
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
