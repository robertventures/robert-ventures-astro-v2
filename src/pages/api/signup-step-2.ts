import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const portfolioValue = formData.get("portfolio_value")?.toString();
  const age = formData.get("age")?.toString();
  const zipcode = formData.get("zipcode")?.toString();
  const investmentUrgency = formData.get("investment_urgency")?.toString();
  const investmentObjective = formData.get("investment_objective")?.toString();

  if (!portfolioValue || !age || !zipcode || !investmentUrgency || !investmentObjective) {
    return new Response(
      JSON.stringify({ error: "All fields are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch the session
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  console.log("Session:", session);
  console.error("Session error:", sessionError);

  if (sessionError || !session?.session) {
    return new Response(
      JSON.stringify({ error: "User not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userId = session.session.user.id;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        portfolio_value: portfolioValue,
        age: parseInt(age, 10),
        zipcode,
        investment_urgency: investmentUrgency,
        investment_objective: investmentObjective,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Profile updated successfully",
        data,
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
