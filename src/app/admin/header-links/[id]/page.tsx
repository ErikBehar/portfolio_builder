import { notFound } from "next/navigation";
import { AdminHeaderLinkForm } from "@/components/AdminHeaderLinkForm";
import { getHeaderLinkById } from "@/lib/headerLinks";

type EditHeaderLinkPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditHeaderLinkPage({ params }: EditHeaderLinkPageProps) {
  const { id } = await params;
  const link = await getHeaderLinkById(id);

  if (!link) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · Header links
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Edit header link</h1>
      </header>

      <AdminHeaderLinkForm link={link} />
    </div>
  );
}
