import { describe, it, expect } from "vitest";
import { isRedactedName } from "./contestants";

describe("isRedactedName", () => {
  describe("detects redacted names", () => {
    it("returns true for names starting with '('", () => {
      expect(isRedactedName("(redacted)")).toBe(true);
      expect(isRedactedName("(name removed)")).toBe(true);
      expect(isRedactedName("(anonymous)")).toBe(true);
    });

    it("returns true for names starting with '*'", () => {
      expect(isRedactedName("*redacted*")).toBe(true);
      expect(isRedactedName("* Name")).toBe(true);
      expect(isRedactedName("*")).toBe(true);
    });
  });

  describe("allows valid names", () => {
    it("returns false for regular names", () => {
      expect(isRedactedName("John Smith")).toBe(false);
      expect(isRedactedName("Alice Johnson")).toBe(false);
      expect(isRedactedName("Bob")).toBe(false);
    });

    it("returns false for names with special characters in the middle", () => {
      expect(isRedactedName("Mary O'Connor")).toBe(false);
      expect(isRedactedName("Jean-Pierre Dupont")).toBe(false);
    });

    it("returns false for names containing '(' or '*' but not at start", () => {
      expect(isRedactedName("Name (nickname)")).toBe(false);
      expect(isRedactedName("Name *special")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isRedactedName("")).toBe(false);
    });
  });
});
