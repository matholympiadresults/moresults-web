import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Competitions } from "./index";
import type { Competition } from "@/schemas/base";
import { Source } from "@/schemas/base";

// Mock the API hooks
vi.mock("@/hooks/api", () => ({
  useCompetitions: vi.fn(),
}));

import { useCompetitions } from "@/hooks/api";

const mockUseCompetitions = vi.mocked(useCompetitions);

// Test data fixtures
const mockCompetitions: Competition[] = [
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
    id: "IMO-2022",
    source: Source.IMO,
    year: 2022,
    edition: 63,
    host_country_id: "country-nor",
    num_problems: 6,
    max_score_per_problem: 7,
  },
  {
    id: "EGMO-2023",
    source: Source.EGMO,
    year: 2023,
    edition: 12,
    host_country_id: "country-svn",
    num_problems: 4,
    max_score_per_problem: 7,
  },
  {
    id: "MEMO-2022",
    source: Source.MEMO,
    year: 2022,
    edition: null,
    host_country_id: null,
    num_problems: 8,
    max_score_per_problem: 8,
  },
];

function renderCompetitions() {
  return render(
    <MemoryRouter>
      <MantineProvider>
        <Competitions />
      </MantineProvider>
    </MemoryRouter>
  );
}

function setupMocks(overrides?: {
  competitions?: Competition[];
  loading?: boolean;
  error?: Error | null;
}) {
  const competitions = overrides?.competitions ?? mockCompetitions;
  mockUseCompetitions.mockReturnValue({
    data: competitions,
    competitions,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });
}

