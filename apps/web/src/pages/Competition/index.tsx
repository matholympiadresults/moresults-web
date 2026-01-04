import { useMemo, useState } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Badge,
  Group,
  TextInput,
  MultiSelect,
  Anchor,
  Paper,
  useMantineColorScheme,
  Tabs,
} from "@mantine/core";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { IconSearch } from "@tabler/icons-react";
import { useParams, Link } from "react-router";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  useCompetition,
  useParticipationsByCompetition,
  useCountries,
  usePeople,
} from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { useTableSearch } from "@/hooks/useTableSearch";
import { getTableBody, getSortingIcon, generateProblemColumns, type ProblemScoreRow } from "@/utils/table";
import { getTooltipStyle, getAxisStyle } from "@/utils/chartStyles";
import { CountryFlag } from "@/utils/flags";
import { ROUTES } from "@/constants/routes";
import { Award } from "@/schemas/base";
import { AWARD_OPTIONS, AWARD_COLORS } from "@/constants/filterOptions";
import {
  calculateCountryStandings,
  calculateScoreDistribution,
  getCountryFilterOptions,
  type CountryStanding,
} from "@/utils/competitions";

interface ParticipationRow extends ProblemScoreRow {
  id: string;
  personId: string;
  personName: string;
  countryId: string;
  countryCode: string | null;
  countryName: string;
  rank: number | null;
  total: number;
  award: Award | null;
}

type CountryRow = CountryStanding;

const columnHelper = createColumnHelper<ParticipationRow>();
const countryColumnHelper = createColumnHelper<CountryRow>();

