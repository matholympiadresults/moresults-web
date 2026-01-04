import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Contestants } from "./index";
import type { Person, Country } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  usePeople: vi.fn(),
  useCountries: vi.fn(),
}));

import { usePeople, useCountries } from "@/hooks/api";

const mockUsePeople = vi.mocked(usePeople);
const mockUseCountries = vi.mocked(useCountries);

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

function renderContestants() {
  return render(
    <MemoryRouter>
      <MantineProvider>
        <Contestants />
      </MantineProvider>
    </MemoryRouter>
  );
}

function setupMocks(overrides?: {
  people?: Person[];
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

  const countries = overrides?.countries ?? mockCountries;
  mockUseCountries.mockReturnValue({
    data: countries,
    countries,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });
}

describe("Contestants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the title", () => {
      setupMocks();
      renderContestants();

      expect(screen.getByText("Contestants")).toBeInTheDocument();
    });

    it("shows contestant count", () => {
      setupMocks();
      renderContestants();

      expect(screen.getByText("3 contestants")).toBeInTheDocument();
    });

    it("renders search input", () => {
      setupMocks();
      renderContestants();

      expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument();
    });

    it("renders country filter dropdown", () => {
      setupMocks();
      renderContestants();

      expect(screen.getByPlaceholderText("Filter by country")).toBeInTheDocument();
    });

    it("renders table with correct headers", () => {
      setupMocks();
      renderContestants();

      const table = screen.getByRole("table");
      expect(within(table).getByText("Name")).toBeInTheDocument();
      expect(within(table).getByText("Country")).toBeInTheDocument();
    });

    it("renders contestant data in table rows", () => {
      setupMocks();
      renderContestants();

      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Bob Smith" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Charlie Brown" })).toBeInTheDocument();
    });

    it("displays country names in rows", () => {
      setupMocks();
      renderContestants();

      const table = screen.getByRole("table");
      expect(within(table).getByText("United States")).toBeInTheDocument();
      expect(within(table).getByText("China")).toBeInTheDocument();
      expect(within(table).getByText("United Kingdom")).toBeInTheDocument();
    });

    it("links contestant names to their profile pages", () => {
      setupMocks();
      renderContestants();

      const aliceLink = screen.getByRole("link", { name: "Alice Johnson" });
      expect(aliceLink).toHaveAttribute("href", "/contestants/person-1");

      const bobLink = screen.getByRole("link", { name: "Bob Smith" });
      expect(bobLink).toHaveAttribute("href", "/contestants/person-2");
    });
  });

  describe("redacted name filtering", () => {
    it("filters out names starting with '('", () => {
      const peopleWithRedacted: Person[] = [
        ...mockPeople,
        {
          id: "person-redacted",
          name: "(redacted)",
          given_name: null,
          family_name: null,
          country_id: "country-usa",
          aliases: [],
          source_ids: {},
        },
      ];

      setupMocks({ people: peopleWithRedacted });
      renderContestants();

      expect(screen.getByText("3 contestants")).toBeInTheDocument();
      expect(screen.queryByText("(redacted)")).not.toBeInTheDocument();
    });

    it("filters out names starting with '*'", () => {
      const peopleWithRedacted: Person[] = [
        ...mockPeople,
        {
          id: "person-redacted",
          name: "*hidden*",
          given_name: null,
          family_name: null,
          country_id: "country-usa",
          aliases: [],
          source_ids: {},
        },
      ];

      setupMocks({ people: peopleWithRedacted });
      renderContestants();

      expect(screen.getByText("3 contestants")).toBeInTheDocument();
      expect(screen.queryByText("*hidden*")).not.toBeInTheDocument();
    });

    it("shows zero contestants when all are redacted", () => {
      const redactedPeople: Person[] = [
        {
          id: "person-1",
          name: "(redacted)",
          given_name: null,
          family_name: null,
          country_id: "country-usa",
          aliases: [],
          source_ids: {},
        },
        {
          id: "person-2",
          name: "*anonymous*",
          given_name: null,
          family_name: null,
          country_id: "country-chn",
          aliases: [],
          source_ids: {},
        },
      ];

      setupMocks({ people: redactedPeople });
      renderContestants();

      expect(screen.getByText("0 contestants")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loading state when data is loading", () => {
      setupMocks({ loading: true });
      renderContestants();

      expect(screen.getByText("Contestants")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows no data message when no contestants", () => {
      setupMocks({ people: [] });
      renderContestants();

      expect(screen.getByText("No contestants found")).toBeInTheDocument();
      expect(screen.getByText("0 contestants")).toBeInTheDocument();
    });
  });

  describe("search functionality", () => {
    it("filters contestants by name search", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestants();

      const searchInput = screen.getByPlaceholderText("Search by name...");
      await user.type(searchInput, "Alice");

      expect(screen.getByText(/1 of 3 contestants/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Bob Smith" })).not.toBeInTheDocument();
    });

    it("shows all contestants when search is cleared", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestants();

      const searchInput = screen.getByPlaceholderText("Search by name...");
      await user.type(searchInput, "Alice");
      await user.clear(searchInput);

      expect(screen.getByText("3 contestants")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Bob Smith" })).toBeInTheDocument();
    });

    it("performs fuzzy search", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestants();

      const searchInput = screen.getByPlaceholderText("Search by name...");
      // Fuzzy search should match "Johnson" even with slight variation
      await user.type(searchInput, "Johnsn");

      // Fuzzy search should still find Alice Johnson
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
    });
  });

  describe("country filtering", () => {
    it("renders country filter dropdown with options", () => {
      setupMocks();
      renderContestants();

      // Verify the country filter exists
      const countryFilter = screen.getByPlaceholderText("Filter by country");
      expect(countryFilter).toBeInTheDocument();

      // Verify all contestants are shown initially (no filter applied)
      expect(screen.getByText("3 contestants")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Bob Smith" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Charlie Brown" })).toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    it("shows pagination controls", () => {
      setupMocks();
      renderContestants();

      expect(screen.getByText(/Showing.*of/)).toBeInTheDocument();
    });

    it("shows page size selector with default 50", () => {
      setupMocks();
      renderContestants();

      expect(screen.getByText("50 per page")).toBeInTheDocument();
    });

    it("can change page size", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestants();

      const pageSizeSelect = screen.getByText("50 per page");
      await user.click(pageSizeSelect);

      const option25 = await screen.findByText("25 per page");
      await user.click(option25);

      expect(screen.getByText("25 per page")).toBeInTheDocument();
    });
  });

  describe("column sorting", () => {
    it("allows clicking on Name header to sort", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestants();

      const nameHeader = screen.getByText("Name");
      await user.click(nameHeader);

      // Should still render all contestants
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Bob Smith" })).toBeInTheDocument();
    });

    it("allows clicking on Country header to sort", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestants();

      const countryHeader = screen.getByText("Country");
      await user.click(countryHeader);

      // Should still render all contestants
      expect(screen.getByRole("link", { name: "Alice Johnson" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Bob Smith" })).toBeInTheDocument();
    });
  });

  describe("country display", () => {
    it("handles missing country gracefully", () => {
      const personWithUnknownCountry: Person[] = [
        {
          id: "person-1",
          name: "Alice Johnson",
          given_name: "Alice",
          family_name: "Johnson",
          country_id: "country-unknown",
          aliases: [],
          source_ids: {},
        },
      ];

      setupMocks({ people: personWithUnknownCountry });
      renderContestants();

      // Should fall back to displaying the country ID
      expect(screen.getByText("country-unknown")).toBeInTheDocument();
    });
  });

  describe("filtered count display", () => {
    it("shows 'X of Y contestants' when filtered", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderContestants();

      const searchInput = screen.getByPlaceholderText("Search by name...");
      await user.type(searchInput, "Alice");

      expect(screen.getByText("1 of 3 contestants")).toBeInTheDocument();
    });

    it("shows 'X contestants' when not filtered", () => {
      setupMocks();
      renderContestants();

      expect(screen.getByText("3 contestants")).toBeInTheDocument();
    });
  });
});
