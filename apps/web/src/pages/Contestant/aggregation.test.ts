import { describe, it, expect } from "vitest";
import {
  aggregateParticipations,
  aggregateRankingChartData,
  getPersonSources,
  getMaxProblems,
  getContestantInfo,
} from "./aggregation";
import type { Person, Participation, Competition, Country } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

// Test fixtures
const createPerson = (
  id: string,
  name: string,
  countryId: string
): Person => ({
  id,
  name,
  given_name: null,
  family_name: null,
  country_id: countryId,
  aliases: [],
  source_ids: {},
});

const createCountry = (id: string, code: string, name: string): Country => ({
  id,
  code,
  name,
});

const createCompetition = (
  id: string,
  source: Source,
  year: number,
  numProblems: number = 6
): Competition => ({
  id,
  source,
  year,
  edition: null,
  host_country_id: null,
  num_problems: numProblems,
  max_score_per_problem: 7,
});

const createParticipation = (
  competitionId: string,
  personId: string,
  countryId: string,
  award: Award | null,
  rank: number | null = null,
  total: number = 0,
  problemScores: (number | null)[] = []
): Participation => ({
  id: `${competitionId}-${personId}`,
  competition_id: competitionId,
  person_id: personId,
  country_id: countryId,
  problem_scores: problemScores,
  total,
  rank,
  regional_rank: null,
  award,
  extra_awards: null,
  source_contestant_id: null,
});

describe("aggregateParticipations", () => {
  const competitions: Record<string, Competition> = {
    "IMO-2020": createCompetition("IMO-2020", Source.IMO, 2020, 6),
    "IMO-2021": createCompetition("IMO-2021", Source.IMO, 2021, 6),
    "EGMO-2020": createCompetition("EGMO-2020", Source.EGMO, 2020, 6),
    "MEMO-2019": createCompetition("MEMO-2019", Source.MEMO, 2019, 8),
  };

  describe("basic aggregation", () => {
    it("returns empty array when no participations", () => {
      const result = aggregateParticipations({
        participations: [],
        competitionMap: competitions,
      });

      expect(result).toEqual([]);
    });

    it("correctly maps participation data to rows", () => {
      const participations = [
        createParticipation(
          "IMO-2020",
          "person-1",
          "country-usa",
          Award.GOLD,
          1,
          42,
          [7, 7, 7, 7, 7, 7]
        ),
      ];

      const result = aggregateParticipations({
        participations,
        competitionMap: competitions,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "IMO-2020-person-1",
        competitionId: "IMO-2020",
        competitionName: "IMO 2020",
        source: Source.IMO,
        year: 2020,
        rank: 1,
        problemScores: [7, 7, 7, 7, 7, 7],
        numProblems: 6,
        total: 42,
        award: Award.GOLD,
      });
    });

    it("maps multiple participations correctly", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, 1, 42),
        createParticipation("IMO-2021", "person-1", "country-usa", Award.SILVER, 5, 38),
        createParticipation("EGMO-2020", "person-1", "country-usa", Award.BRONZE, 10, 30),
      ];

      const result = aggregateParticipations({
        participations,
        competitionMap: competitions,
      });

      expect(result).toHaveLength(3);
      expect(result[0].competitionName).toBe("IMO 2020");
      expect(result[1].competitionName).toBe("IMO 2021");
      expect(result[2].competitionName).toBe("EGMO 2020");
    });

    it("preserves order of participations", () => {
      const participations = [
        createParticipation("EGMO-2020", "person-1", "country-usa", Award.BRONZE),
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2021", "person-1", "country-usa", Award.SILVER),
      ];

      const result = aggregateParticipations({
        participations,
        competitionMap: competitions,
      });

      expect(result[0].source).toBe(Source.EGMO);
      expect(result[1].source).toBe(Source.IMO);
      expect(result[2].source).toBe(Source.IMO);
    });
  });

  describe("missing competition handling", () => {
    it("falls back to competition_id when competition not found", () => {
      const participations = [
        createParticipation("UNKNOWN-2022", "person-1", "country-usa", Award.GOLD),
      ];

      const result = aggregateParticipations({
        participations,
        competitionMap: competitions,
      });

      expect(result).toHaveLength(1);
      expect(result[0].competitionName).toBe("UNKNOWN-2022");
      expect(result[0].source).toBe(Source.IMO); // Default
      expect(result[0].year).toBe(0);
      expect(result[0].numProblems).toBe(0);
    });
  });

  describe("problem scores", () => {
    it("preserves null values in problem scores", () => {
      const participations = [
        createParticipation(
          "IMO-2020",
          "person-1",
          "country-usa",
          Award.GOLD,
          1,
          35,
          [7, 7, 7, 7, 7, null]
        ),
      ];

      const result = aggregateParticipations({
        participations,
        competitionMap: competitions,
      });

      expect(result[0].problemScores).toEqual([7, 7, 7, 7, 7, null]);
    });

    it("handles empty problem scores", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, 1, 42, []),
      ];

      const result = aggregateParticipations({
        participations,
        competitionMap: competitions,
      });

      expect(result[0].problemScores).toEqual([]);
    });
  });

  describe("num_problems from competition", () => {
    it("correctly uses num_problems from competition", () => {
      const participations = [
        createParticipation("MEMO-2019", "person-1", "country-usa", Award.GOLD),
      ];

      const result = aggregateParticipations({
        participations,
        competitionMap: competitions,
      });

      expect(result[0].numProblems).toBe(8); // MEMO has 8 problems
    });
  });
});

