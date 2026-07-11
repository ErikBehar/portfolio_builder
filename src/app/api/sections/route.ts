import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import { createSection, getSections } from "@/lib/sections";

export async function GET() {
  const sections = await getSections();
  return NextResponse.json(sections);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const section = await createSection(body);
    return NextResponse.json(section);
  } catch (error) {
    return handleApiError(error);
  }
}
