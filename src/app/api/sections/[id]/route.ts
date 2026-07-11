import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { parseCategories } from "@/lib/sections";
import {
  buildSectionSlug,
  normalizeSectionColor,
  validateSectionColor,
  validateSectionSlug,
} from "@/lib/sectionValidation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const section = await prisma.portfolioSection.findUnique({ where: { id } });
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...section,
    categories: parseCategories(section.categories),
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.portfolioSection.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!body.description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const slug = buildSectionSlug(body.title, body.slug);
    const slugError = validateSectionSlug(slug);
    if (slugError) {
      return NextResponse.json({ error: slugError }, { status: 400 });
    }

    const conflict = await prisma.portfolioSection.findFirst({
      where: { slug, NOT: { id } },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "A section with this slug already exists" },
        { status: 409 }
      );
    }

    const color = normalizeSectionColor(body.color);
    const colorError = validateSectionColor(color);
    if (colorError) {
      return NextResponse.json({ error: colorError }, { status: 400 });
    }

    const section = await prisma.portfolioSection.update({
      where: { id },
      data: {
        title: body.title.trim(),
        slug,
        description: body.description.trim(),
        color,
        categories: JSON.stringify(body.categories ?? []),
        sortOrder: body.sortOrder ?? 0,
      },
    });

    if (existing.slug !== slug) {
      await prisma.project.updateMany({
        where: { section: existing.slug },
        data: { section: slug },
      });
    }

    return NextResponse.json({
      ...section,
      categories: parseCategories(section.categories),
    });
  } catch (error) {
    console.error("Failed to update section:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update section";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  const section = await prisma.portfolioSection.findUnique({ where: { id } });
  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const projectCount = await prisma.project.count({
    where: { section: section.slug },
  });

  if (projectCount > 0) {
    return NextResponse.json(
      {
        error: `This section has ${projectCount} project(s). Delete them first.`,
      },
      { status: 409 }
    );
  }

  await prisma.portfolioSection.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
