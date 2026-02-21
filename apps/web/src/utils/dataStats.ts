/**
 * Utility functions for calculating statistics displayed on the Data page.
 */

import type { Database, Competition, Participation, TeamParticipation } from "@/schemas/base";
import { Source, Award } from "@/schemas/base";

export interface YearRange {
  start: number;
  end: number;
}

export interface DataStats {
  countries: number;
  competitions: number;
  people: number;
  participations: number;
  byOlympiad: Record<string, number>;
  yearsByOlympiad: Record<string, string>;
  minYear: number;
  maxYear: number;
  yearSpan: number;
  awards: Record<string, number>;
  noAward: number;
  lastUpdated: string;
}

/**
 * Counts participations by olympiad source (individual + team).
 */
export function countParticipationsBySource(
  participations: Participation[],
  competitions: Record<string, Competition>,
  teamParticipations?: TeamParticipation[]
): Record<string, number> {
  const byOlympiad: Record<string, number> = {};

  // Initialize all sources to 0
  for (const source of Object.values(Source)) {
    byOlympiad[source] = 0;
  }

  for (const participation of participations) {
    const competition = competitions[participation.competition_id];
    if (competition) {
      byOlympiad[competition.source] = (byOlympiad[competition.source] || 0) + 1;
    }
  }

  if (teamParticipations) {
    for (const tp of teamParticipations) {
      const competition = competitions[tp.competition_id];
      if (competition) {
        byOlympiad[competition.source] = (byOlympiad[competition.source] || 0) + 1;
      }
    }
  }

  return byOlympiad;
}

/**
 * Collects years for each olympiad source.
 */
export function collectYearsBySource(competitions: Competition[]): Record<string, Set<number>> {
  const yearSetByOlympiad: Record<string, Set<number>> = {};

  for (const competition of competitions) {
    if (!yearSetByOlympiad[competition.source]) {
      yearSetByOlympiad[competition.source] = new Set();
    }
    yearSetByOlympiad[competition.source].add(competition.year);
  }

  return yearSetByOlympiad;
}

/**
 * Converts a set of years into a formatted range string.
 * Consecutive years are merged into ranges (e.g., "2016-2018, 2020-2025").
 */
export function formatYearRanges(years: Set<number>): string {
  const sortedYears = Array.from(years).sort((a, b) => a - b);

  if (sortedYears.length === 0) {
    return "";
  }

  const ranges: string[] = [];
  let rangeStart = sortedYears[0];
  let rangeEnd = sortedYears[0];

  for (let i = 1; i < sortedYears.length; i++) {
    if (sortedYears[i] === rangeEnd + 1) {
      rangeEnd = sortedYears[i];
    } else {
      ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
      rangeStart = sortedYears[i];
      rangeEnd = sortedYears[i];
    }
  }

  ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);

  return ranges.join(", ");
}

/**
 * Formats year coverage for each olympiad source.
 */
export function formatYearsBySource(
  yearSetByOlympiad: Record<string, Set<number>>
): Record<string, string> {
  const yearsByOlympiad: Record<string, string> = {};

  for (const [source, yearSet] of Object.entries(yearSetByOlympiad)) {
    yearsByOlympiad[source] = formatYearRanges(yearSet);
  }

  return yearsByOlympiad;
}

/**
 * Counts awards by type from participations.
 */
export function countAwards(participations: Participation[]): {
  awards: Record<string, number>;
  noAward: number;
} {
  const awards: Record<string, number> = {
    [Award.GOLD]: 0,
    [Award.SILVER]: 0,
    [Award.BRONZE]: 0,
    [Award.HONOURABLE_MENTION]: 0,
  };
  let noAward = 0;

  for (const participation of participations) {
    if (participation.award) {
      awards[participation.award] = (awards[participation.award] || 0) + 1;
    } else {
      noAward++;
    }
  }

  return { awards, noAward };
}

/**
 * Gets the overall year range from competitions.
 */
export function getYearRange(competitions: Competition[]): {
  minYear: number;
  maxYear: number;
  yearSpan: number;
} {
  if (competitions.length === 0) {
    return { minYear: 0, maxYear: 0, yearSpan: 0 };
  }

  const years = competitions.map((c) => c.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  return {
    minYear,
    maxYear,
    yearSpan: maxYear - minYear + 1,
  };
}

/**
 * Calculates all statistics for the Data page from a database.
 */
export function calculateDataStats(data: Database): DataStats {
  const countries = Object.keys(data.countries).length;
  const competitions = Object.keys(data.competitions).length;
  const people = Object.keys(data.people).length;
  const participationsList = Object.values(data.participations);
  const competitionsList = Object.values(data.competitions);

  const teamParticipationsList = data.team_participations
    ? Object.values(data.team_participations)
    : [];
  const byOlympiad = countParticipationsBySource(
    participationsList,
    data.competitions,
    teamParticipationsList
  );
  const yearSetByOlympiad = collectYearsBySource(competitionsList);
  const yearsByOlympiad = formatYearsBySource(yearSetByOlympiad);
  const { minYear, maxYear, yearSpan } = getYearRange(competitionsList);
  const { awards, noAward } = countAwards(participationsList);

  return {
    countries,
    competitions,
    people,
    participations: participationsList.length,
    byOlympiad,
    yearsByOlympiad,
    minYear,
    maxYear,
    yearSpan,
    awards,
    noAward,
    lastUpdated: data.last_updated,
  };
}
