import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Database } from "@/schemas/base";
import { Source, Award } from "@/schemas/base";

const mockDatabase: Database = {
  version: "1.0.0",
  last_updated: "2024-01-01T00:00:00Z",
  countries: {
    "country-USA": { id: "country-USA", code: "USA", name: "United States" },
    "country-GBR": { id: "country-GBR", code: "GBR", name: "United Kingdom" },
  },
  competitions: {
    "IMO-2023": {
      id: "IMO-2023",
      source: Source.IMO,
      year: 2023,
      edition: 64,
      host_country_id: "country-JPN",
      num_problems: 6,
      max_score_per_problem: 7,
    },
    "EGMO-2023": {
      id: "EGMO-2023",
      source: Source.EGMO,
      year: 2023,
      edition: 12,
      host_country_id: "country-SVN",
      num_problems: 6,
      max_score_per_problem: 7,
    },
  },
  people: {
    "person-1": {
      id: "person-1",
      name: "Alice Johnson",
      given_name: "Alice",
      family_name: "Johnson",
      country_id: "country-USA",
      aliases: [],
      source_ids: { IMO: "12345" },
    },
    "person-2": {
      id: "person-2",
      name: "Bob Smith",
      given_name: "Bob",
      family_name: "Smith",
      country_id: "country-GBR",
      aliases: [],
      source_ids: { IMO: "12346" },
    },
  },
  participations: {
    "IMO-2023-person-1": {
      id: "IMO-2023-person-1",
      competition_id: "IMO-2023",
      person_id: "person-1",
      country_id: "country-USA",
      problem_scores: [7, 7, 7, 7, 7, 7],
      total: 42,
      rank: 1,
      regional_rank: null,
      award: Award.GOLD,
      extra_awards: null,
      source_contestant_id: "12345",
    },
    "IMO-2023-person-2": {
      id: "IMO-2023-person-2",
      competition_id: "IMO-2023",
      person_id: "person-2",
      country_id: "country-GBR",
      problem_scores: [7, 7, 7, 0, 0, 0],
      total: 21,
      rank: 100,
      regional_rank: null,
      award: Award.SILVER,
      extra_awards: null,
      source_contestant_id: "12346",
    },
    "EGMO-2023-person-1": {
      id: "EGMO-2023-person-1",
      competition_id: "EGMO-2023",
      person_id: "person-1",
      country_id: "country-USA",
      problem_scores: [7, 7, 7, 7, 7, 7],
      total: 42,
      rank: 1,
      regional_rank: null,
      award: Award.GOLD,
      extra_awards: null,
      source_contestant_id: "12345",
    },
  },
};

// Mock DecompressionStream to pass data through unchanged
class MockDecompressionStream {
  readable: ReadableStream;
  writable: WritableStream;

  constructor() {
    let controller: ReadableStreamDefaultController<Uint8Array>;
    this.readable = new ReadableStream({
      start(c) {
        controller = c;
      },
    });
    this.writable = new WritableStream({
      write(chunk) {
        controller.enqueue(chunk);
      },
      close() {
        controller.close();
      },
    });
  }
}

// Helper to create a mock fetch response
function createMockFetchResponse(data: Database) {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(jsonString);

  const mockStream = new ReadableStream({
    start(controller) {
      controller.enqueue(uint8Array);
      controller.close();
    },
  });

  return {
    ok: true,
    status: 200,
    body: mockStream,
  };
}

