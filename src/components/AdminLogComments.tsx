import { CommentsSection } from "@/components/CommentsSection";
import type { LogComment } from "@/lib/types";

type AdminLogCommentsProps = {
  logEntryId: string;
  initialComments: LogComment[];
};

export function AdminLogComments({
  logEntryId,
  initialComments,
}: AdminLogCommentsProps) {
  return (
    <CommentsSection
      apiBasePath={`/api/log/${logEntryId}/comments`}
      initialComments={initialComments}
      mode="admin"
      adminDescription="Edit or remove comments left on this log entry."
    />
  );
}
