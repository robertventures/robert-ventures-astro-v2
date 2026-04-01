import { z } from "zod";

/**
 * Validates the incoming request body for /api/lead-capture.
 *
 * This is a lightweight schema for the V3 funnel's early lead capture step.
 * Only name, email, and phone are required — no webinar date or session needed
 * because the user hasn't chosen a path yet (on-demand / live Q&A / call).
 *
 * Why passthrough: the frontend sends many attribution fields that change over
 * time. passthrough() allows unknown keys through so new fields never break
 * existing submissions.
 */

const utmSchema = z
  .object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional(),
    utm_term: z.string().optional(),
    utm_id: z.string().optional(),
    utm_adgroup: z.string().optional(),
  })
  .passthrough()
  .optional();

export const leadCaptureSchema = z
  .object({
    // Required fields — the route needs these to create a CRM contact
    name: z.string().min(1, "Name is required"),
    email: z.email("A valid email address is required"),
    phone_number: z.string().min(1, "Phone number is required"),

    // Honeypot — should be absent or empty; validated manually in the handler
    company: z.string().optional(),

    // User context
    device_type: z.string().optional(),
    user_timezone: z.string().optional(),

    // UTM / attribution (all optional — enrichment only)
    utm: utmSchema,
    utm_campaign: z.string().optional(),
    gclid: z.string().optional(),
    rtk_click_id: z.string().optional(),
    cmpid: z.string().optional(),

    // Meta attribution
    event_id: z.string().optional(),
    fbp: z.string().optional(),
    fbc: z.string().optional(),
    fb_ad_id: z.string().optional(),
    fb_adset_id: z.string().optional(),
    fb_placement: z.string().optional(),
    fb_site_source: z.string().optional(),

    // Google attribution
    google_matchtype: z.string().optional(),
    google_adgroup_id: z.string().optional(),
    google_creative_id: z.string().optional(),
    google_campaign_id: z.string().optional(),
    google_device: z.string().optional(),
    google_ad_position: z.string().optional(),
    google_network: z.string().optional(),
    google_placement: z.string().optional(),
    wbraid: z.string().optional(),
    gbraid: z.string().optional(),
  })
  .passthrough(); // allow future fields without schema changes

export type LeadCaptureBody = z.infer<typeof leadCaptureSchema>;
