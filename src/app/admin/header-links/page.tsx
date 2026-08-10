import Link from "next/link";
import { AdminHeaderLinksReorder } from "@/components/AdminHeaderLinksReorder";
import { getHeaderLinks } from "@/lib/headerLinks";

export default async function AdminHeaderLinksPage() {
  const links = await getHeaderLinks();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
            Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Header links</h1>
          <p className="mt-2 text-muted">
            Manage the buttons shown in the site header, such as email, CV, and
            social links. Drag to reorder them horizontally.
          </p>
        </div>

        <Link
          href="/admin/header-links/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          + New link
        </Link>
      </header>

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
          No header links yet. Create your first one above.
        </div>
      ) : (
        <AdminHeaderLinksReorder links={links} />
      )}

      <p className="mt-10 text-sm text-muted">
        <Link href="/admin" className="text-accent underline-offset-4 hover:underline">
          ← Back to admin
        </Link>
      </p>
    </div>
  );
}
