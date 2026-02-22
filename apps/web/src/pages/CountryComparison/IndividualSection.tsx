import { Title, Text, SimpleGrid, Paper, Group, Stack } from "@mantine/core";
import type { Country } from "@/schemas/base";
import { CountryFlag } from "@/utils/flags";
import { ComparisonLineChart } from "./ComparisonLineChart";

interface FilteredStats {
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  total: number;
}

interface IndividualSectionProps {
  country1: Country;
  country2: Country;
  filteredStats1: FilteredStats;
  filteredStats2: FilteredStats;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData: Record<string, any>[];
  isDark: boolean;
}

export function IndividualSection({
  country1,
  country2,
  filteredStats1,
  filteredStats2,
  chartData,
  isDark,
}: IndividualSectionProps) {
  return (
    <>
      <Title order={3} mb="md">
        Medal Summary
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
        <Paper p="md" withBorder>
          <Group gap={8} mb="sm">
            <CountryFlag code={country1.code} size="lg" />
            <Text fw={700} size="lg">
              {country1.name}
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 3, xs: 5 }}>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Gold
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats1.gold}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Silver
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats1.silver}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Bronze
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats1.bronze}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                HM
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats1.hm}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Participations
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats1.total}
              </Text>
            </Stack>
          </SimpleGrid>
          <Text size="sm" c="dimmed" mt="sm">
            {filteredStats1.total > 0
              ? `${(((filteredStats1.gold + filteredStats1.silver + filteredStats1.bronze) / filteredStats1.total) * 100).toFixed(1)}% medal rate`
              : "No participations"}
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Group gap={8} mb="sm">
            <CountryFlag code={country2.code} size="lg" />
            <Text fw={700} size="lg">
              {country2.name}
            </Text>
          </Group>
          <SimpleGrid cols={{ base: 3, xs: 5 }}>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Gold
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats2.gold}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Silver
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats2.silver}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Bronze
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats2.bronze}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                HM
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats2.hm}
              </Text>
            </Stack>
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Participations
              </Text>
              <Text size="xl" fw={700}>
                {filteredStats2.total}
              </Text>
            </Stack>
          </SimpleGrid>
          <Text size="sm" c="dimmed" mt="sm">
            {filteredStats2.total > 0
              ? `${(((filteredStats2.gold + filteredStats2.silver + filteredStats2.bronze) / filteredStats2.total) * 100).toFixed(1)}% medal rate`
              : "No participations"}
          </Text>
        </Paper>
      </SimpleGrid>

      <Title order={3} mb="md">
        Performance Over Time
      </Title>

      {chartData.length > 0 ? (
        <SimpleGrid cols={1} spacing="xl">
          <Paper p="md" withBorder>
            <Title order={4} mb="md">
              Medals
            </Title>
            <ComparisonLineChart
              chartData={chartData}
              dataKey1={`${country1.name} Medals`}
              dataKey2={`${country2.name} Medals`}
              yAxisProps={{ allowDecimals: false }}
              isDark={isDark}
            />
          </Paper>

          <Paper p="md" withBorder>
            <Title order={4} mb="md">
              Average Score
            </Title>
            <ComparisonLineChart
              chartData={chartData}
              dataKey1={`${country1.name} Avg Score`}
              dataKey2={`${country2.name} Avg Score`}
              isDark={isDark}
            />
          </Paper>

          <Paper p="md" withBorder>
            <Title order={4} mb="md">
              Total Points
            </Title>
            <ComparisonLineChart
              chartData={chartData}
              dataKey1={`${country1.name} Total Pts`}
              dataKey2={`${country2.name} Total Pts`}
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
