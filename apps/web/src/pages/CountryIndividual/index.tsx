import { useMemo, useState } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Anchor,
  SimpleGrid,
  Paper,
  SegmentedControl,
  Tabs,
  useMantineColorScheme,
  ScrollArea,
  Stack,
} from "@mantine/core";
import {
  LineChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useParams, Link } from "react-router";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  useCountry,
  useParticipationsByCountry,
  useParticipations,
  useCompetitions,
  usePeople,
} from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { getTableBody, getSortingIcon, generateProblemColumns } from "@/utils/table";
import { getTooltipStyle, getAxisStyle, getTooltipContentStyle } from "@/utils/chartStyles";
import { CountryFlag } from "@/utils/flags";
import {
  calculateMedalsBySource,
  calculateTeamRankOverTime,
  calculateMedalProgression,
  getAvailableSources,
} from "@/utils/countryStats";
import { ROUTES } from "@/constants/routes";
import { Award, Source } from "@/schemas/base";
import { SOURCE_OPTIONS, AWARD_COLORS } from "@/constants/filterOptions";

interface ParticipationRow {
  id: string;
  personId: string;
  personName: string;
  competitionId: string;
  competitionName: string;
  source: Source;
  year: number;
  rank: number | null;
  problemScores: (number | null)[];
  numProblems: number;
  total: number;
  award: Award | null;
}

const columnHelper = createColumnHelper<ParticipationRow>();

