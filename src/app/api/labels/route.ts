import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import { createLabel, getLabels } from "@/lib/labels";

export async function GET() {
  const labels = await getLabels();
  return NextResponse.json(labels);
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const label = await createLabel(body);
    return NextResponse.json(label);
  } catch (error) {
    return handleApiError(error);
  }
}
