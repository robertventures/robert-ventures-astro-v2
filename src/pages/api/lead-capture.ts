/**
 * Lead Capture API Route (V3 Funnel)
 *
 * Lightweight endpoint for the early lead capture step in the V3 webinar funnel.
 * Captures name, email, phone and sends to:
 *
 * 1. GO HIGH LEVEL (CRM) — Creates contact with attribution data, tagged "Webinar_Funnel_V3"
 * 2. META CONVERSIONS API — Fires a "Lead" event (not CompleteRegistration — that happens later)
 * 3. SUPABASE — Analytics insert (non-blocking)
 *
 * Does NOT register with WebinarKit — that happens on the /live destination page
 * when the user selects a session.
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { createHash } from "crypto";
import { getRequestCountry } from "../../lib/getRequestCountry";
import { notifySlack } from "../../lib/notifySlack";
import { autoCorrectEmail, normalizeNameCase, splitFullName } from "../../lib/formHelpers";
import { leadCaptureSchema } from "../../lib/schemas/lead-capture.schema";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, locals }) => {
  const ghlApiKey = import.meta.env.GHL_API_KEY;
  const censusApiKey = import.meta.env.CENSUS_API_KEY;

  try {
    // ========================================
    // REQUEST PARSING & VALIDATION
    // ========================================
    const rawBody = await request.json();

    const parseResult = leadCaptureSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      console.warn("⚠️ Lead capture validation failed:", issues);
      return new Response(JSON.stringify({ error: "Invalid request", details: issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = parseResult.data;

    console.log("📥 Lead capture data:", JSON.stringify(body, null, 2));

    // ========================================
    // SPAM PROTECTION: HONEYPOT
    // ========================================
    if (body.company && body.company.trim() !== "") {
      console.log("🤖 Honeypot triggered - rejecting spam submission");
      return new Response(JSON.stringify({ message: "Success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========================================
    // SPAM PROTECTION: COUNTRY CHECK
    // ========================================
    const country = getRequestCountry(request, locals);
    if (country && country !== "US") {
      console.log("🌍 Non-US lead capture blocked:", { country });
      return new Response(JSON.stringify({ message: "Success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Reject if name field looks like an email address
    if (body.name && typeof body.name === "string" && body.name.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Please enter your name, not your email address." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // DATA PROCESSING & ENRICHMENT
    // ========================================
    const referer = request.headers.get("referer") || "";

    // Detect device type from user agent
    const ua = request.headers.get("user-agent") || "";
    const serverDevice = (() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      if (!isMobile) return "desktop";
      if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
      if (/Android/i.test(ua)) return "android";
      return "android";
    })();

    const utmCampaignFinal =
      body.utm_campaign ||
      (body?.utm && typeof body.utm === "object" ? body.utm.utm_campaign : undefined) ||
      "Webinar";
    const deviceFinal = body.device_type || serverDevice || "unknown";

    // Get client IP for geolocation
    const xffHeader = request.headers.get("x-forwarded-for") || "";
    const clientIpFromHeaders =
      request.headers.get("x-real-client-ip") ||
      request.headers.get("x-nf-client-connection-ip") ||
      (xffHeader.split(",")[0] || "").trim() ||
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      "";

    const ipForGeo = clientIpFromHeaders;

    let geoRegionName: string | undefined;
    let geoStateCode: string | undefined;
    let geoCity: string | undefined;
    let geoZip: string | undefined;
    let geoCountryCode: string | undefined;
    let isHostingIp = false;

    try {
      if (ipForGeo) {
        const geoRes = await fetch(
          `http://ip-api.com/json/${encodeURIComponent(ipForGeo)}?fields=status,message,countryCode,region,regionName,city,zip,hosting,proxy`
        );
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo && geo.status === "success") {
            geoCountryCode = typeof geo.countryCode === "string" ? geo.countryCode : undefined;
            geoStateCode = typeof geo.region === "string" && geo.region ? geo.region : undefined;
            geoRegionName =
              typeof geo.regionName === "string" && geo.regionName ? geo.regionName : undefined;
            geoCity = typeof geo.city === "string" && geo.city ? geo.city : undefined;
            geoZip = typeof geo.zip === "string" && geo.zip ? geo.zip : undefined;
            isHostingIp = geo.hosting === true;
          }
        }
      }
    } catch (e) {
      console.warn("⚠️ IP geolocation lookup threw:", e);
    }

    // Data center IP check
    if (isHostingIp && geoCountryCode !== "US") {
      console.log(
        `🤖 Data center IP detected (${ipForGeo}, country: ${geoCountryCode}) — rejecting`
      );
      return new Response(JSON.stringify({ message: "Success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Data center location early warning
    const dataCenterLocations = [
      { city: "ashburn", state: "VA" },
      { city: "san jose", state: "CA" },
    ];
    const cityLower = (geoCity || "").toLowerCase();
    const isDataCenterLocation = dataCenterLocations.some(
      (loc) => cityLower === loc.city && geoStateCode === loc.state
    );
    if (isDataCenterLocation) {
      await notifySlack(
        "Lead Capture",
        "Data Center Location Detected",
        `Lead geolocated to ${geoCity}, ${geoStateCode}. IP: ${ipForGeo}`,
        body.email
      );
    }

    // Zip code income level lookup
    let incomeLevel: string | undefined;
    try {
      if (geoZip && censusApiKey) {
        const censusRes = await fetch(
          `https://api.census.gov/data/2022/acs/acs5?get=B19013_001E&for=zip%20code%20tabulation%20area:${encodeURIComponent(geoZip)}&key=${encodeURIComponent(censusApiKey)}`
        );
        if (censusRes.ok) {
          const censusData = await censusRes.json();
          if (Array.isArray(censusData) && censusData.length > 1) {
            const medianIncome = Number(censusData[1][0]);
            if (!isNaN(medianIncome) && medianIncome > 0) {
              if (medianIncome > 80000) {
                incomeLevel = "High";
              } else if (medianIncome >= 40000) {
                incomeLevel = "Mid";
              } else {
                incomeLevel = "Low";
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("⚠️ Census income lookup threw:", e);
    }

    // Auto-correct email typos
    const emailCorrection = autoCorrectEmail(body.email);
    if (emailCorrection.wasCorrected) {
      console.log("📧 Email auto-corrected:", {
        original: body.email,
        corrected: emailCorrection.correctedEmail,
      });
      body.email = emailCorrection.correctedEmail;
    }

    // Normalize ALL CAPS names
    const nameNormalization = normalizeNameCase(body.name);
    if (nameNormalization.wasNormalized) {
      body.name = nameNormalization.normalizedName;
    }

    const { firstName, lastName } = splitFullName(body.name);

    // ========================================
    // STEP 1: GO HIGH LEVEL (CRM)
    // ========================================
    let ghlContactId = null;
    if (ghlApiKey) {
      try {
        const userTimezone = body.user_timezone || "Unknown";
        const now = new Date();
        const userLocalTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
        const mm = String(userLocalTime.getMonth() + 1).padStart(2, "0");
        const dd = String(userLocalTime.getDate()).padStart(2, "0");
        const yyyy = userLocalTime.getFullYear();
        const currentDate = `${mm}-${dd}-${yyyy}`;

        const customField: Record<string, any> = {
          webinar_signup_date: currentDate,
          userip: ipForGeo || "unknown",
          device_type: deviceFinal,
          utm_source: body?.utm?.utm_source ?? "direct",
          utm_medium: body?.utm?.utm_medium ?? "none",
          utm_campaign: body?.utm?.utm_campaign ?? body?.utm_campaign ?? "none",
          utm_content: body?.utm?.utm_content ?? "none",
          utm_term: body?.utm?.utm_term ?? "none",
          utm_id: body?.utm?.utm_id ?? "none",
          google_click_id: body?.gclid ?? "none",
          rtk_click_id: body?.rtk_click_id ?? "none",
          fb_ad_id: body?.fb_ad_id ?? "none",
          fb_adset_id: body?.fb_adset_id ?? "none",
          fb_placement: body?.fb_placement ?? "none",
          fb_site_source: body?.fb_site_source ?? "none",
          google_matchtype: body?.google_matchtype ?? "none",
          google_adgroup_id: body?.google_adgroup_id ?? "none",
          google_creative_id: body?.google_creative_id ?? "none",
          google_campaign_id: body?.google_campaign_id ?? "none",
          google_device: body?.google_device ?? "none",
          google_ad_position: body?.google_ad_position ?? "none",
          google_network: body?.google_network ?? "none",
          google_placement: body?.google_placement ?? "none",
          wbraid: body?.wbraid ?? "none",
          gbraid: body?.gbraid ?? "none",
          zip_income_level: incomeLevel || "unknown",
          cmpid: body?.cmpid ?? "none",
          ad_group: body?.utm?.utm_adgroup ?? "none",
        };

        const ghlPayload = {
          name: body.name,
          phone: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
          email: body.email,
          source: utmCampaignFinal,
          timezone: body.user_timezone || "Unknown",
          ...(geoRegionName ? { state: geoRegionName } : {}),
          ...(geoCity ? { city: geoCity } : {}),
          ...(geoZip ? { postalCode: geoZip } : {}),
          tags: ["Webinar_Funnel_V3"],
          customField,
        };

        const ghlRes = await fetch("https://rest.gohighlevel.com/v1/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ghlApiKey}`,
          },
          body: JSON.stringify(ghlPayload),
        });

        const ghlData = await ghlRes.json();
        ghlContactId = ghlData?.contact?.id || null;

        if (!ghlRes.ok) {
          console.warn("⚠️ GHL contact creation failed:", ghlData);
          await notifySlack(
            "Lead Capture",
            "GoHighLevel API Error",
            `Status ${ghlRes.status}`,
            body.email
          );
        }
      } catch (err) {
        console.error("❌ Error creating GHL contact:", err);
      }
    }

    // ========================================
    // STEP 2: META CONVERSIONS API (Lead event)
    // ========================================
    try {
      const pixelId = "652212003052612";
      const accessToken = import.meta.env.META_ACCESS_TOKEN as string | undefined;
      const testEventCode = import.meta.env.META_TEST_EVENT_CODE as string | undefined;

      if (pixelId && accessToken) {
        const normalizedEmail = (body.email || "").toString().trim().toLowerCase();
        const normalizedPhone = (body.phone_number || "")
          .toString()
          .replace(/\D/g, "")
          .replace(/^1/, "");
        const normalizedFirstName = firstName.toString().trim().toLowerCase();
        const normalizedLastName = lastName.toString().trim().toLowerCase();
        const normalizedCity = (geoCity || "")
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "");
        const normalizedStateCode = (geoStateCode || "").toString().trim().toLowerCase();
        const normalizedZip = (geoZip || "").toString().replace(/\D/g, "").slice(0, 5);
        const normalizedCountry = "us";

        const emHashed = normalizedEmail
          ? createHash("sha256").update(normalizedEmail).digest("hex")
          : "";
        const phHashed = normalizedPhone
          ? createHash("sha256").update(normalizedPhone).digest("hex")
          : "";
        const fnHashed = normalizedFirstName
          ? createHash("sha256").update(normalizedFirstName).digest("hex")
          : "";
        const lnHashed = normalizedLastName
          ? createHash("sha256").update(normalizedLastName).digest("hex")
          : "";
        const ctHashed = normalizedCity
          ? createHash("sha256").update(normalizedCity).digest("hex")
          : "";
        const stHashed = normalizedStateCode
          ? createHash("sha256").update(normalizedStateCode).digest("hex")
          : "";
        const zpHashed = normalizedZip
          ? createHash("sha256").update(normalizedZip).digest("hex")
          : "";
        const countryHashed = createHash("sha256").update(normalizedCountry).digest("hex");

        const externalIds: string[] = [];
        if (normalizedEmail) {
          externalIds.push(createHash("sha256").update(normalizedEmail).digest("hex"));
        }
        if (ghlContactId) {
          externalIds.push(createHash("sha256").update(String(ghlContactId)).digest("hex"));
        }

        const clientIp =
          request.headers.get("x-real-client-ip") ||
          request.headers.get("x-nf-client-connection-ip") ||
          (xffHeader.split(",")[0] || "").trim() ||
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-real-ip") ||
          "";

        const eventIdFromClient = (body.event_id || "").toString();
        const fbpFromClient = (body.fbp || "").toString();
        let fbcFromClient = (body.fbc || "").toString();

        if (!fbcFromClient && referer) {
          try {
            const ref = new URL(referer);
            const fbclid = ref.searchParams.get("fbclid");
            if (fbclid) {
              const ts = Math.floor(Date.now() / 1000);
              fbcFromClient = `fb.1.${ts}.${fbclid}`;
            }
          } catch {}
        }

        const fbBody: Record<string, unknown> = {
          data: [
            {
              event_name: "Lead",
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: referer || "",
              ...(eventIdFromClient ? { event_id: eventIdFromClient } : {}),
              user_data: {
                ...(emHashed ? { em: [emHashed] } : {}),
                ...(phHashed ? { ph: [phHashed] } : {}),
                ...(fnHashed ? { fn: [fnHashed] } : {}),
                ...(lnHashed ? { ln: [lnHashed] } : {}),
                ...(ctHashed ? { ct: [ctHashed] } : {}),
                ...(stHashed ? { st: [stHashed] } : {}),
                ...(zpHashed ? { zp: [zpHashed] } : {}),
                country: [countryHashed],
                ...(externalIds.length ? { external_id: externalIds } : {}),
                ...(fbpFromClient ? { fbp: fbpFromClient } : {}),
                ...(fbcFromClient ? { fbc: fbcFromClient } : {}),
                client_user_agent: ua,
                client_ip_address: clientIp,
              },
              custom_data: {
                content_type: "lead_capture_v3",
                currency: "USD",
              },
            },
          ],
        };

        if (testEventCode) {
          (fbBody as any).test_event_code = testEventCode;
        }

        const fbRes = await fetch(
          `https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fbBody),
          }
        );

        if (!fbRes.ok) {
          const fbText = await fbRes.text();
          console.warn("⚠️ Meta Conversions API error:", fbText);
        }
      }
    } catch (err) {
      console.error("❌ Failed to send Meta Lead event:", err);
    }

    // ========================================
    // STEP 3: SUPABASE ANALYTICS
    // ========================================
    try {
      supabase
        .from("webinar_registrations")
        .insert({
          email: body.email,
          first_name: firstName,
          last_name: lastName,
          phone: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
          invest_intent: "",
          zip_income_level: incomeLevel || "",
          webinar_date: "",
          session_type: "lead_capture_v3",
          utm_source: body?.utm?.utm_source || "",
          utm_medium: body?.utm?.utm_medium || "",
          utm_campaign: utmCampaignFinal,
          utm_content: body?.utm?.utm_content || "",
          utm_term: body?.utm?.utm_term || "",
          utm_id: body?.utm?.utm_id || "",
          utm_adgroup: body?.utm?.utm_adgroup || "",
          gclid: body?.gclid || "",
          google_adgroup_id: body?.google_adgroup_id || "",
          google_campaign_id: body?.google_campaign_id || "",
          google_creative_id: body?.google_creative_id || "",
          google_matchtype: body?.google_matchtype || "",
          fb_ad_id: body?.fb_ad_id || "",
          fb_adset_id: body?.fb_adset_id || "",
          fb_placement: body?.fb_placement || "",
          fb_site_source: body?.fb_site_source || "",
          device_type: deviceFinal,
          city: geoCity || "",
          state: geoRegionName || "",
          zip_code: geoZip || "",
          ghl_contact_id: ghlContactId || "",
          presentation_date: "",
        })
        .then(({ error }) => {
          if (error) {
            console.error("❌ Supabase insert error:", error.message);
          } else {
            console.log("✅ Supabase lead capture saved for:", body.email);
          }
        });
    } catch (err) {
      console.error("❌ Supabase insert threw:", err);
    }

    // ========================================
    // SUCCESS RESPONSE
    // ========================================
    return new Response(
      JSON.stringify({
        message: "Lead captured successfully",
        ghl_contact_id: ghlContactId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error during lead capture:", error);
    await notifySlack("Lead Capture", "Unhandled Error", String(error));
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
    });
  }
};
