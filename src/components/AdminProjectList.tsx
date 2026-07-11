"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectWithMedia } from "@/lib/types";
import type { Section } from "@/lib/sections";

type AdminProjectListProps = {
  section: Section;
  projects: ProjectWithMedia[];
};

export function AdminProjectList({ section, projects }: AdminProjectListProps) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(project: ProjectWithMedia) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;

    setDeletingId(project.id);
    setError(null);

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });

    setDeletingId(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to delete project");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== project.id));
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
        No projects yet. Create your first one above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-400">{error}</p>}

      {items.map((project) => (
        <div
          key={project.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4"
        >
          <div>
            <h2 className="font-medium">{project.title}</h2>
            <p className="text-sm text-muted">
              {project.media.length} media item
              {project.media.length === 1 ? "" : "s"}
              {" · "}
              {project.links.length} link
              {project.links.length === 1 ? "" : "s"}
              {project.category ? ` · ${project.category.replace(/-/g, " ")}` : ""}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/${section.slug}/${project.slug}`}
              className="text-sm text-muted hover:text-foreground"
            >
              View
            </Link>
            <Link
              href={`/admin/${section.slug}/${project.id}`}
              className="text-sm text-accent hover:underline"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(project)}
              disabled={deletingId === project.id}
              className="text-sm text-red-400 hover:underline disabled:opacity-60"
            >
              {deletingId === project.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
