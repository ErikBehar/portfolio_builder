import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/authConstants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname === "/admin/login") {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Cookie presence only — full session verification (with DB-backed
  // version) happens in the admin layout / API requireAdmin checks.
  if (!request.cookies.get(COOKIE_NAME)?.value) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
