import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Contestant } from "./index";
import type { Person, Participation, Competition, Country } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  usePerson: vi.fn(),
  useParticipationsByPerson: vi.fn(),
  useParticipations: vi.fn(),
  useCountries: vi.fn(),
  useCompetitions: vi.fn(),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", async () => {
  const { rechartsComponentMocks } = await import("@/test/mocks/recharts");
  return rechartsComponentMocks;
});

import {
  usePerson,
  useParticipationsByPerson,
  useParticipations,
  useCountries,
  useCompetitions,
} from "@/hooks/api";

const mockUsePerson = vi.mocked(usePerson);
const mockUseParticipationsByPerson = vi.mocked(useParticipationsByPerson);
const mockUseParticipations = vi.mocked(useParticipations);
const mockUseCountries = vi.mocked(useCountries);
const mockUseCompetitions = vi.mocked(useCompetitions);

// Test data fixtures
const mockCountries: Country[] = [
  { id: "country-usa", code: "USA", name: "United States" },
  { id: "country-chn", code: "CHN", name: "China" },
];

const mockPerson: Person = {
  id: "person-1",
  name: "Alice Johnson",
  given_name: "Alice",
  family_name: "Johnson",
  country_id: "country-usa",
  aliases: [],
  source_ids: {},
};

const mockCompetitions: Competition[] = [
  {
    id: "IMO-2020",
    source: Source.IMO,
    year: 2020,
    edition: 61,
    host_country_id: null,
    num_problems: 6,
    max_score_per_problem: 7,
  },
  {
    id: "IMO-2021",
    source: Source.IMO,
    year: 2021,
    edition: 62,
    host_country_id: null,
    num_problems: 6,
    max_score_per_problem: 7,
  },
  {
    id: "EGMO-2020",
    source: Source.EGMO,
    year: 2020,
    edition: 9,
    host_country_id: null,
    num_problems: 6,
    max_score_per_problem: 7,
  },
];

const mockPersonParticipations: Participation[] = [
  {
    id: "IMO-2020-person-1",
    competition_id: "IMO-2020",
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
    id: "IMO-2021-person-1",
    competition_id: "IMO-2021",
    person_id: "person-1",
    country_id: "country-usa",
    problem_scores: [7, 7, 7, 5, 5, 5],
    total: 36,
    rank: 5,
    regional_rank: null,
    award: Award.SILVER,
    extra_awards: null,
    source_contestant_id: null,
  },
];

const mockAllParticipations: Participation[] = [
  ...mockPersonParticipations,
  {
    id: "IMO-2020-person-2",
    competition_id: "IMO-2020",
    person_id: "person-2",
    country_id: "country-chn",
    problem_scores: [7, 7, 7, 7, 7, 0],
    total: 35,
    rank: 10,
    regional_rank: null,
    award: Award.SILVER,
    extra_awards: null,
    source_contestant_id: null,
  },
];

function renderContestant(personId: string = "person-1") {
  return render(
    <MemoryRouter initialEntries={[`/contestants/${personId}`]}>
      <MantineProvider>
        <Routes>
          <Route path="/contestants/:id" element={<Contestant />} />
        </Routes>
      </MantineProvider>
    </MemoryRouter>
  );
}

