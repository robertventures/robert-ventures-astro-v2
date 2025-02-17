import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const phoneNumber = formData.get("phone_number")?.toString();
    const ghlContactId = formData.get("ghl_contact_id")?.toString();
    const email = formData.get("email")?.toString(); // Retrieve the email from form data
    const makeStep3Webhook = import.meta.env.MAKE_STEP3_WEBHOOK;

    if (!phoneNumber) {
        return new Response(
            JSON.stringify({ error: "Phone number is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (!ghlContactId) {
        return new Response(
            JSON.stringify({ error: "GoHighLevel Contact ID is missing" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (!email) {
        return new Response(
            JSON.stringify({ error: "Email is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // ✅ Validate phone number format (US format)
    const phoneRegex = /^\+?1?\d{10}$/; // Matches US numbers (with or without country code)
    if (!phoneRegex.test(phoneNumber)) {
        return new Response(
            JSON.stringify({ error: "Invalid phone number format" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        console.log("Updating GoHighLevel contact with ID:", ghlContactId);

        // ✅ Step 1: Fetch the authenticated user's UUID from Supabase
        const { data: session, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.session?.user?.id) {
            console.error("Error fetching user session:", sessionError);
            return new Response(
                JSON.stringify({ error: "User not authenticated" }),
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const userId = session.session.user.id; // ✅ This is the correct UUID for Supabase
        console.log("Authenticated Supabase User ID:", userId);

        // ✅ Step 2: Fetch the user's email from GoHighLevel (needed to avoid duplicate issues)
        const ghlGetResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${ghlContactId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${import.meta.env.GHL_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        const ghlGetData = await ghlGetResponse.json();

        if (!ghlGetResponse.ok || !ghlGetData?.contact?.email) {
            console.error("Error fetching GoHighLevel contact details:", ghlGetData);
            return new Response(
                JSON.stringify({ error: "Failed to retrieve contact details from GoHighLevel" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const userEmail = ghlGetData.contact.email;
        console.log("Fetched Email from GoHighLevel:", userEmail);

        // ✅ Step 3: Update GoHighLevel with the phone number AND email
        const ghlUpdateResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${ghlContactId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.GHL_API_KEY}`,
            },
            body: JSON.stringify({
                email: userEmail, // ✅ Including email prevents duplicate issues
                phone: phoneNumber
            }),
        });

        const ghlUpdateResult = await ghlUpdateResponse.json();

        if (!ghlUpdateResponse.ok) {
            console.error("Error updating GoHighLevel contact:", ghlUpdateResult);
            return new Response(
                JSON.stringify({ error: "Failed to update GoHighLevel contact" }),
                { status: ghlUpdateResponse.status, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("GoHighLevel Contact Updated with Phone:", JSON.stringify(ghlUpdateResult, null, 2));

        // ✅ Step 4: Update Supabase Profile with Phone Number
        const { data, error } = await supabase
            .from("profiles")
            .update({
                phone_number: phoneNumber
            })
            .eq("id", userId); // ✅ Use the correct Supabase UUID, NOT ghl_contact_id

        if (error) {
            console.error("Error updating Supabase profile:", error.message);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // ✅ Step 5: Call the webhook with the email and phone number
        const webhookResponse = await fetch(makeStep3Webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, phone_number: phoneNumber }),
        });

        if (!webhookResponse.ok) {
            console.error("Error calling webhook:", await webhookResponse.text());
            return new Response(
                JSON.stringify({ error: "Failed to call webhook" }),
                { status: webhookResponse.status, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                message: "Profile updated successfully",
                ghl_response: ghlUpdateResult,
                supabase_response: data
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Unexpected server error:", err);
        return new Response(
            JSON.stringify({ error: "Server error occurred" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
