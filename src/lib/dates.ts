/** Format a comment timestamp for display. */
export function formatCommentDate(
  date: string,
  options?: { includeTime?: boolean }
) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(options?.includeTime
      ? { hour: "numeric", minute: "2-digit" as const }
      : {}),
  });
}

/** Parse a YYYY-MM-DD form value as a stable calendar date (noon UTC). */
export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/** Format a stored date for display as a calendar date. */
export function formatLogDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Format a stored date as YYYY-MM-DD for <input type="date">. */
export function toDateInputValue(date: string | Date): string {
  const value = new Date(date);
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's local calendar date as YYYY-MM-DD. */
export function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** ISO date key for <time dateTime> attributes. */
export function toDateKey(date: string | Date): string {
  return toDateInputValue(date);
}

/** Validate a YYYY-MM-DD string. */
export function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Build a YYYY-MM-DD string from local calendar parts. */
export function buildDateInputValue(
  year: number,
  month: number,
  day: number
): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parse a YYYY-MM-DD string into local calendar parts. */
export function parseDateInputParts(value: string) {
  if (!isValidDateInput(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}
