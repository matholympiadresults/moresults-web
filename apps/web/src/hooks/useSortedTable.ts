import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnDef,
  type TableOptions,
  type PaginationState,
} from "@tanstack/react-table";

interface UseSortedTableOptions<T> {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  defaultSort?: SortingState;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  tableOptions?: Partial<TableOptions<T>>;
}

export function useSortedTable<T>({
  data,
  columns,
  defaultSort,
  enableFiltering,
  enablePagination,
  tableOptions,
}: UseSortedTableOptions<T>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSort ?? []);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    ...(enablePagination ? { onPaginationChange: setPagination, autoResetPageIndex: false } : {}),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(enableFiltering ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    ...(enablePagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    ...tableOptions,
    state: {
      sorting,
      ...(enablePagination ? { pagination } : {}),
      ...tableOptions?.state,
    },
  } as TableOptions<T>);

  return { table, sorting, setSorting };
}
