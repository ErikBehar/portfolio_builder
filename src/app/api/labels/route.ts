import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { buildLabelSlug, getLabels, validateLabelSlug } from "@/lib/labels";

export async function GET() {
  const labels = await getLabels();

  return NextResponse.json(labels);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = buildLabelSlug(body.name, body.slug);
  const slugError = validateLabelSlug(slug);

  if (slugError) {
    return NextResponse.json({ error: slugError }, { status: 400 });
  }

  const existing = await prisma.label.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "A label with this slug already exists" },
      { status: 409 }
    );
  }

  const label = await prisma.label.create({
    data: {
      name: body.name.trim(),
      slug,
    },
  });

  return NextResponse.json(label);
}
