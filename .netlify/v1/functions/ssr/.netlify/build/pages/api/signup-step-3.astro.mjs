import { s as supabase } from '../../chunks/supabase_BP3y35C4.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  const formData = await request.formData();
  const phoneNumber = formData.get("phone_number")?.toString();
  const ghlContactId = formData.get("ghl_contact_id")?.toString();
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
  const phoneRegex = /^\+?1?\d{10}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return new Response(
      JSON.stringify({ error: "Invalid phone number format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    console.log("Updating GoHighLevel contact with ID:", ghlContactId);
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.session?.user?.id) {
      console.error("Error fetching user session:", sessionError);
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const userId = session.session.user.id;
    console.log("Authenticated Supabase User ID:", userId);
    const ghlGetResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${ghlContactId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImJmSGl5MU5XaXhzdHl2NUxReFNwIiwidmVyc2lvbiI6MSwiaWF0IjoxNzI2MTU2Mjg5NzE0LCJzdWIiOiJVT2dvY3laMFBJZzNCUDA0cndDZiJ9.hhl4Em5rI83tRH7bpA64qgQ_gWgd3noxEauLKKbwAuQ"}`,
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
    const ghlUpdateResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${ghlContactId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImJmSGl5MU5XaXhzdHl2NUxReFNwIiwidmVyc2lvbiI6MSwiaWF0IjoxNzI2MTU2Mjg5NzE0LCJzdWIiOiJVT2dvY3laMFBJZzNCUDA0cndDZiJ9.hhl4Em5rI83tRH7bpA64qgQ_gWgd3noxEauLKKbwAuQ"}`
      },
      body: JSON.stringify({
        email: userEmail,
        // ✅ Including email prevents duplicate issues
        phone: phoneNumber
      })
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
    const { data, error } = await supabase.from("profiles").update({
      phone_number: phoneNumber
    }).eq("id", userId);
    if (error) {
      console.error("Error updating Supabase profile:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
