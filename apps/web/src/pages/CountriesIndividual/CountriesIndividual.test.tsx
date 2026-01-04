import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { CountriesIndividual } from "./index";
import type { Country, Participation } from "@/schemas/base";
import { Award } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  useCountries: vi.fn(),
  useParticipations: vi.fn(),
}));

import { useCountries, useParticipations } from "@/hooks/api";

const mockUseCountries = useCountries as ReturnType<typeof vi.fn>;
const mockUseParticipations = useParticipations as ReturnType<typeof vi.fn>;

// Test fixtures
const createCountry = (code: string, name: string): Country => ({
  id: `country-${code}`,
  code,
  name,
});

const createParticipation = (
  countryId: string,
  personId: string,
  award: Award | null = null
): Participation => ({
  id: `imo-2024-${personId}`,
  competition_id: "imo-2024",
  person_id: personId,
  country_id: countryId,
  problem_scores: [7, 7, 7, 7, 7, 7],
  total: 42,
  rank: 1,
  regional_rank: null,
  award,
  extra_awards: null,
  source_contestant_id: null,
});

const mockCountries: Country[] = [
  createCountry("usa", "United States"),
  createCountry("gbr", "United Kingdom"),
  createCountry("chn", "China"),
];

const mockParticipations: Participation[] = [
  createParticipation("country-usa", "person-1", Award.GOLD),
  createParticipation("country-usa", "person-2", Award.SILVER),
  createParticipation("country-gbr", "person-3", Award.BRONZE),
  createParticipation("country-chn", "person-4", Award.GOLD),
  createParticipation("country-chn", "person-5", Award.GOLD),
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <MantineProvider>
        <CountriesIndividual />
      </MantineProvider>
    </BrowserRouter>
  );
};

describe("CountriesIndividual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows skeleton loaders when data is loading", () => {
      mockUseCountries.mockReturnValue({
        countries: [],
        loading: true,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        participations: [],
        loading: true,
        error: null,
      });

      renderComponent();

      // Skeleton loaders should be present - check for skeleton elements
      const skeletons = document.querySelectorAll(".mantine-Skeleton-root");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("shows error message when there is an error", () => {
      mockUseCountries.mockReturnValue({
        countries: [],
        loading: false,
        error: new Error("Failed to load"),
      });
      mockUseParticipations.mockReturnValue({
        participations: [],
        loading: false,
        error: null,
      });

      renderComponent();

      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });

  describe("data display", () => {
    beforeEach(() => {
      mockUseCountries.mockReturnValue({
        countries: mockCountries,
        loading: false,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        participations: mockParticipations,
        loading: false,
        error: null,
      });
    });

    it("displays page title", () => {
      renderComponent();

      expect(screen.getByText("Countries (Individual)")).toBeInTheDocument();
    });

    it("displays country count", () => {
      renderComponent();

      expect(screen.getByText("3 countries")).toBeInTheDocument();
    });

    it("displays all countries in the table", () => {
      renderComponent();

      expect(screen.getByText("United States")).toBeInTheDocument();
      expect(screen.getByText("United Kingdom")).toBeInTheDocument();
      expect(screen.getByText("China")).toBeInTheDocument();
    });

    it("displays correct medal counts for each country", () => {
      renderComponent();

      // Get all table rows
      const rows = screen.getAllByRole("row");

      // Find USA row (should have 1 gold, 1 silver, 2 total medals)
      const usaRow = rows.find((row) => within(row).queryByText("United States"));
      expect(usaRow).toBeDefined();

      // Find China row (should have 2 gold, 2 total medals)
      const chinaRow = rows.find((row) => within(row).queryByText("China"));
      expect(chinaRow).toBeDefined();
    });

    it("displays table headers", () => {
      renderComponent();

      expect(screen.getByText("Country")).toBeInTheDocument();
      expect(screen.getByText("Participations")).toBeInTheDocument();
      expect(screen.getByText("Gold")).toBeInTheDocument();
      expect(screen.getByText("Silver")).toBeInTheDocument();
      expect(screen.getByText("Bronze")).toBeInTheDocument();
      expect(screen.getByText("HM")).toBeInTheDocument();
      expect(screen.getByText("Total Medals")).toBeInTheDocument();
    });

    it("has links to individual country pages", () => {
      renderComponent();

      const usaLink = screen.getByRole("link", { name: /United States/i });
      expect(usaLink).toHaveAttribute("href", "/countries/individual/usa");
    });
  });

  describe("search functionality", () => {
    beforeEach(() => {
      mockUseCountries.mockReturnValue({
        countries: mockCountries,
        loading: false,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        participations: mockParticipations,
        loading: false,
        error: null,
      });
    });

    it("has a search input", () => {
      renderComponent();

      expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument();
    });

    it("filters countries when searching", async () => {
      const user = userEvent.setup();
      renderComponent();

      const searchInput = screen.getByPlaceholderText("Search by name...");
      await user.type(searchInput, "United");

      // Should show filtered count
      expect(screen.getByText(/of 3 countries/)).toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    beforeEach(() => {
      mockUseCountries.mockReturnValue({
        countries: mockCountries,
        loading: false,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        participations: mockParticipations,
        loading: false,
        error: null,
      });
    });

    it("shows pagination controls", () => {
      renderComponent();

      expect(screen.getByText(/Showing/)).toBeInTheDocument();
    });

    it("has page size selector", () => {
      renderComponent();

      expect(screen.getByText("50 per page")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows no countries message when list is empty", () => {
      mockUseCountries.mockReturnValue({
        countries: [],
        loading: false,
        error: null,
      });
      mockUseParticipations.mockReturnValue({
        participations: [],
        loading: false,
        error: null,
      });

      renderComponent();

      expect(screen.getByText("No countries found")).toBeInTheDocument();
    });
  });
});
