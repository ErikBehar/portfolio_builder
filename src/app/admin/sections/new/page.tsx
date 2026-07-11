import { AdminSectionForm } from "@/components/AdminSectionForm";

export default function NewSectionPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · Sections
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">New section</h1>
      </header>

      <AdminSectionForm />
    </div>
  );
}