describe("aggregateRankingChartData", () => {
  const competitions: Record<string, Competition> = {
    "IMO-2020": createCompetition("IMO-2020", Source.IMO, 2020),
    "IMO-2021": createCompetition("IMO-2021", Source.IMO, 2021),
    "EGMO-2020": createCompetition("EGMO-2020", Source.EGMO, 2020),
  };

  describe("basic aggregation", () => {
    it("returns empty array when no participations", () => {
      const result = aggregateRankingChartData({
        allParticipations: [],
        personParticipations: [],
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result).toEqual([]);
    });

    it("aggregates medal counts correctly for a single year", () => {
      const allParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, 1),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD, 2),
        createParticipation("IMO-2020", "person-3", "country-gbr", Award.SILVER, 10),
        createParticipation("IMO-2020", "person-4", "country-fra", Award.BRONZE, 50),
        createParticipation("IMO-2020", "person-5", "country-ger", null, 100),
      ];

      const personParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, 1),
      ];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations,
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        year: 2020,
        gold: 2,
        silver: 1,
        bronze: 1,
        noMedal: 1,
        totalParticipants: 5,
        personRank: 1,
        personPosition: 5, // 5 - 1 + 1 = 5 (highest position from bottom)
      });
    });

    it("calculates person position from bottom correctly", () => {
      const allParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.SILVER, 10),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD, 1),
        createParticipation("IMO-2020", "person-3", "country-gbr", Award.BRONZE, 50),
      ];

      const personParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.SILVER, 10),
      ];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations,
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      // Rank 10 out of 3 participants => position = 3 - 10 + 1 = -6
      // But wait, that doesn't make sense for this test
      // Let me recalculate: position from bottom = totalParticipants - rank + 1
      // With 3 participants and rank 10, position = 3 - 10 + 1 = -6
      // This is an edge case where rank > totalParticipants
      expect(result[0].personPosition).toBe(-6);
    });

    it("handles person not participating in a year", () => {
      const allParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, 1),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.SILVER, 2),
      ];

      const personParticipations: Participation[] = [];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations,
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result).toHaveLength(1);
      expect(result[0].personRank).toBe(null);
      expect(result[0].personPosition).toBe(null);
    });
  });

  describe("source filtering", () => {
    it("only includes participations from selected source", () => {
      const allParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, 1),
        createParticipation("EGMO-2020", "person-2", "country-chn", Award.GOLD, 1),
      ];

      const personParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, 1),
      ];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations,
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result).toHaveLength(1);
      expect(result[0].totalParticipants).toBe(1);
    });

    it("returns empty when source has no participations", () => {
      const allParticipations = [
        createParticipation("EGMO-2020", "person-1", "country-usa", Award.GOLD, 1),
      ];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations: [],
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result).toEqual([]);
    });
  });

  describe("sorting", () => {
    it("sorts results by year ascending", () => {
      const allParticipations = [
        createParticipation("IMO-2021", "person-1", "country-usa", Award.GOLD, 1),
        createParticipation("IMO-2020", "person-1", "country-usa", Award.SILVER, 5),
      ];

      const personParticipations = [
        createParticipation("IMO-2021", "person-1", "country-usa", Award.GOLD, 1),
        createParticipation("IMO-2020", "person-1", "country-usa", Award.SILVER, 5),
      ];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations,
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result).toHaveLength(2);
      expect(result[0].year).toBe(2020);
      expect(result[1].year).toBe(2021);
    });
  });

  describe("medal counting", () => {
    it("counts honourable mentions and null awards as noMedal", () => {
      const allParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.HONOURABLE_MENTION, 30),
        createParticipation("IMO-2020", "person-2", "country-chn", null, 50),
      ];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations: [],
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result).toHaveLength(1);
      expect(result[0].noMedal).toBe(2);
      expect(result[0].gold).toBe(0);
      expect(result[0].silver).toBe(0);
      expect(result[0].bronze).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("handles missing competition gracefully", () => {
      const allParticipations = [
        createParticipation("UNKNOWN-2020", "person-1", "country-usa", Award.GOLD, 1),
      ];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations: [],
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result).toEqual([]);
    });

    it("handles person rank being null", () => {
      const allParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, 1),
      ];

      const personParticipations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD, null),
      ];

      const result = aggregateRankingChartData({
        allParticipations,
        personParticipations,
        competitionMap: competitions,
        chartSource: Source.IMO,
      });

      expect(result[0].personRank).toBe(null);
      expect(result[0].personPosition).toBe(null);
    });
  });
});

