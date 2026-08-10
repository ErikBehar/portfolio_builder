"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeaderLinkIcon } from "@/components/HeaderLinkIcon";
import { uploadFile } from "@/lib/clientUpload";
import {
  HEADER_LINK_ICONS,
  type HeaderLinkIconSlug,
} from "@/lib/headerLinkIcons";
import { setAdminFlash } from "@/lib/adminFlash";
import type { HeaderLink } from "@/lib/headerLinks";

type AdminHeaderLinkFormProps = {
  link?: HeaderLink;
};

export function AdminHeaderLinkForm({ link }: AdminHeaderLinkFormProps) {
  const router = useRouter();
  const [label, setLabel] = useState(link?.label ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [icon, setIcon] = useState<HeaderLinkIconSlug>(link?.icon ?? "link");
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(
    link?.customIconUrl ?? null
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleCustomIconChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Custom icon must be an image file");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading icon...");

    try {
      const uploadedUrl = await uploadFile(file);
      setCustomIconUrl(uploadedUrl);
      setStatus("Custom icon ready. Save the link to apply it.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to upload icon"
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Saving header link...");

    const response = await fetch(
      link ? `/api/header-links/${link.id}` : "/api/header-links",
      {
        method: link ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url, icon, customIconUrl }),
      }
    );

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error ?? "Failed to save header link");
      return;
    }

    setAdminFlash(link ? "Header link updated." : "Header link created.");
    router.push("/admin/header-links");
    router.refresh();
  }

  async function handleDelete() {
    if (!link) return;
    if (!window.confirm(`Delete header link "${link.label}"?`)) return;

    const response = await fetch(`/api/header-links/${link.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Failed to delete header link");
      return;
    }

    setAdminFlash("Header link deleted.");
    router.push("/admin/header-links");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Button label</span>
        <input
          required
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="GitHub"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">URL</span>
        <input
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="https://github.com/username or mailto:you@example.com"
        />
        <span className="text-xs text-muted">
          Use mailto: for email, https:// for external links, or / for internal paths.
        </span>
      </label>

      <label className="block max-w-xs space-y-2">
        <span className="text-sm font-medium">Built-in icon</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-md border border-border bg-surface-elevated p-2 text-foreground">
            <HeaderLinkIcon
              icon={icon}
              customIconUrl={customIconUrl}
              className="h-8 w-8"
            />
          </span>
          <select
            value={icon}
            onChange={(event) =>
              setIcon(event.target.value as HeaderLinkIconSlug)
            }
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            disabled={Boolean(customIconUrl)}
          >
            {HEADER_LINK_ICONS.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
        {customIconUrl && (
          <span className="text-xs text-muted">
            Built-in icon is unused while a custom image is set.
          </span>
        )}
      </label>

      <div className="space-y-3 rounded-xl border border-border bg-surface px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Custom icon image</p>
          <p className="text-sm text-muted">
            Upload a PNG, SVG, or other image to use instead of the built-in icon.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-accent">
            {isUploading ? "Uploading..." : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading || isSubmitting}
              onChange={handleCustomIconChange}
            />
          </label>
          {customIconUrl && (
            <button
              type="button"
              onClick={() => setCustomIconUrl(null)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              Remove custom icon
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted">
        To change the order of header buttons, drag them on the{" "}
        <Link href="/admin/header-links" className="text-accent hover:underline">
          header links
        </Link>{" "}
        list. Icon size is also set there.
      </p>

      {status && <p className="text-sm text-muted">{status}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {link ? "Update link" : "Create link"}
        </button>
        {link && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-400/40 px-5 py-2.5 text-sm text-red-400"
          >
            Delete link
          </button>
        )}
      </div>
    </form>
  );
}
