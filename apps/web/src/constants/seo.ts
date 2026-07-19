export const SITE_NAME = "Math Olympiad Results";
export const SITE_URL = "https://moresults.org";

// Ordered chronologically by when each competition is typically held during the year.
export const SOURCE_FULL_NAMES: Record<string, string> = {
  RMM: "Romanian Masters of Mathematics",
  APMO: "Asian Pacific Mathematics Olympiad",
  EGMO: "European Girls Mathematical Olympiad",
  EMO: "European Mathematical Olympiad",
  BMO: "Balkan Mathematical Olympiad",
  JBMO: "Junior Balkan Mathematical Olympiad",
  PAMO: "Pan African Mathematical Olympiad",
  IMO: "International Mathematical Olympiad",
  MEMO: "Middle European Mathematical Olympiad",
  MEMO_TEAM: "MEMO Team Competition",
  BALTICWAY: "Baltic Way",
};

export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}
