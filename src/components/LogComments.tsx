import { CommentsSection } from "@/components/CommentsSection";
import { createCommentCaptcha } from "@/lib/commentCaptcha";
import type { LogComment } from "@/lib/types";

type LogCommentsProps = {
  logEntryId: string;
  initialComments: LogComment[];
  commentsEnabled: boolean;
  commentsVisible: boolean;
  captchaEnabled: boolean;
};

export function LogComments({
  logEntryId,
  initialComments,
  commentsEnabled,
  commentsVisible,
  captchaEnabled,
}: LogCommentsProps) {
  if (!commentsVisible) return null;

  return (
    <CommentsSection
      apiBasePath={`/api/log/${logEntryId}/comments`}
      initialComments={initialComments}
      mode="public"
      commentsEnabled={commentsEnabled}
      captchaEnabled={captchaEnabled}
      emptyPublicMessage="No comments yet. Be the first."
      initialCaptcha={
        commentsEnabled && captchaEnabled ? createCommentCaptcha() : undefined
      }
    />
  );
}
