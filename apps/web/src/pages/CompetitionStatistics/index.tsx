import { useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Table,
  Anchor,
  SimpleGrid,
  Paper,
  useMantineColorScheme,
  ScrollArea,
} from "@mantine/core";
import { useParams, Link } from "react-router";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCompetition, useParticipationsByCompetition, useCountries } from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { ROUTES } from "@/constants/routes";
import {
  calculateMean,
  calculateStdDev,
  calculateCorrelation,
  getCorrelationColor,
} from "@/utils/statistics";

export function CompetitionStatistics() {
  const { id } = useParams<{ id: string }>();
  const { competition, loading, error } = useCompetition(id!);
  const { participations } = useParticipationsByCompetition(id!);
  const { countries } = useCountries();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const countryMap = useEntityMap(countries);

  const stats = useMemo(() => {
    if (!competition || participations.length === 0) return null;

    const numProblems = competition.num_problems;
    const maxScore = competition.max_score_per_problem;

    const problemScores: number[][] = [];
    for (let p = 0; p < numProblems; p++) {
      problemScores[p] = participations
        .map((part) => part.problem_scores[p])
        .filter((s): s is number => s !== null);
    }

    const distributions: number[][] = [];
    for (let p = 0; p < numProblems; p++) {
      distributions[p] = Array(maxScore + 1).fill(0);
      for (const score of problemScores[p]) {
        if (score >= 0 && score <= maxScore) {
          distributions[p][score]++;
        }
      }
    }

    const means: number[] = [];
    const maxScores: number[] = [];
    const stdDevs: number[] = [];
    const correlationsWithSum: number[] = [];

    for (let p = 0; p < numProblems; p++) {
      const scores = problemScores[p];
      const mean = calculateMean(scores);
      means.push(mean);
      maxScores.push(scores.length > 0 ? Math.max(...scores) : 0);
      stdDevs.push(calculateStdDev(scores, mean));

      const validPScores: number[] = [];
      const validTotals: number[] = [];
      participations.forEach((part) => {
        const score = part.problem_scores[p];
        if (score !== null) {
          validPScores.push(score);
          validTotals.push(part.total);
        }
      });
      correlationsWithSum.push(calculateCorrelation(validPScores, validTotals));
    }

    const problemCorrelations: number[][] = [];
    for (let p1 = 0; p1 < numProblems; p1++) {
      problemCorrelations[p1] = [];
      for (let p2 = 0; p2 < numProblems; p2++) {
        if (p1 === p2) {
          problemCorrelations[p1][p2] = NaN;
        } else {
          const scores1: number[] = [];
          const scores2: number[] = [];
          participations.forEach((part) => {
            const s1 = part.problem_scores[p1];
            const s2 = part.problem_scores[p2];
            if (s1 !== null && s2 !== null) {
              scores1.push(s1);
              scores2.push(s2);
            }
          });
          problemCorrelations[p1][p2] = calculateCorrelation(scores1, scores2);
        }
      }
    }

    // Prepare chart data for each problem
    const chartData = distributions.map((dist, problemIndex) => ({
      problemIndex,
      data: dist.map((count, score) => ({ score: score.toString(), count })),
    }));

    // Compute max count across all problems for synced Y-axis
    const maxCount = Math.max(...distributions.flat());

    return {
      numProblems,
      maxScore,
      distributions,
      means,
      maxScores,
      stdDevs,
      correlationsWithSum,
      problemCorrelations,
      chartData,
      maxCount,
    };
  }, [competition, participations]);

  if (loading) {
    return (
      <Container>
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (error || !competition) {
    return (
      <Container>
        <Text c="red">Competition not found: {id}</Text>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <Text>No statistics available</Text>
      </Container>
    );
  }

  const problemHeaders = Array.from({ length: stats.numProblems }, (_, i) => `P${i + 1}`);

  return (
    <Container size="lg">
      <Title>
        {competition.source} {competition.year} - Statistics
      </Title>
      <Text c="dimmed" mb="md">
        {competition.edition && `${competition.edition}th edition - `}
        {competition.host_country_id && countryMap[competition.host_country_id]?.name}
        {" | "}
        <Anchor component={Link} to={ROUTES.COMPETITION(id!)}>
          Back to results
        </Anchor>
      </Text>

      {/* Score Distribution Charts */}
      <Title order={3} mt="xl" mb="md">
        Score Distributions
      </Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {stats.chartData.map(({ problemIndex, data }) => (
          <Paper key={problemIndex} p="md" withBorder>
            <Text fw={500} mb="sm" ta="center">
              Problem {problemIndex + 1}
            </Text>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="score"
                  interval={0}
                  tick={{ fontSize: 12, fill: isDark ? "#c1c2c5" : "#495057" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: isDark ? "#c1c2c5" : "#495057" }}
                  width={40}
                  domain={[0, stats.maxCount]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#25262b" : "#fff",
                    border: `1px solid ${isDark ? "#373a40" : "#dee2e6"}`,
                    borderRadius: 4,
                  }}
                  labelStyle={{ color: isDark ? "#c1c2c5" : "#495057" }}
                />
                <Bar dataKey="count" fill="#228be6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        ))}
      </SimpleGrid>

      {/* Distribution Statistics Table */}
      <Title order={3} mt="xl" mb="md">
        Score Distribution
      </Title>
      <ScrollArea>
        <Table striped withTableBorder withColumnBorders miw={500}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th></Table.Th>
              {problemHeaders.map((h) => (
                <Table.Th key={h} style={{ textAlign: "center" }}>
                  {h}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.from({ length: stats.maxScore + 1 }, (_, score) => (
              <Table.Tr key={`score-${score}`}>
                <Table.Td>Num( P# = {score} )</Table.Td>
                {stats.distributions.map((dist, p) => (
                  <Table.Td key={p} style={{ textAlign: "center" }}>
                    {dist[score]}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
            <Table.Tr>
              <Table.Td fw={500}>Mean( P# )</Table.Td>
              {stats.means.map((mean, p) => (
                <Table.Td key={p} style={{ textAlign: "center" }} fw={500}>
                  {mean.toFixed(3)}
                </Table.Td>
              ))}
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={500}>Max( P# )</Table.Td>
              {stats.maxScores.map((max, p) => (
                <Table.Td key={p} style={{ textAlign: "center" }} fw={500}>
                  {max}
                </Table.Td>
              ))}
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={500}>σ( P# )</Table.Td>
              {stats.stdDevs.map((std, p) => (
                <Table.Td key={p} style={{ textAlign: "center" }} fw={500}>
                  {std.toFixed(3)}
                </Table.Td>
              ))}
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Correlations Table */}
      <Title order={3} mt="xl" mb="md">
        Correlations
      </Title>
      <ScrollArea>
        <Table withTableBorder withColumnBorders miw={500}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th></Table.Th>
              {problemHeaders.map((h) => (
                <Table.Th key={h} style={{ textAlign: "center" }}>
                  {h}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={500}>Corr( P#, Sum )</Table.Td>
              {stats.correlationsWithSum.map((corr, p) => (
                <Table.Td
                  key={p}
                  style={{
                    textAlign: "center",
                    backgroundColor: getCorrelationColor(corr, isDark),
                  }}
                  fw={500}
                >
                  {corr.toFixed(3)}
                </Table.Td>
              ))}
            </Table.Tr>
            {problemHeaders.map((h, p1) => (
              <Table.Tr key={`corr-${p1}`}>
                <Table.Td fw={500}>Corr( P#, {h} )</Table.Td>
                {stats.problemCorrelations[p1].map((corr, p2) => (
                  <Table.Td
                    key={p2}
                    style={{
                      textAlign: "center",
                      backgroundColor: getCorrelationColor(corr, isDark),
                    }}
                  >
                    {p1 === p2 ? "" : corr.toFixed(3)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Container>
  );
}