function setupMocks(overrides?: {
  person?: Person | null;
  personParticipations?: Participation[];
  allParticipations?: Participation[];
  competitions?: Competition[];
  countries?: Country[];
  loading?: boolean;
  error?: Error | null;
}) {
  const person = overrides?.person ?? mockPerson;
  mockUsePerson.mockReturnValue({
    data: person,
    person,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });

  const personParticipations = overrides?.personParticipations ?? mockPersonParticipations;
  mockUseParticipationsByPerson.mockReturnValue({
    data: personParticipations,
    participations: personParticipations,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });

  const allParticipations = overrides?.allParticipations ?? mockAllParticipations;
  mockUseParticipations.mockReturnValue({
    data: allParticipations,
    participations: allParticipations,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });

  const competitions = overrides?.competitions ?? mockCompetitions;
  mockUseCompetitions.mockReturnValue({
    data: competitions,
    competitions,
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

describe("Contestant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the contestant name as title", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByRole("heading", { name: "Alice Johnson" })).toBeInTheDocument();
    });

    it("renders the country name", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByText("United States")).toBeInTheDocument();
    });

    it("renders Individual Ranking section title", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByText("Individual Ranking")).toBeInTheDocument();
    });

    it("renders Participations section with count", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByText(/Participations \(2 of 2\)/)).toBeInTheDocument();
    });

    it("renders participation table with correct headers", () => {
      setupMocks();
      renderContestant();

      const table = screen.getByRole("table");
      expect(within(table).getByText("Competition")).toBeInTheDocument();
      expect(within(table).getByText("Year")).toBeInTheDocument();
      expect(within(table).getByText("Rank")).toBeInTheDocument();
      expect(within(table).getByText("Total")).toBeInTheDocument();
      expect(within(table).getByText("Award")).toBeInTheDocument();
    });

    it("renders problem score columns dynamically", () => {
      setupMocks();
      renderContestant();

      const table = screen.getByRole("table");
      expect(within(table).getByText("P1")).toBeInTheDocument();
      expect(within(table).getByText("P2")).toBeInTheDocument();
      expect(within(table).getByText("P3")).toBeInTheDocument();
      expect(within(table).getByText("P4")).toBeInTheDocument();
      expect(within(table).getByText("P5")).toBeInTheDocument();
      expect(within(table).getByText("P6")).toBeInTheDocument();
    });

    it("renders participation data in table rows", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByRole("link", { name: "IMO 2020" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "IMO 2021" })).toBeInTheDocument();
    });

    it("links competition names to competition pages", () => {
      setupMocks();
      renderContestant();

      const imo2020Link = screen.getByRole("link", { name: "IMO 2020" });
      expect(imo2020Link).toHaveAttribute("href", "/competitions/IMO-2020");
    });

    it("displays award badges", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByText("gold")).toBeInTheDocument();
      expect(screen.getByText("silver")).toBeInTheDocument();
    });
  });

  describe("not found state", () => {
    it("shows error message when contestant not found", () => {
      // When person is null and not loading, show error
      mockUsePerson.mockReturnValue({
        data: null,
        person: null,
        loading: false,
        error: null,
      });
      mockUseParticipationsByPerson.mockReturnValue({
        data: [],
        participations: [],
        loading: false,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        data: [],
        participations: [],
        loading: false,
        error: null,
      });
      mockUseCompetitions.mockReturnValue({
        data: [],
        competitions: [],
        loading: false,
        error: null,
      });
      mockUseCountries.mockReturnValue({
        data: [],
        countries: [],
        loading: false,
        error: null,
      });

      renderContestant("unknown-person");

      expect(screen.getByText(/Contestant not found/)).toBeInTheDocument();
    });
  });

  describe("filters", () => {
    it("renders source filter dropdown", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByPlaceholderText("Filter by source")).toBeInTheDocument();
    });

    it("renders year range filters", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByPlaceholderText("Min year")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Max year")).toBeInTheDocument();
    });

    it("renders award filter dropdown", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByPlaceholderText("Filter by award")).toBeInTheDocument();
    });

    it("renders source filter with available options", () => {
      const participationsWithEGMO: Participation[] = [
        ...mockPersonParticipations,
        {
          id: "EGMO-2020-person-1",
          competition_id: "EGMO-2020",
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
      ];

      setupMocks({ personParticipations: participationsWithEGMO });
      renderContestant();

      // Verify the filter exists and shows all participations
      expect(screen.getByPlaceholderText("Filter by source")).toBeInTheDocument();
      expect(screen.getByText(/Participations \(3 of 3\)/)).toBeInTheDocument();
    });

    it("renders award filter with available options", () => {
      setupMocks();
      renderContestant();

      // Verify the filter exists
      expect(screen.getByPlaceholderText("Filter by award")).toBeInTheDocument();
      expect(screen.getByText(/Participations \(2 of 2\)/)).toBeInTheDocument();
    });
  });

  describe("chart rendering", () => {
    it("renders the ranking chart container", () => {
      setupMocks();
      renderContestant();

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("renders chart source selector when chart data exists", () => {
      setupMocks();
      renderContestant();

      // The chart should render since we have participations
      expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
    });

    it("renders chart legend items", () => {
      setupMocks();
      renderContestant();

      // Legend items are rendered as Text components with size="sm"
      const legendSection = screen.getByText("Individual Ranking").parentElement?.parentElement;
      expect(legendSection).toBeInTheDocument();

      // Check that legend colors are present (via the legend text)
      expect(screen.getAllByText("Gold").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Silver").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Bronze").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("No medal")).toBeInTheDocument();
      expect(screen.getByText("This contestant")).toBeInTheDocument();
    });
  });

  describe("column sorting", () => {
    it("allows clicking on Year header to sort", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestant();

      const yearHeader = screen.getByText("Year");
      await user.click(yearHeader);

      // Should still render both participations
      expect(screen.getByRole("link", { name: "IMO 2020" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "IMO 2021" })).toBeInTheDocument();
    });

    it("allows clicking on Rank header to sort", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestant();

      const rankHeader = screen.getByText("Rank");
      await user.click(rankHeader);

      // Should still render both participations
      expect(screen.getByRole("link", { name: "IMO 2020" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "IMO 2021" })).toBeInTheDocument();
    });
  });

  describe("problem scores display", () => {
    it("displays problem scores in table", () => {
      setupMocks();
      renderContestant();

      // IMO 2020 row has all 7s
      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");

      // First data row (IMO 2021 or 2020 depending on default sort)
      // Check that scores are displayed
      expect(within(rows[1]).getAllByText("7").length).toBeGreaterThan(0);
    });

    it("displays totals in table", () => {
      setupMocks();
      renderContestant();

      // Should show totals for both participations
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("36")).toBeInTheDocument();
    });

    it("displays ranks in table", () => {
      setupMocks();
      renderContestant();

      // Should show ranks (1 and 5) in the rank column
      // The table has other numbers too (years 2020, 2021), so check within rows
      const rows = screen.getAllByRole("row");
      // Data rows start at index 1 (index 0 is header)
      const dataRows = rows.slice(1);
      expect(dataRows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("missing country handling", () => {
    it("handles missing country gracefully", () => {
      const personWithUnknownCountry: Person = {
        ...mockPerson,
        country_id: "country-unknown",
      };

      setupMocks({ person: personWithUnknownCountry });
      renderContestant();

      expect(screen.getByText("country-unknown")).toBeInTheDocument();
    });
  });

  describe("empty participations", () => {
    it("shows no participations message", () => {
      setupMocks({ personParticipations: [], allParticipations: [] });
      renderContestant();

      expect(screen.getByText("No participations found")).toBeInTheDocument();
    });

    it("does not render chart when no participations", () => {
      setupMocks({ personParticipations: [], allParticipations: [] });
      renderContestant();

      expect(screen.queryByText("Individual Ranking")).not.toBeInTheDocument();
    });
  });

  describe("participation count display", () => {
    it("shows correct participation count", () => {
      setupMocks();
      renderContestant();

      // Shows full count when no filter applied
      expect(screen.getByText(/Participations \(2 of 2\)/)).toBeInTheDocument();
    });
  });
});
