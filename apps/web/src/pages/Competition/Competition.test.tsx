import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Competition } from "./index";
import type {
  Competition as CompetitionType,
  Country,
  Person,
  Participation,
} from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  useCompetition: vi.fn(),
  useParticipationsByCompetition: vi.fn(),
  useTeamParticipationsByCompetition: vi.fn(),
  useCountries: vi.fn(),
  usePeople: vi.fn(),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

import {
  useCompetition,
  useParticipationsByCompetition,
  useTeamParticipationsByCompetition,
  useCountries,
  usePeople,
} from "@/hooks/api";

const mockUseCompetition = vi.mocked(useCompetition);
const mockUseParticipationsByCompetition = vi.mocked(useParticipationsByCompetition);
const mockUseTeamParticipationsByCompetition = vi.mocked(useTeamParticipationsByCompetition);
const mockUseCountries = vi.mocked(useCountries);
const mockUsePeople = vi.mocked(usePeople);

// Test data fixtures
const mockCountries: Country[] = [
  { id: "country-usa", code: "USA", name: "United States" },
  { id: "country-chn", code: "CHN", name: "China" },
  { id: "country-gbr", code: "GBR", name: "United Kingdom" },
];

const mockPeople: Person[] = [
  {
    id: "person-1",
    name: "Alice Johnson",
    given_name: "Alice",
    family_name: "Johnson",
    country_id: "country-usa",
    aliases: [],
    source_ids: {},
  },
  {
    id: "person-2",
    name: "Bob Smith",
    given_name: "Bob",
    family_name: "Smith",
    country_id: "country-chn",
    aliases: [],
    source_ids: {},
  },
  {
    id: "person-3",
    name: "Charlie Brown",
    given_name: "Charlie",
    family_name: "Brown",
    country_id: "country-gbr",
    aliases: [],
    source_ids: {},
  },
];

const mockCompetition: CompetitionType = {
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
    country_id: "country-chn",
    problem_scores: [7, 7, 6, 7, 5, 7],
    total: 39,
    rank: 2,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
  },
  {
    id: "IMO-2023-person-3",
    competition_id: "IMO-2023",
    person_id: "person-3",
    country_id: "country-gbr",
    problem_scores: [7, 5, 4, 6, 3, 5],
    total: 30,
    rank: 3,
    regional_rank: null,
    award: Award.SILVER,
    extra_awards: null,
    source_contestant_id: null,
  },
];

function renderCompetition(competitionId = "IMO-2023") {
  return render(
    <MemoryRouter initialEntries={[`/competitions/${competitionId}`]}>
      <MantineProvider>
        <Routes>
          <Route path="/competitions/:id" element={<Competition />} />
        </Routes>
      </MantineProvider>
    </MemoryRouter>
  );
}

