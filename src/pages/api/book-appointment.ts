/**
 * Book Appointment API Route
 *
 * Creates a GoHighLevel appointment on the Webinar Q&A Call calendar
 * (xNXEISjf314X2BFZvdaZ) for a contact that already exists in GHL.
 *
 * The user was registered in GHL during the webinar funnel at /webinar,
 * which set localStorage.ghl_contact_id on the browser. We reuse that contact instead of re-collecting name,
 * email, and phone in the booking UI.
 *
 * Flow:
 * 1. Zod validate the request (ghl_contact_id, selectedSlot, timezone)
 * 2. Honeypot + geo (defense in depth, edge function already gates non-US)
 * 3. Verify the contact exists in GHL (prevents abuse with made-up IDs)
 * 4. Create the appointment via v2 endpoint
 * 5. Return { ok: true, startTime, endTime } on success
 *
 * Errors mapped to:
 *   404 — contact not found
 *   409 — slot no longer available (another user just booked it)
 *   502 — upstream GHL error
 *   500 — unhandled
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { getRequestCountry } from "../../lib/getRequestCountry";
import { notifySlack } from "../../lib/notifySlack";
import { bookAppointmentSchema } from "../../lib/schemas/book-appointment.schema";

const CALENDAR_ID = "xNXEISjf314X2BFZvdaZ";
const LOCATION_ID = import.meta.env.GHL_LOCATION_ID;

export const POST: APIRoute = async ({ request, locals }) => {
  // v1 key for contact lookup/upsert (rest.gohighlevel.com/v1)
  const ghlApiKey = import.meta.env.GHL_API_KEY;
  // PIT for the v2 appointment endpoint (services.leadconnectorhq.com)
  const ghlPit = import.meta.env.GHL_PIT;

  try {
    const rawBody = await request.json();

    const parseResult = bookAppointmentSchema.safeParse(rawBody);
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

    if (!ghlApiKey || !ghlPit) {
      await notifySlack(
        "Book Appointment",
        "Missing GHL credentials",
        `GHL_API_KEY present: ${!!ghlApiKey}, GHL_PIT present: ${!!ghlPit}`
      );
      return new Response(JSON.stringify({ error: "Booking unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 1: Resolve the contact ID. Either use the one the client sent
    // (from localStorage after webinar registration), or fall back to
    // creating/finding a contact from the supplied contactInfo.
    let resolvedContactId: string | null = null;

    if (body.ghl_contact_id) {
      const verifyRes = await fetch(
        `https://rest.gohighlevel.com/v1/contacts/${encodeURIComponent(body.ghl_contact_id)}`,
        {
          headers: { Authorization: `Bearer ${ghlApiKey}` },
        }
      );

      if (verifyRes.ok) {
        resolvedContactId = body.ghl_contact_id;

        // If the user supplied (or retyped) a phone number alongside an
        // existing contact_id, push it to GHL so the sales team calls the
        // right number. Reuses the same v1 upsert-by-email pattern as the
        // contactInfo path below: GHL v1 /contacts/ keys off email, so we
        // need the contact's email first.
        if (body.phone) {
          try {
            const verifyText = await verifyRes.text();
            const verifyJson = JSON.parse(verifyText);
            const contactEmail = verifyJson?.contact?.email;

            if (contactEmail) {
              // E.164 (+1XXXXXXXXXX), same normalization as webinar-registration
              // and instant-call, so GHL never has to infer the country code.
              const digitsOnly = body.phone.replace(/\D/g, "").replace(/^1/, "");
              const phoneE164 = `+1${digitsOnly}`;
              const phoneUpdateRes = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${ghlApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: contactEmail,
                  phone: phoneE164,
                }),
              });

              if (!phoneUpdateRes.ok) {
                const text = await phoneUpdateRes.text();
                await notifySlack(
                  "Book Appointment",
                  "Phone update failed",
                  `Status ${phoneUpdateRes.status}: ${text.slice(0, 300)}`
                );
              }
            }
          } catch (err) {
            // Non-fatal: the appointment can still be booked without the
            // phone update, so log and move on instead of failing the request.
            await notifySlack("Book Appointment", "Phone update error", String(err));
          }
        }
      } else if (verifyRes.status !== 404) {
        const text = await verifyRes.text();
        await notifySlack(
          "Book Appointment",
          "Contact verification failed",
          `Status ${verifyRes.status}: ${text.slice(0, 300)}`
        );
        return new Response(JSON.stringify({ error: "Failed to verify contact" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
      // 404 falls through to the contactInfo path below
    }

    if (!resolvedContactId) {
      if (!body.contactInfo) {
        return new Response(JSON.stringify({ error: "Contact not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Upsert a GHL contact from the supplied info. GHL v1 /contacts/ uses
      // email as a natural key, so posting the same email twice reuses the
      // existing contact rather than duplicating.
      const digitsOnly = body.contactInfo.phone.replace(/\D/g, "").replace(/^1/, "");
      const phoneE164 = `+1${digitsOnly}`;
      const upsertRes = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: body.contactInfo.name,
          email: body.contactInfo.email,
          phone: phoneE164,
          tags: ["Presentation_Booking_Fallback"],
        }),
      });

      const upsertText = await upsertRes.text();
      if (!upsertRes.ok) {
        await notifySlack(
          "Book Appointment",
          "GHL contact upsert failed",
          `Status ${upsertRes.status}: ${upsertText.slice(0, 300)}`
        );
        return new Response(JSON.stringify({ error: "Failed to create contact" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const upsertJson = JSON.parse(upsertText);
        resolvedContactId = upsertJson?.contact?.id || null;
      } catch {}

      if (!resolvedContactId) {
        await notifySlack(
          "Book Appointment",
          "GHL contact upsert returned no id",
          upsertText.slice(0, 300)
        );
        return new Response(JSON.stringify({ error: "Failed to create contact" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Step 2: Create the appointment via v2 endpoint
    const appointmentPayload: Record<string, unknown> = {
      calendarId: CALENDAR_ID,
      locationId: LOCATION_ID,
      contactId: resolvedContactId,
      startTime: body.selectedSlot,
      selectedTimezone: body.timezone,
    };

    const createRes = await fetch(
      "https://services.leadconnectorhq.com/calendars/events/appointments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghlPit}`,
          Version: "2021-04-15",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentPayload),
      }
    );

    const createText = await createRes.text();
    let createJson: any = null;
    try {
      createJson = JSON.parse(createText);
    } catch {}

    // TEMP DIAGNOSTIC — remove once root cause is found
    console.log("[book-appointment] GHL status:", createRes.status);
    console.log("[book-appointment] GHL body:", createText.slice(0, 500));

    if (!createRes.ok) {
      const msg = (createJson?.message || createText || "").toString().toLowerCase();
      const isConflict =
        createRes.status === 409 ||
        msg.includes("not available") ||
        msg.includes("already booked") ||
        msg.includes("slot is") ||
        msg.includes("conflict");

      if (isConflict) {
        return new Response(
          JSON.stringify({ error: "Slot no longer available", code: "slot_taken" }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      await notifySlack(
        "Book Appointment",
        "GHL appointment creation failed",
        `Status ${createRes.status}: ${createText.slice(0, 400)}`
      );
      return new Response(JSON.stringify({ error: "Failed to create appointment" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        appointment: createJson,
        // Returned so the browser can store it and identify the booker in
        // PostHog — mirrors /api/webinar-registration returning ghl_contact_id.
        contactId: resolvedContactId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Book appointment error:", error);
    await notifySlack("Book Appointment", "Unhandled Error", String(error));
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
