/**
 * Shared property types used across public and account listing components.
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

export interface PropertyMedia {
  id: string;
  propertyId?: string;
  url: string;
  storageKey?: string | null;
  source?: string;
  type: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  sortOrder: number;
  isCover: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyOwner {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string;
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
  media?: PropertyMedia[];
  listingStatus?: string;
  ownerUserId?: string | null;
  owner?: PropertyOwner | null;
  createdByUserId?: string | null;
  reviewedByUserId?: string | null;
  reviewNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  publishedAt?: string | null;
  rejectedAt?: string | null;
  archivedAt?: string | null;
  scheduledPublishAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function getPropertyTitle(
  property: Property,
  locale: string
): string {
  return locale === "ar" ? property.titleAr : property.titleEn;
}

export function getPropertyDescription(
  property: Property,
  locale: string
): string {
  return locale === "ar"
    ? property.descriptionAr
    : property.descriptionEn;
}

export function getPropertyLocation(
  property: Property,
  locale: string
): string {
  return locale === "ar" ? property.locationAr : property.locationEn;
}

export function getPropertyAddress(
  property: Property,
  locale: string
): string {
  return locale === "ar" ? property.addressAr : property.addressEn;
}

export function getPropertyCity(
  property: Property,
  locale: string
): string {
  return locale === "ar" ? property.cityAr : property.cityEn;
}

export function getPropertyImages(property: Property): string[] {
  const mediaImages = (property.media || [])
    .filter((item) => item.type === "image" && item.url.trim())
    .sort((left, right) => {
      if (left.isCover !== right.isCover) return left.isCover ? -1 : 1;
      return left.sortOrder - right.sortOrder;
    })
    .map((item) => item.url.trim());
  if (mediaImages.length) return mediaImages;
  if (!property.images) return [];
  return property.images
    .split(",")
    .map((image) => image.trim())
    .filter(Boolean);
}

export function getPropertyFeatures(property: Property): string[] {
  if (!property.features) return [];
  return property.features
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);
}
