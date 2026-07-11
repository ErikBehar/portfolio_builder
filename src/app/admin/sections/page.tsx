import Link from "next/link";
import { getProjectCountsBySection } from "@/lib/projects";
import { getSections } from "@/lib/sections";

export default async function AdminSectionsPage() {
  const sections = await getSections();
  const projectCounts = await getProjectCountsBySection();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
            Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Sections</h1>
          <p className="mt-2 text-muted">
            Add, rename, or remove portfolio sections shown on the home page.
          </p>
        </div>

        <Link
          href="/admin/sections/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          + New section
        </Link>
      </header>

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
          No sections yet. Create your first one above.
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const count = projectCounts[section.slug] ?? 0;

            return (
              <div
                key={section.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4"
              >
                <div>
                  <h2 className="font-medium">{section.title}</h2>
                  <p className="text-sm text-muted">/{section.slug}</p>
                  <p className="mt-1 text-sm text-muted">{section.description}</p>
                  <p className="mt-2 text-xs text-muted">
                    {count} project{count === 1 ? "" : "s"} · order {section.sortOrder}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/admin/${section.slug}`}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    Projects
                  </Link>
                  <Link
                    href={`/${section.slug}`}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/sections/${section.id}`}
                    className="text-sm text-accent hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
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
