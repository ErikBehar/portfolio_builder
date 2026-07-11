import Link from "next/link";
import { HeaderLinkIcon } from "@/components/HeaderLinkIcon";
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
            social links.
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
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex rounded-md border border-border bg-surface-elevated p-2">
                  <HeaderLinkIcon icon={link.icon} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-medium">{link.label}</h2>
                  <p className="truncate text-sm text-muted">{link.url}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-muted">Order {link.sortOrder}</span>
                <Link
                  href={`/admin/header-links/${link.id}`}
                  className="text-sm text-accent hover:underline"
                >
                  Edit
                </Link>
              </div>
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
