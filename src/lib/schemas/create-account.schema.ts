import { z } from "zod";

/**
 * Validates the incoming request body for /api/create-account.
 *
 * This route is a thin proxy to invest.robertventures.com/api/profile.
 * We validate the fields we use directly (email for Slack alerts, website
 * for honeypot detection) and passthrough everything else so the external
 * API receives what it expects without us needing to know every field.
 */
export const createAccountSchema = z
  .object({
    email: z.email("A valid email address is required"),
    // Honeypot — should be absent or empty; checked manually in the handler
    website: z.string().optional(),
  })
  .passthrough(); // forward all fields to the external API unchanged

export type CreateAccountBody = z.infer<typeof createAccountSchema>;
