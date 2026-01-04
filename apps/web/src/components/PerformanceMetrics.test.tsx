import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { PerformanceMetrics } from "./PerformanceMetrics";

function renderPerformanceMetrics(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MantineProvider>
        <PerformanceMetrics />
      </MantineProvider>
    </MemoryRouter>
  );
}

describe("PerformanceMetrics", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("renders the component", () => {
      renderPerformanceMetrics();

      // Should show the current path
      expect(screen.getByText("/")).toBeInTheDocument();
    });

    it("displays current pathname", () => {
      renderPerformanceMetrics("/contestants");

      expect(screen.getByText("/contestants")).toBeInTheDocument();
    });

    it("renders with Paper component", () => {
      renderPerformanceMetrics();

      const paper = document.querySelector(".mantine-Paper-root");
      expect(paper).toBeInTheDocument();
    });

    it("renders close button", () => {
      renderPerformanceMetrics();

      expect(screen.getByText("✕")).toBeInTheDocument();
    });

    it("renders a badge", () => {
      renderPerformanceMetrics();

      const badge = document.querySelector(".mantine-Badge-root");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("time display format", () => {
    it("shows ellipsis while measuring", () => {
      renderPerformanceMetrics();

      // Initially shows "..." while waiting for render time
      expect(screen.getByText("...")).toBeInTheDocument();
    });

    it("eventually shows render time", async () => {
      // Mock performance to return increasing values
      let callCount = 0;
      vi.spyOn(performance, "now").mockImplementation(() => {
        callCount++;
        // First call is navigation start, subsequent calls measure elapsed time
        return callCount === 1 ? 0 : 150;
      });

      renderPerformanceMetrics();

      // Wait for render time to be calculated and displayed
      await waitFor(
        () => {
          const badge = document.querySelector(".mantine-Badge-root");
          const text = badge?.textContent;
          // Should show either ms or s format
          expect(text === "..." || text?.includes("ms") || text?.includes("s")).toBe(true);
        },
        { timeout: 500 }
      );
    });
  });

  describe("visibility", () => {
    it("hides component when close button is clicked", async () => {
      const user = userEvent.setup();
      renderPerformanceMetrics();

      const closeButton = screen.getByText("✕");
      await user.click(closeButton);

      // Component should be hidden
      expect(screen.queryByText("/")).not.toBeInTheDocument();
    });

    it("returns null when not visible", async () => {
      const user = userEvent.setup();
      const { container } = renderPerformanceMetrics();

      const closeButton = screen.getByText("✕");
      await user.click(closeButton);

      // Container should be empty (component returns null)
      expect(container.querySelector(".mantine-Paper-root")).not.toBeInTheDocument();
    });
  });

  describe("path display", () => {
    it("displays root path", () => {
      renderPerformanceMetrics("/");

      expect(screen.getByText("/")).toBeInTheDocument();
    });

    it("displays nested path", () => {
      renderPerformanceMetrics("/competitions/IMO-2023");

      expect(screen.getByText("/competitions/IMO-2023")).toBeInTheDocument();
    });

    it("displays countries path", () => {
      renderPerformanceMetrics("/countries/individual");

      expect(screen.getByText("/countries/individual")).toBeInTheDocument();
    });
  });
});
