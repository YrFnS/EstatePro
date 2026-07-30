/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test";
import {
  canAdminTransition,
  canOwnerArchive,
  canOwnerEdit,
  canOwnerSubmit,
  canOwnerWithdraw,
  listingCompletionPercentage,
  mediaImageSnapshot,
  normalizeListingStatus,
  scheduledPublicationStatus,
  validateListingForSubmission,
} from "./listing-lifecycle";
import { validateUpload } from "./object-storage";

const completeListing = {
  titleEn: "Modern family villa",
  titleAr: "فيلا عائلية حديثة",
  descriptionEn:
    "A bright family villa with generous living spaces, secure parking, and a landscaped garden.",
  descriptionAr:
    "فيلا عائلية مشرقة تضم مساحات معيشة واسعة وموقفاً آمناً وحديقة منسقة وجميلة.",
  price: 450000,
  type: "villa",
  status: "sale",
  bedrooms: 4,
  bathrooms: 3,
  area: 3200,
  locationEn: "West End",
  locationAr: "المنطقة الغربية",
  addressEn: "10 Garden Street",
  addressAr: "10 شارع الحدائق",
  cityEn: "Baghdad",
  cityAr: "بغداد",
  imageCount: 3,
};

describe("listing owner workflow", () => {
  test("limits edits and submission to safe states", () => {
    expect(canOwnerEdit("draft")).toBe(true);
    expect(canOwnerEdit("changes_requested")).toBe(true);
    expect(canOwnerEdit("published")).toBe(false);
    expect(canOwnerSubmit("rejected")).toBe(true);
    expect(canOwnerSubmit("pending_review")).toBe(false);
    expect(canOwnerWithdraw("pending_review")).toBe(true);
    expect(canOwnerArchive("published")).toBe(true);
    expect(canOwnerArchive("scheduled")).toBe(false);
  });

  test("normalizes invalid legacy states to draft", () => {
    expect(normalizeListingStatus("published")).toBe("published");
    expect(normalizeListingStatus("unknown")).toBe("draft");
  });
});

describe("administrator transitions", () => {
  test("supports review, scheduling, publication, and archival", () => {
    expect(canAdminTransition("pending_review", "published")).toBe(true);
    expect(canAdminTransition("pending_review", "scheduled")).toBe(true);
    expect(canAdminTransition("pending_review", "changes_requested")).toBe(true);
    expect(canAdminTransition("scheduled", "published")).toBe(true);
    expect(canAdminTransition("published", "archived")).toBe(true);
    expect(canAdminTransition("draft", "rejected")).toBe(false);
  });
});

describe("listing readiness", () => {
  test("accepts a complete bilingual listing with an image", () => {
    expect(validateListingForSubmission(completeListing)).toEqual([]);
    expect(listingCompletionPercentage(completeListing)).toBe(100);
  });

  test("reports missing content and media", () => {
    const issues = validateListingForSubmission({
      ...completeListing,
      titleAr: "",
      descriptionEn: "Short",
      price: 0,
      imageCount: 0,
    });
    expect(issues.map((issue) => issue.field)).toContain("titleAr");
    expect(issues.map((issue) => issue.field)).toContain("descriptionEn");
    expect(issues.map((issue) => issue.field)).toContain("price");
    expect(issues.map((issue) => issue.field)).toContain("media");
    expect(
      listingCompletionPercentage({
        ...completeListing,
        titleAr: "",
        imageCount: 0,
      })
    ).toBeLessThan(100);
  });
});

describe("property media", () => {
  test("places the cover image first and ignores non-image media", () => {
    expect(
      mediaImageSnapshot([
        {
          url: "https://cdn.example/second.jpg",
          type: "image",
          sortOrder: 1,
          isCover: false,
        },
        {
          url: "https://cdn.example/tour.mp4",
          type: "video",
          sortOrder: 0,
          isCover: false,
        },
        {
          url: "https://cdn.example/cover.jpg",
          type: "image",
          sortOrder: 8,
          isCover: true,
        },
      ])
    ).toBe(
      "https://cdn.example/cover.jpg,https://cdn.example/second.jpg"
    );
  });

  test("enforces upload type and size limits", () => {
    expect(validateUpload("image/webp", 1024).type).toBe("image");
    expect(validateUpload("video/mp4", 1024).type).toBe("video");
    expect(() => validateUpload("text/html", 1024)).toThrow();
    expect(() =>
      validateUpload("image/jpeg", 20 * 1024 * 1024)
    ).toThrow();
  });
});

describe("scheduled publication", () => {
  test("distinguishes future schedules from immediate publication", () => {
    const now = new Date("2026-07-30T12:00:00.000Z");
    expect(
      scheduledPublicationStatus(
        new Date("2026-07-30T13:00:00.000Z"),
        now
      )
    ).toBe("scheduled");
    expect(
      scheduledPublicationStatus(
        new Date("2026-07-30T11:00:00.000Z"),
        now
      )
    ).toBe("published");
  });
});
