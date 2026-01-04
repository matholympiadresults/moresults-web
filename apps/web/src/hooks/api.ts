import { useState, useEffect, useMemo } from "react";
import type {
  Database,
  Country,
  Competition,
  Person,
  Participation,
} from "@/schemas/base";

const DATA_URL = "/data/olympiad_data.json.gz";

let cachedDatabase: Database | null = null;
let fetchPromise: Promise<Database> | null = null;
let cachedTimestamp: number | null = null;

// Cache expires after 5 seconds in development for easier testing
const CACHE_TTL_MS = process.env.NODE_ENV === "production" ? Infinity : 5000;

async function fetchAndDecompress(url: string): Promise<Database> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status}`);
  }

  const ds = new DecompressionStream("gzip");
  const decompressedStream = response.body!.pipeThrough(ds);
  const decompressedResponse = new Response(decompressedStream);
  return decompressedResponse.json();
}

async function fetchDatabase(): Promise<Database> {
  const now = Date.now();
  if (cachedDatabase && cachedTimestamp && now - cachedTimestamp < CACHE_TTL_MS) {
    return cachedDatabase;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  // Clear stale cache
  cachedDatabase = null;
  cachedTimestamp = null;

  fetchPromise = fetchAndDecompress(DATA_URL)
    .then((data: Database) => {
      cachedDatabase = data;
      cachedTimestamp = Date.now();
      fetchPromise = null;
      return data;
    })
    .catch((err) => {
      fetchPromise = null;
      throw err;
    });

  return fetchPromise;
}

export interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseListResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export interface UseCountriesResult extends UseListResult<Country> {
  countries: Country[];
}

export interface UseCountryResult extends UseQueryResult<Country> {
  country: Country | null;
}

export interface UseCompetitionsResult extends UseListResult<Competition> {
  competitions: Competition[];
}

export interface UseCompetitionResult extends UseQueryResult<Competition> {
  competition: Competition | null;
}

export interface UsePeopleResult extends UseListResult<Person> {
  people: Person[];
}

export interface UsePersonResult extends UseQueryResult<Person> {
  person: Person | null;
}

export interface UseParticipationsResult extends UseListResult<Participation> {
  participations: Participation[];
}

export function useDatabase(): UseQueryResult<Database> {
  const [data, setData] = useState<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchDatabase()
      .then((db) => {
        setData(db);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}

export function useCountries(): UseCountriesResult {
  const { data, loading, error } = useDatabase();
  const countries = useMemo(
    () => (data ? Object.values(data.countries) : []),
    [data]
  );
  return { data: countries, countries, loading, error };
}

export function useCountry(id: string): UseCountryResult {
  const { data, loading, error } = useDatabase();
  const country = useMemo(() => data?.countries[id] ?? null, [data, id]);
  return { data: country, country, loading, error };
}

export function useCompetitions(): UseCompetitionsResult {
  const { data, loading, error } = useDatabase();
  const competitions = useMemo(
    () => (data ? Object.values(data.competitions) : []),
    [data]
  );
  return { data: competitions, competitions, loading, error };
}

export function useCompetition(id: string): UseCompetitionResult {
  const { data, loading, error } = useDatabase();
  const competition = useMemo(() => data?.competitions[id] ?? null, [data, id]);
  return { data: competition, competition, loading, error };
}

export function usePeople(): UsePeopleResult {
  const { data, loading, error } = useDatabase();
  const people = useMemo(
    () => (data ? Object.values(data.people) : []),
    [data]
  );
  return { data: people, people, loading, error };
}

export function usePerson(id: string): UsePersonResult {
  const { data, loading, error } = useDatabase();
  const person = useMemo(() => data?.people[id] ?? null, [data, id]);
  return { data: person, person, loading, error };
}

export function useParticipations(): UseParticipationsResult {
  const { data, loading, error } = useDatabase();
  const participations = useMemo(
    () => (data ? Object.values(data.participations) : []),
    [data]
  );
  return { data: participations, participations, loading, error };
}

export function useParticipationsByPerson(personId: string): UseParticipationsResult {
  const { data, loading, error } = useDatabase();
  const participations = useMemo(
    () =>
      data
        ? Object.values(data.participations).filter(
            (p) => p.person_id === personId
          )
        : [],
    [data, personId]
  );
  return { data: participations, participations, loading, error };
}

export function useParticipationsByCompetition(competitionId: string): UseParticipationsResult {
  const { data, loading, error } = useDatabase();
  const participations = useMemo(
    () =>
      data
        ? Object.values(data.participations).filter(
            (p) => p.competition_id === competitionId
          )
        : [],
    [data, competitionId]
  );
  return { data: participations, participations, loading, error };
}

export function useParticipationsByCountry(countryId: string): UseParticipationsResult {
  const { data, loading, error } = useDatabase();
  const participations = useMemo(
    () =>
      data
        ? Object.values(data.participations).filter(
            (p) => p.country_id === countryId
          )
        : [],
    [data, countryId]
  );
  return { data: participations, participations, loading, error };
}
