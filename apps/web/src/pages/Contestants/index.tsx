import { useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Anchor,
  Group,
  TextInput,
  MultiSelect,
  Pagination,
  Select,
  ScrollArea,
  SimpleGrid,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { Link } from "react-router";
import { createColumnHelper, type SortingState } from "@tanstack/react-table";
import { useSortedTable } from "@/hooks/useSortedTable";
import { usePeople, useCountries } from "@/hooks/api";
import { useTableSearch } from "@/hooks/useTableSearch";
import { getTableBody, getSortingIcon } from "@/utils/table";
import { CountryFlag } from "@/utils/flags";
import { ROUTES } from "@/constants/routes";
import { aggregateContestants, type ContestantRow } from "./aggregation";

const columnHelper = createColumnHelper<ContestantRow>();

const PAGE_SIZE_OPTIONS = [
  { value: "25", label: "25 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
];

const DEFAULT_SORTING: SortingState = [{ id: "name", desc: false }];

export function Contestants() {
  const { people, loading, error } = usePeople();
  const { countries } = useCountries();
  // (sorting and pagination managed by useSortedTable)

  const countryMap = useMemo(
    () => Object.fromEntries(countries.map((c) => [c.id, c])),
    [countries]
  );

  const countryOptions = useMemo(
    () =>
      countries
        .map((c) => ({ value: c.id, label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries]
  );

  const rows: ContestantRow[] = useMemo(
    () => aggregateContestants({ people, countryMap }),
    [people, countryMap]
  );

  const { fuzzySearch, createHandleSearch } = useTableSearch<ContestantRow>(
    (row) => row.name,
    DEFAULT_SORTING,
    rows
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <Anchor component={Link} to={ROUTES.CONTESTANT(info.row.original.id)}>
            {info.getValue()}
          </Anchor>
        ),
        filterFn: fuzzySearch,
        sortingFn: (rowA, rowB, columnID) => {
          // If filtering is active, sort by fuzzy match score
          const scoreA = rowA.columnFiltersMeta[columnID];
          const scoreB = rowB.columnFiltersMeta[columnID];
          if (typeof scoreA === "number" && typeof scoreB === "number") {
            return scoreA < scoreB ? -1 : 1;
          }
          // Otherwise sort alphabetically
          return rowA.original.name.localeCompare(rowB.original.name);
        },
      }),
      columnHelper.accessor("countryId", {
        header: "Country",
        cell: (info) => (
          <Group gap={6} wrap="nowrap">
            <CountryFlag code={info.row.original.countryCode} />
            {info.row.original.countryName}
          </Group>
        ),
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return filterValue.includes(row.getValue(columnId));
        },
      }),
    ],
    [fuzzySearch]
  );

  const { table } = useSortedTable({
    data: rows,
    columns,
    defaultSort: DEFAULT_SORTING,
    enableFiltering: true,
    enablePagination: true,
  });

  const handleSearch = createHandleSearch(table, "name");

  return (
    <Container>
      <Title>Contestants</Title>
      <Text c="dimmed" mb="md">
        {table.getFilteredRowModel().rows.length === rows.length
          ? `${rows.length} contestants`
          : `${table.getFilteredRowModel().rows.length} of ${rows.length} contestants`}
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
        <TextInput
          placeholder="Search by name..."
          leftSection={<IconSearch size={16} />}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={handleSearch}
        />
        <MultiSelect
          placeholder="Filter by country"
          searchable
          clearable
          data={countryOptions}
          value={(table.getColumn("countryId")?.getFilterValue() as string[]) ?? []}
          onChange={(value) => {
            table.getColumn("countryId")?.setFilterValue(value);
          }}
        />
      </SimpleGrid>

      <ScrollArea>
        <Table striped highlightOnHover miw={500}>
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
              noDataMessage: "No contestants found",
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Group justify="space-between" mt="md" wrap="wrap" gap="md">
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length}
          </Text>
          <Select
            size="xs"
            data={PAGE_SIZE_OPTIONS}
            value={String(table.getState().pagination.pageSize)}
            onChange={(value) => {
              table.setPageSize(Number(value));
              table.setPageIndex(0);
            }}
            style={{ width: 130 }}
          />
        </Group>
        <Pagination
          total={table.getPageCount()}
          value={table.getState().pagination.pageIndex + 1}
          onChange={(page) => table.setPageIndex(page - 1)}
          size="sm"
        />
      </Group>
    </Container>
  );
}
