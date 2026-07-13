"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/DatePicker";
import { RichTextFieldHint } from "@/components/RichTextFieldHint";
import { todayInputValue, toDateInputValue } from "@/lib/dates";
import { uploadMediaFiles, type MediaDraft } from "@/lib/clientUpload";
import { setAdminFlash } from "@/lib/adminFlash";
import type { LogEntryWithMedia } from "@/lib/types";

type AdminLogFormProps = {
  entry?: LogEntryWithMedia;
};

export function AdminLogForm({ entry }: AdminLogFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [date, setDate] = useState(
    entry?.date ? toDateInputValue(entry.date) : todayInputValue()
  );
  const [media, setMedia] = useState<MediaDraft[]>(
    entry?.media.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      caption: item.caption ?? "",
    })) ?? []
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleMediaUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setStatus("Uploading media...");

    try {
      const uploaded = await uploadMediaFiles(files, type);
      setMedia((current) => [...current, ...uploaded]);
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Saving log entry...");

    const payload = {
      title,
      content,
      date,
      media: media.filter((item) => item.url),
    };

    const response = await fetch(
      entry ? `/api/log/${entry.id}` : "/api/log",
      {
        method: entry ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error ?? "Failed to save log entry");
      return;
    }

    setAdminFlash(entry ? "Log entry updated." : "Log entry created.");
    router.push("/admin/log");
    router.refresh();
  }

  async function handleDelete() {
    if (!entry) return;
    if (!window.confirm("Delete this log entry and all its comments?")) return;

    const response = await fetch(`/api/log/${entry.id}`, { method: "DELETE" });

    if (!response.ok) {
      const data = await response.json();
      setStatus(data.error ?? "Failed to delete log entry");
      return;
    }

    setAdminFlash("Log entry deleted.");
    router.push("/admin/log");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Title</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="June 2026"
          />
        </label>

        <DatePicker
          label="Date"
          value={date}
          onChange={setDate}
          required
        />
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Content</span>
        <textarea
          required
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={12}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
          placeholder="Write your log entry..."
        />
        <RichTextFieldHint />
      </label>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Media carousel</h3>

        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm hover:border-accent">
            Upload images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => handleMediaUpload(event, "image")}
            />
          </label>
          <label className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm hover:border-accent">
            Upload videos
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(event) => handleMediaUpload(event, "video")}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              setMedia((current) => [
                ...current,
                { type: "video", url: "", caption: "" },
              ])
            }
            className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
          >
            + External video URL
          </button>
        </div>

        {media.map((item, index) => (
          <div
            key={item.id ?? index}
            className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[120px_1fr_auto]"
          >
            <div className="aspect-video overflow-hidden rounded-lg bg-surface-elevated">
              {item.url ? (
                item.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted">
                  No preview
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                value={item.url}
                onChange={(event) =>
                  setMedia((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, url: event.target.value }
                        : entry
                    )
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Media URL"
              />
              <input
                value={item.caption}
                onChange={(event) =>
                  setMedia((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index
                        ? { ...entry, caption: event.target.value }
                        : entry
                    )
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Caption (optional)"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setMedia((current) => current.filter((_, entryIndex) => entryIndex !== index))
              }
              className="self-start text-sm text-red-400"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {status && <p className="text-sm text-muted">{status}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {entry ? "Update entry" : "Create entry"}
        </button>
        {entry && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-400/40 px-5 py-2.5 text-sm text-red-400"
          >
            Delete entry
          </button>
        )}
      </div>
    </form>
  );
}
