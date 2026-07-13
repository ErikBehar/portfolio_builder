-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VisitorDay" (
    "visitorId" TEXT NOT NULL,
    "date" TEXT NOT NULL,

    PRIMARY KEY ("visitorId", "date")
);

-- CreateTable
CREATE TABLE "PageViewDaily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "resourceSlug" TEXT,
    "sectionSlug" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "PageViewVisitorDay" (
    "visitorId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    PRIMARY KEY ("visitorId", "date", "path")
);

-- CreateTable
CREATE TABLE "ReferrerDaily" (
    "date" TEXT NOT NULL,
    "referrer" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "LinkClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "contextId" TEXT,
    "label" TEXT,
    "visitorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "VisitorDay_date_idx" ON "VisitorDay"("date");

-- CreateIndex
CREATE INDEX "PageViewDaily_pageType_date_idx" ON "PageViewDaily"("pageType", "date");

-- CreateIndex
CREATE INDEX "PageViewDaily_resourceSlug_date_idx" ON "PageViewDaily"("resourceSlug", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PageViewDaily_date_path_key" ON "PageViewDaily"("date", "path");

-- CreateIndex
CREATE INDEX "ReferrerDaily_date_idx" ON "ReferrerDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ReferrerDaily_date_referrer_key" ON "ReferrerDaily"("date", "referrer");

-- CreateIndex
CREATE INDEX "LinkClick_source_createdAt_idx" ON "LinkClick"("source", "createdAt");

-- CreateIndex
CREATE INDEX "LinkClick_url_createdAt_idx" ON "LinkClick"("url", "createdAt");