describe("api hooks", () => {
  let originalFetch: typeof global.fetch;
  let originalDecompressionStream: typeof global.DecompressionStream;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalDecompressionStream = global.DecompressionStream;

    // Mock DecompressionStream to pass through data unchanged
    global.DecompressionStream =
      MockDecompressionStream as unknown as typeof DecompressionStream;

    // Reset module state by clearing the cache
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.DecompressionStream = originalDecompressionStream;
    vi.restoreAllMocks();
  });

  describe("useDatabase", () => {
    it("returns loading state initially", async () => {
      // Delay the fetch to observe loading state
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(createMockFetchResponse(mockDatabase)), 50);
          })
      );

      const { useDatabase: freshUseDatabase } = await import("./api");
      const { result } = renderHook(() => freshUseDatabase());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
    });

    it("returns data after successful fetch", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useDatabase: freshUseDatabase } = await import("./api");
      const { result } = renderHook(() => freshUseDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockDatabase);
      expect(result.current.error).toBe(null);
    });

    it("returns error on fetch failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { useDatabase: freshUseDatabase } = await import("./api");
      const { result } = renderHook(() => freshUseDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain("500");
    });

    it("returns error on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const { useDatabase: freshUseDatabase } = await import("./api");
      const { result } = renderHook(() => freshUseDatabase());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error?.message).toBe("Network error");
    });

    it("caches data and reuses it for subsequent calls", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useDatabase: freshUseDatabase } = await import("./api");

      // First call
      const { result: result1 } = renderHook(() => freshUseDatabase());
      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      // Second call should use cache
      const { result: result2 } = renderHook(() => freshUseDatabase());
      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      // fetch should only be called once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("deduplicates concurrent fetch requests", async () => {
      let resolvePromise: (value: unknown) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch = vi.fn().mockImplementation(() => fetchPromise);

      const { useDatabase: freshUseDatabase } = await import("./api");

      // Start multiple hooks simultaneously
      const { result: result1 } = renderHook(() => freshUseDatabase());
      const { result: result2 } = renderHook(() => freshUseDatabase());
      const { result: result3 } = renderHook(() => freshUseDatabase());

      expect(result1.current.loading).toBe(true);
      expect(result2.current.loading).toBe(true);
      expect(result3.current.loading).toBe(true);

      // Resolve the fetch
      resolvePromise!(createMockFetchResponse(mockDatabase));

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      // Only one fetch should have been made
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("useCountries", () => {
    it("returns empty array while loading", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(createMockFetchResponse(mockDatabase)), 50);
          })
      );

      const { useCountries: freshUseCountries } = await import("./api");
      const { result } = renderHook(() => freshUseCountries());

      expect(result.current.countries).toEqual([]);
      expect(result.current.loading).toBe(true);
    });

    it("returns all countries after loading", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useCountries: freshUseCountries } = await import("./api");
      const { result } = renderHook(() => freshUseCountries());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.countries).toHaveLength(2);
      expect(result.current.countries.map((c) => c.id)).toContain("country-USA");
      expect(result.current.countries.map((c) => c.id)).toContain("country-GBR");
    });
  });

  describe("useCountry", () => {
    it("returns null while loading", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(createMockFetchResponse(mockDatabase)), 50);
          })
      );

      const { useCountry: freshUseCountry } = await import("./api");
      const { result } = renderHook(() => freshUseCountry("country-USA"));

      expect(result.current.country).toBe(null);
      expect(result.current.loading).toBe(true);
    });

    it("returns specific country by id", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useCountry: freshUseCountry } = await import("./api");
      const { result } = renderHook(() => freshUseCountry("country-USA"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.country).toEqual(mockDatabase.countries["country-USA"]);
    });

    it("returns null for non-existent country", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useCountry: freshUseCountry } = await import("./api");
      const { result } = renderHook(() => freshUseCountry("country-INVALID"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.country).toBe(null);
    });
  });

  describe("useCompetitions", () => {
    it("returns all competitions after loading", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useCompetitions: freshUseCompetitions } = await import("./api");
      const { result } = renderHook(() => freshUseCompetitions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.competitions).toHaveLength(2);
      expect(result.current.competitions.map((c) => c.id)).toContain("IMO-2023");
      expect(result.current.competitions.map((c) => c.id)).toContain("EGMO-2023");
    });
  });

  describe("useCompetition", () => {
    it("returns specific competition by id", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useCompetition: freshUseCompetition } = await import("./api");
      const { result } = renderHook(() => freshUseCompetition("IMO-2023"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.competition).toEqual(mockDatabase.competitions["IMO-2023"]);
    });

    it("returns null for non-existent competition", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useCompetition: freshUseCompetition } = await import("./api");
      const { result } = renderHook(() => freshUseCompetition("IMO-9999"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.competition).toBe(null);
    });
  });

  describe("usePeople", () => {
    it("returns all people after loading", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { usePeople: freshUsePeople } = await import("./api");
      const { result } = renderHook(() => freshUsePeople());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.people).toHaveLength(2);
      expect(result.current.people.map((p) => p.id)).toContain("person-1");
      expect(result.current.people.map((p) => p.id)).toContain("person-2");
    });
  });

  describe("usePerson", () => {
    it("returns specific person by id", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { usePerson: freshUsePerson } = await import("./api");
      const { result } = renderHook(() => freshUsePerson("person-1"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.person).toEqual(mockDatabase.people["person-1"]);
    });

    it("returns null for non-existent person", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { usePerson: freshUsePerson } = await import("./api");
      const { result } = renderHook(() => freshUsePerson("person-999"));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.person).toBe(null);
    });
  });

  describe("useParticipations", () => {
    it("returns all participations after loading", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useParticipations: freshUseParticipations } = await import("./api");
      const { result } = renderHook(() => freshUseParticipations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.participations).toHaveLength(3);
    });
  });

  describe("useParticipationsByPerson", () => {
    it("returns participations filtered by person id", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useParticipationsByPerson: freshUseParticipationsByPerson } =
        await import("./api");
      const { result } = renderHook(() =>
        freshUseParticipationsByPerson("person-1")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.participations).toHaveLength(2);
      expect(
        result.current.participations.every((p) => p.person_id === "person-1")
      ).toBe(true);
    });

    it("returns empty array for non-existent person", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useParticipationsByPerson: freshUseParticipationsByPerson } =
        await import("./api");
      const { result } = renderHook(() =>
        freshUseParticipationsByPerson("person-999")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.participations).toHaveLength(0);
    });
  });

  describe("useParticipationsByCompetition", () => {
    it("returns participations filtered by competition id", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useParticipationsByCompetition: freshUseParticipationsByCompetition } =
        await import("./api");
      const { result } = renderHook(() =>
        freshUseParticipationsByCompetition("IMO-2023")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.participations).toHaveLength(2);
      expect(
        result.current.participations.every((p) => p.competition_id === "IMO-2023")
      ).toBe(true);
    });

    it("returns empty array for non-existent competition", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useParticipationsByCompetition: freshUseParticipationsByCompetition } =
        await import("./api");
      const { result } = renderHook(() =>
        freshUseParticipationsByCompetition("IMO-9999")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.participations).toHaveLength(0);
    });
  });

  describe("useParticipationsByCountry", () => {
    it("returns participations filtered by country id", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useParticipationsByCountry: freshUseParticipationsByCountry } =
        await import("./api");
      const { result } = renderHook(() =>
        freshUseParticipationsByCountry("country-USA")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.participations).toHaveLength(2);
      expect(
        result.current.participations.every((p) => p.country_id === "country-USA")
      ).toBe(true);
    });

    it("returns empty array for non-existent country", async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(mockDatabase));

      const { useParticipationsByCountry: freshUseParticipationsByCountry } =
        await import("./api");
      const { result } = renderHook(() =>
        freshUseParticipationsByCountry("country-INVALID")
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.participations).toHaveLength(0);
    });
  });
});
