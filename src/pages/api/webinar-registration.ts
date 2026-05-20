/**
 * Webinar Registration API Route
 *
 * This API endpoint handles webinar registration requests by coordinating three services:
 *
 * 1. GO HIGH LEVEL (CRM System)
 *    - Creates contact records with detailed custom fields for sales follow-up
 *    - Stores UTM parameters for marketing attribution
 *    - Tracks device type, timezone, and webinar preferences
 *
 * 2. WEBINARKIT (Webinar Platform)
 *    - Registers users for the actual webinar session
 *    - Handles webinar delivery and attendance tracking
 *    - Uses split name format (firstName/lastName) and custom fields
 *
 * 3. META CONVERSIONS API (Facebook Advertising)
 *    - Tracks CompleteRegistration events for ad optimization
 *    - Uses privacy-compliant hashed user identifiers
 *    - Includes investment intent as predicted_ltv for lead quality scoring
 *
 * 4. SUPABASE (Analytics Database)
 *    - Stores all registration data for analytics and reporting
 *    - Non-blocking insert (doesn't slow down registration)
 *    - Captures UTM, attribution, device, location, and lead quality data
 *
 * Data Flow:
 * Input → Process Data → Send to All 4 Services → Return Success Response
 *     ↓         ↓             ↓                    ↓
 *   Form     UTM/Device    GHL + WebinarKit +    webinar_response +
 *   Data     Detection     Meta + Supabase      ghl_contact_id
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { createHash } from "crypto";
import { getRequestCountry } from "../../lib/getRequestCountry";
import { notifySlack } from "../../lib/notifySlack";
import { autoCorrectEmail, normalizeNameCase, splitFullName } from "../../lib/formHelpers";
import { webinarRegistrationSchema } from "../../lib/schemas/webinar-registration.schema";
import { supabase } from "../../lib/supabase";
import { GHL_FIELDS, GHL_V2_BASE, GHL_V2_VERSION } from "../../lib/ghl-fields";

// ========================================
// MAIN API HANDLER
// ========================================
export const POST: APIRoute = async ({ request, locals }) => {
  // ========================================
  // INITIALIZATION & ENVIRONMENT SETUP
  // ========================================
  const apiKey = import.meta.env.WEBINARKIT_API_KEY;
  // Read GHL vars from process.env (runtime). Astro inlines import.meta.env.*
  // values at BUILD time from whatever is in process.env then — so env vars
  // added to Netlify after the last deploy become `undefined` in the bundle.
  // process.env always reads live, so this survives env-var additions without
  // requiring a rebuild.
  const ghlPit = process.env.GHL_PIT || import.meta.env.GHL_PIT;
  const ghlLocationId = process.env.GHL_LOCATION_ID || import.meta.env.GHL_LOCATION_ID;
  const censusApiKey = import.meta.env.CENSUS_API_KEY;

  try {
    // ========================================
    // REQUEST PARSING & VALIDATION
    // ========================================
    const rawBody = await request.json();

    // Validate required fields before any processing.
    // If name/email/phone/date are missing or the wrong type, we return a
    // clear 400 error instead of crashing 200 lines later with a TypeError.
    const parseResult = webinarRegistrationSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      console.warn("⚠️ Webinar registration validation failed:", issues);
      return new Response(JSON.stringify({ error: "Invalid request", details: issues }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = parseResult.data;

    // Note: Phone validation was removed - all registrations are processed
    console.log("📥 Received form data:", JSON.stringify(body, null, 2));

    // ========================================
    // SPAM PROTECTION: HONEYPOT VALIDATION
    // ========================================
    // The company field is a hidden field that humans won't fill out.
    // If it contains any value, this is likely a bot submission.
    if (body.company && body.company.trim() !== "") {
      console.log("🤖 Honeypot triggered - rejecting spam submission");
      // Return success to avoid giving bots feedback that they were detected
      return new Response(JSON.stringify({ message: "Registration successful" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========================================
    // SPAM PROTECTION: COUNTRY CHECK
    // ========================================
    // The Astro Netlify adapter exposes geo data at locals.netlify.context.geo.
    // The edge function in netlify.toml already blocks non-US traffic at the CDN
    // layer — this is a defense-in-depth backup. Fail-open only when no geo data
    // is available (local dev without Netlify in front).
    // TEMP: disabled for local testing — RESTORE BEFORE LAUNCH
    // const country = getRequestCountry(request, locals);
    // if (country && country !== "US") {
    //   console.log("🌍 Non-US webinar registration blocked:", { country });
    //   return new Response(JSON.stringify({ message: "Registration successful" }), {
    //     status: 200,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }

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
    // Extract and process form data with server-side fallbacks for all three services

    // Process UTM parameters from both request body and referer URL
    // USED BY: GoHighLevel (custom fields), WebinarKit (not used), Meta (event attribution)
    const referer = request.headers.get("referer") || "";
    let _refUrl: URL | null = null;
    try {
      _refUrl = referer ? new URL(referer) : null;
    } catch {}

    // UTM values are read inline where needed (from body first, then referer query)

    // Detect device type from user agent as fallback
    // USED BY: GoHighLevel (custom field), WebinarKit (not used), Meta (user agent data)
    const ua = request.headers.get("user-agent") || "";
    const serverDevice = (() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      if (!isMobile) return "desktop";
      if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
      if (/Android/i.test(ua)) return "android";
      return "android";
    })();

    // Determine webinar test and other final values
    // USED BY: GoHighLevel (custom fields), Meta (not used)
    const _webinarTest = body.webinar_test || "unknown";
    const utmCampaignFinal =
      body.utm_campaign ||
      (body?.utm && typeof body.utm === "object" ? body.utm.utm_campaign : undefined) ||
      "Webinar";
    const deviceFinal = body.device_type || serverDevice || "unknown";

    // Get client IP for geolocation.
    // x-real-client-ip is set by our edge function (geo-block.js) from context.ip,
    // which is the visitor's real IP captured at the CDN edge before internal routing.
    // Fallbacks are for non-edge-function routes or local development.
    const xffHeader = request.headers.get("x-forwarded-for") || "";
    const clientIpFromHeaders =
      request.headers.get("x-real-client-ip") ||
      request.headers.get("x-nf-client-connection-ip") ||
      (xffHeader.split(",")[0] || "").trim() ||
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      "";

    // Use server-side IP for geolocation and GHL
    const ipForGeo = clientIpFromHeaders;

    let geoRegionName: string | undefined;
    let geoStateCode: string | undefined;
    let geoCity: string | undefined;
    let geoZip: string | undefined;
    let geoCountryCode: string | undefined;
    let isHostingIp = false;

    try {
      if (ipForGeo) {
        // Request hosting + proxy + countryCode fields alongside location data for bot detection
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
            console.log("📍 IP geolocation:", {
              ipForGeo,
              geoCountryCode,
              geoStateCode,
              geoRegionName,
              geoCity,
              geoZip,
              hosting: geo.hosting,
              proxy: geo.proxy,
            });
          } else {
            console.warn("⚠️ IP geolocation lookup failed:", geo?.message || "unknown error");
          }
        } else {
          console.warn("⚠️ IP geolocation HTTP error:", geoRes.status);
        }
      }
    } catch (e) {
      console.warn("⚠️ IP geolocation lookup threw:", e);
    }

    // ========================================
    // SPAM PROTECTION: DATA CENTER IP CHECK
    // ========================================
    // If the visitor's IP belongs to a data center (AWS, Azure, etc.),
    // it's likely a bot — unless it's a US-based IP (probably a VPN user).
    // Return fake success so bots don't know they were detected.
    if (isHostingIp && geoCountryCode !== "US") {
      console.log(
        `🤖 Data center IP detected (${ipForGeo}, country: ${geoCountryCode}) — rejecting bot submission`
      );
      return new Response(JSON.stringify({ message: "Registration successful" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========================================
    // EARLY WARNING: DATA CENTER LOCATION ALERT
    // ========================================
    // If a lead passes bot detection but still geolocates to known data center
    // cities, it likely means IP detection is broken again (getting server IPs
    // instead of real user IPs). Alert #fires so we catch it fast.
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
        "Webinar Registration",
        "Data Center Location Detected",
        `Lead geolocated to ${geoCity}, ${geoStateCode} (known data center location). IP detection may be broken — check x-real-client-ip header. IP: ${ipForGeo}`,
        body.email
      );
    }

    // Lookup median household income by zip code using US Census Bureau API
    // Classifies zip code as "High", "Mid", or "Low" income for lead segmentation
    let incomeLevel: string | undefined;
    try {
      if (geoZip && censusApiKey) {
        const censusRes = await fetch(
          `https://api.census.gov/data/2022/acs/acs5?get=B19013_001E&for=zip%20code%20tabulation%20area:${encodeURIComponent(geoZip)}&key=${encodeURIComponent(censusApiKey)}`
        );
        if (censusRes.ok) {
          const censusData = await censusRes.json();
          // Response format: [["B19013_001E","zip code tabulation area"],["114301","90210"]]
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
              console.log("💰 Zip income lookup:", { geoZip, medianIncome, incomeLevel });
            }
          }
        } else {
          console.warn("⚠️ Census API HTTP error:", censusRes.status);
        }
      }
    } catch (e) {
      console.warn("⚠️ Census income lookup threw:", e);
    }

    // Auto-correct email typos to improve user experience
    // USED BY: All services - ensures correct email delivery
    const emailCorrection = autoCorrectEmail(body.email);
    const correctedEmail = emailCorrection.correctedEmail;

    if (emailCorrection.wasCorrected) {
      console.log("📧 Email auto-corrected:", {
        original: body.email,
        corrected: correctedEmail,
        domainFixed: `${emailCorrection.originalDomain} → ${emailCorrection.correctedDomain}`,
      });
      // Update the email in the body for all subsequent processing
      body.email = correctedEmail;
    }

    // Normalize ALL CAPS names to Title Case for better readability
    // Only transforms if the entire name is uppercase - leaves mixed case names untouched
    const nameNormalization = normalizeNameCase(body.name);
    if (nameNormalization.wasNormalized) {
      console.log("📝 Name normalized from ALL CAPS:", {
        original: body.name,
        normalized: nameNormalization.normalizedName,
      });
      body.name = nameNormalization.normalizedName;
    }

    // Split full name into first and last name components
    // USED BY: GoHighLevel (not used), WebinarKit (firstName, lastName), Meta (fn, ln)
    const { firstName, lastName } = splitFullName(body.name);
    console.log("👤 Name split:", { fullName: body.name, firstName, lastName });

    // ========================================
    // STEP 1: GO HIGH LEVEL INTEGRATION (v2 API)
    // ========================================
    // Upsert contact in GoHighLevel CRM via v2 API using Private Integration Token.
    // v1 was returning empty-body 404s as it's being deprecated; v2 is the supported path.
    let ghlContactId = null;
    if (!ghlPit || !ghlLocationId) {
      console.error("❌ GHL env vars missing at runtime", {
        ghlPit: ghlPit ? "set" : "MISSING",
        ghlLocationId: ghlLocationId ? "set" : "MISSING",
      });
      await notifySlack(
        "Webinar Registration",
        "GHL Env Var Missing",
        `GHL_PIT=${ghlPit ? "set" : "MISSING"}, GHL_LOCATION_ID=${ghlLocationId ? "set" : "MISSING"}. Contact will only have WebinarKit fields.`,
        body.email
      );
    } else {
      try {
        // Prepare date formatting for user's timezone
        const userTimezone = body.user_timezone || "Unknown";
        const now = new Date();
        const userLocalTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
        const mm = String(userLocalTime.getMonth() + 1).padStart(2, "0");
        const dd = String(userLocalTime.getDate()).padStart(2, "0");
        const yyyy = userLocalTime.getFullYear();
        const currentDate = `${mm}-${dd}-${yyyy}`;
        // Compute the SELECTED SESSION date in MM-DD-YYYY format using user's timezone
        // This ensures signup date and session date are comparable and distinct
        const selectedSessionDate = (() => {
          try {
            if (body?.date) {
              const selectedUTC = new Date(body.date);
              if (!isNaN(selectedUTC.getTime())) {
                const selectedLocal = new Date(
                  selectedUTC.toLocaleString("en-US", { timeZone: userTimezone })
                );
                const smm = String(selectedLocal.getMonth() + 1).padStart(2, "0");
                const sdd = String(selectedLocal.getDate()).padStart(2, "0");
                const syyyy = selectedLocal.getFullYear();
                return `${smm}-${sdd}-${syyyy}`;
              }
            }
          } catch {}
          return undefined;
        })();

        // Compute the SELECTED SESSION date in MM/DD/YYYY format for GHL calendar fields
        const selectedSessionCalendar = (() => {
          try {
            if (body?.date) {
              const selectedUTC = new Date(body.date);
              if (!isNaN(selectedUTC.getTime())) {
                const selectedLocal = new Date(
                  selectedUTC.toLocaleString("en-US", { timeZone: userTimezone })
                );
                const smm = selectedLocal.getMonth() + 1;
                const sdd = selectedLocal.getDate();
                const syyyy = selectedLocal.getFullYear();
                return `${smm}/${sdd}/${syyyy}`;
              }
            }
          } catch {}
          return undefined;
        })();

        // Build slug → value map for custom fields. Only slugs present in
        // GHL_FIELDS will reach GHL (others — google_*, wbraid/gbraid, legacy
        // webinar_date variants — don't exist as columns in GHL and were being
        // silently dropped in v1 too).
        const customFieldSlugs: Record<string, any> = {
          invest_intent: body.invest_intent,
          webinar_sign_up_date: body.webinar_sign_up_date,
          webinar_signup_date: currentDate,
          userip: ipForGeo || "unknown",
          device_type: deviceFinal,
          webinar_date__time: body.fullDate,
          webinar_datetime_user_tz: body.webinar_datetime_user_tz || body.fullDate,
          webinar_event_date: selectedSessionCalendar,
          webinar_calendar_url: body.webinar_calendar_url || "",
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
          zip_income_level: incomeLevel || "unknown",
          cmpid: body?.cmpid ?? "none",
          ad_group: body?.utm?.utm_adgroup ?? "none",
          landing_video: body.landing_video || "No",
        };
        void selectedSessionDate; // formerly sent as webinar_session_date — no GHL column

        // Transform slug map → v2 customFields array of {id, field_value}.
        const customFields = Object.entries(customFieldSlugs)
          .filter(
            ([slug, val]) =>
              GHL_FIELDS[slug] && val !== undefined && val !== null && val !== ""
          )
          .map(([slug, val]) => ({
            id: GHL_FIELDS[slug],
            field_value: String(val),
          }));

        // v2 expects phone in E.164 format (+1XXXXXXXXXX for US)
        const phoneDigits = body.phone_number.replace(/\D/g, "").replace(/^1/, "");
        const phoneE164 = phoneDigits ? `+1${phoneDigits}` : undefined;

        // v2 upsert payload (creates new contact or updates existing match by email/phone)
        const ghlPayload: Record<string, any> = {
          firstName,
          lastName,
          name: body.name,
          email: body.email,
          locationId: ghlLocationId,
          source: utmCampaignFinal,
          ...(phoneE164 ? { phone: phoneE164 } : {}),
          ...(body.user_timezone ? { timezone: body.user_timezone } : {}),
          ...(geoRegionName ? { state: geoRegionName } : {}),
          ...(geoCity ? { city: geoCity } : {}),
          ...(geoZip ? { postalCode: geoZip } : {}),
          ...(geoCountryCode ? { country: geoCountryCode } : {}),
          customFields,
        };

        console.log("🧾 GHL v2 customFields:", JSON.stringify(customFields, null, 2));
        console.log("📤 Sending to GoHighLevel v2 upsert:", JSON.stringify(ghlPayload, null, 2));

        // Wrapped with retry + safe body parsing: any external service can return
        // empty/non-JSON bodies under transient failure, which used to crash
        // JSON.parse and silently drop the contact (all custom fields lost).
        const postToGhl = async (
          payload: Record<string, any>,
          attempt = 1
        ): Promise<{ res: Response; data: any }> => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          try {
            const res = await fetch(`${GHL_V2_BASE}/contacts/upsert`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${ghlPit}`,
                Version: GHL_V2_VERSION,
              },
              body: JSON.stringify(payload),
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

            // Retry on empty body, 429 (rate limit), or 5xx
            const transient = !text || res.status === 429 || res.status >= 500;
            if (transient && attempt < 3) {
              console.log(`🔁 GHL transient failure, retrying (attempt ${attempt + 1})`);
              await new Promise((r) => setTimeout(r, 1000 * attempt));
              return postToGhl(payload, attempt + 1);
            }
            return { res, data };
          } catch (err) {
            clearTimeout(timer);
            if (attempt < 3) {
              const msg = err instanceof Error ? err.message : String(err);
              console.log(`🔁 GHL network error, retrying (attempt ${attempt + 1}): ${msg}`);
              await new Promise((r) => setTimeout(r, 1000 * attempt));
              return postToGhl(payload, attempt + 1);
            }
            throw err;
          }
        };

        const { res: ghlRes, data: ghlData } = await postToGhl(ghlPayload);
        // v2 upsert returns { contact: { id, ... }, new: boolean } or { id: "...", ... }
        ghlContactId = ghlData?.contact?.id || ghlData?.id || null;

        if (!ghlRes.ok || !ghlContactId) {
          console.warn("⚠️ GHL contact upsert failed after 3 attempts:", {
            status: ghlRes.status,
            data: ghlData,
          });
          await notifySlack(
            "Webinar Registration",
            "GoHighLevel API Error",
            `Status ${ghlRes.status} after 3 attempts. Body: ${
              ghlData ? JSON.stringify(ghlData).slice(0, 200) : "empty"
            }`,
            body.email
          );
        } else {
          console.log(
            "✅ GHL contact upserted:",
            ghlContactId,
            ghlData?.new ? "(new)" : "(updated)"
          );
        }
      } catch (err) {
        console.error("❌ Error upserting GHL contact after retries:", err);
        await notifySlack(
          "Webinar Registration",
          "GoHighLevel Network/Parse Error",
          `Failed after 3 attempts: ${err instanceof Error ? err.message : String(err)}`,
          body.email
        );
      }
    }

    // ========================================
    // STEP 2: WEBINARKIT INTEGRATION
    // ========================================
    // Register attendee with WebinarKit platform for webinar delivery
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${apiKey}`);
    myHeaders.append("Content-Type", "application/json");

    // Prepare WebinarKit registration payload
    // USED BY: WebinarKit only - these fields register the user for the actual webinar
    const webinarKitPayload = {
      // User's contact information for webinar registration
      email: body.email,
      firstName: firstName, // Split from full name for WebinarKit format
      lastName: lastName, // Split from full name for WebinarKit format
      phoneNumberCountryCode: "+1",
      phoneNumber: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
      // Webinar scheduling information
      date: body.date, // ISO datetime for webinar session
      fullDate: body.fullDate, // Human-readable datetime for display
      // Analytics and segmentation fields for WebinarKit CSV export
      source: body?.utm?.utm_source || "direct",
      customField1: (() => {
        if (!body.invest_intent) return "";
        const n = Number(String(body.invest_intent).replace(/[^\d.]/g, ""));
        return isNaN(n) || n === 0
          ? ""
          : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      })(),
      customField2: utmCampaignFinal,
      customField3: body?.utm?.utm_content || "",
      customField4: body?.utm?.utm_adgroup || body?.google_adgroup_id || "",
      customField5: deviceFinal,
    };

    console.log("📤 Sending to WebinarKit:", JSON.stringify(webinarKitPayload, null, 2));

    // WebinarKit API endpoint configuration
    // Use the webinar ID from request body, or default to scheduled webinar
    const scheduledWebinarId = "684ae034de7a164da41abe10";
    const webinarId = body.webinar_id || scheduledWebinarId;
    const apiUrl = `https://webinarkit.com/api/webinar/registration/${webinarId}`;
    console.log("🔗 WebinarKit API URL:", apiUrl);

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(webinarKitPayload),
      redirect: "follow",
    };

    console.log("🚀 Making request to WebinarKit...");
    const response = await fetch(apiUrl, requestOptions);
    const responseText = await response.text();
    console.log("📥 WebinarKit response status:", response.status);

    // Parse and log WebinarKit response
    try {
      const responseJson = JSON.parse(responseText);
      console.log("📥 WebinarKit response:", JSON.stringify(responseJson, null, 2));
    } catch (e) {
      console.log("📥 WebinarKit response (text):", responseText);
    }

    // Handle WebinarKit registration failure
    if (!response.ok) {
      console.error("❌ Webinar registration failed:", responseText);
      await notifySlack(
        "Webinar Registration",
        "WebinarKit API Error",
        `Status ${response.status}: ${responseText.slice(0, 200)}`,
        body.email
      );
      return new Response(
        JSON.stringify({ error: "Webinar registration failed", details: responseText }),
        { status: response.status }
      );
    }

    // ========================================
    // STEP 3: META CONVERSIONS API
    // ========================================
    // Send conversion event to Meta (Facebook) for analytics and advertising
    // Skip for low investment intent ($1k/$5k) to improve Meta ad optimization quality
    const investIntentValue = String(body.invest_intent || "");
    const shouldSendToMeta = investIntentValue !== "1000" && investIntentValue !== "5000";

    if (shouldSendToMeta) {
      try {
        // Meta Pixel configuration
        const pixelId = "652212003052612"; // Public Pixel ID; safe to hardcode
        const accessToken = import.meta.env.META_ACCESS_TOKEN as string | undefined;
        const testEventCode = import.meta.env.META_TEST_EVENT_CODE as string | undefined;

        if (pixelId && accessToken) {
          // Prepare user data for Meta Conversions API (privacy-compliant hashing)
          // USED BY: Meta only - hashed user identifiers for ad attribution and retargeting
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

          // Create external IDs for Meta user matching (cross-device tracking)
          // USED BY: Meta only - includes GHL contact ID for unified customer view
          const externalIds: string[] = [];
          if (normalizedEmail) {
            externalIds.push(createHash("sha256").update(normalizedEmail).digest("hex"));
          }
          if (ghlContactId) {
            externalIds.push(createHash("sha256").update(String(ghlContactId)).digest("hex"));
          }

          // Extract client IP address for Meta API (required for server-side events)
          // USED BY: Meta only - for geographic attribution and fraud prevention
          const xff = request.headers.get("x-forwarded-for") || "";
          const clientIp =
            request.headers.get("x-real-client-ip") ||
            request.headers.get("x-nf-client-connection-ip") ||
            (xff.split(",")[0] || "").trim() ||
            request.headers.get("cf-connecting-ip") ||
            request.headers.get("x-real-ip") ||
            "";

          // Extract Facebook-specific tracking parameters for event deduplication
          // USED BY: Meta only - prevents duplicate conversion counting
          const eventIdFromClient = (body.event_id || "").toString();
          const fbpFromClient = (body.fbp || "").toString();
          let fbcFromClient = (body.fbc || "").toString();

          // Generate fbc from fbclid if not provided
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

          // Prepare investment intent as predicted LTV for Meta audience building
          // USED BY: Meta only - tracks lead quality without counting as revenue
          const investValue = Number(body.invest_intent) || 0;

          // Construct Meta Conversions API payload for CompleteRegistration event
          // USED BY: Meta only - sends conversion data to Facebook for ad optimization
          const fbBody: Record<string, unknown> = {
            data: [
              {
                // Standard Meta conversion event name
                event_name: "CompleteRegistration",
                // Unix timestamp for when the event occurred
                event_time: Math.floor(Date.now() / 1000),
                // Source of the event (website for server-side tracking)
                action_source: "website",
                // URL where the event occurred for attribution
                event_source_url: referer || "",
                // Optional client-side event ID for deduplication
                ...(eventIdFromClient ? { event_id: eventIdFromClient } : {}),
                // Hashed user identifiers for privacy-compliant tracking
                user_data: {
                  // Hashed email for user matching
                  ...(emHashed ? { em: [emHashed] } : {}),
                  // Hashed phone for user matching
                  ...(phHashed ? { ph: [phHashed] } : {}),
                  // Hashed first name for user matching
                  ...(fnHashed ? { fn: [fnHashed] } : {}),
                  // Hashed last name for user matching
                  ...(lnHashed ? { ln: [lnHashed] } : {}),
                  // Hashed city for user matching
                  ...(ctHashed ? { ct: [ctHashed] } : {}),
                  // Hashed 2-letter state code for user matching
                  ...(stHashed ? { st: [stHashed] } : {}),
                  // Hashed 5-digit zip code for user matching
                  ...(zpHashed ? { zp: [zpHashed] } : {}),
                  // Hashed country code (always US in this funnel)
                  country: [countryHashed],
                  // External IDs including GHL contact ID
                  ...(externalIds.length ? { external_id: externalIds } : {}),
                  // Facebook browser cookie for attribution
                  ...(fbpFromClient ? { fbp: fbpFromClient } : {}),
                  // Facebook click ID for campaign attribution
                  ...(fbcFromClient ? { fbc: fbcFromClient } : {}),
                  // User agent for device and browser detection
                  client_user_agent: ua,
                  // Client IP for geographic attribution
                  client_ip_address: clientIp,
                },
                // Custom data for the conversion event
                custom_data: {
                  // Investment intent as predicted lifetime value (not actual revenue)
                  predicted_ltv: investValue,
                  content_type: "webinar_registration",
                },
              },
            ],
          };

          // Add test event code if configured (for testing)
          if (testEventCode) {
            (fbBody as any).test_event_code = testEventCode;
          }

          // Send conversion event to Meta
          const fbRes = await fetch(
            `https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(fbBody),
            }
          );

          const fbText = await fbRes.text();
          if (!fbRes.ok) {
            console.warn("⚠️ Meta Conversions API error:", fbText);
          } else {
            try {
              const parsed = JSON.parse(fbText);
              console.log("✅ Meta Conversions API response:", JSON.stringify(parsed, null, 2));
            } catch {
              console.log("✅ Meta Conversions API response:", fbText);
            }
          }
        } else {
          console.warn(
            "⚠️ META_PIXEL_ID or META_ACCESS_TOKEN not set. Skipping Meta Conversions API call."
          );
        }
      } catch (err) {
        console.error("❌ Failed to send Meta Conversions API event:", err);
      }
    } else {
      console.log("⏭️ Skipping Meta CAPI — low investment intent:", investIntentValue);
    }

    // ========================================
    // STEP 4: SUPABASE ANALYTICS INSERT
    // ========================================
    // Store registration data in Supabase for analytics and reporting
    // Non-blocking: we don't wait for this to complete before responding to the user
    try {
      supabase
        .from("webinar_registrations")
        .insert({
          email: body.email,
          first_name: firstName,
          last_name: lastName,
          phone: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
          invest_intent: String(body.invest_intent || ""),
          zip_income_level: incomeLevel || "",
          webinar_date: body.date,
          session_type: "scheduled",
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
          presentation_date: body.fullDate || "",
        })
        .then(({ error }) => {
          if (error) {
            console.error("❌ Supabase insert error:", error.message);
          } else {
            console.log("✅ Supabase registration saved for:", body.email);
          }
        });
    } catch (err) {
      console.error("❌ Supabase insert threw:", err);
    }

    // ========================================
    // SUCCESS RESPONSE
    // ========================================
    // All integrations completed successfully - return data from each service
    const webinarResponse = JSON.parse(responseText);

    return new Response(
      JSON.stringify({
        message: "Registration successful",
        // FROM WebinarKit: Registration confirmation and webinar details
        webinar_response: webinarResponse,
        // FROM GoHighLevel: Contact ID for CRM integration
        ghl_contact_id: ghlContactId,
        // FROM Meta: No response data needed (fire-and-forget conversion tracking)
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    // Handle any errors that occurred during the registration process
    console.error("❌ Error during registration:", error);
    await notifySlack("Webinar Registration", "Unhandled Error", String(error));
    return new Response(JSON.stringify({ error: "An error occurred during registration" }), {
      status: 500,
    });
  }
};
