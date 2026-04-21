import { z } from "zod";

/**
 * Validates the incoming request body for /api/book-appointment.
 *
 * Required:
 * - selectedSlot: ISO 8601 with timezone offset, e.g. "2026-04-21T09:30:00-04:00"
 * - timezone: IANA timezone used to format the slot, e.g. "America/New_York"
 *
 * Either ghl_contact_id OR contactInfo must be present:
 * - ghl_contact_id: set in localStorage during /webinar registration
 * - contactInfo: fallback identity used when localStorage is empty (dev/test,
 *   or visitors who reached the slide without going through registration).
 *   The route will look up an existing contact by email or create one.
 */
export const bookAppointmentSchema = z
  .object({
    ghl_contact_id: z.string().optional(),
    selectedSlot: z.string().min(1, "selectedSlot is required"),
    timezone: z.string().min(1, "timezone is required"),

    contactInfo: z
      .object({
        name: z.string().min(1),
        email: z.email(),
        phone: z.string().min(7),
      })
      .optional(),

    // Honeypot
    company: z.string().optional(),
  })
  .passthrough()
  .refine((v) => !!v.ghl_contact_id || !!v.contactInfo, {
    message: "ghl_contact_id or contactInfo is required",
  });

export type BookAppointmentBody = z.infer<typeof bookAppointmentSchema>;
