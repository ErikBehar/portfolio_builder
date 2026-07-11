import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { DEFAULT_HEADER_LINKS } from "../src/lib/headerLinks";
import {
  DEFAULT_SITE_SETTINGS,
  SITE_SETTINGS_ID,
} from "../src/lib/siteSettings";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_SECTIONS = [
  {
    slug: "code",
    title: "Code",
    description: "Code samples, repositories, and technical work.",
    categories: [],
    sortOrder: 0,
  },
  {
    slug: "video-games",
    title: "Video Games",
    description: "Professional releases, personal projects, and game jam work.",
    categories: [
      { slug: "professional", title: "Professional" },
      { slug: "personal", title: "Personal Projects" },
      { slug: "jam", title: "Game Jams" },
    ],
    sortOrder: 1,
  },
  {
    slug: "design",
    title: "Design",
    description: "Game design, level design, and app flow documentation.",
    categories: [],
    sortOrder: 2,
  },
  {
    slug: "writing",
    title: "Writing",
    description: "Scripts, screenplays, and writing samples.",
    categories: [],
    sortOrder: 3,
  },
  {
    slug: "visual-novels",
    title: "Visual Novels",
    description: "Visual novel projects and related work.",
    categories: [],
    sortOrder: 4,
  },
  {
    slug: "animation",
    title: "Animation",
    description: "Animation work, shorts, and motion design.",
    categories: [],
    sortOrder: 5,
  },
];

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
