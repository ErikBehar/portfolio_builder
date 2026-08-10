-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "headerLinkIconSize" TEXT NOT NULL DEFAULT 'small';

-- AlterTable
ALTER TABLE "HeaderLink" ADD COLUMN "customIconUrl" TEXT;
