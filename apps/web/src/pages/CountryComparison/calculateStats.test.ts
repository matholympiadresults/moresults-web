import { describe, it, expect } from "vitest";
import {
  calculateStats,
  filterStatsBySource,
  calculateTeamRanks,
  getAvailableSources,
  calculateTeamStats,
  filterTeamStatsBySource,
  calculateTeamRanksFromTeamParticipations,
} from "./calculateStats";
import { Award, Source } from "@/schemas/base";
import type { Participation, Competition, TeamParticipation } from "@/schemas/base";

// Helper to create a team participation
function createTeamParticipation(
  overrides: Partial<TeamParticipation> & {
    competition_id: string;
    country_id: string;
  }
): TeamParticipation {
  return {
    id: `${overrides.competition_id}-${overrides.country_id}`,
    problem_scores: [],
    total: 0,
    rank: null,
    ...overrides,
  };
}

// Helper to create a participation
function createParticipation(
  overrides: Partial<Participation> & {
    competition_id: string;
    country_id: string;
    person_id: string;
  }
): Participation {
  return {
    id: `${overrides.competition_id}-${overrides.person_id}`,
    problem_scores: [],
    total: 0,
    rank: null,
    regional_rank: null,
    award: null,
    extra_awards: null,
    source_contestant_id: null,
    ...overrides,
  };
}

// Helper to create a competition
function createCompetition(
  overrides: Partial<Competition> & { id: string; source: Source; year: number }
): Competition {
  return {
    edition: null,
    host_country_id: null,
    num_problems: 6,
    max_score_per_problem: 7,
    ...overrides,
  };
}

describe("calculateStats", () => {
  it("returns empty stats for empty participations", () => {
    const stats = calculateStats([], {}, "country-usa");

    expect(stats.gold).toBe(0);
    expect(stats.silver).toBe(0);
    expect(stats.bronze).toBe(0);
    expect(stats.hm).toBe(0);
    expect(stats.total).toBe(0);
    expect(stats.byYearAndSource.size).toBe(0);
  });

  it("counts medals correctly for a single country", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
    };

    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-1",
        award: Award.GOLD,
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-2",
        award: Award.SILVER,
        total: 35,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-3",
        award: Award.BRONZE,
        total: 28,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-4",
        award: Award.HONOURABLE_MENTION,
        total: 14,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-5",
        award: null,
        total: 7,
      }),
    ];

    const stats = calculateStats(participations, competitions, "country-usa");

    expect(stats.gold).toBe(1);
    expect(stats.silver).toBe(1);
    expect(stats.bronze).toBe(1);
    expect(stats.hm).toBe(1);
    expect(stats.total).toBe(5);
  });

  it("filters participations by country", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
    };

    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-1",
        award: Award.GOLD,
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-chn",
        person_id: "person-2",
        award: Award.GOLD,
        total: 42,
      }),
    ];

    const usaStats = calculateStats(participations, competitions, "country-usa");
    const chnStats = calculateStats(participations, competitions, "country-chn");

    expect(usaStats.gold).toBe(1);
    expect(usaStats.total).toBe(1);
    expect(chnStats.gold).toBe(1);
    expect(chnStats.total).toBe(1);
  });

  it("groups stats by year and source", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2022": createCompetition({ id: "IMO-2022", source: Source.IMO, year: 2022 }),
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
      "EGMO-2023": createCompetition({ id: "EGMO-2023", source: Source.EGMO, year: 2023 }),
    };

    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2022",
        country_id: "country-usa",
        person_id: "person-1",
        award: Award.GOLD,
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-2",
        award: Award.SILVER,
        total: 35,
      }),
      createParticipation({
        competition_id: "EGMO-2023",
        country_id: "country-usa",
        person_id: "person-3",
        award: Award.GOLD,
        total: 42,
      }),
    ];

    const stats = calculateStats(participations, competitions, "country-usa");

    expect(stats.byYearAndSource.size).toBe(3);
    expect(stats.byYearAndSource.has("2022-IMO")).toBe(true);
    expect(stats.byYearAndSource.has("2023-IMO")).toBe(true);
    expect(stats.byYearAndSource.has("2023-EGMO")).toBe(true);

    const imo2022 = stats.byYearAndSource.get("2022-IMO")!;
    expect(imo2022.gold).toBe(1);
    expect(imo2022.participants).toBe(1);
    expect(imo2022.totalScore).toBe(42);

    const imo2023 = stats.byYearAndSource.get("2023-IMO")!;
    expect(imo2023.silver).toBe(1);
    expect(imo2023.participants).toBe(1);
    expect(imo2023.totalScore).toBe(35);
  });

  it("accumulates scores correctly per year", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
    };

    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-1",
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-2",
        total: 35,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-3",
        total: 28,
      }),
    ];

    const stats = calculateStats(participations, competitions, "country-usa");
    const yearStats = stats.byYearAndSource.get("2023-IMO")!;

    expect(yearStats.participants).toBe(3);
    expect(yearStats.totalScore).toBe(42 + 35 + 28);
  });

  it("tracks participation by source", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
      "EGMO-2023": createCompetition({ id: "EGMO-2023", source: Source.EGMO, year: 2023 }),
    };

    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-1",
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-2",
        total: 35,
      }),
      createParticipation({
        competition_id: "EGMO-2023",
        country_id: "country-usa",
        person_id: "person-3",
        total: 42,
      }),
    ];

    const stats = calculateStats(participations, competitions, "country-usa");

    expect(stats.bySource[Source.IMO]).toBe(2);
    expect(stats.bySource[Source.EGMO]).toBe(1);
    expect(stats.bySource[Source.MEMO]).toBe(0);
  });

  it("handles missing competition gracefully", () => {
    const competitions: Record<string, Competition> = {};

    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-1",
        award: Award.GOLD,
        total: 42,
      }),
    ];

    const stats = calculateStats(participations, competitions, "country-usa");

    // Participation is still counted in total
    expect(stats.total).toBe(1);
    // But not in medals since competition lookup failed
    expect(stats.gold).toBe(0);
    expect(stats.byYearAndSource.size).toBe(0);
  });
});

