import type { Person, Participation, Competition, Country } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";
import { createEmptyAwardCounts, incrementAwardCounts } from "@/utils/statistics";

export interface ParticipationRow {
  id: string;
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

export interface RankingChartDataPoint {
  year: number;
  noMedal: number;
  bronze: number;
  silver: number;
  gold: number;
  totalParticipants: number;
  personRank: number | null;
  personPosition: number | null; // Position from bottom (for display)
}

export interface AggregateParticipationsInput {
  participations: Participation[];
  competitionMap: Record<string, Competition>;
}

export interface AggregateRankingChartInput {
  allParticipations: Participation[];
  personParticipations: Participation[];
  competitionMap: Record<string, Competition>;
  chartSource: Source;
}

export interface GetPersonSourcesInput {
  participations: Participation[];
  competitionMap: Record<string, Competition>;
}

/**
 * Aggregates person's participations into display rows.
 */
export function aggregateParticipations({
  participations,
  competitionMap,
}: AggregateParticipationsInput): ParticipationRow[] {
  return participations.map((p) => {
    const comp = competitionMap[p.competition_id];
    return {
      id: p.id,
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
  });
}

/**
 * Aggregates ranking chart data for visualizing a person's rank
 * across all participants in each year.
 */
export function aggregateRankingChartData({
  allParticipations,
  personParticipations,
  competitionMap,
  chartSource,
}: AggregateRankingChartInput): RankingChartDataPoint[] {
  // Group all participations by competition (year + source)
  const byCompetition = new Map<string, { year: number; participations: Participation[] }>();

  allParticipations.forEach((p) => {
    const comp = competitionMap[p.competition_id];
    if (!comp || comp.source !== chartSource) return;

    const key = `${comp.year}-${comp.source}`;
    if (!byCompetition.has(key)) {
      byCompetition.set(key, { year: comp.year, participations: [] });
    }
    byCompetition.get(key)!.participations.push(p);
  });

  // Get person's participations for the selected source
  const personParticipationsByYear = new Map<
    number,
    { rank: number | null; award: Award | null }
  >();
  personParticipations.forEach((p) => {
    const comp = competitionMap[p.competition_id];
    if (!comp || comp.source !== chartSource) return;
    personParticipationsByYear.set(comp.year, { rank: p.rank, award: p.award });
  });

  // Build chart data for each year
  const data: RankingChartDataPoint[] = [];

  byCompetition.forEach(({ year, participations }) => {
    const totalParticipants = participations.length;
    const counts = createEmptyAwardCounts();

    participations.forEach((p) => {
      incrementAwardCounts(counts, p.award);
    });

    const noMedal = totalParticipants - counts.gold - counts.silver - counts.bronze;

    const personData = personParticipationsByYear.get(year);
    // Convert rank to position from bottom (totalParticipants - rank + 1)
    const personPosition =
      personData?.rank != null ? totalParticipants - personData.rank + 1 : null;

    data.push({
      year,
      noMedal,
      bronze: counts.bronze,
      silver: counts.silver,
      gold: counts.gold,
      totalParticipants,
      personRank: personData?.rank ?? null,
      personPosition,
    });
  });

  return data.sort((a, b) => a.year - b.year);
}

/**
 * Gets the set of competition sources a person has participated in.
 */
export function getPersonSources({
  participations,
  competitionMap,
}: GetPersonSourcesInput): Set<Source> {
  const sources = new Set<Source>();
  participations.forEach((p) => {
    const comp = competitionMap[p.competition_id];
    if (comp) sources.add(comp.source);
  });
  return sources;
}

/**
 * Calculates the maximum number of problems across participations.
 * Used to determine how many problem columns to display.
 */
export function getMaxProblems(rows: ParticipationRow[], sourceFilter: Source | null): number {
  const filteredRows = sourceFilter ? rows.filter((r) => r.source === sourceFilter) : rows;
  return Math.max(0, ...filteredRows.map((r) => r.numProblems));
}

export interface ContestantInfoInput {
  person: Person | null;
  countryMap: Record<string, Country>;
}

export interface ContestantInfo {
  name: string;
  countryCode: string | null;
  countryName: string;
}

/**
 * Extracts contestant display info from person and country data.
 */
export function getContestantInfo({
  person,
  countryMap,
}: ContestantInfoInput): ContestantInfo | null {
  if (!person) return null;

  return {
    name: person.name,
    countryCode: countryMap[person.country_id]?.code ?? null,
    countryName: countryMap[person.country_id]?.name ?? person.country_id,
  };
}