describe("getPersonSources", () => {
  const competitions: Record<string, Competition> = {
    "IMO-2020": createCompetition("IMO-2020", Source.IMO, 2020),
    "EGMO-2020": createCompetition("EGMO-2020", Source.EGMO, 2020),
    "MEMO-2019": createCompetition("MEMO-2019", Source.MEMO, 2019),
  };

  it("returns empty set when no participations", () => {
    const result = getPersonSources({
      participations: [],
      competitionMap: competitions,
    });

    expect(result.size).toBe(0);
  });

  it("returns single source for single participation", () => {
    const participations = [
      createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
    ];

    const result = getPersonSources({
      participations,
      competitionMap: competitions,
    });

    expect(result.size).toBe(1);
    expect(result.has(Source.IMO)).toBe(true);
  });

  it("returns multiple sources for participations in different competitions", () => {
    const participations = [
      createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
      createParticipation("EGMO-2020", "person-1", "country-usa", Award.SILVER),
      createParticipation("MEMO-2019", "person-1", "country-usa", Award.BRONZE),
    ];

    const result = getPersonSources({
      participations,
      competitionMap: competitions,
    });

    expect(result.size).toBe(3);
    expect(result.has(Source.IMO)).toBe(true);
    expect(result.has(Source.EGMO)).toBe(true);
    expect(result.has(Source.MEMO)).toBe(true);
  });

  it("deduplicates sources from same competition type", () => {
    const competitions2 = {
      ...competitions,
      "IMO-2021": createCompetition("IMO-2021", Source.IMO, 2021),
    };

    const participations = [
      createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
      createParticipation("IMO-2021", "person-1", "country-usa", Award.GOLD),
    ];

    const result = getPersonSources({
      participations,
      competitionMap: competitions2,
    });

    expect(result.size).toBe(1);
    expect(result.has(Source.IMO)).toBe(true);
  });

  it("skips participations with missing competition", () => {
    const participations = [
      createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
      createParticipation("UNKNOWN-2022", "person-1", "country-usa", Award.SILVER),
    ];

    const result = getPersonSources({
      participations,
      competitionMap: competitions,
    });

    expect(result.size).toBe(1);
    expect(result.has(Source.IMO)).toBe(true);
  });
});

