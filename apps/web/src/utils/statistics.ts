import { Award } from "@/schemas/base";

/**
 * Interface for tracking award counts.
 */
export interface AwardCounts {
  gold: number;
  silver: number;
  bronze: number;
  hm: number;
}

/**
 * Creates a new empty award counts object.
 * Use this instead of inline object literals to avoid duplication.
 */
export function createEmptyAwardCounts(): AwardCounts {
  return { gold: 0, silver: 0, bronze: 0, hm: 0 };
}

/**
 * Increments the appropriate counter in an AwardCounts object based on the award.
 * Mutates the stats object in place for performance.
 *
 * @param stats - The award counts object to mutate
 * @param award - The award to increment (or null for no award)
 */
export function incrementAwardCounts(stats: AwardCounts, award: Award | null): void {
  if (award === Award.GOLD) stats.gold++;
  else if (award === Award.SILVER) stats.silver++;
  else if (award === Award.BRONZE) stats.bronze++;
  else if (award === Award.HONOURABLE_MENTION) stats.hm++;
}

/**
 * Calculate the arithmetic mean of an array of numbers.
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate the population standard deviation.
 */
export function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Calculate the Pearson correlation coefficient between two arrays.
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  const stdX = calculateStdDev(x, meanX);
  const stdY = calculateStdDev(y, meanY);
  if (stdX === 0 || stdY === 0) return 0;

  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY);
  }
  return sum / (x.length * stdX * stdY);
}

/**
 * Get a background color for a correlation value (for heatmaps).
 * Positive correlations are green, negative are red.
 */
export function getCorrelationColor(corr: number, isDark: boolean): string {
  if (isNaN(corr)) return "transparent";
  const intensity = Math.abs(corr);
  if (isDark) {
    if (corr >= 0) {
      const green = Math.round(40 + intensity * 80);
      return `rgba(${Math.round(30 + intensity * 20)}, ${green}, ${Math.round(30 + intensity * 20)}, ${0.3 + intensity * 0.5})`;
    } else {
      const red = Math.round(40 + intensity * 80);
      return `rgba(${red}, ${Math.round(30 + intensity * 20)}, ${Math.round(30 + intensity * 20)}, ${0.3 + intensity * 0.5})`;
    }
  } else {
    if (corr >= 0) {
      const green = Math.round(220 - intensity * 120);
      return `rgba(${Math.round(220 - intensity * 100)}, ${255}, ${green}, 1)`;
    } else {
      const red = Math.round(220 - intensity * 120);
      return `rgba(255, ${red}, ${red}, 1)`;
    }
  }
}
