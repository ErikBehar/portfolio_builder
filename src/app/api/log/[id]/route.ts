import { NextResponse } from "next/server";
import { parseDateInput } from "@/lib/dates";
import { prisma, slugify } from "@/lib/db";
import { deleteRemovedUploads, deleteUploadFiles } from "@/lib/uploads";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const entry = await prisma.logEntry.findUnique({
    where: { id },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });

  if (!entry) {
    return NextResponse.json({ error: "Log entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();

  const existing = await prisma.logEntry.findUnique({
    where: { id },
    include: { media: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Log entry not found" }, { status: 404 });
  }

  const slug = slugify(body.title);
  const conflict = await prisma.logEntry.findFirst({
    where: { slug, NOT: { id } },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "A log entry with this title already exists" },
      { status: 409 }
    );
  }

  const previousUrls = existing.media.map((item) => item.url);
  const nextUrls = (body.media ?? []).map(
    (item: { url: string }) => item.url
  );
  await deleteRemovedUploads(previousUrls, nextUrls);

  await prisma.logMedia.deleteMany({ where: { logEntryId: id } });

  const entry = await prisma.logEntry.update({
    where: { id },
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const entry = await prisma.logEntry.findUnique({
    where: { id },
    include: { media: true },
  });

  if (!entry) {
    return NextResponse.json({ error: "Log entry not found" }, { status: 404 });
  }

  const mediaUrls = entry.media.map((item) => item.url);

  await prisma.logEntry.delete({ where: { id } });
  await deleteUploadFiles(mediaUrls);

  return NextResponse.json({ success: true });
}
