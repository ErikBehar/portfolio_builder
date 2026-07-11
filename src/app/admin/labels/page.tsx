import Link from "next/link";
import { getLabels } from "@/lib/labels";

export default async function AdminLabelsPage() {
  const labels = await getLabels();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
            Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Labels</h1>
          <p className="mt-2 text-muted">
            Manage the shared label pool used to organize and filter projects.
          </p>
        </div>

        <Link
          href="/admin/labels/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          + New label
        </Link>
      </header>

      {labels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
          No labels yet. Create your first one above.
        </div>
      ) : (
        <div className="space-y-3">
          {labels.map((label) => (
            <div
              key={label.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4"
            >
              <div>
                <h2 className="font-medium">{label.name}</h2>
                <p className="text-sm text-muted">/{label.slug}</p>
              </div>

              <Link
                href={`/admin/labels/${label.id}`}
                className="text-sm text-accent hover:underline"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-muted">
        <Link href="/admin" className="text-accent underline-offset-4 hover:underline">
          ← Back to admin
        </Link>
      </p>
    </div>
  );
}
