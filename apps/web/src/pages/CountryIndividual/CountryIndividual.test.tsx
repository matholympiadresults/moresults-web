import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { MantineProvider } from "@mantine/core";
import { CountryIndividual } from "./index";
import type { Country, Competition, Person, Participation } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  useCountry: vi.fn(),
  useParticipationsByCountry: vi.fn(),
  useParticipations: vi.fn(),
  useCompetitions: vi.fn(),
  usePeople: vi.fn(),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Line: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import {
  useCountry,
  useParticipationsByCountry,
  useParticipations,
  useCompetitions,
  usePeople,
} from "@/hooks/api";

const mockUseCountry = useCountry as ReturnType<typeof vi.fn>;
const mockUseParticipationsByCountry = useParticipationsByCountry as ReturnType<typeof vi.fn>;
const mockUseParticipations = useParticipations as ReturnType<typeof vi.fn>;
const mockUseCompetitions = useCompetitions as ReturnType<typeof vi.fn>;
const mockUsePeople = usePeople as ReturnType<typeof vi.fn>;

// Test fixtures
const createCountry = (code: string, name: string): Country => ({
  id: `country-${code}`,
  code,
  name,
});

const createCompetition = (source: Source, year: number, numProblems = 6): Competition => ({
  id: `${source.toLowerCase()}-${year}`,
  source,
  year,
  edition: null,
  host_country_id: null,
  num_problems: numProblems,
  max_score_per_problem: 7,
});

const createPerson = (id: string, name: string, countryId: string): Person => ({
  id,
  name,
  given_name: null,
  family_name: null,
  country_id: countryId,
  aliases: [],
  source_ids: {},
});

const createParticipation = (
  competitionId: string,
  countryId: string,
  personId: string,
  total: number,
  award: Award | null = null,
  rank: number | null = null
): Participation => ({
  id: `${competitionId}-${personId}`,
  competition_id: competitionId,
  person_id: personId,
  country_id: countryId,
  problem_scores: [7, 7, 7, 7, 7, 7].slice(0, Math.ceil(total / 7)),
  total,
  rank,
  regional_rank: null,
  award,
  extra_awards: null,
  source_contestant_id: null,
});

const mockCountry: Country = createCountry("usa", "United States");

const mockCompetitions: Competition[] = [
  createCompetition(Source.IMO, 2023),
  createCompetition(Source.IMO, 2024),
  createCompetition(Source.EGMO, 2024, 4),
];

const mockPeople: Person[] = [
  createPerson("person-1", "Alice Smith", "country-usa"),
  createPerson("person-2", "Bob Jones", "country-usa"),
  createPerson("person-3", "Carol White", "country-usa"),
];

const mockCountryParticipations: Participation[] = [
  createParticipation("imo-2023", "country-usa", "person-1", 42, Award.GOLD, 1),
  createParticipation("imo-2024", "country-usa", "person-1", 40, Award.GOLD, 2),
  createParticipation("imo-2024", "country-usa", "person-2", 35, Award.SILVER, 15),
  createParticipation("egmo-2024", "country-usa", "person-3", 28, Award.GOLD, 1),
];

const mockAllParticipations: Participation[] = [
  ...mockCountryParticipations,
  createParticipation("imo-2024", "country-gbr", "person-4", 38, Award.GOLD, 3),
  createParticipation("imo-2024", "country-chn", "person-5", 36, Award.SILVER, 10),
];

const renderComponent = (code: string = "usa") => {
  return render(
    <MemoryRouter initialEntries={[`/countries/individual/${code}`]}>
      <MantineProvider>
        <Routes>
          <Route path="/countries/individual/:code" element={<CountryIndividual />} />
        </Routes>
      </MantineProvider>
    </MemoryRouter>
  );
};

