import { CommentsSection } from "@/components/CommentsSection";
import type { LogComment } from "@/lib/types";

type AdminProjectCommentsProps = {
  projectId: string;
  initialComments: LogComment[];
};

export function AdminProjectComments({
  projectId,
  initialComments,
}: AdminProjectCommentsProps) {
  return (
    <CommentsSection
      apiBasePath={`/api/projects/${projectId}/comments`}
      initialComments={initialComments}
      mode="admin"
      adminDescription="Edit or remove comments left on this project."
    />
  );
}
