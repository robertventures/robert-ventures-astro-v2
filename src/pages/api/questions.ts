import type { APIRoute } from "astro";

export const prerender = false; // Ensure this route is server-rendered

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const alternativeAssets = formData.get("alternative_assets")?.toString();
    const primaryObjective = formData.get("primary_investment_objective")?.toString();
    const ghlContactId = formData.get("ghl_contact_id")?.toString();
    const webinarSignUpDate = formData.get("webinar_sign_up_date")?.toString();


    if (!ghlContactId) {
        return new Response(
            JSON.stringify({ error: "GoHighLevel Contact ID is missing" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (!primaryObjective || !alternativeAssets) {
        return new Response(
            JSON.stringify({ error: "Please provide whether you've invested in alternative assets and your primary investment objective" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // ✅ These are the unique field keys from your GoHighLevel system.
    const customFields: Record<string, string> = {
        "alternative_assets": alternativeAssets,
        "primary_investment_objective": primaryObjective
    };

    // Add webinar sign-up date if available
    if (webinarSignUpDate) {
        customFields["webinar_sign_up_date"] = webinarSignUpDate;
    }



    try {
        console.log("Updating GoHighLevel contact with ID:", ghlContactId);

        const requestBody = {
            customField: customFields // ✅ Sends custom fields as an object
        };

        console.log("Sending request body to GoHighLevel:", JSON.stringify(requestBody, null, 2));

        const ghlResponse = await fetch(`https://rest.gohighlevel.com/v1/contacts/${ghlContactId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.GHL_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
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
                ghl_response: ghlResult,
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
