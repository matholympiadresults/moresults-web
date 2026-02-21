import { describe, it, expect } from "vitest";
import {
  Source,
  Award,
  isTeamCompetition,
  type Country,
  type Competition,
  type Person,
  type Participation,
  type TeamParticipation,
  type Database,
} from "./base";

describe("Source enum", () => {
  it("has IMO value", () => {
    expect(Source.IMO).toBe("IMO");
  });

  it("has EGMO value", () => {
    expect(Source.EGMO).toBe("EGMO");
  });

  it("has MEMO value", () => {
    expect(Source.MEMO).toBe("MEMO");
  });

  it("has RMM value", () => {
    expect(Source.RMM).toBe("RMM");
  });

  it("has APMO value", () => {
    expect(Source.APMO).toBe("APMO");
  });

  it("has BMO value", () => {
    expect(Source.BMO).toBe("BMO");
  });

  it("has PAMO value", () => {
    expect(Source.PAMO).toBe("PAMO");
  });

  it("has BALTICWAY value", () => {
    expect(Source.BALTICWAY).toBe("BALTICWAY");
  });

  it("contains all expected sources", () => {
    const sources = Object.values(Source);
    expect(sources).toHaveLength(8);
    expect(sources).toContain("IMO");
    expect(sources).toContain("EGMO");
    expect(sources).toContain("MEMO");
    expect(sources).toContain("RMM");
    expect(sources).toContain("APMO");
    expect(sources).toContain("BMO");
    expect(sources).toContain("PAMO");
    expect(sources).toContain("BALTICWAY");
  });
});

describe("Award enum", () => {
  it("has GOLD value", () => {
    expect(Award.GOLD).toBe("gold");
  });

  it("has SILVER value", () => {
    expect(Award.SILVER).toBe("silver");
  });

  it("has BRONZE value", () => {
    expect(Award.BRONZE).toBe("bronze");
  });

  it("has HONOURABLE_MENTION value", () => {
    expect(Award.HONOURABLE_MENTION).toBe("honourable_mention");
  });

  it("contains all expected awards", () => {
    const awards = Object.values(Award);
    expect(awards).toHaveLength(4);
    expect(awards).toContain("gold");
    expect(awards).toContain("silver");
    expect(awards).toContain("bronze");
    expect(awards).toContain("honourable_mention");
  });
});

describe("Country interface", () => {
  it("accepts valid country object", () => {
    const country: Country = {
      id: "country-usa",
      code: "USA",
      name: "United States",
    };

    expect(country.id).toBe("country-usa");
    expect(country.code).toBe("USA");
    expect(country.name).toBe("United States");
  });

  it("id format follows convention", () => {
    const country: Country = {
      id: "country-gbr",
      code: "GBR",
      name: "United Kingdom",
    };

    expect(country.id.startsWith("country-")).toBe(true);
  });
});

describe("Competition interface", () => {
  it("accepts valid competition object with all fields", () => {
    const competition: Competition = {
      id: "IMO-2023",
      source: Source.IMO,
      year: 2023,
      edition: 64,
      host_country_id: "country-jpn",
      num_problems: 6,
      max_score_per_problem: 7,
    };

    expect(competition.id).toBe("IMO-2023");
    expect(competition.source).toBe(Source.IMO);
    expect(competition.year).toBe(2023);
    expect(competition.edition).toBe(64);
    expect(competition.host_country_id).toBe("country-jpn");
    expect(competition.num_problems).toBe(6);
    expect(competition.max_score_per_problem).toBe(7);
  });

  it("accepts competition with null optional fields", () => {
    const competition: Competition = {
      id: "MEMO-2022",
      source: Source.MEMO,
      year: 2022,
      edition: null,
      host_country_id: null,
      num_problems: 8,
      max_score_per_problem: 8,
    };

    expect(competition.edition).toBeNull();
    expect(competition.host_country_id).toBeNull();
  });

  it("id format follows convention", () => {
    const competition: Competition = {
      id: "EGMO-2023",
      source: Source.EGMO,
      year: 2023,
      edition: 12,
      host_country_id: null,
      num_problems: 4,
      max_score_per_problem: 7,
    };

    expect(competition.id).toBe(`${competition.source}-${competition.year}`);
  });
});

