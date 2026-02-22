import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { MantineProvider } from "@mantine/core";
import { CompetitionStatistics } from "./index";
import type { Competition, Country, Participation } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  useCompetition: vi.fn(),
  useParticipationsByCompetition: vi.fn(),
  useTeamParticipationsByCompetition: vi.fn(),
  useCountries: vi.fn(),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", async () => {
  const { rechartsComponentMocks } = await import("@/test/mocks/recharts");
  return rechartsComponentMocks;
});

import {
  useCompetition,
  useParticipationsByCompetition,
  useTeamParticipationsByCompetition,
  useCountries,
} from "@/hooks/api";

const mockUseCompetition = vi.mocked(useCompetition);
const mockUseParticipationsByCompetition = vi.mocked(useParticipationsByCompetition);
const mockUseTeamParticipationsByCompetition = vi.mocked(useTeamParticipationsByCompetition);
const mockUseCountries = vi.mocked(useCountries);

// Test data fixtures
const mockCountries: Country[] = [
  { id: "country-jpn", code: "JPN", name: "Japan" },
  { id: "country-usa", code: "USA", name: "United States" },
];

const mockCompetition: Competition = {
  id: "IMO-2023",
  source: Source.IMO,
  year: 2023,
  edition: 64,
  host_country_id: "country-jpn",
  num_problems: 6,
  max_score_per_problem: 7,
};

const mockParticipations: Participation[] = [
  {
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
  },
  {
    id: "IMO-2023-person-2",
    competition_id: "IMO-2023",
    person_id: "person-2",
    country_id: "country-usa",
    problem_scores: [7, 6, 5, 4, 3, 2],
    total: 27,
    rank: 2,
    regional_rank: null,
    award: Award.SILVER,
    extra_awards: null,
    source_contestant_id: null,
  },
  {
    id: "IMO-2023-person-3",
    competition_id: "IMO-2023",
    person_id: "person-3",
    country_id: "country-usa",
    problem_scores: [0, 0, 1, 2, 3, 4],
    total: 10,
    rank: 3,
    regional_rank: null,
    award: null,
    extra_awards: null,
    source_contestant_id: null,
  },
];

function renderCompetitionStatistics(competitionId = "IMO-2023") {
  return render(
    <MemoryRouter initialEntries={[`/competitions/${competitionId}/statistics`]}>
      <MantineProvider>
        <Routes>
          <Route path="/competitions/:id/statistics" element={<CompetitionStatistics />} />
        </Routes>
      </MantineProvider>
    </MemoryRouter>
  );
}

function setupMocks(overrides?: {
  competition?: Competition | null;
  participations?: Participation[];
  countries?: Country[];
  loading?: boolean;
  error?: Error | null;
}) {
  const competition =
    overrides?.competition !== undefined ? overrides.competition : mockCompetition;
  mockUseCompetition.mockReturnValue({
    data: competition,
    competition,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });

  const participations = overrides?.participations ?? mockParticipations;
  mockUseParticipationsByCompetition.mockReturnValue({
    data: participations,
    participations,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });

  mockUseTeamParticipationsByCompetition.mockReturnValue({
    data: [],
    teamParticipations: [],
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });

  const countries = overrides?.countries ?? mockCountries;
  mockUseCountries.mockReturnValue({
    data: countries,
    countries,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });
}

