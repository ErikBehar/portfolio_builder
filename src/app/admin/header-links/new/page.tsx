import { AdminHeaderLinkForm } from "@/components/AdminHeaderLinkForm";

export default function NewHeaderLinkPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · Header links
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">New header link</h1>
      </header>

      <AdminHeaderLinkForm />
    </div>
  );
}
