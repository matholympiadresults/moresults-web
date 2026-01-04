import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Home } from "./index";
import { ROUTES } from "@/constants/routes";

function renderHome() {
  return render(
    <MemoryRouter>
      <MantineProvider>
        <Home />
      </MantineProvider>
    </MemoryRouter>
  );
}

describe("Home", () => {
  describe("rendering", () => {
    it("renders the main title", () => {
      renderHome();

      expect(screen.getByText("Explore Consolidated Math Olympiad Results")).toBeInTheDocument();
    });

    it("renders the subtitle", () => {
      renderHome();

      expect(
        screen.getByText(
          "This website is a mirror of official records from different international olympiads."
        )
      ).toBeInTheDocument();
    });

    it("renders the Quick Links section header", () => {
      renderHome();

      expect(screen.getByText("Quick Links")).toBeInTheDocument();
    });
  });

  describe("quick links", () => {
    it("renders all six quick link cards", () => {
      renderHome();

      expect(screen.getByText("Contestants")).toBeInTheDocument();
      expect(screen.getByText("Competitions")).toBeInTheDocument();
      expect(screen.getByText("Countries")).toBeInTheDocument();
      expect(screen.getByText("Compare Countries")).toBeInTheDocument();
      expect(screen.getByText("Hall of Fame")).toBeInTheDocument();
      expect(screen.getByText("Data")).toBeInTheDocument();
    });

    it("renders descriptions for each quick link", () => {
      renderHome();

      expect(
        screen.getByText("Browse all contestants and their participation history")
      ).toBeInTheDocument();
      expect(screen.getByText("View competition results by olympiad and year")).toBeInTheDocument();
      expect(screen.getByText("Country statistics and performance rankings")).toBeInTheDocument();
      expect(
        screen.getByText("Side-by-side comparison of country performances")
      ).toBeInTheDocument();
      expect(screen.getByText("Top performers across all competitions")).toBeInTheDocument();
      expect(screen.getByText("About our data sources and methodology")).toBeInTheDocument();
    });

    it("links Contestants card to correct route", () => {
      renderHome();

      const link = screen.getByRole("link", { name: /Contestants/i });
      expect(link).toHaveAttribute("href", ROUTES.CONTESTANTS);
    });

    it("links Competitions card to correct route", () => {
      renderHome();

      const link = screen.getByRole("link", { name: /Competitions.*View competition results/i });
      expect(link).toHaveAttribute("href", ROUTES.COMPETITIONS);
    });

    it("links Countries card to correct route", () => {
      renderHome();

      const link = screen.getByRole("link", { name: /Countries.*Country statistics/i });
      expect(link).toHaveAttribute("href", ROUTES.COUNTRIES_INDIVIDUAL);
    });

    it("links Compare Countries card to correct route", () => {
      renderHome();

      const link = screen.getByRole("link", { name: /Compare Countries/i });
      expect(link).toHaveAttribute("href", ROUTES.COUNTRIES_COMPARE);
    });

    it("links Hall of Fame card to correct route", () => {
      renderHome();

      const link = screen.getByRole("link", { name: /Hall of Fame/i });
      expect(link).toHaveAttribute("href", ROUTES.HALL_OF_FAME);
    });

    it("links Data card to correct route", () => {
      renderHome();

      const link = screen.getByRole("link", { name: /Data.*About our data sources/i });
      expect(link).toHaveAttribute("href", ROUTES.DATA);
    });
  });

  describe("accessibility", () => {
    it("renders all links as navigable elements", () => {
      renderHome();

      const links = screen.getAllByRole("link");
      // 6 quick links + 1 email link + 1 GitHub link in "Help us improve" alert
      expect(links).toHaveLength(8);
    });

    it("each quick link card is focusable", () => {
      renderHome();

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });
});
