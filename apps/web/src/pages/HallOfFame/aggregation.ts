import type { Person, Participation, Competition, Country } from "@/schemas/base";
import { createEmptyAwardCounts, incrementAwardCounts } from "@/utils/statistics";

export interface HallOfFameRow {
  rank: number;
  personId: string;
  personName: string;
  countryId: string;
  countryCode: string | null;
  countryName: string;
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
  totalMedals: number;
  participations: number;
}

export interface AggregationInput {
  participations: Participation[];
  competitionMap: Record<string, Competition>;
  personMap: Record<string, Person>;
  countryMap: Record<string, Country>;
  selectedSource: string;
  selectedCountry: string;
}

export function aggregateHallOfFame({
  participations,
  competitionMap,
  personMap,
  countryMap,
  selectedSource,
  selectedCountry,
}: AggregationInput): HallOfFameRow[] {
  // Calculate medals per person
  const personStats = new Map<
    string,
    {
      gold: number;
      silver: number;
      bronze: number;
      hm: number;
      participations: number;
    }
  >();

  participations.forEach((p) => {
    const comp = competitionMap[p.competition_id];
    if (!comp) return;

    // Filter by source if selected
    if (selectedSource !== "all" && comp.source !== selectedSource) return;

    const stats = personStats.get(p.person_id) ?? {
      ...createEmptyAwardCounts(),
      participations: 0,
    };

    stats.participations++;
    incrementAwardCounts(stats, p.award);

    personStats.set(p.person_id, stats);
  });

  // Convert to rows and sort by gold, then silver, then bronze
  const result: HallOfFameRow[] = [];

  personStats.forEach((stats, personId) => {
    const person = personMap[personId];
    if (!person) return;

    // Only include people with at least one medal
    if (stats.gold + stats.silver + stats.bronze === 0) return;

    // Filter by country if selected
    if (selectedCountry !== "all" && person.country_id !== selectedCountry) return;

    result.push({
      rank: 0, // Will be set after sorting
      personId,
      personName: person.name,
      countryId: person.country_id,
      countryCode: countryMap[person.country_id]?.code ?? null,
      countryName: countryMap[person.country_id]?.name ?? person.country_id,
      gold: stats.gold,
      silver: stats.silver,
      bronze: stats.bronze,
      hm: stats.hm,
      totalMedals: stats.gold + stats.silver + stats.bronze,
      participations: stats.participations,
    });
  });

  // Sort by gold, then silver, then bronze
  result.sort((a, b) => {
    if (a.gold !== b.gold) return b.gold - a.gold;
    if (a.silver !== b.silver) return b.silver - a.silver;
    if (a.bronze !== b.bronze) return b.bronze - a.bronze;
    return b.hm - a.hm;
  });

  // Assign ranks
  result.forEach((row, index) => {
    row.rank = index + 1;
  });

  return result;
}
