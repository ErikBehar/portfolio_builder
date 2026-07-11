import { unlink } from "fs/promises";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
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
