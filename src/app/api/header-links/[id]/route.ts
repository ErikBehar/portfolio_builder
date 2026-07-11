import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { validateHeaderLinkInput } from "@/lib/headerLinks";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const link = await prisma.headerLink.findUnique({ where: { id } });
  if (!link) {
    return NextResponse.json({ error: "Header link not found" }, { status: 404 });
  }

  return NextResponse.json(link);
}

export async function PUT(request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = await request.json();

  const existing = await prisma.headerLink.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Header link not found" }, { status: 404 });
  }

  const validationError = validateHeaderLinkInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const link = await prisma.headerLink.update({
    where: { id },
    data: {
      label: body.label.trim(),
      url: body.url.trim(),
      icon: body.icon,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(link);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await context.params;

  const link = await prisma.headerLink.findUnique({ where: { id } });
  if (!link) {
    return NextResponse.json({ error: "Header link not found" }, { status: 404 });
  }

  await prisma.headerLink.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
