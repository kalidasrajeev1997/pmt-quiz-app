import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getPaginationItems, usePagination } from "../usePagination";

describe("getPaginationItems", () => {
  it("returns empty array when totalPages <= 1", () => {
    expect(getPaginationItems(1, 1)).toEqual([]);
    expect(getPaginationItems(1, 0)).toEqual([]);
  });

  it("returns start, end and ellipsis when on page 1 with many pages", () => {
    expect(getPaginationItems(1, 5)).toEqual([1, 2, "ellipsis-end", 5]);
  });

  it("returns consecutive items without ellipsis when pages are close", () => {
    expect(getPaginationItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("returns ellipsis-start when on the last page", () => {
    expect(getPaginationItems(5, 5)).toEqual([1, "ellipsis-start", 4, 5]);
  });

  it("returns both ellipsis-start and ellipsis-end when in the middle of a large range", () => {
    expect(getPaginationItems(5, 10)).toEqual([
      1,
      "ellipsis-start",
      4,
      5,
      6,
      "ellipsis-end",
      10,
    ]);
  });
});

describe("usePagination hook", () => {
  it("computes boundary states on the first page", () => {
    const { result } = renderHook(() =>
      usePagination({ page: 1, totalPages: 5, siblingCount: 1 }),
    );

    expect(result.current.canPrevious).toBe(false);
    expect(result.current.canNext).toBe(true);
    expect(result.current.previousPage).toBe(1);
    expect(result.current.nextPage).toBe(2);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.items).toEqual([1, 2, "ellipsis-end", 5]);
  });

  it("computes boundary states on the last page", () => {
    const { result } = renderHook(() =>
      usePagination({ page: 5, totalPages: 5 }),
    );

    expect(result.current.canPrevious).toBe(true);
    expect(result.current.canNext).toBe(false);
    expect(result.current.previousPage).toBe(4);
    expect(result.current.nextPage).toBe(5);
  });

  it("computes boundary states on an intermediate page", () => {
    const { result } = renderHook(() =>
      usePagination({ page: 3, totalPages: 5 }),
    );

    expect(result.current.canPrevious).toBe(true);
    expect(result.current.canNext).toBe(true);
    expect(result.current.previousPage).toBe(2);
    expect(result.current.nextPage).toBe(4);
  });
});
