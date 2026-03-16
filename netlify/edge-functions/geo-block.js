/**
 * Netlify Edge Function: Geo-Block Webinar Registration
 *
 * Blocks webinar registration requests from countries outside the US.
 * This prevents spam registrations (commonly from Europe/Moscow timezone).
 *
 * Blocked users receive a 403 JSON response; frontend handles this gracefully
 * and does NOT fire Meta Pixel or GA4 conversion events.
 */

export default async (request, context) => {
  // Get the country code from Netlify's geo data
  const country = context.geo?.country?.code;

  // Allowed countries: US only
  const allowedCountries = ["US"];

  // If we can detect the country and it's not in our allowed list, block it
  if (country && !allowedCountries.includes(country)) {
    console.log(`🌍 Geo-blocked registration attempt from: ${country}`);

    return new Response(JSON.stringify({ error: "Registration unavailable in your region" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Pass the real client IP to the serverless function via a custom header.
  // context.ip is the visitor's actual IP — reliable because edge functions
  // run at the CDN edge before any internal routing can overwrite IP headers.
  if (context.ip) {
    request.headers.set("x-real-client-ip", context.ip);
  }

  // Country is allowed (or couldn't be detected) - let the request through
  return context.next();
};

// Routing is configured in netlify.toml (covers both /api/webinar-registration
// and /api/create-account). No inline config needed here.
