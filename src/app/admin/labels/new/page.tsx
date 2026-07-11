import { AdminLabelForm } from "@/components/AdminLabelForm";

export default function NewLabelPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · Labels
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">New label</h1>
      </header>

      <AdminLabelForm />
    </div>
  );
}
