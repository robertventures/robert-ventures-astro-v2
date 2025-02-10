import { s as supabase } from '../../chunks/supabase_Cp-Rfy68.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  if (!email) {
    return new Response("Email is required", { status: 400 });
  }
  try {
    const { data, error } = await supabase.from("contact_forms").insert([{ email }]);
    if (error) {
      console.error("Error inserting data:", error);
      return new Response("Failed to store email", { status: 500 });
    }
    return new Response(JSON.stringify({ message: "Email stored successfully a", data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response("Server error", { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
