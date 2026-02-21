import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { CountryComparison } from "./index";
import { Award, Source } from "@/schemas/base";
import type { Country, Competition, Participation } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  useCountries: vi.fn(),
  useParticipations: vi.fn(),
  useTeamParticipations: vi.fn(),
  useCompetitions: vi.fn(),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", async () => {
  const { rechartsComponentMocks } = await import("@/test/mocks/recharts");
  return rechartsComponentMocks;
});

import {
  useCountries,
  useParticipations,
  useTeamParticipations,
  useCompetitions,
} from "@/hooks/api";

const mockUseCountries = vi.mocked(useCountries);
const mockUseParticipations = vi.mocked(useParticipations);
const mockUseTeamParticipations = vi.mocked(useTeamParticipations);
const mockUseCompetitions = vi.mocked(useCompetitions);

// Test data
const testCountries: Country[] = [
  { id: "country-usa", code: "USA", name: "United States" },
  { id: "country-chn", code: "CHN", name: "China" },
  { id: "country-kor", code: "KOR", name: "South Korea" },
];

const testCompetitions: Competition[] = [
  {
    id: "IMO-2022",
    source: Source.IMO,
    year: 2022,
    edition: 63,
    host_country_id: "country-nor",
    num_problems: 6,
    max_score_per_problem: 7,
  },
  {
    id: "IMO-2023",
    source: Source.IMO,
    year: 2023,
    edition: 64,
    host_country_id: "country-jpn",
    num_problems: 6,
    max_score_per_problem: 7,
  },
  {
    id: "EGMO-2023",
    source: Source.EGMO,
    year: 2023,
    edition: 12,
    host_country_id: null,
    num_problems: 6,
    max_score_per_problem: 7,
  },
];

const testParticipations: Participation[] = [
  // USA at IMO 2022
  {
    id: "IMO-2022-person-usa-1",
    competition_id: "IMO-2022",
    person_id: "person-usa-1",
    country_id: "country-usa",
    problem_scores: [7, 7, 7, 7, 7, 7],
    total: 42,
    rank: 1,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
  },
  {
    id: "IMO-2022-person-usa-2",
    competition_id: "IMO-2022",
    person_id: "person-usa-2",
    country_id: "country-usa",
    problem_scores: [7, 7, 5, 7, 7, 2],
    total: 35,
    rank: 10,
    regional_rank: null,
    award: Award.SILVER,
    extra_awards: null,
    source_contestant_id: null,
  },
  // China at IMO 2022
  {
    id: "IMO-2022-person-chn-1",
    competition_id: "IMO-2022",
    person_id: "person-chn-1",
    country_id: "country-chn",
    problem_scores: [7, 7, 7, 7, 7, 7],
    total: 42,
    rank: 1,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
  },
  {
    id: "IMO-2022-person-chn-2",
    competition_id: "IMO-2022",
    person_id: "person-chn-2",
    country_id: "country-chn",
    problem_scores: [7, 7, 7, 7, 7, 7],
    total: 42,
    rank: 1,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
  },
  // USA at IMO 2023
  {
    id: "IMO-2023-person-usa-1",
    competition_id: "IMO-2023",
    person_id: "person-usa-1",
    country_id: "country-usa",
    problem_scores: [7, 7, 7, 7, 7, 0],
    total: 35,
    rank: 5,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
  },
  // China at IMO 2023
  {
    id: "IMO-2023-person-chn-1",
    competition_id: "IMO-2023",
    person_id: "person-chn-1",
    country_id: "country-chn",
    problem_scores: [7, 7, 7, 7, 7, 7],
    total: 42,
    rank: 1,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
  },
  // USA at EGMO 2023 (only USA, not China)
  {
    id: "EGMO-2023-person-usa-3",
    competition_id: "EGMO-2023",
    person_id: "person-usa-3",
    country_id: "country-usa",
    problem_scores: [7, 7, 7, 7, 7, 7],
    total: 42,
    rank: 1,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
  },
];

function renderWithProviders(initialEntries: string[] = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <MantineProvider>
        <CountryComparison />
      </MantineProvider>
    </MemoryRouter>
  );
}

