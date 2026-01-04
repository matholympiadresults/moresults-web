import { describe, it, expect } from "vitest";
import type { Country, Competition, Participation } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";
import {
  calculateCountryStatsMap,
  buildCountryRows,
  calculateMedalsBySource,
  calculateTeamRankOverTime,
  calculateMedalProgression,
  getAvailableSources,
} from "./countryStats";

// Test fixtures
const createCountry = (code: string, name: string): Country => ({
  id: `country-${code}`,
  code,
  name,
});

const createCompetition = (
  source: Source,
  year: number,
  numProblems = 6
): Competition => ({
  id: `${source.toLowerCase()}-${year}`,
  source,
  year,
  edition: null,
  host_country_id: null,
  num_problems: numProblems,
  max_score_per_problem: 7,
});

const createParticipation = (
  competitionId: string,
  countryId: string,
  personId: string,
  total: number,
  award: Award | null = null
): Participation => ({
  id: `${competitionId}-${personId}`,
  competition_id: competitionId,
  person_id: personId,
  country_id: countryId,
  problem_scores: [7, 7, 7, 7, 7, 7].slice(0, Math.ceil(total / 7)),
  total,
  rank: null,
  regional_rank: null,
  award,
  extra_awards: null,
  source_contestant_id: null,
});

describe("calculateCountryStatsMap", () => {
  it("returns empty map for empty participations", () => {
    const result = calculateCountryStatsMap([]);
    expect(result.size).toBe(0);
  });

  it("counts participations correctly", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42),
      createParticipation("imo-2024", "country-usa", "person-2", 35),
      createParticipation("imo-2024", "country-gbr", "person-3", 40),
    ];

    const result = calculateCountryStatsMap(participations);

    expect(result.get("country-usa")?.participations).toBe(2);
    expect(result.get("country-gbr")?.participations).toBe(1);
  });

  it("counts medals by type correctly", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("imo-2024", "country-usa", "person-2", 35, Award.SILVER),
      createParticipation("imo-2024", "country-usa", "person-3", 30, Award.BRONZE),
      createParticipation("imo-2024", "country-usa", "person-4", 25, Award.HONOURABLE_MENTION),
      createParticipation("imo-2024", "country-usa", "person-5", 20, null),
    ];

    const result = calculateCountryStatsMap(participations);
    const usaStats = result.get("country-usa");

    expect(usaStats?.gold).toBe(1);
    expect(usaStats?.silver).toBe(1);
    expect(usaStats?.bronze).toBe(1);
    expect(usaStats?.hm).toBe(1);
    expect(usaStats?.totalMedals).toBe(3); // gold + silver + bronze
    expect(usaStats?.participations).toBe(5);
  });

  it("handles multiple countries", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("imo-2024", "country-gbr", "person-2", 40, Award.GOLD),
      createParticipation("imo-2024", "country-chn", "person-3", 38, Award.SILVER),
    ];

    const result = calculateCountryStatsMap(participations);

    expect(result.size).toBe(3);
    expect(result.get("country-usa")?.gold).toBe(1);
    expect(result.get("country-gbr")?.gold).toBe(1);
    expect(result.get("country-chn")?.silver).toBe(1);
  });
});

describe("buildCountryRows", () => {
  it("returns empty array for empty countries", () => {
    const result = buildCountryRows([], []);
    expect(result).toEqual([]);
  });

  it("builds rows for countries without participations", () => {
    const countries = [createCountry("usa", "United States")];
    const result = buildCountryRows(countries, []);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "country-usa",
      code: "usa",
      name: "United States",
      participations: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
      hm: 0,
      totalMedals: 0,
    });
  });

  it("builds rows with statistics correctly", () => {
    const countries = [
      createCountry("usa", "United States"),
      createCountry("gbr", "United Kingdom"),
    ];
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("imo-2024", "country-usa", "person-2", 35, Award.SILVER),
      createParticipation("imo-2024", "country-gbr", "person-3", 30, Award.BRONZE),
    ];

    const result = buildCountryRows(countries, participations);

    const usaRow = result.find((r) => r.code === "usa");
    const gbrRow = result.find((r) => r.code === "gbr");

    expect(usaRow?.participations).toBe(2);
    expect(usaRow?.gold).toBe(1);
    expect(usaRow?.silver).toBe(1);
    expect(usaRow?.totalMedals).toBe(2);

    expect(gbrRow?.participations).toBe(1);
    expect(gbrRow?.bronze).toBe(1);
    expect(gbrRow?.totalMedals).toBe(1);
  });
});

