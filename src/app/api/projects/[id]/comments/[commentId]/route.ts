import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string; commentId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id, commentId } = await context.params;
  const body = await request.json();

  const comment = await prisma.projectComment.findFirst({
    where: { id: commentId, projectId: id },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (!body.author?.trim() || !body.content?.trim()) {
    return NextResponse.json(
      { error: "Name and comment are required" },
      { status: 400 }
    );
  }

  const updated = await prisma.projectComment.update({
    where: { id: commentId },
    data: {
      author: body.author.trim(),
      content: body.content.trim(),
    },
  });

  return NextResponse.json({
    id: updated.id,
    author: updated.author,
    content: updated.content,
    createdAt: updated.createdAt.toISOString(),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id, commentId } = await context.params;

  const comment = await prisma.projectComment.findFirst({
    where: { id: commentId, projectId: id },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  await prisma.projectComment.delete({ where: { id: commentId } });
  return NextResponse.json({ success: true });
}
