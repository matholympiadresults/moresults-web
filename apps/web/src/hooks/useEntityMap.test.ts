import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEntityMap } from "./useEntityMap";

interface TestEntity {
  id: string;
  name: string;
  value?: number;
}

describe("useEntityMap", () => {
  it("creates a map from an array of entities", () => {
    const entities: TestEntity[] = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
      { id: "c", name: "Charlie" },
    ];

    const { result } = renderHook(() => useEntityMap(entities));

    expect(result.current).toEqual({
      a: { id: "a", name: "Alice" },
      b: { id: "b", name: "Bob" },
      c: { id: "c", name: "Charlie" },
    });
  });

  it("returns an empty object for an empty array", () => {
    const entities: TestEntity[] = [];

    const { result } = renderHook(() => useEntityMap(entities));

    expect(result.current).toEqual({});
  });

  it("handles a single entity", () => {
    const entities: TestEntity[] = [{ id: "only", name: "Only One" }];

    const { result } = renderHook(() => useEntityMap(entities));

    expect(result.current).toEqual({
      only: { id: "only", name: "Only One" },
    });
  });

  it("preserves all entity properties", () => {
    const entities: TestEntity[] = [
      { id: "x", name: "Test", value: 42 },
      { id: "y", name: "Another", value: 100 },
    ];

    const { result } = renderHook(() => useEntityMap(entities));

    expect(result.current.x).toEqual({ id: "x", name: "Test", value: 42 });
    expect(result.current.y).toEqual({ id: "y", name: "Another", value: 100 });
  });

  it("allows O(1) lookup by id", () => {
    const entities: TestEntity[] = [
      { id: "first", name: "First" },
      { id: "second", name: "Second" },
      { id: "third", name: "Third" },
    ];

    const { result } = renderHook(() => useEntityMap(entities));

    expect(result.current["second"]).toEqual({ id: "second", name: "Second" });
    expect(result.current["nonexistent"]).toBeUndefined();
  });

  it("returns undefined for non-existent keys", () => {
    const entities: TestEntity[] = [{ id: "exists", name: "Exists" }];

    const { result } = renderHook(() => useEntityMap(entities));

    expect(result.current["missing"]).toBeUndefined();
  });

  it("memoizes the result when entities reference is stable", () => {
    const entities: TestEntity[] = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
    ];

    const { result, rerender } = renderHook(() => useEntityMap(entities));

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });

  it("recomputes when entities array changes", () => {
    const initialEntities: TestEntity[] = [{ id: "a", name: "Alice" }];
    const updatedEntities: TestEntity[] = [
      { id: "a", name: "Alice" },
      { id: "b", name: "Bob" },
    ];

    const { result, rerender } = renderHook(({ entities }) => useEntityMap(entities), {
      initialProps: { entities: initialEntities },
    });

    expect(Object.keys(result.current)).toHaveLength(1);

    rerender({ entities: updatedEntities });

    expect(Object.keys(result.current)).toHaveLength(2);
    expect(result.current.b).toEqual({ id: "b", name: "Bob" });
  });

  it("handles entities with duplicate ids by keeping the last one", () => {
    const entities: TestEntity[] = [
      { id: "dup", name: "First" },
      { id: "dup", name: "Second" },
    ];

    const { result } = renderHook(() => useEntityMap(entities));

    expect(result.current.dup).toEqual({ id: "dup", name: "Second" });
    expect(Object.keys(result.current)).toHaveLength(1);
  });
});