describe("filterStatsBySource", () => {
  it("returns zeros for null stats", () => {
    const result = filterStatsBySource(null, Source.IMO);

    expect(result).toEqual({ gold: 0, silver: 0, bronze: 0, hm: 0, total: 0 });
  });

  it("filters stats by source correctly", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
      "EGMO-2023": createCompetition({ id: "EGMO-2023", source: Source.EGMO, year: 2023 }),
    };

    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-1",
        award: Award.GOLD,
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-usa",
        person_id: "person-2",
        award: Award.SILVER,
        total: 35,
      }),
      createParticipation({
        competition_id: "EGMO-2023",
        country_id: "country-usa",
        person_id: "person-3",
        award: Award.GOLD,
        total: 42,
      }),
    ];

    const stats = calculateStats(participations, competitions, "country-usa");

    const imoFiltered = filterStatsBySource(stats, Source.IMO);
    expect(imoFiltered.gold).toBe(1);
    expect(imoFiltered.silver).toBe(1);
    expect(imoFiltered.total).toBe(2);

    const egmoFiltered = filterStatsBySource(stats, Source.EGMO);
    expect(egmoFiltered.gold).toBe(1);
    expect(egmoFiltered.silver).toBe(0);
    expect(egmoFiltered.total).toBe(1);

    const memoFiltered = filterStatsBySource(stats, Source.MEMO);
    expect(memoFiltered).toEqual({ gold: 0, silver: 0, bronze: 0, hm: 0, total: 0 });
  });
});

