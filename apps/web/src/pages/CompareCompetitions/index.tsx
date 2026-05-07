import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Container,
  Title,
  Text,
  Select,
  SimpleGrid,
  Paper,
  Tabs,
  useMantineColorScheme,
} from "@mantine/core";
import { useSearchParams } from "react-router";
import { useCompetitions, useParticipations, usePeople } from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { pageTitle } from "@/constants/seo";
import { isTeamCompetition } from "@/schemas/base";
import type { Competition, Participation } from "@/schemas/base";
import { ComparisonScatterChart, type ScatterPoint } from "./ComparisonScatterChart";

function formatCompetitionLabel(c: Competition): string {
  return `${c.source} ${c.year}`;
}

function buildScatterPoints(
  participationsA: Participation[],
  participationsB: Participation[],
  personNameById: Record<string, string>,
  mode: "points" | "percentile"
): ScatterPoint[] {
  const totalA = participationsA.length;
  const totalB = participationsB.length;

  const byPersonA = new Map<string, Participation>();
  for (const p of participationsA) byPersonA.set(p.person_id, p);

  const points: ScatterPoint[] = [];
  for (const pB of participationsB) {
    const pA = byPersonA.get(pB.person_id);
    if (!pA) continue;

    if (mode === "points") {
      points.push({
        x: pA.total,
        y: pB.total,
        name: personNameById[pB.person_id] ?? pB.person_id,
      });
    } else {
      if (pA.rank === null || pB.rank === null) continue;
      if (totalA === 0 || totalB === 0) continue;
      points.push({
        x: (pA.rank / totalA) * 100,
        y: (pB.rank / totalB) * 100,
        name: personNameById[pB.person_id] ?? pB.person_id,
      });
    }
  }
  return points;
}

export function CompareCompetitions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { competitions } = useCompetitions();
  const { participations } = useParticipations();
  const { people } = usePeople();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const compAId = searchParams.get("a");
  const compBId = searchParams.get("b");

  const competitionMap = useEntityMap(competitions);
  const personMap = useEntityMap(people);

  const personNameById = useMemo(() => {
    const out: Record<string, string> = {};
    for (const id in personMap) out[id] = personMap[id].name;
    return out;
  }, [personMap]);

  const competitionOptions = useMemo(
    () =>
      competitions
        .filter((c) => !isTeamCompetition(c.source))
        .slice()
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return a.source.localeCompare(b.source);
        })
        .map((c) => ({
          value: c.id,
          label: formatCompetitionLabel(c),
        })),
    [competitions]
  );

  const compA = compAId ? (competitionMap[compAId] ?? null) : null;
  const compB = compBId ? (competitionMap[compBId] ?? null) : null;

  const participationsA = useMemo(
    () => (compA ? participations.filter((p) => p.competition_id === compA.id) : []),
    [participations, compA]
  );

  const participationsB = useMemo(
    () => (compB ? participations.filter((p) => p.competition_id === compB.id) : []),
    [participations, compB]
  );

  const pointsData = useMemo(
    () =>
      compA && compB
        ? buildScatterPoints(participationsA, participationsB, personNameById, "points")
        : [],
    [compA, compB, participationsA, participationsB, personNameById]
  );

  const percentileData = useMemo(
    () =>
      compA && compB
        ? buildScatterPoints(participationsA, participationsB, personNameById, "percentile")
        : [],
    [compA, compB, participationsA, participationsB, personNameById]
  );

  const handleSelect = (key: "a" | "b", value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const titleText =
    compA && compB
      ? pageTitle(`${formatCompetitionLabel(compA)} vs ${formatCompetitionLabel(compB)}`)
      : pageTitle("Compare Competitions");

  const labelA = compA ? formatCompetitionLabel(compA) : "Competition A";
  const labelB = compB ? formatCompetitionLabel(compB) : "Competition B";

  const [activeMetric, setActiveMetric] = useState<string | null>("points");

  return (
    <Container size="lg">
      <Helmet>
        <title>{titleText}</title>
        <meta
          name="description"
          content="Compare two olympiad competitions by plotting contestants who participated in both."
        />
      </Helmet>
      <Title>Compare Competitions</Title>
      <Text c="dimmed" mb="lg">
        Select two competitions to compare contestants who participated in both
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
        <Select
          label="Competition A (X axis)"
          placeholder="Select a competition"
          searchable
          clearable
          data={competitionOptions}
          value={compAId}
          onChange={(value) => handleSelect("a", value)}
        />
        <Select
          label="Competition B (Y axis)"
          placeholder="Select a competition"
          searchable
          clearable
          data={competitionOptions}
          value={compBId}
          onChange={(value) => handleSelect("b", value)}
        />
      </SimpleGrid>

      {compA && compB ? (
        pointsData.length > 0 ? (
          <Paper p="md" withBorder>
            <Tabs value={activeMetric} onChange={setActiveMetric}>
              <Tabs.List mb="md">
                <Tabs.Tab value="points">Points</Tabs.Tab>
                <Tabs.Tab value="percentile">Relative position</Tabs.Tab>
              </Tabs.List>

              <Text c="dimmed" size="sm" mb="md">
                {pointsData.length} contestant{pointsData.length === 1 ? "" : "s"} participated in
                both
                {activeMetric === "percentile"
                  ? " — percentile rank within each competition (lower is better)"
                  : ""}
              </Text>

              <Tabs.Panel value="points">
                <ComparisonScatterChart
                  data={pointsData}
                  xLabel={`${labelA} points`}
                  yLabel={`${labelB} points`}
                  isDark={isDark}
                  xDomain={[0, compA.num_problems * compA.max_score_per_problem]}
                  yDomain={[0, compB.num_problems * compB.max_score_per_problem]}
                />
              </Tabs.Panel>

              <Tabs.Panel value="percentile">
                {percentileData.length > 0 ? (
                  <ComparisonScatterChart
                    data={percentileData}
                    xLabel={`${labelA} percentile`}
                    yLabel={`${labelB} percentile`}
                    isDark={isDark}
                    xDomain={[0, 100]}
                    yDomain={[0, 100]}
                  />
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No ranks available for these competitions
                  </Text>
                )}
              </Tabs.Panel>
            </Tabs>
          </Paper>
        ) : (
          <Paper p="xl" withBorder>
            <Text c="dimmed" ta="center">
              No contestants participated in both competitions
            </Text>
          </Paper>
        )
      ) : (
        <Paper p="xl" withBorder>
          <Text c="dimmed" ta="center">
            Select two competitions above to see the comparison
          </Text>
        </Paper>
      )}
    </Container>
  );
}
