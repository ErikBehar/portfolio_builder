import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { buildLabelSlug, validateLabelSlug } from "@/lib/labels";
import { SHOW_LABEL_SLUG } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  return NextResponse.json(label);
}

export async function PUT(request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = await request.json();

  const existing = await prisma.label.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = buildLabelSlug(body.name, body.slug);
  const slugError = validateLabelSlug(slug);
  if (slugError) {
    return NextResponse.json({ error: slugError }, { status: 400 });
  }

  const conflict = await prisma.label.findFirst({
    where: { slug, NOT: { id } },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "A label with this slug already exists" },
      { status: 409 }
    );
  }

  const label = await prisma.label.update({
    where: { id },
    data: {
      name: body.name.trim(),
      slug,
    },
  });

  return NextResponse.json(label);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  if (label.slug === SHOW_LABEL_SLUG) {
    return NextResponse.json(
      { error: "The default show label cannot be deleted" },
      { status: 400 }
    );
  }

  await prisma.label.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
