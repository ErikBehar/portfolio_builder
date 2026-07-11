import { NextResponse } from "next/server";
import { parseDateInput } from "@/lib/dates";
import { prisma, slugify } from "@/lib/db";

export async function GET() {
  const entries = await prisma.logEntry.findMany({
    orderBy: { date: "desc" },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (!body.date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const slug = slugify(body.title);
  const existing = await prisma.logEntry.findUnique({ where: { slug } });

  if (existing) {
    return NextResponse.json(
      { error: "A log entry with this title already exists" },
      { status: 409 }
    );
  }

  const entry = await prisma.logEntry.create({
    data: {
      title: body.title.trim(),
      slug,
      content: body.content.trim(),
      date: parseDateInput(body.date),
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
    include: { media: true },
  });

  return NextResponse.json(entry);
}
