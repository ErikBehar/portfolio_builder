import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/siteSettings";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const comments = await prisma.projectComment.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    comments.map((comment) => ({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const siteSettings = await getSiteSettings();
  if (!siteSettings.projectCommentsEnabled) {
    return NextResponse.json(
      { error: "Comments are currently disabled" },
      { status: 403 }
    );
  }

  if (!body.author?.trim() || !body.content?.trim()) {
    return NextResponse.json(
      { error: "Name and comment are required" },
      { status: 400 }
    );
  }

  const comment = await prisma.projectComment.create({
    data: {
      projectId: id,
      author: body.author.trim(),
      content: body.content.trim(),
    },
  });

  return NextResponse.json({
    id: comment.id,
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  });
}
