import type { APIRoute } from "astro";
import { notifySlack } from "../../lib/notifySlack";
import { GHL_FIELDS, GHL_V2_BASE, GHL_V2_VERSION } from "../../lib/ghl-fields";

export const prerender = false; // Ensure this route is server-rendered

export const POST: APIRoute = async ({ request }) => {
  const ghlPit = import.meta.env.GHL_PIT;

  const formData = await request.formData();
  const investmentTimeline = formData.get("investment_timeline")?.toString();
  const capitalSource = formData.get("capital_source")?.toString();
  const investIntent = formData.get("invest_intent")?.toString();
  const ghlContactId = formData.get("ghl_contact_id")?.toString();
  const webinarSignUpDate = formData.get("webinar_sign_up_date")?.toString();

  const missing: string[] = [];
  if (!ghlContactId) missing.push("ghl_contact_id");
  if (!capitalSource) missing.push("capital_source");

  if (missing.length > 0) {
    return new Response(JSON.stringify({ error: "Missing required fields", missing }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!ghlPit) {
    console.error("❌ GHL_PIT environment variable is not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build slug → value map, then transform to v2 customFields array
  const customFieldSlugs: Record<string, any> = {
    capital_source: capitalSource,
    ...(investmentTimeline ? { investment_timeline: investmentTimeline } : {}),
    ...(webinarSignUpDate ? { webinar_sign_up_date: webinarSignUpDate } : {}),
    ...(investIntent ? { invest_intent: investIntent } : {}),
  };

  const customFields = Object.entries(customFieldSlugs)
    .filter(([slug, val]) => GHL_FIELDS[slug] && val !== undefined && val !== null && val !== "")
    .map(([slug, val]) => ({
      id: GHL_FIELDS[slug],
      field_value: String(val),
    }));

  const requestBody = { customFields };

  // Update GHL contact via v2 PUT with retry + safe body parsing.
  // Same resilience pattern as webinar-registration.ts so transient failures
  // (empty body, 429, 5xx, network) don't silently drop capital_source data.
  const putToGhl = async (
    attempt = 1
  ): Promise<{ res: Response; data: any }> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${GHL_V2_BASE}/contacts/${ghlContactId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${ghlPit}`,
          Version: GHL_V2_VERSION,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const text = await res.text();
      let data: any = null;
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          console.warn("⚠️ GHL returned non-JSON body:", text.slice(0, 200));
        }
      }

      const transient = !text || res.status === 429 || res.status >= 500;
      if (transient && attempt < 3) {
        console.log(`🔁 GHL transient failure, retrying (attempt ${attempt + 1})`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        return putToGhl(attempt + 1);
      }
      return { res, data };
    } catch (err) {
      clearTimeout(timer);
      if (attempt < 3) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`🔁 GHL network error, retrying (attempt ${attempt + 1}): ${msg}`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        return putToGhl(attempt + 1);
      }
      throw err;
    }
  };

  try {
    console.log("📤 Updating GoHighLevel contact:", ghlContactId, requestBody);

    const { res: ghlRes, data: ghlResult } = await putToGhl();

    if (!ghlRes.ok) {
      console.error("❌ GHL contact update failed after 3 attempts:", {
        status: ghlRes.status,
        data: ghlResult,
      });
      await notifySlack(
        "Capital Question",
        "GoHighLevel API Error",
        `Status ${ghlRes.status} after 3 attempts updating contact ${ghlContactId}. Body: ${
          ghlResult ? JSON.stringify(ghlResult).slice(0, 200) : "empty"
        }`
      );
      return new Response(JSON.stringify({ error: "Failed to update GoHighLevel contact" }), {
        status: ghlRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("✅ GHL contact updated:", ghlContactId);

    return new Response(
      JSON.stringify({
        message: "GoHighLevel Contact updated successfully",
        ghl_response: ghlResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Error updating GHL contact after retries:", err);
    await notifySlack(
      "Capital Question",
      "GoHighLevel Network/Parse Error",
      `Failed after 3 attempts updating contact ${ghlContactId}: ${err instanceof Error ? err.message : String(err)}`
    );
    return new Response(JSON.stringify({ error: "Server error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
