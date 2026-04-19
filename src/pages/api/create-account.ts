export const prerender = false;
import type { APIRoute } from "astro";
import { getRequestCountry } from "../../lib/getRequestCountry";
import { notifySlack } from "../../lib/notifySlack";
import { createAccountSchema } from "../../lib/schemas/create-account.schema";

/**
 * Proxy route for account creation on the /invest page.
 *
 * Sits between the browser and invest.robertventures.com/api/profile.
 * Runs two spam checks server-side (where they cannot be bypassed by bots),
 * then forwards clean requests to the external API.
 *
 * Checks:
 *   1. Honeypot field — bots fill the hidden `website` field; humans don't see it
 *   2. Country check — reads Netlify's context.geo via Astro locals. Only "US"
 *      is allowed. The Netlify edge function in netlify.toml already blocks
 *      non-US traffic at the CDN layer; this is a backup.
 *      No geo data (local dev) → fail-open.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const rawBody = await request.json();

    // Validate that email is present and well-formed before forwarding to the
    // external API. Missing email would also break the Slack error notification.
    const parseResult = createAccountSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return new Response(JSON.stringify({ detail: "Invalid request", details: issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = parseResult.data;

    // ── 1. HONEYPOT CHECK ──────────────────────────────────────────────────
    // The hidden `website` input is invisible to real users (off-screen CSS,
    // tabindex=-1, autocomplete=off). Bots auto-fill it.
    // Return a generic error — don't reveal to bots that they were detected.
    if (body.website && body.website.trim() !== "") {
      console.log("🤖 Honeypot triggered — rejecting bot submission");
      return new Response(JSON.stringify({ detail: "Registration failed. Please try again." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── 2. COUNTRY CHECK (via Netlify context.geo) ─────────────────────────
    // The Astro Netlify adapter exposes geo data at locals.netlify.context.geo.
    // The edge function in netlify.toml already blocks non-US traffic at the CDN
    // layer — this is a defense-in-depth backup in case the edge function is ever
    // removed or misconfigured. Fail-open only when no geo data is available
    // (local dev without Netlify in front).
    const country = getRequestCountry(request, locals);
    if (country && country !== "US") {
      console.log("🌍 Non-US registration blocked:", { country });
      return new Response(
        JSON.stringify({ detail: "Registration is currently only available in the United States" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 3. EXTRACT REAL CLIENT IP ──────────────────────────────────────────
    // Netlify provides the visitor's real IP in these headers.
    // x-nf-client-connection-ip is the most reliable (Netlify built-in),
    // x-real-client-ip is stamped by our edge function (geo-block.js),
    // x-forwarded-for is the standard proxy header (first IP in the list).
    const clientIp =
      request.headers.get("x-nf-client-connection-ip") ||
      request.headers.get("x-real-client-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "";

    // ── 4. FORWARD TO EXTERNAL API ─────────────────────────────────────────
    // Replace the honeypot value with "" — the backend requires the website
    // field as an empty string (it's part of its own honeypot check).
    const { website: _honeypot, ...rest } = body;
    const forwardBody = { ...rest, website: "" };
    const extRes = await fetch("https://invest.robertventures.com/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientIp && { "x-real-client-ip": clientIp }),
      },
      body: JSON.stringify(forwardBody),
    });

    const extText = await extRes.text();

    if (!extRes.ok) {
      // Detect the "account already exists" case and return a canonical
      // { errorCode: "ACCOUNT_EXISTS" } + 409 so the client can render a login
      // CTA without string-matching the backend's detail field. This is expected
      // user behavior, not an incident, so we skip the Slack alert in this case.
      let parsed: any = null;
      try {
        parsed = JSON.parse(extText);
      } catch {
        // non-JSON response — leave parsed as null
      }
      const message =
        typeof parsed?.detail === "string"
          ? parsed.detail
          : typeof parsed?.message === "string"
            ? parsed.message
            : "";
      const isAccountExists = /already|exists/i.test(message);

      if (isAccountExists) {
        return new Response(
          JSON.stringify({
            errorCode: "ACCOUNT_EXISTS",
            detail: "An account with this email already exists.",
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      await notifySlack(
        "Account Creation",
        "External API Error",
        `Status ${extRes.status}: ${extText.slice(0, 200)}`,
        body.email
      );
    }

    return new Response(extText, {
      status: extRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ create-account error:", error);
    await notifySlack("Account Creation", "Unhandled Error", String(error));
    return new Response(JSON.stringify({ detail: "An error occurred. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
