import {
  Source,
  type Participation,
  type Competition,
  type TeamParticipation,
} from "@/schemas/base";
import { createEmptyAwardCounts, incrementAwardCounts } from "@/utils/statistics";

function createEmptySourceCounts(): Record<Source, number> {
  const counts = {} as Record<Source, number>;
  for (const source of Object.values(Source)) {
    counts[source] = 0;
  }
  return counts;
}

export interface YearStats {
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  participants: number;
  totalScore: number;
  source: Source;
}

export interface CountryStats {
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  total: number;
  byYearAndSource: Map<string, YearStats>; // key: "year-source"
  bySource: Record<Source, number>;
}

export function calculateStats(
  participations: Participation[],
  competitionMap: Record<string, Competition>,
  countryId: string
): CountryStats {
  const stats: CountryStats = {
    ...createEmptyAwardCounts(),
    total: 0,
    byYearAndSource: new Map(),
    bySource: createEmptySourceCounts(),
  };

  participations
    .filter((p) => p.country_id === countryId)
    .forEach((p) => {
      stats.total++;
      const comp = competitionMap[p.competition_id];
      if (!comp) return;

      stats.bySource[comp.source]++;

      const key = `${comp.year}-${comp.source}`;
      const yearStats = stats.byYearAndSource.get(key) ?? {
        ...createEmptyAwardCounts(),
        participants: 0,
        totalScore: 0,
        source: comp.source,
      };

      yearStats.participants++;
      yearStats.totalScore += p.total;

      incrementAwardCounts(stats, p.award);
      incrementAwardCounts(yearStats, p.award);

      stats.byYearAndSource.set(key, yearStats);
    });

  return stats;
}

export function filterStatsBySource(
  stats: CountryStats | null,
  source: Source
): { gold: number; silver: number; bronze: number; hm: number; total: number } {
  if (!stats) return { gold: 0, silver: 0, bronze: 0, hm: 0, total: 0 };

  let gold = 0,
    silver = 0,
    bronze = 0,
    hm = 0,
    total = 0;
  stats.byYearAndSource.forEach((yearStats) => {
    if (yearStats.source === source) {
      gold += yearStats.gold;
      silver += yearStats.silver;
      bronze += yearStats.bronze;
      hm += yearStats.hm;
      total += yearStats.participants;
    }
  });
  return { gold, silver, bronze, hm, total };
}

export function calculateTeamRanks(
  participations: Participation[],
  competitionMap: Record<string, Competition>
): Map<string, Map<string, number>> {
  const ranksByYearSource = new Map<string, Map<string, number>>();

  // Group participations by competition
  const byCompetition = new Map<string, Participation[]>();
  participations.forEach((p) => {
    const existing = byCompetition.get(p.competition_id) ?? [];
    existing.push(p);
    byCompetition.set(p.competition_id, existing);
  });

  // For each competition, calculate team totals and rank
  byCompetition.forEach((compParticipations, compId) => {
    const comp = competitionMap[compId];
    if (!comp) return;

    const key = `${comp.year}-${comp.source}`;

    // Sum scores by country
    const countryTotals = new Map<string, number>();
    compParticipations.forEach((p) => {
      const current = countryTotals.get(p.country_id) ?? 0;
      countryTotals.set(p.country_id, current + p.total);
    });

    // Sort and assign ranks
    const sorted = Array.from(countryTotals.entries()).sort((a, b) => b[1] - a[1]);
    const ranks = new Map<string, number>();
    sorted.forEach(([countryId], index) => {
      ranks.set(countryId, index + 1);
    });

    ranksByYearSource.set(key, ranks);
  });

  return ranksByYearSource;
}

export function getAvailableSources(
  stats1: CountryStats | null,
  stats2: CountryStats | null,
  sourceOptions: Array<{ value: Source; label: string }>,
  teamStats1?: TeamCountryStats | null,
  teamStats2?: TeamCountryStats | null
): Array<{ value: Source; label: string }> {
  if (!stats1 || !stats2) return [];

  const sources1 = new Set<Source>();
  const sources2 = new Set<Source>();

  stats1.byYearAndSource.forEach((stats) => sources1.add(stats.source));
  stats2.byYearAndSource.forEach((stats) => sources2.add(stats.source));

  teamStats1?.byYearAndSource.forEach((stats) => sources1.add(stats.source));
  teamStats2?.byYearAndSource.forEach((stats) => sources2.add(stats.source));

  // Return intersection in the same order as sourceOptions
  return sourceOptions.filter((opt) => sources1.has(opt.value) && sources2.has(opt.value));
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

export function calculateTeamRanksFromTeamParticipations(
  teamParticipations: TeamParticipation[],
  competitionMap: Record<string, Competition>
): Map<string, Map<string, number>> {
  const ranksByYearSource = new Map<string, Map<string, number>>();

  teamParticipations.forEach((tp) => {
    const comp = competitionMap[tp.competition_id];
    if (!comp || tp.rank === null) return;

    const key = `${comp.year}-${comp.source}`;
    if (!ranksByYearSource.has(key)) {
      ranksByYearSource.set(key, new Map());
    }
    ranksByYearSource.get(key)!.set(tp.country_id, tp.rank);
  });

  return ranksByYearSource;
}
