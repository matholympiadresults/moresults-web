import { describe, it, expect } from "vitest";
import {
  calculateCountryStandings,
  calculateScoreDistribution,
  getCountryFilterOptions,
} from "./competitions";
import type { Competition, Participation, Country } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

const createParticipation = (
  overrides: Partial<Participation> & { person_id: string }
): Participation => ({
  id: `comp-${overrides.person_id}`,
  competition_id: "imo-2024",
  country_id: "country-gbr",
  problem_scores: [7, 7, 7, 7, 7, 7],
  total: 42,
  rank: null,
  regional_rank: null,
  award: null,
  extra_awards: null,
  source_contestant_id: null,
  ...overrides,
});

const createCompetition = (overrides?: Partial<Competition>): Competition => ({
  id: "imo-2024",
  source: Source.IMO,
  year: 2024,
  edition: 65,
  host_country_id: "country-gbr",
  num_problems: 6,
  max_score_per_problem: 7,
  ...overrides,
});

const createCountryMap = (): Record<string, Country> => ({
  "country-gbr": { id: "country-gbr", code: "gbr", name: "United Kingdom" },
  "country-usa": { id: "country-usa", code: "usa", name: "United States" },
  "country-chn": { id: "country-chn", code: "chn", name: "China" },
});

describe("calculateCountryStandings", () => {
  it("returns empty array for no participations", () => {
    const result = calculateCountryStandings([], {}, 6);
    expect(result).toEqual([]);
  });

  it("aggregates scores for single country", () => {
    const participations = [
      createParticipation({
        person_id: "person-1",
        country_id: "country-gbr",
        problem_scores: [7, 7, 0, 0, 0, 0],
        total: 14,
        award: Award.BRONZE,
      }),
      createParticipation({
        person_id: "person-2",
        country_id: "country-gbr",
        problem_scores: [7, 7, 7, 0, 0, 0],
        total: 21,
        award: Award.SILVER,
      }),
    ];

    const result = calculateCountryStandings(
      participations,
      createCountryMap(),
      6
    );

    expect(result).toHaveLength(1);
    expect(result[0].countryId).toBe("country-gbr");
    expect(result[0].totalScore).toBe(35);
    expect(result[0].participants).toBe(2);
    expect(result[0].problemTotals).toEqual([14, 14, 7, 0, 0, 0]);
    expect(result[0].silver).toBe(1);
    expect(result[0].bronze).toBe(1);
    expect(result[0].rank).toBe(1);
  });

  it("ranks countries by total score descending", () => {
    const participations = [
      createParticipation({
        person_id: "person-1",
        country_id: "country-gbr",
        total: 30,
      }),
      createParticipation({
        person_id: "person-2",
        country_id: "country-usa",
        total: 42,
      }),
      createParticipation({
        person_id: "person-3",
        country_id: "country-chn",
        total: 35,
      }),
    ];

    const result = calculateCountryStandings(
      participations,
      createCountryMap(),
      6
    );

    expect(result).toHaveLength(3);
    expect(result[0].countryId).toBe("country-usa");
    expect(result[0].rank).toBe(1);
    expect(result[1].countryId).toBe("country-chn");
    expect(result[1].rank).toBe(2);
    expect(result[2].countryId).toBe("country-gbr");
    expect(result[2].rank).toBe(3);
  });

  it("counts medals correctly", () => {
    const participations = [
      createParticipation({
        person_id: "person-1",
        country_id: "country-gbr",
        total: 42,
        award: Award.GOLD,
      }),
      createParticipation({
        person_id: "person-2",
        country_id: "country-gbr",
        total: 35,
        award: Award.GOLD,
      }),
      createParticipation({
        person_id: "person-3",
        country_id: "country-gbr",
        total: 28,
        award: Award.SILVER,
      }),
      createParticipation({
        person_id: "person-4",
        country_id: "country-gbr",
        total: 21,
        award: Award.BRONZE,
      }),
      createParticipation({
        person_id: "person-5",
        country_id: "country-gbr",
        total: 14,
        award: Award.HONOURABLE_MENTION,
      }),
      createParticipation({
        person_id: "person-6",
        country_id: "country-gbr",
        total: 7,
        award: null,
      }),
    ];

    const result = calculateCountryStandings(
      participations,
      createCountryMap(),
      6
    );

    expect(result[0].gold).toBe(2);
    expect(result[0].silver).toBe(1);
    expect(result[0].bronze).toBe(1);
    expect(result[0].hm).toBe(1);
    expect(result[0].participants).toBe(6);
  });

  it("skips participations without country_id", () => {
    const participations = [
      createParticipation({
        person_id: "person-1",
        country_id: "country-gbr",
        total: 30,
      }),
      createParticipation({
        person_id: "person-2",
        country_id: "",
        total: 42,
      }),
    ];

    const result = calculateCountryStandings(
      participations,
      createCountryMap(),
      6
    );

    expect(result).toHaveLength(1);
    expect(result[0].countryId).toBe("country-gbr");
  });

  it("handles null problem scores", () => {
    const participations = [
      createParticipation({
        person_id: "person-1",
        country_id: "country-gbr",
        problem_scores: [7, null, 7, null, 0, 0],
        total: 14,
      }),
    ];

    const result = calculateCountryStandings(
      participations,
      createCountryMap(),
      6
    );

    expect(result[0].problemTotals).toEqual([7, 0, 7, 0, 0, 0]);
  });

  it("uses country ID as name when country not in map", () => {
    const participations = [
      createParticipation({
        person_id: "person-1",
        country_id: "country-xyz",
        total: 30,
      }),
    ];

    const result = calculateCountryStandings(participations, {}, 6);

    expect(result[0].countryId).toBe("country-xyz");
    expect(result[0].countryName).toBe("country-xyz");
    expect(result[0].countryCode).toBeNull();
  });
});

