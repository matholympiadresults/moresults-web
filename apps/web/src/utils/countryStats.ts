/**
 * Utility functions for calculating country statistics from participation data.
 * These are extracted from the UI components for testability.
 */

import type { Country, Competition, Participation, TeamParticipation } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";
import { createEmptyAwardCounts, incrementAwardCounts } from "@/utils/statistics";

function createEmptySourceCounts(): Record<Source, number> {
  const counts = {} as Record<Source, number>;
  for (const source of Object.values(Source)) {
    counts[source] = 0;
  }
  return counts;
}

export interface CountryStats {
  participations: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  totalMedals: number;
}

export interface CountryRow {
  id: string;
  code: string;
  name: string;
  participations: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  totalMedals: number;
}

export interface MedalCounts {
  [Award.GOLD]: number;
  [Award.SILVER]: number;
  [Award.BRONZE]: number;
  [Award.HONOURABLE_MENTION]: number;
}

export interface YearlyMedalData {
  year: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  total: number;
}

export interface TeamRankData {
  year: number;
  teamRank: number | null;
  totalTeams: number;
  percentile: number | null;
}

/**
 * Calculate statistics for all countries based on participations.
 * Returns a map of country_id -> stats
 */
export function calculateCountryStatsMap(
  participations: Participation[]
): Map<string, CountryStats> {
  const statsMap = new Map<string, CountryStats>();

  participations.forEach((p) => {
    const existing = statsMap.get(p.country_id) ?? {
      ...createEmptyAwardCounts(),
      participations: 0,
      totalMedals: 0,
    };

    existing.participations++;
    incrementAwardCounts(existing, p.award);
    existing.totalMedals = existing.gold + existing.silver + existing.bronze;
    statsMap.set(p.country_id, existing);
  });

  return statsMap;
}

/**
 * Build country rows for the countries list table.
 */
export function buildCountryRows(
  countries: Country[],
  participations: Participation[]
): CountryRow[] {
  const statsMap = calculateCountryStatsMap(participations);

  return countries.map((country) => {
    const stats = statsMap.get(country.id) ?? {
      ...createEmptyAwardCounts(),
      participations: 0,
      totalMedals: 0,
    };

    return {
      id: country.id,
      code: country.code,
      name: country.name,
      participations: stats.participations,
      gold: stats.gold,
      silver: stats.silver,
      bronze: stats.bronze,
      hm: stats.hm,
      totalMedals: stats.totalMedals,
    };
  });
}

/**
 * Calculate medal counts for a specific country filtered by competition source.
 */
export function calculateMedalsBySource(
  participations: Participation[],
  competitionMap: Record<string, Competition>,
  source: Source
): MedalCounts {
  const medals: MedalCounts = {
    [Award.GOLD]: 0,
    [Award.SILVER]: 0,
    [Award.BRONZE]: 0,
    [Award.HONOURABLE_MENTION]: 0,
  };

  participations.forEach((p) => {
    const comp = competitionMap[p.competition_id];
    if (!comp || comp.source !== source) return;

    if (p.award) {
      medals[p.award]++;
    }
  });

  return medals;
}

/**
 * Calculate team rank data over time for a country in a specific competition source.
 */