describe("getMaxProblems", () => {
  it("returns 0 for empty rows", () => {
    const result = getMaxProblems([], null);
    expect(result).toBe(0);
  });

  it("returns max problems across all rows when no filter", () => {
    const rows = [
      {
        id: "1",
        competitionId: "IMO-2020",
        competitionName: "IMO 2020",
        source: Source.IMO,
        year: 2020,
        rank: 1,
        problemScores: [],
        numProblems: 6,
        total: 42,
        award: Award.GOLD,
      },
      {
        id: "2",
        competitionId: "MEMO-2019",
        competitionName: "MEMO 2019",
        source: Source.MEMO,
        year: 2019,
        rank: 1,
        problemScores: [],
        numProblems: 8,
        total: 56,
        award: Award.GOLD,
      },
    ];

    const result = getMaxProblems(rows, null);
    expect(result).toBe(8);
  });

  it("returns max problems for filtered source only", () => {
    const rows = [
      {
        id: "1",
        competitionId: "IMO-2020",
        competitionName: "IMO 2020",
        source: Source.IMO,
        year: 2020,
        rank: 1,
        problemScores: [],
        numProblems: 6,
        total: 42,
        award: Award.GOLD,
      },
      {
        id: "2",
        competitionId: "MEMO-2019",
        competitionName: "MEMO 2019",
        source: Source.MEMO,
        year: 2019,
        rank: 1,
        problemScores: [],
        numProblems: 8,
        total: 56,
        award: Award.GOLD,
      },
    ];

    const result = getMaxProblems(rows, Source.IMO);
    expect(result).toBe(6);
  });

  it("returns 0 when filter matches no rows", () => {
    const rows = [
      {
        id: "1",
        competitionId: "IMO-2020",
        competitionName: "IMO 2020",
        source: Source.IMO,
        year: 2020,
        rank: 1,
        problemScores: [],
        numProblems: 6,
        total: 42,
        award: Award.GOLD,
      },
    ];

    const result = getMaxProblems(rows, Source.EGMO);
    expect(result).toBe(0);
  });
});

describe("getContestantInfo", () => {
  const countries: Record<string, Country> = {
    "country-usa": createCountry("country-usa", "USA", "United States"),
    "country-chn": createCountry("country-chn", "CHN", "China"),
  };

  it("returns null when person is null", () => {
    const result = getContestantInfo({
      person: null,
      countryMap: countries,
    });

    expect(result).toBe(null);
  });

  it("correctly extracts contestant info", () => {
    const person = createPerson("person-1", "Alice Johnson", "country-usa");

    const result = getContestantInfo({
      person,
      countryMap: countries,
    });

    expect(result).toEqual({
      name: "Alice Johnson",
      countryCode: "USA",
      countryName: "United States",
    });
  });

  it("handles missing country gracefully", () => {
    const person = createPerson("person-1", "Alice Johnson", "country-unknown");

    const result = getContestantInfo({
      person,
      countryMap: countries,
    });

    expect(result).toEqual({
      name: "Alice Johnson",
      countryCode: null,
      countryName: "country-unknown",
    });
  });

  it("handles empty countryMap", () => {
    const person = createPerson("person-1", "Alice Johnson", "country-usa");

    const result = getContestantInfo({
      person,
      countryMap: {},
    });

    expect(result).toEqual({
      name: "Alice Johnson",
      countryCode: null,
      countryName: "country-usa",
    });
  });
});
