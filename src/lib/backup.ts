import { ZipArchive } from "archiver";
import Database from "better-sqlite3";
import { existsSync } from "fs";
import path from "path";
import { Readable } from "node:stream";
import { ApiError } from "@/lib/apiErrors";
import { UPLOAD_DIR } from "@/lib/uploads";

export function resolveDatabasePath(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!url.startsWith("file:")) {
    throw new ApiError("Backup is only supported for SQLite databases", 400);
  }

  let filePath = url.slice("file:".length);
  if (process.platform === "win32" && /^\/[A-Za-z]:/.test(filePath)) {
    filePath = filePath.slice(1);
  }

  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(process.cwd(), filePath);
  }

  return filePath;
}

function checkpointDatabase(dbPath: string) {
  const db = new Database(dbPath, { readonly: true });
  try {
    db.pragma("wal_checkpoint(TRUNCATE)");
  } finally {
    db.close();
  }
}

export function createBackupFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `portfolio-backup-${timestamp}.zip`;
}

export function createBackupStream(): {
  stream: ReadableStream<Uint8Array>;
  filename: string;
} {
  const dbPath = resolveDatabasePath();

  if (!existsSync(dbPath)) {
    throw new ApiError("Database file not found", 404);
  }

  checkpointDatabase(dbPath);

  const filename = createBackupFilename();
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const stream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;

  archive.on("error", (error) => {
    archive.destroy(error);
  });

  const dbName = path.basename(dbPath);
  archive.file(dbPath, { name: `database/${dbName}` });

  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  if (existsSync(walPath)) {
    archive.file(walPath, { name: `database/${dbName}-wal` });
  }
  if (existsSync(shmPath)) {
    archive.file(shmPath, { name: `database/${dbName}-shm` });
  }

  if (existsSync(UPLOAD_DIR)) {
    archive.directory(UPLOAD_DIR, "uploads");
  }

  void archive.finalize();

  return { stream, filename };
}
