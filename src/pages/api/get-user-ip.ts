export const prerender = false;

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  try {
    // Get IP from various headers (handles different server configurations)
    // x-nf-client-connection-ip is Netlify's reliable header for the real visitor IP
    const netlifyClientIp = request.headers.get("x-nf-client-connection-ip");
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    let ip = netlifyClientIp || forwarded || realIp || cfConnectingIp || "unknown";

    // If forwarded contains multiple IPs, take the first one
    if (!netlifyClientIp && forwarded && forwarded.includes(",")) {
      ip = forwarded.split(",")[0].trim();
    }

    return new Response(JSON.stringify({ ip }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting user IP:", error);
    return new Response(JSON.stringify({ ip: "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
