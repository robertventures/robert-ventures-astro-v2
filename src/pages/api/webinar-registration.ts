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
 * Data Flow:
 * Input → Process Data → Send to All 3 Services → Return Success Response
 *     ↓         ↓             ↓                    ↓
 *   Form     UTM/Device    GHL + WebinarKit +    webinar_response +
 *   Data     Detection     Meta Tracking        ghl_contact_id
 */

export const prerender = false;

import type { APIRoute } from "astro";
import { createHash } from "crypto";

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Auto-corrects common email typos to improve user experience
 * Fixes domain typos without requiring user intervention
 */
function autoCorrectEmail(email: string): { correctedEmail: string; wasCorrected: boolean; originalDomain?: string; correctedDomain?: string } {
    if (!email || typeof email !== 'string') {
        return { correctedEmail: email, wasCorrected: false };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const [localPart, domain] = trimmedEmail.split('@');
    
    if (!domain) {
        return { correctedEmail: email, wasCorrected: false };
    }

    // Common email domain typos and their corrections
    const domainCorrections: Record<string, string> = {
        // Gmail typos
        'gmail.con': 'gmail.com',
        'gmail.co': 'gmail.com',
        'gmail.cm': 'gmail.com',
        'gmail.coom': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'gmail.om': 'gmail.com',
        // Yahoo typos
        'yahoo.co': 'yahoo.com',
        'yahoo.cm': 'yahoo.com',
        'yahoo.con': 'yahoo.com',
        'hahoo.com': 'yahoo.com',
        'yahoo.om': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        
        // Hotmail typos
        'hotmail.co': 'hotmail.com',
        'hotmail.con': 'hotmail.com',
        'hotmail.cm': 'hotmail.com',
        'hotmai.com': 'hotmail.com',
        'hotmail.om': 'hotmail.com',
        
        // Outlook typos
        'outlook.co': 'outlook.com',
        'outlook.con': 'outlook.com',
        'outlook.cm': 'outlook.com',
        'outloo.com': 'outlook.com',
        'outlook.om': 'outlook.com',
        
        // Other common domains
        'icloud.co': 'icloud.com',
        'icloud.con': 'icloud.com',
        'aol.co': 'aol.com',
        'aol.con': 'aol.com',
        'live.co': 'live.com',
        'live.con': 'live.com'
    };

    const correctedDomain = domainCorrections[domain];
    if (correctedDomain) {
        const correctedEmail = `${localPart}@${correctedDomain}`;
        return {
            correctedEmail,
            wasCorrected: true,
            originalDomain: domain,
            correctedDomain: correctedDomain
        };
    }

    return { correctedEmail: email, wasCorrected: false };
}

/**
 * Normalizes ALL CAPS names to Title Case for better readability
 * Only transforms if the entire name is uppercase - leaves mixed case names untouched
 * Handles special cases: O'Brien, McDonald, hyphenated names (Mary-Jane)
 */
function normalizeNameCase(name: string): { normalizedName: string; wasNormalized: boolean } {
    if (!name || typeof name !== 'string') {
        return { normalizedName: name, wasNormalized: false };
    }

    const trimmedName = name.trim();

    // Only normalize if the name is ALL CAPS (letters only, ignoring spaces/punctuation)
    const lettersOnly = trimmedName.replace(/[^a-zA-Z]/g, '');
    if (lettersOnly.length === 0 || lettersOnly !== lettersOnly.toUpperCase()) {
        // Not all caps, leave it alone
        return { normalizedName: trimmedName, wasNormalized: false };
    }

    // Convert to Title Case, handling special characters
    const normalized = trimmedName
        .toLowerCase()
        .split(/(\s+)/) // Split by spaces but keep the spaces
        .map(part => {
            if (part.trim() === '') return part; // Preserve spaces

            // Handle hyphenated names (e.g., MARY-JANE → Mary-Jane)
            if (part.includes('-')) {
                return part.split('-').map(p =>
                    p.charAt(0).toUpperCase() + p.slice(1)
                ).join('-');
            }

            // Handle apostrophes (e.g., O'BRIEN → O'Brien)
            if (part.includes("'")) {
                return part.split("'").map(p =>
                    p.charAt(0).toUpperCase() + p.slice(1)
                ).join("'");
            }

            // Standard capitalization
            return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join('');

    return { normalizedName: normalized, wasNormalized: true };
}

/**
 * Splits a full name into first and last name components
 * Handles various name formats gracefully
 */
function splitFullName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName || typeof fullName !== 'string') {
        return { firstName: "", lastName: "" };
    }

    const trimmedName = fullName.trim();
    if (!trimmedName) {
        return { firstName: "", lastName: "" };
    }

    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);

    if (nameParts.length === 0) {
        return { firstName: "", lastName: "" };
    } else if (nameParts.length === 1) {
        // Only one name provided, use as first name
        return { firstName: nameParts[0], lastName: "" };
    } else if (nameParts.length === 2) {
        // Two names provided, use as first and last
        return { firstName: nameParts[0], lastName: nameParts[1] };
    } else {
        // More than two names, use first as first name, rest as last name
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ");
        return { firstName, lastName };
    }
}

    // ========================================
    // MAIN API HANDLER
    // ========================================
    export const POST: APIRoute = async ({ request }) => {
        // ========================================
        // INITIALIZATION & ENVIRONMENT SETUP
        // ========================================
        const apiKey = import.meta.env.WEBINARKIT_API_KEY;
        const ghlApiKey = import.meta.env.GHL_API_KEY;

        try {
            // ========================================
            // REQUEST PARSING & VALIDATION
            // ========================================
            const body = await request.json();

            // Note: Phone validation was removed - all registrations are processed
            console.log("📥 Received form data:", JSON.stringify(body, null, 2));

            // ========================================
            // SPAM PROTECTION: HONEYPOT VALIDATION
            // ========================================
            // The bot-field is a hidden field that humans won't fill out.
            // If it contains any value, this is likely a bot submission.
            if (body.bot_field && body.bot_field.trim() !== "") {
                console.log("🤖 Honeypot triggered - rejecting spam submission");
                // Return success to avoid giving bots feedback that they were detected
                return new Response(
                    JSON.stringify({ message: "Registration successful" }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            }

            // ========================================
            // DATA PROCESSING & ENRICHMENT
            // ========================================
            // Extract and process form data with server-side fallbacks for all three services

            // Process UTM parameters from both request body and referer URL
            // USED BY: GoHighLevel (custom fields), WebinarKit (not used), Meta (event attribution)
            const referer = request.headers.get("referer") || "";
            let refUrl: URL | null = null;
            try { refUrl = referer ? new URL(referer) : null; } catch {}

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
            // USED BY: GoHighLevel (custom fields), WebinarKit (customField1), Meta (not used)
            const webinarTest = body.webinar_test || 'unknown';
            const utmCampaignFinal = body.utm_campaign
                || (body?.utm && typeof body.utm === 'object' ? body.utm.utm_campaign : undefined)
                || "Webinar";
            const deviceFinal = body.device_type || serverDevice || "unknown";

            // Get client IP from server headers (Netlify provides this automatically)
            // No client-side IP capture needed - server always has access to the real IP
            const xffHeader = request.headers.get("x-forwarded-for") || "";
            const clientIpFromHeaders = (xffHeader.split(",")[0] || "").trim() ||
                request.headers.get("cf-connecting-ip") ||
                request.headers.get("x-real-ip") || "";

            // Use server-side IP for geolocation and GHL
            const ipForGeo = clientIpFromHeaders;

            let geoRegionName: string | undefined;
            let geoCity: string | undefined;
            let geoZip: string | undefined;

            try {
                if (ipForGeo) {
                    const geoRes = await fetch(`http://ip-api.com/json/${encodeURIComponent(ipForGeo)}?fields=status,message,regionName,city,zip`);
                    if (geoRes.ok) {
                        const geo = await geoRes.json();
                        if (geo && geo.status === "success") {
                            geoRegionName = typeof geo.regionName === "string" && geo.regionName ? geo.regionName : undefined;
                            geoCity = typeof geo.city === "string" && geo.city ? geo.city : undefined;
                            geoZip = typeof geo.zip === "string" && geo.zip ? geo.zip : undefined;
                            console.log("📍 IP geolocation:", { ipForGeo, geoRegionName, geoCity, geoZip });
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

            // Auto-correct email typos to improve user experience
            // USED BY: All services - ensures correct email delivery
            const emailCorrection = autoCorrectEmail(body.email);
            const correctedEmail = emailCorrection.correctedEmail;
            
            if (emailCorrection.wasCorrected) {
                console.log("📧 Email auto-corrected:", {
                    original: body.email,
                    corrected: correctedEmail,
                    domainFixed: `${emailCorrection.originalDomain} → ${emailCorrection.correctedDomain}`
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
                    normalized: nameNormalization.normalizedName
                });
                body.name = nameNormalization.normalizedName;
            }

            // Split full name into first and last name components
            // USED BY: GoHighLevel (not used), WebinarKit (firstName, lastName), Meta (not used)
            const { firstName, lastName } = splitFullName(body.name);
            console.log("👤 Name split:", { fullName: body.name, firstName, lastName });

            // Check if this is an instant (on-demand) session
            // USED BY: GHL (custom field), WebinarKit (webinar ID selection), Response (redirect logic)
            const isInstantSession = body.date === "instant" || body.is_instant === true;

            // ========================================
            // STEP 1: GO HIGH LEVEL INTEGRATION
            // ========================================
            // Create contact in GoHighLevel CRM system
            let ghlContactId = null;
            if (ghlApiKey) {
                try {
                    // Prepare date formatting for user's timezone
                    const userTimezone = body.user_timezone || "Unknown";
                    const now = new Date();
                    const userLocalTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
                    const mm = String(userLocalTime.getMonth() + 1).padStart(2, '0');
                    const dd = String(userLocalTime.getDate()).padStart(2, '0');
                    const yyyy = userLocalTime.getFullYear();
                    const currentDate = `${mm}-${dd}-${yyyy}`;
                    // Compute the SELECTED SESSION date in MM-DD-YYYY format using user's timezone
                    // This ensures signup date and session date are comparable and distinct
                    const selectedSessionDate = (() => {
                        try {
                            if (body?.date) {
                                const selectedUTC = new Date(body.date);
                                if (!isNaN(selectedUTC.getTime())) {
                                    const selectedLocal = new Date(selectedUTC.toLocaleString("en-US", { timeZone: userTimezone }));
                                    const smm = String(selectedLocal.getMonth() + 1).padStart(2, '0');
                                    const sdd = String(selectedLocal.getDate()).padStart(2, '0');
                                    const syyyy = selectedLocal.getFullYear();
                                    return `${smm}-${sdd}-${syyyy}`;
                                }
                            }
                        } catch {}
                        return undefined;
                    })();

                    // Prepare custom fields for GoHighLevel contact (CRM segmentation and analytics)
                    // USED BY: GoHighLevel only - these fields help segment contacts for sales follow-up
                    let customField: Record<string, any> = {
                        // Investment intent amount for lead qualification
                        invest_intent: body.invest_intent,
                        // Original signup date from frontend
                        webinar_sign_up_date: body.webinar_sign_up_date,
                        // Formatted signup date in user's timezone for GHL
                        webinar_signup_date: currentDate,
                        // User's IP address for location tracking
                        userip: ipForGeo || "unknown",
                        // Device type for user experience insights
                        device_type: deviceFinal,
                        // Webinar selection datetime (ISO UTC format or "instant" for on-demand)
                        webinar_date: body.date,
                        // Webinar selection datetime (human-readable with timezone)
                        webinar_full_date: body.fullDate,
                        // Duplicate field to match GHL handler expectations
                        webinar_date__time: body.fullDate,
                        // Selected session date formatted in user's timezone (undefined for instant)
                        webinar_session_date: selectedSessionDate,
                        // Session type: "instant" for on-demand, "scheduled" for live sessions
                        webinar_session_type: isInstantSession ? "instant" : "scheduled",
                        // Google Calendar URL for easy calendar integration (empty for instant)
                        webinar_calendar_url: body.webinar_calendar_url || "",
                        // UTM parameters for marketing attribution (always send with defaults)
                        // Note: Google Ads data is mapped to UTM fields in userAttribution.js
                        utm_source: (body?.utm?.utm_source ?? "direct"),
                        utm_medium: (body?.utm?.utm_medium ?? "none"),
                        utm_campaign: (body?.utm?.utm_campaign ?? (body?.utm_campaign ?? "none")),
                        utm_content: (body?.utm?.utm_content ?? "none"),
                        utm_term: (body?.utm?.utm_term ?? "none"),
                        utm_id: (body?.utm?.utm_id ?? "none"),
                        // Google Click ID (custom field for Google Ads attribution)
                        google_click_id: (body?.gclid ?? "none")
                    };

                    // Prepare the complete payload for GoHighLevel API
                    const ghlPayload = {
                        name: body.name,
                        phone: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
                        email: body.email,
                        source: utmCampaignFinal,
                        timezone: body.user_timezone || "Unknown",
                        // Default contact address fields (not customField)
                        ...(geoRegionName ? { state: geoRegionName } : {}),
                        ...(geoCity ? { city: geoCity } : {}),
                        ...(geoZip ? { postalCode: geoZip } : {}),
                        customField
                    };

                    console.log("🧾 GHL customField being sent:", JSON.stringify(customField, null, 2));
                    console.log("📤 Sending to GoHighLevel:", JSON.stringify(ghlPayload, null, 2));

                    // Make API call to create contact in GoHighLevel
                    const ghlRes = await fetch("https://rest.gohighlevel.com/v1/contacts", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${ghlApiKey}`,
                        },
                        body: JSON.stringify(ghlPayload),
                    });

                    const ghlData = await ghlRes.json();
                    ghlContactId = ghlData?.contact?.id || null;

                    if (!ghlRes.ok) {
                        console.warn("⚠️ GHL contact creation failed:", ghlData);
                    }
                } catch (err) {
                    console.error("❌ Error creating GHL contact:", err);
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
                firstName: firstName,           // Split from full name for WebinarKit format
                lastName: lastName,             // Split from full name for WebinarKit format
                phoneNumberCountryCode: "+1",
                phoneNumber: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
                // Webinar scheduling information
                date: body.date,                // ISO datetime for webinar session
                fullDate: body.fullDate,        // Human-readable datetime for display
                // Custom fields for WebinarKit analytics and segmentation
                customField1: webinarTest,      // Webinar test tracking
                customField2: body.invest_intent // Investment intent for lead scoring
            };

            console.log("📤 Sending to WebinarKit:", JSON.stringify(webinarKitPayload, null, 2));

            // WebinarKit API endpoint configuration
            // Use the webinar ID from request body, or default to scheduled webinar
            const scheduledWebinarId = "684ae034de7a164da41abe10";
            const onDemandWebinarId = "696d0df144dee112a61d5db8";
            const webinarId = isInstantSession ? onDemandWebinarId : (body.webinar_id || scheduledWebinarId);
            const apiUrl = `https://webinarkit.com/api/webinar/registration/${webinarId}`;
            console.log("🔗 WebinarKit API URL:", apiUrl);
            console.log("📋 Session type:", isInstantSession ? "on-demand" : "scheduled");

            const requestOptions: RequestInit = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(webinarKitPayload),
                redirect: "follow"
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
                return new Response(
                    JSON.stringify({ error: "Webinar registration failed", details: responseText }),
                    { status: response.status }
                );
            }

            // ========================================
            // STEP 3: META CONVERSIONS API
            // ========================================
            // Send conversion event to Meta (Facebook) for analytics and advertising
            try {
                // Meta Pixel configuration
                const pixelId = "652212003052612"; // Public Pixel ID; safe to hardcode
                const accessToken = import.meta.env.META_ACCESS_TOKEN as string | undefined;
                const testEventCode = import.meta.env.META_TEST_EVENT_CODE as string | undefined;

                if (pixelId && accessToken) {
                    // Prepare user data for Meta Conversions API (privacy-compliant hashing)
                    // USED BY: Meta only - hashed user identifiers for ad attribution and retargeting
                    const normalizedEmail = (body.email || "").toString().trim().toLowerCase();
                    const normalizedPhone = (body.phone_number || "").toString().replace(/\D/g, "").replace(/^1/, "");
                    const emHashed = normalizedEmail ? createHash("sha256").update(normalizedEmail).digest("hex") : "";
                    const phHashed = normalizedPhone ? createHash("sha256").update(normalizedPhone).digest("hex") : "";

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
                    const clientIp = (xff.split(",")[0] || "").trim() ||
                        request.headers.get("cf-connecting-ip") ||
                        request.headers.get("x-real-ip") || "";

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
                                    // External IDs including GHL contact ID
                                    ...(externalIds.length ? { external_id: externalIds } : {}),
                                    // Facebook browser cookie for attribution
                                    ...(fbpFromClient ? { fbp: fbpFromClient } : {}),
                                    // Facebook click ID for campaign attribution
                                    ...(fbcFromClient ? { fbc: fbcFromClient } : {}),
                                    // User agent for device and browser detection
                                    client_user_agent: ua,
                                    // Client IP for geographic attribution
                                    client_ip_address: clientIp
                                },
                                // Custom data for the conversion event
                                custom_data: {
                                    // Investment intent as predicted lifetime value (not actual revenue)
                                    predicted_ltv: investValue,
                                    currency: "USD",
                                    content_type: "webinar_registration"
                                }
                            }
                        ]
                    };

                    // Add test event code if configured (for testing)
                    if (testEventCode) {
                        (fbBody as any).test_event_code = testEventCode;
                    }

                    // Send conversion event to Meta
                    const fbRes = await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(fbBody)
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
                    console.warn("⚠️ META_PIXEL_ID or META_ACCESS_TOKEN not set. Skipping Meta Conversions API call.");
                }
            } catch (err) {
                console.error("❌ Failed to send Meta Conversions API event:", err);
            }

            // ========================================
            // SUCCESS RESPONSE
            // ========================================
            // All integrations completed successfully - return data from each service
            const webinarResponse = JSON.parse(responseText);
            
            // Extract watch room URL from WebinarKit response
            // For on-demand sessions, transform replay_url to watch room URL
            // WebinarKit returns: url (thank you page), replay_url (replay page)
            // Watch room URL format: /webinar/watch/{id}/?t={timestamp}&r={registrant_id}
            // The r= parameter is unique per registration and tracks attendance
            let watchRoomUrl: string | null = null;
            if (isInstantSession) {
                const replayUrl = webinarResponse?.replay_url;
                if (replayUrl) {
                    // Transform /replay/ to /webinar/watch/ to get the actual watch room
                    watchRoomUrl = replayUrl.replace('/replay/', '/webinar/watch/');
                } else {
                    watchRoomUrl = webinarResponse?.url || null;
                }
            } else {
                watchRoomUrl = webinarResponse?.url || null;
            }
            
            console.log("🎬 Watch room URL for redirect:", watchRoomUrl);
            
            return new Response(
                JSON.stringify({
                    message: "Registration successful",
                    // FROM WebinarKit: Registration confirmation and webinar details
                    webinar_response: webinarResponse,
                    // FROM GoHighLevel: Contact ID for CRM integration
                    ghl_contact_id: ghlContactId,
                    // Session type for frontend redirect logic
                    is_instant: isInstantSession,
                    // Watch room URL for on-demand sessions (redirect destination)
                    watch_room_url: watchRoomUrl
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
            return new Response(
                JSON.stringify({ error: "An error occurred during registration" }),
                { status: 500 }
            );
        }
    };
