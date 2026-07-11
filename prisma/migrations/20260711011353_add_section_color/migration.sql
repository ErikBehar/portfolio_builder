-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PortfolioSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#5b9fd4',
    "categories" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PortfolioSection" ("categories", "createdAt", "description", "id", "slug", "sortOrder", "title", "updatedAt") SELECT "categories", "createdAt", "description", "id", "slug", "sortOrder", "title", "updatedAt" FROM "PortfolioSection";
DROP TABLE "PortfolioSection";
ALTER TABLE "new_PortfolioSection" RENAME TO "PortfolioSection";
CREATE UNIQUE INDEX "PortfolioSection_slug_key" ON "PortfolioSection"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
