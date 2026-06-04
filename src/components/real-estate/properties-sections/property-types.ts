/**
 * Filter option constants used across the properties page components.
 * The Property interface lives in @/components/real-estate/types/property.
 */

export const propertyTypes = ["apartment", "villa", "house", "condo", "townhouse", "penthouse"] as const;
export const bedroomOptions = [1, 2, 3, 4, 5] as const;
export const bathroomOptions = [1, 2, 3, 4] as const;
export const areaOptions = [500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000] as const;

/** Maximum price used by the price-range slider */
export const MAX_PRICE = 5_000_000;
