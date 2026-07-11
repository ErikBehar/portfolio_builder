import { notFound } from "next/navigation";
import { AdminSectionForm } from "@/components/AdminSectionForm";
import { getSectionById } from "@/lib/sections";

type EditSectionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSectionPage({ params }: EditSectionPageProps) {
  const { id } = await params;
  const section = await getSectionById(id);

  if (!section) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · Sections
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Edit section</h1>
      </header>

      <AdminSectionForm section={section} />
    </div>
  );
}
