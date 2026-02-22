import type {
  Country,
  Competition,
  Person,
  Participation,
  TeamParticipation,
} from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

export function createCountry(overrides?: Partial<Country>): Country {
  return {
    id: "country-usa",
    code: "USA",
    name: "United States",
    ...overrides,
  };
}

export function createCompetition(overrides?: Partial<Competition>): Competition {
  return {
    id: "IMO-2023",
    source: Source.IMO,
    year: 2023,
    edition: 64,
    host_country_id: null,
    num_problems: 6,
    max_score_per_problem: 7,
    ...overrides,
  };
}

export function createPerson(overrides?: Partial<Person>): Person {
  return {
    id: "person-1",
    name: "Alice Johnson",
    given_name: "Alice",
    family_name: "Johnson",
    country_id: "country-usa",
    aliases: [],
    source_ids: {},
    ...overrides,
  };
}

export function createParticipation(overrides?: Partial<Participation>): Participation {
  return {
    id: "IMO-2023-person-1",
    competition_id: "IMO-2023",
    person_id: "person-1",
    country_id: "country-usa",
    problem_scores: [7, 7, 7, 7, 7, 7],
    total: 42,
    rank: 1,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
    ...overrides,
  };
}

export function createTeamParticipation(overrides?: Partial<TeamParticipation>): TeamParticipation {
  return {
    id: "BALTICWAY-2023-country-usa",
    competition_id: "BALTICWAY-2023",
    country_id: "country-usa",
    problem_scores: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    total: 20,
    rank: 1,
    ...overrides,
  };
}
