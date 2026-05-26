'use client';

import { useState, useEffect, useMemo } from 'react';

const DEFAULT_PAGE_SIZE = 25;

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE, resetKey?: string | number) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [items.length, resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const startIndex = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, items.length);

  function goPage(p: number) {
    if (p >= 1 && p <= totalPages) {
      setPage(p);
    }
  }

  return {
    page: safePage,
    setPage: goPage,
    totalPages,
    slice,
    total: items.length,
    pageSize,
    startIndex,
    endIndex,
    showPagination: totalPages > 1,
  };
}
