import type { Competition, Participation, Country } from "@/schemas/base";
import { Award } from "@/schemas/base";

export interface CountryStanding {
  countryId: string;
  countryCode: string | null;
  countryName: string;
  rank: number;
  problemTotals: number[];
  totalScore: number;
  participants: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
}

export interface ScoreDistributionEntry {
  score: number;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  none: number;
  total: number;
}

/**
 * Calculate country standings from participations.
 * Aggregates scores, medal counts, and assigns ranks based on total score.
 */
export function calculateCountryStandings(
  participations: Participation[],
  countryMap: Record<string, Country>,
  numProblems: number
): CountryStanding[] {
  const countryStats = new Map<
    string,
    {
      problemTotals: number[];
      totalScore: number;
      participants: number;
      gold: number;
      silver: number;
      bronze: number;
      hm: number;
    }
  >();

  participations.forEach((p) => {
    if (!p.country_id) return;

    const stats = countryStats.get(p.country_id) ?? {
      problemTotals: Array(numProblems).fill(0) as number[],
      totalScore: 0,
      participants: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      hm: 0,
    };

    stats.totalScore += p.total;
    stats.participants++;

    p.problem_scores.forEach((score, i) => {
      if (score !== null && i < numProblems) {
        stats.problemTotals[i] += score;
      }
    });

    if (p.award === Award.GOLD) stats.gold++;
    else if (p.award === Award.SILVER) stats.silver++;
    else if (p.award === Award.BRONZE) stats.bronze++;
    else if (p.award === Award.HONOURABLE_MENTION) stats.hm++;

    countryStats.set(p.country_id, stats);
  });

  const result: CountryStanding[] = [];
  countryStats.forEach((stats, countryId) => {
    result.push({
      countryId,
      countryCode: countryMap[countryId]?.code ?? null,
      countryName: countryMap[countryId]?.name ?? countryId,
      rank: 0,
      problemTotals: stats.problemTotals,
      totalScore: stats.totalScore,
      participants: stats.participants,
      gold: stats.gold,
      silver: stats.silver,
      bronze: stats.bronze,
      hm: stats.hm,
    });
  });

  result.sort((a, b) => b.totalScore - a.totalScore);
  result.forEach((row, index) => {
    row.rank = index + 1;
  });

  return result;
}

/**
 * Calculate score distribution for a competition, grouped by award type.
 * Returns an array where each entry represents a score value and the count
 * of participants who achieved that score, broken down by award.
 */
export function calculateScoreDistribution(
  participations: Participation[],
  competition: Competition
): ScoreDistributionEntry[] {
  const maxScore = competition.num_problems * competition.max_score_per_problem;

  const scoreData: Record<
    number,
    { gold: number; silver: number; bronze: number; hm: number; none: number }
  > = {};
  for (let i = 0; i <= maxScore; i++) {
    scoreData[i] = { gold: 0, silver: 0, bronze: 0, hm: 0, none: 0 };
  }

  participations.forEach((p) => {
    if (p.total >= 0 && p.total <= maxScore) {
      if (p.award === Award.GOLD) scoreData[p.total].gold++;
      else if (p.award === Award.SILVER) scoreData[p.total].silver++;
      else if (p.award === Award.BRONZE) scoreData[p.total].bronze++;
      else if (p.award === Award.HONOURABLE_MENTION) scoreData[p.total].hm++;
      else scoreData[p.total].none++;
    }
  });

  return Object.entries(scoreData).map(([score, counts]) => ({
    score: Number(score),
    gold: counts.gold,
    silver: counts.silver,
    bronze: counts.bronze,
    hm: counts.hm,
    none: counts.none,
    total: counts.gold + counts.silver + counts.bronze + counts.hm + counts.none,
  }));
}

/**
 * Get unique countries from participations for filter options.
 */
export function getCountryFilterOptions(
  participations: Participation[],
  countryMap: Record<string, Country>
): { value: string; label: string }[] {
  const uniqueCountries = new Set(
    participations.map((p) => p.country_id).filter(Boolean)
  );
  return Array.from(uniqueCountries)
    .map((countryId) => ({
      value: countryId,
      label: countryMap[countryId]?.name ?? countryId,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
