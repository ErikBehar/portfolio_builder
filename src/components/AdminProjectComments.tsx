"use client";

import { useState } from "react";
import type { ProjectComment } from "@/lib/types";

type AdminProjectCommentsProps = {
  projectId: string;
  initialComments: ProjectComment[];
};

function formatCommentDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminProjectComments({
  projectId,
  initialComments,
}: AdminProjectCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAuthor, setEditAuthor] = useState("");
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function startEdit(comment: ProjectComment) {
    setEditingId(comment.id);
    setEditAuthor(comment.author);
    setEditContent(comment.content);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditAuthor("");
    setEditContent("");
    setError(null);
  }

  async function handleSave(commentId: string) {
    setLoadingId(commentId);
    setError(null);

    const response = await fetch(
      `/api/projects/${projectId}/comments/${commentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: editAuthor, content: editContent }),
      }
    );

    const data = await response.json();
    setLoadingId(null);

    if (!response.ok) {
      setError(data.error ?? "Failed to update comment");
      return;
    }

    setComments((current) =>
      current.map((comment) => (comment.id === commentId ? data : comment))
    );
    cancelEdit();
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;

    setLoadingId(commentId);
    setError(null);

    const response = await fetch(
      `/api/projects/${projectId}/comments/${commentId}`,
      { method: "DELETE" }
    );

    setLoadingId(null);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to delete comment");
      return;
    }

    setComments((current) => current.filter((comment) => comment.id !== commentId));
    if (editingId === commentId) cancelEdit();
  }

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-lg font-semibold">
        Comments ({comments.length})
      </h2>
      <p className="mt-1 text-sm text-muted">
        Edit or remove comments left on this project.
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {comments.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No comments on this project yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              {editingId === comment.id ? (
                <div className="space-y-3">
                  <input
                    value={editAuthor}
                    onChange={(event) => setEditAuthor(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Name"
                  />
                  <textarea
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Comment"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleSave(comment.id)}
                      disabled={
                        loadingId === comment.id || !editAuthor || !editContent
                      }
                      className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
                    >
                      {loadingId === comment.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-medium">{comment.author}</span>
                    <time className="text-xs text-muted" dateTime={comment.createdAt}>
                      {formatCommentDate(comment.createdAt)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {comment.content}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(comment)}
                      className="text-sm text-accent hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={loadingId === comment.id}
                      className="text-sm text-red-400 hover:underline disabled:opacity-60"
                    >
                      {loadingId === comment.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
