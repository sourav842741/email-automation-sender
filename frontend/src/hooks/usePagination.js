import { useState, useCallback, useMemo } from 'react';

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => {
    if (total <= 0) return 0;
    return Math.ceil(total / limit);
  }, [total, limit]);

  const hasNext = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrev = useMemo(() => page > 1, [page]);

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback(
    (p) => {
      const target = Math.max(1, Math.min(p, totalPages));
      setPage(target);
    },
    [totalPages]
  );

  const changeLimit = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  return {
    page,
    limit,
    totalPages,
    total,
    setPage: goToPage,
    setLimit: changeLimit,
    setTotal,
    nextPage,
    prevPage,
    hasNext,
    hasPrev,
  };
}

export default usePagination;
