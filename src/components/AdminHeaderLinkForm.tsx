"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeaderLinkIcon } from "@/components/HeaderLinkIcon";
import { uploadFile } from "@/lib/clientUpload";
import { HEADER_LINK_ICONS } from "@/lib/headerLinkIcons";
import { setAdminFlash } from "@/lib/adminFlash";
import type { HeaderLink, HeaderLinkCustomIcon } from "@/lib/headerLinks";

type AdminHeaderLinkFormProps = {
  link?: HeaderLink;
  customIcons?: HeaderLinkCustomIcon[];
};

export function AdminHeaderLinkForm({
  link,
  customIcons: initialCustomIcons = [],
}: AdminHeaderLinkFormProps) {
  const router = useRouter();
  const [label, setLabel] = useState(link?.label ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [icon, setIcon] = useState(link?.icon ?? "link");
  const [customIcons, setCustomIcons] = useState(initialCustomIcons);
  const [customLabel, setCustomLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedCustomIcon = useMemo(
    () => customIcons.find((entry) => entry.value === icon) ?? null,
    [customIcons, icon]
  );

  async function handleAddCustomIcon(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("New icons must be image files");
      return;
    }

    setIsUploading(true);
    setStatus("Uploading new icon...");

    try {
      const uploadedUrl = await uploadFile(file);
      const response = await fetch("/api/header-links/custom-icons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: uploadedUrl,
          label: customLabel.trim() || file.name.replace(/\.[^.]+$/, "") || "Custom icon",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error ?? "Failed to add custom icon");
        return;
      }

      setCustomIcons((current) => [...current, data]);
      setIcon(data.value);
      setCustomLabel("");
      setStatus("New icon added to the list and selected.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Failed to upload icon"
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteCustomIcon(customIcon: HeaderLinkCustomIcon) {
    if (
      !window.confirm(
        `Remove custom icon "${customIcon.label}" from the icon list?`
      )
    ) {
      return;
    }

    const response = await fetch(
      `/api/header-links/custom-icons/${customIcon.id}`,
      { method: "DELETE" }
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setStatus(data?.error ?? "Failed to delete custom icon");
      return;
    }

    setCustomIcons((current) =>
      current.filter((entry) => entry.id !== customIcon.id)
    );
    if (icon === customIcon.value) {
      setIcon("link");
    }
    setStatus("Custom icon removed from the list.");
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
        body: JSON.stringify({ label, url, icon }),
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

      <label className="block max-w-md space-y-2">
        <span className="text-sm font-medium">Icon</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-md border border-border bg-surface-elevated p-2 text-foreground">
            <HeaderLinkIcon
              icon={icon}
              iconImageUrl={selectedCustomIcon?.url ?? null}
              className="h-8 w-8"
            />
          </span>
          <select
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          >
            <optgroup label="Built-in icons">
              {HEADER_LINK_ICONS.map((entry) => (
                <option key={entry.slug} value={entry.slug}>
                  {entry.label}
                </option>
              ))}
            </optgroup>
            {customIcons.length > 0 && (
              <optgroup label="Uploaded icons">
                {customIcons.map((entry) => (
                  <option key={entry.id} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
        <span className="text-xs text-muted">
          Choose one icon for this link from the built-in set or your uploaded
          icons.
        </span>
      </label>

      <div className="space-y-3 rounded-xl border border-border bg-surface px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Add a new icon</p>
          <p className="text-sm text-muted">
            Upload an image to add it as another option in the icon dropdown
            above. Built-in icons stay available.
          </p>
        </div>
        <label className="block max-w-sm space-y-2">
          <span className="text-sm font-medium">Name for new icon</span>
          <input
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="My logo"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-accent">
            {isUploading ? "Uploading..." : "Upload new icon"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading || isSubmitting}
              onChange={handleAddCustomIcon}
            />
          </label>
        </div>
        {customIcons.length > 0 && (
          <ul className="space-y-2 border-t border-border pt-3">
            {customIcons.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <HeaderLinkIcon
                    icon={entry.value}
                    iconImageUrl={entry.url}
                    className="h-5 w-5"
                  />
                  <span className="truncate">{entry.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomIcon(entry)}
                  className="shrink-0 text-muted hover:text-red-400"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
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
