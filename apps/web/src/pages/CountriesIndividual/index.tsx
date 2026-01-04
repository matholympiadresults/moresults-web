import { useMemo, useState } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Anchor,
  Group,
  TextInput,
  Pagination,
  Select,
  ScrollArea,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { Link } from "react-router";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { useCountries, useParticipations } from "@/hooks/api";
import { useTableSearch } from "@/hooks/useTableSearch";
import { getTableBody, getSortingIcon } from "@/utils/table";
import { CountryFlag } from "@/utils/flags";
import { buildCountryRows, type CountryRow } from "@/utils/countryStats";
import { ROUTES } from "@/constants/routes";

const columnHelper = createColumnHelper<CountryRow>();

const PAGE_SIZE_OPTIONS = [
  { value: "25", label: "25 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
];

export function CountriesIndividual() {
  const { countries, loading, error } = useCountries();
  const { participations } = useParticipations();
  const [sorting, setSorting] = useState<SortingState>([{ id: "totalMedals", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const rows: CountryRow[] = useMemo(
    () => buildCountryRows(countries, participations),
    [countries, participations]
  );

  const { fuzzySearch, createHandleSearch } = useTableSearch<CountryRow>(
    (row) => row.name,
    [],
    rows
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Country",
        cell: (info) => (
          <Anchor component={Link} to={ROUTES.COUNTRY_INDIVIDUAL(info.row.original.code)}>
            <Group gap={6} wrap="nowrap">
              <CountryFlag code={info.row.original.code} />
              {info.getValue()}
            </Group>
          </Anchor>
        ),
        filterFn: fuzzySearch,
        sortingFn: (rowA, rowB, columnID) => {
          const scoreA = rowA.columnFiltersMeta[columnID];
          const scoreB = rowB.columnFiltersMeta[columnID];
          return typeof scoreA === "number" && typeof scoreB === "number"
            ? scoreA < scoreB
              ? -1
              : 1
            : 0;
        },
      }),
      columnHelper.accessor("participations", {
        header: "Participations",
      }),
      columnHelper.accessor("gold", {
        header: "Gold",
      }),
      columnHelper.accessor("silver", {
        header: "Silver",
      }),
      columnHelper.accessor("bronze", {
        header: "Bronze",
      }),
      columnHelper.accessor("hm", {
        header: "HM",
      }),
      columnHelper.accessor("totalMedals", {
        header: "Total Medals",
      }),
    ],
    [fuzzySearch]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const handleSearch = createHandleSearch(table, "name");

  return (
    <Container>
      <Title>Countries (Individual)</Title>
      <Text c="dimmed" mb="md">
        {table.getFilteredRowModel().rows.length === countries.length
          ? `${countries.length} countries`
          : `${table.getFilteredRowModel().rows.length} of ${countries.length} countries`}
      </Text>

      <Group align="end" mb="md">
        <TextInput
          placeholder="Search by name..."
          leftSection={<IconSearch size={16} />}
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={handleSearch}
        />
      </Group>

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
              noDataMessage: "No countries found",
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
            value={String(pagination.pageSize)}
            onChange={(value) => {
              table.setPageSize(Number(value));
              table.setPageIndex(0);
            }}
            style={{ width: 130 }}
          />
        </Group>
        <Pagination
          total={table.getPageCount()}
          value={pagination.pageIndex + 1}
          onChange={(page) => table.setPageIndex(page - 1)}
          size="sm"
        />
      </Group>
    </Container>
  );
}
