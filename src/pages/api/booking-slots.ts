/**
 * Booking Slots API Route
 *
 * Proxies GoHighLevel's v2 free-slots endpoint for the Webinar Q&A Call calendar
 * used on /introduction-v2 and /introduction-v2-cd.
 *
 * Why proxy: the v2 endpoint works with our existing GHL API key, but we don't
 * want to expose the key to the browser. The frontend calls this route, which
 * forwards to GHL with the Authorization header attached server-side.
 *
 * All calendar rules (4-day booking window, 2-hour lead time, 15-min increments,
 * already-booked slots excluded) are applied by GHL. We pass the response through
 * unchanged.
 *
 * Response shape from GHL:
 *   { "YYYY-MM-DD": { "slots": ["2026-04-21T09:30:00-04:00", ...] }, "traceId"?: "..." }
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { notifySlack } from "../../lib/notifySlack";

const CALENDAR_ID = "xNXEISjf314X2BFZvdaZ";

export const GET: APIRoute = async ({ url }) => {
  const ghlApiKey = import.meta.env.GHL_API_KEY;

  try {
    // Default to Eastern if the client didn't supply one
    const timezone = url.searchParams.get("timezone") || "America/New_York";
    // Fetch a wider window than we'll display; the client filters down to the
    // first 2 non-Sunday days that have slots.

    const nowMs = Date.now();
    const defaultEndMs = nowMs + 14 * 24 * 60 * 60 * 1000;
    const startMs = Number(url.searchParams.get("startDate")) || nowMs;
    const endMs = Number(url.searchParams.get("endDate")) || defaultEndMs;

    if (!ghlApiKey) {
      await notifySlack("Booking Slots", "Missing GHL_API_KEY", "Cannot fetch slots");
      return new Response(JSON.stringify({ error: "Booking unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ghlUrl =
      `https://services.leadconnectorhq.com/calendars/${CALENDAR_ID}/free-slots` +
      `?startDate=${startMs}&endDate=${endMs}&timezone=${encodeURIComponent(timezone)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let res: Response;
    try {
      res = await fetch(ghlUrl, {
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: "2021-04-15",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const text = await res.text();
    if (!res.ok) {
      await notifySlack(
        "Booking Slots",
        "GHL free-slots API error",
        `Status ${res.status}: ${text.slice(0, 300)}`
      );
      return new Response(JSON.stringify({ error: "Failed to fetch slots" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Booking slots error:", error);
    await notifySlack("Booking Slots", "Unhandled Error", String(error));
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
