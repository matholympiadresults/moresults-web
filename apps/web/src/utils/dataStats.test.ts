import { describe, it, expect } from "vitest";
import {
  countParticipationsBySource,
  collectYearsBySource,
  formatYearRanges,
  formatYearsBySource,
  countAwards,
  getYearRange,
  calculateDataStats,
} from "./dataStats";
import type { Competition, Participation, TeamParticipation, Database } from "@/schemas/base";
import { Source, Award } from "@/schemas/base";

// Helper factories
const createCompetition = (source: Source, year: number, id?: string): Competition => ({
  id: id ?? `${source}-${year}`,
  source,
  year,
  edition: null,
  host_country_id: null,
  num_problems: 6,
  max_score_per_problem: 7,
});

const createParticipation = (competitionId: string, award: Award | null = null): Participation => ({
  id: `${competitionId}-person-1`,
  competition_id: competitionId,
  person_id: "person-1",
  country_id: "country-usa",
  problem_scores: [7, 7, 7, 7, 7, 7],
  total: 42,
  rank: null,
  regional_rank: null,
  award,
  extra_awards: null,
  source_contestant_id: null,
});

describe("countParticipationsBySource", () => {
  it("initializes all sources to 0", () => {
    const result = countParticipationsBySource([], {});

    expect(result[Source.IMO]).toBe(0);
    expect(result[Source.EGMO]).toBe(0);
    expect(result[Source.MEMO]).toBe(0);
    expect(result[Source.RMM]).toBe(0);
    expect(result[Source.APMO]).toBe(0);
    expect(result[Source.BMO]).toBe(0);
    expect(result[Source.PAMO]).toBe(0);
    expect(result[Source.BALTICWAY]).toBe(0);
  });

  it("counts participations correctly by source", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2020": createCompetition(Source.IMO, 2020),
      "IMO-2021": createCompetition(Source.IMO, 2021),
      "EGMO-2020": createCompetition(Source.EGMO, 2020),
    };

    const participations: Participation[] = [
      createParticipation("IMO-2020"),
      createParticipation("IMO-2020"),
      createParticipation("IMO-2021"),
      createParticipation("EGMO-2020"),
    ];

    const result = countParticipationsBySource(participations, competitions);

    expect(result[Source.IMO]).toBe(3);
    expect(result[Source.EGMO]).toBe(1);
    expect(result[Source.MEMO]).toBe(0);
  });

  it("ignores participations with missing competition", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2020": createCompetition(Source.IMO, 2020),
    };

    const participations: Participation[] = [
      createParticipation("IMO-2020"),
      createParticipation("UNKNOWN-COMP"),
    ];

    const result = countParticipationsBySource(participations, competitions);

    expect(result[Source.IMO]).toBe(1);
  });

  it("counts team participations when provided", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2020": createCompetition(Source.IMO, 2020),
      "BALTICWAY-2024": createCompetition(Source.BALTICWAY, 2024, "BALTICWAY-2024"),
    };

    const participations: Participation[] = [createParticipation("IMO-2020")];

    const teamParticipations: TeamParticipation[] = [
      {
        id: "BALTICWAY-2024-country-est",
        competition_id: "BALTICWAY-2024",
        country_id: "country-est",
        problem_scores: [5, 5, 5],
        total: 15,
        rank: 1,
      },
      {
        id: "BALTICWAY-2024-country-lva",
        competition_id: "BALTICWAY-2024",
        country_id: "country-lva",
        problem_scores: [4, 5, 3],
        total: 12,
        rank: 2,
      },
    ];

    const result = countParticipationsBySource(participations, competitions, teamParticipations);

    expect(result[Source.IMO]).toBe(1);
    expect(result[Source.BALTICWAY]).toBe(2);
  });

  it("works without team participations (backwards compatible)", () => {
    const competitions: Record<string, Competition> = {
      "IMO-2020": createCompetition(Source.IMO, 2020),
    };

    const participations: Participation[] = [createParticipation("IMO-2020")];

    const result = countParticipationsBySource(participations, competitions);

    expect(result[Source.IMO]).toBe(1);
    expect(result[Source.BALTICWAY]).toBe(0);
  });
});

