import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Data } from "./index";
import type { Database, Competition, Country, Person, Participation } from "@/schemas/base";
import { Award, Source } from "@/schemas/base";

// Mock the API hook
vi.mock("@/hooks/api", () => ({
  useDatabase: vi.fn(),
}));

import { useDatabase } from "@/hooks/api";

const mockUseDatabase = vi.mocked(useDatabase);

// Test data fixtures
const createCountry = (code: string, name: string): Country => ({
  id: `country-${code.toLowerCase()}`,
  code,
  name,
});

const createCompetition = (
  source: Source,
  year: number,
  numProblems = 6
): Competition => ({
  id: `${source}-${year}`,
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
  award: Award | null = null
): Participation => ({
  id: `${competitionId}-${personId}`,
  competition_id: competitionId,
  person_id: personId,
  country_id: countryId,
  problem_scores: [7, 7, 7, 7, 7, 7].slice(0, Math.ceil(total / 7)),
  total,
  rank: null,
  regional_rank: null,
  award,
  extra_awards: null,
  source_contestant_id: null,
});

// Build mock database
const mockCountries: Record<string, Country> = {
  "country-usa": createCountry("USA", "United States"),
  "country-chn": createCountry("CHN", "China"),
  "country-gbr": createCountry("GBR", "United Kingdom"),
};

const mockCompetitions: Record<string, Competition> = {
  "IMO-2020": createCompetition(Source.IMO, 2020),
  "IMO-2021": createCompetition(Source.IMO, 2021),
  "IMO-2022": createCompetition(Source.IMO, 2022),
  "EGMO-2020": createCompetition(Source.EGMO, 2020, 4),
  "EGMO-2021": createCompetition(Source.EGMO, 2021, 4),
  "MEMO-2021": createCompetition(Source.MEMO, 2021),
};

const mockPeople: Record<string, Person> = {
  "person-1": createPerson("person-1", "Alice Smith", "country-usa"),
  "person-2": createPerson("person-2", "Bob Jones", "country-chn"),
  "person-3": createPerson("person-3", "Carol White", "country-gbr"),
};

const mockParticipations: Record<string, Participation> = {
  "IMO-2020-person-1": createParticipation(
    "IMO-2020",
    "country-usa",
    "person-1",
    42,
    Award.GOLD
  ),
  "IMO-2021-person-1": createParticipation(
    "IMO-2021",
    "country-usa",
    "person-1",
    40,
    Award.GOLD
  ),
  "IMO-2022-person-2": createParticipation(
    "IMO-2022",
    "country-chn",
    "person-2",
    35,
    Award.SILVER
  ),
  "EGMO-2020-person-3": createParticipation(
    "EGMO-2020",
    "country-gbr",
    "person-3",
    28,
    Award.BRONZE
  ),
  "EGMO-2021-person-3": createParticipation(
    "EGMO-2021",
    "country-gbr",
    "person-3",
    30,
    Award.HONOURABLE_MENTION
  ),
  "MEMO-2021-person-2": createParticipation(
    "MEMO-2021",
    "country-chn",
    "person-2",
    25,
    null
  ),
};

const mockDatabase: Database = {
  version: "1.0.0",
  last_updated: "2024-01-15T12:00:00Z",
  countries: mockCountries,
  competitions: mockCompetitions,
  people: mockPeople,
  participations: mockParticipations,
  team_participations: {},
};

function renderData() {
  return render(
    <MemoryRouter>
      <MantineProvider>
        <Data />
      </MantineProvider>
    </MemoryRouter>
  );
}

function setupMocks(overrides?: {
  data?: Database | null;
  loading?: boolean;
  error?: Error | null;
}) {
  mockUseDatabase.mockReturnValue({
    data: overrides?.data !== undefined ? overrides.data : mockDatabase,
    loading: overrides?.loading ?? false,
    error: overrides?.error ?? null,
  });
}

describe("Data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading indicator when data is loading", () => {
      setupMocks({ loading: true, data: null });
      renderData();

      // Should show a loader
      expect(document.querySelector(".mantine-Loader-root")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when there is a loading error", () => {
      setupMocks({ error: new Error("Failed to load database"), data: null });
      renderData();

      expect(screen.getByText("Error loading data")).toBeInTheDocument();
      expect(screen.getByText("Failed to load database")).toBeInTheDocument();
    });
  });

  describe("page content", () => {
    beforeEach(() => {
      setupMocks();
    });

    it("renders the page title and description", () => {
      renderData();

      expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();
      expect(screen.getByText("About our data sources")).toBeInTheDocument();
    });

    it("renders the about this project alert", () => {
      renderData();

      expect(screen.getByText("About this project")).toBeInTheDocument();
      expect(
        screen.getByText(/We provide a consolidated view/)
      ).toBeInTheDocument();
    });

    it("renders the privacy section", () => {
      renderData();

      expect(screen.getByText("Privacy")).toBeInTheDocument();
      expect(screen.getByText("Data Redaction:")).toBeInTheDocument();
    });
  });

  describe("official data sources table", () => {
    beforeEach(() => {
      setupMocks();
    });

    it("renders the data sources section title", () => {
      renderData();

      expect(
        screen.getByRole("heading", { name: "Official Data Sources" })
      ).toBeInTheDocument();
    });

    it("displays all olympiad source names", () => {
      renderData();

      const tables = screen.getAllByRole("table");
      const sourcesTable = tables[0]; // First table is data sources

      expect(within(sourcesTable).getByText("IMO")).toBeInTheDocument();
      expect(within(sourcesTable).getByText("EGMO")).toBeInTheDocument();
      expect(within(sourcesTable).getByText("MEMO")).toBeInTheDocument();
      expect(within(sourcesTable).getByText("RMM")).toBeInTheDocument();
      expect(within(sourcesTable).getByText("APMO")).toBeInTheDocument();
      expect(within(sourcesTable).getByText("BMO")).toBeInTheDocument();
      expect(within(sourcesTable).getByText("PAMO")).toBeInTheDocument();
    });

    it("displays links to official websites", () => {
      renderData();

      expect(screen.getByRole("link", { name: "imo-official.org" })).toHaveAttribute(
        "href",
        "https://www.imo-official.org/"
      );
      expect(screen.getByRole("link", { name: "egmo.org" })).toHaveAttribute(
        "href",
        "https://www.egmo.org/"
      );
      expect(screen.getByRole("link", { name: "memo-official.org" })).toHaveAttribute(
        "href",
        "https://www.memo-official.org/"
      );
    });
  });

  describe("database summary statistics", () => {
    beforeEach(() => {
      setupMocks();
    });

    it("renders the database summary section title", () => {
      renderData();

      expect(
        screen.getByRole("heading", { name: "Database Summary" })
      ).toBeInTheDocument();
    });

    it("displays the last updated timestamp", () => {
      renderData();

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it("displays correct count of countries", () => {
      renderData();

      // 3 countries in mock data - find the stat card
      const countriesLabel = screen.getByText("Countries");
      const statCard = countriesLabel.closest(".mantine-Paper-root") as HTMLElement;
      expect(statCard).toBeInTheDocument();
      expect(within(statCard).getByText("3")).toBeInTheDocument();
    });

    it("displays correct count of competitions", () => {
      renderData();

      // 6 competitions in mock data - find the stat card
      const competitionsLabel = screen.getByText("Competitions");
      const statCard = competitionsLabel.closest(".mantine-Paper-root") as HTMLElement;
      expect(statCard).toBeInTheDocument();
      expect(within(statCard).getByText("6")).toBeInTheDocument();
    });

    it("displays correct count of people", () => {
      renderData();

      // 3 people in mock data - find the stat card
      const peopleLabel = screen.getByText("People");
      const statCard = peopleLabel.closest(".mantine-Paper-root") as HTMLElement;
      expect(statCard).toBeInTheDocument();
      expect(within(statCard).getByText("3")).toBeInTheDocument();
    });

    it("displays correct count of participations", () => {
      renderData();

      // 6 participations in mock data - find the stat card
      const participationsLabel = screen.getByText("Participations");
      const statCard = participationsLabel.closest(".mantine-Paper-root") as HTMLElement;
      expect(statCard).toBeInTheDocument();
      expect(within(statCard).getByText("6")).toBeInTheDocument();
    });
  });

  describe("participations by olympiad", () => {
    beforeEach(() => {
      setupMocks();
    });

    it("renders the section title", () => {
      renderData();

      expect(
        screen.getByRole("heading", { name: "Participations by Olympiad" })
      ).toBeInTheDocument();
    });

    it("displays participation counts for olympiads with data", () => {
      renderData();

      // IMO has 3 participations, EGMO has 2, MEMO has 1
      const tables = screen.getAllByRole("table");
      // Find the participations by olympiad table (second table)
      const participationsTable = tables[1];

      // Check IMO row exists with count 3
      const imoRow = within(participationsTable)
        .getByText("IMO")
        .closest("tr");
      expect(imoRow).toBeInTheDocument();
      expect(within(imoRow!).getByText("3")).toBeInTheDocument();

      // Check EGMO row exists with count 2
      const egmoRow = within(participationsTable)
        .getByText("EGMO")
        .closest("tr");
      expect(egmoRow).toBeInTheDocument();
      expect(within(egmoRow!).getByText("2")).toBeInTheDocument();
    });

    it("only shows olympiads with participations", () => {
      renderData();

      const tables = screen.getAllByRole("table");
      const participationsTable = tables[1];

      // RMM, APMO, BMO, PAMO should not appear in this table (no participations)
      expect(within(participationsTable).queryByText("RMM")).not.toBeInTheDocument();
      expect(within(participationsTable).queryByText("APMO")).not.toBeInTheDocument();
    });
  });

  describe("year coverage", () => {
    beforeEach(() => {
      setupMocks();
    });

    it("renders the section title", () => {
      renderData();

      expect(
        screen.getByRole("heading", { name: "Year Coverage" })
      ).toBeInTheDocument();
    });

    it("displays overall year range", () => {
      renderData();

      // Mock data spans 2020-2022
      expect(screen.getByText(/Overall:.*2020.*2022/)).toBeInTheDocument();
      expect(screen.getByText(/3 years/)).toBeInTheDocument();
    });

    it("displays year coverage per olympiad", () => {
      renderData();

      const tables = screen.getAllByRole("table");
      // Year coverage table is the third table
      const yearCoverageTable = tables[2];

      // IMO: 2020, 2021, 2022 should be "2020-2022"
      const imoRow = within(yearCoverageTable).getByText("IMO").closest("tr");
      expect(imoRow).toBeInTheDocument();
      expect(within(imoRow!).getByText("2020-2022")).toBeInTheDocument();

      // EGMO: 2020, 2021 should be "2020-2021"
      const egmoRow = within(yearCoverageTable).getByText("EGMO").closest("tr");
      expect(egmoRow).toBeInTheDocument();
      expect(within(egmoRow!).getByText("2020-2021")).toBeInTheDocument();
    });

    it("handles non-consecutive years correctly", () => {
      // Create database with gap in years
      const gapCompetitions: Record<string, Competition> = {
        "IMO-2016": createCompetition(Source.IMO, 2016),
        "IMO-2017": createCompetition(Source.IMO, 2017),
        "IMO-2018": createCompetition(Source.IMO, 2018),
        "IMO-2020": createCompetition(Source.IMO, 2020),
        "IMO-2021": createCompetition(Source.IMO, 2021),
      };

      setupMocks({
        data: {
          ...mockDatabase,
          competitions: gapCompetitions,
          participations: {},
        },
      });

      renderData();

      const tables = screen.getAllByRole("table");
      const yearCoverageTable = tables[2];

      // Should show "2016-2018, 2020-2021"
      const imoRow = within(yearCoverageTable).getByText("IMO").closest("tr");
      expect(imoRow).toBeInTheDocument();
      expect(within(imoRow!).getByText("2016-2018, 2020-2021")).toBeInTheDocument();
    });
  });

  describe("awards statistics", () => {
    beforeEach(() => {
      setupMocks();
    });

    it("renders the section title", () => {
      renderData();

      expect(screen.getByRole("heading", { name: "Awards" })).toBeInTheDocument();
    });

    it("displays gold medal count", () => {
      renderData();

      const tables = screen.getAllByRole("table");
      const awardsTable = tables[3];

      const goldRow = within(awardsTable).getByText(/Gold/).closest("tr");
      expect(goldRow).toBeInTheDocument();
      // 2 gold medals in mock data
      expect(within(goldRow!).getByText("2")).toBeInTheDocument();
    });

    it("displays silver medal count", () => {
      renderData();

      const tables = screen.getAllByRole("table");
      const awardsTable = tables[3];

      const silverRow = within(awardsTable).getByText(/Silver/).closest("tr");
      expect(silverRow).toBeInTheDocument();
      // 1 silver medal in mock data
      expect(within(silverRow!).getByText("1")).toBeInTheDocument();
    });

    it("displays bronze medal count", () => {
      renderData();

      const tables = screen.getAllByRole("table");
      const awardsTable = tables[3];

      const bronzeRow = within(awardsTable).getByText(/Bronze/).closest("tr");
      expect(bronzeRow).toBeInTheDocument();
      // 1 bronze medal in mock data
      expect(within(bronzeRow!).getByText("1")).toBeInTheDocument();
    });

    it("displays honourable mention count", () => {
      renderData();

      const tables = screen.getAllByRole("table");
      const awardsTable = tables[3];

      const hmRow = within(awardsTable).getByText(/Honourable Mention/).closest("tr");
      expect(hmRow).toBeInTheDocument();
      // 1 honourable mention in mock data
      expect(within(hmRow!).getByText("1")).toBeInTheDocument();
    });

    it("displays no award count", () => {
      renderData();

      const tables = screen.getAllByRole("table");
      const awardsTable = tables[3];

      const noAwardRow = within(awardsTable).getByText(/No Award/).closest("tr");
      expect(noAwardRow).toBeInTheDocument();
      // 1 participation without award in mock data
      expect(within(noAwardRow!).getByText("1")).toBeInTheDocument();
    });
  });

  describe("empty database", () => {
    it("handles empty database gracefully", () => {
      setupMocks({
        data: {
          version: "1.0.0",
          last_updated: "2024-01-15T12:00:00Z",
          countries: {},
          competitions: {},
          people: {},
          participations: {},
          team_participations: {},
        },
      });

      renderData();

      // Should still render page title
      expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();

      // Should show 0 for counts
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThan(0);
    });
  });

  describe("contact information", () => {
    beforeEach(() => {
      setupMocks();
    });

    it("displays contact email link", () => {
      renderData();

      const emailLink = screen.getByRole("link", {
        name: "math.olympiad.results@gmail.com",
      });
      expect(emailLink).toHaveAttribute(
        "href",
        "mailto:math.olympiad.results@gmail.com"
      );
    });
  });
});
