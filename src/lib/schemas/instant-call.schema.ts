import { z } from "zod";

/**
 * Validates the incoming request body for /api/instant-call.
 *
 * Required:
 * - phone: the number the team calls back on
 *
 * Either contact_id OR (full_name AND email) must be present:
 * - contact_id: an existing GHL contact id (e.g. set in localStorage from an
 *   earlier step in the funnel). The route re-reads name/email from GHL.
 * - full_name / email: fallback identity used when there is no known contact
 *   yet. The route creates or upserts a GHL contact from these.
 */
export const instantCallSchema = z
  .object({
    contact_id: z.string().optional(),
    full_name: z.string().min(1).optional(),
    email: z.email().optional(),
    phone: z.string().min(10, "phone is required"),

    // Honeypot
    company: z.string().optional(),
  })
  .refine((v) => !!v.contact_id || (!!v.full_name && !!v.email), {
    message: "contact_id or (full_name and email) is required",
  });

export type InstantCallBody = z.infer<typeof instantCallSchema>;
