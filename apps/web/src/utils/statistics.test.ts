import { describe, it, expect } from "vitest";
import {
  calculateMean,
  calculateStdDev,
  calculateCorrelation,
  getCorrelationColor,
} from "./statistics";

describe("calculateMean", () => {
  it("returns 0 for empty array", () => {
    expect(calculateMean([])).toBe(0);
  });

  it("returns the single value for single-element array", () => {
    expect(calculateMean([5])).toBe(5);
  });

  it("calculates mean correctly for positive integers", () => {
    expect(calculateMean([1, 2, 3, 4, 5])).toBe(3);
  });

  it("calculates mean correctly for decimals", () => {
    expect(calculateMean([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
  });

  it("handles negative numbers", () => {
    expect(calculateMean([-2, -1, 0, 1, 2])).toBe(0);
  });

  it("handles zeros", () => {
    expect(calculateMean([0, 0, 0])).toBe(0);
  });
});

describe("calculateStdDev", () => {
  it("returns 0 for empty array", () => {
    expect(calculateStdDev([], 0)).toBe(0);
  });

  it("returns 0 for single element (no variance)", () => {
    expect(calculateStdDev([5], 5)).toBe(0);
  });

  it("returns 0 when all values are the same", () => {
    const values = [3, 3, 3, 3];
    expect(calculateStdDev(values, 3)).toBe(0);
  });

  it("calculates population std dev correctly", () => {
    // For [2, 4, 4, 4, 5, 5, 7, 9], mean = 5
    // Variance = ((2-5)² + (4-5)² + (4-5)² + (4-5)² + (5-5)² + (5-5)² + (7-5)² + (9-5)²) / 8
    // = (9 + 1 + 1 + 1 + 0 + 0 + 4 + 16) / 8 = 32/8 = 4
    // StdDev = √4 = 2
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(calculateStdDev(values, 5)).toBe(2);
  });

  it("calculates std dev for simple case", () => {
    // [1, 2, 3], mean = 2
    // Variance = ((1-2)² + (2-2)² + (3-2)²) / 3 = (1 + 0 + 1) / 3 = 2/3
    // StdDev = √(2/3) ≈ 0.8165
    const values = [1, 2, 3];
    expect(calculateStdDev(values, 2)).toBeCloseTo(0.8165, 3);
  });
});

describe("calculateCorrelation", () => {
  it("returns 0 for mismatched array lengths", () => {
    expect(calculateCorrelation([1, 2, 3], [1, 2])).toBe(0);
  });

  it("returns 0 for empty arrays", () => {
    expect(calculateCorrelation([], [])).toBe(0);
  });

  it("returns 0 when x has zero variance", () => {
    expect(calculateCorrelation([5, 5, 5], [1, 2, 3])).toBe(0);
  });

  it("returns 0 when y has zero variance", () => {
    expect(calculateCorrelation([1, 2, 3], [5, 5, 5])).toBe(0);
  });

  it("returns 1 for perfect positive correlation", () => {
    expect(calculateCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 5);
  });

  it("returns -1 for perfect negative correlation", () => {
    expect(calculateCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1, 5);
  });

  it("calculates positive correlation correctly", () => {
    // Test with known data
    const x = [1, 2, 3, 4, 5];
    const y = [1, 2, 1.3, 3.75, 2.25];
    // Expected correlation ≈ 0.5
    const corr = calculateCorrelation(x, y);
    expect(corr).toBeGreaterThan(0);
    expect(corr).toBeLessThan(1);
  });

  it("handles olympiad-like score data", () => {
    // Simulating problem scores and totals
    const problemScores = [7, 7, 5, 3, 1, 0, 0, 7, 6, 2];
    const totals = [42, 40, 35, 28, 15, 10, 8, 41, 38, 20];
    const corr = calculateCorrelation(problemScores, totals);
    // Should show positive correlation between problem score and total
    expect(corr).toBeGreaterThan(0.5);
  });
});

describe("getCorrelationColor", () => {
  it("returns transparent for NaN", () => {
    expect(getCorrelationColor(NaN, true)).toBe("transparent");
    expect(getCorrelationColor(NaN, false)).toBe("transparent");
  });

  it("returns valid rgba for zero correlation (dark mode)", () => {
    const color = getCorrelationColor(0, true);
    expect(color).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
  });

  it("returns valid rgba for zero correlation (light mode)", () => {
    const color = getCorrelationColor(0, false);
    expect(color).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
  });

  it("returns valid rgba for positive correlation", () => {
    const colorDark = getCorrelationColor(0.8, true);
    const colorLight = getCorrelationColor(0.8, false);
    expect(colorDark).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    expect(colorLight).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
  });

  it("returns valid rgba for negative correlation", () => {
    const colorDark = getCorrelationColor(-0.8, true);
    const colorLight = getCorrelationColor(-0.8, false);
    expect(colorDark).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    expect(colorLight).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
  });

  it("produces different colors for positive vs negative correlations", () => {
    const positive = getCorrelationColor(0.5, false);
    const negative = getCorrelationColor(-0.5, false);
    expect(positive).not.toBe(negative);
  });
});
