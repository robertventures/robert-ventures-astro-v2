// import type { APIRoute } from "astro";

// export const POST: APIRoute = async ({ request }) => {
//     const clientId = import.meta.env.WB_CLIENT_ID;
//     const apiKey = import.meta.env.WB_API_KEY;

//     if (!clientId || !apiKey) {
//         console.error("Missing WealthBlock API credentials.");
//         return new Response(
//             JSON.stringify({ error: "Server misconfiguration: Missing API credentials" }),
//             { status: 500, headers: { "Content-Type": "application/json" } }
//         );
//     }

//     try {
//         // Step 1: Parse the FormData received from the frontend
//         const formData = await request.formData();
//         const password = formData.get("password")?.toString();
//         const username = formData.get("email")?.toString();
//         const firstName = formData.get("first_name")?.toString();
//         const lastName = formData.get("last_name")?.toString();
//         const acceptTerms = true; // Always set to true

//         if (!password || !username || !lastName || !firstName) {
//             return new Response(
//                 JSON.stringify({ error: "Missing required form fields" }),
//                 { status: 400, headers: { "Content-Type": "application/json" } }
//             );
//         }

//         // Step 2: Authenticate with WealthBlock
//         const authResponse = await fetch("https://api.wealthblock.ai/platform/auth", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Client-ID": clientId,
//             },
//             body: JSON.stringify({ apiKey }),
//         });

//         const authData = await authResponse.json();
//         console.log("Response from WealthBlock authentication:", authData);

//         if (!authResponse.ok || !authData.success || !authData.data) {
//             return new Response(
//                 JSON.stringify({ error: "WealthBlock authentication failed", details: authData }),
//                 { status: 400, headers: { "Content-Type": "application/json" } }
//             );
//         }

//         const bearerToken = authData.data; // Extracted token to be used for user registration

//         // Step 3: Register the User (using the bearer token from Step 2)
//         const userRegistrationResponse = await fetch("https://api.wealthblock.ai/user/register", {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${bearerToken}`, // Using token from Step 2
//                 "Client-ID": clientId,
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 password,
//                 username,
//                 acceptTerms,
//                 lastName
//             })
//         });

//         const userRegistrationData = await userRegistrationResponse.json();
//         console.log("Response from User Registration API:", userRegistrationData);

//         if (!userRegistrationResponse.ok || !userRegistrationData.token) {
//             return new Response(
//                 JSON.stringify({ error: "Failed to register user", details: userRegistrationData }),
//                 { status: 400, headers: { "Content-Type": "application/json" } }
//             );
//         }

//         const accountBearerToken = userRegistrationData.token; // Use this token for account creation

//         // Step 4: Create an Account (using the token from Step 3)
//         const accountCreationResponse = await fetch("https://api.wealthblock.ai/account/?au=1", {
//             method: "POST",
//             headers: {
//                 "Authorization": `Bearer ${accountBearerToken}`, // Use token from Step 3
//                 "Client-ID": clientId,
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 defaultRoleType: 1,
//                 profile: {
//                     firstName,
//                     lastName,
//                     email: username
//                 }
//             })
//         });

//         const accountCreationData = await accountCreationResponse.json();
//         console.log("Response from Account Creation API:", accountCreationData);

//         if (!accountCreationResponse.ok) {
//             return new Response(
//                 JSON.stringify({ error: "Failed to create account", details: accountCreationData }),
//                 { status: 400, headers: { "Content-Type": "application/json" } }
//             );
//         }

//         // Redirect user to the external website with the token
//         return new Response(null, {
//             status: 302,
//             headers: {
//                 "Location": `https://invest.robertventures.com/home?token=${accountBearerToken}`
//             }
//         });

//     } catch (error) {
//         console.error("Error during WealthBlock authentication, user registration, and account creation:", error);
//         return new Response(
//             JSON.stringify({ error: "Internal Server Error" }),
//             { status: 500, headers: { "Content-Type": "application/json" } }
//         );
//     }
// };