describe("Person interface", () => {
  it("accepts valid person object with all fields", () => {
    const person: Person = {
      id: "person-123",
      name: "John Doe",
      given_name: "John",
      family_name: "Doe",
      country_id: "country-usa",
      aliases: ["Johnny Doe", "J. Doe"],
      source_ids: { IMO: "imo-456", EGMO: null },
    };

    expect(person.id).toBe("person-123");
    expect(person.name).toBe("John Doe");
    expect(person.given_name).toBe("John");
    expect(person.family_name).toBe("Doe");
    expect(person.country_id).toBe("country-usa");
    expect(person.aliases).toHaveLength(2);
    expect(person.source_ids.IMO).toBe("imo-456");
    expect(person.source_ids.EGMO).toBeNull();
  });

  it("accepts person with null optional fields", () => {
    const person: Person = {
      id: "person-456",
      name: "Jane Smith",
      given_name: null,
      family_name: null,
      country_id: "country-gbr",
      aliases: [],
      source_ids: {},
    };

    expect(person.given_name).toBeNull();
    expect(person.family_name).toBeNull();
    expect(person.aliases).toHaveLength(0);
    expect(Object.keys(person.source_ids)).toHaveLength(0);
  });
});

describe("Participation interface", () => {
  it("accepts valid participation object with all fields", () => {
    const participation: Participation = {
      id: "IMO-2023-person-123",
      competition_id: "IMO-2023",
      person_id: "person-123",
      country_id: "country-usa",
      problem_scores: [7, 7, 7, 7, 7, 7],
      total: 42,
      rank: 1,
      regional_rank: 1,
      award: Award.GOLD,
      extra_awards: "Special Prize",
      source_contestant_id: "imo-contestant-789",
    };

    expect(participation.id).toBe("IMO-2023-person-123");
    expect(participation.competition_id).toBe("IMO-2023");
    expect(participation.person_id).toBe("person-123");
    expect(participation.country_id).toBe("country-usa");
    expect(participation.problem_scores).toHaveLength(6);
    expect(participation.total).toBe(42);
    expect(participation.rank).toBe(1);
    expect(participation.regional_rank).toBe(1);
    expect(participation.award).toBe(Award.GOLD);
    expect(participation.extra_awards).toBe("Special Prize");
    expect(participation.source_contestant_id).toBe("imo-contestant-789");
  });

  it("accepts participation with null optional fields", () => {
    const participation: Participation = {
      id: "IMO-2023-person-456",
      competition_id: "IMO-2023",
      person_id: "person-456",
      country_id: "country-gbr",
      problem_scores: [0, 0, 1, 2, 3, 4],
      total: 10,
      rank: null,
      regional_rank: null,
      award: null,
      extra_awards: null,
      source_contestant_id: null,
    };

    expect(participation.rank).toBeNull();
    expect(participation.regional_rank).toBeNull();
    expect(participation.award).toBeNull();
    expect(participation.extra_awards).toBeNull();
    expect(participation.source_contestant_id).toBeNull();
  });

  it("problem_scores can contain null values", () => {
    const participation: Participation = {
      id: "IMO-2023-person-789",
      competition_id: "IMO-2023",
      person_id: "person-789",
      country_id: "country-chn",
      problem_scores: [7, null, 7, null, 7, 7],
      total: 28,
      rank: 10,
      regional_rank: null,
      award: Award.SILVER,
      extra_awards: null,
      source_contestant_id: null,
    };

    expect(participation.problem_scores).toContain(null);
    expect(participation.problem_scores.filter((s) => s === null)).toHaveLength(2);
  });

  it("id format follows convention", () => {
    const participation: Participation = {
      id: "EGMO-2022-person-abc",
      competition_id: "EGMO-2022",
      person_id: "person-abc",
      country_id: "country-deu",
      problem_scores: [7, 7, 7, 7],
      total: 28,
      rank: 1,
      regional_rank: null,
      award: Award.GOLD,
      extra_awards: null,
      source_contestant_id: null,
    };

    expect(participation.id).toBe(`${participation.competition_id}-${participation.person_id}`);
  });
});

