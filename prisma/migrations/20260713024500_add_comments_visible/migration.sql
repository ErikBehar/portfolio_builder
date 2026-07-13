-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "commentsVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SiteSettings" ADD COLUMN "projectCommentsVisible" BOOLEAN NOT NULL DEFAULT true;