describe("CompetitionStatistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders competition title with statistics suffix", () => {
      setupMocks();
      renderCompetitionStatistics();

      expect(screen.getByText("IMO 2023 - Statistics")).toBeInTheDocument();
    });

    it("renders edition information", () => {
      setupMocks();
      renderCompetitionStatistics();

      expect(screen.getByText(/64th edition/)).toBeInTheDocument();
    });

    it("renders host country name", () => {
      setupMocks();
      renderCompetitionStatistics();

      expect(screen.getByText(/Japan/)).toBeInTheDocument();
    });

    it("renders back link to competition results", () => {
      setupMocks();
      renderCompetitionStatistics();

      const backLink = screen.getByRole("link", { name: "Back to results" });
      expect(backLink).toHaveAttribute("href", "/competitions/IMO-2023");
    });
  });

  describe("score distributions section", () => {
    it("renders score distributions section title", () => {
      setupMocks();
      renderCompetitionStatistics();

      expect(screen.getByText("Score Distributions")).toBeInTheDocument();
    });

    it("renders chart for each problem", () => {
      setupMocks();
      renderCompetitionStatistics();

      expect(screen.getByText("Problem 1")).toBeInTheDocument();
      expect(screen.getByText("Problem 2")).toBeInTheDocument();
      expect(screen.getByText("Problem 3")).toBeInTheDocument();
      expect(screen.getByText("Problem 4")).toBeInTheDocument();
      expect(screen.getByText("Problem 5")).toBeInTheDocument();
      expect(screen.getByText("Problem 6")).toBeInTheDocument();
    });

    it("renders bar charts", () => {
      setupMocks();
      renderCompetitionStatistics();

      const charts = screen.getAllByTestId("bar-chart");
      expect(charts.length).toBe(6); // One for each problem
    });
  });

  describe("score distribution table", () => {
    it("renders score distribution section title", () => {
      setupMocks();
      renderCompetitionStatistics();

      // There are two "Score Distribution" - one for section, one for charts
      const headings = screen.getAllByText("Score Distribution");
      expect(headings.length).toBeGreaterThan(0);
    });

    it("renders problem column headers", () => {
      setupMocks();
      renderCompetitionStatistics();

      const tables = screen.getAllByRole("table");
      const distributionTable = tables[0];

      expect(within(distributionTable).getByText("P1")).toBeInTheDocument();
      expect(within(distributionTable).getByText("P2")).toBeInTheDocument();
      expect(within(distributionTable).getByText("P3")).toBeInTheDocument();
      expect(within(distributionTable).getByText("P4")).toBeInTheDocument();
      expect(within(distributionTable).getByText("P5")).toBeInTheDocument();
      expect(within(distributionTable).getByText("P6")).toBeInTheDocument();
    });

    it("renders rows for each score value", () => {
      setupMocks();
      renderCompetitionStatistics();

      const tables = screen.getAllByRole("table");
      const distributionTable = tables[0];

      // Should have rows for scores 0-7
      expect(within(distributionTable).getByText("Num( P# = 0 )")).toBeInTheDocument();
      expect(within(distributionTable).getByText("Num( P# = 7 )")).toBeInTheDocument();
    });

    it("renders mean row", () => {
      setupMocks();
      renderCompetitionStatistics();

      const tables = screen.getAllByRole("table");
      const distributionTable = tables[0];

      expect(within(distributionTable).getByText("Mean( P# )")).toBeInTheDocument();
    });

    it("renders max row", () => {
      setupMocks();
      renderCompetitionStatistics();

      const tables = screen.getAllByRole("table");
      const distributionTable = tables[0];

      expect(within(distributionTable).getByText("Max( P# )")).toBeInTheDocument();
    });

    it("renders standard deviation row", () => {
      setupMocks();
      renderCompetitionStatistics();

      const tables = screen.getAllByRole("table");
      const distributionTable = tables[0];

      expect(within(distributionTable).getByText("σ( P# )")).toBeInTheDocument();
    });
  });

  describe("correlations section", () => {
    it("renders correlations section title", () => {
      setupMocks();
      renderCompetitionStatistics();

      expect(screen.getByText("Correlations")).toBeInTheDocument();
    });

    it("renders correlation with sum row", () => {
      setupMocks();
      renderCompetitionStatistics();

      const tables = screen.getAllByRole("table");
      const correlationsTable = tables[1];

      expect(within(correlationsTable).getByText("Corr( P#, Sum )")).toBeInTheDocument();
    });

    it("renders problem-to-problem correlation rows", () => {
      setupMocks();
      renderCompetitionStatistics();

      const tables = screen.getAllByRole("table");
      const correlationsTable = tables[1];

      expect(within(correlationsTable).getByText("Corr( P#, P1 )")).toBeInTheDocument();
      expect(within(correlationsTable).getByText("Corr( P#, P6 )")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loading message when loading", () => {
      setupMocks({ loading: true, competition: null, participations: [] });
      renderCompetitionStatistics();

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error when competition not found", () => {
      setupMocks({ competition: null, error: new Error("Not found") });
      renderCompetitionStatistics("INVALID-ID");

      expect(screen.getByText(/Competition not found/)).toBeInTheDocument();
    });
  });

  describe("no statistics state", () => {
    it("shows message when no participations", () => {
      setupMocks({ participations: [] });
      renderCompetitionStatistics();

      expect(screen.getByText("No statistics available")).toBeInTheDocument();
    });
  });

  describe("competition without edition", () => {
    it("renders without edition when null", () => {
      const competitionWithoutEdition: Competition = {
        ...mockCompetition,
        edition: null,
      };

      setupMocks({ competition: competitionWithoutEdition });
      renderCompetitionStatistics();

      // Should not crash and should render title
      expect(screen.getByText("IMO 2023 - Statistics")).toBeInTheDocument();
      // Should not show "th edition" text
      expect(screen.queryByText(/edition/)).not.toBeInTheDocument();
    });
  });

  describe("competition without host country", () => {
    it("renders without host country when null", () => {
      const competitionWithoutHost: Competition = {
        ...mockCompetition,
        host_country_id: null,
      };

      setupMocks({ competition: competitionWithoutHost });
      renderCompetitionStatistics();

      // Should not crash and should render title
      expect(screen.getByText("IMO 2023 - Statistics")).toBeInTheDocument();
    });
  });

  describe("fewer problems", () => {
    it("handles competition with 4 problems", () => {
      const competitionWithFewerProblems: Competition = {
        ...mockCompetition,
        num_problems: 4,
      };

      const participationsWithFewerScores: Participation[] = [
        {
          ...mockParticipations[0],
          problem_scores: [7, 7, 7, 7],
          total: 28,
        },
      ];

      setupMocks({
        competition: competitionWithFewerProblems,
        participations: participationsWithFewerScores,
      });
      renderCompetitionStatistics();

      // Should show only 4 problem charts
      expect(screen.getByText("Problem 1")).toBeInTheDocument();
      expect(screen.getByText("Problem 4")).toBeInTheDocument();
      expect(screen.queryByText("Problem 5")).not.toBeInTheDocument();
      expect(screen.queryByText("Problem 6")).not.toBeInTheDocument();
    });
  });

  describe("statistics calculations", () => {
    it("calculates and displays mean values", () => {
      setupMocks();
      renderCompetitionStatistics();

      const tables = screen.getAllByRole("table");
      const distributionTable = tables[0];

      // Mean should be calculated for each problem
      // For P1: (7 + 7 + 0) / 3 = 4.667
      const meanRow = within(distributionTable).getByText("Mean( P# )").closest("tr");
      expect(meanRow).toBeInTheDocument();
      // Check that mean values are displayed as formatted numbers
      expect(within(meanRow!).getByText("4.667")).toBeInTheDocument();
    });
  });
});
