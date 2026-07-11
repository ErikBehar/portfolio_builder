import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { parseDateInput } from "@/lib/dates";
import { parseLinks, prisma, slugify } from "@/lib/db";
import { resolveCoverMediaId } from "@/lib/media";
import { syncProjectLabels } from "@/lib/projects";
import { getSection } from "@/lib/sections";
import { deleteRemovedUploads, deleteUploadFiles } from "@/lib/uploads";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      labels: { include: { label: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...project,
    links: parseLinks(project.links),
    labels: project.labels.map((entry) => entry.label),
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = await request.json();
  const section = await getSection(body.section);

  if (!section) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const slug = slugify(body.title);
  const conflict = await prisma.project.findFirst({
    where: {
      section: section.slug,
      slug,
      NOT: { id },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "A project with this title already exists in this section" },
      { status: 409 }
    );
  }

  const previousUrls = existing.media.map((item) => item.url);
  const nextUrls = (body.media ?? []).map(
    (item: { url: string }) => item.url
  );
  await deleteRemovedUploads(previousUrls, nextUrls);

  await prisma.media.deleteMany({ where: { projectId: id } });

  const project = await prisma.project.update({
    where: { id },
    data: {
      title: body.title.trim(),
      slug,
      description: body.description ?? null,
      section: section.slug,
      category: body.category ?? null,
      links: JSON.stringify(body.links ?? []),
      createdAt: body.createdAt ? parseDateInput(body.createdAt) : undefined,
      media: {
        create: (body.media ?? []).map(
          (
            item: { type: string; url: string; caption?: string },
            index: number
          ) => ({
            type: item.type,
            url: item.url,
            caption: item.caption ?? null,
            sortOrder: index,
          })
        ),
      },
    },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      labels: { include: { label: true } },
    },
  });

  const coverMediaId = resolveCoverMediaId(
    project.media,
    body.previewMediaIndex
  );

  const savedProject =
    coverMediaId === project.coverMediaId
      ? project
      : await prisma.project.update({
          where: { id: project.id },
          data: { coverMediaId },
          include: {
            media: { orderBy: { sortOrder: "asc" } },
            labels: { include: { label: true } },
          },
        });

  await syncProjectLabels(project.id, body.labelIds);

  const withLabels = await prisma.project.findUnique({
    where: { id: savedProject.id },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      labels: { include: { label: true } },
    },
  });

  return NextResponse.json({
    ...withLabels,
    links: parseLinks(withLabels!.links),
    labels: withLabels!.labels.map((entry) => entry.label),
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { media: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const mediaUrls = project.media.map((item) => item.url);

  await prisma.project.delete({ where: { id } });
  await deleteUploadFiles(mediaUrls);

  return NextResponse.json({ success: true });
}
