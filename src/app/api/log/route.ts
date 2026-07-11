import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import { createLogEntry, getLogEntries } from "@/lib/log";

export async function GET() {
  const entries = await getLogEntries();
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const entry = await createLogEntry(body);
    return NextResponse.json(entry);
  } catch (error) {
    return handleApiError(error);
  }
}
