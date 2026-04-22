export const SITE_NAME = "Math Olympiad Results";
export const SITE_URL = "https://moresults.org";

export const SOURCE_FULL_NAMES: Record<string, string> = {
  IMO: "International Mathematical Olympiad",
  EGMO: "European Girls Mathematical Olympiad",
  MEMO: "Middle European Mathematical Olympiad",
  MEMO_TEAM: "MEMO Team Competition",
  RMM: "Romanian Masters of Mathematics",
  APMO: "Asian Pacific Mathematics Olympiad",
  BMO: "Balkan Mathematical Olympiad",
  JBMO: "Junior Balkan Mathematical Olympiad",
  PAMO: "Pan African Mathematical Olympiad",
  BALTICWAY: "Baltic Way",
};

export function pageTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}
