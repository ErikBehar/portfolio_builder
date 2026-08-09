import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { resolveAdminEditHref } from "@/lib/adminEditHref";
import { handleApiError } from "@/lib/apiRoute";

export async function GET(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") ?? "";
    if (!path.startsWith("/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const href = await resolveAdminEditHref(path);
    return NextResponse.json({ href });
  } catch (error) {
    return handleApiError(error);
  }
}