export function CountryIndividual() {
  const { code } = useParams<{ code: string }>();
  const countryId = `country-${code?.toLowerCase()}`;
  const { country, loading, error } = useCountry(countryId);
  const { participations } = useParticipationsByCountry(countryId);
  const { participations: allParticipations } = useParticipations();
  const { competitions } = useCompetitions();
  const { people } = usePeople();
  const [sorting, setSorting] = useState<SortingState>([{ id: "year", desc: true }]);
  const [globalSource, setGlobalSource] = useState<Source>(Source.IMO);
  const [teamRankMode, setTeamRankMode] = useState<"absolute" | "relative">("absolute");
  const [medalChartMode, setMedalChartMode] = useState<"yearly" | "cumulative">("yearly");
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const competitionMap = useEntityMap(competitions);
  const peopleMap = useEntityMap(people);

  // Get sources that this country has participated in
  const availableSources = useMemo(() => {
    const sources = getAvailableSources(participations, competitionMap);
    return SOURCE_OPTIONS.filter((opt) => sources.includes(opt.value));
  }, [participations, competitionMap]);

  // If current globalSource is not available, switch to first available
  const effectiveSource = useMemo(() => {
    if (availableSources.some((s) => s.value === globalSource)) {
      return globalSource;
    }
    return availableSources[0]?.value ?? Source.IMO;
  }, [availableSources, globalSource]);

  const stats = useMemo(() => {
    const medals = calculateMedalsBySource(participations, competitionMap, effectiveSource);
    return { medals };
  }, [participations, competitionMap, effectiveSource]);

  // Calculate team ranks over time for the selected source
  const teamRankData = useMemo(
    () => calculateTeamRankOverTime(allParticipations, competitionMap, countryId, effectiveSource),
    [allParticipations, competitionMap, countryId, effectiveSource]
  );

  // Calculate medal progression over time for the selected source
  const medalProgressionData = useMemo(
    () => calculateMedalProgression(participations, competitionMap, effectiveSource, medalChartMode),
    [participations, competitionMap, effectiveSource, medalChartMode]
  );

  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  const rows: ParticipationRow[] = useMemo(
    () =>
      participations
        .filter((p) => {
          const comp = competitionMap[p.competition_id];
          return comp?.source === effectiveSource;
        })
        .map((p) => {
          const comp = competitionMap[p.competition_id];
          const person = peopleMap[p.person_id];
          return {
            id: p.id,
            personId: p.person_id,
            personName: person?.name ?? p.person_id,
            competitionId: p.competition_id,
            competitionName: comp ? `${comp.source} ${comp.year}` : p.competition_id,
            source: comp?.source ?? Source.IMO,
            year: comp?.year ?? 0,
            rank: p.rank,
            problemScores: p.problem_scores,
            numProblems: comp?.num_problems ?? 0,
            total: p.total,
            award: p.award,
          };
        }),
    [participations, competitionMap, peopleMap, effectiveSource]
  );

  // Find max number of problems across participations for the selected source
  const maxProblems = useMemo(() => {
    return Math.max(0, ...rows.map((r) => r.numProblems));
  }, [rows]);

  const columns = useMemo(() => {
    const problemColumns = generateProblemColumns(columnHelper, maxProblems);

    return [
      columnHelper.accessor("personName", {
        header: "Contestant",
        cell: (info) => (
          <Anchor component={Link} to={ROUTES.CONTESTANT(info.row.original.personId)}>
            {info.getValue()}
          </Anchor>
        ),
      }),
      columnHelper.accessor("year", {
        header: "Year",
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
      }),
    ];
  }, [maxProblems]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!country && !loading) {
    return (
      <Container>
        <Text c="red">Country not found: {code}</Text>
      </Container>
    );
  }

  return (
    <Container>
      {country && (
        <>
          <Group gap={12} mb="xs">
            <CountryFlag code={country.code} size="xl" />
            <Title>{country.name}</Title>
          </Group>
        </>
      )}

      <Tabs value={effectiveSource} onChange={(value) => value && setGlobalSource(value as Source)} mb="xl">
        <Tabs.List>
          {availableSources.map((opt) => (
            <Tabs.Tab key={opt.value} value={opt.value} fz="lg" py="sm">
              {opt.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="xl">
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">Gold</Text>
          <Text size="xl" fw={700}>{stats.medals[Award.GOLD]}</Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">Silver</Text>
          <Text size="xl" fw={700}>{stats.medals[Award.SILVER]}</Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">Bronze</Text>
          <Text size="xl" fw={700}>{stats.medals[Award.BRONZE]}</Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">Honourable Mention</Text>
          <Text size="xl" fw={700}>{stats.medals[Award.HONOURABLE_MENTION]}</Text>
        </Paper>
      </SimpleGrid>

      <Title order={3} mb="sm">
        Team Rank Over Time
      </Title>
      <Paper p="md" withBorder mb="xl">
        <Group justify="flex-end" mb="md">
          <SegmentedControl
            size="sm"
            value={teamRankMode}
            onChange={(value) => setTeamRankMode(value as "absolute" | "relative")}
            data={[
              { label: "Absolute", value: "absolute" },
              { label: "Relative", value: "relative" },
            ]}
          />
        </Group>
        {teamRankData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={teamRankData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" {...axisStyle} />
              <YAxis
                {...axisStyle}
                reversed={teamRankMode === "absolute"}
                domain={teamRankMode === "absolute" ? [1, "auto"] : [0, 100]}
                allowDecimals={false}
                label={{
                  value: teamRankMode === "absolute" ? "Team Rank" : "Percentile (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                {...tooltipStyle}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0]?.payload;
                  if (!data || data.teamRank === null) return null;
                  return (
                    <div style={getTooltipContentStyle(isDark)}>
                      <Text size="sm" fw={600}>{effectiveSource} {label}</Text>
                      <Text size="sm">Team Rank: {data.teamRank} / {data.totalTeams}</Text>
                      <Text size="sm">Percentile: {data.percentile}%</Text>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey={teamRankMode === "absolute" ? "teamRank" : "percentile"}
                stroke="#228be6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#228be6" }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No data available for {effectiveSource}
          </Text>
        )}
      </Paper>

      <Title order={3} mb="sm">
        Medal Progression
      </Title>
      <Paper p="md" withBorder mb="xl">
        <Stack gap="md" mb="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }}>
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
              <div style={{ width: 16, height: 16, backgroundColor: "#228be6", borderRadius: 2 }} />
              <Text size="sm">HM</Text>
            </Group>
          </SimpleGrid>
          <SegmentedControl
            size="sm"
            value={medalChartMode}
            onChange={(value) => setMedalChartMode(value as "yearly" | "cumulative")}
            data={[
              { label: "Yearly", value: "yearly" },
              { label: "Cumulative", value: "cumulative" },
            ]}
            style={{ alignSelf: "flex-start" }}
          />
        </Stack>
        {medalProgressionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={medalProgressionData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" {...axisStyle} />
              <YAxis
                {...axisStyle}
                allowDecimals={false}
                label={{ value: "Medals", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                {...tooltipStyle}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  return (
                    <div style={getTooltipContentStyle(isDark)}>
                      <Text size="sm" fw={600}>{effectiveSource} {label}</Text>
                      <Text size="sm" c="yellow">Gold: {data.gold}</Text>
                      <Text size="sm" c="gray">Silver: {data.silver}</Text>
                      <Text size="sm" c="orange">Bronze: {data.bronze}</Text>
                      <Text size="sm" c="blue">HM: {data.hm}</Text>
                      <Text size="sm" fw={500} mt="xs">Total: {data.total}</Text>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="hm" stackId="1" stroke="#228be6" fill="#228be6" />
              <Area type="monotone" dataKey="bronze" stackId="1" stroke="#CD7F32" fill="#CD7F32" />
              <Area type="monotone" dataKey="silver" stackId="1" stroke="#C0C0C0" fill="#C0C0C0" />
              <Area type="monotone" dataKey="gold" stackId="1" stroke="#FFD700" fill="#FFD700" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No data available for {effectiveSource}
          </Text>
        )}
      </Paper>

      <Title order={3} mt="lg" mb="sm">
        Participations ({rows.length})
      </Title>

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
              columnCount: columns.length,
              noDataMessage: "No participations found",
              rowGroupSeparator: {
                getGroupKey: (row) => row.original.year,
                separatorStyle: { backgroundColor: isDark ? "#1a1b1e" : "#f1f3f5", height: 8 },
              },
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Container>
  );
}
