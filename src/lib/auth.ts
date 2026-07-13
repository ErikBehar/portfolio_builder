import { prisma } from "@/lib/db";
import {
  COOKIE_NAME,
  PAYLOAD_PREFIX,
  TOKEN_SEPARATOR,
} from "@/lib/authConstants";
import { SITE_SETTINGS_ID, ensureDefaultSiteSettings } from "@/lib/siteSettings";

export { COOKIE_NAME } from "@/lib/authConstants";

function getAdminSecret(): string {
  return process.env.ADMIN_SECRET ?? "change-me-in-production";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return toBase64Url(new Uint8Array(signature));
}

export function verifyAdminPassword(password: string): boolean {
  return password === getAdminSecret();
}

export async function getAdminSessionVersion(): Promise<number> {
  await ensureDefaultSiteSettings();
  const settings = await prisma.siteSettings.findUniqueOrThrow({
    where: { id: SITE_SETTINGS_ID },
    select: { adminSessionVersion: true },
  });
  return settings.adminSessionVersion ?? 1;
}

export async function rotateAdminSessionVersion(): Promise<number> {
  await ensureDefaultSiteSettings();
  const settings = await prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: { adminSessionVersion: { increment: 1 } },
    select: { adminSessionVersion: true },
  });
  return settings.adminSessionVersion;
}

export async function createAdminToken(): Promise<string> {
  const version = await getAdminSessionVersion();
  const payload = toBase64Url(
    new TextEncoder().encode(`${PAYLOAD_PREFIX}${version}`)
  );
  const signature = await signPayload(getAdminSecret(), payload);
  return `${payload}${TOKEN_SEPARATOR}${signature}`;
}

export async function verifyAdminToken(
  token: string | undefined
): Promise<boolean> {
  if (!token) return false;

  const [payload, signature] = token.split(TOKEN_SEPARATOR);
  if (!payload || !signature) return false;

  const expected = await signPayload(getAdminSecret(), payload);
  if (signature !== expected) return false;

  try {
    const text = new TextDecoder().decode(fromBase64Url(payload));
    if (!text.startsWith(PAYLOAD_PREFIX)) return false;
    const version = Number(text.slice(PAYLOAD_PREFIX.length));
    if (!Number.isInteger(version) || version < 1) return false;
    const current = await getAdminSessionVersion();
    return version === current;
  } catch {
    return false;
  }
}

export function clearAdminSessionCookie(response: {
  cookies: {
    set: (
      name: string,
      value: string,
      options: Record<string, unknown>
    ) => void;
  };
}) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
