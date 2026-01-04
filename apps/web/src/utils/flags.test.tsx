import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { countryCodeToFlag, CountryFlag } from "./flags";

describe("countryCodeToFlag", () => {
  describe("2-letter codes (alpha-2)", () => {
    it("converts US to flag emoji", () => {
      const flag = countryCodeToFlag("US");
      expect(flag).toBe("🇺🇸");
    });

    it("converts GB to flag emoji", () => {
      const flag = countryCodeToFlag("GB");
      expect(flag).toBe("🇬🇧");
    });

    it("converts DE to flag emoji", () => {
      const flag = countryCodeToFlag("DE");
      expect(flag).toBe("🇩🇪");
    });

    it("converts JP to flag emoji", () => {
      const flag = countryCodeToFlag("JP");
      expect(flag).toBe("🇯🇵");
    });

    it("handles lowercase 2-letter codes", () => {
      const flag = countryCodeToFlag("us");
      expect(flag).toBe("🇺🇸");
    });

    it("handles mixed case 2-letter codes", () => {
      const flag = countryCodeToFlag("Us");
      expect(flag).toBe("🇺🇸");
    });
  });

  describe("3-letter codes (alpha-3)", () => {
    it("converts USA to flag emoji", () => {
      const flag = countryCodeToFlag("USA");
      expect(flag).toBe("🇺🇸");
    });

    it("converts GBR to flag emoji", () => {
      const flag = countryCodeToFlag("GBR");
      expect(flag).toBe("🇬🇧");
    });

    it("converts DEU to flag emoji", () => {
      const flag = countryCodeToFlag("DEU");
      expect(flag).toBe("🇩🇪");
    });

    it("converts JPN to flag emoji", () => {
      const flag = countryCodeToFlag("JPN");
      expect(flag).toBe("🇯🇵");
    });

    it("converts CHN to flag emoji", () => {
      const flag = countryCodeToFlag("CHN");
      expect(flag).toBe("🇨🇳");
    });

    it("converts FRA to flag emoji", () => {
      const flag = countryCodeToFlag("FRA");
      expect(flag).toBe("🇫🇷");
    });

    it("handles lowercase 3-letter codes", () => {
      const flag = countryCodeToFlag("usa");
      expect(flag).toBe("🇺🇸");
    });

    it("handles mixed case 3-letter codes", () => {
      const flag = countryCodeToFlag("Usa");
      expect(flag).toBe("🇺🇸");
    });

    it("converts KOS (Kosovo) to flag emoji", () => {
      const flag = countryCodeToFlag("KOS");
      expect(flag).toBe("🇽🇰");
    });

    it("converts XKX (Kosovo alternate) to flag emoji", () => {
      const flag = countryCodeToFlag("XKX");
      expect(flag).toBe("🇽🇰");
    });
  });

  describe("edge cases", () => {
    it("returns empty string for null", () => {
      const flag = countryCodeToFlag(null);
      expect(flag).toBe("");
    });

    it("returns empty string for undefined", () => {
      const flag = countryCodeToFlag(undefined);
      expect(flag).toBe("");
    });

    it("returns empty string for empty string", () => {
      const flag = countryCodeToFlag("");
      expect(flag).toBe("");
    });

    it("returns empty string for single character", () => {
      const flag = countryCodeToFlag("U");
      expect(flag).toBe("");
    });

    it("returns empty string for 4+ character codes", () => {
      const flag = countryCodeToFlag("USAA");
      expect(flag).toBe("");
    });

    it("returns empty string for unknown 3-letter code", () => {
      const flag = countryCodeToFlag("XXX");
      expect(flag).toBe("");
    });
  });

  describe("various countries", () => {
    const testCases: [string, string][] = [
      ["AFG", "🇦🇫"], // Afghanistan
      ["AUS", "🇦🇺"], // Australia
      ["BRA", "🇧🇷"], // Brazil
      ["CAN", "🇨🇦"], // Canada
      ["IND", "🇮🇳"], // India
      ["KOR", "🇰🇷"], // South Korea
      ["MEX", "🇲🇽"], // Mexico
      ["NLD", "🇳🇱"], // Netherlands
      ["POL", "🇵🇱"], // Poland
      ["RUS", "🇷🇺"], // Russia
      ["ESP", "🇪🇸"], // Spain
      ["SWE", "🇸🇪"], // Sweden
      ["TUR", "🇹🇷"], // Turkey
      ["UKR", "🇺🇦"], // Ukraine
      ["VNM", "🇻🇳"], // Vietnam
    ];

    testCases.forEach(([code, expected]) => {
      it(`converts ${code} to ${expected}`, () => {
        expect(countryCodeToFlag(code)).toBe(expected);
      });
    });
  });
});

