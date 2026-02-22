import { useMemo, useState } from "react";
import { Container, Title, Text, Badge, Group, Anchor, useMantineColorScheme } from "@mantine/core";
import { useParams, Link } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { useSortedTable } from "@/hooks/useSortedTable";
import {
  useCompetition,
  useParticipationsByCompetition,
  useTeamParticipationsByCompetition,
  useCountries,
  usePeople,
} from "@/hooks/api";
import { useEntityMap } from "@/hooks/useEntityMap";
import { useTableSearch } from "@/hooks/useTableSearch";
import { generateProblemColumns, type ProblemScoreRow } from "@/utils/table";
import { CountryFlag } from "@/utils/flags";
import { ROUTES } from "@/constants/routes";
import { Award, isTeamCompetition } from "@/schemas/base";
import { AWARD_COLORS } from "@/constants/filterOptions";
import {
  calculateCountryStandings,
  calculateScoreDistribution,
  getCountryFilterOptions,
  type CountryStanding,
} from "@/utils/competitions";
import { TeamContent } from "./TeamContent";
import { IndividualContent } from "./IndividualContent";

interface ParticipationRow extends ProblemScoreRow {
  id: string;
  personId: string;
  personName: string;
  countryId: string;
  countryCode: string | null;
  countryName: string;
  rank: number | null;
  total: number;
  award: Award | null;
}

interface TeamParticipationRow extends ProblemScoreRow {
  id: string;
  countryId: string;
  countryCode: string | null;
  countryName: string;
  rank: number | null;
  total: number;
}

type CountryRow = CountryStanding;

const columnHelper = createColumnHelper<ParticipationRow>();
const teamColumnHelper = createColumnHelper<TeamParticipationRow>();
const countryColumnHelper = createColumnHelper<CountryRow>();

