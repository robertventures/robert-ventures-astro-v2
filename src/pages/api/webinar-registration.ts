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
                const ghlRes = await fetch("https://rest.gohighlevel.com/v1/contacts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${ghlApiKey}`,
                    },
                    body: JSON.stringify({
                        name: body.name,
                        phone: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
                        email: body.email,
                        source: body.utm_campaign || "Webinar",
                        timezone: body.user_timezone || "America/New_York",
                        customField: {
                            invest_intent: body.invest_intent,
                            webinar_sign_up_date: body.webinar_sign_up_date,
                            userip: body.user_ip || "unknown"
                            // Do NOT include webinar_test or webinar_variant here
                        }
                    }),
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
            customFields: {
                webinar_test: webinarTest,
                webinar_variant: webinarVariant
            }
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
