-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "section" TEXT NOT NULL,
    "category" TEXT,
    "links" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "coverMediaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("category", "createdAt", "description", "id", "links", "section", "slug", "sortOrder", "title", "updatedAt") SELECT "category", "createdAt", "description", "id", "links", "section", "slug", "sortOrder", "title", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_section_idx" ON "Project"("section");
CREATE UNIQUE INDEX "Project_section_slug_key" ON "Project"("section", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
