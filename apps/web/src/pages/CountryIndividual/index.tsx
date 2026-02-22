import { useMemo } from "react";
import { Container, Title, Text, Badge, Group, Anchor, useMantineColorScheme } from "@mantine/core";
import { useParams, Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { useSortedTable } from "@/hooks/useSortedTable";
import {
  useCountry,
  useParticipationsByCountry,
  useTeamParticipationsByCountry,
  useParticipations,
  useTeamParticipations,
  useCompetitions,
  usePeople,
} from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { generateProblemColumns } from "@/utils/table";
import { CountryFlag } from "@/utils/flags";
import {
  calculateMedalsBySource,
  calculateTeamRankOverTime,
  calculateMedalProgression,
  getCountryAvailableSources,
  calculateTeamRankFromTeamParticipations,
  calculateTeamScoreOverTime,
  calculateTeamStats,
  filterTeamStatsBySource,
} from "@/utils/countryStats";
import { ROUTES } from "@/constants/routes";
import { useSourceSelection } from "@/hooks/useSourceSelection";
import { SourceTabs } from "@/components/SourceTabs";
import { Award, Source } from "@/schemas/base";
import type { ProblemScoreRow } from "@/utils/table";
import { SOURCE_OPTIONS, AWARD_COLORS } from "@/constants/filterOptions";
import { TeamContent } from "./TeamContent";
import { IndividualContent } from "./IndividualContent";

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

interface TeamParticipationRow extends ProblemScoreRow {
  id: string;
  competitionId: string;
  year: number;
  rank: number | null;
  total: number;
}

const columnHelper = createColumnHelper<ParticipationRow>();
const teamColumnHelper = createColumnHelper<TeamParticipationRow>();

export function CountryIndividual() {
  const { code } = useParams<{ code: string }>();
  const countryId = `country-${code?.toLowerCase()}`;
  const { country, loading, error } = useCountry(countryId);
  const { participations } = useParticipationsByCountry(countryId);
  const { teamParticipations } = useTeamParticipationsByCountry(countryId);
  const { participations: allParticipations } = useParticipations();
  const { teamParticipations: allTeamParticipations } = useTeamParticipations();
  const { competitions } = useCompetitions();
  const { people } = usePeople();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const competitionMap = useEntityMap(competitions);
  const peopleMap = useEntityMap(people);

  // Get sources that this country has participated in
  const computedSources = useMemo(() => {
    const sources = getCountryAvailableSources(participations, competitionMap, teamParticipations);
    return SOURCE_OPTIONS.filter((opt) => sources.includes(opt.value));
  }, [participations, competitionMap, teamParticipations]);

  const { effectiveSource, setSelectedSource, isTeam, availableSources } = useSourceSelection({
    availableSources: computedSources,
  });

  const stats = useMemo(() => {
    const medals = calculateMedalsBySource(participations, competitionMap, effectiveSource);
    return { medals };
  }, [participations, competitionMap, effectiveSource]);

  // Team competition stats
  const teamStats = useMemo(() => {
    if (!isTeam) return null;
    const teamCountryStats = calculateTeamStats(teamParticipations, competitionMap, countryId);
    return filterTeamStatsBySource(teamCountryStats, effectiveSource);
  }, [isTeam, teamParticipations, competitionMap, countryId, effectiveSource]);

  // Calculate team ranks over time for the selected source
  const teamRankData = useMemo(
    () =>
      isTeam
        ? calculateTeamRankFromTeamParticipations(
            allTeamParticipations,
            competitionMap,
            countryId,
            effectiveSource
          )
        : calculateTeamRankOverTime(allParticipations, competitionMap, countryId, effectiveSource),
    [isTeam, allTeamParticipations, allParticipations, competitionMap, countryId, effectiveSource]
  );

  // Team score over time (for team competitions)
  const teamScoreData = useMemo(
    () =>
      isTeam ? calculateTeamScoreOverTime(teamParticipations, competitionMap, effectiveSource) : [],
    [isTeam, teamParticipations, competitionMap, effectiveSource]
  );

  // Calculate medal progression over time for the selected source
  const medalProgressionData = useMemo(
    () => calculateMedalProgression(participations, competitionMap, effectiveSource, "yearly"),
    [participations, competitionMap, effectiveSource]
  );

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

  // Team competition rows
  const teamRows: TeamParticipationRow[] = useMemo(
    () =>
      teamParticipations
        .filter((tp) => {
          const comp = competitionMap[tp.competition_id];
          return comp?.source === effectiveSource;
        })
        .map((tp) => {
          const comp = competitionMap[tp.competition_id];
          return {
            id: tp.id,
            competitionId: tp.competition_id,
            year: comp?.year ?? 0,
            rank: tp.rank,
            problemScores: tp.problem_scores,
            numProblems: comp?.num_problems ?? 0,
            total: tp.total,
          };
        }),
    [teamParticipations, competitionMap, effectiveSource]
  );

  // Find max number of problems across participations for the selected source
  const maxProblems = useMemo(() => {
    if (isTeam) {
      return Math.max(0, ...teamRows.map((r) => r.numProblems));
    }
    return Math.max(0, ...rows.map((r) => r.numProblems));
  }, [isTeam, rows, teamRows]);

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

  const teamColumns = useMemo(() => {
    const problemColumns = generateProblemColumns(teamColumnHelper, maxProblems);
    return [
      teamColumnHelper.accessor("year", {
        header: "Year",
      }),
      teamColumnHelper.accessor("rank", {
        header: "Rank",
        cell: (info) => info.getValue() ?? "-",
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.rank ?? 9999;
          const b = rowB.original.rank ?? 9999;
          return a - b;
        },
      }),
      ...problemColumns,
      teamColumnHelper.accessor("total", {
        header: "Total",
      }),
    ];
  }, [maxProblems]);

  const { table: teamTable } = useSortedTable({
    data: teamRows,
    columns: teamColumns,
    defaultSort: [{ id: "year", desc: true }],
  });

  const { table } = useSortedTable({
    data: rows,
    columns,
    defaultSort: [{ id: "year", desc: true }],
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

      <SourceTabs
        availableSources={availableSources}
        effectiveSource={effectiveSource}
        onSourceChange={setSelectedSource}
      />

      {isTeam && teamStats ? (
        <TeamContent
          teamStats={teamStats}
          teamRankData={teamRankData}
          teamScoreData={teamScoreData}
          teamTable={teamTable}
          columnCount={teamColumns.length}
          teamRowCount={teamRows.length}
          effectiveSource={effectiveSource}
          loading={loading}
          error={error}
          isDark={isDark}
        />
      ) : (
        <IndividualContent
          medals={stats.medals}
          teamRankData={teamRankData}
          medalProgressionData={medalProgressionData}
          table={table}
          columnCount={columns.length}
          rowCount={rows.length}
          effectiveSource={effectiveSource}
          loading={loading}
          error={error}
          isDark={isDark}
        />
      )}
    </Container>
  );
}
