import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import { reorderHeaderLinks } from "@/lib/headerLinks";

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const links = await reorderHeaderLinks(body?.orderedIds);
    return NextResponse.json(links);
  } catch (error) {
    return handleApiError(error);
  }
}
