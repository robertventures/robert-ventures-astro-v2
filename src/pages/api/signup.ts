import type { APIRoute } from "astro";

export const prerender = false; // Ensure this route is server-rendered

export const POST: APIRoute = async ({ request }) => {
    const ghlApiKey = import.meta.env.GHL_API_KEY;
    const makeSignupWebhook = import.meta.env.MAKE_SIGNUP_WEBHOOK;

    if (!ghlApiKey || !makeSignupWebhook) {
        console.error("❌ Missing API credentials.");
        return new Response(
            JSON.stringify({ error: "Server misconfiguration: Missing API credentials" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        // Expect JSON body instead of FormData
        const body = await request.json();
        const { first_name, last_name, email, phone_number, ip_address } = body;

        if (!first_name || !last_name || !email || !phone_number) {
            console.error("❌ Missing required fields");
            return new Response(
                JSON.stringify({ error: "All fields are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("📩 Received Signup Data:", { first_name, last_name, email, phone_number, ip_address });

        /** ───────────────────────────────
         * ✅ Step 4: Create a Contact in GoHighLevel
         * ─────────────────────────────── */
        let ghlContactId = null;
        try {
            const ghlResponse = await fetch("https://rest.gohighlevel.com/v1/contacts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ghlApiKey}`,
                },
                body: JSON.stringify({ firstName: first_name, lastName: last_name, phone: phone_number, email }),
            });

            const ghlData = await ghlResponse.json();
            console.log("📩 GHL Contact Creation Response:", JSON.stringify(ghlData, null, 2));

            ghlContactId = ghlData?.contact?.id || null;

            if (!ghlResponse.ok || !ghlContactId) {
                console.warn("⚠️ Failed to create GoHighLevel contact:", ghlData);
            } else {
                console.log("✅ GoHighLevel Contact ID Created:", ghlContactId);
            }

            // Call the webhook with the contact details
            await fetch(makeSignupWebhook, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ firstName: first_name, lastName: last_name, email }),
            });
            console.log("✅ Webhook called successfully");
        } catch (error) {
            console.error("❌ Error calling GoHighLevel API or webhook:", error);
        }

        /** ───────────────────────────────
         * ✅ Return Success Response
         * ─────────────────────────────── */
        return new Response(
            JSON.stringify({
                message: "Signup successful",
                ghl_contact_id: ghlContactId || null, // Return the GHL Contact ID or null
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
