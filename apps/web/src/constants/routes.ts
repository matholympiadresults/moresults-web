export const ROUTES = {
  HOME: "/",
  CONTESTANTS: "/contestants",
  CONTESTANT: (id: string) => `/contestants/${id}`,
  CONTESTANT_PATTERN: "/contestants/:id",
  COMPETITIONS: "/competitions",
  COMPETITION: (id: string) => `/competitions/${id}`,
  COMPETITION_PATTERN: "/competitions/:id",
  COMPETITION_STATISTICS: (id: string) => `/competitions/${id}/statistics`,
  COMPETITION_STATISTICS_PATTERN: "/competitions/:id/statistics",
  COUNTRIES_INDIVIDUAL: "/countries/individual",
  COUNTRY_INDIVIDUAL: (code: string) => `/countries/individual/${code}`,
  COUNTRY_INDIVIDUAL_PATTERN: "/countries/individual/:code",
  COUNTRIES_COMPARE: "/countries/compare",
  HALL_OF_FAME: "/hall-of-fame",
  DATA: "/data",
} as const;

export interface NavLink {
  path: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { path: ROUTES.CONTESTANTS, label: "Contestants" },
  { path: ROUTES.COMPETITIONS, label: "Competitions" },
  { path: ROUTES.COUNTRIES_INDIVIDUAL, label: "Countries" },
  { path: ROUTES.COUNTRIES_COMPARE, label: "Compare Countries" },
  { path: ROUTES.HALL_OF_FAME, label: "Hall of Fame" },
  { path: ROUTES.DATA, label: "Data" },
];
