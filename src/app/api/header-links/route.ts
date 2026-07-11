import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import { createHeaderLink, getHeaderLinks } from "@/lib/headerLinks";

export async function GET() {
  const links = await getHeaderLinks();
  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const link = await createHeaderLink(body);
    return NextResponse.json(link);
  } catch (error) {
    return handleApiError(error);
  }
}
