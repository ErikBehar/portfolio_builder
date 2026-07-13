-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "homeLayout" TEXT NOT NULL DEFAULT '{"sections":[{"id":"log","visible":true},{"id":"featured","visible":true},{"id":"projects","visible":true},{"id":"timeline","visible":true}],"timelineMode":"link"}';
