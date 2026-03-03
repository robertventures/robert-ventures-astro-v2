export const prerender = false;
import type { APIRoute } from "astro";

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
 *      Absent header (local dev) or unrecognised values → fail-open (allow).
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();

        // ── 1. HONEYPOT CHECK ──────────────────────────────────────────────────
        // The hidden `website` input is invisible to real users (off-screen CSS,
        // tabindex=-1, autocomplete=off). Bots auto-fill it.
        // Return a generic error — don't reveal to bots that they were detected.
        if (body.website && body.website.trim() !== "") {
            console.log("🤖 Honeypot triggered — rejecting bot submission");
            return new Response(
                JSON.stringify({ detail: "Registration failed. Please try again." }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // ── 2. COUNTRY CHECK (via Cloudflare header) ───────────────────────────
        // Cloudflare automatically sets CF-IPCountry on every request with the
        // visitor's ISO 3166-1 alpha-2 country code (e.g. "US", "GB", "DE").
        // This header is injected server-side by Cloudflare — it cannot be
        // spoofed by the client.
        //
        // Fail-open cases (allow registration):
        //   - Header absent → Cloudflare not in front (e.g. local dev)
        //   - "XX" → Cloudflare could not determine the country
        //   - "T1" → Tor network (treated as unknown)
        const cfCountry = (request.headers.get("cf-ipcountry") || "").trim().toUpperCase();
        const countryKnown = cfCountry && cfCountry !== "XX" && cfCountry !== "T1";

        if (countryKnown && cfCountry !== "US") {
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
        return new Response(extText, {
            status: extRes.status,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("❌ create-account error:", error);
        return new Response(
            JSON.stringify({ detail: "An error occurred. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
