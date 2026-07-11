import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, isAdminAuthenticated } from "@/lib/auth";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await isAdminAuthenticated(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
