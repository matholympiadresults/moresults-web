import { Title, Text, SimpleGrid, Paper, Group, Stack } from "@mantine/core";
import type { Country } from "@/schemas/base";
import { CountryFlag } from "@/utils/flags";
import { ComparisonLineChart } from "./ComparisonLineChart";

interface TeamSectionProps {
  country1: Country;
  country2: Country;
  filteredTeamStats1: {
    participations: number;
    bestRank: number | null;
    avgRank: number | null;
    avgScore: number | null;
  };
  filteredTeamStats2: {
    participations: number;
    bestRank: number | null;
    avgRank: number | null;
    avgScore: number | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: Record<string, any>[];
  isDark: boolean;
}

export function TeamSection({
  country1,
  country2,
  filteredTeamStats1,
  filteredTeamStats2,
  chartData,
  isDark,
}: TeamSectionProps) {
  return (
    <>
      <Title order={3} mb="md">
        Performance Summary
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
        <Paper p="md" withBorder>
          <Group gap={8} mb="sm">
            <CountryFlag code={country1.code} size="lg" />
            <Text fw={700} size="lg">
              {country1.name}
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 2, xs: 4 }}>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Participations
              </Text>
              <Text size="xl" fw={700}>
                {filteredTeamStats1.participations}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Best Rank
              </Text>
              <Text size="xl" fw={700}>
                {filteredTeamStats1.bestRank ?? "-"}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Avg Rank
              </Text>
              <Text size="xl" fw={700}>
                {filteredTeamStats1.avgRank ?? "-"}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Avg Score
              </Text>
              <Text size="xl" fw={700}>
                {filteredTeamStats1.avgScore ?? "-"}
              </Text>
            </Stack>
          </SimpleGrid>
        </Paper>
        <Paper p="md" withBorder>
          <Group gap={8} mb="sm">
            <CountryFlag code={country2.code} size="lg" />
            <Text fw={700} size="lg">
              {country2.name}
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 2, xs: 4 }}>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Participations
              </Text>
              <Text size="xl" fw={700}>
                {filteredTeamStats2.participations}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Best Rank
              </Text>
              <Text size="xl" fw={700}>
                {filteredTeamStats2.bestRank ?? "-"}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Avg Rank
              </Text>
              <Text size="xl" fw={700}>
                {filteredTeamStats2.avgRank ?? "-"}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Avg Score
              </Text>
              <Text size="xl" fw={700}>
                {filteredTeamStats2.avgScore ?? "-"}
              </Text>
            </Stack>
          </SimpleGrid>
        </Paper>
      </SimpleGrid>

      <Title order={3} mb="md">
        Performance Over Time
      </Title>

      {chartData.length > 0 ? (
        <SimpleGrid cols={1} spacing="xl">
          <Paper p="md" withBorder>
            <Title order={4} mb="md">
              Score
            </Title>
            <ComparisonLineChart
              chartData={chartData}
              dataKey1={`${country1.name} Score`}
              dataKey2={`${country2.name} Score`}
              isDark={isDark}
            />
          </Paper>

          <Paper p="md" withBorder>
            <Title order={4} mb="md">
              Team Rank
            </Title>
            <ComparisonLineChart
              chartData={chartData}
              dataKey1={`${country1.name} Team Rank`}
              dataKey2={`${country2.name} Team Rank`}
              yAxisProps={{ reversed: true, allowDecimals: false, domain: [1, "auto"] }}
              isDark={isDark}
            />
          </Paper>
        </SimpleGrid>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          No data available for this source
        </Text>
      )}
    </>
  );
}
