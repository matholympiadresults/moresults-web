import Fuse from "fuse.js";
import { useCallback, useMemo, useRef } from "react";
import type { FilterFn, Table } from "@tanstack/react-table";
import type { ChangeEventHandler } from "react";

export interface UseTableSearchReturn<T> {
  fuzzySearch: FilterFn<T>;
  createHandleSearch: (table: Table<T>, columnId: string) => ChangeEventHandler<HTMLInputElement>;
}

/**
 * Hook to manage fuzzy search functionality for any text column.
 * Provides the filter function and a factory for creating the search handler.
 *
 * Features:
 * - Fuzzy matching with configurable threshold (0.4)
 * - Single Fuse instance for all rows (O(1) per row instead of O(n))
 * - Automatic sorting by match score when searching
 * - Resets to original order when search is cleared
 * - Resets pagination on search
 */
export function useTableSearch<T>(
  getSearchValue: (row: T) => string,
  defaultSorting: { id: string; desc: boolean }[] = [],
  data: T[] = []
): UseTableSearchReturn<T> {
  // Build Fuse index once when data changes
  const fuse = useMemo(() => {
    if (data.length === 0) return null;

    // Create searchable items with index reference
    const searchItems = data.map((item, index) => ({
      value: getSearchValue(item),
      index,
    }));

    return new Fuse(searchItems, {
      keys: ["value"],
      includeScore: true,
      threshold: 0.4,
    });
  }, [data, getSearchValue]);

  // Cache search results to avoid re-searching for each row
  const searchCache = useRef<{ query: string; matches: Map<number, number> }>({
    query: "",
    matches: new Map(),
  });

  const fuzzySearch: FilterFn<T> = useCallback(
    (row, columnID, filterValue, addMeta) => {
      if (typeof filterValue !== "string" || filterValue.trim() === "") {
        return true;
      }

      if (!fuse) return true;

      // Check if we need to re-search (query changed)
      if (searchCache.current.query !== filterValue) {
        const results = fuse.search(filterValue);
        const matches = new Map<number, number>();
        results.forEach((result) => {
          matches.set(result.item.index, result.score ?? 0);
        });
        searchCache.current = { query: filterValue, matches };
      }

      // Look up this row's index in the cached results
      const rowIndex = row.index;
      const score = searchCache.current.matches.get(rowIndex);

      if (score !== undefined) {
        addMeta(score);
        return true;
      }

      return false;
    },
    [fuse]
  );

  const createHandleSearch = useCallback(
    (table: Table<T>, columnId: string): ChangeEventHandler<HTMLInputElement> => {
      return (event) => {
        const value = event.currentTarget.value;
        table.getColumn(columnId)?.setFilterValue(value);
        table.setPageIndex(0);

        if (value.trim() !== "") {
          table.setSorting([
            {
              id: columnId,
              desc: false,
            },
          ]);
        } else {
          table.setSorting(defaultSorting);
        }
      };
    },
    [defaultSorting]
  );

  return { fuzzySearch, createHandleSearch };
}