describe("calculateScoreDistribution", () => {
  it("returns entries for all possible scores", () => {
    const competition = createCompetition({
      num_problems: 6,
      max_score_per_problem: 7,
    });
    const result = calculateScoreDistribution([], competition);

    expect(result).toHaveLength(43); // 0 to 42
    expect(result[0].score).toBe(0);
    expect(result[42].score).toBe(42);
  });

  it("counts participants by score and award", () => {
    const competition = createCompetition();
    const participations = [
      createParticipation({ person_id: "p1", total: 42, award: Award.GOLD }),
      createParticipation({ person_id: "p2", total: 42, award: Award.GOLD }),
      createParticipation({ person_id: "p3", total: 35, award: Award.SILVER }),
      createParticipation({ person_id: "p4", total: 28, award: Award.BRONZE }),
      createParticipation({
        person_id: "p5",
        total: 21,
        award: Award.HONOURABLE_MENTION,
      }),
      createParticipation({ person_id: "p6", total: 14, award: null }),
    ];

    const result = calculateScoreDistribution(participations, competition);

    const score42 = result.find((e) => e.score === 42)!;
    expect(score42.gold).toBe(2);
    expect(score42.total).toBe(2);

    const score35 = result.find((e) => e.score === 35)!;
    expect(score35.silver).toBe(1);

    const score28 = result.find((e) => e.score === 28)!;
    expect(score28.bronze).toBe(1);

    const score21 = result.find((e) => e.score === 21)!;
    expect(score21.hm).toBe(1);

    const score14 = result.find((e) => e.score === 14)!;
    expect(score14.none).toBe(1);
  });

  it("calculates total correctly", () => {
    const competition = createCompetition();
    const participations = [
      createParticipation({ person_id: "p1", total: 30, award: Award.GOLD }),
      createParticipation({ person_id: "p2", total: 30, award: Award.SILVER }),
      createParticipation({ person_id: "p3", total: 30, award: null }),
    ];

    const result = calculateScoreDistribution(participations, competition);
    const score30 = result.find((e) => e.score === 30)!;

    expect(score30.total).toBe(3);
    expect(score30.gold).toBe(1);
    expect(score30.silver).toBe(1);
    expect(score30.none).toBe(1);
  });

  it("ignores scores outside valid range", () => {
    const competition = createCompetition();
    const participations = [
      createParticipation({ person_id: "p1", total: -1, award: null }),
      createParticipation({ person_id: "p2", total: 50, award: null }),
      createParticipation({ person_id: "p3", total: 30, award: null }),
    ];

    const result = calculateScoreDistribution(participations, competition);
    const totalParticipants = result.reduce((sum, e) => sum + e.total, 0);

    expect(totalParticipants).toBe(1);
  });

  it("handles competition with different max score", () => {
    const competition = createCompetition({
      num_problems: 4,
      max_score_per_problem: 10,
    });
    const result = calculateScoreDistribution([], competition);

    expect(result).toHaveLength(41); // 0 to 40
    expect(result[result.length - 1].score).toBe(40);
  });
});

describe("getCountryFilterOptions", () => {
  it("returns empty array for no participations", () => {
    const result = getCountryFilterOptions([], {});
    expect(result).toEqual([]);
  });

  it("returns unique countries sorted by name", () => {
    const participations = [
      createParticipation({ person_id: "p1", country_id: "country-usa" }),
      createParticipation({ person_id: "p2", country_id: "country-gbr" }),
      createParticipation({ person_id: "p3", country_id: "country-usa" }),
      createParticipation({ person_id: "p4", country_id: "country-chn" }),
    ];

    const result = getCountryFilterOptions(participations, createCountryMap());

    expect(result).toHaveLength(3);
    expect(result[0].label).toBe("China");
    expect(result[1].label).toBe("United Kingdom");
    expect(result[2].label).toBe("United States");
  });

  it("uses country ID as label when country not in map", () => {
    const participations = [
      createParticipation({ person_id: "p1", country_id: "country-xyz" }),
    ];

    const result = getCountryFilterOptions(participations, {});

    expect(result[0].value).toBe("country-xyz");
    expect(result[0].label).toBe("country-xyz");
  });

  it("filters out empty country IDs", () => {
    const participations = [
      createParticipation({ person_id: "p1", country_id: "country-gbr" }),
      createParticipation({ person_id: "p2", country_id: "" }),
    ];

    const result = getCountryFilterOptions(participations, createCountryMap());

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe("country-gbr");
  });
});
