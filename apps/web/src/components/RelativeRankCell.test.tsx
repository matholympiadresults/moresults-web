import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { RelativeRankCell } from "./RelativeRankCell";

function renderCell(rank: number | null, total: number) {
  return render(
    <MantineProvider>
      <RelativeRankCell rank={rank} total={total} />
    </MantineProvider>
  );
}

describe("RelativeRankCell", () => {
  describe("rendering", () => {
    it("shows dash when rank is null", () => {
      renderCell(null, 100);
      expect(screen.getByText("-")).toBeInTheDocument();
    });

    it("shows just rank when total is 0", () => {
      renderCell(5, 0);
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.queryByText(/\//)).not.toBeInTheDocument();
    });

    it("shows rank and total in X / N format", () => {
      renderCell(42, 600);
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText(/600/)).toBeInTheDocument();
    });

    it("shows rank 1 out of 1", () => {
      renderCell(1, 1);
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("tooltip percentile", () => {
    it("shows correct percentile on hover", async () => {
      const user = userEvent.setup();
      renderCell(42, 600);

      const rankText = screen.getByText("42");
      await user.hover(rankText);

      // 42/600 * 100 = 7.0%
      expect(await screen.findByText("Top 7.0%")).toBeInTheDocument();
    });

    it("shows top 100.0% for last place", async () => {
      const user = userEvent.setup();
      renderCell(600, 600);

      const rankText = screen.getByText("600");
      await user.hover(rankText);

      expect(await screen.findByText("Top 100.0%")).toBeInTheDocument();
    });

    it("shows small percentile for rank 1", async () => {
      const user = userEvent.setup();
      renderCell(1, 600);

      const rankText = screen.getByText("1");
      await user.hover(rankText);

      // 1/600 * 100 = 0.2%
      expect(await screen.findByText("Top 0.2%")).toBeInTheDocument();
    });
  });
});
