import { connection } from "next/server";
import { CommentsSection } from "@/components/CommentsSection";
import { createCommentCaptcha } from "@/lib/commentCaptcha";
import type { LogComment } from "@/lib/types";

type ProjectCommentsProps = {
  projectId: string;
  initialComments: LogComment[];
  commentsEnabled: boolean;
  commentsVisible: boolean;
  captchaEnabled: boolean;
};

export async function ProjectComments({
  projectId,
  initialComments,
  commentsEnabled,
  commentsVisible,
  captchaEnabled,
}: ProjectCommentsProps) {
  if (!commentsVisible) return null;

  if (commentsEnabled && captchaEnabled) {
    await connection();
  }

  return (
    <CommentsSection
      key={projectId}
      apiBasePath={`/api/projects/${projectId}/comments`}
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
