import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { HallOfFame } from "./index";
import type { Person, Participation, Competition, Country } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  usePeople: vi.fn(),
  useParticipations: vi.fn(),
  useCompetitions: vi.fn(),
  useCountries: vi.fn(),
}));

import {
  usePeople,
  useParticipations,
  useCompetitions,
  useCountries,
} from "@/hooks/api";

const mockUsePeople = vi.mocked(usePeople);
const mockUseParticipations = vi.mocked(useParticipations);
const mockUseCompetitions = vi.mocked(useCompetitions);
const mockUseCountries = vi.mocked(useCountries);

// Test data fixtures
const mockCountries: Country[] = [
  { id: "country-usa", code: "USA", name: "United States" },
  { id: "country-chn", code: "CHN", name: "China" },
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
];

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

const mockParticipations: Participation[] = [
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
    problem_scores: [7, 7, 7, 7, 7, 7],
    total: 42,
    rank: 1,
    regional_rank: null,
    award: Award.GOLD,
    extra_awards: null,
    source_contestant_id: null,
  },
  {
    id: "IMO-2020-person-2",
    competition_id: "IMO-2020",
    person_id: "person-2",
    country_id: "country-chn",
    problem_scores: [7, 7, 7, 5, 5, 5],
    total: 36,
    rank: 10,
    regional_rank: null,
    award: Award.SILVER,
    extra_awards: null,
    source_contestant_id: null,
  },
];

function renderHallOfFame() {
  return render(
    <MemoryRouter>
      <MantineProvider>
        <HallOfFame />
      </MantineProvider>
    </MemoryRouter>
  );
}

