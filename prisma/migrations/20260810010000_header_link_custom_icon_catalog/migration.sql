-- CreateTable
CREATE TABLE "HeaderLinkCustomIcon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Migrate any existing per-link custom icons into the shared catalog
INSERT INTO "HeaderLinkCustomIcon" ("id", "label", "url", "createdAt", "updatedAt")
SELECT
  lower(hex(randomblob(8))),
  "Custom icon",
  "customIconUrl",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "HeaderLink"
WHERE "customIconUrl" IS NOT NULL AND trim("customIconUrl") != '';

UPDATE "HeaderLink"
SET "icon" = (
  SELECT 'custom:' || "HeaderLinkCustomIcon"."id"
  FROM "HeaderLinkCustomIcon"
  WHERE "HeaderLinkCustomIcon"."url" = "HeaderLink"."customIconUrl"
  LIMIT 1
)
WHERE "customIconUrl" IS NOT NULL AND trim("customIconUrl") != '';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HeaderLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HeaderLink" ("createdAt", "icon", "id", "label", "sortOrder", "updatedAt", "url")
SELECT "createdAt", "icon", "id", "label", "sortOrder", "updatedAt", "url" FROM "HeaderLink";
DROP TABLE "HeaderLink";
ALTER TABLE "new_HeaderLink" RENAME TO "HeaderLink";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