export function calculateTeamRankOverTime(
  allParticipations: Participation[],
  competitionMap: Record<string, Competition>,
  countryId: string,
  source: Source
): TeamRankData[] {
  // Group all participations by competition
  const byCompetition = new Map<
    string,
    { year: number; source: Source; participations: Participation[] }
  >();

  allParticipations.forEach((p) => {
    const comp = competitionMap[p.competition_id];
    if (!comp || comp.source !== source) return;

    if (!byCompetition.has(p.competition_id)) {
      byCompetition.set(p.competition_id, {
        year: comp.year,
        source: comp.source,
        participations: [],
      });
    }
    byCompetition.get(p.competition_id)!.participations.push(p);
  });

  // For each competition, calculate team totals and this country's rank
  const data: TeamRankData[] = [];

  byCompetition.forEach(({ year, participations: compParticipations }) => {
    // Sum scores by country
    const countryTotals = new Map<string, number>();
    compParticipations.forEach((p) => {
      const current = countryTotals.get(p.country_id) ?? 0;
      countryTotals.set(p.country_id, current + p.total);
    });

    // Sort and find this country's rank
    const sorted = Array.from(countryTotals.entries()).sort((a, b) => b[1] - a[1]);
    const thisCountryIndex = sorted.findIndex(([cId]) => cId === countryId);
    const totalTeams = sorted.length;

    data.push({
      year,
      teamRank: thisCountryIndex >= 0 ? thisCountryIndex + 1 : null,
      totalTeams,
      // Percentile: 100% = best, 0% = worst (inverted so higher is better)
      percentile:
        thisCountryIndex >= 0
          ? Math.round((1 - thisCountryIndex / (totalTeams - 1 || 1)) * 100)
          : null,
    });
  });

  return data.sort((a, b) => a.year - b.year);
}

/**
 * Calculate medal progression over time for a country.
 */
export function calculateMedalProgression(
  participations: Participation[],
  competitionMap: Record<string, Competition>,
  source: Source,
  mode: "yearly" | "cumulative"
): YearlyMedalData[] {
  const byYear = new Map<number, { gold: number; silver: number; bronze: number; hm: number }>();

  participations.forEach((p) => {
    const comp = competitionMap[p.competition_id];
    if (!comp || comp.source !== source) return;

    const year = comp.year;
    const yearStats = byYear.get(year) ?? createEmptyAwardCounts();

    incrementAwardCounts(yearStats, p.award);

    byYear.set(year, yearStats);
  });

  const data: YearlyMedalData[] = [];
  byYear.forEach((stats, year) => {
    data.push({
      year,
      ...stats,
      total: stats.gold + stats.silver + stats.bronze + stats.hm,
    });
  });

  // Sort by year
  data.sort((a, b) => a.year - b.year);

  // If cumulative mode, transform the data
  if (mode === "cumulative") {
    let cumGold = 0,
      cumSilver = 0,
      cumBronze = 0,
      cumHm = 0;
    return data.map((d) => {
      cumGold += d.gold;
      cumSilver += d.silver;
      cumBronze += d.bronze;
      cumHm += d.hm;
      return {
        year: d.year,
        gold: cumGold,
        silver: cumSilver,
        bronze: cumBronze,
        hm: cumHm,
        total: cumGold + cumSilver + cumBronze + cumHm,
      };
    });
  }

  return data;
}

/**
 * Get which sources a country has participated in.
 */
export function getCountryAvailableSources(
  participations: Participation[],
  competitionMap: Record<string, Competition>,
  teamParticipations?: TeamParticipation[]
): Source[] {
  const sources = new Set<Source>();
  participations.forEach((p) => {
    const comp = competitionMap[p.competition_id];
    if (comp) {
      sources.add(comp.source);
    }
  });
  teamParticipations?.forEach((tp) => {
    const comp = competitionMap[tp.competition_id];
    if (comp) {
      sources.add(comp.source);
    }
  });

  // Return in a consistent order
  const sourceOrder = [
    Source.IMO,
    Source.EGMO,
    Source.MEMO,
    Source.MEMO_TEAM,
    Source.RMM,
    Source.APMO,
    Source.BMO,
    Source.PAMO,
    Source.BALTICWAY,
  ];
  return sourceOrder.filter((s) => sources.has(s));
}

/**
 * Calculate team rank data over time from TeamParticipation records (for team competitions).
 */
