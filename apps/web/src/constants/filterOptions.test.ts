import { describe, it, expect } from "vitest";
import {
  SOURCE_OPTIONS,
  SOURCE_OPTIONS_WITH_ALL,
  AWARD_OPTIONS,
} from "./filterOptions";
import { Source, Award } from "@/schemas/base";

describe("SOURCE_OPTIONS", () => {
  it("contains all Source enum values", () => {
    const sourceValues = SOURCE_OPTIONS.map((opt) => opt.value);
    const enumValues = Object.values(Source);

    for (const enumValue of enumValues) {
      expect(sourceValues).toContain(enumValue);
    }
  });

  it("has no duplicate values", () => {
    const values = SOURCE_OPTIONS.map((opt) => opt.value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it("has labels for all options", () => {
    for (const option of SOURCE_OPTIONS) {
      expect(option.label).toBeTruthy();
      expect(typeof option.label).toBe("string");
    }
  });

  it("IMO is first (most common competition)", () => {
    expect(SOURCE_OPTIONS[0].value).toBe(Source.IMO);
  });
});

describe("SOURCE_OPTIONS_WITH_ALL", () => {
  it("has 'all' as first option", () => {
    expect(SOURCE_OPTIONS_WITH_ALL[0].value).toBe("all");
    expect(SOURCE_OPTIONS_WITH_ALL[0].label).toBe("All Competitions");
  });

  it("contains all Source enum values after 'all'", () => {
    const sourceValues = SOURCE_OPTIONS_WITH_ALL.slice(1).map(
      (opt) => opt.value
    );
    const enumValues = Object.values(Source);

    for (const enumValue of enumValues) {
      expect(sourceValues).toContain(enumValue);
    }
  });

  it("has one more option than SOURCE_OPTIONS", () => {
    expect(SOURCE_OPTIONS_WITH_ALL.length).toBe(SOURCE_OPTIONS.length + 1);
  });
});

describe("AWARD_OPTIONS", () => {
  it("contains all Award enum values", () => {
    const awardValues = AWARD_OPTIONS.map((opt) => opt.value);
    const enumValues = Object.values(Award);

    for (const enumValue of enumValues) {
      expect(awardValues).toContain(enumValue);
    }
  });

  it("has no duplicate values", () => {
    const values = AWARD_OPTIONS.map((opt) => opt.value);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it("has labels for all options", () => {
    for (const option of AWARD_OPTIONS) {
      expect(option.label).toBeTruthy();
      expect(typeof option.label).toBe("string");
    }
  });

  it("is ordered by medal rank (gold first)", () => {
    expect(AWARD_OPTIONS[0].value).toBe(Award.GOLD);
    expect(AWARD_OPTIONS[1].value).toBe(Award.SILVER);
    expect(AWARD_OPTIONS[2].value).toBe(Award.BRONZE);
    expect(AWARD_OPTIONS[3].value).toBe(Award.HONOURABLE_MENTION);
  });

  it("has human-readable labels", () => {
    const goldOption = AWARD_OPTIONS.find((opt) => opt.value === Award.GOLD);
    expect(goldOption?.label).toBe("Gold");

    const hmOption = AWARD_OPTIONS.find(
      (opt) => opt.value === Award.HONOURABLE_MENTION
    );
    expect(hmOption?.label).toBe("Honourable Mention");
  });
});
