"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Section, SectionCategory } from "@/lib/sections";
import { setAdminFlash } from "@/lib/adminFlash";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";

type AdminSectionFormProps = {
  section?: Section;
};

export function AdminSectionForm({ section }: AdminSectionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(section?.title ?? "");
  const [slug, setSlug] = useState(section?.slug ?? "");
  const [description, setDescription] = useState(section?.description ?? "");
  const [color, setColor] = useState(section?.color ?? DEFAULT_SECTION_COLOR);
  const [sortOrder, setSortOrder] = useState(section?.sortOrder ?? 0);
  const [categories, setCategories] = useState<SectionCategory[]>(
    section?.categories ?? []
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateCategory(
    index: number,
    field: keyof SectionCategory,
    value: string
  ) {
    setCategories((current) =>
      current.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, [field]: value } : category
      )
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Saving section...");

    const payload = {
      title,
      slug: slug || undefined,
      description,
      color,
      sortOrder,
      categories: categories.filter((category) => category.slug && category.title),
    };

    const response = await fetch(
      section ? `/api/sections/${section.id}` : "/api/sections",
      {
        method: section ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();
    let data: { error?: string } = {};

    if (responseText) {
      try {
        data = JSON.parse(responseText) as { error?: string };
      } catch {
        setIsSubmitting(false);
        setStatus("Server returned an invalid response. Try restarting the dev server.");
        return;
      }
    }

    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error ?? "Failed to save section");
      return;
    }

    setAdminFlash(section ? "Section updated." : "Section created.");
    router.push("/admin/sections");
    router.refresh();
  }

  async function handleDelete() {
    if (!section) return;
    if (!window.confirm(`Delete section "${section.title}"?`)) return;

    const response = await fetch(`/api/sections/${section.id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Failed to delete section");
      return;
    }

    setAdminFlash("Section deleted.");
    router.push("/admin/sections");
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
            placeholder="Video Games"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Slug</span>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            placeholder="video-games"
          />
          <span className="text-xs text-muted">
            URL path: /{slug || "your-slug"}
          </span>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Description</span>
        <textarea
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          placeholder="What visitors will find in this section"
        />
      </label>

      <label className="block max-w-xs space-y-2">
        <span className="text-sm font-medium">Timeline color</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface"
          />
          <input
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
            placeholder="#5b9fd4"
          />
        </div>
        <span className="text-xs text-muted">
          Used for project markers on the timeline view.
        </span>
      </label>

      <label className="block max-w-xs space-y-2">
        <span className="text-sm font-medium">Sort order</span>
        <input
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(Number(event.target.value))}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
        />
        <span className="text-xs text-muted">Lower numbers appear first on the home page.</span>
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Subcategories (optional)</h3>
          <button
            type="button"
            onClick={() =>
              setCategories((current) => [...current, { slug: "", title: "" }])
            }
            className="text-sm text-accent"
          >
            + Add subcategory
          </button>
        </div>
        <p className="text-sm text-muted">
          Use these to group projects within a section, like Professional / Personal / Jam.
        </p>

        {categories.map((category, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={category.title}
              onChange={(event) => updateCategory(index, "title", event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Title"
            />
            <input
              value={category.slug}
              onChange={(event) => updateCategory(index, "slug", event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              placeholder="slug"
            />
            <button
              type="button"
              onClick={() =>
                setCategories((current) =>
                  current.filter((_, categoryIndex) => categoryIndex !== index)
                )
              }
              className="text-sm text-red-400"
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
          {section ? "Update section" : "Create section"}
        </button>
        {section && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-400/40 px-5 py-2.5 text-sm text-red-400"
          >
            Delete section
          </button>
        )}
      </div>
    </form>
  );
}
