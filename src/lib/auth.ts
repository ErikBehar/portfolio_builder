const COOKIE_NAME = "admin_session";
const TOKEN_SEPARATOR = ".";
const PAYLOAD = "authenticated";

export { COOKIE_NAME };

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

export async function createAdminToken(): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(PAYLOAD));
  const signature = await signPayload(getAdminSecret(), payload);
  return `${payload}${TOKEN_SEPARATOR}${signature}`;
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const [payload, signature] = token.split(TOKEN_SEPARATOR);
  if (!payload || !signature) return false;

  const expected = await signPayload(getAdminSecret(), payload);
  return signature === expected;
}
