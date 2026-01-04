import { Layout } from "@/components/Header";
import { ROUTES } from "@/constants/routes";
import {
  Home,
  Contestants,
  Contestant,
  Competitions,
  Competition,
  CompetitionStatistics,
  CountriesIndividual,
  CountryIndividual,
  CountryComparison,
  HallOfFame,
  Data,
} from "@/pages";
import { createBrowserRouter } from "react-router";

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: ROUTES.CONTESTANTS,
        element: <Contestants />,
      },
      {
        path: ROUTES.CONTESTANT_PATTERN,
        element: <Contestant />,
      },
      {
        path: ROUTES.COMPETITIONS,
        element: <Competitions />,
      },
      {
        path: ROUTES.COMPETITION_PATTERN,
        element: <Competition />,
      },
      {
        path: ROUTES.COMPETITION_STATISTICS_PATTERN,
        element: <CompetitionStatistics />,
      },
      {
        path: ROUTES.COUNTRIES_INDIVIDUAL,
        element: <CountriesIndividual />,
      },
      {
        path: ROUTES.COUNTRY_INDIVIDUAL_PATTERN,
        element: <CountryIndividual />,
      },
      {
        path: ROUTES.COUNTRIES_COMPARE,
        element: <CountryComparison />,
      },
      {
        path: ROUTES.HALL_OF_FAME,
        element: <HallOfFame />,
      },
      {
        path: ROUTES.DATA,
        element: <Data />,
      },
    ],
  },
]);
