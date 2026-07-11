import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminProjectList } from "@/components/AdminProjectList";
import { getProjectsBySection } from "@/lib/projects";
import { getSection } from "@/lib/sections";

export const dynamic = "force-dynamic";

type AdminSectionPageProps = {
  params: Promise<{ section: string }>;
};

export default async function AdminSectionPage({ params }: AdminSectionPageProps) {
  const { section: sectionSlug } = await params;
  const section = await getSection(sectionSlug);

  if (!section) {
    notFound();
  }

  const projects = await getProjectsBySection(sectionSlug);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
            Admin · {section.title}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {section.title} projects
          </h1>
          <p className="mt-2 text-sm text-muted">{section.description}</p>
        </div>

        <Link
          href={`/admin/${section.slug}/new`}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          + New project
        </Link>
      </header>

      <AdminProjectList section={section} projects={projects} />

      <p className="mt-10 text-sm text-muted">
        <Link href="/admin" className="text-accent underline-offset-4 hover:underline">
          ← All sections
        </Link>
      </p>
    </div>
  );
}
