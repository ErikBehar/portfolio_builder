import { CommentsSection } from "@/components/CommentsSection";
import type { LogComment } from "@/lib/types";

type LogCommentsProps = {
  logEntryId: string;
  initialComments: LogComment[];
  commentsEnabled: boolean;
};

export function LogComments({
  logEntryId,
  initialComments,
  commentsEnabled,
}: LogCommentsProps) {
  return (
    <CommentsSection
      apiBasePath={`/api/log/${logEntryId}/comments`}
      initialComments={initialComments}
      mode="public"
      commentsEnabled={commentsEnabled}
      emptyPublicMessage="No comments yet. Be the first."
    />
  );
}
