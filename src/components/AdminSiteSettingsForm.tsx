"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";
import { DEFAULT_SITE_TITLE_COLOR } from "@/lib/siteConstants";
import {
  DEFAULT_HOME_LAYOUT,
  HOME_SECTION_LABELS,
  type HomeLayout,
  type HomeSectionConfig,
  type TimelineDisplayMode,
} from "@/lib/homeLayout";
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
  const [commentsVisible, setCommentsVisible] = useState(
    settings.commentsVisible ?? true
  );
  const [projectCommentsVisible, setProjectCommentsVisible] = useState(
    settings.projectCommentsVisible ?? true
  );
  const [homeHeaderColor, setHomeHeaderColor] = useState(
    settings.homeHeaderColor ?? DEFAULT_SECTION_COLOR
  );
  const [siteTitleColor, setSiteTitleColor] = useState(
    settings.siteTitleColor ?? DEFAULT_SITE_TITLE_COLOR
  );
  const [homeLayout, setHomeLayout] = useState<HomeLayout>(
    settings.homeLayout ?? DEFAULT_HOME_LAYOUT
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(settings.title);
    setDescription(settings.description);
    setFooterText(settings.footerText ?? "");
    setCommentsEnabled(settings.commentsEnabled ?? true);
    setProjectCommentsEnabled(settings.projectCommentsEnabled ?? true);
    setCommentsVisible(settings.commentsVisible ?? true);
    setProjectCommentsVisible(settings.projectCommentsVisible ?? true);
    setHomeHeaderColor(settings.homeHeaderColor ?? DEFAULT_SECTION_COLOR);
    setSiteTitleColor(settings.siteTitleColor ?? DEFAULT_SITE_TITLE_COLOR);
    setHomeLayout(settings.homeLayout ?? DEFAULT_HOME_LAYOUT);
  }, [settings]);

  function moveSection(index: number, direction: -1 | 1) {
    setHomeLayout((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.sections.length) {
        return current;
      }
      const sections = [...current.sections];
      const [item] = sections.splice(index, 1);
      sections.splice(nextIndex, 0, item);
      return { ...current, sections };
    });
  }

  function toggleSectionVisible(id: HomeSectionConfig["id"]) {
    setHomeLayout((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === id
          ? { ...section, visible: !section.visible }
          : section
      ),
    }));
  }

  function setTimelineMode(timelineMode: TimelineDisplayMode) {
    setHomeLayout((current) => ({ ...current, timelineMode }));
  }

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
        commentsVisible,
        projectCommentsVisible,
        homeHeaderColor,
        siteTitleColor,
        homeLayout,
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
    setCommentsVisible(data.commentsVisible ?? true);
    setProjectCommentsVisible(data.projectCommentsVisible ?? true);
    setHomeHeaderColor(data.homeHeaderColor ?? DEFAULT_SECTION_COLOR);
    setSiteTitleColor(data.siteTitleColor ?? DEFAULT_SITE_TITLE_COLOR);
    setHomeLayout(data.homeLayout ?? DEFAULT_HOME_LAYOUT);
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

      <fieldset className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <legend className="px-1 text-sm font-medium">Homepage sections</legend>
        <p className="text-sm text-muted">
          Choose which blocks appear on the homepage and their order from top to
          bottom.
        </p>
        <ul className="space-y-2">
          {homeLayout.sections.map((section, index) => (
            <li
              key={section.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
            >
              <label className="flex min-w-0 flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={() => toggleSectionVisible(section.id)}
                />
                <span className="text-sm font-medium">
                  {HOME_SECTION_LABELS[section.id]}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="rounded-md border border-border px-2 py-1 text-sm transition-colors hover:border-accent disabled:opacity-40"
                  aria-label={`Move ${HOME_SECTION_LABELS[section.id]} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === homeLayout.sections.length - 1}
                  className="rounded-md border border-border px-2 py-1 text-sm transition-colors hover:border-accent disabled:opacity-40"
                  aria-label={`Move ${HOME_SECTION_LABELS[section.id]} down`}
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-sm font-medium">Timeline on homepage</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="timelineMode"
                checked={homeLayout.timelineMode === "link"}
                onChange={() => setTimelineMode("link")}
              />
              Link to timeline page
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="timelineMode"
                checked={homeLayout.timelineMode === "embed"}
                onChange={() => setTimelineMode("embed")}
              />
              Show timeline on homepage
            </label>
          </div>
          <p className="text-sm text-muted">
            Only applies when Timeline is visible above.
          </p>
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <input
          type="checkbox"
          checked={commentsVisible}
          onChange={(event) => setCommentsVisible(event.target.checked)}
          className="mt-1"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">Show log comments</span>
          <span className="block text-sm text-muted">
            When disabled, the comments section is hidden on public log pages.
            Admins can still manage comments from the admin panel.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <input
          type="checkbox"
          checked={commentsEnabled}
          onChange={(event) => setCommentsEnabled(event.target.checked)}
          className="mt-1"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">Allow new log comments</span>
          <span className="block text-sm text-muted">
            When disabled, visitors can still read existing comments (if shown)
            but cannot post new ones on log entries.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
        <input
          type="checkbox"
          checked={projectCommentsVisible}
          onChange={(event) => setProjectCommentsVisible(event.target.checked)}
          className="mt-1"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">Show project comments</span>
          <span className="block text-sm text-muted">
            When disabled, the comments section is hidden on public project
            pages. Admins can still manage comments from the admin panel.
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
          <span className="block text-sm font-medium">
            Allow new project comments
          </span>
          <span className="block text-sm text-muted">
            When disabled, visitors can still read existing comments (if shown)
            but cannot post new ones on project pages.
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
