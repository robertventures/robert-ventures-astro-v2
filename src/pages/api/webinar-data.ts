import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const webinarId = "684ae034de7a164da41abe10"; // Webinar ID
  const apiKey = import.meta.env.WEBINARKIT_API_KEY; // API Key from .env
  const apiUrl = `https://webinarkit.com/api/webinar/dates/${webinarId}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      redirect: "follow" as RequestRedirect,
    });

    if (!response.ok) {
      console.error("Failed to fetch webinar dates:", response.statusText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch webinar dates" }),
        { 
          status: response.status,
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" } 
        }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("An error occurred while fetching data:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred while fetching data" }),
      { 
        status: 500,
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" } 
      }
    );
  }
};