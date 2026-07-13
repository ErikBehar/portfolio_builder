/**
 * Only allow same-origin relative admin paths after login.
 * Rejects protocol-relative URLs, absolute URLs, and non-admin paths.
 */
export function safeAdminRedirectPath(
  from: string | null | undefined
): string {
  const fallback = "/admin";
  if (!from || typeof from !== "string") return fallback;

  const value = from.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (value.includes("\\")) return fallback;
  if (!value.startsWith("/admin")) return fallback;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || decoded.includes("://")) return fallback;
    if (!decoded.startsWith("/admin")) return fallback;
  } catch {
    return fallback;
  }

  return value;
}
