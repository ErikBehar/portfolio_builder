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
    "commentsVisible" BOOLEAN NOT NULL DEFAULT true,
    "projectCommentsVisible" BOOLEAN NOT NULL DEFAULT true,
    "homeHeaderColor" TEXT NOT NULL DEFAULT '#5b9fd4',
    "siteTitleColor" TEXT NOT NULL DEFAULT '#e8edf5',
    "adminSessionVersion" INTEGER NOT NULL DEFAULT 1,
    "homeLayout" TEXT NOT NULL DEFAULT '{"sections":[{"id":"log","visible":true},{"id":"featured","visible":true},{"id":"projects","visible":true},{"id":"timeline","visible":true}],"timelineMode":"link"}',
    "themeColors" TEXT NOT NULL DEFAULT '{"background":"#0c0f14","foreground":"#e8edf5","surface":"#12161d","surfaceElevated":"#1a1f28","border":"#2a3140","muted":"#8b95a8","accent":"#5b9fd4","accentForeground":"#0c0f14"}',
    "linkPulsingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("adminSessionVersion", "commentsEnabled", "commentsVisible", "description", "footerText", "homeHeaderColor", "homeLayout", "id", "projectCommentsEnabled", "projectCommentsVisible", "siteTitleColor", "themeColors", "title", "updatedAt") SELECT "adminSessionVersion", "commentsEnabled", "commentsVisible", "description", "footerText", "homeHeaderColor", "homeLayout", "id", "projectCommentsEnabled", "projectCommentsVisible", "siteTitleColor", "themeColors", "title", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
