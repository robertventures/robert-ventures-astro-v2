export const prerender = false;

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    const apiKey = import.meta.env.WEBINARKIT_API_KEY;
    const ghlApiKey = import.meta.env.GHL_API_KEY;

    try {
        const body = await request.json();

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
                        firstName: body.first_name,
                        lastName: body.last_name,
                        phone: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
                        email: body.email,
                        customField: {
                            invest_intent: body.invest_intent
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
            firstName: body.first_name,
            lastName: body.last_name,
            phoneNumberCountryCode: "+1",
            phoneNumber: body.phone_number.replace(/\D/g, "").replace(/^1/, ""),
            customField1: body.invest_intent,
            date: body.date
        });

        const webinarId = "684ae034de7a164da41abe10";
        const apiUrl = `https://webinarkit.com/api/webinar/registration/${webinarId}`;

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        const response = await fetch(apiUrl, requestOptions);
        const responseText = await response.text();

        if (!response.ok) {
            console.error("Webinar registration failed:", responseText);
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
        console.error("Error during registration:", error);
        return new Response(
            JSON.stringify({ error: "An error occurred during registration" }),
            { status: 500 }
        );
    }
};