describe("Database interface", () => {
  it("accepts valid database object", () => {
    const database: Database = {
      version: "1.0.0",
      last_updated: "2024-01-15T12:00:00Z",
      countries: {
        "country-usa": {
          id: "country-usa",
          code: "USA",
          name: "United States",
        },
      },
      competitions: {
        "IMO-2023": {
          id: "IMO-2023",
          source: Source.IMO,
          year: 2023,
          edition: 64,
          host_country_id: "country-jpn",
          num_problems: 6,
          max_score_per_problem: 7,
        },
      },
      people: {
        "person-123": {
          id: "person-123",
          name: "John Doe",
          given_name: "John",
          family_name: "Doe",
          country_id: "country-usa",
          aliases: [],
          source_ids: {},
        },
      },
      participations: {
        "IMO-2023-person-123": {
          id: "IMO-2023-person-123",
          competition_id: "IMO-2023",
          person_id: "person-123",
          country_id: "country-usa",
          problem_scores: [7, 7, 7, 7, 7, 7],
          total: 42,
          rank: 1,
          regional_rank: null,
          award: Award.GOLD,
          extra_awards: null,
          source_contestant_id: null,
        },
      },
      team_participations: {},
    };

    expect(database.version).toBe("1.0.0");
    expect(database.last_updated).toBe("2024-01-15T12:00:00Z");
    expect(Object.keys(database.countries)).toHaveLength(1);
    expect(Object.keys(database.competitions)).toHaveLength(1);
    expect(Object.keys(database.people)).toHaveLength(1);
    expect(Object.keys(database.participations)).toHaveLength(1);
  });

  it("accepts empty database", () => {
    const database: Database = {
      version: "0.0.1",
      last_updated: "2024-01-01T00:00:00Z",
      countries: {},
      competitions: {},
      people: {},
      participations: {},
      team_participations: {},
    };

    expect(Object.keys(database.countries)).toHaveLength(0);
    expect(Object.keys(database.competitions)).toHaveLength(0);
    expect(Object.keys(database.people)).toHaveLength(0);
    expect(Object.keys(database.participations)).toHaveLength(0);
    expect(Object.keys(database.team_participations)).toHaveLength(0);
  });

  it("accepts database with team participations", () => {
    const database: Database = {
      version: "1.0.0",
      last_updated: "2024-01-15T12:00:00Z",
      countries: {},
      competitions: {},
      people: {},
      participations: {},
      team_participations: {
        "BALTICWAY-2024-country-est": {
          id: "BALTICWAY-2024-country-est",
          competition_id: "BALTICWAY-2024",
          country_id: "country-est",
          problem_scores: [5, 5, 4, 3, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
          total: 97,
          rank: 1,
        },
      },
    };

    expect(Object.keys(database.team_participations)).toHaveLength(1);
  });
});

describe("isTeamCompetition", () => {
  it("returns true for BALTICWAY", () => {
    expect(isTeamCompetition(Source.BALTICWAY)).toBe(true);
  });

  it("returns false for individual competitions", () => {
    expect(isTeamCompetition(Source.IMO)).toBe(false);
    expect(isTeamCompetition(Source.EGMO)).toBe(false);
    expect(isTeamCompetition(Source.MEMO)).toBe(false);
    expect(isTeamCompetition(Source.RMM)).toBe(false);
    expect(isTeamCompetition(Source.APMO)).toBe(false);
    expect(isTeamCompetition(Source.BMO)).toBe(false);
    expect(isTeamCompetition(Source.PAMO)).toBe(false);
  });
});

describe("TeamParticipation interface", () => {
  it("accepts valid team participation object", () => {
    const tp: TeamParticipation = {
      id: "BALTICWAY-2024-country-est",
      competition_id: "BALTICWAY-2024",
      country_id: "country-est",
      problem_scores: [5, 5, 4, 3, 5],
      total: 22,
      rank: 1,
    };

    expect(tp.id).toBe("BALTICWAY-2024-country-est");
    expect(tp.competition_id).toBe("BALTICWAY-2024");
    expect(tp.country_id).toBe("country-est");
    expect(tp.problem_scores).toHaveLength(5);
    expect(tp.total).toBe(22);
    expect(tp.rank).toBe(1);
  });

  it("accepts team participation with null rank", () => {
    const tp: TeamParticipation = {
      id: "BALTICWAY-2024-country-ltu",
      competition_id: "BALTICWAY-2024",
      country_id: "country-ltu",
      problem_scores: [null, 3, 5, null, 2],
      total: 10,
      rank: null,
    };

    expect(tp.rank).toBeNull();
    expect(tp.problem_scores).toContain(null);
  });

  it("id format follows convention", () => {
    const tp: TeamParticipation = {
      id: "BALTICWAY-2024-country-est",
      competition_id: "BALTICWAY-2024",
      country_id: "country-est",
      problem_scores: [],
      total: 0,
      rank: null,
    };

    expect(tp.id).toBe(`${tp.competition_id}-${tp.country_id}`);
  });
});