describe("calculateTeamRanks", () => {
  it("returns empty map for empty participations", () => {
    const ranks = calculateTeamRanks([], {});

    expect(ranks.size).toBe(0);
  });

  it("ranks countries by total score", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
    };

    const participations: Participation[] = [
      // Country A: total = 42 + 40 = 82
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-a",
        person_id: "person-1",
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-a",
        person_id: "person-2",
        total: 40,
      }),
      // Country B: total = 35 + 35 = 70
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-b",
        person_id: "person-3",
        total: 35,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-b",
        person_id: "person-4",
        total: 35,
      }),
      // Country C: total = 28 + 28 = 56
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-c",
        person_id: "person-5",
        total: 28,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-c",
        person_id: "person-6",
        total: 28,
      }),
    ];

    const ranks = calculateTeamRanks(participations, competitions);
    const imo2023Ranks = ranks.get("2023-IMO")!;

    expect(imo2023Ranks.get("country-a")).toBe(1);
    expect(imo2023Ranks.get("country-b")).toBe(2);
    expect(imo2023Ranks.get("country-c")).toBe(3);
  });

  it("handles multiple competitions separately", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2022": createCompetition({ id: "IMO-2022", source: Source.IMO, year: 2022 }),
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
    };

    const participations: Participation[] = [
      // 2022: A wins
      createParticipation({
        competition_id: "IMO-2022",
        country_id: "country-a",
        person_id: "person-1",
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2022",
        country_id: "country-b",
        person_id: "person-2",
        total: 35,
      }),
      // 2023: B wins
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-a",
        person_id: "person-1",
        total: 30,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-b",
        person_id: "person-2",
        total: 42,
      }),
    ];

    const ranks = calculateTeamRanks(participations, competitions);

    const imo2022Ranks = ranks.get("2022-IMO")!;
    expect(imo2022Ranks.get("country-a")).toBe(1);
    expect(imo2022Ranks.get("country-b")).toBe(2);

    const imo2023Ranks = ranks.get("2023-IMO")!;
    expect(imo2023Ranks.get("country-a")).toBe(2);
    expect(imo2023Ranks.get("country-b")).toBe(1);
  });

  it("handles missing competition gracefully", () => {
    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-a",
        person_id: "person-1",
        total: 42,
      }),
    ];

    const ranks = calculateTeamRanks(participations, {});

    expect(ranks.size).toBe(0);
  });
});

