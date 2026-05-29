'use client';

import { useState, useEffect, useMemo } from 'react';

const DEFAULT_PAGE_SIZE = 25;

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE, resetKey?: string | number) {
  const [page, setPage] = useState(1);
  const [prevLength, setPrevLength] = useState(items.length);
  const [prevReset, setPrevReset] = useState(resetKey);

  let currentSafePage = page;

  if (items.length !== prevLength || resetKey !== prevReset) {
    setPrevLength(items.length);
    setPrevReset(resetKey);
    setPage(1);
    currentSafePage = 1;
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  
  if (currentSafePage > totalPages) {
    setPage(totalPages);
    currentSafePage = totalPages;
  }

  const safePage = currentSafePage;

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
