"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/DatePicker";
import { toDateInputValue, todayInputValue } from "@/lib/dates";
import { uploadMediaFiles, type MediaDraft } from "@/lib/clientUpload";
import { getDefaultPreviewMediaIndex } from "@/lib/media";
import type { Section } from "@/lib/sections";
import {
  SHOW_LABEL_SLUG,
  type MediaType,
  type ProjectLabel,
  type ProjectLink,
  type ProjectWithMedia,
} from "@/lib/types";

type AdminProjectFormProps = {
  section: Section;
  project?: ProjectWithMedia;
  allLabels: ProjectLabel[];
};

export function AdminProjectForm({
  section,
  project,
  allLabels,
}: AdminProjectFormProps) {
  const router = useRouter();
  const showLabel = allLabels.find((label) => label.slug === SHOW_LABEL_SLUG);
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [category, setCategory] = useState(project?.category ?? "");
  const [createdAt, setCreatedAt] = useState(
    project?.createdAt ? toDateInputValue(project.createdAt) : todayInputValue()
  );
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(() => {
    if (project) {
      return project.labels.map((label) => label.id);
    }
    return showLabel ? [showLabel.id] : [];
  });
  const [availableLabels, setAvailableLabels] = useState<ProjectLabel[]>(allLabels);
  const [newLabelName, setNewLabelName] = useState("");
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [links, setLinks] = useState<ProjectLink[]>(project?.links ?? []);
  const [media, setMedia] = useState<MediaDraft[]>(
    project?.media.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      caption: item.caption ?? "",
    })) ?? []
  );
  const [previewMediaIndex, setPreviewMediaIndex] = useState(() =>
    project
      ? getDefaultPreviewMediaIndex(project.media, project.coverMediaId)
      : 0
  );
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId]
    );
  }

  async function handleCreateLabel() {
    const name = newLabelName.trim();
    if (!name) return;

    setIsCreatingLabel(true);
    setStatus("Creating label...");

    try {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      setIsCreatingLabel(false);

      if (!response.ok) {
        setStatus(data.error ?? "Failed to create label");
        return;
      }

      const createdLabel: ProjectLabel = {
        id: data.id,
        name: data.name,
        slug: data.slug,
      };

      setAvailableLabels((current) =>
        [...current, createdLabel].sort((a, b) => a.name.localeCompare(b.name))
      );
      setSelectedLabelIds((current) =>
        current.includes(createdLabel.id)
          ? current
          : [...current, createdLabel.id]
      );
      setNewLabelName("");
      setStatus(null);
    } catch (error) {
      setIsCreatingLabel(false);
      setStatus(error instanceof Error ? error.message : "Failed to create label");
    }
  }

  async function handleMediaUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    type: MediaType
  ) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setStatus("Uploading media...");

    try {
      const uploaded = await uploadMediaFiles(files, type);
      setMedia((current) => {
        if (type === "image" && !current.some((item) => item.type === "image")) {
          setPreviewMediaIndex(current.length);
        }
        return [...current, ...uploaded];
      });
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      event.target.value = "";
    }
  }

  function updateLink(index: number, field: keyof ProjectLink, value: string) {
    setLinks((current) =>
      current.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link
      )
    );
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, linkIndex) => linkIndex !== index));
  }

  function removeMedia(index: number) {
    setMedia((current) => {
      const next = current.filter((_, entryIndex) => entryIndex !== index);
      setPreviewMediaIndex((previewIndex) => {
        if (previewIndex === index) {
          const nextImageIndex = next.findIndex((item) => item.type === "image");
          return nextImageIndex >= 0 ? nextImageIndex : 0;
        }
        if (previewIndex > index) return previewIndex - 1;
        return previewIndex;
      });
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Saving project...");

    const filteredMedia = media.filter((item) => item.url);
    const payload = {
      title,
      description: description || null,
      section: section.slug,
      category: category || null,
      createdAt,
      labelIds: selectedLabelIds,
      links: links.filter((link) => link.label && link.url),
      media: filteredMedia,
      previewMediaIndex:
        filteredMedia[previewMediaIndex]?.type === "image"
          ? previewMediaIndex
          : filteredMedia.findIndex((item) => item.type === "image"),
    };

    const response = await fetch(
      project ? `/api/projects/${project.id}` : "/api/projects",
      {
        method: project ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error ?? "Failed to save project");
      return;
    }

    router.push(`/admin/${section.slug}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!project) return;
    if (!window.confirm("Delete this project?")) return;

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      setStatus(data.error ?? "Failed to delete project");
      return;
    }

    router.push(`/admin/${section.slug}`);
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
            placeholder="Project title"
          />
        </label>

        <DatePicker
          label="Created date"
          value={createdAt}
          onChange={setCreatedAt}
          required
        />

        {section.categories && (
          <label className="space-y-2">
            <span className="text-sm font-medium">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            >
              <option value="">None</option>
              {section.categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
          placeholder="Optional project description"
        />
        <p className="text-sm text-muted">
          Supports line breaks, URLs, and markdown-style links like{" "}
          <code className="rounded bg-surface-elevated px-1 py-0.5 text-xs">
            [GitHub](https://github.com/you)
          </code>
          .
        </p>
      </label>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Labels</h3>
        <p className="text-sm text-muted">
          New projects include Show by default. Remove it to hide a project from the
          default section view. Add Featured to include a project in the home page
          carousel.
        </p>

        {availableLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableLabels.map((label) => {
              const selected = selectedLabelIds.includes(label.id);

              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    selected
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface text-muted hover:border-accent/60 hover:text-foreground"
                  }`}
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">No labels yet. Create one below.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            value={newLabelName}
            onChange={(event) => setNewLabelName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreateLabel();
              }
            }}
            className="min-w-[12rem] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            placeholder="New label name"
          />
          <button
            type="button"
            onClick={() => void handleCreateLabel()}
            disabled={isCreatingLabel || !newLabelName.trim()}
            className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:border-accent disabled:opacity-60"
          >
            {isCreatingLabel ? "Adding..." : "+ Add label"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Links</h3>
          <button
            type="button"
            onClick={() => setLinks((current) => [...current, { label: "", url: "" }])}
            className="text-sm text-accent"
          >
            + Add link
          </button>
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-muted">No links yet.</p>
        ) : (
          links.map((link, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="space-y-1">
                <span className="text-xs text-muted">Label</span>
                <input
                  value={link.label}
                  onChange={(event) => updateLink(index, "label", event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="GitHub"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted">URL</span>
                <input
                  value={link.url}
                  onChange={(event) => updateLink(index, "url", event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="https://"
                />
              </label>
              <button
                type="button"
                onClick={() => removeLink(index)}
                className="self-end text-sm text-red-400 sm:self-center"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Media</h3>
        <p className="text-sm text-muted">
          Choose a preview image for project cards and the timeline.
        </p>

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
            className={`grid gap-3 rounded-xl border bg-surface p-4 sm:grid-cols-[120px_1fr_auto] ${
              previewMediaIndex === index && item.type === "image"
                ? "border-accent"
                : "border-border"
            }`}
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
              {item.type === "image" && item.url && (
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="radio"
                    name="preview-media"
                    checked={previewMediaIndex === index}
                    onChange={() => setPreviewMediaIndex(index)}
                  />
                  Use as preview image
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeMedia(index)}
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
          {project ? "Update project" : "Create project"}
        </button>
        {project && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-400/40 px-5 py-2.5 text-sm text-red-400"
          >
            Delete project
          </button>
        )}
      </div>
    </form>
  );
}