describe("Competitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the title", () => {
      setupMocks();
      renderCompetitions();

      expect(screen.getByText("Competitions")).toBeInTheDocument();
    });

    it("shows competition count", () => {
      setupMocks();
      renderCompetitions();

      expect(screen.getByText("4 of 4 competitions")).toBeInTheDocument();
    });

    it("renders source filter dropdown", () => {
      setupMocks();
      renderCompetitions();

      expect(screen.getByPlaceholderText("Filter by source")).toBeInTheDocument();
    });

    it("renders table with correct headers", () => {
      setupMocks();
      renderCompetitions();

      const table = screen.getByRole("table");
      expect(within(table).getByText("Competition")).toBeInTheDocument();
      expect(within(table).getByText("Edition")).toBeInTheDocument();
      expect(within(table).getByText("Year")).toBeInTheDocument();
    });

    it("renders competition data in table rows", () => {
      setupMocks();
      renderCompetitions();

      const table = screen.getByRole("table");
      // IMO appears twice (2023 and 2022), so use getAllByText
      expect(within(table).getAllByText("IMO").length).toBeGreaterThanOrEqual(1);
      expect(within(table).getByText("EGMO")).toBeInTheDocument();
      expect(within(table).getByText("MEMO")).toBeInTheDocument();
    });

    it("displays editions correctly", () => {
      setupMocks();
      renderCompetitions();

      const table = screen.getByRole("table");
      expect(within(table).getByText("64")).toBeInTheDocument();
      expect(within(table).getByText("63")).toBeInTheDocument();
      expect(within(table).getByText("12")).toBeInTheDocument();
    });

    it("displays dash for null edition", () => {
      setupMocks();
      renderCompetitions();

      const table = screen.getByRole("table");
      // MEMO-2022 has null edition
      expect(within(table).getByText("-")).toBeInTheDocument();
    });

    it("displays years correctly", () => {
      setupMocks();
      renderCompetitions();

      const table = screen.getByRole("table");
      expect(within(table).getAllByText("2023").length).toBe(2); // IMO-2023 and EGMO-2023
      expect(within(table).getAllByText("2022").length).toBe(2); // IMO-2022 and MEMO-2022
    });

    it("links competition names to their detail pages", () => {
      setupMocks();
      renderCompetitions();

      const imoLinks = screen.getAllByRole("link", { name: "IMO" });
      expect(imoLinks[0]).toHaveAttribute("href", "/competitions/IMO-2023");

      const egmoLink = screen.getByRole("link", { name: "EGMO" });
      expect(egmoLink).toHaveAttribute("href", "/competitions/EGMO-2023");
    });
  });

  describe("loading state", () => {
    it("shows loading state when data is loading", () => {
      setupMocks({ loading: true });
      renderCompetitions();

      expect(screen.getByText("Competitions")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows no data message when no competitions", () => {
      setupMocks({ competitions: [] });
      renderCompetitions();

      expect(screen.getByText("No competitions found")).toBeInTheDocument();
      expect(screen.getByText("0 of 0 competitions")).toBeInTheDocument();
    });
  });

  describe("source filtering", () => {
    it("filters competitions by source when selected", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetitions();

      const sourceFilter = screen.getByPlaceholderText("Filter by source");
      await user.click(sourceFilter);

      // Find the IMO option in the dropdown
      const imoOption = await screen.findByText("IMO", { selector: '[role="option"] span' });
      await user.click(imoOption);

      expect(screen.getByText("2 of 4 competitions")).toBeInTheDocument();

      // Should only show IMO competitions
      const table = screen.getByRole("table");
      const imoLinks = within(table).getAllByRole("link", { name: "IMO" });
      expect(imoLinks.length).toBe(2);
      expect(within(table).queryByRole("link", { name: "EGMO" })).not.toBeInTheDocument();
    });

    it("shows filtered count after applying filter", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetitions();

      // Apply filter
      const sourceFilter = screen.getByPlaceholderText("Filter by source");
      await user.click(sourceFilter);
      const imoOption = await screen.findByText("IMO", { selector: '[role="option"] span' });
      await user.click(imoOption);

      // After filtering, should show 2 of 4
      expect(screen.getByText("2 of 4 competitions")).toBeInTheDocument();
    });
  });

  describe("column sorting", () => {
    it("sorts by year descending by default", () => {
      setupMocks();
      renderCompetitions();

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");

      // Skip header row, first data row should be 2023
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText("2023")).toBeInTheDocument();
    });

    it("allows clicking on Competition header to sort", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetitions();

      const competitionHeader = screen.getByText("Competition");
      await user.click(competitionHeader);

      // Should still render all competitions
      expect(screen.getByRole("link", { name: "EGMO" })).toBeInTheDocument();
    });

    it("allows clicking on Year header to toggle sort order", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetitions();

      const yearHeader = screen.getByText("Year");
      // First click should toggle to ascending
      await user.click(yearHeader);

      // Should still render all competitions
      expect(screen.getByText("4 of 4 competitions")).toBeInTheDocument();
    });

    it("allows clicking on Edition header to sort", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetitions();

      const editionHeader = screen.getByText("Edition");
      await user.click(editionHeader);

      // Should still render all competitions
      expect(screen.getByText("4 of 4 competitions")).toBeInTheDocument();
    });
  });

  describe("filtered count display", () => {
    it("shows 'X of Y competitions' when filtered", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetitions();

      const sourceFilter = screen.getByPlaceholderText("Filter by source");
      await user.click(sourceFilter);
      const egmoOption = await screen.findByText("EGMO", { selector: '[role="option"] span' });
      await user.click(egmoOption);

      expect(screen.getByText("1 of 4 competitions")).toBeInTheDocument();
    });

    it("shows 'X of X competitions' when not filtered", () => {
      setupMocks();
      renderCompetitions();

      expect(screen.getByText("4 of 4 competitions")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("handles error state", () => {
      setupMocks({ error: new Error("Failed to load") });
      renderCompetitions();

      // Should still render the page
      expect(screen.getByText("Competitions")).toBeInTheDocument();
    });
  });

  describe("different sources", () => {
    it("displays all source types in filter options", async () => {
      const user = userEvent.setup();
      setupMocks();
      renderCompetitions();

      const sourceFilter = screen.getByPlaceholderText("Filter by source");
      await user.click(sourceFilter);

      // Wait for dropdown to open - Mantine uses role="option" for options
      const imoOption = await screen.findByText("IMO", {
        selector: '[role="option"] span',
      });
      expect(imoOption).toBeInTheDocument();

      // Check other source options are present
      expect(screen.getByText("EGMO", { selector: '[role="option"] span' })).toBeInTheDocument();
      expect(screen.getByText("MEMO", { selector: '[role="option"] span' })).toBeInTheDocument();
      expect(
        screen.getByText("MEMO Team", { selector: '[role="option"] span' })
      ).toBeInTheDocument();
      expect(screen.getByText("RMM", { selector: '[role="option"] span' })).toBeInTheDocument();
      expect(screen.getByText("APMO", { selector: '[role="option"] span' })).toBeInTheDocument();
      expect(screen.getByText("BMO", { selector: '[role="option"] span' })).toBeInTheDocument();
      expect(screen.getByText("PAMO", { selector: '[role="option"] span' })).toBeInTheDocument();
    });
  });
});
