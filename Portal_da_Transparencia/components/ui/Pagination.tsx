'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex?: number;
  endIndex?: number;
  total?: number;
  className?: string;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  total,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function goPage(p: number) {
    if (p >= 1 && p <= totalPages) {
      onPageChange(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)
  );

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 ${className}`}>
      {total !== undefined && startIndex !== undefined && endIndex !== undefined && (
        <p className="text-sm text-gray-500 order-2 sm:order-1">
          Mostrando <strong className="text-gray-800">{startIndex}</strong>–<strong className="text-gray-800">{endIndex}</strong> de{' '}
          <strong className="text-gray-800">{total}</strong> {total === 1 ? 'registro' : 'registros'}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
        <button
          type="button"
          onClick={() => goPage(page - 1)}
          disabled={page === 1}
          className="w-10 h-10 flex items-center justify-center rounded-xl font-bold bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 transition disabled:opacity-30"
          aria-label="Página anterior"
        >
          <ChevronLeft size={20} />
        </button>

        {pageNumbers.map((p, idx, arr) => (
          <div key={p} className="flex gap-2">
            {idx > 0 && p - arr[idx - 1] > 1 && (
              <span className="w-10 h-10 flex items-center justify-center text-gray-400" aria-hidden>
                …
              </span>
            )}
            <button
              type="button"
              onClick={() => goPage(p)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition ${
                page === p
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white border border-gray-200 hover:border-blue-400 text-gray-600'
              }`}
              aria-label={`Página ${p}`}
              aria-current={page === p ? 'page' : undefined}
            >
              {p}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => goPage(page + 1)}
          disabled={page === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-xl font-bold bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 transition disabled:opacity-30"
          aria-label="Próxima página"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
