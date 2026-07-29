import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";
import type { CommentParentType } from "@/lib/comments";

export type AdminCommentItem = {
  id: string;
  parentType: CommentParentType;
  parentId: string;
  parentTitle: string;
  parentHref: string;
  adminHref: string;
  author: string;
  content: string;
  seenAt: string | null;
  createdAt: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function getUnreadCommentCount(): Promise<number> {
  const [logCount, projectCount] = await Promise.all([
    prisma.comment.count({ where: { seenAt: null } }),
    prisma.projectComment.count({ where: { seenAt: null } }),
  ]);
  return logCount + projectCount;
}

export async function listAdminComments(options?: {
  unreadOnly?: boolean;
}): Promise<AdminCommentItem[]> {
  const unreadOnly = options?.unreadOnly ?? false;
  const where = unreadOnly ? { seenAt: null } : {};

  const [logComments, projectComments] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        logEntry: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.projectComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: { id: true, title: true, slug: true, section: true },
        },
      },
    }),
  ]);

  const items: AdminCommentItem[] = [
    ...logComments.map((comment) => ({
      id: comment.id,
      parentType: "log" as const,
      parentId: comment.logEntryId,
      parentTitle: comment.logEntry.title,
      parentHref: `/log/${comment.logEntry.slug}`,
      adminHref: `/admin/log/${comment.logEntry.id}`,
      author: comment.author,
      content: comment.content,
      seenAt: comment.seenAt?.toISOString() ?? null,
      createdAt: comment.createdAt.toISOString(),
    })),
    ...projectComments.map((comment) => ({
      id: comment.id,
      parentType: "project" as const,
      parentId: comment.projectId,
      parentTitle: comment.project.title,
      parentHref: `/${comment.project.section}/${comment.project.slug}`,
      adminHref: `/admin/${comment.project.section}/${comment.project.id}`,
      author: comment.author,
      content: comment.content,
      seenAt: comment.seenAt?.toISOString() ?? null,
      createdAt: comment.createdAt.toISOString(),
    })),
  ];

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return items;
}

export async function markCommentsSeen(input: {
  all?: boolean;
  items?: Array<{ id: string; parentType: CommentParentType }>;
}): Promise<{ marked: number }> {
  const now = new Date();

  if (input.all) {
    const [logResult, projectResult] = await Promise.all([
      prisma.comment.updateMany({
        where: { seenAt: null },
        data: { seenAt: now },
      }),
      prisma.projectComment.updateMany({
        where: { seenAt: null },
        data: { seenAt: now },
      }),
    ]);
    return { marked: logResult.count + projectResult.count };
  }

  const items = input.items ?? [];
  if (items.length === 0) {
    throw new ApiError("Provide comment items or set all to true", 400);
  }

  let marked = 0;
  for (const item of items) {
    if (item.parentType === "log") {
      const result = await prisma.comment.updateMany({
        where: { id: item.id, seenAt: null },
        data: { seenAt: now },
      });
      marked += result.count;
      continue;
    }

    if (item.parentType === "project") {
      const result = await prisma.projectComment.updateMany({
        where: { id: item.id, seenAt: null },
        data: { seenAt: now },
      });
      marked += result.count;
      continue;
    }

    throw new ApiError("Invalid parent type", 400);
  }

  return { marked };
}

export function buildCommentNotificationEmail(input: {
  siteTitle: string;
  author: string;
  content: string;
  parentType: CommentParentType;
  parentTitle: string;
  parentUrl: string;
  adminCommentsUrl: string;
}) {
  const parentLabel = input.parentType === "log" ? "log entry" : "project";
  const subject = `New comment on ${input.siteTitle}: ${input.parentTitle}`;
  const preview = input.content.length > 280
    ? `${input.content.slice(0, 277)}...`
    : input.content;

  const text = [
    `Someone left a comment on your ${parentLabel} "${input.parentTitle}".`,
    "",
    `From: ${input.author}`,
    "",
    preview,
    "",
    `View page: ${input.parentUrl}`,
    `Admin comments: ${input.adminCommentsUrl}`,
  ].join("\n");

  const html = `
    <p>Someone left a comment on your ${escapeHtml(parentLabel)} <strong>${escapeHtml(input.parentTitle)}</strong>.</p>
    <p><strong>From:</strong> ${escapeHtml(input.author)}</p>
    <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #5b9fd4;background:#f4f6f8;">
      ${escapeHtml(preview).replaceAll("\n", "<br />")}
    </blockquote>
    <p>
      <a href="${escapeHtml(input.parentUrl)}">View page</a>
      &nbsp;·&nbsp;
      <a href="${escapeHtml(input.adminCommentsUrl)}">Open admin comments</a>
    </p>
  `.trim();

  return { subject, text, html };
}
