import { s as supabase } from '../../chunks/supabase_Cp-Rfy68.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  const formData = await request.formData();
  const date = formData.get("date")?.toString();
  const time = formData.get("time")?.toString();
  if (!date || !time) {
    return new Response(
      JSON.stringify({ error: "Both date and time are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const dateTime = /* @__PURE__ */ new Date(`${date}T${time}:00`);
  if (isNaN(dateTime.getTime())) {
    return new Response(
      JSON.stringify({ error: "Invalid date or time format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const now = /* @__PURE__ */ new Date();
  const oneWeekFromNow = /* @__PURE__ */ new Date();
  oneWeekFromNow.setDate(now.getDate() + 7);
  if (dateTime < now || dateTime > oneWeekFromNow) {
    return new Response(
      JSON.stringify({ error: "Date must be within one week from today" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const hours = dateTime.getHours();
  if (hours < 8 || hours > 16) {
    return new Response(
      JSON.stringify({ error: "Time must be between 8:00 AM and 4:00 PM" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.session) {
    return new Response(
      JSON.stringify({ error: "User not authenticated" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  const userId = session.session.user.id;
  try {
    const { data, error } = await supabase.from("profiles").update({
      call_date: dateTime.toISOString()
    }).eq("id", userId);
    if (error) {
      console.error("Error updating call date:", error.message);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        message: "Call date and time successfully saved",
        data
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
