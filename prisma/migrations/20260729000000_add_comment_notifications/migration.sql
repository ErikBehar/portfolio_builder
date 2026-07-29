-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "commentEmailNotify" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "commentNotifyEmail" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "seenAt" DATETIME;
CREATE INDEX "Comment_seenAt_idx" ON "Comment"("seenAt");

-- AlterTable
ALTER TABLE "ProjectComment" ADD COLUMN "seenAt" DATETIME;
CREATE INDEX "ProjectComment_seenAt_idx" ON "ProjectComment"("seenAt");

-- Treat existing comments as already seen so the inbox only flags new ones
UPDATE "Comment" SET "seenAt" = "createdAt" WHERE "seenAt" IS NULL;
UPDATE "ProjectComment" SET "seenAt" = "createdAt" WHERE "seenAt" IS NULL;
