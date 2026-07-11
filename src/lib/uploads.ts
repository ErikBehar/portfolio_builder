import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { ApiError } from "@/lib/apiErrors";

export function resolveUploadDir(): string {
  const dataDir = process.env.DATA_DIR?.trim();
  if (dataDir) {
    return path.join(path.resolve(dataDir), "uploads");
  }

  return path.join(process.cwd(), "public", "uploads");
}

export const UPLOAD_DIR = resolveUploadDir();
const UPLOAD_URL_PREFIX = "/uploads/";

export function isManagedUploadUrl(url: string): boolean {
  if (!url) return false;

  const pathname = url.startsWith("http")
    ? (() => {
        try {
          return new URL(url).pathname;
        } catch {
          return url;
        }
      })()
    : url;

  return pathname.startsWith(UPLOAD_URL_PREFIX) && !pathname.includes("..");
}

export function uploadUrlToFilePath(url: string): string | null {
  if (!isManagedUploadUrl(url)) return null;

  let pathname = url;
  if (url.startsWith("http")) {
    try {
      pathname = new URL(url).pathname;
    } catch {
      return null;
    }
  }

  const filename = pathname.slice(UPLOAD_URL_PREFIX.length);

  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return null;
  }

  const filePath = path.resolve(UPLOAD_DIR, filename);
  const uploadRoot = path.resolve(UPLOAD_DIR);

  if (filePath !== uploadRoot && !filePath.startsWith(`${uploadRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
}

export async function deleteUploadFile(url: string): Promise<void> {
  const filePath = uploadUrlToFilePath(url);
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      throw error;
    }
  }
}

export async function deleteUploadFiles(urls: string[]): Promise<void> {
  const uniqueUrls = [...new Set(urls.filter(isManagedUploadUrl))];
  await Promise.all(uniqueUrls.map(deleteUploadFile));
}

export function getRemovedUploadUrls(
  previousUrls: string[],
  nextUrls: string[]
): string[] {
  const nextSet = new Set(nextUrls);
  return [...new Set(previousUrls)].filter(
    (url) => isManagedUploadUrl(url) && !nextSet.has(url)
  );
}

export async function deleteRemovedUploads(
  previousUrls: string[],
  nextUrls: string[]
): Promise<void> {
  await deleteUploadFiles(getRemovedUploadUrls(previousUrls, nextUrls));
}

export async function saveUploadedFile(file: File) {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new ApiError("Only image and video files are supported", 400);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = path.extname(file.name) || (isImage ? ".jpg" : ".mp4");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return {
    url: `/uploads/${filename}`,
    type: isImage ? "image" : "video",
  } as const;
}
