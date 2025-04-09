import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
    const ghlApiKey = import.meta.env.GHL_API_KEY;

    if (!ghlApiKey) {
        console.error("❌ Missing GoHighLevel API key.");
        return new Response(
            JSON.stringify({ error: "Server misconfiguration: Missing GoHighLevel API key" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        // Expect JSON body instead of FormData
        const body = await request.json();
        const { email, timeZone, ipAddress, utmCampaign } = body;

        if (!email || !timeZone) {
            console.error("❌ Missing required fields");
            return new Response(
                JSON.stringify({ error: "Email and TimeZone are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("📩 Received Signup Data:", { email, timeZone, ipAddress });

        /** ───────────────────────────────
         * ✅ Create a Contact in GoHighLevel
         * ─────────────────────────────── */
        const ghlResponse = await fetch("https://rest.gohighlevel.com/v1/contacts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ghlApiKey}`,
            },
            body: JSON.stringify({
                email,
                timezone: timeZone,
                customField: {
                    "userip": ipAddress || "123"
                },
                tags: ["bonds", "home page"],
                source: utmCampaign
            }),
        });

        const ghlData = await ghlResponse.json();
        console.log("📩 GHL Contact Creation Response:", JSON.stringify(ghlData, null, 2));

        const ghlContactId = ghlData?.contact?.id || null;

        if (!ghlResponse.ok || !ghlContactId) {
            console.error("❌ Failed to create GoHighLevel contact:", ghlData);
            return new Response(
                JSON.stringify({ error: ghlData?.email?.message || "Failed to create GoHighLevel contact" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("✅ GoHighLevel Contact ID Created:", ghlContactId);

        /** ───────────────────────────────
         * ✅ Return GHL Contact ID to Frontend
         * ─────────────────────────────── */
        return new Response(
            JSON.stringify({
                message: "Signup successful",
                ghl_contact_id: ghlContactId
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("❌ Unexpected error during signup:", err);
        return new Response(
            JSON.stringify({ error: "Server error occurred", details: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};