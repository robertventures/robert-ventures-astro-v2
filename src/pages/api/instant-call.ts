/**
 * Instant Call API Route
 *
 * Powers the "call me in 15 minutes" card on /offer/book-call. A lead asks
 * for an immediate callback instead of scheduling a slot on the calendar.
 *
 * Flow:
 * 1. Zod validate the request (contact_id OR full_name+email, plus phone)
 * 2. Honeypot + geo (defense in depth, edge function already gates non-US)
 * 3. Reject outside the instant-call window (weekdays 10am-5pm ET)
 * 4. Busy check: reject if the Sales Call calendar has an event in progress
 *    or starting within the hold window (fail-open on check errors)
 * 5. Resolve the contact's name/email (from GHL if contact_id was passed,
 *    otherwise from the submitted form fields), then upsert the contact in
 *    GHL with the confirmed phone and the Instant_Call_Request tag
 * 6. Hold the slot: create an appointment on the Sales Call calendar for
 *    now -> now + 40 min so scheduled and instant calls never collide
 * 7. Alert the sales team on Slack so someone actually makes the call
 * 8. Return { ok: true } on success
 *
 * Errors mapped to:
 *   400 — invalid request body
 *   409 — outside the instant-call window, or the team is busy (error codes
 *         "outside_call_window" / "team_busy" in the response body)
 *   502 — upstream GHL error
 *   500 — unhandled / missing configuration
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { getRequestCountry } from "../../lib/getRequestCountry";
import { notifySlack, notifySlackTeam } from "../../lib/notifySlack";
import { isInstantCallWindow } from "../../lib/callWindow";
import { instantCallSchema } from "../../lib/schemas/instant-call.schema";

const GHL_V1_BASE = "https://rest.gohighlevel.com/v1";
const GHL_V2_BASE = "https://services.leadconnectorhq.com";
const GHL_TIMEOUT_MS = 5000;

// Same Sales Call calendar the pick-a-time flow books through, and its one
// team member. GHL requires an explicit assignedUserId when we bypass slot
// validation, because the bypass also skips its automatic rep assignment.
const CALENDAR_ID = "xNXEISjf314X2BFZvdaZ";
const ASSIGNED_USER_ID = "VsY9oLMBB3S4u9Nh9NjW";

// How long an instant call occupies the calendar: up to 15 min until the rep
// dials, a 15-min call, and the calendar's 10-min buffer.
const INSTANT_CALL_HOLD_MINUTES = 40;

// Small wrapper so every GHL call gets the same 5s abort behavior without
// repeating the AbortController boilerplate at each call site.
async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GHL_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  // v1 key for contact lookup/upsert (rest.gohighlevel.com/v1). Read from
  // process.env first: import.meta.env.* is inlined at BUILD time, so an env
  // var added to Netlify after the last deploy would otherwise read as
  // undefined until the next build. process.env always reads live.
  const ghlApiKey = process.env.GHL_API_KEY || import.meta.env.GHL_API_KEY;
  // PIT + location id for the v2 calendar endpoints (busy check + hold).
  const ghlPit = process.env.GHL_PIT || import.meta.env.GHL_PIT;
  const ghlLocationId = process.env.GHL_LOCATION_ID || import.meta.env.GHL_LOCATION_ID;

  try {
    const rawBody = await request.json();

    const parseResult = instantCallSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return new Response(JSON.stringify({ error: "Invalid request", details: issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = parseResult.data;

    // Honeypot
    if (body.company && body.company.trim() !== "") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Geo gate (edge function already blocks non-US, this is defense in depth)
    const country = getRequestCountry(request, locals);
    if (country && country !== "US") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only accept requests placed during the instant-call window (weekdays,
    // 10am-5pm ET). Outside that window there's no one to take the call.
    if (!isInstantCallWindow()) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "outside_call_window",
          message: "Our team is available weekdays 10am to 5pm ET.",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ghlApiKey) {
      await notifySlack("Instant Call", "Missing GHL credentials", "GHL_API_KEY is not set");
      return new Response(JSON.stringify({ error: "Instant call unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Busy check: reject when the rep already has a call in progress or one
    // starting inside the hold window. The query reaches back an hour so an
    // in-progress appointment is caught regardless of how GHL matches events
    // to the range; the real overlap test happens below. Fails open: a broken
    // check should never cost a lead, only a Slack note.
    const nowMs = Date.now();
    const holdEndMs = nowMs + INSTANT_CALL_HOLD_MINUTES * 60 * 1000;
    if (ghlPit && ghlLocationId) {
      try {
        const eventsQuery = new URLSearchParams({
          locationId: ghlLocationId,
          calendarId: CALENDAR_ID,
          startTime: String(nowMs - 60 * 60 * 1000),
          endTime: String(holdEndMs),
        });
        const eventsRes = await fetchWithTimeout(
          `${GHL_V2_BASE}/calendars/events?${eventsQuery.toString()}`,
          { headers: { Authorization: `Bearer ${ghlPit}`, Version: "2021-04-15" } }
        );

        if (eventsRes.ok) {
          const eventsText = await eventsRes.text();
          let eventsJson: any = null;
          try {
            eventsJson = JSON.parse(eventsText);
          } catch {}
          const events = Array.isArray(eventsJson?.events) ? eventsJson.events : [];
          const repIsBusy = events.some((ev: any) => {
            const status = String(ev?.appointmentStatus || "").toLowerCase();
            if (status === "cancelled" || status === "invalid") return false;
            const start = new Date(ev?.startTime).getTime();
            const end = new Date(ev?.endTime).getTime();
            return end > nowMs && start < holdEndMs;
          });

          if (repIsBusy) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "team_busy",
                message: "Our team is on a call right now. Pick a time below instead.",
              }),
              { status: 409, headers: { "Content-Type": "application/json" } }
            );
          }
        } else {
          await notifySlack(
            "Instant Call",
            "Busy check failed (fail-open)",
            `Status ${eventsRes.status}`
          );
        }
      } catch (err) {
        await notifySlack("Instant Call", "Busy check error (fail-open)", String(err));
      }
    } else {
      await notifySlack(
        "Instant Call",
        "Missing GHL calendar credentials",
        `GHL_PIT present: ${!!ghlPit}, GHL_LOCATION_ID present: ${!!ghlLocationId}. Skipping busy check and calendar hold.`
      );
    }

    // E.164 normalization: strip everything but digits, drop a leading
    // country-code "1" if present, then re-add "+1" (US-only funnel).
    const digitsOnly = body.phone.replace(/\D/g, "").replace(/^1/, "");
    const phoneE164 = `+1${digitsOnly}`;

    // Step 1: resolve the lead's name and email, either from the existing
    // GHL contact (contact_id path) or straight from the submitted form.
    let name: string;
    let email: string;

    if (body.contact_id) {
      const verifyRes = await fetchWithTimeout(
        `${GHL_V1_BASE}/contacts/${encodeURIComponent(body.contact_id)}`,
        { headers: { Authorization: `Bearer ${ghlApiKey}` } }
      );
      const verifyText = await verifyRes.text();

      if (!verifyRes.ok) {
        await notifySlack(
          "Instant Call",
          "Contact verification failed",
          `Status ${verifyRes.status}: ${verifyText.slice(0, 300)}`
        );
        return new Response(JSON.stringify({ error: "Failed to verify contact" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }

      let verifyJson: any = null;
      try {
        verifyJson = JSON.parse(verifyText);
      } catch {}

      email = verifyJson?.contact?.email;
      name =
        verifyJson?.contact?.name ||
        [verifyJson?.contact?.firstName, verifyJson?.contact?.lastName].filter(Boolean).join(" ");

      if (!email) {
        await notifySlack(
          "Instant Call",
          "Contact has no email",
          `contact_id ${body.contact_id} verified but returned no email`
        );
        return new Response(JSON.stringify({ error: "Failed to verify contact" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      name = body.full_name as string;
      email = body.email as string;
    }

    // Step 2: upsert the contact in GHL (v1 /contacts/ keys off email) with
    // the confirmed phone and the tag sales uses to spot instant-call leads.
    const upsertRes = await fetchWithTimeout(`${GHL_V1_BASE}/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        phone: phoneE164,
        tags: ["Instant_Call_Request"],
      }),
    });

    const upsertText = await upsertRes.text();
    if (!upsertRes.ok) {
      await notifySlack(
        "Instant Call",
        "GHL contact upsert failed",
        `Status ${upsertRes.status}: ${upsertText.slice(0, 300)}`,
        email
      );
      return new Response(JSON.stringify({ error: "Failed to update contact" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    let upsertJson: any = null;
    try {
      upsertJson = JSON.parse(upsertText);
    } catch {}
    const upsertedContactId = upsertJson?.contact?.id || null;

    // Step 3: hold the slot. Create a real appointment on the Sales Call
    // calendar (now -> now + hold) so the rep sees who to call and the busy
    // check above catches overlapping instant calls. The two ignore* flags
    // bypass the calendar's slot grid and 1-hour minimum notice, which only
    // apply to the public pick-a-time flow. Non-fatal: the tag + Slack ping
    // already arranged the callback, so a failed hold never costs the lead.
    let holdLabel = "no calendar hold";
    if (ghlPit && ghlLocationId && upsertedContactId) {
      try {
        const holdRes = await fetchWithTimeout(`${GHL_V2_BASE}/calendars/events/appointments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ghlPit}`,
            Version: "2021-04-15",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            calendarId: CALENDAR_ID,
            locationId: ghlLocationId,
            contactId: upsertedContactId,
            assignedUserId: ASSIGNED_USER_ID,
            startTime: new Date(nowMs).toISOString(),
            endTime: new Date(holdEndMs).toISOString(),
            title: `Instant call: ${name}`,
            appointmentStatus: "confirmed",
            ignoreFreeSlotValidation: true,
            ignoreDateRange: true,
            toNotify: false,
          }),
        });

        if (holdRes.ok) {
          holdLabel =
            "until " +
            new Date(holdEndMs).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              timeZone: "America/New_York",
            }) +
            " ET";
        } else {
          const holdText = await holdRes.text();
          holdLabel = "calendar hold failed";
          await notifySlack(
            "Instant Call",
            "Calendar hold failed",
            `Status ${holdRes.status}: ${holdText.slice(0, 300)}`,
            email
          );
        }
      } catch (err) {
        holdLabel = "calendar hold failed";
        await notifySlack("Instant Call", "Calendar hold error", String(err), email);
      }
    }

    // Step 4: alert the sales team. notifySlackTeam never throws, so a Slack
    // outage never prevents us from returning success to the lead.
    await notifySlackTeam("Instant Call Requested", {
      Name: name,
      Email: email,
      Phone: phoneE164,
      "Calendar Hold": holdLabel,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Instant call error:", error);
    await notifySlack("Instant Call", "Unhandled Error", String(error));
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
