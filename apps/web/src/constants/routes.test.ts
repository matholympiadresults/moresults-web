import { describe, it, expect } from "vitest";
import { ROUTES, NAV_LINKS, type NavLink } from "./routes";

describe("ROUTES", () => {
  describe("static routes", () => {
    it("has correct HOME route", () => {
      expect(ROUTES.HOME).toBe("/");
    });

    it("has correct CONTESTANTS route", () => {
      expect(ROUTES.CONTESTANTS).toBe("/contestants");
    });

    it("has correct COMPETITIONS route", () => {
      expect(ROUTES.COMPETITIONS).toBe("/competitions");
    });

    it("has correct COUNTRIES_INDIVIDUAL route", () => {
      expect(ROUTES.COUNTRIES_INDIVIDUAL).toBe("/countries/individual");
    });

    it("has correct COUNTRIES_COMPARE route", () => {
      expect(ROUTES.COUNTRIES_COMPARE).toBe("/countries/compare");
    });

    it("has correct HALL_OF_FAME route", () => {
      expect(ROUTES.HALL_OF_FAME).toBe("/hall-of-fame");
    });

    it("has correct DATA route", () => {
      expect(ROUTES.DATA).toBe("/data");
    });
  });

  describe("pattern routes", () => {
    it("has correct CONTESTANT_PATTERN route", () => {
      expect(ROUTES.CONTESTANT_PATTERN).toBe("/contestants/:id");
    });

    it("has correct COMPETITION_PATTERN route", () => {
      expect(ROUTES.COMPETITION_PATTERN).toBe("/competitions/:id");
    });

    it("has correct COMPETITION_STATISTICS_PATTERN route", () => {
      expect(ROUTES.COMPETITION_STATISTICS_PATTERN).toBe("/competitions/:id/statistics");
    });

    it("has correct COUNTRY_INDIVIDUAL_PATTERN route", () => {
      expect(ROUTES.COUNTRY_INDIVIDUAL_PATTERN).toBe("/countries/individual/:code");
    });
  });

  describe("dynamic route functions", () => {
    describe("CONTESTANT", () => {
      it("generates correct path for contestant id", () => {
        expect(ROUTES.CONTESTANT("person-123")).toBe("/contestants/person-123");
      });

      it("handles special characters in id", () => {
        expect(ROUTES.CONTESTANT("person-abc-def")).toBe("/contestants/person-abc-def");
      });
    });

    describe("COMPETITION", () => {
      it("generates correct path for competition id", () => {
        expect(ROUTES.COMPETITION("IMO-2023")).toBe("/competitions/IMO-2023");
      });

      it("handles different competition formats", () => {
        expect(ROUTES.COMPETITION("EGMO-2022")).toBe("/competitions/EGMO-2022");
        expect(ROUTES.COMPETITION("MEMO-2021")).toBe("/competitions/MEMO-2021");
      });
    });

    describe("COMPETITION_STATISTICS", () => {
      it("generates correct path for competition statistics", () => {
        expect(ROUTES.COMPETITION_STATISTICS("IMO-2023")).toBe("/competitions/IMO-2023/statistics");
      });

      it("handles different competition formats", () => {
        expect(ROUTES.COMPETITION_STATISTICS("EGMO-2022")).toBe("/competitions/EGMO-2022/statistics");
      });
    });

    describe("COUNTRY_INDIVIDUAL", () => {
      it("generates correct path for country code", () => {
        expect(ROUTES.COUNTRY_INDIVIDUAL("usa")).toBe("/countries/individual/usa");
      });

      it("handles uppercase country codes", () => {
        expect(ROUTES.COUNTRY_INDIVIDUAL("GBR")).toBe("/countries/individual/GBR");
      });

      it("handles lowercase country codes", () => {
        expect(ROUTES.COUNTRY_INDIVIDUAL("chn")).toBe("/countries/individual/chn");
      });
    });
  });

  describe("route immutability", () => {
    it("ROUTES object is const (frozen-like behavior)", () => {
      // TypeScript enforces this at compile time with "as const"
      // At runtime, we just verify the structure is correct
      expect(typeof ROUTES.HOME).toBe("string");
      expect(typeof ROUTES.CONTESTANT).toBe("function");
      expect(typeof ROUTES.COMPETITION).toBe("function");
      expect(typeof ROUTES.COMPETITION_STATISTICS).toBe("function");
      expect(typeof ROUTES.COUNTRY_INDIVIDUAL).toBe("function");
    });
  });
});

describe("NAV_LINKS", () => {
  it("is an array of NavLink objects", () => {
    expect(Array.isArray(NAV_LINKS)).toBe(true);
    expect(NAV_LINKS.length).toBeGreaterThan(0);
  });

  it("contains 6 navigation links", () => {
    expect(NAV_LINKS.length).toBe(6);
  });

  it("each link has path and label properties", () => {
    NAV_LINKS.forEach((link: NavLink) => {
      expect(link).toHaveProperty("path");
      expect(link).toHaveProperty("label");
      expect(typeof link.path).toBe("string");
      expect(typeof link.label).toBe("string");
    });
  });

  it("has Contestants link", () => {
    const contestantsLink = NAV_LINKS.find((link) => link.label === "Contestants");
    expect(contestantsLink).toBeDefined();
    expect(contestantsLink?.path).toBe(ROUTES.CONTESTANTS);
  });

  it("has Competitions link", () => {
    const competitionsLink = NAV_LINKS.find((link) => link.label === "Competitions");
    expect(competitionsLink).toBeDefined();
    expect(competitionsLink?.path).toBe(ROUTES.COMPETITIONS);
  });

  it("has Countries link", () => {
    const countriesLink = NAV_LINKS.find((link) => link.label === "Countries");
    expect(countriesLink).toBeDefined();
    expect(countriesLink?.path).toBe(ROUTES.COUNTRIES_INDIVIDUAL);
  });

  it("has Compare Countries link", () => {
    const compareLink = NAV_LINKS.find((link) => link.label === "Compare Countries");
    expect(compareLink).toBeDefined();
    expect(compareLink?.path).toBe(ROUTES.COUNTRIES_COMPARE);
  });

  it("has Hall of Fame link", () => {
    const hofLink = NAV_LINKS.find((link) => link.label === "Hall of Fame");
    expect(hofLink).toBeDefined();
    expect(hofLink?.path).toBe(ROUTES.HALL_OF_FAME);
  });

  it("has Data link", () => {
    const dataLink = NAV_LINKS.find((link) => link.label === "Data");
    expect(dataLink).toBeDefined();
    expect(dataLink?.path).toBe(ROUTES.DATA);
  });

  it("all paths start with /", () => {
    NAV_LINKS.forEach((link) => {
      expect(link.path.startsWith("/")).toBe(true);
    });
  });

  it("maintains correct order", () => {
    expect(NAV_LINKS[0].label).toBe("Contestants");
    expect(NAV_LINKS[1].label).toBe("Competitions");
    expect(NAV_LINKS[2].label).toBe("Countries");
    expect(NAV_LINKS[3].label).toBe("Compare Countries");
    expect(NAV_LINKS[4].label).toBe("Hall of Fame");
    expect(NAV_LINKS[5].label).toBe("Data");
  });
});
