"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCommentItem } from "@/lib/adminComments";

type AdminCommentsInboxProps = {
  comments: AdminCommentItem[];
  unreadCount: number;
  unreadOnly: boolean;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminCommentsInbox({
  comments,
  unreadCount,
  unreadOnly,
}: AdminCommentsInboxProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function markSeen(item: AdminCommentItem) {
    setPendingId(item.id);
    setStatus(null);

    const response = await fetch("/api/admin/comments/mark-seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: item.id, parentType: item.parentType }],
      }),
    });

    setPendingId(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setStatus(data?.error ?? "Failed to mark comment as seen");
      return;
    }

    router.refresh();
  }

  async function markAllSeen() {
    setMarkingAll(true);
    setStatus(null);

    const response = await fetch("/api/admin/comments/mark-seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });

    setMarkingAll(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setStatus(data?.error ?? "Failed to mark comments as seen");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/admin/comments"
            className={`rounded-lg px-3 py-1.5 ${
              !unreadOnly
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            All
          </Link>
          <Link
            href="/admin/comments?unread=1"
            className={`rounded-lg px-3 py-1.5 ${
              unreadOnly
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted hover:border-accent"
            }`}
          >
            Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </Link>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllSeen}
            disabled={markingAll}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-60"
          >
            {markingAll ? "Marking..." : "Mark all as seen"}
          </button>
        )}
      </div>

      {status && <p className="text-sm text-muted">{status}</p>}

      {comments.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          {unreadOnly ? "No unread comments." : "No comments yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const isUnread = !comment.seenAt;
            const isPending = pendingId === comment.id;

            return (
              <li
                key={`${comment.parentType}-${comment.id}`}
                className={`rounded-xl border bg-surface p-4 ${
                  isUnread ? "border-accent/50" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && (
                        <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                          New
                        </span>
                      )}
                      <span className="text-xs uppercase tracking-wide text-muted">
                        {comment.parentType === "log" ? "Log" : "Project"}
                      </span>
                      <span className="text-sm text-muted">
                        {formatWhen(comment.createdAt)}
                      </span>
                    </div>
                    <p className="font-medium">
                      <Link
                        href={comment.adminHref}
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        {comment.parentTitle}
                      </Link>
                    </p>
                    <p className="text-sm text-muted">
                      From <span className="text-foreground">{comment.author}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={comment.parentHref}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
                    >
                      View page
                    </Link>
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => markSeen(comment)}
                        disabled={isPending}
                        className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
                      >
                        {isPending ? "Saving..." : "Mark seen"}
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {comment.content}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