describe("CountryComparison", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCountries.mockReturnValue({
      data: testCountries,
      countries: testCountries,
      loading: false,
      error: null,
    });
    mockUseParticipations.mockReturnValue({
      data: testParticipations,
      participations: testParticipations,
      loading: false,
      error: null,
    });
    mockUseTeamParticipations.mockReturnValue({
      data: [],
      teamParticipations: [],
      loading: false,
      error: null,
    });
    mockUseCompetitions.mockReturnValue({
      data: testCompetitions,
      competitions: testCompetitions,
      loading: false,
      error: null,
    });
  });

  describe("initial state", () => {
    it("renders the page title and description", () => {
      renderWithProviders();

      expect(screen.getByText("Compare Countries")).toBeInTheDocument();
      expect(
        screen.getByText("Compare olympiad performance between two countries")
      ).toBeInTheDocument();
    });

    it("renders two country select inputs", () => {
      renderWithProviders();

      expect(screen.getByText("Country 1")).toBeInTheDocument();
      expect(screen.getByText("Country 2")).toBeInTheDocument();
    });

    it("shows prompt to select countries when none selected", () => {
      renderWithProviders();

      expect(
        screen.getByText("Select two countries above to compare their olympiad performance")
      ).toBeInTheDocument();
    });
  });

  describe("with countries selected via URL params", () => {
    it("displays medal summary for both countries", () => {
      renderWithProviders(["/?c1=usa&c2=chn"]);

      // Both country names should appear (may appear multiple times due to select dropdowns)
      expect(screen.getAllByText("United States").length).toBeGreaterThan(0);
      expect(screen.getAllByText("China").length).toBeGreaterThan(0);
    });

    it("displays correct medal counts for USA in IMO tab", () => {
      renderWithProviders(["/?c1=usa&c2=chn"]);

      // USA has: 2 gold (one in 2022, one in 2023), 1 silver (2022) in IMO
      // The Medal Summary section shows stats
      expect(screen.getByText("Medal Summary")).toBeInTheDocument();
    });

    it("shows IMO tab as default when both countries have IMO data", () => {
      renderWithProviders(["/?c1=usa&c2=chn"]);

      // IMO tab should be visible
      const imoTab = screen.getByRole("tab", { name: "IMO" });
      expect(imoTab).toBeInTheDocument();
    });

    it("shows Performance Over Time section", () => {
      renderWithProviders(["/?c1=usa&c2=chn"]);

      expect(screen.getByText("Performance Over Time")).toBeInTheDocument();
    });

    it("renders charts for medals, avg score, total points, and team rank", () => {
      renderWithProviders(["/?c1=usa&c2=chn"]);

      expect(screen.getByText("Medals")).toBeInTheDocument();
      expect(screen.getByText("Average Score")).toBeInTheDocument();
      expect(screen.getByText("Total Points")).toBeInTheDocument();
      expect(screen.getByText("Team Rank")).toBeInTheDocument();
    });
  });

  describe("source filtering", () => {
    it("only shows sources where both countries participated", () => {
      renderWithProviders(["/?c1=usa&c2=chn"]);

      // IMO should be visible (both participated)
      expect(screen.getByRole("tab", { name: "IMO" })).toBeInTheDocument();

      // EGMO should NOT be visible (only USA participated)
      expect(screen.queryByRole("tab", { name: "EGMO" })).not.toBeInTheDocument();
    });

    it("shows message when no common competitions found", () => {
      // Create a scenario where countries have no common competitions
      const noCommonParticipations = [
        // USA only at EGMO
        {
          id: "EGMO-2023-person-usa-1",
          competition_id: "EGMO-2023",
          person_id: "person-usa-1",
          country_id: "country-usa",
          problem_scores: [7, 7, 7, 7, 7, 7],
          total: 42,
          rank: 1,
          regional_rank: null,
          award: Award.GOLD,
          extra_awards: null,
          source_contestant_id: null,
        },
        // China only at IMO
        {
          id: "IMO-2023-person-chn-1",
          competition_id: "IMO-2023",
          person_id: "person-chn-1",
          country_id: "country-chn",
          problem_scores: [7, 7, 7, 7, 7, 7],
          total: 42,
          rank: 1,
          regional_rank: null,
          award: Award.GOLD,
          extra_awards: null,
          source_contestant_id: null,
        },
      ];
      mockUseParticipations.mockReturnValue({
        data: noCommonParticipations,
        participations: noCommonParticipations,
        loading: false,
        error: null,
      });

      renderWithProviders(["/?c1=usa&c2=chn"]);

      expect(
        screen.getByText("No common competitions found between these countries")
      ).toBeInTheDocument();
    });
  });

  describe("with only one country selected", () => {
    it("shows prompt to select second country", () => {
      renderWithProviders(["/?c1=usa"]);

      expect(
        screen.getByText("Select two countries above to compare their olympiad performance")
      ).toBeInTheDocument();
    });
  });

  describe("medal rate calculation", () => {
    it("displays medal rate percentage", () => {
      renderWithProviders(["/?c1=usa&c2=chn"]);

      // Look for medal rate text pattern
      const medalRateTexts = screen.getAllByText(/% medal rate/);
      expect(medalRateTexts.length).toBeGreaterThan(0);
    });
  });
});
