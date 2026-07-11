"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";
import { DEFAULT_SITE_TITLE_COLOR } from "@/lib/siteConstants";
import type { SiteSettings } from "@/lib/siteSettings";

type AdminSiteSettingsFormProps = {
  settings: SiteSettings;
};

export function AdminSiteSettingsForm({ settings }: AdminSiteSettingsFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(settings.title);
  const [description, setDescription] = useState(settings.description);
  const [footerText, setFooterText] = useState(settings.footerText ?? "");
  const [commentsEnabled, setCommentsEnabled] = useState(
    settings.commentsEnabled ?? true
  );
  const [projectCommentsEnabled, setProjectCommentsEnabled] = useState(
    settings.projectCommentsEnabled ?? true
  );
  const [homeHeaderColor, setHomeHeaderColor] = useState(
    settings.homeHeaderColor ?? DEFAULT_SECTION_COLOR
  );
  const [siteTitleColor, setSiteTitleColor] = useState(
    settings.siteTitleColor ?? DEFAULT_SITE_TITLE_COLOR
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(settings.title);
    setDescription(settings.description);
    setFooterText(settings.footerText ?? "");
    setCommentsEnabled(settings.commentsEnabled ?? true);
    setProjectCommentsEnabled(settings.projectCommentsEnabled ?? true);
    setHomeHeaderColor(settings.homeHeaderColor ?? DEFAULT_SECTION_COLOR);
    setSiteTitleColor(settings.siteTitleColor ?? DEFAULT_SITE_TITLE_COLOR);
  }, [settings]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Saving site settings...");

    const response = await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        footerText,
        commentsEnabled,
        projectCommentsEnabled,
        homeHeaderColor,
        siteTitleColor,
      }),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error ?? "Failed to save site settings");
      return;
    }

    setTitle(data.title);
    setDescription(data.description);
    setFooterText(data.footerText ?? "");
    setCommentsEnabled(data.commentsEnabled ?? true);
    setProjectCommentsEnabled(data.projectCommentsEnabled ?? true);
    setHomeHeaderColor(data.homeHeaderColor ?? DEFAULT_SECTION_COLOR);
    setSiteTitleColor(data.siteTitleColor ?? DEFAULT_SITE_TITLE_COLOR);
    setStatus("Saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Site title</span>
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="Your Name's Portfolio"
        />
        <p className="text-sm text-muted">
          Shown in the header and browser tab.
        </p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Site title color</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={siteTitleColor}
            onChange={(event) => setSiteTitleColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface"
          />
          <input
            value={siteTitleColor}
            onChange={(event) => setSiteTitleColor(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
            placeholder="#e8edf5"
          />
        </div>
        <p className="text-sm text-muted">
          Color of the site title in the top header bar.
        </p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Site description</span>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="A professional portfolio."
        />
        <p className="text-sm text-muted">
          Used for search engines and social previews.
        </p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Footer text</span>
        <textarea
          rows={3}
          value={footerText}
          onChange={(event) => setFooterText(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="© 2026 Your Name. All rights reserved."
        />
        <p className="text-sm text-muted">
          Centered text shown at the bottom of every page. Leave blank to hide
          the footer.
        </p>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Homepage header color</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={homeHeaderColor}
            onChange={(event) => setHomeHeaderColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface"
          />
          <input
            value={homeHeaderColor}
            onChange={(event) => setHomeHeaderColor(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
            placeholder="#5b9fd4"
          />
        </div>
        <p className="text-sm text-muted">
          Color used for homepage section headings such as Latest update,
          Featured projects, and Sections.
        </p>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <input
          type="checkbox"
          checked={commentsEnabled}
          onChange={(event) => setCommentsEnabled(event.target.checked)}
          className="mt-1"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">Enable log comments</span>
          <span className="block text-sm text-muted">
            When disabled, visitors can read existing comments but cannot post
            new ones on log entries.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <input
          type="checkbox"
          checked={projectCommentsEnabled}
          onChange={(event) => setProjectCommentsEnabled(event.target.checked)}
          className="mt-1"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">Enable project comments</span>
          <span className="block text-sm text-muted">
            When disabled, visitors can read existing comments but cannot post
            new ones on project pages.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save settings"}
        </button>
        {status && <p className="text-sm text-muted">{status}</p>}
      </div>
    </form>
  );
}
