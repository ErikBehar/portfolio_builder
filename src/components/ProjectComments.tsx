"use client";

import { useState } from "react";
import type { ProjectComment } from "@/lib/types";

type ProjectCommentsProps = {
  projectId: string;
  initialComments: ProjectComment[];
  commentsEnabled: boolean;
};

function formatCommentDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ProjectComments({
  projectId,
  initialComments,
  commentsEnabled,
}: ProjectCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}/comments`, {
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

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="text-xl font-semibold">
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {commentsEnabled
            ? "No comments yet. Be the first."
            : "No comments on this project."}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-medium">{comment.author}</span>
                <time className="text-xs text-muted" dateTime={comment.createdAt}>
                  {formatCommentDate(comment.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {comment.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      {commentsEnabled ? (
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
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Write a comment..."
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !author || !content}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mt-8 text-sm text-muted">
          Comments are currently closed for new posts.
        </p>
      )}
    </section>
  );
}
