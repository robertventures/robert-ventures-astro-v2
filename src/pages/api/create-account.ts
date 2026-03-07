export const prerender = false;
import type { APIRoute } from "astro";
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
 *   2. Country check — reads the CF-IPCountry header Cloudflare injects on every
 *      request. No external API call needed — Cloudflare already knows the country.
 *      Only "US" is allowed. VPNs ("T1"), unknown IPs ("XX"), and all other
 *      countries are blocked. Absent header (local dev) → fail-open.
 */
export const POST: APIRoute = async ({ request }) => {
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

    // ── 2. COUNTRY CHECK (via Cloudflare header) ───────────────────────────
    // Cloudflare automatically sets CF-IPCountry on every request with the
    // visitor's ISO 3166-1 alpha-2 country code (e.g. "US", "GB", "DE").
    // VPNs and anonymising proxies are tagged "T1". Unknown IPs are tagged "XX".
    // This header is injected server-side — it cannot be spoofed by the client.
    //
    // Only allow "US". Everything else is blocked, including VPNs ("T1") and
    // unresolvable IPs ("XX"). Fail-open only when the header is absent entirely
    // (local dev without Cloudflare in front).
    const cfCountry = (request.headers.get("cf-ipcountry") || "").trim().toUpperCase();
    if (cfCountry && cfCountry !== "US") {
      console.log("🌍 Non-US registration blocked:", { country: cfCountry });
      return new Response(
        JSON.stringify({ detail: "Registration is currently only available in the United States" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 3. FORWARD TO EXTERNAL API ─────────────────────────────────────────
    // Strip the honeypot field — invest.robertventures.com only expects
    // { email, phone, password }.
    const { website: _honeypot, ...forwardBody } = body;
    const extRes = await fetch("https://invest.robertventures.com/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forwardBody),
    });

    const extText = await extRes.text();

    if (!extRes.ok) {
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
