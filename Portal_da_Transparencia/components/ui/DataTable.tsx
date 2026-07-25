'use client';

import { Download, AlertCircle } from 'lucide-react';
import React, { JSX, useCallback } from 'react';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/lib/hooks/usePagination';

export interface ColumnConfig {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps {
  columns: ColumnConfig[];
  data: any[];
  updatedAt?: string;
  title?: string;
  caption?: string;
  exportable?: boolean;
  loading?: boolean;
  error?: string | null;
  onExport?: () => void;
  pageSize?: number;
  paginationResetKey?: string | number;
  hasActiveFilters?: boolean;
  emptyMessage?: React.ReactNode;
  emptyFilteredMessage?: React.ReactNode;
}

/** Extrai o valor textual de uma célula para o CSV. */
function cellValue(row: any, col: ColumnConfig): string {
  const raw = row[col.accessor];
  if (raw == null) return '';
  if (col.render) {
    // renderiza num elemento temporário para extrair texto
    const el = document.createElement('div');
    const result = col.render(raw, row);
    if (typeof result === 'string') {
      el.innerHTML = result;
    } else if (result && typeof result === 'object' && 'props' in result) {
      // React element – tenta extrair children
      const children = (result as any).props?.children;
      if (typeof children === 'string') {
        el.textContent = children;
      } else if (Array.isArray(children)) {
        el.textContent = children.filter((c: any) => typeof c === 'string').join(' ');
      } else {
        el.textContent = String(raw);
      }
    } else {
      el.textContent = String(raw);
    }
    return el.textContent || '';
  }
  return String(raw);
}

/** Gera e dispara o download de um arquivo CSV com todos os dados. */
function downloadCSV(columns: ColumnConfig[], allData: any[], filename: string) {
  const headerRow = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(';');
  const dataRows = allData.map((row) =>
    columns.map((col) => `"${cellValue(row, col).replace(/"/g, '""')}"`).join(';')
  );
  const csv = `\uFEFF${headerRow}\n${dataRows.join('\n')}`; // BOM UTF-8 para acentos
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export default function DataTable({
  columns,
  data,
  updatedAt,
  title = 'Resultados',
  caption,
  exportable = false,
  loading = false,
  onExport,
  pageSize = 25,
  paginationResetKey,
  hasActiveFilters = false,
  emptyMessage = 'Nenhum dado disponível',
  emptyFilteredMessage = 'Nenhum registro encontrado para os filtros selecionados.',
  error,
}: DataTableProps): JSX.Element {
  const { slice, page, setPage, totalPages, total, startIndex, endIndex } = usePagination(
    data,
    pageSize,
    paginationResetKey
  );

  const displayData = slice;
  const emptyText = hasActiveFilters ? emptyFilteredMessage : emptyMessage;

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    } else {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/_+$/, '');
      downloadCSV(columns, data, slug);
    }
  }, [columns, data, onExport, title]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-7">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {caption && <p className="text-sm text-gray-600 mt-1">{caption}</p>}
        </div>
        {exportable && !loading && data.length > 0 && (
          <button
            onClick={handleExport}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            aria-label="Exportar dados completos em CSV"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            CSV
          </button>
        )}
      </div>

      <div className="overflow-x-auto -mx-6 px-7">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden" role="table" aria-label={title}>
          <thead className="bg-gray-100">
            <tr role="row">
              {columns.map((col, index) => (
                <th
                  key={col.accessor}
                  scope="col"
                  className={`px-5 py-3.5 text-left text-sm font-semibold text-gray-700 border-b ${
                    index === 0 ? 'sticky left-0 bg-gray-100 z-10' : ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {error ? (
              <tr role="row">
                <td role="cell" colSpan={columns.length} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-red-400" role="alert">
                    <AlertCircle size={32} />
                    <p className="text-sm font-semibold text-red-600">Erro ao carregar dados</p>
                    <p className="text-xs text-red-500 max-w-md">{error}</p>
                    <p className="text-xs text-gray-400">Tente novamente mais tarde ou contate o suporte técnico.</p>
                  </div>
                </td>
              </tr>
            ) : loading ? (
              <tr role="row">
                <td role="cell" colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Carregando dados...</p>
                  </div>
                </td>
              </tr>
            ) : displayData.length > 0 ? (
              displayData.map((row, rowIndex) => (
                <tr key={rowIndex} role="row" className="hover:bg-gray-50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.accessor}
                      role="cell"
                      className={`px-5 py-3.5 text-sm text-gray-700 border-b ${
                        colIndex === 0 ? 'sticky left-0 bg-white z-10 font-medium' : ''
                      }`}
                    >
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr role="row">
                <td role="cell" colSpan={columns.length} className="text-center py-12 text-sm text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="font-medium text-gray-600">{emptyText}</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && data.length > 0 && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            startIndex={startIndex}
            endIndex={endIndex}
            total={total}
          />
        </div>
      )}
    </div>
  );
}
