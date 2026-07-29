import { describe, expect, test } from "bun:test";
import {
  MAX_COMPARISON_ITEMS,
  mergeSavedSearches,
  mergeUniqueIds,
  normalizeSavedSearchFilters,
  sameIds,
  savedSearchSignature,
  uniqueIds,
} from "./account-state";

describe("account-state id collections", () => {
  test("normalizes, deduplicates, and limits IDs", () => {
    expect(
      uniqueIds(
        [" property-1 ", "property-1", "", 42, "property-2"],
        2
      )
    ).toEqual(["property-1", "property-2"]);
  });

  test("keeps server order while importing guest IDs", () => {
    expect(
      mergeUniqueIds(
        ["server-a", "server-b"],
        ["guest-a", "server-a", "guest-b"],
        MAX_COMPARISON_ITEMS
      )
    ).toEqual(["server-a", "server-b", "guest-a"]);
  });

  test("compares ordered ID lists", () => {
    expect(sameIds(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameIds(["a", "b"], ["b", "a"])).toBe(false);
  });
});

describe("saved-search normalization", () => {
  test("keeps supported filters and converts primitive values", () => {
    expect(
      normalizeSavedSearchFilters({
        type: " villa ",
        minPrice: 250000,
        featured: true,
        unsupported: "ignored",
        empty: "",
      })
    ).toEqual({
      type: "villa",
      minPrice: "250000",
      featured: "true",
    });
  });

  test("generates stable signatures regardless of filter order", () => {
    expect(
      savedSearchSignature("Family homes", {
        bedrooms: "3",
        type: "house",
      })
    ).toBe(
      savedSearchSignature(" family homes ", {
        type: "house",
        bedrooms: "3",
      })
    );
  });

  test("deduplicates imported saved searches", () => {
    const now = new Date().toISOString();
    const first = {
      id: "one",
      name: "Villas",
      filters: { type: "villa" },
      notificationsEnabled: false,
      createdAt: now,
      updatedAt: now,
    };
    const duplicate = {
      ...first,
      id: "two",
      name: " villas ",
    };

    expect(mergeSavedSearches([first], [duplicate])).toEqual([
      first,
    ]);
  });
});
