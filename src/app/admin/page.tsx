import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { getProjectCountsBySection } from "@/lib/projects";
import { getSections } from "@/lib/sections";

export default async function AdminHomePage() {
  const sections = await getSections();
  const projectCounts = await getProjectCountsBySection();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
            Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Manage portfolio</h1>
          <p className="mt-4 max-w-2xl text-muted">
            Manage your home page log, portfolio sections, and the projects inside
            each section.
          </p>
        </div>
        <AdminLogoutButton />
      </header>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/log"
          className="block rounded-xl border border-accent/40 bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="text-lg font-semibold">Log</h2>
          <p className="mt-2 text-sm text-muted">
            Manage blog-style log entries shown on the home page.
          </p>
        </Link>

        <Link
          href="/admin/sections"
          className="block rounded-xl border border-accent/40 bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="text-lg font-semibold">Sections</h2>
          <p className="mt-2 text-sm text-muted">
            Add, rename, or remove portfolio sections and their descriptions.
          </p>
        </Link>

        <Link
          href="/admin/labels"
          className="block rounded-xl border border-accent/40 bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="text-lg font-semibold">Labels</h2>
          <p className="mt-2 text-sm text-muted">
            Manage the shared label pool used to organize and filter projects.
          </p>
        </Link>

        <Link
          href="/admin/header-links"
          className="block rounded-xl border border-accent/40 bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="text-lg font-semibold">Header links</h2>
          <p className="mt-2 text-sm text-muted">
            Manage header buttons for email, CV, and social profiles.
          </p>
        </Link>

        <Link
          href="/admin/site-settings"
          className="block rounded-xl border border-accent/40 bg-surface p-5 transition-colors hover:border-accent"
        >
          <h2 className="text-lg font-semibold">Site settings</h2>
          <p className="mt-2 text-sm text-muted">
            Edit the site title and description used in the header and metadata.
          </p>
        </Link>
      </div>

      <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted">
        Projects by section
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const count = projectCounts[section.slug] ?? 0;

          return (
            <Link
              key={section.id}
              href={`/admin/${section.slug}`}
              className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm text-muted">{section.description}</p>
              <p className="mt-3 text-sm text-accent">
                {count} project{count === 1 ? "" : "s"} · Manage →
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
