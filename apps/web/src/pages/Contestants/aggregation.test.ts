import { describe, it, expect } from "vitest";
import { aggregateContestants } from "./aggregation";
import type { Person, Country } from "@/schemas/base";

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

describe("aggregateContestants", () => {
  const countries: Record<string, Country> = {
    "country-usa": createCountry("country-usa", "USA", "United States"),
    "country-chn": createCountry("country-chn", "CHN", "China"),
    "country-gbr": createCountry("country-gbr", "GBR", "United Kingdom"),
  };

  describe("basic aggregation", () => {
    it("returns empty array when no people", () => {
      const result = aggregateContestants({
        people: [],
        countryMap: countries,
      });

      expect(result).toEqual([]);
    });

    it("correctly maps person data to contestant rows", () => {
      const people = [createPerson("person-1", "Alice Johnson", "country-usa")];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "person-1",
        name: "Alice Johnson",
        countryId: "country-usa",
        countryCode: "USA",
        countryName: "United States",
      });
    });

    it("maps multiple people correctly", () => {
      const people = [
        createPerson("person-1", "Alice Johnson", "country-usa"),
        createPerson("person-2", "Bob Smith", "country-chn"),
        createPerson("person-3", "Charlie Brown", "country-gbr"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("Alice Johnson");
      expect(result[1].name).toBe("Bob Smith");
      expect(result[2].name).toBe("Charlie Brown");
    });

    it("preserves original order of people", () => {
      const people = [
        createPerson("person-3", "Zara Williams", "country-usa"),
        createPerson("person-1", "Alice Johnson", "country-usa"),
        createPerson("person-2", "Bob Smith", "country-chn"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result[0].name).toBe("Zara Williams");
      expect(result[1].name).toBe("Alice Johnson");
      expect(result[2].name).toBe("Bob Smith");
    });
  });

  describe("redacted name filtering", () => {
    it("filters out names starting with '('", () => {
      const people = [
        createPerson("person-1", "Alice Johnson", "country-usa"),
        createPerson("person-2", "(redacted)", "country-chn"),
        createPerson("person-3", "(name removed)", "country-gbr"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Alice Johnson");
    });

    it("filters out names starting with '*'", () => {
      const people = [
        createPerson("person-1", "Alice Johnson", "country-usa"),
        createPerson("person-2", "*redacted*", "country-chn"),
        createPerson("person-3", "* Hidden Name", "country-gbr"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Alice Johnson");
    });

    it("keeps names containing '(' or '*' but not at the start", () => {
      const people = [
        createPerson("person-1", "Name (nickname)", "country-usa"),
        createPerson("person-2", "Special *person*", "country-chn"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Name (nickname)");
      expect(result[1].name).toBe("Special *person*");
    });

    it("returns empty array when all names are redacted", () => {
      const people = [
        createPerson("person-1", "(redacted)", "country-usa"),
        createPerson("person-2", "*hidden*", "country-chn"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toEqual([]);
    });
  });

  describe("country mapping", () => {
    it("correctly maps country code and name from countryMap", () => {
      const people = [createPerson("person-1", "Alice Johnson", "country-usa")];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result[0].countryCode).toBe("USA");
      expect(result[0].countryName).toBe("United States");
    });

    it("handles missing country gracefully with null code", () => {
      const people = [createPerson("person-1", "Alice Johnson", "country-unknown")];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toHaveLength(1);
      expect(result[0].countryCode).toBe(null);
      expect(result[0].countryName).toBe("country-unknown"); // Falls back to ID
    });

    it("handles empty countryMap", () => {
      const people = [createPerson("person-1", "Alice Johnson", "country-usa")];

      const result = aggregateContestants({
        people,
        countryMap: {},
      });

      expect(result).toHaveLength(1);
      expect(result[0].countryCode).toBe(null);
      expect(result[0].countryName).toBe("country-usa");
    });

    it("correctly preserves countryId regardless of country lookup", () => {
      const people = [
        createPerson("person-1", "Alice Johnson", "country-usa"),
        createPerson("person-2", "Bob Smith", "country-unknown"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result[0].countryId).toBe("country-usa");
      expect(result[1].countryId).toBe("country-unknown");
    });
  });

  describe("edge cases", () => {
    it("handles people with same name from different countries", () => {
      const people = [
        createPerson("person-1", "John Smith", "country-usa"),
        createPerson("person-2", "John Smith", "country-gbr"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("person-1");
      expect(result[0].countryName).toBe("United States");
      expect(result[1].id).toBe("person-2");
      expect(result[1].countryName).toBe("United Kingdom");
    });

    it("handles person with null country_id field", () => {
      const personWithNullCountry: Person = {
        id: "person-1",
        name: "Alice Johnson",
        given_name: "Alice",
        family_name: "Johnson",
        country_id: null as unknown as string, // Force null for edge case test
        aliases: [],
        source_ids: {},
      };

      const result = aggregateContestants({
        people: [personWithNullCountry],
        countryMap: countries,
      });

      expect(result).toHaveLength(1);
      expect(result[0].countryCode).toBe(null);
    });

    it("handles names with special unicode characters", () => {
      const people = [
        createPerson("person-1", "François Müller", "country-usa"),
        createPerson("person-2", "田中太郎", "country-chn"),
        createPerson("person-3", "Александр Иванов", "country-gbr"),
      ];

      const result = aggregateContestants({
        people,
        countryMap: countries,
      });

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("François Müller");
      expect(result[1].name).toBe("田中太郎");
      expect(result[2].name).toBe("Александр Иванов");
    });
  });
});
