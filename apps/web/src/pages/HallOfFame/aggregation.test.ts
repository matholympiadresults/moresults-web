import { describe, it, expect } from "vitest";
import { aggregateHallOfFame } from "./aggregation";
import type { Person, Participation, Competition, Country } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

// Test fixtures
const createPerson = (id: string, name: string, countryId: string): Person => ({
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

const createCompetition = (id: string, source: Source, year: number): Competition => ({
  id,
  source,
  year,
  edition: null,
  host_country_id: null,
  num_problems: 6,
  max_score_per_problem: 7,
});

const createParticipation = (
  competitionId: string,
  personId: string,
  countryId: string,
  award: Award | null
): Participation => ({
  id: `${competitionId}-${personId}`,
  competition_id: competitionId,
  person_id: personId,
  country_id: countryId,
  problem_scores: [],
  total: 0,
  rank: null,
  regional_rank: null,
  award,
  extra_awards: null,
  source_contestant_id: null,
});

describe("aggregateHallOfFame", () => {
  const countries: Record<string, Country> = {
    "country-usa": createCountry("country-usa", "USA", "United States"),
    "country-chn": createCountry("country-chn", "CHN", "China"),
    "country-rus": createCountry("country-rus", "RUS", "Russia"),
  };

  const people: Record<string, Person> = {
    "person-1": createPerson("person-1", "Alice", "country-usa"),
    "person-2": createPerson("person-2", "Bob", "country-chn"),
    "person-3": createPerson("person-3", "Charlie", "country-usa"),
    "person-4": createPerson("person-4", "David", "country-rus"),
  };

  const competitions: Record<string, Competition> = {
    "IMO-2020": createCompetition("IMO-2020", Source.IMO, 2020),
    "IMO-2021": createCompetition("IMO-2021", Source.IMO, 2021),
    "EGMO-2020": createCompetition("EGMO-2020", Source.EGMO, 2020),
  };

  describe("basic aggregation", () => {
    it("returns empty array when no participations", () => {
      const result = aggregateHallOfFame({
        participations: [],
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toEqual([]);
    });

    it("excludes participants with only honourable mentions", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.HONOURABLE_MENTION),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toEqual([]);
    });

    it("excludes participants with no awards", () => {
      const participations = [createParticipation("IMO-2020", "person-1", "country-usa", null)];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toEqual([]);
    });

    it("includes participants with at least one medal", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.BRONZE),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Alice");
      expect(result[0].bronze).toBe(1);
      expect(result[0].totalMedals).toBe(1);
    });

    it("correctly counts multiple medals for same person", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2021", "person-1", "country-usa", Award.GOLD),
        createParticipation("EGMO-2020", "person-1", "country-usa", Award.SILVER),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].gold).toBe(2);
      expect(result[0].silver).toBe(1);
      expect(result[0].bronze).toBe(0);
      expect(result[0].totalMedals).toBe(3);
      expect(result[0].participations).toBe(3);
    });

    it("counts honourable mentions separately from total medals", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2021", "person-1", "country-usa", Award.HONOURABLE_MENTION),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].gold).toBe(1);
      expect(result[0].hm).toBe(1);
      expect(result[0].totalMedals).toBe(1); // HM not included
      expect(result[0].participations).toBe(2);
    });
  });

  describe("sorting", () => {
    it("sorts by gold medals descending", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
        createParticipation("IMO-2021", "person-2", "country-chn", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result[0].personName).toBe("Bob"); // 2 golds
      expect(result[1].personName).toBe("Alice"); // 1 gold
    });

    it("uses silver as tiebreaker when gold is equal", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
        createParticipation("IMO-2021", "person-2", "country-chn", Award.SILVER),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result[0].personName).toBe("Bob"); // 1 gold + 1 silver
      expect(result[1].personName).toBe("Alice"); // 1 gold
    });

    it("uses bronze as tiebreaker when gold and silver are equal", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2021", "person-1", "country-usa", Award.SILVER),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
        createParticipation("IMO-2021", "person-2", "country-chn", Award.SILVER),
        createParticipation("EGMO-2020", "person-2", "country-chn", Award.BRONZE),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result[0].personName).toBe("Bob"); // 1g, 1s, 1b
      expect(result[1].personName).toBe("Alice"); // 1g, 1s, 0b
    });

    it("uses honourable mentions as final tiebreaker", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
        createParticipation("IMO-2021", "person-2", "country-chn", Award.HONOURABLE_MENTION),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result[0].personName).toBe("Bob"); // 1g, 0s, 0b, 1hm
      expect(result[1].personName).toBe("Alice"); // 1g, 0s, 0b, 0hm
    });
  });

  describe("ranking", () => {
    it("assigns sequential ranks starting from 1", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.SILVER),
        createParticipation("IMO-2020", "person-3", "country-usa", Award.BRONZE),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });
  });

  describe("source filtering", () => {
    it("filters by IMO when selected", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("EGMO-2020", "person-2", "country-chn", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: Source.IMO,
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Alice");
    });

    it("filters by EGMO when selected", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("EGMO-2020", "person-2", "country-chn", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: Source.EGMO,
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Bob");
    });

    it("includes all sources when 'all' selected", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("EGMO-2020", "person-2", "country-chn", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toHaveLength(2);
    });

    it("aggregates medals only from selected source", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2021", "person-1", "country-usa", Award.GOLD),
        createParticipation("EGMO-2020", "person-1", "country-usa", Award.SILVER),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: Source.IMO,
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].gold).toBe(2);
      expect(result[0].silver).toBe(0); // EGMO silver excluded
      expect(result[0].participations).toBe(2); // Only IMO participations
    });
  });

  describe("country filtering", () => {
    it("filters by country when selected", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "country-usa",
      });

      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Alice");
      expect(result[0].countryName).toBe("United States");
    });

    it("includes all countries when 'all' selected", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toHaveLength(2);
    });
  });

  describe("combined filtering", () => {
    it("applies both source and country filters", () => {
      const participations = [
        createParticipation("IMO-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
        createParticipation("EGMO-2020", "person-3", "country-usa", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: Source.IMO,
        selectedCountry: "country-usa",
      });

      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Alice");
    });
  });

  describe("edge cases", () => {
    it("skips participations with missing competition", () => {
      const participations = [
        createParticipation("UNKNOWN-2020", "person-1", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Bob");
    });

    it("skips participations with missing person", () => {
      const participations = [
        createParticipation("IMO-2020", "unknown-person", "country-usa", Award.GOLD),
        createParticipation("IMO-2020", "person-2", "country-chn", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: people,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].personName).toBe("Bob");
    });

    it("handles missing country data gracefully", () => {
      const personWithUnknownCountry = createPerson("person-5", "Eve", "country-unknown");
      const peopleWithUnknown = {
        ...people,
        "person-5": personWithUnknownCountry,
      };

      const participations = [
        createParticipation("IMO-2020", "person-5", "country-unknown", Award.GOLD),
      ];

      const result = aggregateHallOfFame({
        participations,
        competitionMap: competitions,
        personMap: peopleWithUnknown,
        countryMap: countries,
        selectedSource: "all",
        selectedCountry: "all",
      });

      expect(result).toHaveLength(1);
      expect(result[0].countryCode).toBe(null);
      expect(result[0].countryName).toBe("country-unknown"); // Falls back to ID
    });
  });
});
