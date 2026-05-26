'use client';

import { ReactNode } from 'react';
import { ChevronDown, FilterX, Search } from 'lucide-react';

export type FilterValues = {
  ano: string;
  mes: string;
  busca: string;
};

interface FilterPanelProps {
  anos: string[];
  meses: { value: string; label: string }[];
  values: FilterValues;
  onChange: (field: 'ano' | 'mes' | 'busca', value: string) => void;
  onClear: () => void;
  anosLoading?: boolean;
  children?: ReactNode;
}

export default function FilterPanel({ anos, meses, values, onChange, onClear, anosLoading, children }: FilterPanelProps) {
  const baseHasFilters = values.ano !== '' || values.mes !== '' || values.busca !== '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        {/* Ano */}
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
                  onChange={(e) => onChange('ano', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-4 pr-10 py-2.5 appearance-none text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
                >
                  <option value="">Todos</option>
                  {anos.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </>
            )}
          </div>
        </div>

        {/* Mês */}
        <div className="flex flex-col gap-1 sm:w-44">
          <label className="text-xs font-medium text-gray-600">
            Mês
          </label>
          <div className="relative">
            <select
              value={values.mes}
              onChange={(e) => onChange('mes', e.target.value)}
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

        {/* Busca */}
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
              onChange={(e) => onChange('busca', e.target.value)}
              placeholder="Pesquisar por código ou descrição..."
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
            />
          </div>
        </div>

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
            <FilterX size={14} />Limpar Filtros</button>
        </div>
      </div>
      {children && <div className="mt-4 flex flex-wrap gap-3 items-end">{children}</div>}
    </div>
  );
}
