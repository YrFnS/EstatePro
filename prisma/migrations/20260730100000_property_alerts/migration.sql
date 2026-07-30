-- Persist scheduled property alerts, deduplicated matches, and delivery state.

CREATE TABLE "PropertyAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "savedSearchId" TEXT,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "currentMatchCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "lastMatchedAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyAlertMatch" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyAlertMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyAlert_savedSearchId_key"
ON "PropertyAlert"("savedSearchId");

CREATE UNIQUE INDEX "PropertyAlert_userId_signature_key"
ON "PropertyAlert"("userId", "signature");

CREATE INDEX "PropertyAlert_userId_createdAt_idx"
ON "PropertyAlert"("userId", "createdAt");

CREATE INDEX "PropertyAlert_enabled_nextRunAt_idx"
ON "PropertyAlert"("enabled", "nextRunAt");

CREATE UNIQUE INDEX "PropertyAlertMatch_alertId_propertyId_key"
ON "PropertyAlertMatch"("alertId", "propertyId");

CREATE INDEX "PropertyAlertMatch_propertyId_idx"
ON "PropertyAlertMatch"("propertyId");

CREATE INDEX "PropertyAlertMatch_alertId_matchedAt_idx"
ON "PropertyAlertMatch"("alertId", "matchedAt");

ALTER TABLE "PropertyAlert"
ADD CONSTRAINT "PropertyAlert_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyAlertMatch"
ADD CONSTRAINT "PropertyAlertMatch_alertId_fkey"
FOREIGN KEY ("alertId") REFERENCES "PropertyAlert"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyAlertMatch"
ADD CONSTRAINT "PropertyAlertMatch_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyAlert"
ADD CONSTRAINT "PropertyAlert_savedSearchId_fkey"
FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
