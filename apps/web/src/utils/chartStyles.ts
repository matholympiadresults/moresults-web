/**
 * Shared chart styling utilities for consistent chart appearance across the application.
 * Used by Contestant, CountryComparison, CountryIndividual, and Competition pages.
 */

export interface TooltipStyle {
  contentStyle: {
    backgroundColor: string;
    border: string;
    borderRadius: number;
  };
  labelStyle: {
    color: string;
  };
}

export interface AxisStyle {
  tick: {
    fontSize: number;
    fill: string;
  };
}

/**
 * Get tooltip styling based on color scheme.
 */
export function getTooltipStyle(isDark: boolean): TooltipStyle {
  return {
    contentStyle: {
      backgroundColor: isDark ? "#25262b" : "#fff",
      border: `1px solid ${isDark ? "#373a40" : "#dee2e6"}`,
      borderRadius: 4,
    },
    labelStyle: { color: isDark ? "#c1c2c5" : "#495057" },
  };
}

/**
 * Get axis styling based on color scheme.
 */
export function getAxisStyle(isDark: boolean): AxisStyle {
  return {
    tick: { fontSize: 12, fill: isDark ? "#c1c2c5" : "#495057" },
  };
}

/**
 * Get inline tooltip content styling for custom tooltip content.
 */
export function getTooltipContentStyle(isDark: boolean): React.CSSProperties {
  return {
    backgroundColor: isDark ? "#25262b" : "#fff",
    border: `1px solid ${isDark ? "#373a40" : "#dee2e6"}`,
    borderRadius: 4,
    padding: "8px 12px",
  };
}
