import { useMemo, useState } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Select,
  MultiSelect,
  NumberInput,
  Anchor,
  Paper,
  useMantineColorScheme,
  ScrollArea,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
  usePerson,
  useParticipationsByPerson,
  useParticipations,
  useCountries,
  useCompetitions,
} from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { getTableBody, getSortingIcon, sourceColors, generateProblemColumns } from "@/utils/table";
import { getTooltipStyle, getAxisStyle, getTooltipContentStyle } from "@/utils/chartStyles";
import { CountryFlag } from "@/utils/flags";
import { ROUTES } from "@/constants/routes";
import { Award, Source } from "@/schemas/base";
import { SOURCE_OPTIONS, AWARD_OPTIONS, AWARD_COLORS } from "@/constants/filterOptions";
import {
  aggregateParticipations,
  aggregateRankingChartData,
  getPersonSources,
  getMaxProblems,
  getContestantInfo,
  type ParticipationRow,
} from "./aggregation";

const columnHelper = createColumnHelper<ParticipationRow>();

export function Contestant() {
  const { id } = useParams<{ id: string }>();
  const { person, loading, error } = usePerson(id!);
  const { participations: personParticipations } = useParticipationsByPerson(id!);
  const { participations: allParticipations } = useParticipations();
  const { countries } = useCountries();
  const { competitions } = useCompetitions();
  const [sorting, setSorting] = useState<SortingState>([{ id: "year", desc: true }]);
  const [minYear, setMinYear] = useState<number | string>("");
  const [maxYear, setMaxYear] = useState<number | string>("");
  const [sourceFilter, setSourceFilter] = useState<Source | null>(null);
  const [chartSource, setChartSource] = useState<Source>(Source.IMO);

  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const countryMap = useEntityMap(countries);
  const competitionMap = useEntityMap(competitions);

  const rows: ParticipationRow[] = useMemo(
    () => aggregateParticipations({ participations: personParticipations, competitionMap }),
    [personParticipations, competitionMap]
  );

  // Find max number of problems across filtered participations (based on source filter)
  const maxProblems = useMemo(() => getMaxProblems(rows, sourceFilter), [rows, sourceFilter]);

  // Build chart data: for each year, count participants by medal type and track person's rank
  const rankingChartData = useMemo(
    () =>
      aggregateRankingChartData({
        allParticipations,
        personParticipations,
        competitionMap,
        chartSource,
      }),
    [allParticipations, personParticipations, competitionMap, chartSource]
  );

  // Check which sources the person has participated in
  const personSources = useMemo(
    () => getPersonSources({ participations: personParticipations, competitionMap }),
    [personParticipations, competitionMap]
  );

  // Get contestant display info
  const contestantInfo = useMemo(
    () => getContestantInfo({ person, countryMap }),
    [person, countryMap]
  );

  // Filter source options to only show sources the person has participated in
  const personSourceOptions = useMemo(
    () => SOURCE_OPTIONS.filter((opt) => personSources.has(opt.value)),
    [personSources]
  );

  // Set initial chart source to first source the person participated in
  const initialChartSource = personSourceOptions[0]?.value ?? Source.IMO;
  if (
    chartSource !== initialChartSource &&
    !personSources.has(chartSource) &&
    personSourceOptions.length > 0
  ) {
    setChartSource(initialChartSource);
  }

  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  const columns = useMemo(() => {
    const problemColumns = generateProblemColumns(columnHelper, maxProblems);

    return [
      columnHelper.accessor("competitionName", {
        header: "Competition",
        cell: (info) => (
          <Anchor component={Link} to={ROUTES.COMPETITION(info.row.original.competitionId)}>
            {info.getValue()}
          </Anchor>
        ),
      }),
      columnHelper.accessor("source", {
        header: "Source",
        enableHiding: true,
        filterFn: (row, columnId, filterValue: string | null) => {
          if (!filterValue) return true;
          return row.getValue(columnId) === filterValue;
        },
      }),
      columnHelper.accessor("year", {
        header: "Year",
        filterFn: (row, columnId, filterValue: { min?: number; max?: number }) => {
          if (!filterValue) return true;
          const year = row.getValue<number>(columnId);
          if (filterValue.min && year < filterValue.min) return false;
          if (filterValue.max && year > filterValue.max) return false;
          return true;
        },
      }),
      columnHelper.accessor("rank", {
        header: "Rank",
        cell: (info) => info.getValue() ?? "-",
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.rank ?? 9999;
          const b = rowB.original.rank ?? 9999;
          return a - b;
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
  }, [maxProblems]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility: { source: false },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleMinYearChange = (value: number | string) => {
    setMinYear(value);
    const currentFilter =
      (table.getColumn("year")?.getFilterValue() as { min?: number; max?: number }) ?? {};
    table.getColumn("year")?.setFilterValue({
      ...currentFilter,
      min: typeof value === "number" ? value : undefined,
    });
  };

  const handleMaxYearChange = (value: number | string) => {
    setMaxYear(value);
    const currentFilter =
      (table.getColumn("year")?.getFilterValue() as { min?: number; max?: number }) ?? {};
    table.getColumn("year")?.setFilterValue({
      ...currentFilter,
      max: typeof value === "number" ? value : undefined,
    });
  };

  if (!person && !loading) {
    return (
      <Container>
        <Text c="red">Contestant not found: {id}</Text>
      </Container>
    );
  }

  return (
    <Container>
      {contestantInfo && (
        <>
          <Title>{contestantInfo.name}</Title>
          <Group gap={8} mb="md">
            <CountryFlag code={contestantInfo.countryCode} size="md" />
            <Text c="dimmed">{contestantInfo.countryName}</Text>
          </Group>
        </>
      )}

      {rankingChartData.length > 0 && (
        <>
          <Title order={3} mt="lg" mb="sm">
            Individual Ranking
          </Title>
          <Paper p="md" withBorder mb="xl">
            <Stack gap="md" mb="md">
              <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }}>
                <Group gap="xs">
                  <div
                    style={{ width: 16, height: 16, backgroundColor: "#FFD700", borderRadius: 2 }}
                  />
                  <Text size="sm">Gold</Text>
                </Group>
                <Group gap="xs">
                  <div
                    style={{ width: 16, height: 16, backgroundColor: "#C0C0C0", borderRadius: 2 }}
                  />
                  <Text size="sm">Silver</Text>
                </Group>
                <Group gap="xs">
                  <div
                    style={{ width: 16, height: 16, backgroundColor: "#CD7F32", borderRadius: 2 }}
                  />
                  <Text size="sm">Bronze</Text>
                </Group>
                <Group gap="xs">
                  <div
                    style={{ width: 16, height: 16, backgroundColor: "#87CEEB", borderRadius: 2 }}
                  />
                  <Text size="sm">No medal</Text>
                </Group>
                <Group gap="xs">
                  <div style={{ width: 16, height: 3, backgroundColor: "#000", borderRadius: 1 }} />
                  <Text size="sm">This contestant</Text>
                </Group>
              </SimpleGrid>
              <Select
                size="sm"
                data={personSourceOptions}
                value={chartSource}
                onChange={(value) => value && setChartSource(value as Source)}
                style={{ maxWidth: 150 }}
              />
            </Stack>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={rankingChartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="year" {...axisStyle} />
                <YAxis
                  {...axisStyle}
                  allowDecimals={false}
                  label={{ value: "Position", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  {...tooltipStyle}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0]?.payload;
                    if (!data) return null;
                    return (
                      <div style={getTooltipContentStyle(isDark)}>
                        <Text size="sm" fw={600}>
                          {chartSource} {label}
                        </Text>
                        <Text size="sm">Total: {data.totalParticipants} participants</Text>
                        <Text size="sm" c="yellow">
                          Gold: {data.gold}
                        </Text>
                        <Text size="sm" c="gray">
                          Silver: {data.silver}
                        </Text>
                        <Text size="sm" c="orange">
                          Bronze: {data.bronze}
                        </Text>
                        <Text size="sm" c="cyan">
                          No medal: {data.noMedal}
                        </Text>
                        {data.personRank && (
                          <Text size="sm" fw={600} mt="xs">
                            {person?.name}: Rank {data.personRank}
                          </Text>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend content={() => null} />
                <Bar dataKey="noMedal" stackId="medals" fill="#87CEEB" name="No medal" />
                <Bar dataKey="bronze" stackId="medals" fill="#CD7F32" name="Bronze" />
                <Bar dataKey="silver" stackId="medals" fill="#C0C0C0" name="Silver" />
                <Bar
                  dataKey="gold"
                  stackId="medals"
                  fill="#FFD700"
                  name="Gold"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="personPosition"
                  stroke="#000"
                  strokeWidth={2}
                  dot={{ r: 5, fill: "#000", stroke: "#fff", strokeWidth: 2 }}
                  connectNulls={false}
                  name="This contestant"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      <Title order={3} mt="lg" mb="sm">
        Participations ({table.getFilteredRowModel().rows.length} of {personParticipations.length})
      </Title>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
        <Select
          placeholder="Filter by source"
          clearable
          data={SOURCE_OPTIONS}
          value={sourceFilter}
          onChange={(value) => {
            setSourceFilter(value as Source | null);
            table.getColumn("source")?.setFilterValue(value);
          }}
        />
        <NumberInput
          placeholder="Min year"
          value={minYear}
          onChange={handleMinYearChange}
          min={1959}
          max={2030}
        />
        <NumberInput
          placeholder="Max year"
          value={maxYear}
          onChange={handleMaxYearChange}
          min={1959}
          max={2030}
        />
        <MultiSelect
          placeholder="Filter by award"
          clearable
          data={AWARD_OPTIONS}
          value={(table.getColumn("award")?.getFilterValue() as string[]) ?? []}
          onChange={(value) => {
            table.getColumn("award")?.setFilterValue(value);
          }}
        />
      </SimpleGrid>

      <ScrollArea>
        <Table striped highlightOnHover miw={700}>
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
              columnCount: table.getVisibleLeafColumns().length,
              noDataMessage: "No participations found",
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