describe("getAvailableSources", () => {
  const sourceOptions = [
    { value: Source.IMO, label: "IMO" },
    { value: Source.EGMO, label: "EGMO" },
    { value: Source.MEMO, label: "MEMO" },
  ];

  it("returns empty array when stats1 is null", () => {
    const stats2 = calculateStats([], {}, "country-b");
    const result = getAvailableSources(null, stats2, sourceOptions);

    expect(result).toEqual([]);
  });

  it("returns empty array when stats2 is null", () => {
    const stats1 = calculateStats([], {}, "country-a");
    const result = getAvailableSources(stats1, null, sourceOptions);

    expect(result).toEqual([]);
  });

  it("returns intersection of sources both countries participated in", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
      "EGMO-2023": createCompetition({ id: "EGMO-2023", source: Source.EGMO, year: 2023 }),
      "MEMO-2023": createCompetition({ id: "MEMO-2023", source: Source.MEMO, year: 2023 }),
    };

    // Country A: IMO and EGMO
    const participationsA: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-a",
        person_id: "person-1",
        total: 42,
      }),
      createParticipation({
        competition_id: "EGMO-2023",
        country_id: "country-a",
        person_id: "person-2",
        total: 35,
      }),
    ];

    // Country B: IMO and MEMO
    const participationsB: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-b",
        person_id: "person-3",
        total: 40,
      }),
      createParticipation({
        competition_id: "MEMO-2023",
        country_id: "country-b",
        person_id: "person-4",
        total: 30,
      }),
    ];

    const allParticipations = [...participationsA, ...participationsB];
    const stats1 = calculateStats(allParticipations, competitions, "country-a");
    const stats2 = calculateStats(allParticipations, competitions, "country-b");

    const result = getAvailableSources(stats1, stats2, sourceOptions);

    // Only IMO is common
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(Source.IMO);
  });

  it("preserves order from sourceOptions", () => {
    const competitions: Record<string, Competition> = {
      "EGMO-2023": createCompetition({ id: "EGMO-2023", source: Source.EGMO, year: 2023 }),
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
    };

    const participations: Participation[] = [
      createParticipation({
        competition_id: "EGMO-2023",
        country_id: "country-a",
        person_id: "person-1",
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-a",
        person_id: "person-2",
        total: 35,
      }),
      createParticipation({
        competition_id: "EGMO-2023",
        country_id: "country-b",
        person_id: "person-3",
        total: 40,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-b",
        person_id: "person-4",
        total: 30,
      }),
    ];

    const stats1 = calculateStats(participations, competitions, "country-a");
    const stats2 = calculateStats(participations, competitions, "country-b");

    const result = getAvailableSources(stats1, stats2, sourceOptions);

    // Should be in same order as sourceOptions (IMO before EGMO)
    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(Source.IMO);
    expect(result[1].value).toBe(Source.EGMO);
  });

  it("returns empty array when no common sources", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
      "EGMO-2023": createCompetition({ id: "EGMO-2023", source: Source.EGMO, year: 2023 }),
    };

    const participationsA: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-a",
        person_id: "person-1",
        total: 42,
      }),
    ];

    const participationsB: Participation[] = [
      createParticipation({
        competition_id: "EGMO-2023",
        country_id: "country-b",
        person_id: "person-2",
        total: 35,
      }),
    ];

    const allParticipations = [...participationsA, ...participationsB];
    const stats1 = calculateStats(allParticipations, competitions, "country-a");
    const stats2 = calculateStats(allParticipations, competitions, "country-b");

    const result = getAvailableSources(stats1, stats2, sourceOptions);

    expect(result).toEqual([]);
  });

  it("includes team competition sources from teamStats", () => {
    const sourceOptionsWithBW = [
      { value: Source.IMO, label: "IMO" },
      { value: Source.BALTICWAY, label: "Baltic Way" },
    ];

    const competitions: Record<string, Competition> = {
      "IMO-2023": createCompetition({ id: "IMO-2023", source: Source.IMO, year: 2023 }),
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
    };

    // Both countries have IMO individual participations
    const participations: Participation[] = [
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-a",
        person_id: "person-1",
        total: 42,
      }),
      createParticipation({
        competition_id: "IMO-2023",
        country_id: "country-b",
        person_id: "person-2",
        total: 35,
      }),
    ];

    const stats1 = calculateStats(participations, competitions, "country-a");
    const stats2 = calculateStats(participations, competitions, "country-b");

    // Both countries have Baltic Way team participations
    const teamStats1 = calculateTeamStats(
      [
        createTeamParticipation({
          competition_id: "BALTICWAY-2023",
          country_id: "country-a",
          total: 80,
          rank: 1,
        }),
      ],
      competitions,
      "country-a"
    );
    const teamStats2 = calculateTeamStats(
      [
        createTeamParticipation({
          competition_id: "BALTICWAY-2023",
          country_id: "country-b",
          total: 70,
          rank: 2,
        }),
      ],
      competitions,
      "country-b"
    );

    const result = getAvailableSources(stats1, stats2, sourceOptionsWithBW, teamStats1, teamStats2);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(Source.IMO);
    expect(result[1].value).toBe(Source.BALTICWAY);
  });
});

