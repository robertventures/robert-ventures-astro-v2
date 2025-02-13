import { s as supabase } from '../../chunks/supabase_Cp-Rfy68.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  const clientId = "d0IzeElybTVYUXk1V3kyNTk1";
  const apiKey = "rfjrH4tf/5yXPKeO3gA2NuoKodA2ioaZh+viIVmFXWw";
  const ghlApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImJmSGl5MU5XaXhzdHl2NUxReFNwIiwidmVyc2lvbiI6MSwiaWF0IjoxNzI2MTU2Mjg5NzE0LCJzdWIiOiJVT2dvY3laMFBJZzNCUDA0cndDZiJ9.hhl4Em5rI83tRH7bpA64qgQ_gWgd3noxEauLKKbwAuQ";
  try {
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
    const authResponse = await fetch("https://api.wealthblock.ai/platform/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-ID": clientId
      },
      body: JSON.stringify({ apiKey })
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
    let ghlContactId = null;
    try {
      const ghlResponse = await fetch("https://rest.gohighlevel.com/v1/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ghlApiKey}`
        },
        body: JSON.stringify({ firstName: first_name, lastName: last_name, email })
      });
      const ghlData = await ghlResponse.json();
      ghlContactId = ghlData?.contact?.id || null;
      if (!ghlResponse.ok || !ghlContactId) {
        console.warn("⚠️ Failed to create GoHighLevel contact:", ghlData);
      }
    } catch (error) {
      console.error("❌ Error calling GoHighLevel API:", error);
    }
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name, email, ip_address }
      }
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
