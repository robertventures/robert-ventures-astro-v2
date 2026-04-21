/**
 * Book Appointment API Route
 *
 * Creates a GoHighLevel appointment on the Webinar Q&A Call calendar
 * (xNXEISjf314X2BFZvdaZ) for a contact that already exists in GHL.
 *
 * The user was registered in GHL during the webinar funnel
 * (/webinar-v1, /webinar-v1-cd), which set localStorage.ghl_contact_id
 * on the browser. We reuse that contact instead of re-collecting name,
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
const LOCATION_ID = "bfHiy1NWixstyv5LQxSp";

export const POST: APIRoute = async ({ request, locals }) => {
  const ghlApiKey = import.meta.env.GHL_API_KEY;

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

    if (!ghlApiKey) {
      await notifySlack("Book Appointment", "Missing GHL_API_KEY", "Cannot create appointment");
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
      const upsertRes = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: body.contactInfo.name,
          email: body.contactInfo.email,
          phone: digitsOnly,
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
          Authorization: `Bearer ${ghlApiKey}`,
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