export function calculateTeamRankFromTeamParticipations(
  allTeamParticipations: TeamParticipation[],
  competitionMap: Record<string, Competition>,
  countryId: string,
  source: Source
): TeamRankData[] {
  // Group by competition
  const byCompetition = new Map<string, { year: number; participations: TeamParticipation[] }>();

  allTeamParticipations.forEach((tp) => {
    const comp = competitionMap[tp.competition_id];
    if (!comp || comp.source !== source) return;

    if (!byCompetition.has(tp.competition_id)) {
      byCompetition.set(tp.competition_id, { year: comp.year, participations: [] });
    }
    byCompetition.get(tp.competition_id)!.participations.push(tp);
  });

  const data: TeamRankData[] = [];

  byCompetition.forEach(({ year, participations }) => {
    const totalTeams = participations.length;
    const thisTeam = participations.find((tp) => tp.country_id === countryId);

    data.push({
      year,
      teamRank: thisTeam?.rank ?? null,
      totalTeams,
      percentile:
        thisTeam?.rank !== null && thisTeam?.rank !== undefined
          ? Math.round((1 - (thisTeam.rank - 1) / (totalTeams - 1 || 1)) * 100)
          : null,
    });
  });

  return data.sort((a, b) => a.year - b.year);
}

export interface TeamScoreOverTimeData {
  year: number;
  total: number;
  rank: number | null;
}

/**
 * Calculate total score over time for a country in team competitions.
 */
export function calculateTeamScoreOverTime(
  teamParticipations: TeamParticipation[],
  competitionMap: Record<string, Competition>,
  source: Source
): TeamScoreOverTimeData[] {
  return teamParticipations
    .filter((tp) => {
      const comp = competitionMap[tp.competition_id];
      return comp?.source === source;
    })
    .map((tp) => {
      const comp = competitionMap[tp.competition_id]!;
      return {
        year: comp.year,
        total: tp.total,
        rank: tp.rank,
      };
    })
    .sort((a, b) => a.year - b.year);
}

export interface TeamYearStats {
  totalScore: number;
  rank: number | null;
  source: Source;
}

export interface TeamCountryStats {
  byYearAndSource: Map<string, TeamYearStats>;
  bySource: Record<Source, number>;
}

export function calculateTeamStats(
  teamParticipations: TeamParticipation[],
  competitionMap: Record<string, Competition>,
  countryId: string
): TeamCountryStats {
  const stats: TeamCountryStats = {
    byYearAndSource: new Map(),
    bySource: createEmptySourceCounts(),
  };

  teamParticipations
    .filter((tp) => tp.country_id === countryId)
    .forEach((tp) => {
      const comp = competitionMap[tp.competition_id];
      if (!comp) return;

      stats.bySource[comp.source]++;
      const key = `${comp.year}-${comp.source}`;
      stats.byYearAndSource.set(key, {
        totalScore: tp.total,
        rank: tp.rank,
        source: comp.source,
      });
    });

  return stats;
}

export function filterTeamStatsBySource(
  stats: TeamCountryStats | null,
  source: Source
): {
  participations: number;
  bestRank: number | null;
  avgRank: number | null;
  avgScore: number | null;
} {
  if (!stats) return { participations: 0, bestRank: null, avgRank: null, avgScore: null };

  const entries: TeamYearStats[] = [];
  stats.byYearAndSource.forEach((yearStats) => {
    if (yearStats.source === source) entries.push(yearStats);
  });

  if (entries.length === 0)
    return { participations: 0, bestRank: null, avgRank: null, avgScore: null };

  const ranks = entries.map((e) => e.rank).filter((r): r is number => r !== null);
  return {
    participations: entries.length,
    bestRank: ranks.length > 0 ? Math.min(...ranks) : null,
    avgRank:
      ranks.length > 0
        ? Math.round((ranks.reduce((a, b) => a + b, 0) / ranks.length) * 10) / 10
        : null,
    avgScore:
      Math.round((entries.reduce((a, e) => a + e.totalScore, 0) / entries.length) * 10) / 10,
  };
}
