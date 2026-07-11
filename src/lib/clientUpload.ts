export type MediaDraft = {
  id?: string;
  type: "image" | "video";
  url: string;
  caption: string;
};

export async function uploadFile(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/upload", { method: "POST", body });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Upload failed");
  }

  return data.url as string;
}

export async function uploadMediaFiles(
  files: File[],
  type: "image" | "video"
): Promise<MediaDraft[]> {
  return Promise.all(
    files.map(async (file) => ({
      type,
      url: await uploadFile(file),
      caption: "",
    }))
  );
}
