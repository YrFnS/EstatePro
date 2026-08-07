/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import {
  hasInvalidPropertyAlertRange,
  nextPropertyAlertRun,
  normalizeLegacyPropertyAlert,
  normalizePropertyAlertFilters,
  propertyAlertIntervalMs,
  propertyAlertResultsUrl,
  propertyAlertSignature,
} from "./property-alerts";

describe("property alert filters", () => {
  test("normalizes legacy statuses and numeric values", () => {
    expect(
      normalizePropertyAlertFilters({
        type: " villa ",
        status: "for-sale",
        bedrooms: "3+",
        minPrice: 250000,
        maxArea: -1,
        sort: "newest",
        view: "map",
      })
    ).toEqual({
      type: "villa",
      status: "sale",
      bedrooms: "3",
      minPrice: "250000",
    });
  });

  test("rejects inverted price and area ranges", () => {
    expect(hasInvalidPropertyAlertRange({ minPrice: "1000", maxPrice: "500" })).toBe(true);
    expect(hasInvalidPropertyAlertRange({ minArea: "500", maxArea: "1000" })).toBe(false);
  });

  test("builds stable signatures", () => {
    expect(
      propertyAlertSignature(
        "Family homes",
        {
          bedrooms: "3",
          type: "house",
        },
        "daily"
      )
    ).toBe(
      propertyAlertSignature(
        " family homes ",
        {
          type: "house",
          bedrooms: "3",
        },
        "daily"
      )
    );
  });

  test("creates a property results URL", () => {
    expect(
      propertyAlertResultsUrl({
        status: "rent",
        type: "apartment",
      })
    ).toBe("/properties?status=rent&type=apartment");
  });
});

describe("property alert scheduling", () => {
  test("uses a fifteen minute interval for instant alerts", () => {
    expect(propertyAlertIntervalMs("instant")).toBe(
      15 * 60 * 1000
    );
  });

  test("calculates the next daily run", () => {
    const from = new Date("2026-07-30T06:00:00.000Z");
    expect(
      nextPropertyAlertRun("daily", from).toISOString()
    ).toBe("2026-07-31T06:00:00.000Z");
  });
});

describe("legacy property alert migration", () => {
  test("converts the old browser alert shape", () => {
    expect(
      normalizeLegacyPropertyAlert({
        name: "Downtown rentals",
        propertyType: "apartment",
        status: "for-rent",
        maxPrice: 1800,
        bedrooms: "2+",
        frequency: "instant",
        enabled: true,
      })
    ).toEqual({
      name: "Downtown rentals",
      filters: {
        type: "apartment",
        status: "rent",
        maxPrice: "1800",
        bedrooms: "2",
      },
      frequency: "instant",
      enabled: true,
    });
  });
});
