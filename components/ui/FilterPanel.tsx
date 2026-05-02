import { Search, X, Filter } from 'lucide-react';
import React, { JSX } from 'react';

export interface FilterConfig {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  options?: { value: string | number; label: string }[];
}

export interface FilterPanelProps {
  filters: FilterConfig[];
  values?: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

export default function FilterPanel({ 
  filters, 
  values = {},
  onChange,
  onClear,
  showClearButton = true 
}: FilterPanelProps): JSX.Element {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const hasActiveFilters = Object.values(values).some(
    value => value !== '' && value !== null && value !== undefined
  );

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      // Se não houver callback customizado, limpa todos os filtros
      filters.forEach(filter => onChange(filter.name, ''));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
      {/* Header do painel */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900">
            Filtros de pesquisa
          </h2>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {Object.values(values).filter(v => v !== '' && v !== null && v !== undefined).length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showClearButton && hasActiveFilters && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              aria-label="Limpar todos os filtros"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 lg:hidden"
            aria-label={isExpanded ? "Recolher filtros" : "Expandir filtros"}
            aria-expanded={isExpanded}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Corpo do painel (colapsável em mobile) */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-[2000px] lg:opacity-100'
        } overflow-hidden`}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filters.map((filter) => (
              <div key={filter.name} className="flex flex-col">
                <label
                  htmlFor={filter.name}
                  className="text-sm font-medium text-gray-700 mb-1.5"
                >
                  {filter.label}
                  {filter.required && (
                    <span className="text-red-500 ml-1" aria-label="obrigatório">*</span>
                  )}
                </label>

                {filter.type === "select" ? (
                  <div className="relative">
                    <select
                      id={filter.name}
                      name={filter.name}
                      value={values[filter.name] || ''}
                      required={filter.required}
                      disabled={filter.disabled}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors appearance-none pr-10"
                      onChange={(e) => onChange(filter.name, e.target.value)}
                      aria-describedby={filter.description ? `${filter.name}-description` : undefined}
                    >
                      <option value="">
                        {filter.placeholder || 'Todos'}
                      </option>
                      {filter.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : filter.type === "search" ? (
                  <div className="relative">
                    <input
                      id={filter.name}
                      name={filter.name}
                      type="text"
                      value={values[filter.name] || ''}
                      placeholder={filter.placeholder}
                      required={filter.required}
                      disabled={filter.disabled}
                      className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                      onChange={(e) => onChange(filter.name, e.target.value)}
                      aria-describedby={filter.description ? `${filter.name}-description` : undefined}
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" aria-hidden="true" />
                    </div>
                  </div>
                ) : (
                  <input
                    id={filter.name}
                    name={filter.name}
                    type={filter.type}
                    value={values[filter.name] || ''}
                    placeholder={filter.placeholder}
                    required={filter.required}
                    disabled={filter.disabled}
                    min={filter.min}
                    max={filter.max}
                    step={filter.step}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    onChange={(e) => onChange(filter.name, e.target.value)}
                    aria-describedby={filter.description ? `${filter.name}-description` : undefined}
                  />
                )}

                {filter.description && (
                  <p 
                    id={`${filter.name}-description`}
                    className="mt-1 text-xs text-gray-500"
                  >
                    {filter.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
