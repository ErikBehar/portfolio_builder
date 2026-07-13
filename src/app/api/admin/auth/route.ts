import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  clearAdminSessionCookie,
  createAdminToken,
  rotateAdminSessionVersion,
  verifyAdminPassword,
  verifyAdminToken,
} from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.password || typeof body.password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  if (!verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, await createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Valid sessions bump the version so any copied cookie stops working.
  if (await verifyAdminToken(token)) {
    await rotateAdminSessionVersion();
  }

  const response = NextResponse.json({ success: true });
  clearAdminSessionCookie(response);
  return response;
}
