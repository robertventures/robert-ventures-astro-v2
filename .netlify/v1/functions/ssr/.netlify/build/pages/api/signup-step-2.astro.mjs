export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  const formData = await request.formData();
  const portfolioValue = formData.get("portfolio_value")?.toString();
  const investmentUrgency = formData.get("investment_urgency")?.toString();
  const ghlContactId = formData.get("ghl_contact_id")?.toString();
  if (!ghlContactId) {
    return new Response(
      JSON.stringify({ error: "GoHighLevel Contact ID is missing" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!portfolioValue || !investmentUrgency) {
    return new Response(
      JSON.stringify({ error: "All fields are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const customFields = {
    "portfolio_value": portfolioValue,
    "investment_urgency": investmentUrgency
  };
  try {
    console.log("Updating GoHighLevel contact with ID:", ghlContactId);
    const requestBody = {
      customField: customFields
      // ✅ Sends custom fields as an object
    };
    console.log("Sending request body to GoHighLevel:", JSON.stringify(requestBody, null, 2));
    const ghlResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${ghlContactId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6ImJmSGl5MU5XaXhzdHl2NUxReFNwIiwidmVyc2lvbiI6MSwiaWF0IjoxNzI2MTU2Mjg5NzE0LCJzdWIiOiJVT2dvY3laMFBJZzNCUDA0cndDZiJ9.hhl4Em5rI83tRH7bpA64qgQ_gWgd3noxEauLKKbwAuQ"}`
      },
      body: JSON.stringify(requestBody)
    });
    const ghlResult = await ghlResponse.json();
    if (!ghlResponse.ok) {
      console.error("Error updating GoHighLevel contact:", ghlResult);
      return new Response(
        JSON.stringify({ error: "Failed to update GoHighLevel contact" }),
        { status: ghlResponse.status, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("GoHighLevel Contact Updated:", JSON.stringify(ghlResult, null, 2));
    return new Response(
      JSON.stringify({
        message: "GoHighLevel Contact updated successfully",
        ghl_response: ghlResult
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
