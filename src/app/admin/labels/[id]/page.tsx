import { notFound } from "next/navigation";
import { AdminLabelForm } from "@/components/AdminLabelForm";
import { getLabelById } from "@/lib/labels";
import { isSectionLabelSlug } from "@/lib/sectionLabels";

type EditLabelPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditLabelPage({ params }: EditLabelPageProps) {
  const { id } = await params;
  const label = await getLabelById(id);

  if (!label) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · Labels
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Edit label</h1>
      </header>

      <AdminLabelForm
        label={label}
        managedBySection={await isSectionLabelSlug(label.slug)}
      />
    </div>
  );
}