describe("calculateMedalsBySource", () => {
  const competitions: Record<string, Competition> = {
    "imo-2024": createCompetition(Source.IMO, 2024),
    "egmo-2024": createCompetition(Source.EGMO, 2024, 4),
  };

  it("returns zero medals for empty participations", () => {
    const result = calculateMedalsBySource([], competitions, Source.IMO);

    expect(result[Award.GOLD]).toBe(0);
    expect(result[Award.SILVER]).toBe(0);
    expect(result[Award.BRONZE]).toBe(0);
    expect(result[Award.HONOURABLE_MENTION]).toBe(0);
  });

  it("filters by source correctly", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("egmo-2024", "country-usa", "person-2", 28, Award.GOLD),
    ];

    const imoResult = calculateMedalsBySource(participations, competitions, Source.IMO);
    const egmoResult = calculateMedalsBySource(participations, competitions, Source.EGMO);

    expect(imoResult[Award.GOLD]).toBe(1);
    expect(egmoResult[Award.GOLD]).toBe(1);
  });

  it("counts all medal types", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("imo-2024", "country-usa", "person-2", 35, Award.SILVER),
      createParticipation("imo-2024", "country-usa", "person-3", 30, Award.BRONZE),
      createParticipation("imo-2024", "country-usa", "person-4", 25, Award.HONOURABLE_MENTION),
    ];

    const result = calculateMedalsBySource(participations, competitions, Source.IMO);

    expect(result[Award.GOLD]).toBe(1);
    expect(result[Award.SILVER]).toBe(1);
    expect(result[Award.BRONZE]).toBe(1);
    expect(result[Award.HONOURABLE_MENTION]).toBe(1);
  });

  it("ignores participations without awards", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("imo-2024", "country-usa", "person-2", 10, null),
    ];

    const result = calculateMedalsBySource(participations, competitions, Source.IMO);

    expect(result[Award.GOLD]).toBe(1);
    expect(result[Award.SILVER]).toBe(0);
    expect(result[Award.BRONZE]).toBe(0);
    expect(result[Award.HONOURABLE_MENTION]).toBe(0);
  });
});

describe("calculateTeamRankOverTime", () => {
  const competitions: Record<string, Competition> = {
    "imo-2023": createCompetition(Source.IMO, 2023),
    "imo-2024": createCompetition(Source.IMO, 2024),
  };

  it("returns empty array for empty participations", () => {
    const result = calculateTeamRankOverTime([], competitions, "country-usa", Source.IMO);
    expect(result).toEqual([]);
  });

  it("calculates team rank based on total scores", () => {
    const participations = [
      // USA team: total = 120
      createParticipation("imo-2024", "country-usa", "person-1", 42),
      createParticipation("imo-2024", "country-usa", "person-2", 40),
      createParticipation("imo-2024", "country-usa", "person-3", 38),
      // GBR team: total = 100
      createParticipation("imo-2024", "country-gbr", "person-4", 35),
      createParticipation("imo-2024", "country-gbr", "person-5", 35),
      createParticipation("imo-2024", "country-gbr", "person-6", 30),
    ];

    const usaResult = calculateTeamRankOverTime(
      participations,
      competitions,
      "country-usa",
      Source.IMO
    );

    expect(usaResult).toHaveLength(1);
    expect(usaResult[0].year).toBe(2024);
    expect(usaResult[0].teamRank).toBe(1); // USA is first
    expect(usaResult[0].totalTeams).toBe(2);
  });

  it("calculates percentile correctly", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 100),
      createParticipation("imo-2024", "country-gbr", "person-2", 80),
      createParticipation("imo-2024", "country-chn", "person-3", 60),
    ];

    const result = calculateTeamRankOverTime(
      participations,
      competitions,
      "country-usa",
      Source.IMO
    );

    expect(result[0].teamRank).toBe(1);
    expect(result[0].percentile).toBe(100); // Top rank = 100%
  });

  it("returns null for country not participating", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42),
    ];

    const result = calculateTeamRankOverTime(
      participations,
      competitions,
      "country-fra", // France didn't participate
      Source.IMO
    );

    expect(result[0].teamRank).toBe(null);
    expect(result[0].percentile).toBe(null);
  });

  it("returns data sorted by year", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42),
      createParticipation("imo-2023", "country-usa", "person-2", 40),
    ];

    const result = calculateTeamRankOverTime(
      participations,
      competitions,
      "country-usa",
      Source.IMO
    );

    expect(result[0].year).toBe(2023);
    expect(result[1].year).toBe(2024);
  });
});

