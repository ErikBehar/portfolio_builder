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

export async function GET() {
  const sections = await prisma.portfolioSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return NextResponse.json(
    sections.map((section) => ({
      ...section,
      categories: parseCategories(section.categories),
    }))
  );
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();

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

  const existing = await prisma.portfolioSection.findUnique({ where: { slug } });
  if (existing) {
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

  const section = await prisma.portfolioSection.create({
    data: {
      title: body.title.trim(),
      slug,
      description: body.description.trim(),
      color,
      categories: JSON.stringify(body.categories ?? []),
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json({
    ...section,
    categories: parseCategories(section.categories),
  });
}
