import { useMemo, useState } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Anchor,
  Group,
  Select,
  Pagination,
  Badge,
} from "@mantine/core";
import { Link } from "react-router";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { usePeople, useParticipations, useCompetitions, useCountries } from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { getTableBody, getSortingIcon } from "@/utils/table";
import { CountryFlag } from "@/utils/flags";
import { ROUTES } from "@/constants/routes";
import { SOURCE_OPTIONS_WITH_ALL } from "@/constants/filterOptions";
import { aggregateHallOfFame, type HallOfFameRow } from "./aggregation";

const columnHelper = createColumnHelper<HallOfFameRow>();

const PAGE_SIZE_OPTIONS = [
  { value: "25", label: "25 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
];

export function HallOfFame() {
  const { people, loading, error } = usePeople();
  const { participations } = useParticipations();
  const { competitions } = useCompetitions();
  const { countries } = useCountries();
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const countryMap = useEntityMap(countries);
  const competitionMap = useEntityMap(competitions);
  const personMap = useEntityMap(people);

  const countryOptions = useMemo(
    () => [
      { value: "all", label: "All Countries" },
      ...countries
        .filter((c) => c.id)
        .map((c) => ({ value: c.id, label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ],
    [countries]
  );

  const rows: HallOfFameRow[] = useMemo(
    () =>
      aggregateHallOfFame({
        participations,
        competitionMap,
        personMap,
        countryMap,
        selectedSource,
        selectedCountry,
      }),
    [participations, competitionMap, personMap, countryMap, selectedSource, selectedCountry]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("rank", {
        header: "#",
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor("personName", {
        header: "Name",
        cell: (info) => (
          <Anchor component={Link} to={ROUTES.CONTESTANT(info.row.original.personId)}>
            {info.getValue()}
          </Anchor>
        ),
      }),
      columnHelper.accessor("countryName", {
        header: "Country",
        cell: (info) => (
          <Group gap={6} wrap="nowrap">
            <CountryFlag code={info.row.original.countryCode} />
            {info.getValue()}
          </Group>
        ),
      }),
      columnHelper.accessor("gold", {
        header: "Gold",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="yellow">{value}</Badge> : "-";
        },
      }),
      columnHelper.accessor("silver", {
        header: "Silver",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="gray">{value}</Badge> : "-";
        },
      }),
      columnHelper.accessor("bronze", {
        header: "Bronze",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="orange">{value}</Badge> : "-";
        },
      }),
      columnHelper.accessor("hm", {
        header: "HM",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="blue">{value}</Badge> : "-";
        },
      }),
      columnHelper.accessor("totalMedals", {
        header: "Total",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("participations", {
        header: "Participations",
        cell: (info) => info.getValue(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const handleSourceChange = (value: string | null) => {
    setSelectedSource(value ?? "all");
    setPagination({ ...pagination, pageIndex: 0 });
  };

  const handleCountryChange = (value: string | null) => {
    setSelectedCountry(value ?? "all");
    setPagination({ ...pagination, pageIndex: 0 });
  };

  return (
    <Container>
      <Title>Hall of Fame</Title>
      <Text c="dimmed" mb="md">
        Top contestants ranked by medals (gold, then silver, then bronze)
      </Text>

      <Group align="end" mb="md">
        <Select
          label="Competition"
          data={SOURCE_OPTIONS_WITH_ALL}
          value={selectedSource}
          onChange={handleSourceChange}
          style={{ minWidth: 180 }}
        />
        <Select
          label="Country"
          placeholder="All Countries"
          data={countryOptions}
          value={selectedCountry}
          onChange={handleCountryChange}
          searchable
          clearable
          style={{ minWidth: 200 }}
        />
      </Group>

      <Text size="sm" c="dimmed" mb="md">
        {rows.length} contestants with medals
      </Text>

      <Table striped highlightOnHover>
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

      <Group justify="space-between" mt="md">
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            Showing {table.getRowModel().rows.length} of {rows.length}
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
