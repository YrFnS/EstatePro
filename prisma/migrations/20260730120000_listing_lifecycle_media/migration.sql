-- Add moderated listing lifecycle, ordered media, and an immutable property audit trail.

ALTER TABLE "Property"
ADD COLUMN "listingStatus" TEXT NOT NULL DEFAULT 'published',
ADD COLUMN "ownerUserId" TEXT,
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "reviewedByUserId" TEXT,
ADD COLUMN "reviewNotes" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "scheduledPublishAt" TIMESTAMP(3);

ALTER TABLE "Property"
ALTER COLUMN "images" SET DEFAULT '',
ALTER COLUMN "features" SET DEFAULT '';

UPDATE "Property"
SET "publishedAt" = COALESCE("publishedAt", "createdAt")
WHERE "listingStatus" = 'published';

-- Link legacy agent listings to a matching account when one exists.
UPDATE "Property" AS property
SET
  "ownerUserId" = account."id",
  "createdByUserId" = account."id"
FROM "Agent" AS agent
JOIN "User" AS account
  ON LOWER(account."email") = LOWER(agent."email")
WHERE property."agentId" = agent."id"
  AND property."ownerUserId" IS NULL;

CREATE TABLE "PropertyMedia" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "storageKey" TEXT,
  "source" TEXT NOT NULL DEFAULT 'external',
  "type" TEXT NOT NULL DEFAULT 'image',
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isCover" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyAuditLog" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorName" TEXT,
  "action" TEXT NOT NULL,
  "previousStatus" TEXT,
  "newStatus" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PropertyAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyMedia_propertyId_storageKey_key"
ON "PropertyMedia"("propertyId", "storageKey");

CREATE INDEX "PropertyMedia_propertyId_sortOrder_idx"
ON "PropertyMedia"("propertyId", "sortOrder");

CREATE INDEX "PropertyMedia_propertyId_isCover_idx"
ON "PropertyMedia"("propertyId", "isCover");

CREATE INDEX "PropertyAuditLog_propertyId_createdAt_idx"
ON "PropertyAuditLog"("propertyId", "createdAt");

CREATE INDEX "PropertyAuditLog_actorUserId_createdAt_idx"
ON "PropertyAuditLog"("actorUserId", "createdAt");

CREATE INDEX "Property_listingStatus_createdAt_idx"
ON "Property"("listingStatus", "createdAt");

CREATE INDEX "Property_ownerUserId_listingStatus_idx"
ON "Property"("ownerUserId", "listingStatus");

CREATE INDEX "Property_scheduledPublishAt_listingStatus_idx"
ON "Property"("scheduledPublishAt", "listingStatus");

ALTER TABLE "Property"
ADD CONSTRAINT "Property_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Property"
ADD CONSTRAINT "Property_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Property"
ADD CONSTRAINT "Property_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PropertyMedia"
ADD CONSTRAINT "PropertyMedia_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyAuditLog"
ADD CONSTRAINT "PropertyAuditLog_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyAuditLog"
ADD CONSTRAINT "PropertyAuditLog_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve legacy comma-separated images as normalized, ordered media records.
INSERT INTO "PropertyMedia" (
  "id",
  "propertyId",
  "url",
  "storageKey",
  "source",
  "type",
  "mimeType",
  "sizeBytes",
  "width",
  "height",
  "sortOrder",
  "isCover",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-' || MD5(property."id" || ':' || TRIM(media."url") || ':' || media."ordinality"::TEXT),
  property."id",
  TRIM(media."url"),
  NULL,
  'external',
  'image',
  NULL,
  NULL,
  NULL,
  NULL,
  (media."ordinality" - 1)::INTEGER,
  media."ordinality" = 1,
  property."createdAt",
  property."updatedAt"
FROM "Property" AS property
CROSS JOIN LATERAL REGEXP_SPLIT_TO_TABLE(
  COALESCE(property."images", ''),
  '[[:space:]]*,[[:space:]]*'
) WITH ORDINALITY AS media("url", "ordinality")
WHERE TRIM(media."url") <> ''
ON CONFLICT DO NOTHING;

INSERT INTO "PropertyAuditLog" (
  "id",
  "propertyId",
  "actorUserId",
  "actorName",
  "action",
  "previousStatus",
  "newStatus",
  "metadata",
  "createdAt"
)
SELECT
  'legacy-' || MD5(property."id" || ':published'),
  property."id",
  property."createdByUserId",
  'Legacy import',
  'listing_imported',
  NULL,
  'published',
  JSONB_BUILD_OBJECT('source', 'legacy_property'),
  property."createdAt"
FROM "Property" AS property
ON CONFLICT DO NOTHING;
