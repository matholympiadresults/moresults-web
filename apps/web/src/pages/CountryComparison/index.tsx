import { useMemo, useState } from "react";
import {
  Container,
  Title,
  Text,
  Select,
  SimpleGrid,
  Paper,
  Group,
  Stack,
  Tabs,
  useMantineColorScheme,
} from "@mantine/core";
import { useSearchParams } from "react-router";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  useCountries,
  useParticipations,
  useCompetitions,
} from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { CountryFlag } from "@/utils/flags";
import { getTooltipStyle, getAxisStyle } from "@/utils/chartStyles";
import { Source } from "@/schemas/base";
import { SOURCE_OPTIONS } from "@/constants/filterOptions";
import {
  calculateStats,
  filterStatsBySource,
  calculateTeamRanks,
  getAvailableSources,
} from "./calculateStats";

export function CountryComparison() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { countries } = useCountries();
  const { participations } = useParticipations();
  const { competitions } = useCompetitions();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const [selectedSource, setSelectedSource] = useState<Source>(Source.IMO);

  const country1Code = searchParams.get("c1");
  const country2Code = searchParams.get("c2");

  const countryOptions = useMemo(
    () =>
      countries
        .filter((c) => c.code)
        .map((c) => ({ value: c.code.toLowerCase(), label: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries]
  );

  const competitionMap = useEntityMap(competitions);

  const country1 = useMemo(
    () => countries.find((c) => c.code.toLowerCase() === country1Code),
    [countries, country1Code]
  );

  const country2 = useMemo(
    () => countries.find((c) => c.code.toLowerCase() === country2Code),
    [countries, country2Code]
  );

  const stats1 = useMemo(
    () => (country1 ? calculateStats(participations, competitionMap, country1.id) : null),
    [participations, competitionMap, country1]
  );

  const stats2 = useMemo(
    () => (country2 ? calculateStats(participations, competitionMap, country2.id) : null),
    [participations, competitionMap, country2]
  );

  // Get sources where both countries have participated (intersection)
  const availableSources = useMemo(
    () => getAvailableSources(stats1, stats2, SOURCE_OPTIONS),
    [stats1, stats2]
  );

  // If current selectedSource is not available, use first available
  const effectiveSource = useMemo(() => {
    if (availableSources.some((s) => s.value === selectedSource)) {
      return selectedSource;
    }
    return availableSources[0]?.value ?? Source.IMO;
  }, [availableSources, selectedSource]);

  // Calculate stats filtered by selected source
  const filteredStats1 = useMemo(
    () => filterStatsBySource(stats1, effectiveSource),
    [stats1, effectiveSource]
  );

  const filteredStats2 = useMemo(
    () => filterStatsBySource(stats2, effectiveSource),
    [stats2, effectiveSource]
  );

  // Calculate team ranks per competition
  const teamRanks = useMemo(
    () => calculateTeamRanks(participations, competitionMap),
    [participations, competitionMap]
  );

  // Filter stats by selected source and build chart data
  const chartData = useMemo(() => {
    if (!stats1 || !stats2 || !country1 || !country2) return [];

    const allYears = new Set<number>();
    stats1.byYearAndSource.forEach((_, key) => {
      const [year, source] = key.split("-");
      if (source === effectiveSource) allYears.add(parseInt(year));
    });
    stats2.byYearAndSource.forEach((_, key) => {
      const [year, source] = key.split("-");
      if (source === effectiveSource) allYears.add(parseInt(year));
    });

    return Array.from(allYears)
      .sort((a, b) => a - b)
      .map((year) => {
        const key = `${year}-${effectiveSource}`;
        const s1 = stats1.byYearAndSource.get(key);
        const s2 = stats2.byYearAndSource.get(key);

        const s1Medals = s1 ? s1.gold + s1.silver + s1.bronze : 0;
        const s2Medals = s2 ? s2.gold + s2.silver + s2.bronze : 0;

        const ranks = teamRanks.get(key);
        const c1Rank = ranks?.get(country1.id) ?? null;
        const c2Rank = ranks?.get(country2.id) ?? null;

        return {
          year,
          [`${country1.name} Medals`]: s1Medals,
          [`${country2.name} Medals`]: s2Medals,
          [`${country1.name} Avg Score`]: s1 && s1.participants > 0
            ? parseFloat((s1.totalScore / s1.participants).toFixed(1))
            : null,
          [`${country2.name} Avg Score`]: s2 && s2.participants > 0
            ? parseFloat((s2.totalScore / s2.participants).toFixed(1))
            : null,
          [`${country1.name} Total Pts`]: s1?.totalScore ?? null,
          [`${country2.name} Total Pts`]: s2?.totalScore ?? null,
          [`${country1.name} Team Rank`]: c1Rank,
          [`${country2.name} Team Rank`]: c2Rank,
        };
      });
  }, [stats1, stats2, country1, country2, effectiveSource, teamRanks]);

  const handleCountry1Change = (value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("c1", value);
    } else {
      params.delete("c1");
    }
    setSearchParams(params);
  };

  const handleCountry2Change = (value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("c2", value);
    } else {
      params.delete("c2");
    }
    setSearchParams(params);
  };

  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  return (
    <Container size="lg">
      <Title>Compare Countries</Title>
      <Text c="dimmed" mb="lg">
        Compare olympiad performance between two countries
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
        <Select
          label="Country 1"
          placeholder="Select a country"
          searchable
          clearable
          data={countryOptions}
          value={country1Code}
          onChange={handleCountry1Change}
        />
        <Select
          label="Country 2"
          placeholder="Select a country"
          searchable
          clearable
          data={countryOptions}
          value={country2Code}
          onChange={handleCountry2Change}
        />
      </SimpleGrid>

      {country1 && country2 && stats1 && stats2 && availableSources.length > 0 && (
        <>
          <Tabs value={effectiveSource} onChange={(value) => value && setSelectedSource(value as Source)} mb="xl">
            <Tabs.List>
              {availableSources.map((opt) => (
                <Tabs.Tab key={opt.value} value={opt.value} fz="lg" py="sm">
                  {opt.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>

          <Title order={3} mb="md">Medal Summary</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
            <Paper p="md" withBorder>
              <Group gap={8} mb="sm">
                <CountryFlag code={country1.code} size="lg" />
                <Text fw={700} size="lg">{country1.name}</Text>
              </Group>
              <SimpleGrid cols={{ base: 3, xs: 5 }}>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">Gold</Text>
                  <Text size="xl" fw={700}>{filteredStats1.gold}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">Silver</Text>
                  <Text size="xl" fw={700}>{filteredStats1.silver}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">Bronze</Text>
                  <Text size="xl" fw={700}>{filteredStats1.bronze}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">HM</Text>
                  <Text size="xl" fw={700}>{filteredStats1.hm}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">Participations</Text>
                  <Text size="xl" fw={700}>{filteredStats1.total}</Text>
                </Stack>
              </SimpleGrid>
              <Text size="sm" c="dimmed" mt="sm">
                {filteredStats1.total > 0
                  ? `${((filteredStats1.gold + filteredStats1.silver + filteredStats1.bronze) / filteredStats1.total * 100).toFixed(1)}% medal rate`
                  : "No participations"}
              </Text>
            </Paper>
            <Paper p="md" withBorder>
              <Group gap={8} mb="sm">
                <CountryFlag code={country2.code} size="lg" />
                <Text fw={700} size="lg">{country2.name}</Text>
              </Group>
              <SimpleGrid cols={{ base: 3, xs: 5 }}>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">Gold</Text>
                  <Text size="xl" fw={700}>{filteredStats2.gold}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">Silver</Text>
                  <Text size="xl" fw={700}>{filteredStats2.silver}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">Bronze</Text>
                  <Text size="xl" fw={700}>{filteredStats2.bronze}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">HM</Text>
                  <Text size="xl" fw={700}>{filteredStats2.hm}</Text>
                </Stack>
                <Stack gap={0}>
                  <Text size="xs" c="dimmed" tt="uppercase">Participations</Text>
                  <Text size="xl" fw={700}>{filteredStats2.total}</Text>
                </Stack>
              </SimpleGrid>
              <Text size="sm" c="dimmed" mt="sm">
                {filteredStats2.total > 0
                  ? `${((filteredStats2.gold + filteredStats2.silver + filteredStats2.bronze) / filteredStats2.total * 100).toFixed(1)}% medal rate`
                  : "No participations"}
              </Text>
            </Paper>
          </SimpleGrid>

          <Title order={3} mb="md">Performance Over Time</Title>

          {chartData.length > 0 ? (
                <SimpleGrid cols={1} spacing="xl">
                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Medals</Title>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" {...axisStyle} />
                        <YAxis {...axisStyle} allowDecimals={false} />
                        <Tooltip {...tooltipStyle} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={`${country1.name} Medals`}
                          stroke="#228be6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey={`${country2.name} Medals`}
                          stroke="#fa5252"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Average Score</Title>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" {...axisStyle} />
                        <YAxis {...axisStyle} />
                        <Tooltip {...tooltipStyle} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={`${country1.name} Avg Score`}
                          stroke="#228be6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey={`${country2.name} Avg Score`}
                          stroke="#fa5252"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Total Points</Title>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" {...axisStyle} />
                        <YAxis {...axisStyle} />
                        <Tooltip {...tooltipStyle} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={`${country1.name} Total Pts`}
                          stroke="#228be6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey={`${country2.name} Total Pts`}
                          stroke="#fa5252"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>

                  <Paper p="md" withBorder>
                    <Title order={4} mb="md">Team Rank</Title>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="year" {...axisStyle} />
                        <YAxis {...axisStyle} reversed allowDecimals={false} domain={[1, 'auto']} />
                        <Tooltip {...tooltipStyle} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={`${country1.name} Team Rank`}
                          stroke="#228be6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey={`${country2.name} Team Rank`}
                          stroke="#fa5252"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                </SimpleGrid>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  No data available for {selectedSource}
                </Text>
              )}
        </>
      )}

      {country1 && country2 && stats1 && stats2 && availableSources.length === 0 && (
        <Paper p="xl" withBorder>
          <Text c="dimmed" ta="center">
            No common competitions found between these countries
          </Text>
        </Paper>
      )}

      {(!country1 || !country2) && (
        <Paper p="xl" withBorder>
          <Text c="dimmed" ta="center">
            Select two countries above to compare their olympiad performance
          </Text>
        </Paper>
      )}
    </Container>
  );
}
