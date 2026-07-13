const ADMIN_FLASH_KEY = "portfolio:admin-flash";
export const ADMIN_FLASH_EVENT = "portfolio:admin-flash";

export function setAdminFlash(message: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_FLASH_KEY, message);
  } catch {
    // Ignore private-mode / quota failures.
  }
  window.dispatchEvent(new CustomEvent(ADMIN_FLASH_EVENT, { detail: message }));
}

export function consumeAdminFlash(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const message = sessionStorage.getItem(ADMIN_FLASH_KEY);
    if (message) {
      sessionStorage.removeItem(ADMIN_FLASH_KEY);
    }
    return message;
  } catch {
    return null;
  }
}
