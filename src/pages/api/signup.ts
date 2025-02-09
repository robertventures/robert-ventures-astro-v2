import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    
    // Extract fields
    const firstName = formData.get("first_name")?.toString();
    const lastName = formData.get("last_name")?.toString();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const ip_address = formData.get("ip_address")?.toString();

    console.log("📩 Received Signup Data:", { firstName, lastName, email, ip_address });

    if (!firstName || !lastName || !email || !password) {
        console.error("❌ Missing required fields");
        return new Response(
            JSON.stringify({ error: "All fields are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        // Step 1: Sign up user in Supabase
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { first_name: firstName, last_name: lastName, email, ip_address },
            },
        });

        console.log("🔍 Supabase Response:", signupData, signupError);

        if (signupError) {
            console.error("❌ Signup error:", signupError.message);
            return new Response(
                JSON.stringify({ error: signupError.message }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const userId = signupData?.user?.id;
        if (!userId) {
            console.error("❌ Failed to retrieve user ID");
            return new Response(
                JSON.stringify({ error: "Failed to retrieve user ID" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("✅ User successfully created in Supabase:", userId);

        // Step 2: Call GoHighLevel API to create a contact
        let ghlContactId = null;
        try {
            const ghlResponse = await fetch("https://rest.gohighlevel.com/v1/contacts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${import.meta.env.GHL_API_KEY}`,
                },
                body: JSON.stringify({ firstName, lastName, email }),
            });

            const ghlRawResponse = await ghlResponse.text();
            console.log("📩 Raw response from GoHighLevel:", ghlRawResponse);

            let ghlData;
            try {
                ghlData = JSON.parse(ghlRawResponse);
                ghlContactId = ghlData?.contact?.id || null;
            } catch (parseError) {
                console.error("❌ Failed to parse GoHighLevel response:", parseError);
            }

            if (!ghlResponse.ok) {
                console.error("❌ GoHighLevel API Error:", ghlData);
            }
        } catch (ghlError) {
            console.error("❌ Error calling GoHighLevel API:", ghlError);
        }

        // Step 3: Store GoHighLevel Contact ID in Supabase
        if (ghlContactId) {
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ ghl_id: ghlContactId })
                .eq("id", userId);

            if (updateError) {
                console.error("❌ Error updating Supabase profile with GHL ID:", updateError);
            } else {
                console.log("✅ Successfully updated user profile with GHL Contact ID:", ghlContactId);
            }
        }

        return new Response(
            JSON.stringify({
                message: "Signup successful",
                user: signupData.user,
                session: signupData.session,
                ghl_id: ghlContactId, // ✅ Include GoHighLevel contact ID in response
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("❌ Unexpected error during signup:", err);
        return new Response(
            JSON.stringify({ error: "Server error occurred" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