describe("CountryIndividual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading state in table when data is loading", () => {
      mockUseCountry.mockReturnValue({
        data: null,
        country: null,
        loading: true,
        error: null,
      });
      mockUseParticipationsByCountry.mockReturnValue({
        data: [],
        participations: [],
        loading: true,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        data: [],
        participations: [],
        loading: true,
        error: null,
      });
      mockUseCompetitions.mockReturnValue({
        data: [],
        competitions: [],
        loading: true,
        error: null,
      });
      mockUsePeople.mockReturnValue({
        data: [],
        people: [],
        loading: true,
        error: null,
      });

      renderComponent();

      // The loading state uses skeleton loaders (Mantine Skeleton components)
      // Check for the presence of skeleton elements
      expect(document.querySelector(".mantine-Skeleton-root")).toBeInTheDocument();
    });
  });

  describe("not found state", () => {
    it("shows error message when country is not found", () => {
      mockUseCountry.mockReturnValue({
        data: null,
        country: null,
        loading: false,
        error: null,
      });
      mockUseParticipationsByCountry.mockReturnValue({
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
      mockUsePeople.mockReturnValue({
        data: [],
        people: [],
        loading: false,
        error: null,
      });

      renderComponent("xyz");

      expect(screen.getByText("Country not found: xyz")).toBeInTheDocument();
    });
  });

  describe("data display", () => {
    beforeEach(() => {
      mockUseCountry.mockReturnValue({
        data: mockCountry,
        country: mockCountry,
        loading: false,
        error: null,
      });
      mockUseParticipationsByCountry.mockReturnValue({
        data: mockCountryParticipations,
        participations: mockCountryParticipations,
        loading: false,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        data: mockAllParticipations,
        participations: mockAllParticipations,
        loading: false,
        error: null,
      });
      mockUseCompetitions.mockReturnValue({
        data: mockCompetitions,
        competitions: mockCompetitions,
        loading: false,
        error: null,
      });
      mockUsePeople.mockReturnValue({
        data: mockPeople,
        people: mockPeople,
        loading: false,
        error: null,
      });
    });

    it("displays country name", () => {
      renderComponent();

      expect(screen.getByText("United States")).toBeInTheDocument();
    });

    it("displays source tabs for competitions the country participated in", () => {
      renderComponent();

      expect(screen.getByRole("tab", { name: "IMO" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "EGMO" })).toBeInTheDocument();
    });

    it("displays medal statistics cards", () => {
      renderComponent();

      // Use getAllByText since there might be duplicates (in legend and stats cards)
      expect(screen.getAllByText("Gold").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Silver").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bronze").length).toBeGreaterThan(0);
      expect(screen.getByText("Honourable Mention")).toBeInTheDocument();
    });

    it("displays team rank chart section", () => {
      renderComponent();

      expect(screen.getByText("Team Rank Over Time")).toBeInTheDocument();
    });

    it("displays medal progression chart section", () => {
      renderComponent();

      expect(screen.getByText("Medal Progression")).toBeInTheDocument();
    });

    it("displays participations table", () => {
      renderComponent();

      expect(screen.getByText(/Participations/)).toBeInTheDocument();
    });

    it("displays table headers for participations", () => {
      renderComponent();

      expect(screen.getByText("Contestant")).toBeInTheDocument();
      expect(screen.getByText("Year")).toBeInTheDocument();
      expect(screen.getByText("Rank")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("Award")).toBeInTheDocument();
    });

    it("displays contestant names in the table", () => {
      renderComponent();

      // Use getAllByText since contestants might appear multiple times (multiple participations)
      expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bob Jones").length).toBeGreaterThan(0);
    });

    it("has links to contestant pages", () => {
      renderComponent();

      const aliceLinks = screen.getAllByRole("link", { name: "Alice Smith" });
      expect(aliceLinks.length).toBeGreaterThan(0);
      expect(aliceLinks[0]).toHaveAttribute("href", "/contestants/person-1");
    });
  });

  describe("source tab switching", () => {
    beforeEach(() => {
      mockUseCountry.mockReturnValue({
        data: mockCountry,
        country: mockCountry,
        loading: false,
        error: null,
      });
      mockUseParticipationsByCountry.mockReturnValue({
        data: mockCountryParticipations,
        participations: mockCountryParticipations,
        loading: false,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        data: mockAllParticipations,
        participations: mockAllParticipations,
        loading: false,
        error: null,
      });
      mockUseCompetitions.mockReturnValue({
        data: mockCompetitions,
        competitions: mockCompetitions,
        loading: false,
        error: null,
      });
      mockUsePeople.mockReturnValue({
        data: mockPeople,
        people: mockPeople,
        loading: false,
        error: null,
      });
    });

    it("filters participations when switching source tabs", async () => {
      const user = userEvent.setup();
      renderComponent();

      // Initially on IMO tab - should show IMO participations
      expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Bob Jones").length).toBeGreaterThan(0);

      // Click on EGMO tab
      const egmoTab = screen.getByRole("tab", { name: "EGMO" });
      await user.click(egmoTab);

      // Should show EGMO participations (Carol White)
      expect(screen.getAllByText("Carol White").length).toBeGreaterThan(0);
    });
  });

  describe("chart mode toggles", () => {
    beforeEach(() => {
      mockUseCountry.mockReturnValue({
        data: mockCountry,
        country: mockCountry,
        loading: false,
        error: null,
      });
      mockUseParticipationsByCountry.mockReturnValue({
        data: mockCountryParticipations,
        participations: mockCountryParticipations,
        loading: false,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        data: mockAllParticipations,
        participations: mockAllParticipations,
        loading: false,
        error: null,
      });
      mockUseCompetitions.mockReturnValue({
        data: mockCompetitions,
        competitions: mockCompetitions,
        loading: false,
        error: null,
      });
      mockUsePeople.mockReturnValue({
        data: mockPeople,
        people: mockPeople,
        loading: false,
        error: null,
      });
    });

    it("has team rank mode toggle", () => {
      renderComponent();

      expect(screen.getByText("Absolute")).toBeInTheDocument();
      expect(screen.getByText("Relative")).toBeInTheDocument();
    });

    it("has medal chart mode toggle", () => {
      renderComponent();

      expect(screen.getByText("Yearly")).toBeInTheDocument();
      expect(screen.getByText("Cumulative")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows no participations message when there are none", () => {
      mockUseCountry.mockReturnValue({
        data: mockCountry,
        country: mockCountry,
        loading: false,
        error: null,
      });
      mockUseParticipationsByCountry.mockReturnValue({
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
        data: mockCompetitions,
        competitions: mockCompetitions,
        loading: false,
        error: null,
      });
      mockUsePeople.mockReturnValue({
        data: [],
        people: [],
        loading: false,
        error: null,
      });

      renderComponent();

      expect(screen.getByText("No participations found")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when there is a loading error", () => {
      mockUseCountry.mockReturnValue({
        data: mockCountry,
        country: mockCountry,
        loading: false,
        error: new Error("Failed to load"),
      });
      mockUseParticipationsByCountry.mockReturnValue({
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
      mockUsePeople.mockReturnValue({
        data: [],
        people: [],
        loading: false,
        error: null,
      });

      renderComponent();

      // The error message is displayed via the getTableBody utility
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });
});
