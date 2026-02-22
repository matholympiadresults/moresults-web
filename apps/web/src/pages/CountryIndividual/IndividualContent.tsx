import { useState } from "react";
import {
  Title,
  Text,
  Table,
  SimpleGrid,
  Paper,
  SegmentedControl,
  Group,
  Stack,
  ScrollArea,
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
import type { Table as TanstackTable } from "@tanstack/react-table";
import { getTableBody, getTableHead } from "@/utils/table";
import { getTooltipStyle, getAxisStyle, getTooltipContentStyle } from "@/utils/chartStyles";
import { Award } from "@/schemas/base";
import type { Source } from "@/schemas/base";
import type { MedalCounts, TeamRankData, YearlyMedalData } from "@/utils/countryStats";

interface IndividualContentProps {
  medals: MedalCounts;
  teamRankData: TeamRankData[];
  medalProgressionData: YearlyMedalData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: TanstackTable<any>;
  columnCount: number;
  rowCount: number;
  effectiveSource: Source;
  loading: boolean;
  error: Error | null;
  isDark: boolean;
}

export function IndividualContent({
  medals,
  teamRankData,
  medalProgressionData,
  table,
  columnCount,
  rowCount,
  effectiveSource,
  loading,
  error,
  isDark,
}: IndividualContentProps) {
  const [teamRankMode, setTeamRankMode] = useState<"absolute" | "relative">("absolute");
  const [medalChartMode, setMedalChartMode] = useState<"yearly" | "cumulative">("yearly");
  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="xl">
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">
            Gold
          </Text>
          <Text size="xl" fw={700}>
            {medals[Award.GOLD]}
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">
            Silver
          </Text>
          <Text size="xl" fw={700}>
            {medals[Award.SILVER]}
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">
            Bronze
          </Text>
          <Text size="xl" fw={700}>
            {medals[Award.BRONZE]}
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">
            Honourable Mention
          </Text>
          <Text size="xl" fw={700}>
            {medals[Award.HONOURABLE_MENTION]}
          </Text>
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
            <LineChart data={teamRankData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
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
                      <Text size="sm" fw={600}>
                        {effectiveSource} {label}
                      </Text>
                      <Text size="sm">
                        Team Rank: {data.teamRank} / {data.totalTeams}
                      </Text>
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
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: "#FFD700",
                  borderRadius: 2,
                }}
              />
              <Text size="sm">Gold</Text>
            </Group>
            <Group gap="xs">
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: "#C0C0C0",
                  borderRadius: 2,
                }}
              />
              <Text size="sm">Silver</Text>
            </Group>
            <Group gap="xs">
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: "#CD7F32",
                  borderRadius: 2,
                }}
              />
              <Text size="sm">Bronze</Text>
            </Group>
            <Group gap="xs">
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: "#228be6",
                  borderRadius: 2,
                }}
              />
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
                      <Text size="sm" fw={600}>
                        {effectiveSource} {label}
                      </Text>
                      <Text size="sm" c="yellow">
                        Gold: {data.gold}
                      </Text>
                      <Text size="sm" c="gray">
                        Silver: {data.silver}
                      </Text>
                      <Text size="sm" c="orange">
                        Bronze: {data.bronze}
                      </Text>
                      <Text size="sm" c="blue">
                        HM: {data.hm}
                      </Text>
                      <Text size="sm" fw={500} mt="xs">
                        Total: {data.total}
                      </Text>
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
        Participations ({rowCount})
      </Title>

      <ScrollArea>
        <Table striped highlightOnHover miw={700}>
          <Table.Thead>{getTableHead(table.getHeaderGroups())}</Table.Thead>
          <Table.Tbody>
            {getTableBody({
              isLoading: loading,
              error,
              tableRows: table.getRowModel().rows,
              columnCount,
              noDataMessage: "No participations found",
              rowGroupSeparator: {
                getGroupKey: (row) => row.original.year,
                separatorStyle: {
                  backgroundColor: isDark ? "#1a1b1e" : "#f1f3f5",
                  height: 8,
                },
              },
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
