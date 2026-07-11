-- CreateTable
CREATE TABLE "ProjectComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectComment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "footerText" TEXT NOT NULL DEFAULT '',
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "projectCommentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "homeHeaderColor" TEXT NOT NULL DEFAULT '#5b9fd4',
    "siteTitleColor" TEXT NOT NULL DEFAULT '#e8edf5',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("commentsEnabled", "description", "footerText", "homeHeaderColor", "id", "siteTitleColor", "title", "updatedAt") SELECT "commentsEnabled", "description", "footerText", "homeHeaderColor", "id", "siteTitleColor", "title", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProjectComment_projectId_idx" ON "ProjectComment"("projectId");
