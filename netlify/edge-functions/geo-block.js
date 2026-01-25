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
  const allowedCountries = ['US'];
  
  // If we can detect the country and it's not in our allowed list, block it
  if (country && !allowedCountries.includes(country)) {
    console.log(`🌍 Geo-blocked registration attempt from: ${country}`);
    
    return new Response(
      JSON.stringify({ error: "Registration unavailable in your region" }),
      { 
        status: 403, 
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  // Country is allowed (or couldn't be detected) - let the request through
  return context.next();
};

// This edge function only runs on the webinar registration API
export const config = {
  path: "/api/webinar-registration"
};
