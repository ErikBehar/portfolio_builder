"use client";

import { useState } from "react";
import { formatCommentDate } from "@/lib/dates";
import {
  COMMENT_AUTHOR_MAX_LENGTH,
  COMMENT_CONTENT_MAX_LENGTH,
} from "@/lib/commentLimits";
import type { LogComment } from "@/lib/types";

type CommentsSectionProps = {
  apiBasePath: string;
  initialComments: LogComment[];
  mode: "public" | "admin";
  commentsEnabled?: boolean;
  emptyPublicMessage?: string;
  adminDescription?: string;
};

export function CommentsSection({
  apiBasePath,
  initialComments,
  mode,
  commentsEnabled = true,
  emptyPublicMessage = "No comments yet. Be the first.",
  adminDescription = "Edit or remove comments left on this page.",
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAuthor, setEditAuthor] = useState("");
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const isAdmin = mode === "admin";
  const headingClass = isAdmin ? "text-lg font-semibold" : "text-xl font-semibold";

  function startEdit(comment: LogComment) {
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(apiBasePath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, content }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Failed to post comment");
      return;
    }

    setComments((current) => [...current, data]);
    setAuthor("");
    setContent("");
  }

  async function handleSave(commentId: string) {
    setLoadingId(commentId);
    setError(null);

    const response = await fetch(`${apiBasePath}/${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: editAuthor, content: editContent }),
    });

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

    const response = await fetch(`${apiBasePath}/${commentId}`, {
      method: "DELETE",
    });

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
      <h2 className={headingClass}>Comments ({comments.length})</h2>

      {isAdmin && (
        <p className="mt-1 text-sm text-muted">{adminDescription}</p>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {isAdmin
            ? "No comments on this page yet."
            : commentsEnabled
              ? emptyPublicMessage
              : "No comments on this page."}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              {isAdmin && editingId === comment.id ? (
                <div className="space-y-3">
                  <input
                    value={editAuthor}
                    onChange={(event) => setEditAuthor(event.target.value)}
                    maxLength={COMMENT_AUTHOR_MAX_LENGTH}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Name"
                  />
                  <textarea
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    maxLength={COMMENT_CONTENT_MAX_LENGTH}
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
                  <div
                    className={`mb-2 flex items-center justify-between gap-3${isAdmin ? " flex-wrap" : ""}`}
                  >
                    <span className="font-medium">{comment.author}</span>
                    <time className="text-xs text-muted" dateTime={comment.createdAt}>
                      {formatCommentDate(comment.createdAt, {
                        includeTime: isAdmin,
                      })}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                    {comment.content}
                  </p>
                  {isAdmin && (
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
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isAdmin && commentsEnabled ? (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-5"
        >
          <h3 className="text-sm font-medium">Leave a comment</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-muted">Name</span>
              <input
                required
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                maxLength={COMMENT_AUTHOR_MAX_LENGTH}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-muted">Comment</span>
            <textarea
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={COMMENT_CONTENT_MAX_LENGTH}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Write a comment..."
            />
            <span className="block text-xs text-muted">
              {content.length}/{COMMENT_CONTENT_MAX_LENGTH}
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !author || !content}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : !isAdmin ? (
        <p className="mt-8 text-sm text-muted">
          Comments are currently closed for new posts.
        </p>
      ) : null}
    </section>
  );
}
