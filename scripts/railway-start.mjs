import { execSync, spawnSync } from "node:child_process";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve(process.env.DATA_DIR || "/data");
const uploadStore = path.join(dataDir, "uploads");

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

await mkdir(dataDir, { recursive: true });
await mkdir(uploadStore, { recursive: true });

let uploadCount = 0;
try {
  uploadCount = (await readdir(uploadStore)).length;
} catch {
  uploadCount = 0;
}

console.log(`DATA_DIR=${dataDir}`);
console.log(`DATABASE_URL=${process.env.DATABASE_URL}`);
console.log(`UPLOAD_DIR=${uploadStore}`);
console.log(`UPLOAD_FILE_COUNT=${uploadCount}`);

run("npx", ["prisma", "migrate", "deploy"]);

if (process.env.RAILWAY_RUN_SEED === "true") {
  run("npm", ["run", "db:seed"]);
}

console.log("Starting production server...");
execSync("npm start", { stdio: "inherit", env: process.env });
