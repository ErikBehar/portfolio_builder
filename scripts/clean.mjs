import { rmSync, unlinkSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const dirs = [".next", "out", "build", "dist", "src/generated", ".turbo", ".vercel"];
const filePatterns = [/\.tsbuildinfo$/, /\.log$/, /\.db-journal$/, /\.db-wal$/, /\.db-shm$/];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walk(path, files);
    } else {
      files.push(path);
    }
  }
  return files;
}

for (const dir of dirs) {
  const path = join(root, dir);
  try {
    rmSync(path, { recursive: true, force: true });
    console.log(`removed ${dir}/`);
  } catch {
    // already absent
  }
}

for (const file of walk(root)) {
  const relative = file.slice(root.length + 1).replaceAll("\\", "/");
  if (filePatterns.some((pattern) => pattern.test(relative))) {
    try {
      unlinkSync(file);
      console.log(`removed ${relative}`);
    } catch {
      // ignore
    }
  }
}

console.log("clean complete");
