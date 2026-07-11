import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getHeaderLinks, validateHeaderLinkInput } from "@/lib/headerLinks";

export async function GET() {
  const links = await getHeaderLinks();
  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const validationError = validateHeaderLinkInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const link = await prisma.headerLink.create({
    data: {
      label: body.label.trim(),
      url: body.url.trim(),
      icon: body.icon,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(link);
}
