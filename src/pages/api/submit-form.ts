// src/pages/api/submit-form.js
import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();

  if (!email) {
    return new Response("Email is required", { status: 400 });
  }

  try {
    // Insert the email into the 'contact_forms' table
    const { data, error } = await supabase
      .from("contact_forms")
      .insert([{ email }]) // Replace 'email' with your actual column name in the table

    if (error) {
      console.error("Error inserting data:", error);
      return new Response("Failed to store email", { status: 500 });
    }

    return new Response(JSON.stringify({ message: "Email stored successfully a", data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response("Server error", { status: 500 });
  }
};
