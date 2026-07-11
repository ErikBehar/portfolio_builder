import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "node:stream";
import { uploadUrlToFilePath } from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  const filePath = uploadUrlToFilePath(`/uploads/${filename}`);

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const fileStat = await stat(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return new Response("Not found", { status: 404 });
    }

    throw error;
  }
}
