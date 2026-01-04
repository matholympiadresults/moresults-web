import { useMemo } from "react";

/**
 * Creates a memoized map from an array of entities, keyed by their id property.
 * This is a common pattern used across many components to enable O(1) lookups.
 *
 * @param entities - Array of entities with an 'id' property
 * @returns A memoized object mapping id -> entity
 */
export function useEntityMap<T extends { id: string }>(
  entities: T[]
): Record<string, T> {
  return useMemo(
    () => Object.fromEntries(entities.map((e) => [e.id, e])),
    [entities]
  );
}