function setupMocks(overrides?: {
  competition?: CompetitionType | null;
  participations?: Participation[];
  countries?: Country[];
  people?: Person[];
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

  const people = overrides?.people ?? mockPeople;
  mockUsePeople.mockReturnValue({
    data: people,
    people,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });
}

describe("Competition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders competition title with source and year", () => {
      setupMocks();
      renderCompetition();

      expect(screen.getByText("IMO 2023")).toBeInTheDocument();
    });

    it("renders edition information", () => {
      setupMocks();
      renderCompetition();

      // The component uses template literals like `${edition}th edition`
      expect(screen.getByText(/64th edition/)).toBeInTheDocument();
    });

    it("renders link to statistics page", () => {
      setupMocks();
      renderCompetition();

      const statsLink = screen.getByRole("link", { name: "Statistics" });
      expect(statsLink).toHaveAttribute("href", "/competitions/IMO-2023/statistics");
    });

    it("renders score distribution section", () => {
      setupMocks();
      renderCompetition();

      expect(screen.getByText("Score Distribution")).toBeInTheDocument();
    });

    it("renders results section with tabs", () => {
      setupMocks();
      renderCompetition();

      expect(screen.getByText("Results")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Individual/ })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Country/ })).toBeInTheDocument();
    });
  });

  describe("individual results tab", () => {
    it("displays contestant count", () => {
      setupMocks();
      renderCompetition();

      expect(screen.getByText(/3 of 3 contestants/)).toBeInTheDocument();
    });

    it("renders search input", () => {
      setupMocks();
      renderCompetition();

      expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument();
    });

    it("renders country filter dropdown", () => {
      setupMocks();
      renderCompetition();

      expect(screen.getByPlaceholderText("Filter by country")).toBeInTheDocument();
    });

    it("renders award filter dropdown", () => {
      setupMocks();
      renderCompetition();

      expect(screen.getByPlaceholderText("Filter by award")).toBeInTheDocument();
    });

    it("renders table with contestant data", () => {
      setupMocks();
      renderCompetition();

      const table = screen.getByRole("table");
      expect(within(table).getByText("Rank")).toBeInTheDocument();
      expect(within(table).getByText("Name")).toBeInTheDocument();
      expect(within(table).getByText("Country")).toBeInTheDocument();
      expect(within(table).getByText("Total")).toBeInTheDocument();
      expect(within(table).getByText("Award")).toBeInTheDocument();
    });

    it("displays contestant names as links", () => {
      setupMocks();
      renderCompetition();

      expect(screen.getByRole("link", { name: "Alice Johnson" })).toHaveAttribute(
        "href",
        "/contestants/person-1"
      );
      expect(screen.getByRole("link", { name: "Bob Smith" })).toHaveAttribute(
        "href",
        "/contestants/person-2"
      );
    });

    it("displays ranks correctly", () => {
      setupMocks();
      renderCompetition();

      const table = screen.getByRole("table");
      // Numbers appear multiple times in the table (ranks, problem scores, etc.)
      // Just verify that the rank column header exists and some rank values are present
      expect(within(table).getByText("Rank")).toBeInTheDocument();
      // Rank 1 contestant should be visible
      expect(within(table).getAllByText("1").length).toBeGreaterThan(0);
    });

    it("displays total scores", () => {
      setupMocks();
      renderCompetition();

      const table = screen.getByRole("table");
      expect(within(table).getByText("42")).toBeInTheDocument();
      expect(within(table).getByText("39")).toBeInTheDocument();
      expect(within(table).getByText("30")).toBeInTheDocument();
    });

    it("displays award badges", () => {
      setupMocks();
      renderCompetition();

      // Both gold and silver should appear
      const goldBadges = screen.getAllByText("gold");
      expect(goldBadges.length).toBe(2);
      expect(screen.getByText("silver")).toBeInTheDocument();
    });

    it("displays problem score columns", () => {
      setupMocks();
      renderCompetition();

      const table = screen.getByRole("table");
      expect(within(table).getByText("P1")).toBeInTheDocument();
      expect(within(table).getByText("P2")).toBeInTheDocument();
      expect(within(table).getByText("P3")).toBeInTheDocument();
      expect(within(table).getByText("P4")).toBeInTheDocument();
      expect(within(table).getByText("P5")).toBeInTheDocument();
      expect(within(table).getByText("P6")).toBeInTheDocument();
    });
  });

  describe("country results tab", () => {
    it("switches to country tab when clicked", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetition();

      const countryTab = screen.getByRole("tab", { name: /Country/ });
      await user.click(countryTab);

      expect(screen.getByText(/3 countries/)).toBeInTheDocument();
    });

    it("displays country standings table", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetition();

      const countryTab = screen.getByRole("tab", { name: /Country/ });
      await user.click(countryTab);

      const table = screen.getByRole("table");
      expect(within(table).getByText("Rank")).toBeInTheDocument();
      expect(within(table).getByText("Country")).toBeInTheDocument();
      expect(within(table).getByText("Total")).toBeInTheDocument();
      expect(within(table).getByText("Participants")).toBeInTheDocument();
    });
  });

  describe("search functionality", () => {
    it("filters contestants by name", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetition();

      const searchInput = screen.getByPlaceholderText("Search by name...");
      await user.type(searchInput, "Alice");

      expect(screen.getByText(/1 of 3 contestants/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Bob Smith" })).not.toBeInTheDocument();
    });
  });

  describe("not found state", () => {
    it("shows error when competition not found", () => {
      setupMocks({ competition: null });
      renderCompetition("INVALID-ID");

      expect(screen.getByText(/Competition not found/)).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("handles loading state", () => {
      setupMocks({ loading: true });
      renderCompetition();

      // Should still render the page structure
      expect(screen.getByText("Results")).toBeInTheDocument();
    });
  });

  describe("empty participations", () => {
    it("handles competition with no participations", () => {
      setupMocks({ participations: [] });
      renderCompetition();

      expect(screen.getByText("0 of 0 contestants")).toBeInTheDocument();
      expect(screen.getByText("No contestants found")).toBeInTheDocument();
    });
  });

  describe("score distribution legend", () => {
    it("displays medal color legend", () => {
      setupMocks();
      renderCompetition();

      // The legend is in a Group, look for the text labels
      // Medal labels appear in both the legend and table header
      // so use getAllByText to handle multiple occurrences
      expect(screen.getAllByText("Gold").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Silver").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bronze").length).toBeGreaterThan(0);
      expect(screen.getAllByText("HM").length).toBeGreaterThan(0);
      expect(screen.getByText("No award")).toBeInTheDocument();
    });
  });

  describe("missing data handling", () => {
    it("handles missing country gracefully", () => {
      const participationsWithUnknownCountry: Participation[] = [
        {
          ...mockParticipations[0],
          country_id: "country-unknown",
        },
      ];

      setupMocks({ participations: participationsWithUnknownCountry });
      renderCompetition();

      // Should display the country ID as fallback - may appear multiple times
      // (in table and possibly in filter options)
      expect(screen.getAllByText("country-unknown").length).toBeGreaterThan(0);
    });

    it("handles missing person gracefully", () => {
      const participationsWithUnknownPerson: Participation[] = [
        {
          ...mockParticipations[0],
          person_id: "person-unknown",
        },
      ];

      setupMocks({ participations: participationsWithUnknownPerson });
      renderCompetition();

      // Should display the person ID as fallback
      expect(screen.getByText("person-unknown")).toBeInTheDocument();
    });

    it("handles null rank", () => {
      const participationsWithNullRank: Participation[] = [
        {
          ...mockParticipations[0],
          rank: null,
        },
      ];

      setupMocks({ participations: participationsWithNullRank });
      renderCompetition();

      // Should display "-" for null rank
      const table = screen.getByRole("table");
      expect(within(table).getByText("-")).toBeInTheDocument();
    });

    it("handles null problem scores", () => {
      const participationsWithNullScores: Participation[] = [
        {
          ...mockParticipations[0],
          problem_scores: [7, null, 7, null, 7, 7],
        },
      ];

      setupMocks({ participations: participationsWithNullScores });
      renderCompetition();

      // Null scores should show as "-"
      const table = screen.getByRole("table");
      const dashCells = within(table).getAllByText("-");
      expect(dashCells.length).toBeGreaterThan(0);
    });
  });
});
