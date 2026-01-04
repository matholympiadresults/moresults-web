import type { Person, Country } from "@/schemas/base";
import { isRedactedName } from "@/utils/contestants";

export interface ContestantRow {
  id: string;
  name: string;
  countryId: string;
  countryCode: string | null;
  countryName: string;
}

export interface AggregationInput {
  people: Person[];
  countryMap: Record<string, Country>;
}

/**
 * Aggregates contestant data for display in the Contestants list.
 * Filters out redacted names and maps person data to display rows.
 */
export function aggregateContestants({
  people,
  countryMap,
}: AggregationInput): ContestantRow[] {
  return people
    .filter((person) => !isRedactedName(person.name))
    .map((person) => ({
      id: person.id,
      name: person.name,
      countryId: person.country_id,
      countryCode: countryMap[person.country_id]?.code ?? null,
      countryName: countryMap[person.country_id]?.name ?? person.country_id,
    }));
}
