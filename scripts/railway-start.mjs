import { execSync, spawnSync } from "node:child_process";
import { lstat, mkdir, rm, symlink } from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve(process.env.DATA_DIR || "/data");
const uploadStore = path.join(dataDir, "uploads");
const publicDir = path.join(process.cwd(), "public");
const uploadLink = path.join(publicDir, "uploads");

async function ensureUploadSymlink() {
  await mkdir(dataDir, { recursive: true });
  await mkdir(uploadStore, { recursive: true });
  await mkdir(publicDir, { recursive: true });

  try {
    const stat = await lstat(uploadLink);
    if (stat.isSymbolicLink()) {
      return;
    }

    if (stat.isDirectory()) {
      await rm(uploadLink, { recursive: true, force: true });
    }
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;

    if (code !== "ENOENT") {
      throw error;
    }
  }

  await symlink(uploadStore, uploadLink, "dir");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(dataDir, "prod.db")}`;
}

console.log(`DATA_DIR=${dataDir}`);
console.log(`DATABASE_URL=${process.env.DATABASE_URL}`);
console.log(`UPLOAD_STORE=${uploadStore}`);

await ensureUploadSymlink();

run("npx", ["prisma", "migrate", "deploy"]);

if (process.env.RAILWAY_RUN_SEED === "true") {
  run("npm", ["run", "db:seed"]);
}

console.log("Starting production server...");
execSync("npm start", { stdio: "inherit", env: process.env });
