import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTableSearch } from "./useTableSearch";

interface TestItem {
  id: number;
  name: string;
}

const testData: TestItem[] = [
  { id: 0, name: "Alice Johnson" },
  { id: 1, name: "Bob Smith" },
  { id: 2, name: "Charlie Brown" },
  { id: 3, name: "David Williams" },
  { id: 4, name: "Eve Davis" },
];

const getSearchValue = (item: TestItem) => item.name;
const defaultSorting = [{ id: "name", desc: false }];

describe("useTableSearch", () => {
  describe("fuzzySearch filter function", () => {
    it("returns true for empty filter value", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const mockRow = { index: 0 } as never;
      const addMeta = vi.fn();

      expect(result.current.fuzzySearch(mockRow, "name", "", addMeta)).toBe(true);
      expect(result.current.fuzzySearch(mockRow, "name", "  ", addMeta)).toBe(true);
    });

    it("returns true for empty data", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, []));

      const mockRow = { index: 0 } as never;
      const addMeta = vi.fn();

      expect(result.current.fuzzySearch(mockRow, "name", "alice", addMeta)).toBe(true);
    });

    it("returns true for matching rows", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const mockRow = { index: 0 } as never; // Alice Johnson
      const addMeta = vi.fn();

      expect(result.current.fuzzySearch(mockRow, "name", "Alice", addMeta)).toBe(true);
      expect(addMeta).toHaveBeenCalled();
    });

    it("returns false for non-matching rows", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const mockRow = { index: 1 } as never; // Bob Smith
      const addMeta = vi.fn();

      expect(result.current.fuzzySearch(mockRow, "name", "Alice", addMeta)).toBe(false);
    });

    it("supports fuzzy matching", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const mockRow = { index: 0 } as never; // Alice Johnson
      const addMeta = vi.fn();

      // "Alic" should match "Alice"
      expect(result.current.fuzzySearch(mockRow, "name", "Alic", addMeta)).toBe(true);
    });

    it("caches search results for same query", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const addMeta = vi.fn();

      // First call builds cache
      result.current.fuzzySearch({ index: 0 } as never, "name", "Alice", addMeta);

      // Second call with same query should use cache
      result.current.fuzzySearch({ index: 1 } as never, "name", "Alice", addMeta);

      // Both should work correctly
      expect(addMeta).toHaveBeenCalledTimes(1); // Only Alice matches
    });
  });

  describe("createHandleSearch", () => {
    it("creates a handler function", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const mockTable = {
        getColumn: vi.fn().mockReturnValue({
          setFilterValue: vi.fn(),
        }),
        setPageIndex: vi.fn(),
        setSorting: vi.fn(),
      };

      const handler = result.current.createHandleSearch(mockTable as never, "name");
      expect(typeof handler).toBe("function");
    });

    it("sets filter value on input change", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const setFilterValue = vi.fn();
      const mockTable = {
        getColumn: vi.fn().mockReturnValue({ setFilterValue }),
        setPageIndex: vi.fn(),
        setSorting: vi.fn(),
      };

      const handler = result.current.createHandleSearch(mockTable as never, "name");
      handler({ currentTarget: { value: "test" } } as never);

      expect(setFilterValue).toHaveBeenCalledWith("test");
    });

    it("resets page index on search", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const mockTable = {
        getColumn: vi.fn().mockReturnValue({ setFilterValue: vi.fn() }),
        setPageIndex: vi.fn(),
        setSorting: vi.fn(),
      };

      const handler = result.current.createHandleSearch(mockTable as never, "name");
      handler({ currentTarget: { value: "test" } } as never);

      expect(mockTable.setPageIndex).toHaveBeenCalledWith(0);
    });

    it("sets sorting by search column when searching", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const mockTable = {
        getColumn: vi.fn().mockReturnValue({ setFilterValue: vi.fn() }),
        setPageIndex: vi.fn(),
        setSorting: vi.fn(),
      };

      const handler = result.current.createHandleSearch(mockTable as never, "name");
      handler({ currentTarget: { value: "test" } } as never);

      expect(mockTable.setSorting).toHaveBeenCalledWith([{ id: "name", desc: false }]);
    });

    it("resets to default sorting when search is cleared", () => {
      const { result } = renderHook(() => useTableSearch(getSearchValue, defaultSorting, testData));

      const mockTable = {
        getColumn: vi.fn().mockReturnValue({ setFilterValue: vi.fn() }),
        setPageIndex: vi.fn(),
        setSorting: vi.fn(),
      };

      const handler = result.current.createHandleSearch(mockTable as never, "name");
      handler({ currentTarget: { value: "" } } as never);

      expect(mockTable.setSorting).toHaveBeenCalledWith(defaultSorting);
    });
  });

  describe("hook stability", () => {
    it("returns stable fuzzySearch function reference", () => {
      const { result, rerender } = renderHook(() =>
        useTableSearch(getSearchValue, defaultSorting, testData)
      );

      const firstFuzzySearch = result.current.fuzzySearch;
      rerender();
      const secondFuzzySearch = result.current.fuzzySearch;

      expect(firstFuzzySearch).toBe(secondFuzzySearch);
    });

    it("updates fuzzySearch when data changes", () => {
      const { result, rerender } = renderHook(
        ({ data }) => useTableSearch(getSearchValue, defaultSorting, data),
        { initialProps: { data: testData } }
      );

      const firstFuzzySearch = result.current.fuzzySearch;
      rerender({ data: [...testData, { id: 5, name: "Frank Miller" }] });
      const secondFuzzySearch = result.current.fuzzySearch;

      expect(firstFuzzySearch).not.toBe(secondFuzzySearch);
    });
  });
});
