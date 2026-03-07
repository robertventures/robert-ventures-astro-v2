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