describe("calculateTeamStats", () => {
  it("returns empty stats for empty team participations", () => {
    const stats = calculateTeamStats([], {}, "country-a");

    expect(stats.byYearAndSource.size).toBe(0);
    expect(stats.bySource[Source.BALTICWAY]).toBe(0);
  });

  it("calculates stats for a country's team participations", () => {
    const competitions: Record<string, Competition> = {
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
      "BALTICWAY-2024": createCompetition({
        id: "BALTICWAY-2024",
        source: Source.BALTICWAY,
        year: 2024,
      }),
    };

    const teamParticipations: TeamParticipation[] = [
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-est",
        total: 85,
        rank: 3,
      }),
      createTeamParticipation({
        competition_id: "BALTICWAY-2024",
        country_id: "country-est",
        total: 90,
        rank: 1,
      }),
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-lva",
        total: 70,
        rank: 5,
      }),
    ];

    const stats = calculateTeamStats(teamParticipations, competitions, "country-est");

    expect(stats.bySource[Source.BALTICWAY]).toBe(2);
    expect(stats.byYearAndSource.size).toBe(2);

    const y2023 = stats.byYearAndSource.get("2023-BALTICWAY")!;
    expect(y2023.totalScore).toBe(85);
    expect(y2023.rank).toBe(3);
    expect(y2023.source).toBe(Source.BALTICWAY);

    const y2024 = stats.byYearAndSource.get("2024-BALTICWAY")!;
    expect(y2024.totalScore).toBe(90);
    expect(y2024.rank).toBe(1);
  });

  it("filters by country", () => {
    const competitions: Record<string, Competition> = {
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
    };

    const teamParticipations: TeamParticipation[] = [
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-est",
        total: 85,
        rank: 1,
      }),
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-lva",
        total: 70,
        rank: 2,
      }),
    ];

    const estStats = calculateTeamStats(teamParticipations, competitions, "country-est");
    const lvaStats = calculateTeamStats(teamParticipations, competitions, "country-lva");

    expect(estStats.bySource[Source.BALTICWAY]).toBe(1);
    expect(lvaStats.bySource[Source.BALTICWAY]).toBe(1);
    expect(estStats.byYearAndSource.get("2023-BALTICWAY")!.totalScore).toBe(85);
    expect(lvaStats.byYearAndSource.get("2023-BALTICWAY")!.totalScore).toBe(70);
  });

  it("ignores team participations with missing competition", () => {
    const stats = calculateTeamStats(
      [
        createTeamParticipation({
          competition_id: "UNKNOWN-2023",
          country_id: "country-est",
          total: 50,
          rank: 1,
        }),
      ],
      {},
      "country-est"
    );

    expect(stats.byYearAndSource.size).toBe(0);
    expect(stats.bySource[Source.BALTICWAY]).toBe(0);
  });
});

describe("filterTeamStatsBySource", () => {
  it("returns defaults for null stats", () => {
    const result = filterTeamStatsBySource(null, Source.BALTICWAY);

    expect(result).toEqual({
      participations: 0,
      bestRank: null,
      avgRank: null,
      avgScore: null,
    });
  });

  it("returns defaults when no entries match source", () => {
    const competitions: Record<string, Competition> = {
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
    };

    const stats = calculateTeamStats(
      [
        createTeamParticipation({
          competition_id: "BALTICWAY-2023",
          country_id: "country-est",
          total: 85,
          rank: 1,
        }),
      ],
      competitions,
      "country-est"
    );

    const result = filterTeamStatsBySource(stats, Source.IMO);

    expect(result).toEqual({
      participations: 0,
      bestRank: null,
      avgRank: null,
      avgScore: null,
    });
  });

  it("calculates stats correctly for matching source", () => {
    const competitions: Record<string, Competition> = {
      "BALTICWAY-2022": createCompetition({
        id: "BALTICWAY-2022",
        source: Source.BALTICWAY,
        year: 2022,
      }),
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
      "BALTICWAY-2024": createCompetition({
        id: "BALTICWAY-2024",
        source: Source.BALTICWAY,
        year: 2024,
      }),
    };

    const stats = calculateTeamStats(
      [
        createTeamParticipation({
          competition_id: "BALTICWAY-2022",
          country_id: "country-est",
          total: 80,
          rank: 4,
        }),
        createTeamParticipation({
          competition_id: "BALTICWAY-2023",
          country_id: "country-est",
          total: 85,
          rank: 2,
        }),
        createTeamParticipation({
          competition_id: "BALTICWAY-2024",
          country_id: "country-est",
          total: 90,
          rank: 1,
        }),
      ],
      competitions,
      "country-est"
    );

    const result = filterTeamStatsBySource(stats, Source.BALTICWAY);

    expect(result.participations).toBe(3);
    expect(result.bestRank).toBe(1);
    // avgRank = (4 + 2 + 1) / 3 = 2.333... rounded to 2.3
    expect(result.avgRank).toBe(2.3);
    // avgScore = (80 + 85 + 90) / 3 = 85
    expect(result.avgScore).toBe(85);
  });

  it("handles null ranks", () => {
    const competitions: Record<string, Competition> = {
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
      "BALTICWAY-2024": createCompetition({
        id: "BALTICWAY-2024",
        source: Source.BALTICWAY,
        year: 2024,
      }),
    };

    const stats = calculateTeamStats(
      [
        createTeamParticipation({
          competition_id: "BALTICWAY-2023",
          country_id: "country-est",
          total: 80,
          rank: null,
        }),
        createTeamParticipation({
          competition_id: "BALTICWAY-2024",
          country_id: "country-est",
          total: 90,
          rank: 3,
        }),
      ],
      competitions,
      "country-est"
    );

    const result = filterTeamStatsBySource(stats, Source.BALTICWAY);

    expect(result.participations).toBe(2);
    // Only one rank available
    expect(result.bestRank).toBe(3);
    expect(result.avgRank).toBe(3);
    // avgScore = (80 + 90) / 2 = 85
    expect(result.avgScore).toBe(85);
  });
});

