import { Download, Calendar } from 'lucide-react';
import React, { JSX } from 'react';

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
  onExport?: () => void;
}

export default function DataTable({ 
  columns, 
  data, 
  updatedAt,
  title = "Resultados",
  caption,
  exportable = false,
  onExport
}: DataTableProps): JSX.Element {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          {caption && (
            <p className="text-sm text-gray-600 mt-1">{caption}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>Atualizado em {updatedAt}</span>
            </span>
          )}

          {exportable && data.length > 0 && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              aria-label="Exportar dados da tabela"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table 
          className="min-w-full border border-gray-200 rounded-lg overflow-hidden"
          role="table"
          aria-label={title}
        >
          <thead className="bg-gray-100">
            <tr role="row">
              {columns.map((col, index) => (
                <th
                  key={col.accessor}
                  scope="col"
                  className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b ${
                    index === 0 ? 'sticky left-0 bg-gray-100 z-10' : ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  role="row"
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={col.accessor}
                      role="cell"
                      className={`px-4 py-3 text-sm text-gray-700 border-b ${
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
                <td
                  role="cell"
                  colSpan={columns.length}
                  className="text-center py-8 text-sm text-gray-500"
                >
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
                    <p>Nenhum registro encontrado para os filtros selecionados.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">
          {data.length} {data.length === 1 ? 'registro encontrado' : 'registros encontrados'}
        </div>
      )}
    </div>
  );
}
