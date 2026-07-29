-- Persist account-scoped favorites, comparisons, saved searches, and notifications.

CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserComparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserComparison_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserFavorite_userId_propertyId_key"
ON "UserFavorite"("userId", "propertyId");

CREATE INDEX "UserFavorite_propertyId_idx"
ON "UserFavorite"("propertyId");

CREATE INDEX "UserFavorite_userId_createdAt_idx"
ON "UserFavorite"("userId", "createdAt");

CREATE UNIQUE INDEX "UserComparison_userId_propertyId_key"
ON "UserComparison"("userId", "propertyId");

CREATE UNIQUE INDEX "UserComparison_userId_position_key"
ON "UserComparison"("userId", "position");

CREATE INDEX "UserComparison_propertyId_idx"
ON "UserComparison"("propertyId");

CREATE UNIQUE INDEX "SavedSearch_userId_signature_key"
ON "SavedSearch"("userId", "signature");

CREATE INDEX "SavedSearch_userId_createdAt_idx"
ON "SavedSearch"("userId", "createdAt");

CREATE UNIQUE INDEX "UserNotification_userId_sourceId_key"
ON "UserNotification"("userId", "sourceId");

CREATE INDEX "UserNotification_userId_read_createdAt_idx"
ON "UserNotification"("userId", "read", "createdAt");

ALTER TABLE "UserFavorite"
ADD CONSTRAINT "UserFavorite_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFavorite"
ADD CONSTRAINT "UserFavorite_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserComparison"
ADD CONSTRAINT "UserComparison_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserComparison"
ADD CONSTRAINT "UserComparison_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedSearch"
ADD CONSTRAINT "SavedSearch_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserNotification"
ADD CONSTRAINT "UserNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
