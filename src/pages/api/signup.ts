import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
    const clientId = import.meta.env.WB_CLIENT_ID;
    const apiKey = import.meta.env.WB_API_KEY;
    const ghlApiKey = import.meta.env.GHL_API_KEY;

    if (!clientId || !apiKey || !ghlApiKey) {
        console.error("❌ Missing API credentials.");
        return new Response(
            JSON.stringify({ error: "Server misconfiguration: Missing API credentials" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        // Expect JSON body instead of FormData
        const body = await request.json();
        const { first_name, last_name, email, password, ip_address } = body;

        if (!first_name || !last_name || !email || !password) {
            console.error("❌ Missing required fields");
            return new Response(
                JSON.stringify({ error: "All fields are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("📩 Received Signup Data:", { first_name, last_name, email, ip_address });

        /** ───────────────────────────────
         * ✅ Step 1: Authenticate with WealthBlock
         * ─────────────────────────────── */
        const authResponse = await fetch("https://api.wealthblock.ai/platform/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Client-ID": clientId,
            },
            body: JSON.stringify({ apiKey }),
        });

        const authData = await authResponse.json();
        if (!authResponse.ok || !authData.success || !authData.data) {
            console.error("❌ WealthBlock authentication failed:", authData);
            return new Response(
                JSON.stringify({ error: "WealthBlock authentication failed", details: authData.message || authData }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const bearerToken = authData.data;

        /** ───────────────────────────────
         * ✅ Step 2: Register the User in WealthBlock
         * ─────────────────────────────── */
        const userRegistrationResponse = await fetch("https://api.wealthblock.ai/user/register", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${bearerToken}`,
                "Client-ID": clientId,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password,
                username: email,
                acceptTerms: true,
                lastName: last_name
            })
        });

        const userRegistrationData = await userRegistrationResponse.json();
        if (!userRegistrationResponse.ok || !userRegistrationData.token) {
            console.error("❌ WealthBlock user registration failed:", userRegistrationData);
            return new Response(
                JSON.stringify({ error: userRegistrationData.error || "Failed to register user in WealthBlock" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const accountBearerToken = userRegistrationData.token;

        /** ───────────────────────────────
         * ✅ Step 3: Create an Account in WealthBlock
         * ─────────────────────────────── */
        const accountCreationResponse = await fetch("https://api.wealthblock.ai/account/?au=1", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accountBearerToken}`,
                "Client-ID": clientId,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                defaultRoleType: 1,
                profile: {
                    firstName: first_name,
                    lastName: last_name,
                    email
                }
            })
        });

        const accountCreationData = await accountCreationResponse.json();
        if (!accountCreationResponse.ok) {
            console.error("❌ WealthBlock account creation failed:", accountCreationData);
            return new Response(
                JSON.stringify({ error: "Failed to create WealthBlock account", details: accountCreationData.message || accountCreationData }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

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
                body: JSON.stringify({ firstName: first_name, lastName: last_name, email }),
            });

            const ghlData = await ghlResponse.json();
            ghlContactId = ghlData?.contact?.id || null;

            if (!ghlResponse.ok || !ghlContactId) {
                console.warn("⚠️ Failed to create GoHighLevel contact:", ghlData);
            }
        } catch (error) {
            console.error("❌ Error calling GoHighLevel API:", error);
        }

        /** ───────────────────────────────
         * ✅ Step 5: Register User in Supabase
         * ─────────────────────────────── */
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { first_name, last_name, email, ip_address },
            },
        });

        if (signupError) {
            console.error("❌ Supabase signup error:", signupError.message);
            return new Response(
                JSON.stringify({ error: signupError.message }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const userId = signupData?.user?.id;
        if (!userId) {
            return new Response(
                JSON.stringify({ error: "Failed to retrieve user ID from Supabase" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        /** ───────────────────────────────
         * ✅ Step 6: Store GoHighLevel Contact ID in Supabase
         * ─────────────────────────────── */
        if (ghlContactId) {
            await supabase.from("profiles").update({ ghl_id: ghlContactId }).eq("id", userId);
        }

        return new Response(
            JSON.stringify({ message: "Signup successful", user: signupData.user, ghl_id: ghlContactId }),
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
