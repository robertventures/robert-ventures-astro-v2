export const prerender = false;

import type { APIRoute } from "astro";
import { createHash } from "crypto";

export const POST: APIRoute = async ({ request }) => {
    const apiKey = import.meta.env.WEBINARKIT_API_KEY;
    const ghlApiKey = import.meta.env.GHL_API_KEY;

    // Function to split full name into first and last name
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

    try {
        const body = await request.json();
        // --- REMOVED PHONE VALIDATION ---
        // (No phone validation here, always process registration)
        // --- END REMOVAL ---

        // Derive values with server-side fallbacks
        const referer = request.headers.get("referer") || "";
        let refUrl: URL | null = null;
        try { refUrl = referer ? new URL(referer) : null; } catch {}

        const allowedUtms = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id'];
        const utmMerged: Record<string, string> = {};
        if (body.utm && typeof body.utm === 'object') {
            for (const key of allowedUtms) {
                if (body.utm[key]) utmMerged[key] = body.utm[key];
            }
        }
        if (refUrl) {
            for (const key of allowedUtms) {
                if (!utmMerged[key]) {
                    const v = refUrl.searchParams.get(key);
                    if (v) utmMerged[key] = v;
                }
            }
        }

        const ua = request.headers.get("user-agent") || "";
        const serverDevice = (() => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
            if (!isMobile) return "desktop";
            if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
            if (/Android/i.test(ua)) return "android";
            return "android";
        })();

        const webinarTest = body.webinar_test || 'unknown';
        const variantFromRef = (refUrl?.pathname || "").includes("webinar-2") ? "v1.1" : "v1.0";
        const webinarVariant = body.webinar_variant || variantFromRef || 'unknown';
        const utmCampaignFinal = body.utm_campaign || utmMerged.utm_campaign || "Webinar";
        const deviceFinal = body.device_type || serverDevice || "unknown";

        console.log("📥 Received form data:", JSON.stringify(body, null, 2));

        // Split full name into first and last name
        const { firstName, lastName } = splitFullName(body.name);
        console.log("👤 Name split:", { fullName: body.name, firstName, lastName });

        // 1. Send to GoHighLevel
        let ghlContactId = null;
        if (ghlApiKey) {
            try {
                // Get current date in MM-DD-YYYY format using user's timezone
                const userTimezone = body.user_timezone || "America/New_York";
                const now = new Date();
                const userLocalTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
                const mm = String(userLocalTime.getMonth() + 1).padStart(2, '0');
                const dd = String(userLocalTime.getDate()).padStart(2, '0');
                const yyyy = userLocalTime.getFullYear();
                const currentDate = `${mm}-${dd}-${yyyy}`;
                // Only forward the main UTM fields if present (merged from body and referer)
                // Compute the SELECTED SESSION date in MM-DD-YYYY (same format as signup date),
                // using the user's timezone so both are comparable and distinct.
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

                let customField = {
                    invest_intent: body.invest_intent,
                    webinar_sign_up_date: body.webinar_sign_up_date,
                    webinar_signup_date: currentDate,
                    userip: body.user_ip || "unknown",
                    webinar_ab_test_variant: webinarVariant,
                    device_type: deviceFinal,
                    // Include the actual webinar selection datetime values
                    webinar_date: body.date,          // ISO string in UTC from frontend
                    webinar_full_date: body.fullDate,  // Human-readable with timezone from frontend
                    // Match GHL handler key
                    webinar_date__time: body.fullDate,
                    webinar_session_date: selectedSessionDate
                };
                for (const key of allowedUtms) {
                    if (utmMerged[key]) {
                        customField[key] = utmMerged[key];
                    }
                }
                const ghlPayload = {
                    name: body.name,
                    phone: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
                    email: body.email,
                    source: utmCampaignFinal,
                    timezone: body.user_timezone || "Unknown",
                    customField
                };
                console.log("🧾 GHL customField being sent:", JSON.stringify(customField, null, 2));
                console.log("📤 Sending to GoHighLevel:", JSON.stringify(ghlPayload, null, 2));
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

        // 2. Send to WebinarKit
        const myHeaders = new Headers();
        myHeaders.append("Authorization", `Bearer ${apiKey}`);
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            email: body.email,
            firstName: firstName,
            lastName: lastName,
            phoneNumberCountryCode: "+1",
            phoneNumber: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
            date: body.date,
            fullDate: body.fullDate,
            customField1: webinarTest,
            customField2: webinarVariant,
            customField3: body.invest_intent
        });
        
        console.log("📤 Sending to WebinarKit:", JSON.stringify(JSON.parse(raw), null, 2));

        const webinarId = "684ae034de7a164da41abe10";
        const apiUrl = `https://webinarkit.com/api/webinar/registration/${webinarId}`;
        console.log("🔗 WebinarKit API URL:", apiUrl);
        
        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        console.log("🚀 Making request to WebinarKit...");
        const response = await fetch(apiUrl, requestOptions);
        const responseText = await response.text();
        console.log("📥 WebinarKit response status:", response.status);
        
        try {
            const responseJson = JSON.parse(responseText);
            console.log("📥 WebinarKit response:", JSON.stringify(responseJson, null, 2));
        } catch (e) {
            console.log("📥 WebinarKit response (text):", responseText);
        }

        if (!response.ok) {
            console.error("❌ Webinar registration failed:", responseText);
            return new Response(
                JSON.stringify({ error: "Webinar registration failed", details: responseText }),
                { status: response.status }
            );
        }

        // 3. Meta Conversions API (server-side) for CompleteRegistration
        try {
            const pixelId = "652212003052612"; // Public Pixel ID; safe to hardcode
            const accessToken = import.meta.env.META_ACCESS_TOKEN as string | undefined;
            const testEventCode = import.meta.env.META_TEST_EVENT_CODE as string | undefined;

            if (pixelId && accessToken) {
                const normalizedEmail = (body.email || "").toString().trim().toLowerCase();
                const normalizedPhone = (body.phone_number || "").toString().replace(/\D/g, "").replace(/^1/, "");
                const emHashed = normalizedEmail ? createHash("sha256").update(normalizedEmail).digest("hex") : "";
                const phHashed = normalizedPhone ? createHash("sha256").update(normalizedPhone).digest("hex") : "";
                const externalIds: string[] = [];
                if (normalizedEmail) {
                    externalIds.push(createHash("sha256").update(normalizedEmail).digest("hex"));
                }
                if (ghlContactId) {
                    externalIds.push(createHash("sha256").update(String(ghlContactId)).digest("hex"));
                }

                const xff = request.headers.get("x-forwarded-for") || "";
                const clientIp = (xff.split(",")[0] || "").trim() || request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "";

                // Deduplication and click ids from client
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

                const investValue = Number(body.invest_intent) || 0;

                const fbBody: Record<string, unknown> = {
                    data: [
                        {
                            event_name: "CompleteRegistration",
                            event_time: Math.floor(Date.now() / 1000),
                            action_source: "website",
                            event_source_url: referer || "",
                            ...(eventIdFromClient ? { event_id: eventIdFromClient } : {}),
                            user_data: {
                                ...(emHashed ? { em: [emHashed] } : {}),
                                ...(phHashed ? { ph: [phHashed] } : {}),
                                ...(externalIds.length ? { external_id: externalIds } : {}),
                                ...(fbpFromClient ? { fbp: fbpFromClient } : {}),
                                ...(fbcFromClient ? { fbc: fbcFromClient } : {}),
                                client_user_agent: ua,
                                client_ip_address: clientIp
                            },
                            custom_data: {
                                value: investValue,
                                currency: "USD"
                            }
                        }
                    ]
                };

                if (testEventCode) {
                    (fbBody as any).test_event_code = testEventCode;
                }

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

        return new Response(
            JSON.stringify({
                message: "Registration successful",
                webinar_response: JSON.parse(responseText),
                ghl_contact_id: ghlContactId
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("❌ Error during registration:", error);
        return new Response(
            JSON.stringify({ error: "An error occurred during registration" }),
            { status: 500 }
        );
    }
};