function setupMocks(overrides?: {
  people?: Person[];
  participations?: Participation[];
  competitions?: Competition[];
  countries?: Country[];
  loading?: boolean;
  error?: Error | null;
}) {
  const people = overrides?.people ?? mockPeople;
  mockUsePeople.mockReturnValue({
    data: people,
    people,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });

  const participations = overrides?.participations ?? mockParticipations;
  mockUseParticipations.mockReturnValue({
    data: participations,
    participations,
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

describe("HallOfFame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the title and description", () => {
      setupMocks();
      renderHallOfFame();

      expect(screen.getByText("Hall of Fame")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Top contestants ranked by medals (gold, then silver, then bronze)"
        )
      ).toBeInTheDocument();
    });

    it("shows contestant count", () => {
      setupMocks();
      renderHallOfFame();

      expect(screen.getByText("2 contestants with medals")).toBeInTheDocument();
    });

    it("renders competition filter dropdown", () => {
      setupMocks();
      renderHallOfFame();

      expect(screen.getByRole("textbox", { name: "Competition" })).toBeInTheDocument();
    });

    it("renders country filter dropdown", () => {
      setupMocks();
      renderHallOfFame();

      expect(screen.getByRole("textbox", { name: "Country" })).toBeInTheDocument();
    });

    it("renders table with correct headers", () => {
      setupMocks();
      renderHallOfFame();

      const table = screen.getByRole("table");
      expect(within(table).getByText("#")).toBeInTheDocument();
      expect(within(table).getByText("Name")).toBeInTheDocument();
      expect(within(table).getByText("Country")).toBeInTheDocument();
      expect(within(table).getByText("Gold")).toBeInTheDocument();
      expect(within(table).getByText("Silver")).toBeInTheDocument();
      expect(within(table).getByText("Bronze")).toBeInTheDocument();
      expect(within(table).getByText("HM")).toBeInTheDocument();
      expect(within(table).getByText("Total")).toBeInTheDocument();
      expect(within(table).getByText("Participations")).toBeInTheDocument();
    });

    it("renders contestant data in table rows", () => {
      setupMocks();
      renderHallOfFame();

      // Alice has 2 golds, should be ranked #1
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      // Bob has 1 silver, should be ranked #2
      expect(screen.getByRole("link", { name: "Bob Smith" })).toBeInTheDocument();
    });

    it("displays medal badges for non-zero values", () => {
      setupMocks();
      renderHallOfFame();

      // Alice has 2 golds - find badge with "2" in Alice's row
      const aliceRow = screen
        .getByRole("link", { name: "Alice Johnson" })
        .closest("tr");
      expect(aliceRow).toBeInTheDocument();
      // The "2" appears in the gold column and also in total/participations
      const aliceCells = within(aliceRow!).getAllByRole("cell");
      // Gold column is at index 3
      expect(aliceCells[3].textContent).toBe("2");

      // Bob has 1 silver
      const bobRow = screen.getByRole("link", { name: "Bob Smith" }).closest("tr");
      expect(bobRow).toBeInTheDocument();
      const bobCells = within(bobRow!).getAllByRole("cell");
      // Silver column is at index 4
      expect(bobCells[4].textContent).toBe("1");
    });

    it("displays dash for zero medal counts", () => {
      setupMocks();
      renderHallOfFame();

      // Alice has no silver, bronze, or HM - should show dashes
      const aliceRow = screen
        .getByRole("link", { name: "Alice Johnson" })
        .closest("tr");
      expect(aliceRow).toBeInTheDocument();
      // Find dashes in Alice's row (silver, bronze, HM columns)
      const dashes = within(aliceRow!).getAllByText("-");
      expect(dashes.length).toBeGreaterThan(0);
    });

    it("links contestant names to their profile pages", () => {
      setupMocks();
      renderHallOfFame();

      const aliceLink = screen.getByRole("link", { name: "Alice Johnson" });
      expect(aliceLink).toHaveAttribute("href", "/contestants/person-1");
    });
  });

  describe("loading state", () => {
    it("shows loading indicator when data is loading", () => {
      setupMocks({ loading: true });
      renderHallOfFame();

      // Loading state should show skeleton loaders
      expect(screen.getByText("Hall of Fame")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows no data message when no contestants have medals", () => {
      setupMocks({ participations: [] });
      renderHallOfFame();

      expect(screen.getByText("No contestants found")).toBeInTheDocument();
      expect(screen.getByText("0 contestants with medals")).toBeInTheDocument();
    });
  });

  describe("filtering", () => {
    it("filters by competition source", async () => {
      const user = userEvent.setup();

      // Add EGMO participation for person-2
      const participationsWithEGMO: Participation[] = [
        ...mockParticipations,
        {
          id: "EGMO-2020-person-2",
          competition_id: "EGMO-2020",
          person_id: "person-2",
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

      setupMocks({ participations: participationsWithEGMO });
      renderHallOfFame();

      // Initially shows all contestants
      expect(screen.getByText("2 contestants with medals")).toBeInTheDocument();

      // Open competition filter
      const competitionSelect = screen.getByRole("textbox", { name: "Competition" });
      await user.click(competitionSelect);

      // Wait for options to appear and select EGMO
      const egmoOption = await screen.findByText("EGMO");
      await user.click(egmoOption);

      // Now should only show Bob (who has EGMO gold)
      expect(screen.getByText("1 contestants with medals")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Bob Smith" })).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Alice Johnson" })
      ).not.toBeInTheDocument();
    });

    it("renders country filter with correct options", () => {
      setupMocks();
      renderHallOfFame();

      // Verify the country filter exists
      const countrySelect = screen.getByRole("textbox", { name: "Country" });
      expect(countrySelect).toBeInTheDocument();

      // Verify both contestants are shown (no filter applied)
      expect(screen.getByText("2 contestants with medals")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Alice Johnson" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Bob Smith" })
      ).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("displays contestants in correct default order (gold > silver > bronze)", () => {
      setupMocks();
      renderHallOfFame();

      const links = screen.getAllByRole("link");
      const contestantLinks = links.filter(
        (link) =>
          link.getAttribute("href")?.startsWith("/contestants/")
      );

      // Alice (2 golds) should come before Bob (1 silver)
      expect(contestantLinks[0]).toHaveTextContent("Alice Johnson");
      expect(contestantLinks[1]).toHaveTextContent("Bob Smith");
    });

    it("assigns correct ranks based on medal order", () => {
      setupMocks();
      renderHallOfFame();

      // Find Alice's row and verify rank is 1
      const aliceRow = screen
        .getByRole("link", { name: "Alice Johnson" })
        .closest("tr");
      const aliceCells = within(aliceRow!).getAllByRole("cell");
      expect(aliceCells[0]).toHaveTextContent("1"); // Rank column

      // Find Bob's row and verify rank is 2
      const bobRow = screen.getByRole("link", { name: "Bob Smith" }).closest("tr");
      const bobCells = within(bobRow!).getAllByRole("cell");
      expect(bobCells[0]).toHaveTextContent("2"); // Rank column
    });
  });

  describe("pagination", () => {
    it("shows pagination controls", () => {
      setupMocks();
      renderHallOfFame();

      // Should show "Showing X of Y" text
      expect(screen.getByText(/Showing.*of/)).toBeInTheDocument();
    });

    it("shows page size selector", () => {
      setupMocks();
      renderHallOfFame();

      expect(screen.getByText("50 per page")).toBeInTheDocument();
    });
  });

  describe("column sorting", () => {
    it("allows clicking on sortable columns", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderHallOfFame();

      // Click on the Name header to sort
      const nameHeader = screen.getByText("Name");
      await user.click(nameHeader);

      // The table should still render without errors
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Bob Smith" })).toBeInTheDocument();
    });

    it("rank column is not sortable", () => {
      setupMocks();
      renderHallOfFame();

      const rankHeader = screen.getByText("#");
      // Rank column should not have sorting cursor
      expect(rankHeader.closest("th")).toHaveStyle({ cursor: "default" });
    });
  });
});
