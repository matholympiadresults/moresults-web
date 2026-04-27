import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { getSortingIcon, getTableBody } from "./table";
import { MantineProvider, Table } from "@mantine/core";
import type { Row } from "@tanstack/react-table";

const renderWithMantine = (ui: React.ReactNode) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe("getSortingIcon", () => {
  it("returns null when column cannot be sorted", () => {
    expect(getSortingIcon(false, false)).toBeNull();
    expect(getSortingIcon("asc", false)).toBeNull();
    expect(getSortingIcon("desc", false)).toBeNull();
  });

  it("returns selector icon when no sort direction", () => {
    const icon = getSortingIcon(false, true);
    expect(icon).not.toBeNull();
    renderWithMantine(icon);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("returns ascending icon for asc direction", () => {
    const icon = getSortingIcon("asc", true);
    expect(icon).not.toBeNull();
    renderWithMantine(icon);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("returns descending icon for desc direction", () => {
    const icon = getSortingIcon("desc", true);
    expect(icon).not.toBeNull();
    renderWithMantine(icon);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });
});

describe("getTableBody", () => {
  interface TestRow {
    id: string;
    name: string;
  }

  const createMockRow = (id: string, name: string): Row<TestRow> =>
    ({
      id,
      original: { id, name },
      getVisibleCells: () => [
        {
          id: `${id}_id`,
          column: { columnDef: { cell: () => id } },
          getContext: () => ({}),
        },
        {
          id: `${id}_name`,
          column: { columnDef: { cell: () => name } },
          getContext: () => ({}),
        },
      ],
    }) as unknown as Row<TestRow>;

  const renderTableBody = (body: ReturnType<typeof getTableBody>) => {
    return renderWithMantine(
      <Table>
        <Table.Tbody>{body}</Table.Tbody>
      </Table>
    );
  };

  it("shows skeleton rows when loading", () => {
    const body = getTableBody({
      isLoading: true,
      error: null,
      tableRows: [],
      columnCount: 3,
    });

    renderTableBody(body);

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(5);
  });

  it("shows error message when error is provided", () => {
    const body = getTableBody({
      isLoading: false,
      error: new Error("Failed to load data"),
      tableRows: [],
      columnCount: 3,
    });

    renderTableBody(body);

    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
  });

  it("shows no data message when rows are empty", () => {
    const body = getTableBody({
      isLoading: false,
      error: null,
      tableRows: [],
      columnCount: 3,
      noDataMessage: "No competitions found",
    });

    renderTableBody(body);

    expect(screen.getByText("No competitions found")).toBeInTheDocument();
  });

  it("uses default no data message", () => {
    const body = getTableBody({
      isLoading: false,
      error: null,
      tableRows: [],
      columnCount: 3,
    });

    renderTableBody(body);

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders table rows when data is provided", () => {
    const rows = [createMockRow("1", "Alice"), createMockRow("2", "Bob")];

    const body = getTableBody({
      isLoading: false,
      error: null,
      tableRows: rows,
      columnCount: 2,
    });

    renderTableBody(body);

    const tableRows = screen.getAllByRole("row");
    expect(tableRows).toHaveLength(2);
  });

  it("prioritizes loading state over error", () => {
    const body = getTableBody({
      isLoading: true,
      error: new Error("Some error"),
      tableRows: [],
      columnCount: 3,
    });

    renderTableBody(body);

    expect(screen.queryByText("Some error")).not.toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(5);
  });

  it("prioritizes error over empty data", () => {
    const body = getTableBody({
      isLoading: false,
      error: new Error("Network error"),
      tableRows: [],
      columnCount: 3,
      noDataMessage: "Empty",
    });

    renderTableBody(body);

    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.queryByText("Empty")).not.toBeInTheDocument();
  });
});
