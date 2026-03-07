import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { IndividualContent } from "./IndividualContent";
import { Award, Source } from "@/schemas/base";
import type { Participation, Competition } from "@/schemas/base";
import type { MedalCounts } from "@/utils/countryStats";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

const mockCalculateMedalProgression = vi.fn().mockReturnValue([]);
vi.mock("@/utils/countryStats", async () => {
  const actual = await vi.importActual("@/utils/countryStats");
  return {
    ...actual,
    calculateMedalProgression: (...args: unknown[]) => mockCalculateMedalProgression(...args),
  };
});

const mockMedals: MedalCounts = {
  [Award.GOLD]: 2,
  [Award.SILVER]: 1,
  [Award.BRONZE]: 0,
  [Award.HONOURABLE_MENTION]: 0,
};

const mockParticipations: Participation[] = [
  {
    id: "imo-2023-person-1",
    competition_id: "imo-2023",
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

const mockCompetitionMap: Record<string, Competition> = {
  "imo-2023": {
    id: "imo-2023",
    source: Source.IMO,
    year: 2023,
    edition: null,
    host_country_id: null,
    num_problems: 6,
    max_score_per_problem: 7,
  },
};

const mockTable = {
  getHeaderGroups: () => [],
  getRowModel: () => ({ rows: [] }),
} as never;

const renderComponent = () =>
  render(
    <MantineProvider>
      <IndividualContent
        medals={mockMedals}
        teamRankData={[]}
        participations={mockParticipations}
        competitionMap={mockCompetitionMap}
        table={mockTable}
        columnCount={5}
        rowCount={0}
        effectiveSource={Source.IMO}
        loading={false}
        error={null}
        isDark={false}
      />
    </MantineProvider>
  );

describe("IndividualContent", () => {
  it("calculates medal progression with 'yearly' mode by default", () => {
    mockCalculateMedalProgression.mockClear();
    renderComponent();

    expect(mockCalculateMedalProgression).toHaveBeenCalledWith(
      mockParticipations,
      mockCompetitionMap,
      Source.IMO,
      "yearly"
    );
  });

  it("recalculates medal progression with 'cumulative' mode when toggled", async () => {
    mockCalculateMedalProgression.mockClear();
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByText("Cumulative"));

    expect(mockCalculateMedalProgression).toHaveBeenCalledWith(
      mockParticipations,
      mockCompetitionMap,
      Source.IMO,
      "cumulative"
    );
  });
});
