/**
 * TypeScript type definitions for olympiad data.
 * Mirrors the Pydantic models in data_processing/schemas/models.py
 */

export enum Source {
  IMO = "IMO",
  EGMO = "EGMO",
  MEMO = "MEMO",
  RMM = "RMM",
  APMO = "APMO",
  BMO = "BMO",
  PAMO = "PAMO",
}

export enum Award {
  GOLD = "gold",
  SILVER = "silver",
  BRONZE = "bronze",
  HONOURABLE_MENTION = "honourable_mention",
}

export interface Country {
  id: string; // Format: country-{code}
  code: string; // Original source code (kept as-is)
  name: string;
}

export interface Competition {
  id: string; // Format: {source}-{year}
  source: Source;
  year: number;
  edition: number | null;
  host_country_id: string | null;
  num_problems: number;
  max_score_per_problem: number;
}

export interface Person {
  id: string;
  name: string;
  given_name: string | null;
  family_name: string | null;
  country_id: string;
  aliases: string[];
  source_ids: Record<string, string | null>;
}

export interface Participation {
  id: string; // Format: {competition_id}-{person_id}
  competition_id: string;
  person_id: string;
  country_id: string;
  problem_scores: (number | null)[];
  total: number;
  rank: number | null;
  regional_rank: number | null;
  award: Award | null;
  extra_awards: string | null;
  source_contestant_id: string | null;
}

export interface Database {
  version: string;
  last_updated: string;
  countries: Record<string, Country>;
  competitions: Record<string, Competition>;
  people: Record<string, Person>;
  participations: Record<string, Participation>;
}