export function Competition() {
  const { id } = useParams<{ id: string }>();
  const { competition, loading, error } = useCompetition(id!);
  const { participations } = useParticipationsByCompetition(id!);
  const { countries } = useCountries();
  const { people } = usePeople();
  const [sorting, setSorting] = useState<SortingState>([{ id: "rank", desc: false }]);
  const [countrySorting, setCountrySorting] = useState<SortingState>([{ id: "rank", desc: false }]);
  const [activeTab, setActiveTab] = useState<string | null>("individual");
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const countryMap = useEntityMap(countries);
  const personMap = useEntityMap(people);

  const countryOptions = useMemo(
    () => getCountryFilterOptions(participations, countryMap),
    [participations, countryMap]
  );

  const numProblems = competition?.num_problems ?? 0;

  const rows: ParticipationRow[] = useMemo(
    () =>
      participations.map((p) => ({
        id: p.id,
        personId: p.person_id,
        personName: personMap[p.person_id]?.name ?? p.person_id,
        countryId: p.country_id,
        countryCode: countryMap[p.country_id]?.code ?? null,
        countryName: countryMap[p.country_id]?.name ?? p.country_id,
        rank: p.rank,
        problemScores: p.problem_scores,
        numProblems,
        total: p.total,
        award: p.award,
      })),
    [participations, personMap, countryMap, numProblems]
  );

  const countryRows: CountryRow[] = useMemo(
    () => calculateCountryStandings(participations, countryMap, competition?.num_problems ?? 0),
    [participations, countryMap, competition]
  );

  const scoreDistribution = useMemo(
    () => (competition ? calculateScoreDistribution(participations, competition) : []),
    [participations, competition]
  );

  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  const { fuzzySearch, createHandleSearch } = useTableSearch<ParticipationRow>(
    (row) => row.personName,
    [],
    rows
  );

  const columns = useMemo(() => {
    const problemColumns = generateProblemColumns(columnHelper, numProblems);

    return [
      columnHelper.accessor("rank", {
        header: "Rank",
        cell: (info) => info.getValue() ?? "-",
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.rank ?? 9999;
          const b = rowB.original.rank ?? 9999;
          return a - b;
        },
      }),
      columnHelper.accessor("personName", {
        header: "Name",
        cell: (info) => (
          <Anchor component={Link} to={ROUTES.CONTESTANT(info.row.original.personId)}>
            {info.getValue()}
          </Anchor>
        ),
        filterFn: fuzzySearch,
        sortingFn: (rowA, rowB, columnID) => {
          const scoreA = rowA.columnFiltersMeta[columnID];
          const scoreB = rowB.columnFiltersMeta[columnID];
          return typeof scoreA === "number" && typeof scoreB === "number"
            ? scoreA < scoreB ? -1 : 1
            : 0;
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
      ...problemColumns,
      columnHelper.accessor("total", {
        header: "Total",
      }),
      columnHelper.accessor("award", {
        header: "Award",
        cell: (info) => {
          const award = info.getValue();
          return award ? (
            <Badge color={AWARD_COLORS[award]}>{award.replace("_", " ")}</Badge>
          ) : null;
        },
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          const award = row.getValue<Award | null>(columnId);
          if (!award) return false;
          return filterValue.includes(award);
        },
      }),
    ];
  }, [fuzzySearch, numProblems]);

  const countryColumns = useMemo(() => {
    const numProblems = competition?.num_problems ?? 0;

    // Generate problem total columns dynamically
    const problemColumns = Array.from({ length: numProblems }, (_, i) =>
      countryColumnHelper.display({
        id: `p${i + 1}`,
        header: `P${i + 1}`,
        cell: (info) => info.row.original.problemTotals[i] ?? 0,
      })
    );

    return [
      countryColumnHelper.accessor("rank", {
        header: "Rank",
        cell: (info) => info.getValue(),
      }),
      countryColumnHelper.accessor("countryName", {
        header: "Country",
        cell: (info) => {
          const countryId = info.row.original.countryId;
          if (!countryId) return info.getValue();
          return (
            <Anchor component={Link} to={ROUTES.COUNTRY_INDIVIDUAL(countryId.replace("country-", ""))}>
              <Group gap={6} wrap="nowrap">
                <CountryFlag code={info.row.original.countryCode} />
                {info.getValue()}
              </Group>
            </Anchor>
          );
        },
      }),
      ...problemColumns,
      countryColumnHelper.accessor("totalScore", {
        header: "Total",
      }),
      countryColumnHelper.accessor("participants", {
        header: "Participants",
      }),
      countryColumnHelper.accessor("gold", {
        header: "Gold",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="yellow">{value}</Badge> : "-";
        },
      }),
      countryColumnHelper.accessor("silver", {
        header: "Silver",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="gray">{value}</Badge> : "-";
        },
      }),
      countryColumnHelper.accessor("bronze", {
        header: "Bronze",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="orange">{value}</Badge> : "-";
        },
      }),
      countryColumnHelper.accessor("hm", {
        header: "HM",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="blue">{value}</Badge> : "-";
        },
      }),
    ];
  }, [competition]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const countryTable = useReactTable({
    data: countryRows,
    columns: countryColumns,
    state: { sorting: countrySorting },
    onSortingChange: setCountrySorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleSearch = createHandleSearch(table, "personName");

  if (!competition && !loading) {
    return (
      <Container>
        <Text c="red">Competition not found: {id}</Text>
      </Container>
    );
  }

  return (
    <Container>
      {competition && (
        <>
          <Title>
            {competition.source} {competition.year}
          </Title>
          <Text c="dimmed" mb="md">
            {competition.edition && `${competition.edition}th edition - `}
            {competition.host_country_id &&
              countryMap[competition.host_country_id]?.name}
            {" | "}
            <Anchor component={Link} to={ROUTES.COMPETITION_STATISTICS(id!)}>
              Statistics
            </Anchor>
          </Text>
        </>
      )}

      {scoreDistribution.length > 0 && (
        <>
          <Title order={3} mt="lg" mb="sm">
            Score Distribution
          </Title>
          <Paper p="md" withBorder mb="xl">
            <Group gap="lg" mb="sm">
              <Group gap="xs">
                <div style={{ width: 16, height: 16, backgroundColor: "#FFD700", borderRadius: 2 }} />
                <Text size="sm">Gold</Text>
              </Group>
              <Group gap="xs">
                <div style={{ width: 16, height: 16, backgroundColor: "#C0C0C0", borderRadius: 2 }} />
                <Text size="sm">Silver</Text>
              </Group>
              <Group gap="xs">
                <div style={{ width: 16, height: 16, backgroundColor: "#CD7F32", borderRadius: 2 }} />
                <Text size="sm">Bronze</Text>
              </Group>
              <Group gap="xs">
                <div style={{ width: 16, height: 16, backgroundColor: "#40c057", borderRadius: 2 }} />
                <Text size="sm">HM</Text>
              </Group>
              <Group gap="xs">
                <div style={{ width: 16, height: 16, backgroundColor: "#87CEEB", borderRadius: 2 }} />
                <Text size="sm">No award</Text>
              </Group>
            </Group>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={scoreDistribution}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="score"
                  interval="equidistantPreserveStart"
                  minTickGap={1}
                  {...axisStyle}
                  label={{ value: "Points", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  {...axisStyle}
                  allowDecimals={false}
                  label={{ value: "Contestants", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      gold: "Gold",
                      silver: "Silver",
                      bronze: "Bronze",
                      hm: "HM",
                      none: "No award",
                    };
                    return [value, labels[name as string] || name];
                  }}
                  labelFormatter={(score) => `Score: ${score}`}
                />
                <Bar dataKey="none" stackId="a" fill="#87CEEB" />
                <Bar dataKey="hm" stackId="a" fill="#40c057" />
                <Bar dataKey="bronze" stackId="a" fill="#CD7F32" />
                <Bar dataKey="silver" stackId="a" fill="#C0C0C0" />
                <Bar dataKey="gold" stackId="a" fill="#FFD700" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      <Title order={3} mt="lg" mb="sm">
        Results
      </Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="individual">Individual ({participations.length})</Tabs.Tab>
          <Tabs.Tab value="country">Country ({countryRows.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="individual">
          <Group align="end" mb="md">
            <TextInput
              placeholder="Search by name..."
              leftSection={<IconSearch size={16} />}
              value={(table.getColumn("personName")?.getFilterValue() as string) ?? ""}
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
              style={{ minWidth: 200 }}
            />
            <MultiSelect
              placeholder="Filter by award"
              clearable
              data={AWARD_OPTIONS}
              value={(table.getColumn("award")?.getFilterValue() as string[]) ?? []}
              onChange={(value) => {
                table.getColumn("award")?.setFilterValue(value);
              }}
              style={{ minWidth: 180 }}
            />
          </Group>

          <Text size="sm" c="dimmed" mb="md">
            {table.getFilteredRowModel().rows.length} of {participations.length} contestants
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
        </Tabs.Panel>

        <Tabs.Panel value="country">
          <Text size="sm" c="dimmed" mb="md">
            {countryRows.length} countries
          </Text>

          <Table striped highlightOnHover>
            <Table.Thead>
              {countryTable.getHeaderGroups().map((headerGroup) => (
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
                tableRows: countryTable.getRowModel().rows,
                columnCount: countryColumns.length,
                noDataMessage: "No countries found",
              })}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
