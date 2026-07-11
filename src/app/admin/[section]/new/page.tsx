import { notFound } from "next/navigation";
import { AdminProjectForm } from "@/components/AdminProjectForm";
import { getLabels } from "@/lib/labels";
import { getSection } from "@/lib/sections";

export const dynamic = "force-dynamic";

type NewProjectPageProps = {
  params: Promise<{ section: string }>;
};

export default async function NewProjectPage({ params }: NewProjectPageProps) {
  const { section: sectionSlug } = await params;
  const [section, allLabels] = await Promise.all([
    getSection(sectionSlug),
    getLabels(),
  ]);

  if (!section) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · {section.title}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">New project</h1>
      </header>

      <AdminProjectForm section={section} allLabels={allLabels} />
    </div>
  );
}
