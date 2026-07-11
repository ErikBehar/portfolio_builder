import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { parseDateInput } from "@/lib/dates";
import { parseLinks, prisma, slugify } from "@/lib/db";
import { resolveCoverMediaId } from "@/lib/media";
import { syncProjectLabels } from "@/lib/projects";
import { getSection } from "@/lib/sections";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  const projects = await prisma.project.findMany({
    where: section ? { section } : undefined,
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      labels: { include: { label: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    projects.map((project) => ({
      ...project,
      links: parseLinks(project.links),
      labels: project.labels.map((entry) => entry.label),
    }))
  );
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const section = await getSection(body.section);

  if (!section) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = slugify(body.title);
  const existing = await prisma.project.findFirst({
    where: { section: section.slug, slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A project with this title already exists in this section" },
      { status: 409 }
    );
  }

  const project = await prisma.project.create({
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
