"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAdminFlash } from "@/lib/adminFlash";
import type { ProjectLabel } from "@/lib/types";

type AdminLabelFormProps = {
  label?: ProjectLabel;
  managedBySection?: boolean;
};

export function AdminLabelForm({
  label,
  managedBySection = false,
}: AdminLabelFormProps) {
  const router = useRouter();
  const [name, setName] = useState(label?.name ?? "");
  const [slug, setSlug] = useState(label?.slug ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Saving label...");

    const response = await fetch(label ? `/api/labels/${label.id}` : "/api/labels", {
      method: label ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug || undefined }),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus(data.error ?? "Failed to save label");
      return;
    }

    setAdminFlash(label ? "Label updated." : "Label created.");
    router.push("/admin/labels");
    router.refresh();
  }

  async function handleDelete() {
    if (!label) return;
    if (!window.confirm(`Delete label "${label.name}"?`)) return;

    const response = await fetch(`/api/labels/${label.id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Failed to delete label");
      return;
    }

    setAdminFlash("Label deleted.");
    router.push("/admin/labels");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Name</span>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={managedBySection}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 disabled:opacity-70"
          placeholder="Professional"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Slug</span>
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          disabled={label?.slug === "show" || managedBySection}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 disabled:opacity-70"
          placeholder="professional"
        />
        {managedBySection && (
          <p className="text-sm text-muted">
            This label is managed by its portfolio section. Edit the section title
            to rename it, or delete the section to remove it.
          </p>
        )}
      </label>

      {status && <p className="text-sm text-muted">{status}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting || managedBySection}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {label ? "Update label" : "Create label"}
        </button>
        {label && label.slug !== "show" && !managedBySection && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-400/40 px-5 py-2.5 text-sm text-red-400"
          >
            Delete label
          </button>
        )}
      </div>
    </form>
  );
}
