import { z } from "zod";
import { LISTING_STATUSES } from "@/lib/listing-lifecycle";

const shortText = (maximum: number) =>
  z.string().trim().max(maximum).default("");

const nullableUrl = z
  .string()
  .trim()
  .max(2_000)
  .nullable()
  .optional();

export const propertyDraftSchema = z.object({
  titleEn: shortText(160),
  titleAr: shortText(160),
  descriptionEn: shortText(10_000),
  descriptionAr: shortText(10_000),
  price: z.number().finite().min(0).max(1_000_000_000_000).default(0),
  type: shortText(50),
  status: z.enum(["sale", "rent"]).default("sale"),
  bedrooms: z.number().int().min(0).max(100).default(0),
  bathrooms: z.number().int().min(0).max(100).default(0),
  area: z.number().finite().min(0).max(100_000_000).default(0),
  locationEn: shortText(300),
  locationAr: shortText(300),
  addressEn: shortText(500),
  addressAr: shortText(500),
  cityEn: shortText(120),
  cityAr: shortText(120),
  features: z.string().trim().max(20_000).default(""),
  yearBuilt: z
    .number()
    .int()
    .min(1000)
    .max(3000)
    .nullable()
    .optional(),
  parking: z.number().int().min(0).max(100).default(0),
  lat: z.number().finite().min(-90).max(90).nullable().optional(),
  lng: z.number().finite().min(-180).max(180).nullable().optional(),
  virtualTourUrl: nullableUrl,
  virtualTourImages: z.string().trim().max(50_000).nullable().optional(),
});

export const accountListingCreateSchema = z.object({
  listing: propertyDraftSchema,
  action: z.enum(["save_draft", "submit"]).default("save_draft"),
  externalMediaUrls: z
    .array(z.string().trim().url().max(2_000))
    .max(30)
    .optional()
    .default([]),
});

export const accountListingUpdateSchema = z.object({
  listing: propertyDraftSchema,
});

export const adminListingInputSchema = propertyDraftSchema.extend({
  images: z.string().trim().max(50_000).optional().default(""),
  featured: z.boolean().optional().default(false),
  badge: z.string().trim().max(30).nullable().optional(),
  agentId: z.string().trim().min(1).nullable().optional(),
  ownerUserId: z.string().trim().min(1).nullable().optional(),
  listingStatus: z.enum(LISTING_STATUSES).optional(),
  reviewNotes: z.string().trim().max(5_000).nullable().optional(),
  scheduledPublishAt: z.coerce.date().nullable().optional(),
});

export type PropertyDraftInput = z.infer<typeof propertyDraftSchema>;
export type AdminListingInput = z.infer<typeof adminListingInputSchema>;

export function propertyDraftData(input: PropertyDraftInput) {
  return {
    titleEn: input.titleEn,
    titleAr: input.titleAr,
    descriptionEn: input.descriptionEn,
    descriptionAr: input.descriptionAr,
    price: input.price,
    type: input.type,
    status: input.status,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area: input.area,
    locationEn: input.locationEn,
    locationAr: input.locationAr,
    addressEn: input.addressEn,
    addressAr: input.addressAr,
    cityEn: input.cityEn,
    cityAr: input.cityAr,
    features: input.features,
    yearBuilt: input.yearBuilt ?? null,
    parking: input.parking,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    virtualTourUrl: input.virtualTourUrl || null,
    virtualTourImages: input.virtualTourImages || null,
  };
}
