import { CommentsSection } from "@/components/CommentsSection";
import type { LogComment } from "@/lib/types";

type ProjectCommentsProps = {
  projectId: string;
  initialComments: LogComment[];
  commentsEnabled: boolean;
  commentsVisible: boolean;
};

export function ProjectComments({
  projectId,
  initialComments,
  commentsEnabled,
  commentsVisible,
}: ProjectCommentsProps) {
  if (!commentsVisible) return null;

  return (
    <CommentsSection
      apiBasePath={`/api/projects/${projectId}/comments`}
      initialComments={initialComments}
      mode="public"
      commentsEnabled={commentsEnabled}
      emptyPublicMessage="No comments yet. Be the first."
    />
  );
}
