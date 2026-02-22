import { Title, Table, Paper, ScrollArea } from "@mantine/core";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Table as TanstackTable } from "@tanstack/react-table";
import { getTableBody, getTableHead, getTableMinWidth } from "@/utils/table";
import { getTooltipStyle, getAxisStyle } from "@/utils/chartStyles";

interface TeamContentProps {
  teamScoreDistribution: { score: number; count: number }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamTable: TanstackTable<any>;
  columnCount: number;
  numProblems: number;
  teamCount: number;
  loading: boolean;
  error: Error | null;
  isDark: boolean;
}

export function TeamContent({
  teamScoreDistribution,
  teamTable,
  columnCount,
  numProblems,
  teamCount,
  loading,
  error,
  isDark,
}: TeamContentProps) {
  const tooltipStyle = getTooltipStyle(isDark);
  const axisStyle = getAxisStyle(isDark);

  return (
    <>
      {teamScoreDistribution.length > 0 && (
        <>
          <Title order={3} mt="lg" mb="sm">
            Score Distribution
          </Title>
          <Paper p="md" withBorder mb="xl">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={teamScoreDistribution}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="score"
                  interval="preserveStartEnd"
                  {...axisStyle}
                  label={{ value: "Points", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  {...axisStyle}
                  allowDecimals={false}
                  label={{ value: "Teams", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [value, "Teams"]}
                  labelFormatter={(score) => `Score: ${score}`}
                />
                <Bar dataKey="count" fill="#228be6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      <Title order={3} mt="lg" mb="sm">
        Results ({teamCount} teams)
      </Title>

      <ScrollArea>
        <Table
          striped
          highlightOnHover
          miw={getTableMinWidth(numProblems)}
          fz={numProblems > 10 ? "sm" : undefined}
        >
          <Table.Thead>{getTableHead(teamTable.getHeaderGroups())}</Table.Thead>
          <Table.Tbody>
            {getTableBody({
              isLoading: loading,
              error,
              tableRows: teamTable.getRowModel().rows,
              columnCount,
              noDataMessage: "No teams found",
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </>
  );
}
