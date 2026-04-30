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
  team_label: null,
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
  "country-kor": { id: "country-kor", code: "kor", name: "South Korea" },
  "country-jpn": { id: "country-jpn", code: "jpn", name: "Japan" },
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

    const result = calculateCountryStandings(participations, createCountryMap(), 6);

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

    const result = calculateCountryStandings(participations, createCountryMap(), 6);

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

    const result = calculateCountryStandings(participations, createCountryMap(), 6);

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

    const result = calculateCountryStandings(participations, createCountryMap(), 6);

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

    const result = calculateCountryStandings(participations, createCountryMap(), 6);

    expect(result[0].problemTotals).toEqual([7, 0, 7, 0, 0, 0]);
  });

  it("assigns same rank to countries with equal total scores", () => {
    const participations = [
      createParticipation({
        person_id: "person-1",
        country_id: "country-usa",
        total: 42,
      }),
      createParticipation({
        person_id: "person-2",
        country_id: "country-chn",
        total: 42,
      }),
      createParticipation({
        person_id: "person-3",
        country_id: "country-gbr",
        total: 30,
      }),
    ];

    const result = calculateCountryStandings(participations, createCountryMap(), 6);

    expect(result).toHaveLength(3);
    // USA and China both have 42 — they should be tied at rank 1
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(1);
    // GBR should be rank 3 (not 2), since two countries share rank 1
    expect(result[2].rank).toBe(3);
  });

  it("handles three-way tie at rank 1 (ranks: 1,1,1,4)", () => {
    const participations = [
      createParticipation({ person_id: "p1", country_id: "country-usa", total: 42 }),
      createParticipation({ person_id: "p2", country_id: "country-chn", total: 42 }),
      createParticipation({ person_id: "p3", country_id: "country-gbr", total: 42 }),
      createParticipation({ person_id: "p4", country_id: "country-kor", total: 30 }),
    ];

    const result = calculateCountryStandings(participations, createCountryMap(), 6);
    expect(result.map((r) => r.rank)).toEqual([1, 1, 1, 4]);
  });

  it("handles four-way tie at rank 1 (ranks: 1,1,1,1,5)", () => {
    const participations = [
      createParticipation({ person_id: "p1", country_id: "country-usa", total: 42 }),
      createParticipation({ person_id: "p2", country_id: "country-chn", total: 42 }),
      createParticipation({ person_id: "p3", country_id: "country-gbr", total: 42 }),
      createParticipation({ person_id: "p4", country_id: "country-kor", total: 42 }),
      createParticipation({ person_id: "p5", country_id: "country-jpn", total: 30 }),
    ];

    const result = calculateCountryStandings(participations, createCountryMap(), 6);
    expect(result.map((r) => r.rank)).toEqual([1, 1, 1, 1, 5]);
  });

  it("handles tie in the middle (ranks: 1,2,2,4)", () => {
    const participations = [
      createParticipation({ person_id: "p1", country_id: "country-usa", total: 42 }),
      createParticipation({ person_id: "p2", country_id: "country-chn", total: 35 }),
      createParticipation({ person_id: "p3", country_id: "country-gbr", total: 35 }),
      createParticipation({ person_id: "p4", country_id: "country-kor", total: 30 }),
    ];

    const result = calculateCountryStandings(participations, createCountryMap(), 6);
    expect(result.map((r) => r.rank)).toEqual([1, 2, 2, 4]);
  });

  it("handles multiple tie groups (ranks: 1,2,2,2,5)", () => {
    // 1st alone, then three tied, then one alone
    const participations = [
      createParticipation({ person_id: "p1", country_id: "country-usa", total: 42 }),
      createParticipation({ person_id: "p2", country_id: "country-chn", total: 35 }),
      createParticipation({ person_id: "p3", country_id: "country-gbr", total: 35 }),
      createParticipation({ person_id: "p4", country_id: "country-kor", total: 35 }),
      createParticipation({ person_id: "p5", country_id: "country-jpn", total: 30 }),
    ];

    const result = calculateCountryStandings(participations, createCountryMap(), 6);
    expect(result.map((r) => r.rank)).toEqual([1, 2, 2, 2, 5]);
  });

  it("handles all countries tied (ranks: 1,1,1)", () => {
    const participations = [
      createParticipation({ person_id: "p1", country_id: "country-usa", total: 42 }),
      createParticipation({ person_id: "p2", country_id: "country-chn", total: 42 }),
      createParticipation({ person_id: "p3", country_id: "country-gbr", total: 42 }),
    ];

    const result = calculateCountryStandings(participations, createCountryMap(), 6);
    expect(result.map((r) => r.rank)).toEqual([1, 1, 1]);
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

  describe("team_label aggregation", () => {
    const teamCountryMap: Record<string, Country> = {
      "country-ukr": { id: "country-ukr", code: "ukr", name: "Ukraine" },
      "country-ltu": { id: "country-ltu", code: "ltu", name: "Lithuania" },
    };

    it("splits a country into separate standings per team_label", () => {
      const participations = [
        createParticipation({
          person_id: "p1",
          country_id: "country-ukr",
          team_label: null,
          total: 42,
          award: Award.GOLD,
        }),
        createParticipation({
          person_id: "p2",
          country_id: "country-ukr",
          team_label: "B",
          total: 26,
          award: Award.BRONZE,
        }),
      ];

      const result = calculateCountryStandings(participations, teamCountryMap, 6);

      expect(result).toHaveLength(2);
      const main = result.find((r) => r.teamLabel === null)!;
      const teamB = result.find((r) => r.teamLabel === "B")!;
      expect(main.countryName).toBe("Ukraine");
      expect(main.countryId).toBe("country-ukr");
      expect(main.totalScore).toBe(42);
      expect(main.gold).toBe(1);
      expect(teamB.countryName).toBe("Ukraine - B");
      expect(teamB.countryId).toBe("country-ukr");
      expect(teamB.totalScore).toBe(26);
      expect(teamB.bronze).toBe(1);
    });

    it("aggregates EMO 2026 Ukraine and Lithuania with B teams (UKR, UKR-B, LTU, LTU-B)", () => {
      // Reflects actual EMO 2026 data: each country has both a main team and a B team.
      const participations = [
        // Ukraine main team
        createParticipation({
          person_id: "u1",
          country_id: "country-ukr",
          team_label: null,
          total: 42,
          award: Award.GOLD,
        }),
        createParticipation({
          person_id: "u2",
          country_id: "country-ukr",
          team_label: null,
          total: 39,
          award: Award.GOLD,
        }),
        createParticipation({
          person_id: "u3",
          country_id: "country-ukr",
          team_label: null,
          total: 39,
          award: Award.GOLD,
        }),
        createParticipation({
          person_id: "u4",
          country_id: "country-ukr",
          team_label: null,
          total: 26,
          award: Award.BRONZE,
        }),
        createParticipation({
          person_id: "u5",
          country_id: "country-ukr",
          team_label: null,
          total: 25,
          award: Award.BRONZE,
        }),
        createParticipation({
          person_id: "u6",
          country_id: "country-ukr",
          team_label: null,
          total: 23,
          award: Award.BRONZE,
        }),
        // Ukraine B team
        createParticipation({
          person_id: "u7",
          country_id: "country-ukr",
          team_label: "B",
          total: 26,
          award: Award.BRONZE,
        }),
        createParticipation({
          person_id: "u8",
          country_id: "country-ukr",
          team_label: "B",
          total: 22,
          award: Award.BRONZE,
        }),
        createParticipation({
          person_id: "u9",
          country_id: "country-ukr",
          team_label: "B",
          total: 18,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "u10",
          country_id: "country-ukr",
          team_label: "B",
          total: 18,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "u11",
          country_id: "country-ukr",
          team_label: "B",
          total: 15,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "u12",
          country_id: "country-ukr",
          team_label: "B",
          total: 13,
          award: Award.HONOURABLE_MENTION,
        }),
        // Lithuania main team
        createParticipation({
          person_id: "l1",
          country_id: "country-ltu",
          team_label: null,
          total: 32,
          award: Award.SILVER,
        }),
        createParticipation({
          person_id: "l2",
          country_id: "country-ltu",
          team_label: null,
          total: 25,
          award: Award.BRONZE,
        }),
        createParticipation({
          person_id: "l3",
          country_id: "country-ltu",
          team_label: null,
          total: 24,
          award: Award.BRONZE,
        }),
        createParticipation({
          person_id: "l4",
          country_id: "country-ltu",
          team_label: null,
          total: 21,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "l5",
          country_id: "country-ltu",
          team_label: null,
          total: 19,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "l6",
          country_id: "country-ltu",
          team_label: null,
          total: 18,
          award: Award.HONOURABLE_MENTION,
        }),
        // Lithuania B team
        createParticipation({
          person_id: "l7",
          country_id: "country-ltu",
          team_label: "B",
          total: 18,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "l8",
          country_id: "country-ltu",
          team_label: "B",
          total: 17,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "l9",
          country_id: "country-ltu",
          team_label: "B",
          total: 17,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "l10",
          country_id: "country-ltu",
          team_label: "B",
          total: 16,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "l11",
          country_id: "country-ltu",
          team_label: "B",
          total: 16,
          award: Award.HONOURABLE_MENTION,
        }),
        createParticipation({
          person_id: "l12",
          country_id: "country-ltu",
          team_label: "B",
          total: 12,
          award: null,
        }),
      ];

      const result = calculateCountryStandings(participations, teamCountryMap, 6);

      expect(result).toHaveLength(4);
      const ukrMain = result.find((r) => r.countryId === "country-ukr" && r.teamLabel === null)!;
      const ukrB = result.find((r) => r.countryId === "country-ukr" && r.teamLabel === "B")!;
      const ltuMain = result.find((r) => r.countryId === "country-ltu" && r.teamLabel === null)!;
      const ltuB = result.find((r) => r.countryId === "country-ltu" && r.teamLabel === "B")!;

      expect(ukrMain.countryName).toBe("Ukraine");
      expect(ukrMain.totalScore).toBe(42 + 39 + 39 + 26 + 25 + 23);
      expect(ukrMain.participants).toBe(6);
      expect(ukrMain.gold).toBe(3);
      expect(ukrMain.bronze).toBe(3);

      expect(ukrB.countryName).toBe("Ukraine - B");
      expect(ukrB.totalScore).toBe(26 + 22 + 18 + 18 + 15 + 13);
      expect(ukrB.participants).toBe(6);
      expect(ukrB.bronze).toBe(2);
      expect(ukrB.hm).toBe(4);

      expect(ltuMain.countryName).toBe("Lithuania");
      expect(ltuMain.totalScore).toBe(32 + 25 + 24 + 21 + 19 + 18);
      expect(ltuMain.silver).toBe(1);
      expect(ltuMain.bronze).toBe(2);
      expect(ltuMain.hm).toBe(3);

      expect(ltuB.countryName).toBe("Lithuania - B");
      expect(ltuB.totalScore).toBe(18 + 17 + 17 + 16 + 16 + 12);
      expect(ltuB.hm).toBe(5);
      expect(ltuB.gold).toBe(0);
    });

    it("preserves the underlying countryId so links still go to the country page", () => {
      const participations = [
        createParticipation({
          person_id: "p1",
          country_id: "country-ukr",
          team_label: "B",
          total: 26,
          award: Award.BRONZE,
        }),
      ];

      const result = calculateCountryStandings(participations, teamCountryMap, 6);

      expect(result[0].countryId).toBe("country-ukr");
      expect(result[0].countryCode).toBe("ukr");
      expect(result[0].teamLabel).toBe("B");
      expect(result[0].countryName).toBe("Ukraine - B");
    });

    it("treats different team labels for the same country as separate standings", () => {
      const participations = [
        createParticipation({
          person_id: "p1",
          country_id: "country-ukr",
          team_label: "A",
          total: 30,
        }),
        createParticipation({
          person_id: "p2",
          country_id: "country-ukr",
          team_label: "B",
          total: 20,
        }),
        createParticipation({
          person_id: "p3",
          country_id: "country-ukr",
          team_label: "C",
          total: 10,
        }),
      ];

      const result = calculateCountryStandings(participations, teamCountryMap, 6);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.countryName).sort()).toEqual([
        "Ukraine - A",
        "Ukraine - B",
        "Ukraine - C",
      ]);
    });

    it("ranks team-labelled standings independently by total score", () => {
      const participations = [
        createParticipation({
          person_id: "p1",
          country_id: "country-ukr",
          team_label: null,
          total: 100,
        }),
        createParticipation({
          person_id: "p2",
          country_id: "country-ukr",
          team_label: "B",
          total: 50,
        }),
        createParticipation({
          person_id: "p3",
          country_id: "country-ltu",
          team_label: null,
          total: 75,
        }),
      ];

      const result = calculateCountryStandings(participations, teamCountryMap, 6);

      expect(result.map((r) => ({ name: r.countryName, rank: r.rank }))).toEqual([
        { name: "Ukraine", rank: 1 },
        { name: "Lithuania", rank: 2 },
        { name: "Ukraine - B", rank: 3 },
      ]);
    });
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
    const participations = [createParticipation({ person_id: "p1", country_id: "country-xyz" })];

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
