import Link from "next/link";
import { AdminCommentsInbox } from "@/components/AdminCommentsInbox";
import {
  getUnreadCommentCount,
  listAdminComments,
} from "@/lib/adminComments";

type AdminCommentsPageProps = {
  searchParams: Promise<{ unread?: string }>;
};

export default async function AdminCommentsPage({
  searchParams,
}: AdminCommentsPageProps) {
  const params = await searchParams;
  const unreadOnly = params.unread === "1";
  const [comments, unreadCount] = await Promise.all([
    listAdminComments({ unreadOnly }),
    getUnreadCommentCount(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Comments</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Review comments left on log entries and projects. Unread items stay
          marked until you mark them as seen.
          {unreadCount > 0
            ? ` You have ${unreadCount} unread comment${unreadCount === 1 ? "" : "s"}.`
            : ""}
        </p>
      </header>

      <AdminCommentsInbox
        comments={comments}
        unreadCount={unreadCount}
        unreadOnly={unreadOnly}
      />

      <p className="mt-10 text-sm text-muted">
        <Link href="/admin" className="text-accent underline-offset-4 hover:underline">
          ← Back to admin
        </Link>
      </p>
    </div>
  );
}
