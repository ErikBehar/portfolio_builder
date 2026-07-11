import { notFound } from "next/navigation";
import { AdminProjectComments } from "@/components/AdminProjectComments";
import { AdminProjectForm } from "@/components/AdminProjectForm";
import { getLabels } from "@/lib/labels";
import { getProjectById } from "@/lib/projects";
import { getSection } from "@/lib/sections";

export const dynamic = "force-dynamic";

type EditProjectPageProps = {
  params: Promise<{ section: string; id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { section: sectionSlug, id } = await params;
  const section = await getSection(sectionSlug);

  if (!section) {
    notFound();
  }

  const [project, allLabels] = await Promise.all([
    getProjectById(id, true),
    getLabels(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · {section.title}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Edit project</h1>
      </header>

      <AdminProjectForm
        section={section}
        project={project}
        allLabels={allLabels}
      />

      <AdminProjectComments
        projectId={project.id}
        initialComments={project.comments ?? []}
      />
    </div>
  );
}
