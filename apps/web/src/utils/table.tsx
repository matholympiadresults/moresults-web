import { Alert, Skeleton, Table } from "@mantine/core";
import { IconSortAscending, IconSortDescending, IconSelector } from "@tabler/icons-react";
import { flexRender, type Row, type ColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { CSSProperties, JSX } from "react";
import { Source } from "@/schemas/base";

export const sourceColors: Record<Source, string> = {
  [Source.IMO]: "light-dark(var(--mantine-color-blue-1), var(--mantine-color-blue-light))",
  [Source.EGMO]: "light-dark(var(--mantine-color-yellow-1), var(--mantine-color-yellow-light))",
  [Source.MEMO]: "light-dark(var(--mantine-color-green-1), var(--mantine-color-green-light))",
  [Source.RMM]: "light-dark(var(--mantine-color-orange-1), var(--mantine-color-orange-light))",
  [Source.APMO]: "light-dark(var(--mantine-color-pink-1), var(--mantine-color-pink-light))",
  [Source.BMO]: "light-dark(var(--mantine-color-violet-1), var(--mantine-color-violet-light))",
  [Source.PAMO]: "light-dark(var(--mantine-color-teal-1), var(--mantine-color-teal-light))",
};

export function getSortingIcon(
  direction: false | "asc" | "desc",
  canSort: boolean
): JSX.Element | null {
  let icon: JSX.Element | null = null;

  if (canSort === true) {
    switch (direction) {
      case "asc": {
        icon = <IconSortAscending size={16} />;
        break;
      }
      case "desc": {
        icon = <IconSortDescending size={16} />;
        break;
      }
      default: {
        icon = <IconSelector size={16} />;
        break;
      }
    }
  }

  return icon;
}

export interface RowGroupSeparator<T> {
  /** Returns a group key for the row. Separator is shown when key changes. */
  getGroupKey: (row: Row<T>) => string | number;
  /** Style for the separator row */
  separatorStyle: CSSProperties;
}

export interface GetTableBodyParams<T> {
  isLoading: boolean;
  error?: Error | null;
  tableRows: Row<T>[];
  columnCount: number;
  noDataMessage?: string;
  getRowStyle?: (row: Row<T>) => CSSProperties | undefined;
  /** Optional: show separator rows between groups of rows */
  rowGroupSeparator?: RowGroupSeparator<T>;
}

export function getTableBody<T>(params: GetTableBodyParams<T>) {
  const {
    isLoading,
    error,
    tableRows,
    columnCount,
    noDataMessage = "No data available",
    getRowStyle,
    rowGroupSeparator,
  } = params;
  let tableBody: JSX.Element[] | JSX.Element;
  if (isLoading === true) {
    tableBody = Array.from<null>({ length: 5 }).map((_, rowIndex) => {
      return (
        <Table.Tr key={rowIndex}>
          {Array.from<null>({ length: columnCount }).map((__, colIndex) => {
            return (
              <Table.Td key={colIndex}>
                <Skeleton height={16} width="100%" />
              </Table.Td>
            );
          })}
        </Table.Tr>
      );
    });
  } else if (error instanceof Error) {
    tableBody = (
      <Table.Tr>
        <Table.Td colSpan={columnCount} align="center">
          <Alert color="red">{error.message}</Alert>
        </Table.Td>
      </Table.Tr>
    );
  } else if (tableRows.length === 0) {
    tableBody = (
      <Table.Tr>
        <Table.Td colSpan={columnCount} align="center">
          {noDataMessage}
        </Table.Td>
      </Table.Tr>
    );
  } else {
    const result: JSX.Element[] = [];
    let prevGroupKey: string | number | null = null;

    tableRows.forEach((row) => {
      // Add separator row if group key changed
      if (rowGroupSeparator) {
        const currentGroupKey = rowGroupSeparator.getGroupKey(row);
        if (prevGroupKey !== null && currentGroupKey !== prevGroupKey) {
          result.push(
            <Table.Tr key={`separator-${currentGroupKey}`}>
              <Table.Td colSpan={columnCount} py="xs" style={rowGroupSeparator.separatorStyle} />
            </Table.Tr>
          );
        }
        prevGroupKey = currentGroupKey;
      }

      const rowStyle = getRowStyle?.(row);
      result.push(
        <Table.Tr key={row.id} style={rowStyle}>
          {row.getVisibleCells().map((cell) => {
            return (
              <Table.Td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </Table.Td>
            );
          })}
        </Table.Tr>
      );
    });

    tableBody = result;
  }
  return tableBody;
}

/**
 * Row type for tables that display problem scores.
 * Used by generateProblemColumns to type the accessor.
 */
export interface ProblemScoreRow {
  problemScores: (number | null)[];
  numProblems: number;
}

/**
 * Generates column definitions for problem scores (P1, P2, P3, etc.).
 * This pattern is used across multiple competition result tables.
 *
 * @param columnHelper - The TanStack Table column helper for the row type
 * @param maxProblems - Maximum number of problems to generate columns for
 * @returns Array of column definitions for problem scores
 */
export function generateProblemColumns<T extends ProblemScoreRow>(
  columnHelper: ColumnHelper<T>,
  maxProblems: number
): ColumnDef<T, unknown>[] {
  return Array.from({ length: maxProblems }, (_, i) =>
    columnHelper.display({
      id: `p${i + 1}`,
      header: `P${i + 1}`,
      cell: (info) => {
        if (i >= info.row.original.numProblems) return "-";
        const score = info.row.original.problemScores[i];
        return score !== null ? score : "-";
      },
    })
  );
}
