export const prerender = false;

import type { APIRoute } from "astro";

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
        const webinarTest = body.webinar_test || 'unknown';
        const webinarVariant = body.webinar_variant || 'unknown';
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
                // Only forward the main UTM fields if present
                let customField = {
                    invest_intent: body.invest_intent,
                    webinar_sign_up_date: body.webinar_sign_up_date,
                    webinar_signup_date: currentDate,
                    userip: body.user_ip || "unknown",
                    webinar_ab_test_variant: body.webinar_variant || "unknown",
                    device_type: body.device_type || "unknown"
                };
                if (body.utm && typeof body.utm === 'object') {
                    const allowedUtms = [
                        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'
                    ];
                    for (const key of allowedUtms) {
                        if (body.utm[key]) {
                            customField[key] = body.utm[key];
                        }
                    }
                }
                const ghlPayload = {
                    name: body.name,
                    phone: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
                    email: body.email,
                    source: body.utm_campaign || "Webinar",
                    timezone: body.user_timezone || "America/New_York",
                    customField
                };
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
