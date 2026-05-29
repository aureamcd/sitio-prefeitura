'use client';

import { useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, Download, Search, Receipt, AlertCircle } from 'lucide-react';
import type { ReceitaNode, FlatTreeNode } from '@/lib/receitas/types';
import { formatBRL, realizacaoBg, getLevelName, PAGE_SIZE } from '@/lib/receitas/types';
import { flattenVisibleTree, buildCSV } from '@/lib/receitas/receitasTree';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/lib/hooks/usePagination';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TreeTableProps {
  tree: ReceitaNode[];
  loading: boolean;
  error: string | null;
  expanded: Set<string>;
  onToggle: (codigo: string) => void;
  searchMode: boolean;
  searchResults: ReceitaNode[];
  searchTerm: string;
  filterKey: string;
  ano: string;
}

// ---------------------------------------------------------------------------
// Row Component (flat, single <tr>)
// ---------------------------------------------------------------------------

interface RowProps {
  node: ReceitaNode;
  depth: number;
  canExpand: boolean;
  isExpanded: boolean;
  onToggle: (codigo: string) => void;
}

function Row({ node, depth, canExpand, isExpanded, onToggle }: RowProps) {
  const pct = node.previsto !== 0 ? (node.arrecadado / node.previsto) * 100 : 0;

  const logicalDepth = Math.max(0, node.level - 1);
  const levelLabel = getLevelName(node.tipoNivel, logicalDepth);

  const rowClass = (() => {
    if (logicalDepth === 0) return 'bg-gray-50 border-t border-gray-200 font-semibold text-gray-900';
    if (logicalDepth === 1) return 'font-medium text-gray-800 bg-white border-t border-gray-100';
    if (logicalDepth === 2) return 'text-gray-700 bg-white border-t border-gray-50';
    return 'text-gray-600 bg-white border-t border-gray-50 text-sm';
  })();

  const handleClick = useCallback(() => {
    if (canExpand) onToggle(node.codigo);
  }, [canExpand, node.codigo, onToggle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!canExpand) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(node.codigo);
      }
    },
    [canExpand, node.codigo, onToggle]
  );

  return (
    <tr
      className={`${rowClass} transition-colors ${
        canExpand
          ? 'cursor-pointer hover:bg-blue-50/40'
          : 'hover:bg-gray-50/60'
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={canExpand ? 0 : undefined}
      role={canExpand ? 'button' : undefined}
      aria-expanded={canExpand ? isExpanded : undefined}
      aria-label={
        canExpand
          ? `${node.descricao} — ${levelLabel}. ${isExpanded ? 'Clique para recolher' : 'Clique para expandir'}`
          : undefined
      }
    >
      {/* Código e Descrição com indent */}
      <td className="px-4 py-3" style={{ paddingLeft: `${16 + logicalDepth * 20}px` }}>
        <div className="flex items-center gap-2">
          {canExpand ? (
            <span
              className="text-gray-400 flex-shrink-0 transition-transform duration-200"
              aria-hidden="true"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span className="w-[14px] flex-shrink-0" aria-hidden="true" />
          )}
          <span>
            <span className={`font-mono text-xs ${logicalDepth === 0 ? 'text-gray-700' : 'text-gray-500'}`}>
              {node.codigo}
            </span>
            {' - '}
            {node.descricao} <span className="text-gray-400 font-normal">({levelLabel})</span>
          </span>
        </div>
      </td>

      {/* Previsto Inicial */}
      <td
        className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${
          logicalDepth === 0 ? 'text-gray-900' : 'text-gray-600'
        }`}
      >
        {formatBRL(node.previstoInicial)}
      </td>

      {/* Previsto Atualizado */}
      <td
        className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${
          logicalDepth === 0 ? 'text-gray-900' : 'text-gray-700'
        }`}
      >
        {formatBRL(node.previsto)}
      </td>

      {/* Arrecadado */}
      <td
        className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${
          logicalDepth === 0 ? 'text-gray-900' : 'text-gray-700'
        }`}
      >
        {formatBRL(node.arrecadado)}
      </td>

      {/* % Realização */}
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <span
          className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${realizacaoBg(pct)}`}
        >
          {pct.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Search Row (flat, no expand)
// ---------------------------------------------------------------------------

function SearchRow({ node, level }: { node: ReceitaNode; level: number }) {
  const pct = node.previsto > 0 ? (node.arrecadado / node.previsto) * 100 : 0;
  const color = realizacaoBg(pct);

  return (
    <tr key={node.codigo} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-gray-700">
        <span className="text-[10px] text-gray-400 mr-1.5 font-mono">
          {'·'.repeat(Math.max(0, node.level - 1))}
        </span>
        <span className="font-mono text-xs text-gray-500 mr-2">
          {node.codigo}
        </span>
        - {node.descricao} <span className="text-gray-400 font-normal">({getLevelName(node.tipoNivel, Math.max(0, node.level - 1))})</span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-gray-600">
        {formatBRL(node.previstoInicial)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-gray-800">
        {formatBRL(node.previsto)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-gray-800">
        {formatBRL(node.arrecadado)}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
          {pct.toFixed(1)}%
        </span>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ searchMode }: { searchMode: boolean; searchTerm?: string }) {
  if (searchMode) {
    return (
      <tr>
        <td colSpan={5} className="px-6 py-16 text-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Search size={32} className="opacity-30" />
            <p className="text-sm font-semibold">Nenhum registro encontrado para os filtros selecionados.</p>
            <p className="text-xs">Tente outro termo de busca ou limpe os filtros</p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={5} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Receipt size={32} className="opacity-30" />
          <p className="text-sm font-semibold">Nenhum dado disponível</p>
          <p className="text-xs">Selecione um ano ou entre em contato com a Secretaria de Finanças</p>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Error State
// ---------------------------------------------------------------------------

function ErrorState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={5} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-red-400" role="alert">
          <AlertCircle size={32} />
          <p className="text-sm font-semibold text-red-600">Erro ao carregar dados</p>
          <p className="text-xs text-red-500 max-w-md">{message}</p>
          <p className="text-xs text-gray-400">Tente novamente mais tarde ou contate o suporte técnico.</p>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <tr>
      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
        <div className="flex flex-col items-center gap-4" aria-label="Carregando dados">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="animate-pulse flex justify-center">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TreeTable({
  tree,
  loading,
  error,
  expanded,
  onToggle,
  searchMode,
  searchResults,
  searchTerm,
  filterKey,
  ano,
}: TreeTableProps) {
  // Build flat visible list from tree + expanded state
  const flatTree = useMemo(
    () => flattenVisibleTree(tree, expanded),
    [tree, expanded]
  );

  // Paginate at root level for tree mode
  const rootNodes = useMemo(() => {
    if (searchMode) return [];
    return tree;
  }, [searchMode, tree]);

  const treePagination = usePagination(
    searchMode ? searchResults : rootNodes,
    PAGE_SIZE,
    filterKey
  );

  // For tree mode, we paginate root nodes first, then flatten visible children
  const visibleRows = useMemo((): FlatTreeNode[] => {
    if (searchMode) return [];
    if (treePagination.slice.length === 0) return [];

    // Get the root nodes for the current page
    return flattenVisibleTree(treePagination.slice, expanded);
  }, [treePagination.slice, expanded, searchMode]);

  const searchPagination = usePagination(searchResults, PAGE_SIZE, filterKey);

  const handleExport = useCallback(() => {
    const csv = buildCSV(tree);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receitas_${ano || 'geral'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [tree, ano]);

  const itemCount = searchMode ? searchResults.length : visibleRows.length;
  const hasData = tree.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Table header toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            {searchMode
              ? `Resultados para "${searchTerm}" — ${searchResults.length} item(ns)`
              : 'Classificação Hierárquica da Receita'}
          </h2>
          {!searchMode && (
            <p className="text-xs text-gray-500 mt-0.5">
              Clique ou pressione Enter/Space para expandir as categorias.
              A arrecadação é apresentada até o nível de desdobramento, em conformidade com as regras de sigilo fiscal.
            </p>
          )}
        </div>
        {hasData && !loading && !error && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            aria-label="Exportar dados em CSV"
          >
            <Download size={13} aria-hidden="true" />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto" role="region" aria-label="Tabela de classificação hierárquica da receita">
        <table className="w-full text-sm" role={searchMode || visibleRows.length > 0 ? 'table' : undefined}>
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Código e Descrição da Receita
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                Prev. Inicial
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                Prev. Atualizado
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                Arrecadado
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                % Realização
              </th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <ErrorState message={error} />
            ) : loading ? (
              <LoadingSkeleton />
            ) : searchMode ? (
              searchPagination.slice.length > 0 ? (
                searchPagination.slice.map((node) => (
                  <SearchRow key={node.codigo} node={node} level={node.level} />
                ))
              ) : (
                <EmptyState searchMode={true} />
              )
            ) : visibleRows.length > 0 ? (
              visibleRows.map(({ node, depth }) => {
                const hasChildren = node.filhos.length > 0;
                const isExpanded = expanded.has(node.codigo);
                const canExpand = hasChildren && depth < 7;

                return (
                  <Row
                    key={node.codigo}
                    node={node}
                    depth={depth}
                    canExpand={canExpand}
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                  />
                );
              })
            ) : (
              <EmptyState searchMode={false} />
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && itemCount > 0 && (
        <div className="px-6 pb-4">
          <Pagination
            page={searchMode ? searchPagination.page : treePagination.page}
            totalPages={searchMode ? searchPagination.totalPages : treePagination.totalPages}
            onPageChange={searchMode ? searchPagination.setPage : treePagination.setPage}
            startIndex={searchMode ? searchPagination.startIndex : treePagination.startIndex}
            endIndex={searchMode ? searchPagination.endIndex : treePagination.endIndex}
            total={searchMode ? searchPagination.total : treePagination.total}
          />
        </div>
      )}
    </div>
  );
}
