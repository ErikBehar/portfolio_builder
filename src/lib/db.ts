import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const PRISMA_SCHEMA_VERSION = 13;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion?: number;
};

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });

  return new PrismaClient({ adapter });
}

function isValidPrismaClient(client: PrismaClient | undefined): boolean {
  return Boolean(
    client &&
      "logEntry" in client &&
      "project" in client &&
      "portfolioSection" in client &&
      "headerLink" in client &&
      "siteSettings" in client &&
      "label" in client &&
      globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION
  );
}

function getPrismaClient(): PrismaClient {
  const existingClient = globalForPrisma.prisma;

  if (isValidPrismaClient(existingClient)) {
    return existingClient!;
  }

  if (existingClient) {
    void existingClient.$disconnect();
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  return client;
}

export const prisma = getPrismaClient();