describe("CountryFlag", () => {
  function renderCountryFlag(code: string | null | undefined, size?: "xs" | "sm" | "md" | "lg" | "xl") {
    return render(
      <MantineProvider>
        <CountryFlag code={code} size={size} />
      </MantineProvider>
    );
  }

  describe("rendering", () => {
    it("renders flag emoji for valid country code", () => {
      renderCountryFlag("USA");

      expect(screen.getByText("🇺🇸")).toBeInTheDocument();
    });

    it("renders flag for 2-letter code", () => {
      renderCountryFlag("US");

      expect(screen.getByText("🇺🇸")).toBeInTheDocument();
    });

    it("renders nothing for null code", () => {
      renderCountryFlag(null);

      // Should not render any flag emoji text
      expect(screen.queryByText(/🇦|🇧|🇨|🇩|🇪|🇫|🇬|🇭|🇮|🇯|🇰|🇱|🇲|🇳|🇴|🇵|🇶|🇷|🇸|🇹|🇺|🇻|🇼|🇽|🇾|🇿/)).toBeNull();
    });

    it("renders nothing for undefined code", () => {
      renderCountryFlag(undefined);

      // Should not render any flag emoji text
      expect(screen.queryByText(/🇦|🇧|🇨|🇩|🇪|🇫|🇬|🇭|🇮|🇯|🇰|🇱|🇲|🇳|🇴|🇵|🇶|🇷|🇸|🇹|🇺|🇻|🇼|🇽|🇾|🇿/)).toBeNull();
    });

    it("renders nothing for invalid code", () => {
      renderCountryFlag("INVALID");

      // Should not render any flag emoji text
      expect(screen.queryByText(/🇦|🇧|🇨|🇩|🇪|🇫|🇬|🇭|🇮|🇯|🇰|🇱|🇲|🇳|🇴|🇵|🇶|🇷|🇸|🇹|🇺|🇻|🇼|🇽|🇾|🇿/)).toBeNull();
    });
  });

  describe("size prop", () => {
    it("renders with default sm size", () => {
      renderCountryFlag("USA");

      const flag = screen.getByText("🇺🇸");
      expect(flag).toBeInTheDocument();
    });

    it("renders with xs size", () => {
      renderCountryFlag("USA", "xs");

      const flag = screen.getByText("🇺🇸");
      expect(flag).toBeInTheDocument();
    });

    it("renders with lg size", () => {
      renderCountryFlag("USA", "lg");

      const flag = screen.getByText("🇺🇸");
      expect(flag).toBeInTheDocument();
    });
  });

  describe("various countries", () => {
    it("renders UK flag", () => {
      renderCountryFlag("GBR");

      expect(screen.getByText("🇬🇧")).toBeInTheDocument();
    });

    it("renders Japan flag", () => {
      renderCountryFlag("JPN");

      expect(screen.getByText("🇯🇵")).toBeInTheDocument();
    });

    it("renders China flag", () => {
      renderCountryFlag("CHN");

      expect(screen.getByText("🇨🇳")).toBeInTheDocument();
    });
  });
});
