import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    
    // Extract fields
    const firstName = formData.get("first_name")?.toString();
    const lastName = formData.get("last_name")?.toString();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const how_did_they_hear = formData.get("how_did_they_hear")?.toString();
    const ip_address = formData.get("ip_address")?.toString(); // Capture IP

    // Log received form data
    console.log("Received Signup Data:", {
        firstName,
        lastName,
        email,
        how_did_they_hear,
        ip_address,  // Ensure this is logged
    });

    if (!firstName || !lastName || !email || !password) {
        return new Response(
            JSON.stringify({ error: "All fields are required" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    how_did_they_hear,
                    ip_address, // Store IP
                },
            },
        });

        if (error) {
            console.error("Signup error:", error.message);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const { session, user } = data;

        return new Response(
            JSON.stringify({
                message: "Signup successful",
                user,
                session,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("Unexpected error during signup:", err);
        return new Response(
            JSON.stringify({ error: "Server error occurred" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
