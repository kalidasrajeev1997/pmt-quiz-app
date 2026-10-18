import { useMemo } from "react";

export type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

export interface UsePaginationOptions {
  page: number;
  totalPages: number;
  siblingCount?: number;
}

export interface UsePaginationReturn {
  items: PaginationItem[];
  canPrevious: boolean;
  canNext: boolean;
  previousPage: number;
  nextPage: number;
  totalPages: number;
  currentPage: number;
}

export function getPaginationItems(
  page: number,
  totalPages: number,
  siblingCount = 1,
): PaginationItem[] {
  if (totalPages <= 1) return [];

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);

  for (
    let i = Math.max(1, page - siblingCount);
    i <= Math.min(totalPages, page + siblingCount);
    i++
  ) {
    pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const items: PaginationItem[] = [];
  let previous = 0;

  for (const value of sorted) {
    if (value - previous > 1) {
      items.push(previous === 1 ? "ellipsis-start" : "ellipsis-end");
    }
    items.push(value);
    previous = value;
  }

  return items;
}

/**
 * Headless pagination hook providing item ranges and boundary states.
 */
export function usePagination({
  page,
  totalPages,
  siblingCount = 1,
}: UsePaginationOptions): UsePaginationReturn {
  const items = useMemo(
    () => getPaginationItems(page, totalPages, siblingCount),
    [page, totalPages, siblingCount],
  );

  return {
    items,
    canPrevious: page > 1,
    canNext: page < totalPages,
    previousPage: Math.max(1, page - 1),
    nextPage: Math.min(totalPages, page + 1),
    totalPages,
    currentPage: page,
  };
}
