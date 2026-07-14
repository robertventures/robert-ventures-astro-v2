/**
 * Sends a notification to the #fires Slack channel when a registration fails.
 *
 * How it works: Slack gave us a special webhook URL. When we POST a JSON
 * message to that URL, Slack automatically posts it to the channel.
 * No SDK or login needed — just a fetch call.
 *
 * Safety guarantees:
 * - If SLACK_WEBHOOK_URL is not set (e.g. local dev), it silently does nothing
 * - If Slack itself is down, the try/catch ensures it never breaks the API response
 */
export async function notifySlack(
  endpoint: string,
  errorType: string,
  message: string,
  email?: string
) {
  const webhookUrl = import.meta.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const lines = [
    `🚨 *${endpoint} failed*`,
    `*Error:* ${errorType}`,
    `*Detail:* ${message}`,
    email ? `*Email:* ${email}` : null,
    `*Time:* ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines }),
    });
  } catch {
    // Never let a Slack failure break the actual API response
  }
}

/**
 * Formats "now" as an Eastern Time string, e.g. "2:41 PM ET, Mon Jul 13".
 * Used to timestamp team alerts in the timezone the sales team works in,
 * regardless of the server's local timezone.
 */
function formatEasternTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return `${get("hour")}:${get("minute")} ${get("dayPeriod")} ET, ${get("weekday")} ${get("month")} ${get("day")}`;
}

/**
 * Sends a neutral (non-error) alert to the sales team, e.g. an instant call
 * request that needs a callback. Unlike notifySlack, this carries no error
 * framing, it's just "here's a lead, go act on it."
 *
 * Posts to SLACK_SALES_WEBHOOK_URL when set, falling back to the same
 * SLACK_WEBHOOK_URL used for error alerts so this never requires new
 * config to start working.
 *
 * Safety guarantees mirror notifySlack: silently no-ops with no webhook,
 * and never throws (a failed Slack post must never break the API response).
 */
export async function notifySlackTeam(title: string, fields: Record<string, string>) {
  const webhookUrl =
    process.env.SLACK_SALES_WEBHOOK_URL ||
    import.meta.env.SLACK_SALES_WEBHOOK_URL ||
    process.env.SLACK_WEBHOOK_URL ||
    import.meta.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const lines = [
    `📞 *${title}*`,
    ...Object.entries(fields).map(([key, value]) => `*${key}:* ${value}`),
    `*Time:* ${formatEasternTime(new Date())}`,
  ].join("\n");

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines }),
    });
  } catch {
    // Never let a Slack failure break the actual API response
  }
}
