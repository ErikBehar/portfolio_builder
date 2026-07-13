import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return children;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!(await verifyAdminToken(token))) {
    const from =
      pathname && pathname.startsWith("/admin") && pathname !== "/admin/login"
        ? pathname
        : "/admin";
    redirect(`/admin/login?from=${encodeURIComponent(from)}`);
  }

  return children;
}
