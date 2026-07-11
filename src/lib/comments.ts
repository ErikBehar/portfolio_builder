import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";
import { getSiteSettings } from "@/lib/siteSettings";
import type { LogComment } from "@/lib/types";

export type CommentParentType = "log" | "project";

function serializeComment(comment: {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}): LogComment {
  return {
    id: comment.id,
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  };
}

function validateCommentInput(body: { author?: string; content?: string }) {
  if (!body.author?.trim() || !body.content?.trim()) {
    throw new ApiError("Name and comment are required", 400);
  }

  return {
    author: body.author.trim(),
    content: body.content.trim(),
  };
}

async function assertCommentsEnabled(parentType: CommentParentType) {
  const siteSettings = await getSiteSettings();

  if (parentType === "log" && !siteSettings.commentsEnabled) {
    throw new ApiError("Comments are currently disabled", 403);
  }

  if (parentType === "project" && !siteSettings.projectCommentsEnabled) {
    throw new ApiError("Comments are currently disabled", 403);
  }
}

export async function getComments(
  parentType: CommentParentType,
  parentId: string
): Promise<LogComment[]> {
  if (parentType === "log") {
    const comments = await prisma.comment.findMany({
      where: { logEntryId: parentId },
      orderBy: { createdAt: "asc" },
    });
    return comments.map(serializeComment);
  }

  const comments = await prisma.projectComment.findMany({
    where: { projectId: parentId },
    orderBy: { createdAt: "asc" },
  });
  return comments.map(serializeComment);
}

export async function createComment(
  parentType: CommentParentType,
  parentId: string,
  body: { author?: string; content?: string }
): Promise<LogComment> {
  const input = validateCommentInput(body);

  if (parentType === "log") {
    const entry = await prisma.logEntry.findUnique({ where: { id: parentId } });
    if (!entry) throw new ApiError("Log entry not found", 404);
    await assertCommentsEnabled("log");

    const comment = await prisma.comment.create({
      data: {
        logEntryId: parentId,
        author: input.author,
        content: input.content,
      },
    });
    return serializeComment(comment);
  }

  const project = await prisma.project.findUnique({ where: { id: parentId } });
  if (!project) throw new ApiError("Project not found", 404);
  await assertCommentsEnabled("project");

  const comment = await prisma.projectComment.create({
    data: {
      projectId: parentId,
      author: input.author,
      content: input.content,
    },
  });
  return serializeComment(comment);
}

export async function updateComment(
  parentType: CommentParentType,
  parentId: string,
  commentId: string,
  body: { author?: string; content?: string }
): Promise<LogComment> {
  const input = validateCommentInput(body);

  if (parentType === "log") {
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, logEntryId: parentId },
    });
    if (!comment) throw new ApiError("Comment not found", 404);

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: input,
    });
    return serializeComment(updated);
  }

  const comment = await prisma.projectComment.findFirst({
    where: { id: commentId, projectId: parentId },
  });
  if (!comment) throw new ApiError("Comment not found", 404);

  const updated = await prisma.projectComment.update({
    where: { id: commentId },
    data: input,
  });
  return serializeComment(updated);
}

export async function deleteComment(
  parentType: CommentParentType,
  parentId: string,
  commentId: string
) {
  if (parentType === "log") {
    const comment = await prisma.comment.findFirst({
      where: { id: commentId, logEntryId: parentId },
    });
    if (!comment) throw new ApiError("Comment not found", 404);
    await prisma.comment.delete({ where: { id: commentId } });
    return;
  }

  const comment = await prisma.projectComment.findFirst({
    where: { id: commentId, projectId: parentId },
  });
  if (!comment) throw new ApiError("Comment not found", 404);
  await prisma.projectComment.delete({ where: { id: commentId } });
}
