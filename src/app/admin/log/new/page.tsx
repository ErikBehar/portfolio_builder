import { AdminLogForm } from "@/components/AdminLogForm";

export default function NewLogEntryPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · Log
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">New log entry</h1>
      </header>

      <AdminLogForm />
    </div>
  );
}