describe("calculateTeamRanksFromTeamParticipations", () => {
  it("returns empty map for empty team participations", () => {
    const ranks = calculateTeamRanksFromTeamParticipations([], {});

    expect(ranks.size).toBe(0);
  });

  it("maps ranks from team participations by year-source", () => {
    const competitions: Record<string, Competition> = {
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
    };

    const teamParticipations: TeamParticipation[] = [
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-est",
        total: 90,
        rank: 1,
      }),
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-lva",
        total: 80,
        rank: 2,
      }),
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-ltu",
        total: 70,
        rank: 3,
      }),
    ];

    const ranks = calculateTeamRanksFromTeamParticipations(teamParticipations, competitions);

    expect(ranks.size).toBe(1);
    const bw2023 = ranks.get("2023-BALTICWAY")!;
    expect(bw2023.get("country-est")).toBe(1);
    expect(bw2023.get("country-lva")).toBe(2);
    expect(bw2023.get("country-ltu")).toBe(3);
  });

  it("handles multiple years", () => {
    const competitions: Record<string, Competition> = {
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
      "BALTICWAY-2024": createCompetition({
        id: "BALTICWAY-2024",
        source: Source.BALTICWAY,
        year: 2024,
      }),
    };

    const teamParticipations: TeamParticipation[] = [
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-est",
        total: 90,
        rank: 1,
      }),
      createTeamParticipation({
        competition_id: "BALTICWAY-2024",
        country_id: "country-est",
        total: 85,
        rank: 2,
      }),
      createTeamParticipation({
        competition_id: "BALTICWAY-2024",
        country_id: "country-lva",
        total: 90,
        rank: 1,
      }),
    ];

    const ranks = calculateTeamRanksFromTeamParticipations(teamParticipations, competitions);

    expect(ranks.size).toBe(2);
    expect(ranks.get("2023-BALTICWAY")!.get("country-est")).toBe(1);
    expect(ranks.get("2024-BALTICWAY")!.get("country-est")).toBe(2);
    expect(ranks.get("2024-BALTICWAY")!.get("country-lva")).toBe(1);
  });

  it("skips entries with null rank", () => {
    const competitions: Record<string, Competition> = {
      "BALTICWAY-2023": createCompetition({
        id: "BALTICWAY-2023",
        source: Source.BALTICWAY,
        year: 2023,
      }),
    };

    const teamParticipations: TeamParticipation[] = [
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-est",
        total: 90,
        rank: 1,
      }),
      createTeamParticipation({
        competition_id: "BALTICWAY-2023",
        country_id: "country-lva",
        total: 80,
        rank: null,
      }),
    ];

    const ranks = calculateTeamRanksFromTeamParticipations(teamParticipations, competitions);

    const bw2023 = ranks.get("2023-BALTICWAY")!;
    expect(bw2023.get("country-est")).toBe(1);
    expect(bw2023.has("country-lva")).toBe(false);
  });

  it("skips entries with missing competition", () => {
    const teamParticipations: TeamParticipation[] = [
      createTeamParticipation({
        competition_id: "UNKNOWN-2023",
        country_id: "country-est",
        total: 90,
        rank: 1,
      }),
    ];

    const ranks = calculateTeamRanksFromTeamParticipations(teamParticipations, {});

    expect(ranks.size).toBe(0);
  });
});
