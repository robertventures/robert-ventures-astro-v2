import { s as supabase } from '../../chunks/supabase_Cp-Rfy68.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  const formData = await request.formData();
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
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, email, ip_address }
      }
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
    let ghlContactId = null;
    try {
      const ghlResponse = await fetch("https://rest.gohighlevel.com/v1/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImJmSGl5MU5XaXhzdHl2NUxReFNwIiwidmVyc2lvbiI6MSwiaWF0IjoxNzI2MTU2Mjg5NzE0LCJzdWIiOiJVT2dvY3laMFBJZzNCUDA0cndDZiJ9.hhl4Em5rI83tRH7bpA64qgQ_gWgd3noxEauLKKbwAuQ"}`
        },
        body: JSON.stringify({ firstName, lastName, email })
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
    if (ghlContactId) {
      const { error: updateError } = await supabase.from("profiles").update({ ghl_id: ghlContactId }).eq("id", userId);
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
        ghl_id: ghlContactId
        // ✅ Include GoHighLevel contact ID in response
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
