import { Source, Award } from "@/schemas/base";

export interface FilterOption<T> {
  value: T;
  label: string;
}

/**
 * Standard source filter options for competition dropdowns.
 * Used across Competitions, Contestant, CountryIndividual, CountryComparison pages.
 */
export const SOURCE_OPTIONS: FilterOption<Source>[] = [
  { value: Source.IMO, label: "IMO" },
  { value: Source.EGMO, label: "EGMO" },
  { value: Source.MEMO, label: "MEMO" },
  { value: Source.MEMO_TEAM, label: "MEMO Team" },
  { value: Source.RMM, label: "RMM" },
  { value: Source.APMO, label: "APMO" },
  { value: Source.BMO, label: "BMO" },
  { value: Source.PAMO, label: "PAMO" },
  { value: Source.BALTICWAY, label: "Baltic Way" },
];

/**
 * Source options with an "All" option for pages that support it.
 */
export const SOURCE_OPTIONS_WITH_ALL: FilterOption<Source | "all">[] = [
  { value: "all", label: "All Competitions" },
  ...SOURCE_OPTIONS,
];

/**
 * Standard award filter options for result tables.
 */
export const AWARD_OPTIONS: FilterOption<Award>[] = [
  { value: Award.GOLD, label: "Gold" },
  { value: Award.SILVER, label: "Silver" },
  { value: Award.BRONZE, label: "Bronze" },
  { value: Award.HONOURABLE_MENTION, label: "Honourable Mention" },
];

/**
 * Award color mapping for badges and visual indicators.
 * Used across Contestant, CountryIndividual, and Competition pages.
 */
export const AWARD_COLORS: Record<Award, string> = {
  [Award.GOLD]: "yellow",
  [Award.SILVER]: "gray",
  [Award.BRONZE]: "orange",
  [Award.HONOURABLE_MENTION]: "blue",
};