describe("calculateMedalProgression", () => {
  const competitions: Record<string, Competition> = {
    "imo-2022": createCompetition(Source.IMO, 2022),
    "imo-2023": createCompetition(Source.IMO, 2023),
    "imo-2024": createCompetition(Source.IMO, 2024),
  };

  it("returns empty array for empty participations", () => {
    const result = calculateMedalProgression([], competitions, Source.IMO, "yearly");
    expect(result).toEqual([]);
  });

  it("calculates yearly medal counts", () => {
    const participations = [
      createParticipation("imo-2023", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("imo-2023", "country-usa", "person-2", 35, Award.SILVER),
      createParticipation("imo-2024", "country-usa", "person-3", 42, Award.GOLD),
    ];

    const result = calculateMedalProgression(
      participations,
      competitions,
      Source.IMO,
      "yearly"
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      year: 2023,
      gold: 1,
      silver: 1,
      bronze: 0,
      hm: 0,
      total: 2,
    });
    expect(result[1]).toEqual({
      year: 2024,
      gold: 1,
      silver: 0,
      bronze: 0,
      hm: 0,
      total: 1,
    });
  });

  it("calculates cumulative medal counts", () => {
    const participations = [
      createParticipation("imo-2022", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("imo-2023", "country-usa", "person-2", 42, Award.GOLD),
      createParticipation("imo-2024", "country-usa", "person-3", 35, Award.SILVER),
    ];

    const result = calculateMedalProgression(
      participations,
      competitions,
      Source.IMO,
      "cumulative"
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      year: 2022,
      gold: 1,
      silver: 0,
      bronze: 0,
      hm: 0,
      total: 1,
    });
    expect(result[1]).toEqual({
      year: 2023,
      gold: 2,
      silver: 0,
      bronze: 0,
      hm: 0,
      total: 2,
    });
    expect(result[2]).toEqual({
      year: 2024,
      gold: 2,
      silver: 1,
      bronze: 0,
      hm: 0,
      total: 3,
    });
  });

  it("returns data sorted by year", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42, Award.GOLD),
      createParticipation("imo-2022", "country-usa", "person-2", 42, Award.GOLD),
    ];

    const result = calculateMedalProgression(
      participations,
      competitions,
      Source.IMO,
      "yearly"
    );

    expect(result[0].year).toBe(2022);
    expect(result[1].year).toBe(2024);
  });
});

describe("getAvailableSources", () => {
  const competitions: Record<string, Competition> = {
    "imo-2024": createCompetition(Source.IMO, 2024),
    "egmo-2024": createCompetition(Source.EGMO, 2024, 4),
    "memo-2024": createCompetition(Source.MEMO, 2024),
  };

  it("returns empty array for empty participations", () => {
    const result = getAvailableSources([], competitions);
    expect(result).toEqual([]);
  });

  it("returns sources country has participated in", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42),
      createParticipation("egmo-2024", "country-usa", "person-2", 28),
    ];

    const result = getAvailableSources(participations, competitions);

    expect(result).toContain(Source.IMO);
    expect(result).toContain(Source.EGMO);
    expect(result).not.toContain(Source.MEMO);
  });

  it("returns sources in consistent order", () => {
    const participations = [
      createParticipation("egmo-2024", "country-usa", "person-1", 28),
      createParticipation("imo-2024", "country-usa", "person-2", 42),
    ];

    const result = getAvailableSources(participations, competitions);

    // Should be ordered: IMO, EGMO (regardless of participation order)
    expect(result[0]).toBe(Source.IMO);
    expect(result[1]).toBe(Source.EGMO);
  });

  it("handles participations with unknown competitions", () => {
    const participations = [
      createParticipation("imo-2024", "country-usa", "person-1", 42),
      createParticipation("unknown-comp", "country-usa", "person-2", 30),
    ];

    const result = getAvailableSources(participations, competitions);

    expect(result).toEqual([Source.IMO]);
  });
});
