import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  DEFAULT_HEADER_LINKS,
  DEFAULT_SECTIONS,
  DEFAULT_SITE_SETTINGS,
  SITE_SETTINGS_ID,
} from "./seed-data";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function seedHeaderLinks() {
  const count = await prisma.headerLink.count();
  if (count > 0) {
    console.log("Header links already exist, skipping header link seed.");
    return;
  }

  await prisma.headerLink.createMany({ data: DEFAULT_HEADER_LINKS });
  console.log(`Seeded ${DEFAULT_HEADER_LINKS.length} header link(s).`);
}

async function seedSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });

  if (existing) {
    console.log("Site settings already exist, skipping site settings seed.");
    return;
  }

  await prisma.siteSettings.create({
    data: {
      id: SITE_SETTINGS_ID,
      title: DEFAULT_SITE_SETTINGS.title,
      description: DEFAULT_SITE_SETTINGS.description,
      footerText: DEFAULT_SITE_SETTINGS.footerText,
      commentsEnabled: DEFAULT_SITE_SETTINGS.commentsEnabled,
      projectCommentsEnabled: DEFAULT_SITE_SETTINGS.projectCommentsEnabled,
      homeHeaderColor: DEFAULT_SITE_SETTINGS.homeHeaderColor,
      siteTitleColor: DEFAULT_SITE_SETTINGS.siteTitleColor,
    },
  });
  console.log("Seeded site settings.");
}

async function main() {
  const count = await prisma.portfolioSection.count();

  if (count === 0) {
    for (const section of DEFAULT_SECTIONS) {
      await prisma.portfolioSection.create({
        data: {
          slug: section.slug,
          title: section.title,
          description: section.description,
          categories: JSON.stringify(section.categories),
          sortOrder: section.sortOrder,
        },
      });
    }

    console.log(`Seeded ${DEFAULT_SECTIONS.length} portfolio sections.`);
  } else {
    console.log("Portfolio sections already exist, skipping section seed.");
  }

  await seedHeaderLinks();
  await seedSiteSettings();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
