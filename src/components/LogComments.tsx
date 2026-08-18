import { CommentsSection } from "@/components/CommentsSection";
import { createCommentCaptcha } from "@/lib/commentCaptcha";
import type { LogComment } from "@/lib/types";

type LogCommentsProps = {
  logEntryId: string;
  initialComments: LogComment[];
  commentsEnabled: boolean;
  commentsVisible: boolean;
};

export function LogComments({
  logEntryId,
  initialComments,
  commentsEnabled,
  commentsVisible,
}: LogCommentsProps) {
  if (!commentsVisible) return null;

  return (
    <CommentsSection
      apiBasePath={`/api/log/${logEntryId}/comments`}
      initialComments={initialComments}
      mode="public"
      commentsEnabled={commentsEnabled}
      emptyPublicMessage="No comments yet. Be the first."
      initialCaptcha={commentsEnabled ? createCommentCaptcha() : undefined}
    />
  );
}
