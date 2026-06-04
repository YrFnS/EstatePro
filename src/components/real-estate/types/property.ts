/**
 * Shared Property type used across all real estate components.
 * Based on the Prisma Property model with agent relation.
 */

export interface PropertyAgent {
  id: string;
  nameEn: string;
  nameAr: string;
  titleEn: string;
  titleAr: string;
  rating: number;
  image: string;
  phone: string;
  email: string;
  specialization: string;
  experience: number;
}

export interface Property {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  locationEn: string;
  locationAr: string;
  addressEn: string;
  addressAr: string;
  cityEn: string;
  cityAr: string;
  images: string;
  features: string;
  yearBuilt: number | null;
  parking: number;
  badge: string | null;
  featured: boolean;
  agentId: string | null;
  lat?: number | null;
  lng?: number | null;
  virtualTourUrl?: string | null;
  virtualTourImages?: string | null;
  agent?: PropertyAgent | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Helper to get the localized title
 */
export function getPropertyTitle(property: Property, locale: string): string {
  return locale === "ar" ? property.titleAr : property.titleEn;
}

/**
 * Helper to get the localized description
 */
export function getPropertyDescription(property: Property, locale: string): string {
  return locale === "ar" ? property.descriptionAr : property.descriptionEn;
}

/**
 * Helper to get the localized location
 */
export function getPropertyLocation(property: Property, locale: string): string {
  return locale === "ar" ? property.locationAr : property.locationEn;
}

/**
 * Helper to get the localized address
 */
export function getPropertyAddress(property: Property, locale: string): string {
  return locale === "ar" ? property.addressAr : property.addressEn;
}

/**
 * Helper to get the localized city
 */
export function getPropertyCity(property: Property, locale: string): string {
  return locale === "ar" ? property.cityAr : property.cityEn;
}

/**
 * Parse comma-separated images string into array
 */
export function getPropertyImages(property: Property): string[] {
  if (!property.images) return [];
  return property.images.split(",").map((img) => img.trim());
}

/**
 * Parse comma-separated features string into array
 */
export function getPropertyFeatures(property: Property): string[] {
  if (!property.features) return [];
  return property.features.split(",").map((f) => f.trim());
}
