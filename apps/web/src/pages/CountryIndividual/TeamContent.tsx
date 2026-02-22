import { useState } from "react";
import {
  Title,
  Text,
  Table,
  SimpleGrid,
  Paper,
  SegmentedControl,
  Group,
  ScrollArea,
} from "@mantine/core";
import {
  LineChart,
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
import type { Source } from "@/schemas/base";
import type { TeamRankData, TeamScoreOverTimeData } from "@/utils/countryStats";

interface TeamContentProps {
  teamStats: {
    participations: number;
    bestRank: number | null;
    avgRank: number | null;
    avgScore: number | null;
  };
  teamRankData: TeamRankData[];
  teamScoreData: TeamScoreOverTimeData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamTable: TanstackTable<any>;
  columnCount: number;
  teamRowCount: number;
  effectiveSource: Source;
  loading: boolean;
  error: Error | null;
  isDark: boolean;
}

export function TeamContent({
  teamStats,
  teamRankData,
  teamScoreData,
  teamTable,
  columnCount,
  teamRowCount,
  effectiveSource,
  loading,
  error,
  isDark,
}: TeamContentProps) {
  const [teamRankMode, setTeamRankMode] = useState<"absolute" | "relative">("absolute");
  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  return (
    <>
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mb="xl">
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">
            Participations
          </Text>
          <Text size="xl" fw={700}>
            {teamStats.participations}
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">
            Best Rank
          </Text>
          <Text size="xl" fw={700}>
            {teamStats.bestRank ?? "-"}
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">
            Average Rank
          </Text>
          <Text size="xl" fw={700}>
            {teamStats.avgRank ?? "-"}
          </Text>
        </Paper>
        <Paper p="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase">
            Average Score
          </Text>
          <Text size="xl" fw={700}>
            {teamStats.avgScore ?? "-"}
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
        Score Over Time
      </Title>
      <Paper p="md" withBorder mb="xl">
        {teamScoreData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={teamScoreData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" {...axisStyle} />
              <YAxis
                {...axisStyle}
                allowDecimals={false}
                label={{ value: "Total Score", angle: -90, position: "insideLeft" }}
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
                      <Text size="sm">Score: {data.total}</Text>
                      {data.rank !== null && <Text size="sm">Rank: {data.rank}</Text>}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#228be6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#228be6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            No data available for {effectiveSource}
          </Text>
        )}
      </Paper>

      <Title order={3} mt="lg" mb="sm">
        Participations ({teamRowCount})
      </Title>

      <ScrollArea>
        <Table striped highlightOnHover miw={700}>
          <Table.Thead>{getTableHead(teamTable.getHeaderGroups())}</Table.Thead>
          <Table.Tbody>
            {getTableBody({
              isLoading: loading,
              error,
              tableRows: teamTable.getRowModel().rows,
              columnCount,
              noDataMessage: "No participations found",
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
