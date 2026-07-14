/**
 * Instant call availability window.
 *
 * The "call me in 15 minutes" offer on /offer/book-call is only available
 * Monday through Friday, 10:00am to 5:00pm America/New_York (Eastern).
 * "10:00 to 16:59" below means the window closes at 5:00pm sharp: the 16
 * hour (4pm) is the last full hour that counts, and 17:00 (5pm) does not.
 *
 * We resolve the wall-clock hour and weekday for the Eastern timezone with
 * Intl.DateTimeFormat instead of a date library. Intl always knows whether
 * a given instant falls in EDT or EST, so this is DST-safe by construction:
 * we never hardcode a UTC offset.
 */
export function isInstantCallWindow(date: Date = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hourPart = parts.find((p) => p.type === "hour")?.value;

  // hour12: false can render midnight as "24" in some environments, so
  // normalize with a modulo instead of assuming a 0-23 range.
  const hour = Number(hourPart) % 24;

  const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday || "");
  const isInHours = hour >= 10 && hour < 17;

  return isWeekday && isInHours;
}
