/**
 * Resolve Contact API Route
 *
 * Turns a GHL contact id into that contact's email so the client can call
 * posthog.identify(email) without the email ever appearing in a URL. GHL
 * email/SMS links carry ?ph_id={{contact.id}} (an opaque ~20-char id);
 * posthogTracking.js sends it here and identifies with the answer. Meta/GA/
 * RedTrack capture full page URLs, so the id, not the email, is what leaks.
 *
 * Flow:
 * 1. Validate the id query param shape (base62, 15-32 chars)
 * 2. Geo gate (US only, fail-open without geo data, same as other routes)
 * 3. Look the contact up in GHL (v1 REST, 5s timeout)
 * 4. Return { email } normalized (trimmed + lowercased) to match the
 *    site-wide PostHog distinct id format
 *
 * Errors mapped to:
 *   404 — missing/malformed id, non-US, contact not found, or contact has
 *         no email (all intentionally the same silent shape: stale and
 *         forged ids are expected traffic, not incidents)
 *   502 — upstream GHL error (Slack-notified)
 *   500 — unhandled / missing configuration
 *
 * CORS: invest.robertventures.com is allowed so the investor portal can
 * reuse this endpoint instead of duplicating the GHL lookup.
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { getRequestCountry } from "../../lib/getRequestCountry";
import { notifySlack } from "../../lib/notifySlack";

const GHL_V1_BASE = "https://rest.gohighlevel.com/v1";
const GHL_TIMEOUT_MS = 5000;

// GHL contact ids are ~20-char base62 strings. The exact length isn't
// documented, so accept a safe range; anything else is junk traffic.
const CONTACT_ID_PATTERN = /^[A-Za-z0-9]{15,32}$/;

const RESPONSE_HEADERS = {
  "Content-Type": "application/json",
  // The success body contains an email; never let a shared cache store it.
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "https://invest.robertventures.com",
};

function notFound(): Response {
  return new Response(JSON.stringify({ email: null }), {
    status: 404,
    headers: RESPONSE_HEADERS,
  });
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GHL_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const GET: APIRoute = async ({ request, locals }) => {
  // Read from process.env first: import.meta.env.* is inlined at BUILD time,
  // so an env var added to Netlify after the last deploy would otherwise read
  // as undefined until the next build. process.env always reads live.
  const ghlApiKey = process.env.GHL_API_KEY || import.meta.env.GHL_API_KEY;

  try {
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!CONTACT_ID_PATTERN.test(id)) {
      return notFound();
    }

    // Geo gate (US only; fail-open when no geo data, e.g. local dev)
    const country = getRequestCountry(request, locals);
    if (country && country !== "US") {
      return notFound();
    }

    if (!ghlApiKey) {
      await notifySlack("Resolve Contact", "Missing configuration", "GHL_API_KEY is not set");
      return new Response(JSON.stringify({ email: null }), {
        status: 500,
        headers: RESPONSE_HEADERS,
      });
    }

    const ghlRes = await fetchWithTimeout(`${GHL_V1_BASE}/contacts/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${ghlApiKey}` },
    });

    // Unknown id: expected traffic (stale links, typos), silent 404.
    if (ghlRes.status === 404) {
      return notFound();
    }

    if (!ghlRes.ok) {
      const text = await ghlRes.text();
      await notifySlack(
        "Resolve Contact",
        "Contact lookup failed",
        `Status ${ghlRes.status}: ${text.slice(0, 300)}`
      );
      return new Response(JSON.stringify({ email: null }), {
        status: 502,
        headers: RESPONSE_HEADERS,
      });
    }

    let ghlJson: any = null;
    try {
      ghlJson = JSON.parse(await ghlRes.text());
    } catch {}

    const rawEmail = ghlJson?.contact?.email;
    if (typeof rawEmail !== "string" || !rawEmail.trim()) {
      return notFound();
    }

    // Normalized exactly like posthogTracking.js normalizeEmail, so the
    // client-side identify(email) merges on the same string.
    return new Response(JSON.stringify({ email: rawEmail.trim().toLowerCase() }), {
      status: 200,
      headers: RESPONSE_HEADERS,
    });
  } catch (error) {
    console.error("Resolve contact error:", error);
    await notifySlack("Resolve Contact", "Unhandled Error", String(error));
    return new Response(JSON.stringify({ email: null }), {
      status: 500,
      headers: RESPONSE_HEADERS,
    });
  }
};
