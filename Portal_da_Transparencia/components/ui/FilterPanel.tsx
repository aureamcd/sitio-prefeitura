'use client';

import { ReactNode } from 'react';
import { ChevronDown, FilterX, Search, Building2 } from 'lucide-react';
import type { Empresa } from '@/lib/empresas';

export type FilterValues = {
  ano: string;
  mes: string;
  busca: string;
  entidade?: string;
};

interface FilterPanelProps<T extends string = 'ano' | 'mes' | 'busca' | 'entidade'> {
  anos?: (string | { value: string; label: string })[];
  meses?: { value: string; label: string }[];
  values: FilterValues;
  onChange: (field: T, value: string) => void;
  onClear: () => void;
  anosLoading?: boolean;
  empresas?: Empresa[];
  children?: ReactNode;
  hideAno?: boolean;
  hideMes?: boolean;
  hideBusca?: boolean;
  searchPlaceholder?: string;
  hideConsolidado?: boolean;
  hideTodosAno?: boolean;
}


export default function FilterPanel<T extends string = 'ano' | 'mes' | 'busca' | 'entidade'>({
  anos = [],
  meses = [],
  values,
  onChange,
  onClear,
  anosLoading,
  empresas,
  children,
  hideAno = false,
  hideMes = false,
  hideBusca = false,
  searchPlaceholder = 'Pesquisar por código ou descrição...',
  hideConsolidado = false,
  hideTodosAno = false,
}: FilterPanelProps<T>) {
  const baseHasFilters = 
    (!hideAno && values.ano !== '') || 
    (!hideMes && values.mes !== '') || 
    (!hideBusca && values.busca !== '') || 
    (values.entidade !== undefined && values.entidade !== '');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        {/* Entidade (Empresa) */}
        {empresas && empresas.length > 0 && (
          <div className="flex flex-col gap-1 sm:w-64">
            <label className="text-xs font-medium text-gray-600">
              Entidade
            </label>
            <div className="relative">
              <Building2
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select
                value={values.entidade || ''}
                onChange={(e) => onChange('entidade' as T, e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              >
                {!hideConsolidado && <option value="">Consolidado (Todas as Entidades)</option>}
                {hideConsolidado && <option value="">Selecione uma entidade</option>}
                {empresas.map((emp) => (
                  <option key={emp.codigo} value={emp.codigo}>
                    {emp.nome}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        )}

        {/* Ano */}
        {!hideAno && (
          <div className="flex flex-col gap-1 sm:w-36">
            <label className="text-xs font-medium text-gray-600">
              Ano
            </label>
            <div className="relative">
              {anosLoading ? (
                <div className="flex items-center gap-2 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                  <div className="h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  <div className="h-3.5 bg-gray-200 rounded w-12 animate-pulse" />
                </div>
              ) : (
                <>
                  <select
                    value={values.ano}
                    onChange={(e) => onChange('ano' as T, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                  >
                    {!hideTodosAno && <option value="">Todos</option>}
                    {anos.map((a) => {
                      const val = typeof a === 'string' ? a : a.value;
                      const label = typeof a === 'string' ? a : a.label;
                      return (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Mês */}
        {!hideMes && (
          <div className="flex flex-col gap-1 sm:w-44">
            <label className="text-xs font-medium text-gray-600">
              Mês
            </label>
            <div className="relative">
              <select
                value={values.mes}
                onChange={(e) => onChange('mes' as T, e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              >
                <option value="">Todos</option>
                {meses.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        )}

        {/* Busca */}
        {!hideBusca && (
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs font-medium text-gray-600">
              Busca
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={values.busca}
                onChange={(e) => onChange('busca' as T, e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
              />
            </div>
          </div>
        )}

        {/* Limpar */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 opacity-0 select-none">
            &nbsp;
          </label>
          <button
            onClick={onClear}
            disabled={!baseHasFilters}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium transition-all hover:border-red-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 disabled:hover:bg-transparent"
          >
            <FilterX size={14} />Limpar Filtros
          </button>
        </div>
      </div>
      {children && <div className="mt-4 flex flex-wrap gap-3 items-end">{children}</div>}
    </div>
  );
}
