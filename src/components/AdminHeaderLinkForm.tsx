"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeaderLinkIcon } from "@/components/HeaderLinkIcon";
import {
  HEADER_LINK_ICONS,
  type HeaderLinkIconSlug,
} from "@/lib/headerLinkIcons";
import type { HeaderLink } from "@/lib/headerLinks";

type AdminHeaderLinkFormProps = {
  link?: HeaderLink;
};

export function AdminHeaderLinkForm({ link }: AdminHeaderLinkFormProps) {
  const router = useRouter();
  const [label, setLabel] = useState(link?.label ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [icon, setIcon] = useState<HeaderLinkIconSlug>(link?.icon ?? "link");
  const [sortOrder, setSortOrder] = useState(link?.sortOrder ?? 0);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Saving header link...");

    const response = await fetch(
      link ? `/api/header-links/${link.id}` : "/api/header-links",
      {
        method: link ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url, icon, sortOrder }),
      }
    );

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error ?? "Failed to save header link");
      return;
    }

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
        <span className="text-sm font-medium">Icon</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-md border border-border bg-surface-elevated p-2 text-foreground">
            <HeaderLinkIcon icon={icon} />
          </span>
          <select
            value={icon}
            onChange={(event) => setIcon(event.target.value as HeaderLinkIconSlug)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          >
            {HEADER_LINK_ICONS.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      </label>

      <label className="block max-w-xs space-y-2">
        <span className="text-sm font-medium">Sort order</span>
        <input
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(Number(event.target.value))}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
        />
        <span className="text-xs text-muted">Lower numbers appear first in the header.</span>
      </label>

      {status && <p className="text-sm text-muted">{status}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
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