describe("collectYearsBySource", () => {
  it("returns empty object for empty competitions", () => {
    const result = collectYearsBySource([]);

    expect(Object.keys(result)).toHaveLength(0);
  });

  it("collects years correctly by source", () => {
    const competitions: Competition[] = [
      createCompetition(Source.IMO, 2020),
      createCompetition(Source.IMO, 2021),
      createCompetition(Source.IMO, 2022),
      createCompetition(Source.EGMO, 2020),
      createCompetition(Source.EGMO, 2021),
    ];

    const result = collectYearsBySource(competitions);

    expect(result[Source.IMO]).toEqual(new Set([2020, 2021, 2022]));
    expect(result[Source.EGMO]).toEqual(new Set([2020, 2021]));
    expect(result[Source.MEMO]).toBeUndefined();
  });

  it("handles duplicate years correctly", () => {
    const competitions: Competition[] = [
      createCompetition(Source.IMO, 2020, "IMO-2020-1"),
      createCompetition(Source.IMO, 2020, "IMO-2020-2"),
    ];

    const result = collectYearsBySource(competitions);

    expect(result[Source.IMO]).toEqual(new Set([2020]));
  });
});

describe("formatYearRanges", () => {
  it("returns empty string for empty set", () => {
    const result = formatYearRanges(new Set());

    expect(result).toBe("");
  });

  it("formats single year", () => {
    const result = formatYearRanges(new Set([2020]));

    expect(result).toBe("2020");
  });

  it("formats consecutive years as range", () => {
    const result = formatYearRanges(new Set([2020, 2021, 2022]));

    expect(result).toBe("2020-2022");
  });

  it("formats non-consecutive years with gap", () => {
    const result = formatYearRanges(new Set([2016, 2017, 2018, 2020, 2021]));

    expect(result).toBe("2016-2018, 2020-2021");
  });

  it("handles multiple gaps", () => {
    const result = formatYearRanges(new Set([2010, 2012, 2014, 2015, 2016, 2020]));

    expect(result).toBe("2010, 2012, 2014-2016, 2020");
  });

  it("handles single years between ranges", () => {
    const result = formatYearRanges(new Set([2018, 2020, 2021, 2022, 2024]));

    expect(result).toBe("2018, 2020-2022, 2024");
  });

  it("handles unordered input", () => {
    const result = formatYearRanges(new Set([2022, 2020, 2021]));

    expect(result).toBe("2020-2022");
  });
});

describe("formatYearsBySource", () => {
  it("formats years for each source", () => {
    const yearSets: Record<string, Set<number>> = {
      [Source.IMO]: new Set([2020, 2021, 2022]),
      [Source.EGMO]: new Set([2020, 2022]),
    };

    const result = formatYearsBySource(yearSets);

    expect(result[Source.IMO]).toBe("2020-2022");
    expect(result[Source.EGMO]).toBe("2020, 2022");
  });

  it("handles empty year sets", () => {
    const yearSets: Record<string, Set<number>> = {
      [Source.IMO]: new Set(),
    };

    const result = formatYearsBySource(yearSets);

    expect(result[Source.IMO]).toBe("");
  });
});

describe("countAwards", () => {
  it("returns zeros for empty participations", () => {
    const result = countAwards([]);

    expect(result.awards[Award.GOLD]).toBe(0);
    expect(result.awards[Award.SILVER]).toBe(0);
    expect(result.awards[Award.BRONZE]).toBe(0);
    expect(result.awards[Award.HONOURABLE_MENTION]).toBe(0);
    expect(result.noAward).toBe(0);
  });

  it("counts awards correctly", () => {
    const participations: Participation[] = [
      createParticipation("comp-1", Award.GOLD),
      createParticipation("comp-2", Award.GOLD),
      createParticipation("comp-3", Award.SILVER),
      createParticipation("comp-4", Award.BRONZE),
      createParticipation("comp-5", Award.HONOURABLE_MENTION),
      createParticipation("comp-6", null),
    ];

    const result = countAwards(participations);

    expect(result.awards[Award.GOLD]).toBe(2);
    expect(result.awards[Award.SILVER]).toBe(1);
    expect(result.awards[Award.BRONZE]).toBe(1);
    expect(result.awards[Award.HONOURABLE_MENTION]).toBe(1);
    expect(result.noAward).toBe(1);
  });

  it("counts multiple no-award participations", () => {
    const participations: Participation[] = [
      createParticipation("comp-1", null),
      createParticipation("comp-2", null),
      createParticipation("comp-3", null),
    ];

    const result = countAwards(participations);

    expect(result.noAward).toBe(3);
  });
});

