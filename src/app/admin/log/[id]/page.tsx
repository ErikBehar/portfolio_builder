import { notFound } from "next/navigation";
import { AdminLogComments } from "@/components/AdminLogComments";
import { AdminLogForm } from "@/components/AdminLogForm";
import { getLogEntryById } from "@/lib/log";

type EditLogEntryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditLogEntryPage({ params }: EditLogEntryPageProps) {
  const { id } = await params;
  const entry = await getLogEntryById(id, true);

  if (!entry) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin · Log
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Edit log entry</h1>
      </header>

      <AdminLogForm entry={entry} />

      <AdminLogComments
        logEntryId={entry.id}
        initialComments={entry.comments ?? []}
      />
    </div>
  );
}
