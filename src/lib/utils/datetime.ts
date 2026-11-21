const EMPTY = "—";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const pad = (value: number, length = 2): string => String(value).padStart(length, "0");

/** Formats a Date as "YYYY-MM-DDTHH:mm" in local time (for datetime-local inputs). */
export function toDateTimeLocalValue(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/** Parses a "YYYY-MM-DDTHH:mm" local value. Returns null when invalid or out of range. */
export function fromDateTimeLocalValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  const date = new Date(year, month - 1, day, hour, minute);
  const isSameValue =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute;

  return isSameValue ? date : null;
}

/** e.g. "21 Nov, 10:30 PM" in the user's local timezone. */
export function formatDateTime(date: Date | null): string {
  if (!date) {
    return EMPTY;
  }
  return DATE_TIME_FORMAT.format(date);
}

/** e.g. "10:30 PM" in the user's local timezone. */
export function formatTimeOnly(date: Date | null): string {
  if (!date) {
    return EMPTY;
  }
  return TIME_FORMAT.format(date);
}

/** e.g. "Expires in 2h 10m", "Expired", or "—" when there is no expiry. */
export function formatRelativeExpiry(expiresAt: Date | null, now: Date): string {
  if (!expiresAt) {
    return EMPTY;
  }

  const remainingMs = expiresAt.getTime() - now.getTime();
  if (remainingMs <= 0) {
    return "Expired";
  }

  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `Expires in ${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `Expires in ${minutes}m`;
  }
  return "Expires in <1m";
}