describe("getYearRange", () => {
  it("returns zeros for empty competitions", () => {
    const result = getYearRange([]);

    expect(result.minYear).toBe(0);
    expect(result.maxYear).toBe(0);
    expect(result.yearSpan).toBe(0);
  });

  it("calculates year range correctly", () => {
    const competitions: Competition[] = [
      createCompetition(Source.IMO, 2015),
      createCompetition(Source.IMO, 2020),
      createCompetition(Source.IMO, 2018),
    ];

    const result = getYearRange(competitions);

    expect(result.minYear).toBe(2015);
    expect(result.maxYear).toBe(2020);
    expect(result.yearSpan).toBe(6);
  });

  it("handles single competition", () => {
    const competitions: Competition[] = [createCompetition(Source.IMO, 2020)];

    const result = getYearRange(competitions);

    expect(result.minYear).toBe(2020);
    expect(result.maxYear).toBe(2020);
    expect(result.yearSpan).toBe(1);
  });
});

describe("calculateDataStats", () => {
  it("calculates all stats from database", () => {
    const database: Database = {
      version: "1.0.0",
      last_updated: "2024-01-15T12:00:00Z",
      countries: {
        "country-usa": { id: "country-usa", code: "USA", name: "United States" },
        "country-chn": { id: "country-chn", code: "CHN", name: "China" },
      },
      competitions: {
        "IMO-2020": createCompetition(Source.IMO, 2020),
        "IMO-2021": createCompetition(Source.IMO, 2021),
        "EGMO-2020": createCompetition(Source.EGMO, 2020),
      },
      people: {
        "person-1": {
          id: "person-1",
          name: "Alice",
          given_name: null,
          family_name: null,
          country_id: "country-usa",
          aliases: [],
          source_ids: {},
        },
      },
      participations: {
        p1: { ...createParticipation("IMO-2020", Award.GOLD), id: "p1" },
        p2: { ...createParticipation("IMO-2021", Award.SILVER), id: "p2" },
        p3: { ...createParticipation("EGMO-2020", null), id: "p3" },
      },
      team_participations: {},
    };

    const result = calculateDataStats(database);

    expect(result.countries).toBe(2);
    expect(result.competitions).toBe(3);
    expect(result.people).toBe(1);
    expect(result.participations).toBe(3);
    expect(result.byOlympiad[Source.IMO]).toBe(2);
    expect(result.byOlympiad[Source.EGMO]).toBe(1);
    expect(result.yearsByOlympiad[Source.IMO]).toBe("2020-2021");
    expect(result.yearsByOlympiad[Source.EGMO]).toBe("2020");
    expect(result.minYear).toBe(2020);
    expect(result.maxYear).toBe(2021);
    expect(result.yearSpan).toBe(2);
    expect(result.awards[Award.GOLD]).toBe(1);
    expect(result.awards[Award.SILVER]).toBe(1);
    expect(result.noAward).toBe(1);
    expect(result.lastUpdated).toBe("2024-01-15T12:00:00Z");
  });

  it("handles empty database", () => {
    const database: Database = {
      version: "1.0.0",
      last_updated: "2024-01-15T12:00:00Z",
      countries: {},
      competitions: {},
      people: {},
      participations: {},
      team_participations: {},
    };

    const result = calculateDataStats(database);

    expect(result.countries).toBe(0);
    expect(result.competitions).toBe(0);
    expect(result.people).toBe(0);
    expect(result.participations).toBe(0);
    expect(result.minYear).toBe(0);
    expect(result.maxYear).toBe(0);
    expect(result.yearSpan).toBe(0);
  });

  it("includes team participations in byOlympiad counts", () => {
    const database: Database = {
      version: "1.0.0",
      last_updated: "2024-01-15T12:00:00Z",
      countries: {
        "country-est": { id: "country-est", code: "EST", name: "Estonia" },
      },
      competitions: {
        "BALTICWAY-2024": createCompetition(Source.BALTICWAY, 2024, "BALTICWAY-2024"),
        "IMO-2024": createCompetition(Source.IMO, 2024, "IMO-2024"),
      },
      people: {},
      participations: {
        p1: { ...createParticipation("IMO-2024", Award.GOLD), id: "p1" },
      },
      team_participations: {
        tp1: {
          id: "tp1",
          competition_id: "BALTICWAY-2024",
          country_id: "country-est",
          problem_scores: [5, 5, 5],
          total: 15,
          rank: 1,
        },
        tp2: {
          id: "tp2",
          competition_id: "BALTICWAY-2024",
          country_id: "country-lva",
          problem_scores: [4, 5, 3],
          total: 12,
          rank: 2,
        },
      },
    };

    const result = calculateDataStats(database);

    expect(result.byOlympiad[Source.IMO]).toBe(1);
    expect(result.byOlympiad[Source.BALTICWAY]).toBe(2);
  });
});
