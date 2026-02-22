import { useMemo } from "react";
import { Container, Title, Text, Table, Anchor, Group, Select, ScrollArea } from "@mantine/core";
import { Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { useSortedTable } from "@/hooks/useSortedTable";
import { useCompetitions } from "@/hooks/api";
import { getTableBody, getSortingIcon, sourceColors } from "@/utils/table";
import { ROUTES } from "@/constants/routes";
import { Source } from "@/schemas/base";
import { SOURCE_OPTIONS } from "@/constants/filterOptions";

interface CompetitionRow {
  id: string;
  source: Source;
  edition: number | null;
  year: number;
}

const columnHelper = createColumnHelper<CompetitionRow>();

export function Competitions() {
  const { competitions, loading, error } = useCompetitions();
  const rows: CompetitionRow[] = useMemo(
    () =>
      competitions.map((comp) => ({
        id: comp.id,
        source: comp.source,
        edition: comp.edition,
        year: comp.year,
      })),
    [competitions]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("source", {
        header: "Competition",
        cell: (info) => (
          <Anchor component={Link} to={ROUTES.COMPETITION(info.row.original.id)}>
            {info.getValue()}
          </Anchor>
        ),
        filterFn: (row, columnId, filterValue: string | null) => {
          if (!filterValue) return true;
          return row.getValue(columnId) === filterValue;
        },
      }),
      columnHelper.accessor("edition", {
        header: "Edition",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("year", {
        header: "Year",
      }),
    ],
    []
  );

  const { table } = useSortedTable({
    data: rows,
    columns,
    defaultSort: [{ id: "year", desc: true }],
    enableFiltering: true,
  });

  return (
    <Container>
      <Title>Competitions</Title>
      <Text c="dimmed" mb="md">
        {table.getFilteredRowModel().rows.length} of {competitions.length} competitions
      </Text>

      <Group align="end" mb="md">
        <Select
          placeholder="Filter by source"
          clearable
          data={SOURCE_OPTIONS}
          value={table.getColumn("source")?.getFilterValue() as string | null}
          onChange={(value) => {
            table.getColumn("source")?.setFilterValue(value);
          }}
          style={{ minWidth: 120 }}
        />
      </Group>

      <ScrollArea>
        <Table striped highlightOnHover miw={400}>
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
                  >
                    <Group gap="xs">
                      {header.isPlaceholder
                        ? null
                        : typeof header.column.columnDef.header === "string"
                          ? header.column.columnDef.header
                          : null}
                      {getSortingIcon(header.column.getIsSorted(), header.column.getCanSort())}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {getTableBody({
              isLoading: loading,
              error,
              tableRows: table.getRowModel().rows,
              columnCount: columns.length,
              noDataMessage: "No competitions found",
              getRowStyle: (row) => ({
                backgroundColor: sourceColors[row.original.source],
              }),
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Container>
  );
}
