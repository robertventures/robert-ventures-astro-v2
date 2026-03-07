import { z } from "zod";

/**
 * Validates the incoming request body for /api/webinar-registration.
 *
 * Only the fields that would crash the handler if missing are marked required.
 * All attribution and tracking fields are optional — they enrich the data but
 * the registration still succeeds without them.
 *
 * Why passthrough: the frontend sends many attribution fields that change over
 * time. passthrough() allows unknown keys through so new fields never break
 * existing registrations.
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

export const webinarRegistrationSchema = z
  .object({
    // Required fields — the route crashes without these
    name: z.string().min(1, "Name is required"),
    email: z.email("A valid email address is required"),
    phone_number: z.string().min(1, "Phone number is required"),
    date: z.string().min(1, "Webinar date is required"),

    // Honeypot — should be absent or empty; validated manually in the handler
    company: z.string().optional(),

    // Webinar configuration
    fullDate: z.string().optional(),
    webinar_id: z.string().optional(),
    is_instant: z.boolean().optional(),
    webinar_test: z.string().optional(),
    webinar_sign_up_date: z.string().optional(),
    webinar_datetime_user_tz: z.string().optional(),
    webinar_calendar_url: z.string().optional(),

    // User context
    invest_intent: z.union([z.string(), z.number()]).optional(),
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

export type WebinarRegistrationBody = z.infer<typeof webinarRegistrationSchema>;
