-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "footerText" TEXT NOT NULL DEFAULT '',
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "homeHeaderColor" TEXT NOT NULL DEFAULT '#5b9fd4',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("commentsEnabled", "description", "footerText", "id", "title", "updatedAt") SELECT "commentsEnabled", "description", "footerText", "id", "title", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
