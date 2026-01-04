import { describe, it, expect } from "vitest";
import { getTooltipStyle, getAxisStyle, getTooltipContentStyle } from "./chartStyles";

describe("chartStyles", () => {
  describe("getTooltipStyle", () => {
    it("returns dark theme styles when isDark is true", () => {
      const style = getTooltipStyle(true);

      expect(style.contentStyle.backgroundColor).toBe("#25262b");
      expect(style.contentStyle.border).toBe("1px solid #373a40");
      expect(style.contentStyle.borderRadius).toBe(4);
      expect(style.labelStyle.color).toBe("#c1c2c5");
    });

    it("returns light theme styles when isDark is false", () => {
      const style = getTooltipStyle(false);

      expect(style.contentStyle.backgroundColor).toBe("#fff");
      expect(style.contentStyle.border).toBe("1px solid #dee2e6");
      expect(style.contentStyle.borderRadius).toBe(4);
      expect(style.labelStyle.color).toBe("#495057");
    });
  });

  describe("getAxisStyle", () => {
    it("returns dark theme tick styles when isDark is true", () => {
      const style = getAxisStyle(true);

      expect(style.tick.fontSize).toBe(12);
      expect(style.tick.fill).toBe("#c1c2c5");
    });

    it("returns light theme tick styles when isDark is false", () => {
      const style = getAxisStyle(false);

      expect(style.tick.fontSize).toBe(12);
      expect(style.tick.fill).toBe("#495057");
    });
  });

  describe("getTooltipContentStyle", () => {
    it("returns dark theme content styles when isDark is true", () => {
      const style = getTooltipContentStyle(true);

      expect(style.backgroundColor).toBe("#25262b");
      expect(style.border).toBe("1px solid #373a40");
      expect(style.borderRadius).toBe(4);
      expect(style.padding).toBe("8px 12px");
    });

    it("returns light theme content styles when isDark is false", () => {
      const style = getTooltipContentStyle(false);

      expect(style.backgroundColor).toBe("#fff");
      expect(style.border).toBe("1px solid #dee2e6");
      expect(style.borderRadius).toBe(4);
      expect(style.padding).toBe("8px 12px");
    });
  });
});
