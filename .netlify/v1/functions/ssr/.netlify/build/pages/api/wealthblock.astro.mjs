export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  const clientId = "d0IzeElybTVYUXk1V3kyNTk1";
  const apiKey = "rfjrH4tf/5yXPKeO3gA2NuoKodA2ioaZh+viIVmFXWw";
  try {
    const formData = await request.formData();
    const password = formData.get("password")?.toString();
    const username = formData.get("email")?.toString();
    const firstName = formData.get("first_name")?.toString();
    const lastName = formData.get("last_name")?.toString();
    const acceptTerms = true;
    if (!password || !username || !lastName || !firstName) {
      return new Response(
        JSON.stringify({ error: "Missing required form fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const authResponse = await fetch("https://api.wealthblock.ai/platform/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-ID": clientId
      },
      body: JSON.stringify({ apiKey })
    });
    const authData = await authResponse.json();
    console.log("Response from WealthBlock authentication:", authData);
    if (!authResponse.ok || !authData.success || !authData.data) {
      return new Response(
        JSON.stringify({ error: "WealthBlock authentication failed", details: authData }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const bearerToken = authData.data;
    const userRegistrationResponse = await fetch("https://api.wealthblock.ai/user/register", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${bearerToken}`,
        // Using token from Step 2
        "Client-ID": clientId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password,
        username,
        acceptTerms,
        lastName
      })
    });
    const userRegistrationData = await userRegistrationResponse.json();
    console.log("Response from User Registration API:", userRegistrationData);
    if (!userRegistrationResponse.ok || !userRegistrationData.token) {
      return new Response(
        JSON.stringify({ error: "Failed to register user", details: userRegistrationData }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const accountBearerToken = userRegistrationData.token;
    const accountCreationResponse = await fetch("https://api.wealthblock.ai/account/?au=1", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accountBearerToken}`,
        // Use token from Step 3
        "Client-ID": clientId,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        defaultRoleType: 1,
        profile: {
          firstName,
          lastName,
          email: username
        }
      })
    });
    const accountCreationData = await accountCreationResponse.json();
    console.log("Response from Account Creation API:", accountCreationData);
    if (!accountCreationResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to create account", details: accountCreationData }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(null, {
      status: 302,
      headers: {
        "Location": `https://invest.robertventures.com/home?token=${accountBearerToken}`
      }
    });
  } catch (error) {
    console.error("Error during WealthBlock authentication, user registration, and account creation:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
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