export function Competition() {
  const { id } = useParams<{ id: string }>();
  const { competition, loading, error } = useCompetition(id!);
  const { participations } = useParticipationsByCompetition(id!);
  const { teamParticipations } = useTeamParticipationsByCompetition(id!);
  const { countries } = useCountries();
  const { people } = usePeople();
  const isTeam = competition ? isTeamCompetition(competition.source) : false;
  const [activeTab, setActiveTab] = useState<string | null>("individual");
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const countryMap = useEntityMap(countries);
  const personMap = useEntityMap(people);

  const countryOptions = useMemo(
    () => getCountryFilterOptions(participations, countryMap),
    [participations, countryMap]
  );

  const numProblems = competition?.num_problems ?? 0;

  const rows: ParticipationRow[] = useMemo(
    () =>
      participations.map((p) => ({
        id: p.id,
        personId: p.person_id,
        personName: personMap[p.person_id]?.name ?? p.person_id,
        countryId: p.country_id,
        countryCode: countryMap[p.country_id]?.code ?? null,
        countryName: countryMap[p.country_id]?.name ?? p.country_id,
        rank: p.rank,
        problemScores: p.problem_scores,
        numProblems,
        total: p.total,
        award: p.award,
      })),
    [participations, personMap, countryMap, numProblems]
  );

  const countryRows: CountryRow[] = useMemo(
    () => calculateCountryStandings(participations, countryMap, competition?.num_problems ?? 0),
    [participations, countryMap, competition]
  );

  const scoreDistribution = useMemo(
    () => (competition ? calculateScoreDistribution(participations, competition) : []),
    [participations, competition]
  );

  // Team competition data
  const teamRows: TeamParticipationRow[] = useMemo(
    () =>
      teamParticipations.map((tp) => ({
        id: tp.id,
        countryId: tp.country_id,
        countryCode: countryMap[tp.country_id]?.code ?? null,
        countryName: countryMap[tp.country_id]?.name ?? tp.country_id,
        rank: tp.rank,
        problemScores: tp.problem_scores,
        numProblems,
        total: tp.total,
      })),
    [teamParticipations, countryMap, numProblems]
  );

  const teamScoreDistribution = useMemo(() => {
    if (!competition || !isTeam || teamParticipations.length === 0) return [];
    const maxScore = competition.num_problems * competition.max_score_per_problem;
    const counts: Record<number, number> = {};
    for (let i = 0; i <= maxScore; i++) counts[i] = 0;
    teamParticipations.forEach((tp) => {
      if (tp.total >= 0 && tp.total <= maxScore) counts[tp.total]++;
    });
    return Object.entries(counts).map(([score, count]) => ({
      score: Number(score),
      count,
    }));
  }, [competition, isTeam, teamParticipations]);

  const teamColumns = useMemo(() => {
    const problemColumns = generateProblemColumns(teamColumnHelper, numProblems);
    return [
      teamColumnHelper.accessor("rank", {
        header: "Rank",
        cell: (info) => info.getValue() ?? "-",
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.rank ?? 9999;
          const b = rowB.original.rank ?? 9999;
          return a - b;
        },
      }),
      teamColumnHelper.accessor("countryName", {
        header: "Country",
        cell: (info) => {
          const countryId = info.row.original.countryId;
          return (
            <Anchor
              component={Link}
              to={ROUTES.COUNTRY_INDIVIDUAL(countryId.replace("country-", ""))}
            >
              <Group gap={6} wrap="nowrap">
                <CountryFlag code={info.row.original.countryCode} />
                {info.getValue()}
              </Group>
            </Anchor>
          );
        },
      }),
      ...problemColumns,
      teamColumnHelper.accessor("total", {
        header: "Total",
      }),
    ];
  }, [numProblems]);

  const { table: teamTable } = useSortedTable({
    data: teamRows,
    columns: teamColumns,
    defaultSort: [{ id: "rank", desc: false }],
  });

  const { fuzzySearch, createHandleSearch } = useTableSearch<ParticipationRow>(
    (row) => row.personName,
    [],
    rows
  );

  const columns = useMemo(() => {
    const problemColumns = generateProblemColumns(columnHelper, numProblems);

    return [
      columnHelper.accessor("rank", {
        header: "Rank",
        cell: (info) => info.getValue() ?? "-",
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.rank ?? 9999;
          const b = rowB.original.rank ?? 9999;
          return a - b;
        },
      }),
      columnHelper.accessor("personName", {
        header: "Name",
        cell: (info) => (
          <Anchor component={Link} to={ROUTES.CONTESTANT(info.row.original.personId)}>
            {info.getValue()}
          </Anchor>
        ),
        filterFn: fuzzySearch,
        sortingFn: (rowA, rowB, columnID) => {
          const scoreA = rowA.columnFiltersMeta[columnID];
          const scoreB = rowB.columnFiltersMeta[columnID];
          return typeof scoreA === "number" && typeof scoreB === "number"
            ? scoreA < scoreB
              ? -1
              : 1
            : 0;
        },
      }),
      columnHelper.accessor("countryId", {
        header: "Country",
        cell: (info) => (
          <Group gap={6} wrap="nowrap">
            <CountryFlag code={info.row.original.countryCode} />
            {info.row.original.countryName}
          </Group>
        ),
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return filterValue.includes(row.getValue(columnId));
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
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          const award = row.getValue<Award | null>(columnId);
          if (!award) return false;
          return filterValue.includes(award);
        },
      }),
    ];
  }, [fuzzySearch, numProblems]);

  const countryColumns = useMemo(() => {
    const numProblems = competition?.num_problems ?? 0;

    // Generate problem total columns dynamically
    const problemColumns = Array.from({ length: numProblems }, (_, i) =>
      countryColumnHelper.display({
        id: `p${i + 1}`,
        header: `P${i + 1}`,
        cell: (info) => info.row.original.problemTotals[i] ?? 0,
      })
    );

    return [
      countryColumnHelper.accessor("rank", {
        header: "Rank",
        cell: (info) => info.getValue(),
      }),
      countryColumnHelper.accessor("countryName", {
        header: "Country",
        cell: (info) => {
          const countryId = info.row.original.countryId;
          if (!countryId) return info.getValue();
          return (
            <Anchor
              component={Link}
              to={ROUTES.COUNTRY_INDIVIDUAL(countryId.replace("country-", ""))}
            >
              <Group gap={6} wrap="nowrap">
                <CountryFlag code={info.row.original.countryCode} />
                {info.getValue()}
              </Group>
            </Anchor>
          );
        },
      }),
      ...problemColumns,
      countryColumnHelper.accessor("totalScore", {
        header: "Total",
      }),
      countryColumnHelper.accessor("participants", {
        header: "Participants",
      }),
      countryColumnHelper.accessor("gold", {
        header: "Gold",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="yellow">{value}</Badge> : "-";
        },
      }),
      countryColumnHelper.accessor("silver", {
        header: "Silver",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="gray">{value}</Badge> : "-";
        },
      }),
      countryColumnHelper.accessor("bronze", {
        header: "Bronze",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="orange">{value}</Badge> : "-";
        },
      }),
      countryColumnHelper.accessor("hm", {
        header: "HM",
        cell: (info) => {
          const value = info.getValue();
          return value > 0 ? <Badge color="blue">{value}</Badge> : "-";
        },
      }),
    ];
  }, [competition]);

  const { table } = useSortedTable({
    data: rows,
    columns,
    defaultSort: [{ id: "rank", desc: false }],
    enableFiltering: true,
  });

  const { table: countryTable } = useSortedTable({
    data: countryRows,
    columns: countryColumns,
    defaultSort: [{ id: "rank", desc: false }],
  });

  const handleSearch = createHandleSearch(table, "personName");

  if (!competition && !loading) {
    return (
      <Container>
        <Text c="red">Competition not found: {id}</Text>
      </Container>
    );
  }

  return (
    <Container size={numProblems > 10 ? "xl" : undefined}>
      {competition && (
        <>
          <Title>
            {competition.source} {competition.year}
          </Title>
          <Text c="dimmed" mb="md">
            {competition.edition && `${competition.edition}th edition - `}
            {competition.host_country_id && countryMap[competition.host_country_id]?.name}
            {" | "}
            <Anchor component={Link} to={ROUTES.COMPETITION_STATISTICS(id!)}>
              Statistics
            </Anchor>
          </Text>
        </>
      )}

      {isTeam ? (
        <TeamContent
          teamScoreDistribution={teamScoreDistribution}
          teamTable={teamTable}
          columnCount={teamColumns.length}
          numProblems={numProblems}
          teamCount={teamParticipations.length}
          loading={loading}
          error={error}
          isDark={isDark}
        />
      ) : (
        <IndividualContent
          scoreDistribution={scoreDistribution}
          table={table}
          countryTable={countryTable}
          columnCount={columns.length}
          countryColumnCount={countryColumns.length}
          countryOptions={countryOptions}
          participationCount={participations.length}
          countryRowCount={countryRows.length}
          loading={loading}
          error={error}
          isDark={isDark}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleSearch={handleSearch}
        />
      )}
    </Container>
  );
}
